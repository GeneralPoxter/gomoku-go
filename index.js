// Server setup
// Code from https://devcenter.heroku.com/articles/node-websockets
const express = require('express');
const {Server} = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
    .use(express.static("public", {root: '.'}))
    .get("/", function(req, res) {
        res.sendFile("index.html", {root: 'public'})
    })
    .listen(PORT, () => console.log("start"));

const wss = new Server({server});
const connection = require("./src/WSSManager.js");

wss.on('connection', connection);
