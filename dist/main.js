"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var model_1 = require("./model");
var tmpls_1 = require("./tmpls");
var chalk_1 = require("chalk");
var config = require("./config");
var Game = (function () {
    function Game() {
        this.players = {
            a: new model_1.Player(1),
            b: new model_1.Player(2)
        };
    }
    Game.prototype.loadGame = function () {
        this.players.a.initialize();
        this.players.b.initialize();
        this.currentPlayer = this.players.b;
    };
    /**
     * checks if the input is in given format. i.e [1,1]
     */
    Game.prototype.validateUserInput = function (input) {
        var valid = false;
        if (_.isArray(input) && input.length === 2) {
            var invalidInput = _.find(input, function (item) {
                return !_.inRange(item, 0, 10);
            });
            valid = _.isUndefined(invalidInput);
        }
        return valid;
    };
    /**
     * Gets the alternate player
     */
    Game.prototype.otherPlayer = function (player) {
        if (this.players.a === player) {
            return this.players.b;
        }
        else {
            return this.players.a;
        }
    };
    /** Make it ready for next players chance */
    Game.prototype.nextChance = function () {
        this.currentPlayer = this.otherPlayer(this.currentPlayer);
        console.log('\x1Bc'); //clear screen
        process.stdout.write(tmpls_1.playerScreen({
            player_name: this.currentPlayer.name,
            board: this.currentPlayer.board.render()
        }));
        process.stdin.write('Shoot by entering co-ordinates (eg: 1,1): ');
        this.state = model_1.GameStates.PlayerChance;
        // this.getUserInput();
    };
    Game.prototype.playGame = function (position) {
        process.stdout.write("Entered Co-ordinates: " + position + " \n");
        if (this.validateUserInput(position)) {
            var post = {
                X: position[0],
                Y: position[1]
            };
            // this.shoot(this.currentPlayer, post);
            var otherPlayer = this.otherPlayer(this.currentPlayer);
            if (otherPlayer.board.isAlreadyTaken(post)) {
                process.stdout.write(chalk_1.default.red("Already Taken. Please try again.: "));
                return;
            }
            otherPlayer.board.hitOnBoard(post);
            if (otherPlayer.allSunk()) {
                process.stdout.write(chalk_1.default.bgGreen("Player " + this.currentPlayer.name + " Win! \n"));
                process.exit(0);
            }
            process.stdout.write(chalk_1.default.underline("\nPress Enter to give chance to Player " + otherPlayer.name + "."));
            this.state = model_1.GameStates.DisplayChanceResult;
        }
        else {
            process.stdout.write("Invalid input. Please try again. (eg: 1,1): ");
            this.state = model_1.GameStates.InvalidInput;
            return;
        }
    };
    Game.prototype.startGame = function () {
        var _this = this;
        this.loadGame();
        process.stdout.write("Press Enter to start Game!!!");
        process.stdin.setEncoding('utf8');
        this.state = model_1.GameStates.WaitingToStart;
        if (config.AUTO_RUN) {
            while (true) {
                this.nextChance();
                var position = [_.random(0, 9), _.random(0, 9)];
                this.playGame(position);
            }
        }
        else {
            process.stdin.on('readable', function () {
                var chunk = process.stdin.read();
                if (chunk !== null) {
                    switch (_this.state) {
                        case model_1.GameStates.WaitingToStart: {
                            _this.nextChance();
                            break;
                        }
                        case model_1.GameStates.PlayerChance: {
                            var position = _.map(_.split(_.trim(chunk.toString(), "\n"), ','), function (i) { return _.toNumber(i); });
                            _this.playGame(position);
                            break;
                        }
                        case model_1.GameStates.DisplayChanceResult: {
                            _this.nextChance();
                            break;
                        }
                        case model_1.GameStates.InvalidInput: {
                            var position = _.map(_.split(_.trim(chunk.toString(), "\n"), ','), function (i) { return _.toNumber(i); });
                            _this.playGame(position);
                            break;
                        }
                    }
                }
            });
            process.stdin.on('end', function () {
                process.stdout.write('Bye');
            });
        }
    };
    return Game;
}());
/** Application Entry Point */
(function () {
    var g = new Game();
    g.startGame();
})();
//# sourceMappingURL=main.js.map