// Handles WebSocket client-side relations with server
class WSManager {
    constructor(room, type) {
        // wsc = WebSocket client
        this.wsc = new WebSocket("wss://1111-c487bfda-ee48-4b91-9872-95bc4bbef4f6.ws-us02.gitpod.io/");
        this.wsc.onopen = e => this.onOpen();
        this.wsc.onerror = e => this.onError();
        this.wsc.onmessage = e => this.onMessage(e);
        
        this.id = Math.random();
        this.data = {id:this.id, room:room, type:type, color:null, msg:""};

        this.board = new Board();
        this.pieces = [];
        for (var r = 0; r < 21; r++) {
            this.pieces.push(Array(21).fill(0));
        }
        this.text = document.getElementById("status");
        this.turn = document.getElementById("turn");
    }

    // Server-client handshake
    onOpen() {
        this.text.innerText = "Connecting to " + this.data.room;
        this.send("Connected to " + this.data.room);
    }

    // Error catching
    onError() {
        this.text.innerText = "Error";
        this.closeWS();
    }

    // Receive messages from server
    onMessage(e) {
        var message = e.data;
        console.log(message);

        // Server assigns color, display status
        if (message == 0 || message == 1) {
            this.data.color = message;
            this.text.innerText = "Online game\nColor is " + ["black","white"][this.data.color];
        }

        // Server gives the current turn
        else if (message[0] == "T") {
            this.turn.innerText = ["Black", "White"][parseInt(message[1])] + "'s turn";
        }

        // Server updates board
        else if (message[0] == "[") {
            this.updateBoard(JSON.parse(message));
            if (this.turn.innerText == "Black's turn") {
                this.turn.innerText = "White's turn";
            }
            else {
                this.turn.innerText = "Black's turn";
            }
        }

        // Server claims a win
        else if (message.slice(0, 3) == "Win") {
            if (parseInt(message.slice(-1), 10) == this.data.color) {
                this.turn.innerText = "You won";
            }
            else {
                this.turn.innerText = "You lost";
            }
        }

        // Server disconnect client
        else if (message == "Disconnect") {
            this.closeWS();
            this.text.innerText = "Disconnected from room\nPlease press restart;";
        }

        // Server wants client to display message
        else {
            this.text.innerText = "Online game\nColor is " + ["black","white"][this.data.color] + "\n" + message;
        }
    }

    // Send messages to server
    send(message) {
        this.data.msg = message;
        this.wsc.send(JSON.stringify(this.data));
    }

    // Disconnect from server and close WebSocket
    closeWS() {
        this.send("Disconnected from " + this.data.room);
        this.wsc.close();
    }

    // Render board
    renderBoard() {
        var cur = this;
        board.render(this.pieces, function(){var piece = d3.select(this); cur.send(ws.data.color + " " + (piece.attr("cy") / 40) + " " + (piece.attr("cx") / 40))});
    }

    // Update board
    updateBoard(newPieces) {
        this.pieces = newPieces;
        this.renderBoard();
    }
}