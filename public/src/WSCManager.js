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
        this.id = Math.random();
        this.room = room;
        this.type = type;
        this.color;
        this.data = {
            id: this.id,
            room: this.room,
            type: this.type,
            cmd: '',
            val: ""
        };

        // Initialize board
        this.board = new Board();
        this.pieces = [];
        for (var r = 0; r < 21; r++) {
            this.pieces.push(Array(21).fill(0));
        }

        // Set up HTML
        this.text = document.getElementById("status");
        this.turn = document.getElementById("turn");
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

        // Server assigns color
        if (cmd == "color") {
            this.color = val;
            this.text.innerText = "Online game\nColor is " + ["black", "white"][this.color];
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
            this.text.innerText = "Online game\nColor is " + ["black", "white"][this.color];
            this.turn.innerText = val + "\nPlease press restart";
        }

        // Server wants client to display message
        else if (cmd == "disp") {
            this.text.innerText = "Online game\nColor is " + ["black", "white"][this.color] + "\n" + val;
        }
    }

    // Send messages to server
    send(cmd, val) {
        this.data.cmd = cmd;
        this.data.val = val;
        this.wsc.send(JSON.stringify(this.data));
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