const jf = require('./Java Fish.js');
let express = require('express');

// Web socket setup
const http = require("http");
const { client } = require("websocket");
const app = require("express")();
app.get("/", (req,res)=> res.sendFile(__dirname + "/other.html"))
app.use(express.static(__dirname + '/'));

// Host on port 9090
// Listen on port 9091, so to text go to localhost:9091
app.listen(9091, ()=>console.log("Listening on http port 9091"))
const websocketServer = require("websocket").server
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening.. on 9090"))

const clients = {};
const players = {};
const games = {};

// Global variables
const MAX_PLAYERS = 4;
const TOTAL_PLAYERS = 4;
const fs = require("fs");
var available_game_names = fs.readFileSync('./fishnames.txt').toString().split("\n");

// Helper function to avoid player circles
const replacerFunc = () => {
    // const visited = new WeakSet();
    return (key, value) => {
      if (value instanceof jf.Player) { 

        if (typeof(value.partner) === "object") {
            value.partner = value.partner.name
            value.opponents[0] = value.opponents[0].name
            value.opponents[1] = value.opponents[1].name
        }
        
      }
      return value;
    };
};

// Server
const wsServer = new websocketServer({
    "httpServer": httpServer
})

function createGame(result) {
    const clientId = result.clientId;
    const gameId = available_game_names.splice(Math.floor(Math.random() * available_game_names.length), 1);

    // Add game id and metadata to game dictionary
    games[gameId] = {
        "id": gameId,
        "clients": [],
        "players": [],
        "playing": false,
        "message": "",
        "deck": undefined,
        "turn": "",
        "turnNumber": 0,
        "isAiTurn": false,
        "starterClientId": result.clientId,
        "owner": ""
    }

    // Data to return back to game HTML
    const payload = {
        "method": "create",
        "game" : games[gameId]
    }

    clients[clientId].connection.send(JSON.stringify(payload))
}

function joinGame(result, connection) {

    const clientId = result.clientId;
    const name = result.name;
    const gameId = result.gameId;
    const game = games[gameId];

    // Check if game id is valid
    if (game === undefined) {
        const payload = {
            "method": "alert",
            "message": "Sorry, this game doesn't exist!"
        }
        connection.send(JSON.stringify(payload));
        return;
    } else if (game.clients.length >= MAX_PLAYERS) {
        const payload = {
            "method": "alert",
            "message": "Sorry, this game is maxed out on players!"
        }
        connection.send(JSON.stringify(payload));
        return;
    }
    
    // Add client to game 
    game.clients.push({
        "clientId": clientId,
        "name": name,
    })

    // Inform each client of the game status
    const payload = {
        "method": "playerJoined",
        "game": game
    }

    for (const client of game.clients) {

        clients[client.clientId].connection.send(JSON.stringify(payload, replacerFunc()))
    }
}

function startGame(game) {
    const nameList = game.clients.map(client => client.name)

    while (nameList.length < 4) {
        nameList.push("Computer")
    }

    game.players = jf.setUpPlayers(nameList, [false, true, true, true])

    game.currentPlayer = game.players[0]
    jf.dealCards(game.players)

    const payload = {
        "method": "gameStarted",
        "game": game
    }
    
    for (const client of game.clients) {

        clients[client.clientId].connection.send(JSON.stringify(payload, replacerFunc()))
    }

    updateGame()
}

function updateGame() {

}

wsServer.on("request", request => {
    // Accept client request to open or close connection
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened connection"))
    connection.on("close", () => console.log("closed connection"))

    // Recieve instructions via JSON message
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data)

        switch (result.method) {
            case "create":
                createGame(result)
                break;
            case "join":
                joinGame(result, connection)
                break;
            case "startGame":
                startGame(games[result.gameId])
                break;
        }

    })

    

    // Upon connection to server, generate a new clientId and send back to client in JSON payload
    const clientId = guid();
    clients[clientId] = {
        "connection":  connection,
    };
    const payload = {
        "method": "connect",
        "clientId": clientId
    };

    connection.send(JSON.stringify(payload));
})

// Random game id generation helpers
function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
 