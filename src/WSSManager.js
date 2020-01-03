// Handles WebSocket server-side relations with client
const BoardManager = require("./BoardManager.js");
var clients = {};
// Each game: { [room name, game type]: [client (black player), client (white player), turn color] }
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

            var i = [room, type];

            // Functionality for existing room and accepted client
            if (games[i] != null) {
                if (games[i].includes(id)) {
                    var color = games[i].indexOf(id);
                    var otherWS;

                    // Find other client's ws
                    if (games[i][0] != null && games[i][1] != null) {
                        otherWS = clients[games[i][(color + 1) % 2]];
                    }

                    // Functionality for moves
                    if (cmd == "move" && color == games[i][2]) {

                        if (val == "pass" && type == "go") {
                            boards[i].passes ++;
                            games[i][2] = (games[i][2] + 1) % 2;
                            send(ws, 'update', boards[i].pieces);
                            send(otherWS, 'update', boards[i].pieces);
                            
                            if (boards[i].passes == 2) {
                                send(ws, 'end', "Game has ended");
                                send(otherWS, 'end', "Game has ended");
                                games[i][2] = 2;
                            }
                            return;
                        }

                        // Parse move
                        var move = val.split(' ');
                        var r = parseInt(move[0], 10);
                        var c = parseInt(move[1], 10);

                        // Check if the move is valid
                        if (boards[i].pieces[r][c] == 0) {
                            // Update server and client boards
                            boards[i].updateBoard(r, c, color);
                            
                            // Check captures
                            if (type == "go") {
                                if (boards[i].checkCapture(r, c, color)) {
                                    boards[i].passes = 0;
                                }
                                else {
                                    return;
                                }
                            }

                            // Update turn and client boards
                            games[i][2] = (games[i][2] + 1) % 2;
                            send(ws, 'update', boards[i].pieces);
                            send(otherWS, 'update', boards[i].pieces);

                            // Check win cases
                            if (type == "gomoku") {
                                if (boards[i].checkGomoku(r, c, color)) {
                                    games[i][2] = 4;
                                    send(ws, 'end', "You won");
                                    send(otherWS, 'end', "You lost");
                                }
                            }

                            return;
                        }

                        return;
                    }

                    // Functionality for chatroom
                    if (cmd == "chat") {
                        // Sanitize inputs
                        val = val.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&#034;").replace(/'/g, "&#039;");

                        send(ws, 'chat', "You: " + val);
                        if (otherWS != null) {
                            send(otherWS, 'chat', "Opponent: " + val);
                        }
                        return;
                    }

                    return;
                }

                // Connect incoming client if room capacity available
                if ((games[i][0] == null || games[i][1] == null) && !games[i].includes(id)) {
                    // Assign color and ws
                    var color = games[i].indexOf(null);
                    games[i][color] = id;
                    clients[id] = ws;

                    // Find other client's ws
                    var otherWS = clients[games[i][(color + 1) % 2]];

                    // Set up if game has not started
                    if (games[i][2] == -1) {
                        games[i][2] = 0;
                        send(otherWS, 'chat', "<i>Opponent has connected</i>");
                    } else {
                        games[i][2] -= 2;
                        send(otherWS, 'chat', "<i>Opponent rejoined</i>");
                    }

                    // Send client updated information
                    send(ws, 'update', boards[i].pieces);
                    send(ws, 'color', color);

                    // Check if game has ended
                    if (games[i][2] == 4) {
                        send(ws, 'end', "Game has ended");
                    } else {
                        send(ws, 'turn', games[i][2]);
                        send(ws, 'chat', "<i>Joined room</i><br /><i>Opponent has connected</i>");
                    }

                    return;
                }
                
                // Disconnect incoming client if room capacity reached
                ws.close();
                return;
            }

            // Connect incoming client and create new room
            if (room != null && (type == "gomoku" || type == "go")) {
                // Create new room
                games[i] = [null, null, -1];
                boards[i] = new BoardManager();

                // Assign color and ws
                var color = Math.floor(Math.random() * 2);
                games[i][color] = id;
                clients[id] = ws;

                // Send client information
                send(ws, 'color', color);
                send(ws, 'turn', 0);
                send(ws, 'chat', "<i>Room created</i>");
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
                    send(otherWS, 'chat', "<i>Opponent disconnected</i>");
                    games[room][2] += 2;
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
