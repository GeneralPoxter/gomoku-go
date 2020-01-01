// Initialize fields
var game;
var ws;

// Start game
function main(mode, type) {
    board = new Board();
    if (mode == "local") {
        game = new Game(type);
        game.renderBoard();
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
        ws = new WSCManager(room, type);
        main('online', type);
    } else {
        main('local', type);
    }
}

// Pass functionaliy
function pass() {
    if (ws != null && ws.type == "go") {
        ws.send('move', "pass");
    }
    else if (game.type == "go" && !game.end) {
        game.pass();
    }
}
