// Initialize fields
var game;
var board;
var ws;

// Start game
function main(mode, type) {
    board = new Board();
    if (mode == "local") {
        game = new Game(type);
        board.render(game.pieces, function() {
            game.addPiece(this)
        });
    } else {
        ws.renderBoard();
    }
}

// Connect to room
function connect(room, type) {
    if (ws != null) {
        if (ws.wsc.readyState < 2) {
            ws.wsc.close();
        }
        ws = null;
    }
    if (room.length > 0) {
        ws = new WSManager(room, type);
        main('online', type);
    } else {
        main('local', type);
    }
}