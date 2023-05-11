// TODO add documentation

const jf = require('./Java Fish.js');
let express = require('express');

// Web socket setup
const http = require("http");
const { client } = require("websocket");
const app = require("express")();
app.get("/", (req,res)=> res.sendFile(__dirname + "/index.html"))
app.use(express.static(__dirname + '/'));

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
const TOTAL_PLAYERS = 4;
const fs = require("fs");
var available_game_names = fs.readFileSync('./fishnames.txt').toString().split("\n");

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


            //const gameId = guid();
            const gameId = available_game_names.splice(Math.floor(Math.random()*available_game_names.length), 1);

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
                startGame(game, connection);
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

        // A user makes a move TODO delete
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
            let requesterName = result.requesterName;
            let requesteeName = result.requesteeName;

            // Carry out human player's turn
            let requesterPlayer = undefined;
            let requesteePlayer = undefined;
            let requestedCard = undefined;

            // Find players
            for (player of games[gameId].players) {
                if (player.name === requesteeName) {
                    requesteePlayer = player;
                }
                if (player.name === requesterName) {
                    requesterPlayer = player;
                }
            }


            // Case on if the requester is an AI
            if (requesterPlayer.isComputer) {
                console.log("requester is AI")
                requesteePlayer = requesterPlayer.getComputerTarget(games[gameId].players);
                requesteeName = requesteePlayer.name;
                requestedCard = requesterPlayer.getComputerCard(requesteePlayer);
            } else { // If not a computer 
                console.log("requester NOT AI")
                jf.printStatus(requesteePlayer, games[gameId].players)
                const rankNum = jf.Card.ranks.indexOf(result.rank);
                const suitNum = jf.Card.suits.indexOf(result.suit);
                requestedCard = new jf.Card(rankNum, suitNum);    
            } 

            // Ask for card
            let goodAsk = requesterPlayer.askForCard(requesteePlayer, requestedCard, games[gameId].players);
            
            // Figure out next player
            let nextPlayer = undefined;
            if (goodAsk) {
                nextPlayer = requesterPlayer;
            } else {
                nextPlayer = requesteePlayer;
            }

            // Change turns
            let nextName = nextPlayer.name;
            games[gameId].turn = nextName;

            // Update turn # 
            games[gameId].turnNumber += 1;

            // Update players on what turn happened
            console.log("WAS A GOOD ASK:"+goodAsk)
            let requestText = requesterName + " requested " + requestedCard.symbol + " from " + requesteeName;
            let successText = " and was " + (goodAsk ? " " : "not ") + "successful, so the next player is " + nextPlayer.name;

            

            let fishText = requestText + successText
            console.log(fishText)
            const payload3 = {
                "method": "fishTextUpdate",
                "fishText": fishText
            };
            games[gameId].clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payload3))
            });


            // Alert
            const payload = {
                "method": "alert",
                "message": "It is " + nextName + "'s turn to make a move.",
            }
            games[gameId].clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payload))
            });
            const payload2 = {
                "method": "alertTurn",
                "name": nextName
            }
            games[gameId].clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payload2))
            });                   
            
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

    // Loop through each game
    for (const g of Object.keys(games)) {
        const game = games[g];
        let partnerOf = Object.assign({}, ...game.players.map((player) => ({[player.name]: player.partner.name})));
        const payload = {
            "method": "update",
            "game": game,
            "partners": partnerOf
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

// Begin game and signal to players
function startGame(game, connection) {
    // Start game
    game.playing = true;
    game.turnNumber += 1;

    // Set game owner
    let owner = game.clients[0].name;
    for (clientDict of game.clients) {
        if (clientDict.clientId === game.starterClientId) {
            owner = clientDict.name;
        }
    }
    game.owner = owner;
    console.log("GAME OWNER "+owner)

    // Get irl player names here
    let names = game.clients.map(function (client) { return client.name });

    // Add comedian names TODO jank temp logic
    const numberNotAi = names.length;
    while (names.length < 4) {
        names.push("amyNumber"+names.length);
    }
    var aiBools = [];
    for (i = 0; i < TOTAL_PLAYERS; i++) {
        var b = true;
        if (i < numberNotAi) {
            var b = false;
        } 
        aiBools.push(b);
    }
    console.log("AI bools" + aiBools)
    game.players = jf.setUpPlayers(names, aiBools);

    // Deal cards
    jf.dealCards(game.players);

    // Choose first player randomly 
    const firstPlayer = game.players[Math.floor(Math.random()*game.players.length)];
    game.turn = firstPlayer.name;

    // Signal start of game and start updating game state
    const payload = {
        "method": "alert",
        "message": "The game has started."
    }
    game.clients.forEach(c => {
        clients[c.clientId].connection.send(JSON.stringify(payload))
    });

    // Begin game update loop 
    updateGameState();
}





// TODO game id generation--just have string codes eventually? 
function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
 