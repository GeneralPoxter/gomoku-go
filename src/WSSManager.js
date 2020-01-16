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
                    var colorName = ["Black", "White"][color];
                    var otherWS;
                    var otherColor;

                    // Find other client's ws
                    if (games[i][0] != null && games[i][1] != null) {
                        otherWS = clients[games[i][(color + 1) % 2]];
                        otherColor = ["Black", "White"][(color + 1) % 2];
                    }

                    // Functionality for moves
                    if (cmd == "move" && color == games[i][2]) {

                        if (val == "pass" && type == "go") {
                            boards[i].passes ++;
                            boards[i].updatePrev();
                            games[i][2] = (games[i][2] + 1) % 2;

                            // Check draw and takeback
                            if (boards[i].drawColor != null) {
                                boards[i].drawColor = null;
                                sendRes(ws, otherWS, colorName + " cancelled the draw offer");
                            }
                            if (boards[i].takebackColor != null) {
                                boards[i].takebackColor = null;
                                sendRes(ws, otherWS, colorName + " cancelled the takeback offer");
                            }

                            send(ws, 'update', boards[i].pieces);
                            send(otherWS, 'update', boards[i].pieces);
                            
                            if (boards[i].passes == 2) {
                                send(ws, 'end', "Game ended");
                                send(otherWS, 'end', "Game ended");
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
                            // Update server
                            boards[i].updateBoard(r, c, color);

                            // Check draw and takeback
                            if (boards[i].drawColor != null) {
                                boards[i].drawColor = null;
                                sendRes(ws, otherWS, colorName + " cancelled the draw offer");
                            }
                            if (boards[i].takebackColor != null) {
                                boards[i].takebackColor = null;
                                sendRes(ws, otherWS, colorName + " cancelled the takeback offer");
                            }
                            
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
                                    sendRes(ws, otherWS, "Game ended - " + colorName + " won");
                                }
                            }

                            return;
                        }

                        return;
                    }

                    // Functionality for chat room
                    if (cmd == "chat") {
                        if (val.length == 0) {
                            return;
                        }
                        
                        if (val == "/cmd") {
                            send(ws, 'res', ["/cmd: display commands\n/forfeit: forfeit the game\n/draw: offer draw, opponent must accept\n/takeback: offer takeback, reverting the last move, opponent must accept\n/accept: accept offers\n/reject: reject offers", "italic"]);
                            return;
                        }

                        if (val == "/forfeit") {
                            if (games[i][2] == 0 || games[i][2] == 1) {
                                games[i][2] = 4;
                                sendRes(ws, otherWS, colorName + " forfeited");
                                send(ws, 'end', "You lost");
                                send(otherWS, 'end', "You won");
                                sendRes(ws, otherWS, "Game ended - " + otherColor + " won");
                            }
                            return;
                        }

                        if (val == "/draw") {
                            if (games[i][2] == 0 || games[i][2] == 1) {
                                if (boards[i].drawColor == color) {
                                    send(ws, 'res', "Unable to offer draw, draw offer in progress");
                                    return;
                                }
                                else if (boards[i].drawColor == (color + 1) % 2) {
                                    val = "/accept";
                                }
                                else {
                                    if (boards[i].takebackColor != null) {
                                        send(ws, 'res', "Unable to offer draw, takeback offer in progress");
                                    }
                                    else {
                                        boards[i].drawColor = color;
                                        sendRes(ws, otherWS, colorName + " offered a draw\n" + otherColor + " can accept with /accept or /draw and can reject with /reject\n Offer can be cancelled with a move");
                                    }
                                    return;
                                }
                            }
                            else {
                                return;
                            }
                        }

                        if (val == "/takeback") {
                            if (games[i][2] == 0 || games[i][2] == 1) {
                                if (boards[i].takebackColor == color) {
                                    send(ws, 'res', "Unable to offer takeback, takeback offer in progress");
                                    return;
                                }
                                else if (boards[i].takebackColor == (color + 1) % 2) {
                                    val = "/accept";
                                }
                                else {
                                    if (boards[i].drawColor != null) {
                                        send(ws, 'res', "Unable to offer takeback, draw offer in progress");
                                    }
                                    else if (boards[i].prevPieces.length < 2) {
                                        send(ws, 'res', "No takebacks allowed on first move or first move since last takeback, command ignored");
                                    }
                                    else {
                                        boards[i].takebackColor = color;
                                        sendRes(ws, otherWS, colorName + " offered a takeback\n" + otherColor + " can accept with /accept or /takeback and can reject with /reject\n Offer can be cancelled with a move")
                                    }
                                    return;
                                }
                            }
                            else {
                                return;
                            }
                        }

                        if (val == "/accept") {
                            if (games[i][2] == 0 || games[i][2] == 1) {
                                if (boards[i].drawColor == (color + 1) % 2) {
                                    games[i][2] = 4;
                                    sendRes(ws, otherWS, colorName + " accepted the draw offer");
                                    send(ws, 'end', "Game ended");
                                    send(otherWS, 'end', "Game ended");
                                    sendRes(ws, otherWS, "Game ended in a draw");
                                }
                                else if (boards[i].takebackColor == (color + 1) % 2) {
                                    boards[i].takebackColor = null;
                                    sendRes(ws, otherWS, colorName + " accepted the takeback offer");
                                    boards[i].pieces = JSON.parse(JSON.stringify(boards[i].prevPieces[0]));
                                    boards[i].prevPieces = [];
                                    send(ws, 'update', boards[i].pieces);
                                    send(otherWS, 'update', boards[i].pieces);
                                }
                                else {
                                    send(ws, 'res', "No offer to accept, command ignored");
                                }
                                return;
                            }
                            return;
                        }

                        if (val == "/reject") {
                            if (games[i][2] == 0 || games[i][2] == 1) {
                                if (boards[i].drawColor == (color + 1) % 2) {
                                    boards[i].drawColor = null;
                                    sendRes(ws, otherWS, colorName + " rejected the draw offer");
                                }
                                else if (boards[i].takebackColor == (color + 1) % 2) {
                                    boards[i].takebackColor = null;
                                    sendRes(ws, otherWS, colorName + "rejected the takeback offer");
                                }
                                else {
                                    send(ws, 'res', "No offer to reject, command ignored");
                                }
                                return;
                            }
                            return;
                        }

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
                        send(otherWS, 'res', "Opponent connected");
                    } else {
                        games[i][2] -= 2;
                        send(otherWS, 'res', "Opponent rejoined");
                    }

                    // Send client updated information
                    send(ws, 'update', boards[i].pieces);
                    send(ws, 'color', color);

                    // Check if game has ended
                    if (games[i][2] == 4) {
                        send(ws, 'end', "Game ended");
                    } else {
                        send(ws, 'turn', games[i][2]);
                        send(ws, 'res', "Connected to room " + room);
                        send(ws, 'res', "Opponent connected");
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
                send(ws, 'res', "Room " + room + " created");
                send(ws, 'res', "All commands beside /cmd only active when both players connected\nDraw and takeback offers can only be sent on your turn");
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
                    send(otherWS, 'res', "Opponent disconnected");
                    games[room][2] += 2;
                }

                return;
            }

        }
    });
}

// Send chat messages to client
function send(ws, c, v) {
    data = {
        cmd: c,
        val: v
    };
    ws.send(JSON.stringify(data));
}

// Send command responses to client
function sendRes(ws1, ws2, v) {
    data = {
        cmd: "res",
        val: v
    }
    ws1.send(JSON.stringify(data));
    ws2.send(JSON.stringify(data));
}

module.exports = connection;
