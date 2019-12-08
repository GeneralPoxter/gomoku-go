// Server
const express = require("express");
const WebSocket = require("ws");
const connection = require("./src/WSManager.js");
const wss = new WebSocket.Server({ port: 1111 });

const app = express();

// Host all files at public/
app.use(express.static("public", { root: '.' }));

console.log('start');
wss.on('connection', connection);

app.get("/", function(request, response) {
    response.sendFile("index.html", { root: '.' });
});

// Run the server
app.listen(process.env.PORT || 3000);