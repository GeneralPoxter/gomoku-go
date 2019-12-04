// Board manager for server-side game management
class BoardManager {
    constructor() {
        this.boards = [];
    }

    newBoard() {
        for (var r = 0; r < 21; r++) {
            this.boards.push(Array(21).fill(0));
        }
    }

    updateBoard(board, move) {
        this.boards[board][move[1]][move[2]] = move[0] + 1;
    }

    deleteBoard(index) {
        this.boards.splice(index, 1);
    }

    checkGomoku(board, move) {
        // Array of possible orientations for 5 in a row
        var dir = [[[1, 0], [-1, 0]], [[0, 1], [0, -1]], [[1, 1], [-1, -1]], [[1, -1], [-1, 1]]];

        dir.forEach(d => {
            var line = 1;
            // Count how many pieces in each direction
            for (var i = 0; i < 2; i++) {
                var m = 1;
                while (this.board[board][move[1] + m * d[i][0]][move[2] + m * d[i][1]] == move[0] + 1) {
                    line++;
                    m++;
                }
            }

            if (line == 5) {
                return true;
            }
        });

        return false;
    }

}
module.exports = BoardManager;