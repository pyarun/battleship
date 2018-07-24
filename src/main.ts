
import * as _ from 'lodash';
import { Position, Player, Orientation, Ship, Board, GameStates } from './model';
import { playerScreen } from './tmpls';
import chalk from 'chalk';
import * as config from './config';


class Game {
  state: GameStates;
  players: {
    a: Player,
    b: Player
  };
  input: any;
  currentPlayer: Player;
  constructor() {
    this.players = {
      a: new Player(1),
      b: new Player(2)
    };
  }

  loadGame() {
    this.players.a.initialize();
    this.players.b.initialize();
    this.currentPlayer = this.players.b;
  }

  /**
   * checks if the input is in given format. i.e [1,1]
   */
  validateUserInput(input) {
    let valid = false;
    if (_.isArray(input) && input.length === 2) {
      let invalidInput = _.find(input, item => {
        return !_.inRange(item, 0, 10);
      });
      valid = _.isUndefined(invalidInput);
    }
    return valid;
  }

  /**
   * Gets the alternate player
   */
  otherPlayer(player) {
    if (this.players.a === player) {
      return this.players.b;
    } else {
      return this.players.a;
    }
  }

  /** Make it ready for next players chance */
  nextChance() {
    this.currentPlayer = this.otherPlayer(this.currentPlayer);
    console.log('\x1Bc');  //clear screen
    process.stdout.write(playerScreen({
      player_name: this.currentPlayer.name,
      board: this.currentPlayer.board.render()
    }));
    process.stdin.write('Shoot by entering co-ordinates (eg: 1,1): ');
    this.state = GameStates.PlayerChance;
    // this.getUserInput();

  }

  playGame(position) {
    process.stdout.write(`Entered Co-ordinates: ${position} \n`);
    if (this.validateUserInput(position)) {
      const post = {
        X: position[0],
        Y: position[1]
      };
      // this.shoot(this.currentPlayer, post);
      const otherPlayer = this.otherPlayer(this.currentPlayer);
      if (otherPlayer.board.isAlreadyTaken(post)) {
        process.stdout.write(chalk.red("Already Taken. Please try again.: "));
        return;
      }
      otherPlayer.board.hitOnBoard(post);
      if (otherPlayer.allSunk()) {
        process.stdout.write(chalk.bgGreen(`Player ${this.currentPlayer.name} Win! \n`));
        process.exit(0);
      }
      process.stdout.write(chalk.underline(`\nPress Enter to give chance to Player ${otherPlayer.name}.`));
      this.state = GameStates.DisplayChanceResult;
    } else {
      process.stdout.write("Invalid input. Please try again. (eg: 1,1): ");
      this.state = GameStates.InvalidInput;
      return;
    }

  }


  startGame() {
    this.loadGame();
    process.stdout.write("Press Enter to start Game!!!");
    process.stdin.setEncoding('utf8');
    this.state = GameStates.WaitingToStart;

    if (config.AUTO_RUN) {
      while (true) {
        this.nextChance();
        const position = [_.random(0, 9), _.random(0, 9)];
        this.playGame(position);
      }
    } else {
      process.stdin.on('readable', () => {
        const chunk = process.stdin.read();
        if (chunk !== null) {
          switch (this.state) {
            case GameStates.WaitingToStart: {
              this.nextChance();
              break;
            }
            case GameStates.PlayerChance: {
              const position = _.map(_.split(_.trim(chunk.toString(), "\n"), ','), i => _.toNumber(i));
              this.playGame(position);
              break;
            }
            case GameStates.DisplayChanceResult: {
              this.nextChance();
              break;
            }
            case GameStates.InvalidInput: {
              const position = _.map(_.split(_.trim(chunk.toString(), "\n"), ','), i => _.toNumber(i));
              this.playGame(position);
              break;
            }
          }
        }
      });

      process.stdin.on('end', () => {
        process.stdout.write('Bye');
      });
    }

  }



}

/** Application Entry Point */
(() => {
  const g = new Game();
  g.startGame();
})();