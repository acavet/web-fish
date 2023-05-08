// TODO add documentation

const jf = require('./Java Fish.js');
let express = require('express');

// Web socket setup
const http = require("http");
const { client } = require("websocket");
const app = require("express")();
app.get("/", (req,res)=> res.sendFile(__dirname + "/index.html"))
app.use(express.static(__dirname + '/public'));


// Host on port 9090
// Listen on port 9091, so to text go to localhost:9091
app.listen(9091, ()=>console.log("Listening on http port 9091"))
const websocketServer = require("websocket").server
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening.. on 9090"))

// Keep track of clients and games
// Players also includes AI players
const clients = {};
const players = {};
const games = {};

// Global variables
const MAX_PLAYERS = 1;
const GAME_NAMES = ["Horse", "Pig", "Dog", "Cat", "Parrot", "Iguana"];// TODO 

// Helper function to avoid player circles
const replacerFunc = () => {
    const visited = new WeakSet();
    return (key, value) => {
        // if (key === undefined || value === undefined) {
        //     return "";
        //   }
      if (value instanceof jf.Player) {
        return value.name;
      }
    //   if (typeof value === "object" && value !== null) {
    //     if (visited.has(value)) {
    //       return ;
    //     }
    //     visited.add(value);
    //   }
      return value;
    };
  };

// Server
const wsServer = new websocketServer({
    "httpServer": httpServer
})
wsServer.on("request", request => {
    // Accept client request to open or close connection
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened connection"))
    connection.on("close", () => console.log("closed connection"))

    // Recieve instructions via JSON message
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data)
        
        // When a user creates a new game 
        if (result.method === "create") {
            const clientId = result.clientId;
            const gameId = guid();

            // Add game id and metadata to game dictionaty
            games[gameId] = {
                "id": gameId,
                "balls": 20,
                "clients": [],
                "players": [],
                "playing": false,
                "message": "",
                "deck": undefined
            }

            // Data to return back to game HTML
            const payload = {
                "method": "create",
                "game" : games[gameId]
            }
            const con = clients[clientId].connection;
            con.send(JSON.stringify(payload));
        }

        // When a user joins a current game 
        if (result.method === "join") {

            const clientId = result.clientId;
            const name = result.name;
            const gameId = result.gameId;
            const game = games[gameId];

            // TODO check if game id is valid
            // TODO custom game ids 


            // Have we reached the max number of players?
            if (game.clients.length >= MAX_PLAYERS) 
            {
                const payload = {
                    "method": "alert",
                    "message": "Sorry, this game is maxed out on players!"
                }
                connection.send(JSON.stringify(payload));
                return;
            }
    
            game.clients.push({
                "clientId": clientId,
                "name": name,
                "score": 5
            })
            // Start the game once we reach XXX players
            // TODO make it so we don't need max players
            if (game.clients.length === MAX_PLAYERS) {
                // Start game
                game.playing = true;

                // Get irl player names
                let names = game.clients.map(function (client) { return client.name });

                // Add comedian names TODO jank temp logica 
                while (names.length < 4) {
                    names.push("amyNumber"+names.length);
                }
                game.players = jf.setUpPlayers(names, [false, true, true, true]);

                // Signal start of game and start updating game state
                const payload = {
                    "method": "alert",
                    "message": "The game has started."
                }
                connection.send(JSON.stringify(payload));
                updateGameState();
            }

            // Inform each client of the game status
            const payload = {
                "method": "join",
                "game": game
            }
            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payload, replacerFunc()))
            })
        }

        // A user makes a move
        // TODO change all of this lol 
        if (result.method === "play") {
            console.log("PLAYING A MOVE");
            const gameId = result.gameId;
            const ballId = result.ballId;
            const name = result.name;
            let state = games[gameId].state;
            if (!state)
                state = {}
            state[ballId] = name;
            games[gameId].state = state;
        }

        // A user requests another player for a card TODO 
        if (result.method === "requestCard") {

            const gameId = result.gameId;
            const requesterID = result.requesterID;
            const requesteeName = result.requesteeName;

            if (!(requesteeName === undefined) && requesterID in clients) {
                // Find requestee and requester client objects
                let requesterDict = undefined;
                let requesteeDict = undefined;
                for (var i = 0; i < games[gameId].clients.length; ++i) {
                    let clientDict = games[gameId].clients[i];
                    if (clientDict.name === requesteeName) {
                        clientDict.score -= 1;
                        requesteeDict = clientDict;
                    }
                    if (clientDict.clientId === requesterID) {
                        requesterDict = clientDict;
                    }
                }
                // TODO check valid request given their hand
                // TODO check if player neeeds to return
                // TODO player's hands are influenced
                if (!(requesterDict === undefined) && !(requesteeDict === undefined))
                {
                    let fishText = requesterDict.name + " requested " + result.suit + result.rank + " from " + requesteeDict.name;
                    // TODO do card move
                    const payload = {
                        "method": "fishTextUpdate",
                        "fishText": fishText
                    };
                    games[gameId].clients.forEach(c => {
                        clients[c.clientId].connection.send(JSON.stringify(payload))
                    });
                }
            } 
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


// For each game, update the game state and send back to each client 
function updateGameState(){
    //{"gameid", fasdfsf} FORMAT TODO 

    // Loop through each game
    for (const g of Object.keys(games)) {
        const game = games[g];
        const payload = {
            "method": "update",
            "game": game
        };
        const payloadJSON = JSON.stringify(payload, replacerFunc());
        // Send game updates in JSON payload to each client 
        game.clients.forEach(c => {
            clients[c.clientId].connection.send(payloadJSON);
        });
    }

    // Time between game updates
    setTimeout(updateGameState, 500);
}



// TODO game id generation--just have string codes eventually? 
function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
 
