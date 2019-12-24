// Local game manager
class Game {
    // Constructor method
    constructor(type) {
        // Initialize fields
        this.type = type;
        this.color = 0;
        this.passes = 0;
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
        this.text = document.getElementById("status");
        this.turn = document.getElementById("turn");
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
            // Add piece to array pieces
            this.pieces[this.r][this.c] = this.color + 1;

            if (this.type == "go") {
                this.passes = 0;
                this.checkCapture();
            }

            // Check move and update color and turn
            if (this.type == "gomoku" && this.checkGomoku()) {
                this.end = true;
                this.turn.innerText = ["Black", "White"][this.color] + " won\nPlease press restart";
            } else {
                this.color = (this.color + 1) % 2;
                this.turn.innerText = ["Black", "White"][this.color] + "'s turn";
            }

            // Update board
            this.renderBoard();
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

        checks.push([this.color + 1, this.r, this.c]);
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
                // Finalize the capture
                this.replace(3, 0);
            }
        }
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
        this.color = (this.color + 1) % 2;
        this.turn.innerText = ["Black", "White"][this.color] + "'s turn";
        
        if (this.passes == 2) {
            this.end = true;
            this.turn.innerText = "Game has ended\nPlease press restart";
        }
    }

    // Render board
    renderBoard() {
        var cur = this;
        this.board.render(this.pieces, function () {
            cur.addPiece(this);
        });
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