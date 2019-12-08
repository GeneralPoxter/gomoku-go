const express = require('express');
const { Server } = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use(express.static("public", { root: '.' }))
  .get("/", function(req, res) {
    res.sendFile("index.html", { root: 'public' })
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(new Date().toTimeString());
  });
}, 1000);

/*
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
*/
