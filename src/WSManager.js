// Handles WebSocket server-side relations with client
const BoardManager = require("./BoardManager.js");
const boards = new BoardManager();
var clients = {};
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
                // Find other client's ws
                if (games[i][0] != null && games[i][1] != null) {
                    var otherWS = clients[games[i][0]];
                    if (message.color == 0) {
                        otherWS = clients[games[i][1]];
                    }
                }

                // Functionality for client disconnect
                if (message.msg.slice(0, 12) == "Disconnected") {
                    if (games[i][0] == message.id) {
                        games[i][0] = null;
                    }
                    else {
                        games[i][1] = null;
                    }
                    
                    delete clients[message.id];

                    // Delete room if both clients disconnect
                    if (games[i][0] == null && games[i][1] == null) {
                        rooms.splice(i, 1);
                        games.splice(i, 1);
                        boards.deleteBoard(i);
                    }
                    // Inform other client that opponent disconnected
                    else {
                        otherWS.send("Opponent disconnected");
                        games[i][3] += 2;
                    }
                }

                // Functionality for moves
                else if (message.color == games[i][3]) {
                    // Format move
                    var move = message.msg.split(' ');
                    for (var j = 0; j < 3; j++) {
                        move[j] = parseInt(move[j], 10);
                    }
                    
                    // Check if the move is valid
                    if (boards.boards[i][move[1]][move[2]] == 0) {
                        // Make move and update boards
                        var move = message.msg.split(' ');
                        for (var j = 0; j < 3; j++) {
                            move[j] = parseInt(move[j], 10);
                        }
                        boards.updateBoard(i, move);
                        ws.send(JSON.stringify(boards.boards[i]));
                        otherWS.send(JSON.stringify(boards.boards[i]));

                        // Check win
                        if (boards.checkGomoku(i, move)) {
                            ws.send("Win: " + message.color);
                            otherWS.send("Win: " + message.color);
                            games[i][3] = 2;
                        }
                        // Update turns
                        else {
                            games[i][3] = (games[i][3] + 1) % 2;
                        }

                    }
                }
            }

            // Accept incoming client if available
            else if ((games[i][0] == null || games[i][1] == null) && !(games[i].includes(message.id)) && games[i][2] == message.type) {
                if (message.msg.slice(0, 9) == "Connected") {
                    var color = games[i].indexOf(null);
                    games[i][color] = message.id;
                    clients[message.id] = ws;
                    ws.send(color);
                    // Find other client's ws
                    var otherWS = clients[games[i][(color + 1) % 2]];
                    // Set up if game has not started
                    if (games[i][3] == -1) {
                        otherWS.send("Opponent has connected");
                        games[i][3] = 0;
                    }
                    // Update client if game has started
                    else {
                        ws.send(JSON.stringify(boards.boards[i]));
                        otherWS.send("Opponent rejoined");
                        games[i][3] -= 2;
                    }
                    ws.send("T" + games[i][3].toString(10));
                    ws.send("Opponent has connected");
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
            games.push([null, null, message.type, -1]);
            boards.newBoard();
            var color = Math.floor(Math.random() * 2);
            games[games.length - 1][color] = message.id;
            clients[message.id] = ws;
            ws.send(color);
            ws.send("T0");
            ws.send("Room created");
        }
    });
}
module.exports = connection;