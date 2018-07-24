"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var chalk_1 = require("chalk");
var GameStates;
(function (GameStates) {
    GameStates[GameStates["WaitingToStart"] = 0] = "WaitingToStart";
    GameStates[GameStates["PlayerChance"] = 1] = "PlayerChance";
    GameStates[GameStates["DisplayChanceResult"] = 2] = "DisplayChanceResult";
    GameStates[GameStates["InvalidInput"] = 3] = "InvalidInput"; // when user givesn invalid input
})(GameStates = exports.GameStates || (exports.GameStates = {}));
var BoardMarker;
(function (BoardMarker) {
    BoardMarker["ship"] = "S";
    BoardMarker["hit"] = "*";
    BoardMarker["miss"] = "-";
})(BoardMarker = exports.BoardMarker || (exports.BoardMarker = {}));
var Orientation;
(function (Orientation) {
    Orientation["X"] = "xAxis";
    Orientation["Y"] = "yAxis";
})(Orientation = exports.Orientation || (exports.Orientation = {}));
exports.shipType = {
    carrier: 5,
    battleship: 4,
    cruiser: 3,
    submarine: 3,
    destroyer: 2
};
var Ship = (function () {
    function Ship(type, name) {
        this.sunk = false;
        this.type = type;
        this.name = name;
    }
    Object.defineProperty(Ship.prototype, "sybmol", {
        get: function () {
            var s;
            switch (this.name) {
                case 'carrier':
                    s = 'V';
                    break;
                case 'battleship':
                    s = 'W';
                    break;
                case 'cruiser':
                    s = 'X';
                    break;
                case 'submarine':
                    s = 'Y';
                    break;
                case 'destroyer':
                    s = 'Z';
                    break;
            }
            return s;
        },
        enumerable: true,
        configurable: true
    });
    Ship.prototype.isSunked = function () {
        var nonBomedSpot = _.find(this.location, function (co) {
            return !co.hit;
        });
        // if empty means all spots are bombed.
        return _.isEmpty(nonBomedSpot);
    };
    Ship.prototype.checkNMarkHit = function (position) {
        var isHit = false;
        _.takeWhile(this.location, function (co) {
            isHit = co.X === position.X && co.Y === position.Y;
            if (isHit) {
                co.hit = true;
            }
            return !isHit;
        });
        return isHit;
    };
    Ship.prototype.setLocation = function (position, orientation) {
        this.location = [{ X: position.X, Y: position.Y, hit: false }];
        var len = 1;
        while (len <= this.type) {
            if (orientation === Orientation.X) {
                this.location.push({ X: position.X + len, Y: position.Y, hit: false });
            }
            else {
                this.location.push({ X: position.X, Y: position.Y + len, hit: false });
            }
            len++;
        }
    };
    return Ship;
}());
exports.Ship = Ship;
var Board = (function () {
    function Board() {
        this.resetGird();
    }
    Board.prototype.resetGird = function () {
        var board = [];
        var i = 10;
        while (i > 0) {
            var j = 10;
            var row = [];
            while (j > 0) {
                row.push('0');
                j--;
            }
            board.push(row);
            i--;
        }
        this.grid = board;
    };
    Board.prototype.fillBoard = function () {
        var _this = this;
        var occupiedPostions = _.flatMap(this.player.ships, function (ship) {
            _.each(ship.location, function (position) {
                _this.grid[position.X][position.Y] = BoardMarker.ship;
            });
        });
    };
    Board.prototype.fillColor = function (val) {
        switch (val) {
            case '*':
                val = chalk_1.default.bgRed(val);
                break;
            case 'S':
                val = chalk_1.default.bgGreen(val);
                break;
            case '-':
                val = chalk_1.default.bgYellow(val);
                break;
        }
        return val;
    };
    /** Prints grid on console */
    Board.prototype.render = function () {
        var _this = this;
        var grid = _.cloneDeep(this.grid);
        var output = "";
        var xIndex = _.map(_.range(10), function (i) { return i.toString(); });
        xIndex.splice(0, 0, ' |');
        output = _.reduce(xIndex, function (accum, i) {
            accum = accum + i;
            return accum;
        }, output);
        output = output + "\n";
        output = output + "------------\n";
        _.each(grid, function (row, index) {
            row.splice(0, 0, index + "|");
            _.each(row, function (col) {
                output = output + _this.fillColor(col);
            });
            output = output + "\n";
        });
        return output;
    };
    Board.prototype.bombAship = function (position) {
        _.takeWhile(this.player.ships, function (ship) {
            var isHit = ship.checkNMarkHit(position);
            if (isHit) {
                if (ship.isSunked()) {
                    ship.sunk = true;
                    console.log(chalk_1.default.bgCyan('Sunk'));
                }
                else {
                    console.log(chalk_1.default.bgMagenta("Hit"));
                }
            }
            return !isHit;
        });
    };
    /** Called when a other player launch a bomb */
    Board.prototype.hitOnBoard = function (position) {
        if (this.grid[position.X][position.Y] === BoardMarker.ship) {
            this.grid[position.X][position.Y] = BoardMarker.hit;
            this.bombAship(position);
        }
        else if (this.grid[position.X][position.Y] === BoardMarker.hit ||
            this.grid[position.X][position.Y] === BoardMarker.miss) {
            console.log("Already Taken");
        }
        else {
            this.grid[position.X][position.Y] = BoardMarker.miss;
            console.log(chalk_1.default.bgYellow("Miss"));
        }
    };
    /** Checks if the given position is already hitted */
    Board.prototype.isAlreadyTaken = function (position) {
        if (this.grid[position.X][position.Y] === BoardMarker.hit ||
            this.grid[position.X][position.Y] === BoardMarker.miss) {
            return true;
        }
        else {
            return false;
        }
    };
    return Board;
}());
exports.Board = Board;
var Player = (function () {
    function Player(name) {
        this.name = name;
        this.ships = [
            new Ship(exports.shipType.carrier, "carrier"),
            new Ship(exports.shipType.battleship, "battleship"),
            new Ship(exports.shipType.cruiser, "cruiser"),
            new Ship(exports.shipType.submarine, "submarine"),
            new Ship(exports.shipType.destroyer, "destroyer"),
        ];
    }
    /**
     * Setup players board
     */
    Player.prototype.initialize = function () {
        this.board = new Board();
        this.board.player = this;
        this.positionShips();
    };
    Player.prototype.allSunk = function () {
        return _.reduce(this.ships, function (accum, ship) {
            accum = accum && ship.sunk;
            return accum;
        }, true);
    };
    /**
     * Sets the initial position of ships for given player
     */
    Player.prototype.positionShips = function () {
        var _this = this;
        _.each(this.ships, function (ship) {
            var location = _this.getNewLocation(ship);
            ship.location = location;
        });
        this.board.fillBoard();
    };
    /**
     * Finds and returns the location on board where ship can be placed
     */
    Player.prototype.getNewLocation = function (ship) {
        var location;
        while (true) {
            var o = [Orientation.X, Orientation.Y][_.random(0, 1)];
            var range = 9 - ship.type;
            var startPosition = {
                X: _.random(0, o === Orientation.X ? range : 9),
                Y: _.random(0, o === Orientation.X ? range : 9)
            };
            location = this.getLocation(startPosition, o, ship.type);
            if (this.insideBoard(location) && this.islocationEmpty(location)) {
                break;
            }
        }
        return location;
    };
    /**
     * Gets a random location on the board
     */
    Player.prototype.getLocation = function (position, orientation, shipSize) {
        var location = [position];
        var len = 1;
        while (len < shipSize) {
            if (orientation === Orientation.X) {
                location.push({ X: position.X + len, Y: position.Y });
            }
            else {
                location.push({ X: position.X, Y: position.Y + len });
            }
            len++;
        }
        return location;
    };
    Player.prototype.insideBoard = function (location) {
        var first = _.first(location);
        var isFirstValid = first.X >= 0 && first.X <= 9 && first.Y >= 0 && first.Y <= 9;
        var last = _.last(location);
        var islastValid = last.X >= 0 && last.X <= 9 && last.Y >= 0 && last.Y <= 9;
        return isFirstValid && islastValid;
    };
    /**
     * Checks if location is available to place ship.
     * none of co-ordinates should be occupied by other ship
     */
    Player.prototype.islocationEmpty = function (location) {
        var occupiedPositions = _.flatMap(this.ships, function (ship) {
            return ship.location;
        });
        occupiedPositions = _.filter(occupiedPositions, function (item) { return !_.isEmpty(item); });
        var foundPosition = _.find(occupiedPositions, function (co) {
            var matchedPosition = _.find(location, function (position) {
                return co.X === position.X && co.Y === position.Y;
            });
            return !_.isEmpty(matchedPosition);
        });
        return _.isEmpty(foundPosition);
    };
    return Player;
}());
exports.Player = Player;
//# sourceMappingURL=model.js.map