// Board display and function
class Board {
    // Constructor method
    constructor() {
        // Initialize fields
        this.board = d3.select("#board");
    }

    // Render board and pieces
    render(pieces, func) {
        // Clear board
        this.board.selectAll("*").remove();

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
                            .attr("fill", "transparent")
                            .attr("stroke-width", "1.5")
                            .attr("stroke", "black");
                    }
                    // Create circular pieces
                    var circ = this.board.append("circle");
                    circ
                        .attr("cx", x)
                        .attr("cy", y)
                        .attr("r", "19")
                        .attr("fill", "transparent")
                        .attr("stroke-width", "0.6")
                        .on("click", func);
                    var r = circ.attr("cy") / 40;
                    var c = circ.attr("cx") / 40;
                    if (pieces[r][c] != 0) {
                        circ.attr("fill", "#" + (0xffffff * (pieces[r][c] - 1)).toString(16));
                    }
                }
            }
        }
    }

}