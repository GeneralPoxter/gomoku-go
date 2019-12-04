// Game manager class
class Game {
    // Constructor method
    constructor(mode) {
        // Initialize fields
        this.end = false;
        this.color = 0;
        this.mode = mode;
        this.turn = true;
        this.pieces = [];
        for (var r = 0; r < 21; r++) {
            this.pieces.push(Array(21).fill(0));
        }
    }

     // Add piece to board
    addPiece(p) {
        var piece = d3.select(p);
        if (piece.attr("fill") == "transparent" && !this.end) {
            // Change piece color from transparent, add piece to array pieces
            this.r = piece.attr("cy") / 40;
            this.c = piece.attr("cx") / 40;
            piece.attr("fill", "#" + (0xffffff * this.color).toString(16));
            piece.attr("stroke", "#808080");
            this.pieces[this.r][this.c] = this.color + 1;

            // Check move and update color
            if (this.mode == "gomoku") {
                this.checkGomoku();
            }
            this.color = (this.color + 1) % 2;
        }
    }

    // Check for 5 in a row
    checkGomoku() {
        // Array of possible orientations for 5 in a row
        var dir = [[[1, 0], [-1, 0]], [[0, 1], [0, -1]], [[1, 1], [-1, -1]], [[1, -1], [-1, 1]]];

        dir.forEach(d => {
            var line = 1;
            // Count how many pieces in each direction
            for (var i = 0; i < 2; i++) {
                var m = 1;
                while (this.pieces[this.r + m * d[i][0]][this.c + m * d[i][1]] == this.color + 1) {
                    line++;
                    m++;
                }
            }

            // End game
            if (line == 5) {
                this.end = true;
                return;
            }
        });
    }
}