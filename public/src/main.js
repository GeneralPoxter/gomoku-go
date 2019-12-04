// Start game
var game;
var board;
var ws; 
function main(type, mode) {
    board = new Board();
    if (mode == "local") {
        game = new Game("gomoku");
        board.render(game.pieces, function() {game.addPiece(this)});
    }
    else {
        board.render(ws.pieces, function(){});
    }
}

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