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
        this.board = new Board();
        this.pieces = [];
        this.pieces.push(Array(21).fill(9));
        for (var r = 0; r < 19; r++) {
            this.pieces.push([9].concat(Array(19).fill(0), [9]));
        }
        this.pieces.push(Array(21).fill(9));

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

            // Store previous piece setup, add piece to array pieces
            this.prevPieces = JSON.parse(JSON.stringify(this.pieces));
            this.pieces[this.r][this.c] = this.color + 1;

            // Check draw
            if (this.draw) {
                this.draw = false;
                this.chatDisp(colorName + " cancelled the draw offer");
            }

            // Check captures
            if (this.type == "go") {
                if (this.checkCapture()) {
                    this.passes = 0;
                }
                else {
                    return;
                }
            }

            // Update turns and board
            this.color = (this.color + 1) % 2;
            this.turn.innerText = otherColor + "'s turn";
            this.renderBoard();

            // Check win cases
            if (this.type == "gomoku") {
                this.color = (this.color + 1) % 2;
                if (this.checkGomoku()) {
                    this.end = true;
                    this.turn.innerText = colorName + " won\nPlease press restart";
                    this.chatDisp("Game ended - " + colorName + " won");
                }
                else {
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
        checks.sort((a, b) => {if (this.color == 0) { return b[2] - a[2]; } return a[2] - b[2]; });

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
        this.passes ++;
        this.chatDisp(["Black", "White"][this.color] + "passed");
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
            this.chatDisp("/cmd: display commands\n/forfeit: forfeit the game\n/draw: propose draw, opponent must accept\n/accept: accept draw or takeback offers\n/reject: reject draw or takeback offers", true);
        }

        if (msg == "/forfeit") {
            this.end = true;
            this.chatDisp(colorName + " forfeited");
            this.turn.innerText = otherColor + " won\nPlease press restart";
            this.chatDisp("Game ended - " + otherColor + " won");
        }

        if (msg == "/draw") {
            if (!this.draw) {
                this.draw = true;
                this.chatDisp(colorName + " offered a draw\n" + otherColor + " can accept with /accept or /draw and can reject with /reject\n" + colorName + " can cancel the offer with a move");
            }
            else {
                msg = "/accept";
            }
        }

        if (msg == "/accept") {
            if (this.draw) {
                this.end = true;
                this.chatDisp(otherColor + " accepted the draw offer");
                this.turn.innerText = "Game ended\nPlease press restart";
                this.chatDisp("Game ended in a draw");
            }
            else if (this.takeback) {

            }
            else {
                this.chatDisp("No offer, command ignored");
            }
        }

        if (msg == "/reject") {
            if (this.draw) {
                this.draw = false;
                this.chatDisp(otherColor + " rejected the draw offer");
            }
            else if (this.takeback) {
                this.takeback = false;
                this.chatDisp(otherColor + " rejected the takeback offer");
            }
            else {
                this.chatDisp("No offer, command ignored");
            }
        }
    }

    // Render board
    renderBoard() {
        var cur = this;
        this.board.render(this.pieces, function () {
            cur.addPiece(this);
        });
    }

    // Chat display
    chatDisp(msg) {
        var ele = document.createElement("span");
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
