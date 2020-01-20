// Handles WebSocket client-side relations with server
class WSCManager {
    constructor(room, type) {
        // wsc = WebSocket client
        this.wsc = new WebSocket(location.origin.replace(/^http/, 'ws'));
        this.wsc.onopen = e => this.onOpen();
        this.wsc.onclose = e => this.onClose();
        this.wsc.onerror = e => this.onError();
        this.wsc.onmessage = e => this.onMessage(e);

        // Prepare data for ws handshakes
        this.room = room;
        this.type = type;
        this.data = {
            name: this.room,
            type: this.type,
            cmd: '',
            val: ""
        };

        // Initialize board
        this.board = new BoardRenderer();
        this.pieces = [];
        for (var r = 0; r < 21; r++) {
            this.pieces.push(Array(21).fill(0));
        }

        // Set up HTML
        this.text = document.getElementById("status");
        this.turn = document.getElementById("turn");
        this.chat = document.getElementById("chatText");
    }

    // Server-client handshake
    onOpen() {
        this.text.innerText = "Connecting to " + this.room;
        this.send('connect', this.room);
    }

    // Connection closed
    onClose() {
        if (this.text.innerText != "Local game") {
            this.text.innerText = "Disconnected from room\nPlease press restart";
            this.turn.innerText = "";
            this.chatDisp('res', "Disconnected from room " + this.room);
        }
    }

    // Error catching
    onError() {
        this.text.innerText = "Error";
        this.turn.innerText = "";
        this.wsc.close();
    }

    // Receive messages from server
    onMessage(e) {
        var msg = JSON.parse(e.data);
        var cmd = msg.cmd;
        var val = msg.val;

        console.log(cmd, val);

        // Server assigns color
        if (cmd == "color") {
            this.text.innerText = "Online game\nColor is " + val;
        }

        // Server gives the current turn
        else if (cmd == "turn") {
            this.turn.innerText = ["Black", "White"][val] + "'s turn";
        }

        // Server updates board
        else if (cmd == "update") {
            this.updateBoard(val);
            if (this.turn.innerText == "Black's turn") {
                this.turn.innerText = "White's turn";
            } else {
                this.turn.innerText = "Black's turn";
            }
        }

        // Server ends game
        else if (cmd == "end") {
            this.turn.innerText = val + "\nPlease press restart to exit or run '/rematch' to rematch";
        }

        // Server sends a chat message or response
        else if (cmd == "chat" || cmd == "res") {
            this.chatDisp(cmd, val);
        }

    }

    // Send messages to server
    send(cmd, val) {
        this.data.cmd = cmd;
        this.data.val = val;
        this.wsc.send(JSON.stringify(this.data));
    }

    // Display messages in chat
    chatDisp(cmd, msg) {
        var ele = document.createElement("p");
        ele.innerText = msg;
        if (cmd == 'res') {
            ele.style.fontStyle = "italic";
        }
        this.chat.appendChild(ele);
        this.chat.scrollTop = this.chat.scrollHeight;
    }

    // Render board
    renderBoard() {
        var cur = this;
        this.board.render(this.pieces, function() {
            var piece = d3.select(this);
            cur.send('move', (piece.attr("cy") / 40) + " " + (piece.attr("cx") / 40));
        });
    }

    // Update board
    updateBoard(newPieces) {
        this.pieces = newPieces;
        this.renderBoard();
    }
}