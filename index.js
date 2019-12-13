// Server
// Code from https://devcenter.heroku.com/articles/node-websockets
const express = require('express');
const {
    Server
} = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
    .use(express.static("public", {
        root: '.'
    }))
    .get("/", function(req, res) {
        res.sendFile("index.html", {
            root: 'public'
        })
    })
    .listen(PORT, () => console.log("start"));

const wss = new Server({
    server
});
const connection = require("./src/WSManager.js");

wss.on('connection', connection);

/* Old Server
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
