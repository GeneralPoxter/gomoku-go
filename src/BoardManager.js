// Board manager for server-side game management
class BoardManager {
    constructor() {
        this.boards = [];
    }

    newBoard() {
        var board = [];
        for (var r = 0; r < 21; r++) {
            board.push(Array(21).fill(0));
        }
        this.boards.push(board);
    }

    updateBoard(board, color, r, c) {
        this.boards[board][r][c] = color + 1;
        this.started = true;
    }

    deleteBoard(board) {
        this.boards.splice(board, 1);
    }

    // Check for 5 in a row
    checkGomoku(board, color, r, c) {
        // Array of possible orientations for 5 in a row
        var dir = [[[1, 0], [-1, 0]], [[0, 1], [0, -1]], [[1, 1], [-1, -1]], [[1, -1], [-1, 1]]];

        for (var i = 0; i < 4; i++) {
            var line = 1;
            var d = dir[i];

            // Count how many pieces in each direction
            for (var j = 0; j < 2; j++) {
                var m = 1;
                while (this.boards[board][r + m * d[j][0]][c + m * d[j][1]] == color + 1) {
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

}

module.exports = BoardManager;