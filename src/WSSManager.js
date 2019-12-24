// Handles WebSocket server-side relations with client
const BoardManager = require("./BoardManager.js");
var clients = {};
// Each game: { room name: [client (black player), client (white player), game type, turn color] }
var games = {};
var boards = {};

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
            if (games[room] != null) {
                if (games[room].includes(id) && games[room][2] == type) {
                    var color = games[room].indexOf(id);

                    // Find other client's ws
                    if (games[room][0] != null && games[room][1] != null) {
                        var otherWS = clients[games[room][(color + 1) % 2]];
                    }

                    // Functionality for moves
                    if (cmd == "move" && color == games[room][3]) {

                        if (val == "pass" && type == "go") {
                            boards[room].passes ++;
                            games[room][3] = (games[room][3] + 1) % 2;
                            send(ws, 'update', boards[room].pieces);
                            send(otherWS, 'update', boards[room].pieces);
                            
                            if (boards[room].passes == 2) {
                                send(ws, 'end', "Game has ended");
                                send(otherWS, 'end', "Game has ended");
                                games[room][3] = 2;
                            }
                            return;
                        }

                        // Parse move
                        var move = val.split(' ');
                        var r = parseInt(move[0], 10);
                        var c = parseInt(move[1], 10);

                        // Check if the move is valid
                        if (boards[room].pieces[r][c] == 0) {
                            // Update server and client boards
                            boards[room].updateBoard(r, c, color);

                            if (type == "go") {
                                // Check captures
                                boards[room].checkCapture(r, c, color);
                                boards[room].passes = 0;
                            }

                            // Update turn and client boards
                            games[room][3] = (games[room][3] + 1) % 2;
                            send(ws, 'update', boards[room].pieces);
                            send(otherWS, 'update', boards[room].pieces);

                            if (type == "gomoku") {
                                // Check win and end game
                                if (boards[room].checkGomoku(r, c, color)) {
                                    games[room][3] = 2;
                                    send(ws, 'end', "You won");
                                    send(otherWS, 'end', "You lost");
                                }
                            } else {
                                // Todo
                            }
                            
                            return;
                        }

                        // Update turn and client boards
                        games[room][3] = (games[room][3] + 1) % 2;
                        send(ws, 'update', boards[room].pieces);
                        send(otherWS, 'update', boards[room].pieces);
                        return;
                    }

                    // Functionality for chatroom
                    if (cmd == "chat") {
                        return;
                    }

                    return;
                }

                // Connect incoming client if room capacity available
                if ((games[room][0] == null || games[room][1] == null) && !games[room].includes(id) && games[room][2] == type) {
                    // Assign color and ws
                    var color = games[room].indexOf(null);
                    games[room][color] = id;
                    clients[id] = ws;

                    // Find other client's ws
                    var otherWS = clients[games[room][(color + 1) % 2]];

                    // Set up if game has not started
                    if (games[room][3] == -1) {
                        send(otherWS, 'disp', "Opponent has connected");
                        games[room][3] = 0;
                    }

                    // Update client if game has started
                    else {
                        send(ws, 'update', boards[room].pieces);
                        send(otherWS, 'disp', "Opponent rejoined");
                        games[room][3] -= 2;
                    }

                    // Send client updated information
                    send(ws, 'color', color);
                    send(ws, 'turn', games[room][3]);
                    send(ws, 'disp', "Opponent has connected");
                    return;
                }
                
                // Disconnect incoming client if room capacity reached
                ws.close();
                return;
            }

            // Connect incoming client and create new room
            if (room != null && (type == "gomoku" || type == "go")) {
                // Create new room
                games[room] = [null, null, type, -1];
                boards[room] = new BoardManager();

                // Assign color and ws
                var color = Math.floor(Math.random() * 2);
                games[room][color] = id;
                clients[id] = ws;

                // Send client information
                send(ws, 'color', color);
                send(ws, 'turn', 0);
                send(ws, 'disp', "Room created");
                return;
            }
        } catch (error) {
            console.log(error);
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
        var rooms = Object.keys(games);
        for (var i = 0; i < rooms.length; i++) {
            if (games[rooms[i]].includes(id)) {
                var room = rooms[i];
                console.log("to %d: %s %s", id, 'disconnect', room);
                var color = games[room].indexOf(id);

                // Find other client's ws
                if (games[room][0] != null && games[room][1] != null) {
                    var otherWS = clients[games[room][(color + 1) % 2]];
                }

                // Disconnect client
                if (games[room][0] == id) {
                    games[room][0] = null;
                } else {
                    games[room][1] = null;
                }

                // Delete room if both clients disconnect
                if (games[room][0] == null && games[room][1] == null) {
                    delete games[room];
                    delete boards[room];
                }
                // Inform other client that opponent disconnected
                else {
                    send(otherWS, 'disp', "Opponent disconnected");
                    games[room][3] += 2;
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