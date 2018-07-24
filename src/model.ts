import * as _ from 'lodash';
import chalk from 'chalk';


export enum GameStates {
  WaitingToStart,  // when application is loaded
  PlayerChance,   // When wiating for users chance
  DisplayChanceResult,  // Displaying results of player chance
  InvalidInput  // when user givesn invalid input
}

export interface Position {
  X: number;
  Y: number;
}

export enum BoardMarker {
  ship = 'S',
  hit = '*',
  miss = '-'
}

export enum Orientation {
  X = "xAxis",
  Y = "yAxis"
}

export const shipType = {
  carrier: 5,
  battleship: 4,
  cruiser: 3,
  submarine: 3,
  destroyer: 2
};

export interface ShipCoordinate {
  X: number;
  Y: number;
  hit: boolean;
}

export class Ship {
  type: number;
  name: string;
  location: ShipCoordinate[];
  sunk = false;
  constructor(type: number, name?: string) {
    this.type = type;
    this.name = name;
  }
  get sybmol() {
    let s;
    switch (this.name) {
      case 'carrier':
        s = 'V'; break;
      case 'battleship':
        s = 'W'; break;
      case 'cruiser':
        s = 'X'; break;
      case 'submarine':
        s = 'Y'; break;
      case 'destroyer':
        s = 'Z'; break;
    }
    return s;
  }

  isSunked() {
    let nonBomedSpot = _.find(this.location, (co: ShipCoordinate) => {
      return !co.hit;
    });
    // if empty means all spots are bombed.
    return _.isEmpty(nonBomedSpot);
  }

  checkNMarkHit(position: Position) {
    let isHit = false;
    _.takeWhile(this.location, (co: ShipCoordinate) => {
      isHit = co.X === position.X && co.Y === position.Y;
      if (isHit) {
        co.hit = true;
      }
      return !isHit;
    });
    return isHit;
  }

  setLocation(position: Position, orientation: Orientation) {
    this.location = [{ X: position.X, Y: position.Y, hit: false }];
    let len = 1;
    while (len <= this.type) {
      if (orientation === Orientation.X) {
        this.location.push({ X: position.X + len, Y: position.Y, hit: false });
      } else {
        this.location.push({ X: position.X, Y: position.Y + len, hit: false });
      }
      len++;
    }
  }
}


export class Board {
  grid: any;
  player?: Player;
  constructor() {
    this.resetGird();
  }

  public resetGird() {
    const board = [];
    let i = 10;
    while (i > 0) {
      let j = 10;
      const row = [];
      while (j > 0) {
        row.push('0');
        j--;
      }
      board.push(row);
      i--;
    }

    this.grid = board;
  }

  fillBoard() {
    const occupiedPostions = _.flatMap(this.player.ships, (ship: Ship) => {
      _.each(ship.location, (position: Position) => {
        this.grid[position.X][position.Y] = BoardMarker.ship;
      });
    });

  }

  private fillColor(val) {
    switch (val) {
      case '*':
        val = chalk.bgRed(val);
        break;
      case 'S':
        val = chalk.bgGreen(val);
        break;
      case '-':
        val = chalk.bgYellow(val);
        break;
    }
    return val;
  }

  /** Prints grid on console */
  render() {
    let grid = _.cloneDeep(this.grid);
    let output = "";
    const xIndex = _.map(_.range(10), i => i.toString());
    xIndex.splice(0, 0, ' |');
    output = _.reduce(xIndex, (accum, i) => {
      accum = accum + i;
      return accum;
    }, output);
    output = output + "\n";
    output = output + "------------\n";
    _.each(grid, (row, index) => {
      row.splice(0, 0, `${index}|`);
      _.each(row, col => {
        output = output + this.fillColor(col);
      });
      output = output + "\n";
    });
    return output;
  }

  bombAship(position) {
    _.takeWhile(this.player.ships, (ship: Ship) => {
      let isHit = ship.checkNMarkHit(position);
      if (isHit) {
        if (ship.isSunked()) {
          ship.sunk = true;
          console.log(chalk.bgCyan('Sunk'));
        } else {
          console.log(chalk.bgMagenta("Hit"));
        }
      }
      return !isHit;
    });
  }

  /** Called when a other player launch a bomb */
  hitOnBoard(position: Position) {
    if (this.grid[position.X][position.Y] === BoardMarker.ship) {
      this.grid[position.X][position.Y] = BoardMarker.hit;
      this.bombAship(position);
    } else if (this.grid[position.X][position.Y] === BoardMarker.hit ||
      this.grid[position.X][position.Y] === BoardMarker.miss
    ) {
      console.log("Already Taken");
    } else {
      this.grid[position.X][position.Y] = BoardMarker.miss;
      console.log(chalk.bgYellow("Miss"));
    }
  }

  /** Checks if the given position is already hitted */
  isAlreadyTaken(position: Position) {
    if (this.grid[position.X][position.Y] === BoardMarker.hit ||
      this.grid[position.X][position.Y] === BoardMarker.miss) {
      return true;
    } else {
      return false;
    }

  }
}


export class Player {
  name: number;
  ships: Ship[];
  board: Board;

  constructor(name: number) {
    this.name = name;
    this.ships = [
      new Ship(shipType.carrier, "carrier"),
      new Ship(shipType.battleship, "battleship"),
      new Ship(shipType.cruiser, "cruiser"),
      new Ship(shipType.submarine, "submarine"),
      new Ship(shipType.destroyer, "destroyer"),
    ];
  }

  /**
   * Setup players board
   */
  public initialize() {
    this.board = new Board();
    this.board.player = this;
    this.positionShips();
  }

  public allSunk() {
    return _.reduce(this.ships, (accum, ship: Ship) => {
      accum = accum && ship.sunk;
      return accum;
    }, true);

  }

  /**
   * Sets the initial position of ships for given player
   */
  private positionShips() {
    _.each(this.ships, ship => {
      const location = this.getNewLocation(ship);
      ship.location = location;
    });
    this.board.fillBoard();
  }

  /**
   * Finds and returns the location on board where ship can be placed
   */
  private getNewLocation(ship: Ship) {
    let location;
    while (true) {
      const o = [Orientation.X, Orientation.Y][_.random(0, 1)];
      const range = 9 - ship.type;
      const startPosition = {
        X: _.random(0, o === Orientation.X ? range : 9),
        Y: _.random(0, o === Orientation.X ? range : 9)
      };

      location = this.getLocation(startPosition, o, ship.type);
      if (this.insideBoard(location) && this.islocationEmpty(location)) {
        break;
      }
    }
    return location;
  }

  /**
   * Gets a random location on the board
   */
  private getLocation(position, orientation, shipSize) {
    const location = [position];
    let len = 1;
    while (len < shipSize) {
      if (orientation === Orientation.X) {
        location.push({ X: position.X + len, Y: position.Y });
      } else {
        location.push({ X: position.X, Y: position.Y + len });
      }
      len++;
    }
    return location;
  }

  private insideBoard(location: Position[]) {
    const first = _.first(location);
    const isFirstValid = first.X >= 0 && first.X <= 9 && first.Y >= 0 && first.Y <= 9;
    const last = _.last(location);
    const islastValid = last.X >= 0 && last.X <= 9 && last.Y >= 0 && last.Y <= 9;
    return isFirstValid && islastValid;
  }


  /**
   * Checks if location is available to place ship.
   * none of co-ordinates should be occupied by other ship
   */
  private islocationEmpty(location: Position[]) {
    let occupiedPositions = _.flatMap(this.ships, (ship: Ship) => {
      return ship.location;
    });
    occupiedPositions = _.filter(occupiedPositions, item => !_.isEmpty(item));
    const foundPosition = _.find(occupiedPositions, co => {
      const matchedPosition = _.find(location, position => {
        return co.X === position.X && co.Y === position.Y;
      });
      return !_.isEmpty(matchedPosition);
    });
    return _.isEmpty(foundPosition);
  }
}