// Handles WebSocket client-side relations with server
class WSManager {
    constructor(room, type) {
        // wsc = WebSocket client
        this.wsc = new WebSocket("wss://1111-c487bfda-ee48-4b91-9872-95bc4bbef4f6.ws-us02.gitpod.io/");
        this.wsc.onopen = e => this.onOpen();
        this.wsc.onerror = e => this.onError();
        this.wsc.onmessage = e => this.onMessage(e);
        this.pieces = [];
        for (var r = 0; r < 21; r++) {
            this.pieces.push(Array(21).fill(0));
        }
        this.text = document.getElementById("status");
        
        this.id = Math.random();
        this.data = {id:this.id, room:room, type:type, color:null, msg:""};
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

        // Server assigns color, display status
        if (message == 0 || message == 1) {
            this.data.color = message;
            this.text.innerText = "Online game\nConnected to " + this.data.room + "\nColor is " + ['black','white'][this.data.color];
        }

        // Server disconnect client
        if (message == "Disconnect") {
            this.closeWS();
            this.text.innerHTML = "Disconnected from room";
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

    // Update board
    updateBoard(newPieces) {
        this.pieces = newPieces;
        
    }
}