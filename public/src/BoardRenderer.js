// Board display and function
class BoardRenderer {
    // Constructor method
    constructor() {
        this.board = d3.select("#board");
        this.board.append("image")
        this.pieces = [];
        this.pieces.push(Array(21).fill(9));
        for (var r = 0; r < 19; r++) {
            this.pieces.push([9].concat(Array(19).fill(0), [9]));
        }
        this.pieces.push(Array(21).fill(9));
        this.stars = [4, 10, 16];
    }

    // Render board and pieces
    render(pieces, func) {
        // Clear board
        this.board.selectAll("circle, image, rect").remove();

        this.board.append("image")
            .attr("xlink:href", "/img/wood.jpg")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", 800)
            .attr("width", 800);

        this.board.append("rect")
            .attr("x", 40)
            .attr("y", 40)
            .attr("height", "720")
            .attr("width", "720")
            .attr("fill", "transparent")
            .attr("stroke", "black")
            .attr("stroke-width", "2")
            .attr("stroke-dasharray", "720 0 0 720 0 720 720 0");

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
                        .attr("stroke-width", "2")
                        .attr("stroke-dasharray", "0 40 40 0 40 0 0 40");
                }
                
                var r = y / 40;
                var c = x / 40;

                if (this.stars.includes(r) && this.stars.includes(c)) {
                    this.board.append("circle")
                        .attr("cx", x)
                        .attr("cy", y)
                        .attr("r", "4")
                        .attr("fill", "black");
                }

                // Highlight new piece
                if (pieces[r][c] != this.pieces[r][c] && (pieces[r][c] == 1 || pieces[r][c] == 2)) {
                    this.board.append("circle")
                        .attr("cx", x)
                        .attr("cy", y)
                        .attr("r", "19.5")
                        .attr("fill", "green")
                        .attr("filter", "url(#highlight)");
                }

                // Create circular pieces
                var circ = this.board.append("circle");
                circ
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("r", "19")
                    .attr("fill", "transparent")
                    .on("click", func);

                if (pieces[r][c] == 1 || pieces[r][c] == 2) {
                    circ.attr("fill", "#" + (0xffffff * (pieces[r][c] - 1)).toString(16));
                }

            }
        }
        
        this.pieces = JSON.parse(JSON.stringify(pieces));
    }

}
