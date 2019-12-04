// Handles WebSocket server-side relations with client
const BoardManager = require("./BoardManager.js");
const boards = new BoardManager();
var rooms = [];
// Each game: [client (black player), client (white player), game type]
var games = [];

function connection(ws) {
    ws.on('message', function incoming(e) {
        // Display incoming client messages
        var message = JSON.parse(e);
        console.log('received from %d: %s', message.id, message.data);

        // Functionality for existing room
        if (rooms.includes(message.room)) {
            var i = rooms.indexOf(message.room);
            // Functionality for accepted clients
            if (games[i].includes(message.id) && games[i][2] == message.type) {
                // Functionality for client disconnect
                if (message.data.slice(0, 12) == "Disconnected") {
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
                    boards.updateBoard(i, message.data);
                    if (boards.checkGomoku(i, message.data)) {
                        ws.send("Win: " + message.color);
                    };
                }
            }

            // Accept incoming client if available
            else if ((games[i][0] == null || games[i][1] == null) && games[i][2] == message.type) {
                if (message.data.slice(0, 9) == "Connected") {
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
        else {
            rooms.push(message.room);
            games.push([null, null, message.type]);
            boards.newBoard();
            var color = Math.floor(Math.random() * 2);
            games[games.length - 1][color] = message.id;
            ws.send(color);
        }
    });
}
module.exports = connection;