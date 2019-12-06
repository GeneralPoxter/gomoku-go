// Initialize fields
var game;
var board;
var ws; 
var text = document.getElementById("status");

// Start game
function main(type, mode) {
    board = new Board();
    if (mode == "local") {
        text.innerHTML = "Local game";
        game = new Game("gomoku");
        board.render(game.pieces, function() {game.addPiece(this)});
    }
    else {
        board.render(ws.pieces, function(){var piece = d3.select(this); ws.send(ws.data.color + " " + (piece.attr("cy") / 40 - 1) + " " + (piece.attr("cx") / 40 - 1))});
    }
}

// Connect to room
function connect(room, type) {
    if (ws != null) {
        if (ws.wsc.readyState == 1) {
             ws.closeWS();
        }
        ws = null;
    }
    if (room.length > 0) {
        ws = new WSManager(room, type);
        main('gomoku', 'online');
    }
    else {
        main('gomoku','local');
    }
}