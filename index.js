// Server

// @ Mr. Foster
// In order to start, enter "npm start" in the terminal
// Ctrl-C to terminate

const express = require("express");
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 1111 });
var clients = [];

const app = express();

// Host all files at public/
app.use("/", express.static("public"));

// wss = WebSocket server
/*
== Doesn't work for some reason ==
wss.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    console.log('origin: %s', connection);
});
*/

console.log('start');
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(e) {
        // Display incoming client messages
        var message = JSON.parse(e);
        console.log('received from %d: %s', message.id, message.data);

        // Functionality for accepted clients
        if (clients.includes(message.id)) {
            // Functionality for client disconnect
            if (message.data == "Disconnected") {
                if (clients[0] == message.id) {
                    clients.shift();
                }
                else {
                    clients.pop();
                }
            }
        }

        // Accept incoming client if available
        else if (clients.length < 2) {
            if (message.data == "Connected") {
                clients.push(message.id);
                console.log(clients);
            }
        }

        // Disconnect incoming client if room capacity reached
        else {
            ws.send("Disconnect");
        }
    });
});

app.get("/", function(request, response) {
    response.sendFile("./public/index.html");
});

// Run the server
app.listen(3000);