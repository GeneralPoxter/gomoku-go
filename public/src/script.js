// Obsolete non-OOP original version of code
// Ignore, for reference and backup only
function main(mode) {
    end = false;
    var color = 0;
    var dir = [[[1, 0], [-1, 0]], [[0, 1], [0, -1]], [[1, 1], [-1, -1]], [[1, -1], [-1, 1]]];
    var pieces = [[], []];
    for (var r = 0; r < 2; r++) {
        for (var c = 0; c < 21; c++) {
            pieces[r].push(Array(21).fill(0));
        }
    }
    img.style.height = "0";
    img.style.width = "0";
    document.getElementById("board").style.backgroundColor = "#fce195";
    board.selectAll("circle").remove();
    for (var y = 0; y < 800; y += 40) {
        for (var x = 0; x < 800; x += 40) {
            if (x > 0 && y > 0) {
                if (x < 760 && y < 760) {
                    board.append("rect")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("height", "40")
                        .attr("width", "40")
                        .attr("fill", "#fce195")
                        .attr("stroke-width", "1.5")
                        .attr("stroke", "black");
                }
                board.append("circle")
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("r", "19")
                    .attr("fill", "transparent")
                    .attr("stroke-width", "0.6")
                    .attr("adj", [0, 0, 0, 0, 0, 0, 0, 0])
                    .on("click", function() {
                        var piece = d3.select(this);
                        if (piece.attr("fill") == "transparent" && !end) {
                            var r = piece.attr("cy") / 40;
                            var c = piece.attr("cx") / 40;
                            piece.attr("fill", "#" + (0xffffff * color).toString(16));
                            piece.attr("stroke", "#808080");
                            pieces[color][r][c] = 1;
                            if (mode == "gomoku") {
                                dir.forEach(function(d) {
                                    var line = 1;
                                    for (var i = 0; i < 2; i++) {
                                        var m = 1;
                                        while (pieces[color][r + m * d[i][0]][c + m * d[i][1]] == 1) {
                                            line++;
                                            m++;
                                        }
                                    }
                                    if (line == 5) {
                                        end = true;
                                        console.log("Color: " + color);
                                        return;
                                    }
                                });
                            }
                            color = (color + 1) % 2;
                        }
                    });
            }
        }
    }
}

var board = d3.select("#board");
var img = document.getElementById("an");