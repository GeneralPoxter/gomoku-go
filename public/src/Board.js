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

        this.board.append("rect")
            .attr("x", 40)
            .attr("y", 40)
            .attr("height", "760")
            .attr("width", "760")
            .attr("fill", "transparent")
            .attr("stroke", "black")
            .attr("stroke-width", "1.5")
            .attr("stroke-dasharray", "760 0 0 760 0 760 760 0");

        for (var y = 40; y < 800; y += 40) {
            for (var x = 40; x < 800; x += 40) {
                if (x < 760 && y < 760) {
                    // Create squares
                    this.board.append("rect")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("height", "40")
                        .attr("width", "40")
                        .attr("fill", "transparent")
                        .attr("stroke", "black")
                        .attr("stroke-width", "1.5")
                        .attr("stroke-dasharray", "0 40 40 0 40 0 0 40");
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
                if (pieces[r][c] == 1 || pieces[r][c] == 2) {
                    circ.attr("fill", "#" + (0xffffff * (pieces[r][c] - 1)).toString(16));
                }
            }
        }
    }

}
