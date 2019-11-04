// Board display and function
class Board {
    // Constructor method
    constructor(mode) {
        // Initialize fields
        this.board = d3.select("#board");
        this.end = false;
        this.color = 0;
        this.mode = mode;
        this.pieces = [];
        for (var r = 0; r < 21; r++) {
            this.pieces.push(Array(21).fill(0));
        }
        this.ws = new WSManager();

        // Set up board
        document.getElementById("board").style.backgroundColor = "#fce195";
        this.render();
    }

    // Render board and pieces
    render() {
        // Clear board
        this.board.selectAll("circle").remove();

        for (var y = 0; y < 800; y += 40) {
            for (var x = 0; x < 800; x += 40) {
                if (x > 0 && y > 0) {
                    if (x < 760 && y < 760) {
                        // Create squares
                        this.board.append("rect")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("height", "40")
                            .attr("width", "40")
                            .attr("fill", "#fce195")
                            .attr("stroke-width", "1.5")
                            .attr("stroke", "black");
                    }
                    // Create circular pieces
                    var cur = this;
                    this.board.append("circle")
                        .attr("cx", x)
                        .attr("cy", y)
                        .attr("r", "19")
                        .attr("fill", "transparent")
                        .attr("stroke-width", "0.6")
                        .on("click", function() {
                            cur.addPiece.call(cur, this);
                        });
                }
            }
        }
    }

    // Add piece with given x and y coordinates
    convertPiece(x, y) {
        this.board.selectAll("circle").nodes().forEach(p => {
            var piece = d3.select(p);
            if (piece.attr("cx") == x && piece.attr("cy") == y) {
                this.addPiece(p);
            }
        });
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

            // Gomoku
            if (this.mode == "gomoku") {
                this.checkGomoku();
            }

            // Send move through WS, update color
            this.ws.send(this.color + " " + piece.attr("cx") + " " + piece.attr("cy"));
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
                console.log("Color: " + this.color);
                return;
            }
        });
    }

}