// Handles WebSocket server-side relations with client
const BoardManager = require("./BoardManager.js");
const boards = new BoardManager();
var clients = {};
var rooms = [];
// Each game: [client (black player), client (white player), game type, turn color]
var games = [];

function connection(ws) {
    ws.on('message', function incoming(e) {
        // Try-catch to prevent server from crashing
        try {
            // Parse incoming messages
            var msg = JSON.parse(e);
            var id = msg.id;
            var room = msg.room;
            var type = msg.type;
            var cmd = msg.cmd;
            var val = msg.val;

            // Display incoming messages
            console.log('from %d: %s %s', msg.id, cmd, val);

            // Functionality for existing room and accepted client
            if (rooms.includes(room)) {
                var i = rooms.indexOf(room);

                if (games[i].includes(id) && games[i][2] == type) {
                    var color = games[i].indexOf(id);

                    // Find other client's ws
                    if (games[i][0] != null && games[i][1] != null) {
                        var otherWS = clients[games[i][(color + 1) % 2]];
                    }

                    // Functionality for moves
                    if (cmd == "move" && color == games[i][3]) {
                        // Parse move
                        var move = val.split(' ');
                        var r = parseInt(move[0], 10);
                        var c = parseInt(move[1], 10);

                        // Check if the move is valid
                        if (boards.boards[i][r][c] == 0) {
                            // Update server and client boards
                            boards.updateBoard(i, color, r, c);
                            send(ws, 'update', boards.boards[i]);
                            send(otherWS, 'update', boards.boards[i]);

                            // Check win and end game
                            if (boards.checkGomoku(i, color, r, c)) {
                                send(ws, 'end', "You won");
                                send(otherWS, 'end', "You lost");
                                games[i][3] = 2;
                            }
                            // Update turns
                            else {
                                games[i][3] = (games[i][3] + 1) % 2;
                            }
                        }
                    }

                    // Functionality for chatroom
                    else if (message.cmd == "chat") {}
                }

                // Connect incoming client if room capacity available
                else if ((games[i][0] == null || games[i][1] == null) && !(games[i].includes(id)) && games[i][2] == type) {
                    // Assign color and ws
                    var color = games[i].indexOf(null);
                    games[i][color] = id;
                    clients[id] = ws;

                    // Find other client's ws
                    var otherWS = clients[games[i][(color + 1) % 2]];

                    // Set up if game has not started
                    if (games[i][3] == -1) {
                        send(otherWS, 'disp', "Opponent has connected");
                        games[i][3] = 0;
                    }

                    // Update client if game has started
                    else {
                        send(ws, 'update', boards.boards[i]);
                        send(otherWS, 'disp', "Opponent rejoined");
                        games[i][3] -= 2;
                    }

                    // Send client updated information
                    send(ws, 'color', color);
                    send(ws, 'turn', games[i][3]);
                    send(ws, 'disp', "Opponent has connected");
                }

                // Disconnect incoming client if room capacity reached
                else {
                    ws.close();
                }
            }

            // Connect incoming client and create new room
            else if (room != null && (type == "gomoku" || type == "go")) {
                // Create new room
                rooms.push(room);
                games.push([null, null, type, -1]);
                boards.newBoard();

                // Assign color and ws
                var color = Math.floor(Math.random() * 2);
                games[games.length - 1][color] = id;
                clients[id] = ws;

                // Send client information
                send(ws, 'color', color);
                send(ws, 'turn', 0);
                send(ws, 'disp', "Room created");
            }
        } catch (error) {
            return;
        }
    });

    // Functionality for client disconnect
    ws.on('close', function close(e) {
        // Find id
        var id;
        for (let [key, value] of Object.entries(clients)) {
            if (value == ws) {
                id = parseFloat(key);
                break;
            }
        }

        // Find room
        for (var i = 0; i < games.length; i++) {
            if (games[i].includes(id)) {
                console.log("to %d: %s %s", id, 'disconnect', rooms[i]);
                var color = games[i].indexOf(id);

                // Find other client's ws
                if (games[i][0] != null && games[i][1] != null) {
                    var otherWS = clients[games[i][(color + 1) % 2]];
                }

                // Disconnect client
                if (games[i][0] == id) {
                    games[i][0] = null;
                } else {
                    games[i][1] = null;
                }

                // Delete room if both clients disconnect
                if (games[i][0] == null && games[i][1] == null) {
                    rooms.splice(i, 1);
                    games.splice(i, 1);
                    boards.deleteBoard(i);
                }
                // Inform other client that opponent disconnected
                else {
                    send(otherWS, 'disp', "Opponent disconnected");
                    games[i][3] += 2;
                }

                return;
            }

        }
    });
}

// Send messages to client
function send(ws, c, v) {
    data = {
        cmd: c,
        val: v
    };
    ws.send(JSON.stringify(data));
}

module.exports = connection;