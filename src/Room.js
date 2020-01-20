const BoardManager = require("./BoardManager.js");

// Room class for each individual room
class Room {
    // Constructor method
    constructor(name, type, ws) {
        // Initialize fields
        this.name = name;
        this.type = type;

        this.turn = -1;
        this.colorName = 'Black';
        this.black;
        this.white;

        this.board = new BoardManager();

        this.passes = 0;
        this.drawColor = null;
        this.takebackColor == null;

        this.connect(ws);
    }

    // Connect a new client
    connect(ws) {
        var color;
        var otherWS;

        // Disconnect client if room capacity reached
        if (this.black && this.white) {
            this.send(ws, 'res', "Room is full");
            return false;
        }

        // Functionality for partially filled room
        if (this.black || this.white) {
            // Assign color
            if (this.black) {
                this.white = ws;
                color = 'White';
                otherWS = this.black;
            } else {
                this.black = ws;
                color = 'Black';
                otherWS = this.white;
            }

            // Set up if game has not started
            if (this.turn == -1) {
                this.turn = 0;
                this.send(otherWS, 'res', "Opponent connected");
            } else {
                this.turn -= 2;
                this.send(otherWS, 'res', "Opponent rejoined");
            }

            // Send client updated information
            this.send(ws, 'update', this.board.pieces);
            this.send(ws, 'color', color);

            // Check if game has ended
            if (this.turn == 4) {
                this.send(ws, 'end', "Game ended");
            } else {
                this.send(ws, 'turn', this.turn);
                this.send(ws, 'res', "Connected to room " + this.name);
                this.send(ws, 'res', "All commands beside /cmd only active when both players connected\nDraw and takeback offers can only be sent on your turn");
                this.send(ws, 'res', "Opponent connected");
            }

            return true;
        }

        // Functionality for new room
        // Assign color
        if (Math.floor(Math.random() * 2) == 0) {
            this.black = ws;
            color = 'Black'
        } else {
            this.white = ws;
            color = 'White';
        }

        // Send client information
        this.send(ws, 'update', this.board.pieces);
        this.send(ws, 'color', color);
        this.send(ws, 'turn', 0);
        this.send(ws, 'res', "Room " + this.name + " created");
        this.send(ws, 'res', "All commands beside /cmd only active when both players connected\nDraw and takeback offers can only be sent on your turn");

        return true;
    }

    // Disconnect client
    disconnect(ws) {
        // Determine colors and disconnect
        var otherWS;
        if (this.black == ws) {
            this.black = null;
            otherWS = this.white;
        } else if (this.white == ws) {
            this.white = null;
            otherWS = this.black;
        } else {
            return true;
        }

        // Room is partially filled
        if (otherWS) {
            this.turn += 2;
            this.send(otherWS, 'res', "Opponent disconnected");
            return true;
        }

        // Room is empty
        return false;
    }

    // Functionality for changing turns
    nextTurn() {
        // Check draw and takeback cancellation
        if (this.drawColor != null) {
            this.drawColor = null;
            this.send('both', 'res', this.colorName + " cancelled the draw offer");
        }
        if (this.takebackColor != null) {
            this.takebackColor = null;
            this.send('both', 'res', this.colorName + " cancelled the takeback offer");
        }

        // Update client boards and prevPieces
        this.send('both', 'update', this.board.pieces);
        this.board.updatePrev();

        // Update turns
        this.turn = (this.turn + 1) % 2;
        this.colorName = ['Black', 'White'][this.turn];
    }

    // Move functionality
    makeMove(r, c) {
        if (this.board.pieces[r][c] != 0) {
            return;
        }

        // Add piece to board
        this.board.updateBoard(r, c, this.turn);

        // Functionality specific to go
        if (this.type == 'go') {
            // Check captures
            if (!this.board.checkCapture(r, c, this.turn)) {
                return;
            }

            // Ko rule
            if (this.board.prevPieces.find(e => JSON.stringify(e) == JSON.stringify(this.board.pieces))) {
                this.board.pieces = JSON.parse(JSON.stringify(this.board.prevPieces[this.board.prevPieces.length - 1]));
                return;
            }
        }

        // Check win cases
        if (this.type == 'gomoku' && this.board.checkGomoku(r, c, this.turn)) {
            this.turn = 4;
            this.send('both', 'update', this.board.pieces);
            this.send('both', 'res', "Game ended - " + this.colorName + " won");
            this.send('both', 'end', "Game ended");
            return;
        }

        // Change turns
        this.nextTurn();
        this.passes = 0;
    }

    // Pass functionality
    pass() {
        this.passes++;
        this.send('both', 'res', this.colorName + " passed");
        this.nextTurn();

        if (this.passes == 2) {
            this.turn = 4;
            const [blackScore, whiteScore] = this.board.areaScore();

            // Display results
            this.send('both', 'res', "Black score: " + blackScore + "\nWhite score: " + whiteScore);
            if (blackScore > whiteScore) {
                this.send('both', 'res', "Game ended - Black won");
            } else if (whiteScore > blackScore) {
                this.send('both', 'res', "Game ended - White won");
            } else {
                this.send('both', 'res', "Game ended in a tie");
            }
            this.send('both', 'end', "Game ended");
        }
    }

    // Chat functionality 
    processMsg(ws, msg) {
        // Determine colors
        var color;
        var otherColor;
        if (this.black == ws) {
            color = 'Black';
            otherColor = 'White';
        } else {
            color = 'White';
            otherColor = 'Black';
        }
        var allPresent = (this.turn == 0 || this.turn == 1);

        if (msg.length == 0) {
            return;
        }

        if (msg == '/cmd') {
            this.send(color, 'res', "/cmd: display commands\n/forfeit: forfeit the game\n/draw: offer draw, opponent must accept\n/takeback: offer takeback, reverting the last move, opponent must accept\n/accept: accept offer\n/reject: reject offer (for receiver)\n/cancel: cancel offer (for offerer)\n/rematch: start a rematch with opponent in same room");
            return;
        }

        if (msg == '/forfeit') {
            if (allPresent) {
                this.turn = 4;
                this.send('both', 'res', "Game ended - " + color + " forfeited");
                this.send('both', 'end', "Game ended");
            } else {
                this.send(color, 'res', otherColor + " not present, command ignored");
            }
            return;
        }

        if (msg == '/draw') {
            if (allPresent) {
                if (this.drawColor == color) {
                    this.send(color, 'res', "Unable to offer draw, draw offer in progress");
                    return;
                } else if (this.takebackColor) {
                    this.send(color, 'res', "Unable to offer draw, takeback offer in progress");
                    return;
                } else if (this.drawColor == null) {
                    this.drawColor = color;
                    this.send('both', 'res', color + " offered a draw\n" + otherColor + " can accept with /accept or /draw and can reject with /reject\n Offer can be cancelled with /cancel or a move");
                    return;
                } else {
                    msg = '/accept';
                }
            } else {
                this.send(color, 'res', otherColor + " not present, command ignored");
                return;
            }
        }

        if (msg == '/takeback') {
            if (allPresent) {
                if (this.takebackColor == color) {
                    this.send(color, 'res', "Unable to offer draw, takeback offer in progress");
                    return;
                } else if (this.drawColor) {
                    this.send(color, 'res', "Unable to offer draw, draw offer in progress");
                    return;
                } else if (this.board.prevPieces.length < 2) {
                    this.send(color, 'res', "No takebacks allowed on Black's first move, command ignored");
                    return;
                } else if (this.takebackColor == null) {
                    this.takebackColor = color;
                    this.send('both', 'res', color + " offered a takeback\n" + otherColor + " can accept with /accept or /takeback and can reject with /reject\n Offer can be cancelled with /cancel or a move");
                    return;
                } else {
                    msg = '/accept';
                }
            } else {
                this.send(color, 'res', otherColor + " not present, command ignored");
                return;
            }
        }

        if (msg == '/accept') {
            if (this.drawColor == otherColor) {
                this.turn = 4;
                this.send('both', 'res', "Game ended - " + color + " accepted the draw offer");
                this.send('both', 'end', "Game ended");
            } else if (this.takebackColor == otherColor) {
                this.takebackColor = null;
                this.send('both', 'res', color + " accepted the takeback offer\nLast move reverted");
                // Revert to last move
                this.board.takeback();
                this.send('both', 'update', this.board.pieces);
                this.turn = (this.turn + 1) % 2;
                this.colorName = ['Black', 'White'][this.turn];
            } else {
                this.send(color, 'res', 'No offer to accept, command ignored');
            }
            return;
        }

        if (msg == '/reject') {
            if (this.drawColor == otherColor) {
                this.drawColor = null;
                this.send('both', 'res', color + " rejected the draw offer");
            } else if (this.takebackColor == otherColor) {
                this.takebackColor = null;
                this.send('both', 'res', color + " rejected the takeback offer");
            } else {
                this.send(color, 'res', "No offer to reject, command ignored");
            }
            return;
        }

        if (msg == '/cancel') {
            if (this.drawColor == color) {
                this.drawColor = null;
                this.send('both', 'res', color + " cancelled the takeback offer");
            } else if (this.takebackColor == color) {
                this.takebackColor = null;
                this.send('both', 'res', color + " cancelled the takeback offer");
            } else {
                this.send(color, 'res', "No offer to cancel, command ignored");
            }
            return;
        }

        if (msg == "/rematch") {
            if (this.turn == 4) {
                this.send('both', 'res', color + " has started a rematch, game reset");
                // Reset fields
                this.turn = -1;
                this.colorName = 'Black';
                this.board = new BoardManager();
                var tempBlack = this.black;
                var tempWhite = this.white;
                this.black = null;
                this.white = null;
                this.passes = 0;
                this.drawColor = null;
                this.takebackColor == null;
                // Reconnect clients
                this.connect(tempBlack);
                this.connect(tempWhite);
            } else {
                this.send('both', 'res', "Game has not ended, command ignored");
            }
            return;
        }

        this.send(color, 'chat', "You: " + msg);
        this.send(otherColor, 'chat', 'Opponent: ' + msg);
    }

    // Send messages to clients
    send(rcv, c, v) {
        var data = JSON.stringify({
            cmd: c,
            val: v
        });

        if (this.black && (rcv == 'Black' || rcv == 'both')) {
            this.black.send(data);
        }
        if (this.white && (rcv == 'White' || rcv == 'both')) {
            this.white.send(data);
        }

        if (!['Black', 'White', 'both'].includes(rcv)) {
            rcv.send(data);
        }
    }

}

module.exports = Room;