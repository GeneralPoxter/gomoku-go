// Local game manager
class Game {
    // Constructor method
    constructor(type) {
        // Initialize fields
        this.type = type;
        this.color = 0;
        this.passes = 0;
        this.draw = false;
        this.takeback = false;
        this.end = false;

        // Initialize board
        this.board = new BoardRenderer();
        this.pieces = [];
        this.pieces.push(Array(21).fill(9));
        for (var r = 0; r < 19; r++) {
            this.pieces.push([9].concat(Array(19).fill(0), [9]));
        }
        this.pieces.push(Array(21).fill(9));
        this.prevPieces = []
        this.updatePrev();

        // Set up HTML
        document.getElementById('code').value = "";
        this.text = document.getElementById("status");
        this.turn = document.getElementById("turn");
        this.chat = document.getElementById("chatText");
        this.text.innerText = "Local game";
        this.turn.innerText = "Black's turn";
    }

    // Add piece to board
    addPiece(p) {
        var piece = d3.select(p);
        this.r = piece.attr("cy") / 40;
        this.c = piece.attr("cx") / 40;

        // Check valid move
        if (this.pieces[this.r][this.c] == 0 && !this.end) {
            var colorName = ["Black", "White"][this.color];
            var otherColor = ["Black", "White"][(this.color + 1) % 2]

            // Add piece to pieces
            this.pieces[this.r][this.c] = this.color + 1;

            // Check draw and takeback
            if (this.draw) {
                this.draw = false;
                this.chatDisp(colorName + " cancelled the draw offer");
            }
            if (this.takeback) {
                this.takeback = false;
                this.chatDisp(colorName + " cancelled the takeback offer");
            }

            // Functionality specific to go
            if (this.type == "go") {
                // Ko rule
                if (this.prevPieces.includes(this.pieces)) {
                    this.pieces[this.r][this.c] = 0;
                    return;
                }

                // Check captures
                if (this.checkCapture()) {
                    this.passes = 0;
                } else {
                    return;
                }
            }

            // Update turns and board
            this.color = (this.color + 1) % 2;
            this.turn.innerText = otherColor + "'s turn";
            this.renderBoard();

            // Store board in prevPieces
            this.updatePrev();

            // Check win cases
            if (this.type == "gomoku") {
                this.color = (this.color + 1) % 2;
                if (this.checkGomoku()) {
                    this.end = true;
                    this.turn.innerText = colorName + " won\nPlease press restart";
                    this.chatDisp("Game ended - " + colorName + " won");
                } else {
                    this.color = (this.color + 1) % 2;
                }
            }

        }
    }

    // Check for 5 in a row
    checkGomoku() {
        // Array of possible orientations for 5 in a row
        var dir = [[[1, 0], [-1, 0]], [[0, 1], [0, -1]], [[1, 1], [-1, -1]], [[1, -1], [-1, 1]]];

        for (var i = 0; i < 4; i++) {
            var line = 1;
            var d = dir[i];

            // Count how many pieces in each direction
            for (var j = 0; j < 2; j++) {
                var m = 1;
                while (this.pieces[this.r + m * d[j][0]][this.c + m * d[j][1]] == this.color + 1) {
                    line++;
                    m++;
                }
            }

            // End game
            if (line == 5) {
                return true;
            }
        }

        return false;
    }

    // Check captures in position and all orthogonal direction, prioritizing enemy color
    checkCapture() {
        var dir = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        var checks = [];

        checks.push([this.r, this.c, this.color + 1]);
        for (var i = 0; i < 4; i++) {
            var adjR = this.r + dir[i][0];
            var adjC = this.c + dir[i][1];
            var adjColor = this.pieces[adjR][adjC];
            if (adjColor == 1 || adjColor == 2) {
                checks.push([adjR, adjC, adjColor]);
            }
        }

        // Prioritize the checking queue
        checks.sort((a, b) => { if (this.color == 0) { return b[2] - a[2]; } return a[2] - b[2]; });

        for (var i = 0; i < checks.length; i++) {
            // Visited array to prevent overflow
            this.visited = []
            for (var j = 0; j < 21; j++) {
                this.visited.push(Array(21).fill(0));
            }

            // Check the piece
            if (!this.hasLiberties(checks[i][0], checks[i][1], checks[i][2])) {
                // Prevent self-capture
                if (checks[i][2] == this.color + 1) {
                    this.replace(3, this.color + 1);
                    this.pieces[this.r][this.c] = 0;
                    return false;
                }
                // Finalize the capture
                this.replace(3, 0);
            }
        }

        return true;
    }

    // Check for liberties
    hasLiberties(r, c, color) {
        var piece = this.pieces[r][c];
        var dir = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        this.visited[r][c] = 1;

        if (piece == 0) {
            return true;
        }

        if (piece != color) {
            return false;
        }

        for (var i = 0; i < 4; i++) {
            var adjR = r + dir[i][0];
            var adjC = c + dir[i][1];
            if (!this.visited[adjR][adjC] && this.hasLiberties(adjR, adjC, color)) {
                // Remove tentative mark
                this.replace(3, color);
                return true;
            }
        }

        // Tentatively marked for capture
        this.pieces[r][c] = 3;
        return false;
    }

    // Pass functionality
    pass() {
        var colorName = ["Black", "White"][this.color];
        this.passes++;
        this.updatePrev();
        this.chatDisp(colorName + "passed");

        // Check draw and takeback
        if (this.draw) {
            this.draw = false;
            this.chatDisp(colorName + " cancelled the draw offer");
        }
        if (this.takeback) {
            this.takeback = false;
            this.chatDisp(colorName + " cancelled the takeback offer");
        }

        this.color = (this.color + 1) % 2;
        this.turn.innerText = ["Black", "White"][this.color] + "'s turn";

        if (this.passes == 2) {
            this.end = true;
            this.turn.innerText = "Game ended\nPlease press restart";
            this.chatDisp("Game ended");
        }
    }

    // Command functionality
    cmd(msg) {
        var colorName = ["Black", "White"][this.color];
        var otherColor = ["Black", "White"][(this.color + 1) % 2]

        if (msg == "/cmd") {
            this.chatDisp("/cmd: display commands\n/forfeit: forfeit the game\n/draw: offer draw, opponent must accept\n/takeback: offer takeback, reverting Black and White's last moves, opponent must accept\n/accept: accept offers\n/reject: reject offers");
        }

        if (msg == "/forfeit") {
            this.end = true;
            this.chatDisp(colorName + " forfeited");
            this.turn.innerText = otherColor + " won\nPlease press restart";
            this.chatDisp("Game ended - " + otherColor + " won");
        }

        if (msg == "/draw") {
            if (this.takeback) {
                this.chatDisp("Unable to offer draw, takeback offer in progress");
            } else if (this.draw) {
                msg = "/accept";
            } else {
                this.draw = true;
                this.chatDisp(colorName + " offered a draw\n" + otherColor + " can accept with /accept or /draw and can reject with /reject\n" + colorName + " can cancel the offer with a move");
            }
        }

        if (msg == "/takeback") {
            if (this.draw) {
                this.chatDisp("Unable to offer takeback, draw offer in progress");
            } else if (this.takeback) {
                msg = "/accept";
            } else if (this.prevPieces.length < 3) {
                this.chatDisp("No takebacks allowed on " + colorName + "'s first move, command ignored");
            } else {
                this.takeback = true;
                this.chatDisp(colorName + " offered a takeback\n" + otherColor + " can accept with /accept or /takeback and can reject with /reject\n" + colorName + " can cancel the offer with a move");
            }
        }

        if (msg == "/accept") {
            if (this.draw) {
                this.end = true;
                this.chatDisp(otherColor + " accepted the draw offer");
                this.turn.innerText = "Game ended\nPlease press restart";
                this.chatDisp("Game ended in a draw");
            } else if (this.takeback) {
                this.takeback = false;
                this.chatDisp(otherColor + " accepted the takeback offer\nBlack and White's last moves reverted");
                this.prevPieces = this.prevPieces.slice(0, this.prevPieces.length - 2);
                this.pieces = JSON.parse(JSON.stringify(this.prevPieces[this.prevPieces.length - 1]));
                this.renderBoard();
            } else {
                this.chatDisp("No offer to accept, command ignored");
            }
        }

        if (msg == "/reject") {
            if (this.draw) {
                this.draw = false;
                this.chatDisp(otherColor + " rejected the draw offer");
            } else if (this.takeback) {
                this.takeback = false;
                this.chatDisp(otherColor + " rejected the takeback offer");
            } else {
                this.chatDisp("No offer to reject, command ignored");
            }
        }
    }

    updatePrev() {
        this.prevPieces.push(JSON.parse(JSON.stringify(this.pieces)));
    }

    // Render board
    renderBoard() {
        var cur = this;
        this.board.render(this.pieces, function() {
            cur.addPiece(this);
        });
    }

    // Chat display
    chatDisp(msg) {
        var ele = document.createElement("p");
        ele.innerText = msg;
        ele.style.fontStyle = "italic";
        this.chat.appendChild(ele);
        this.chat.scrollTop = this.chat.scrollHeight;
    }

    // Replace all instance of i in the playable board with j
    replace(i, j) {
        for (var r = 1; r < 20; r++) {
            for (var c = 1; c < 20; c++) {
                if (this.pieces[r][c] == i) {
                    this.pieces[r][c] = j;
                }
            }
        }
    }

}