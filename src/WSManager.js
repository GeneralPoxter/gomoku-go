// Handles WebSocket server-side relations with client
const BoardManager = require("./BoardManager.js");
const boards = new BoardManager();
var rooms = [];
// Each game: [client (black player), client (white player), game type, turn color]
var games = [];

function connection(ws) {
    ws.on('message', function incoming(e) {
        // Filter incoming messages
        try {
            var message = JSON.parse(e);
        }
        catch(error) {
            return;
        }

        // Display incoming messages
        console.log('received from %d: %s', message.id, message.msg);

        // Functionality for existing room
        if (rooms.includes(message.room)) {
            var i = rooms.indexOf(message.room);
            // Functionality for accepted clients
            if (games[i].includes(message.id) && games[i][2] == message.type) {
                // Functionality for client disconnect
                if (message.msg.slice(0, 12) == "Disconnected") {
                    if (games[i][0] == message.id) {
                        games[i][0] = null;
                    }
                    else {
                        games[i][1] = null;
                    }

                    // Delete room if both clients disconnect
                    if (games[i][0] == null && games[i][1] == null) {
                        rooms.splice(i, 1);
                        games.splice(i, 1);
                        boards.deleteBoard(i);
                    }
                }
                // Functionality for moves
                else {
                    var move = message.msg.split(' ');
                    for (var j = 0; j < 3; j++) {
                        move[j] = parseInt(move[j], 10);
                    }
                    boards.updateBoard(i, move);
                    if (boards.checkGomoku(i, move)) {
                        ws.send("Win: " + message.color);
                    };
                    ws.send(JSON.stringify(boards.boards[i]));
                }
            }

            // Accept incoming client if available
            else if ((games[i][0] == null || games[i][1] == null) && games[i][2] == message.type) {
                if (message.msg.slice(0, 9) == "Connected") {
                    var color = games[i].indexOf(null);
                    games[i][color] = message.id;
                    ws.send(color);
                }
            }

            // Disconnect incoming client if room capacity reached
            else {
                ws.send("Disconnect");
            }
        }

        // Create new room, add incoming client
        else if (message.room != null) {
            rooms.push(message.room);
            games.push([null, null, message.type, 0]);
            boards.newBoard();
            var color = Math.floor(Math.random() * 2);
            games[games.length - 1][color] = message.id;
            ws.send(color);
        }
    });
}
module.exports = connection;