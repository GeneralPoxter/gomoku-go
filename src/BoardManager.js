// Board manager for server-side game management
class BoardManager {
    constructor() {
        this.pieces = [];
        this.pieces.push(Array(21).fill(9));
        for (var r = 0; r < 19; r++) {
            this.pieces.push([9].concat(Array(19).fill(0), [9]));
        }
        this.pieces.push(Array(21).fill(9));
        this.prevPieces = [];
        this.updatePrev();
    }

    updateBoard(r, c, color) {
        this.pieces[r][c] = color + 1;
    }

    updatePrev() {
        this.prevPieces.push(JSON.parse(JSON.stringify(this.pieces)));
    }

    // Takeback functionality
    takeback() {
        this.prevPieces = this.prevPieces.slice(0, this.prevPieces.length - 1);
        this.pieces = JSON.parse(JSON.stringify(this.prevPieces[this.prevPieces.length - 1]));
    }

    // Check for 5 in a row
    checkGomoku(r, c, color) {
        // Array of possible orientations for 5 in a row
        var dir = [[[1, 0], [-1, 0]], [[0, 1], [0, -1]], [[1, 1], [-1, -1]], [[1, -1], [-1, 1]]];

        for (var i = 0; i < 4; i++) {
            var line = 1;
            var d = dir[i];

            // Count how many pieces in each direction
            for (var j = 0; j < 2; j++) {
                var m = 1;
                while (this.pieces[r + m * d[j][0]][c + m * d[j][1]] == color + 1) {
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
    checkCapture(r, c, color) {
        var dir = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        var checks = [];

        checks.push([r, c, color + 1]);
        for (var i = 0; i < 4; i++) {
            var adjR = r + dir[i][0];
            var adjC = c + dir[i][1];
            var adjColor = this.pieces[adjR][adjC];
            if (adjColor == 1 || adjColor == 2) {
                checks.push([adjR, adjC, adjColor]);
            }
        }

        // Prioritize the checking queue
        checks.sort((a, b) => {
            if (color == 0) {
                return b[2] - a[2];
            }
            return a[2] - b[2];
        });

        for (var i = 0; i < checks.length; i++) {
            // Visited array to prevent overflow
            var visited = [];
            for (var j = 0; j < 21; j++) {
                visited.push(Array(21).fill(0));
            }

            // Check the piece
            if (!this.hasLiberties(checks[i][0], checks[i][1], visited, checks[i][2])) {
                // Prevent self-capture
                if (checks[i][2] == color + 1) {
                    this.replace(3, color + 1);
                    this.pieces[r][c] = 0;
                    return false;
                }
                // Finalize the capture
                this.replace(3, 0);
            }
        }

        return true;
    }

    // Check for liberties
    hasLiberties(r, c, visited, color, otherColor) {
        var piece = this.pieces[r][c];
        var dir = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        visited[r][c] = 1;

        // Functionality specific to area scoring
        if (color == 4) {
            if (piece == otherColor || piece == 9) {
                return false;
            }

            if (piece != color) {
                return true;
            }
        } else {
            if (piece == 0) {
                return true;
            }

            if (piece != color) {
                return false;
            }
        }

        for (var i = 0; i < 4; i++) {
            var adjR = r + dir[i][0];
            var adjC = c + dir[i][1];
            if (!visited[adjR][adjC] && this.hasLiberties(adjR, adjC, visited, color, otherColor)) {
                // Remove tentative mark
                this.replace(3, color);
                return true;
            }
        }

        // Tentatively marked for capture
        this.pieces[r][c] = 3;
        return false;
    }

    // Score go board using area scoring
    areaScore() {
        var blackScore = 0;
        var whiteScore = 0;

        // Exception for empty board
        if (JSON.stringify(this.pieces) == JSON.stringify(this.prevPieces[0])) {
            return [0, 0];
        }

        // Include empty intersections into each color's territory
        this.replace(0, 4);
        for (var r = 1; r < 20; r++) {
            for (var c = 1; c < 20; c++) {
                if (this.pieces[r][c] == 4) {
                    for (var i = 1; i < 3; i++) {
                        var visited = []
                        for (var j = 0; j < 21; j++) {
                            visited.push(Array(21).fill(0));
                        }
                        this.hasLiberties(r, c, visited, 4, i);
                        this.replace(3, i);
                    }
                }
            }
        }

        // Count area on the board
        for (var r = 1; r < 20; r++) {
            for (var c = 1; c < 20; c++) {
                if (this.pieces[r][c] == 1) {
                    blackScore++;
                }
                if (this.pieces[r][c] == 2) {
                    whiteScore++;
                }
            }
        }

        return [blackScore, whiteScore];
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

module.exports = BoardManager;
