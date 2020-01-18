// Initialize fields
var game;
var ws;

// Start game
function main(mode, type) {
    board = new BoardRenderer();

    // Set up chat room
    document.getElementById("chatText").innerHTML = "";
    chatDisp("Chat room - Type '/cmd' for commands");

    if (mode == "local") {
        game = new Game(type);
        game.renderBoard();
        chatDisp("Chat room disabled for local game, commands still available");
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
    } else if (game.type == "go" && !game.end) {
        game.pass();
    }
}

// Chat functionality
function chat(msg) {
    document.getElementById("chatInput").value = "";
    if (ws != null) {
        ws.send('chat', msg);
    } else if (!game.end) {
        game.cmd(msg);
    }
}

// Chat display
function chatDisp(msg) {
    var ele = document.createElement("p");
    ele.innerText = msg;
    ele.style.fontStyle = "italic";
    document.getElementById("chatText").appendChild(ele);
}