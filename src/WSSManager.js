// Handles WebSocket server-side relations with client
const Room = require("./Room.js");
var rooms = [];

function connection(ws) {
    ws.on('message', function incoming(e) {
        // Try-catch to prevent server from crashing
        try {
            // Parse incoming messages
            var msg = JSON.parse(e);
            var name = msg.name;
            var type = msg.type;
            var cmd = msg.cmd;
            var val = msg.val;

            // Find room
            var room;
            var color;
            for (var i = 0; i < rooms.length; i++) {
                if (rooms[i].name == name && rooms[i].type == type) {
                    room = rooms[i];
                    if (rooms[i].black == ws) {
                        color = 'black';
                    }
                    if (rooms[i].white == ws) {
                        color = 'white';
                    }
                    break;
                }
            }

            // Functionality for existing room and accepted client
            if (color) {
                if (room.black && room.white) {
                    // Functionality for moves
                    if (cmd == 'move' && ['black', 'white'].indexOf(color) == room.turn) {
                        if (val == "pass" && room.type == 'go') {
                            room.pass();
                            return;
                        }

                        // Parse move
                        var move = val.split(' ');
                        var row = parseInt(move[0], 10);
                        var col = parseInt(move[1], 10);

                        room.makeMove(row, col);
                    }
                }

                // Functionality for chat room
                if (cmd == 'chat') {
                    room.processMsg(ws, val);
                }

                return;
            }

            // Connect to request room if room exists
            if (room) {
                if (!room.connect(ws)) {
                    ws.close();
                }
                return;
            }

            // Connect incoming client and create new room
            if (name != null && (type == "gomoku" || type == "go")) {
                rooms.push(new Room(name, type, ws));
                return;
            }

        } catch (error) {
            console.log(error);
            return;
        }
    });

    // Functionality for client disconnect
    ws.on('close', function close(e) {
        // Find room
        var room;
        for (var i = 0; i < rooms.length; i++) {
            if (rooms[i].black == ws || rooms[i].white == ws) {
                if (!rooms[i].disconnect(ws)) {
                    // Delete room if both clients disconnect
                    rooms.splice(i, 1);
                }
                return;
            }
        }
    });
}

module.exports = connection;