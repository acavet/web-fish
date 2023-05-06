// from random import *
// from typing import List

// import * as readline from 'node:readline/promises';
// import { stdin as input, stdout as output } from 'node:process';
// import * as readline from 'node:readline';


class Card {

    ranks = ["", "", "two", "three", "four", "five", "six", "seven", 
    "eight", "nine", "ten", "jack", "queen", "king", "ace"]

    rankSymbols = ["", "", "2", "3", "4", "5", "6", "7", "8", "9",
    "10", "J", "Q", "K", "A"]

    suits = ["spades", "diamonds", "hearts", "clubs"]
    suitSymbols = ["♠️", "♦️", "♥️", "♣️"]

    constructor(rank, suit) {
        this.rank = rank
        this.suit = suit
    }

    get name() {
        let rankString = this.rankSymbols[this.rank]
        let suitString = this.suitSymbols[this.suit]

        return rankString + suitString
    }

    static isInSameSetAs(other) {
        if (this.rank == 8) {
            if (other.rank == 8) return true
            else return false
        } else if (this.suit == other.suit) {
            if ((this.rank < 8) && (other.rank < 8) ||
                (this.rank > 8) && (other.rank > 8)) {
                return true
            }
        } else {
            return false
        }
    }

    equals(other) {
        return this.rank == other.rank && this.suit == other.suit
    }
}

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
  
    while (currentIndex != 0) {
  
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }

function makeNewDeck() {
    let deck = []

    for (let rank = 2; rank < 15; rank ++) {
        for (let suit = 0; suit < 4; suit ++)  {
            deck.push(new Card(rank, suit))
        }
    }

    return deck
}
    
class Player {
    constructor(name) {
        this.name = name
        this.hand = new Set()
        this.knownCards = new Set()
        this.maybeCards = new Set()
    }

    points = 0;
    
    canAskForCard(card) {
        for (c of this.hand) {
            if (card.isInSameSetAs(c)) return true
        }

        return false
    }

    // Returns true if legal ask
    askForCard(target, card, players) {

        assert( this.hand.size != 0 )

        if (!this.canAskForCard(card)) return None

        // Since they asked for the card, add all cards in that set to 
        // the 'maybe'list
        for (c of makeNewDeck()){
            if (c.isInSameSetAs(card)) this.maybeCards.add(c)
        }

        // Either the target doesn't have the card, or they'll give it away
        target.knownCards.discard(card)
        target.maybeCards.discard(card)
        
        if (target.hand.includes(card)) {
            target.hand.remove(card)
            this.hand.add(card)

            // Remove card from other players
            for (player of players) {
                player.knownCards.discard(card)
                player.maybeCards.discard(card)
            }

            // The asking player has the card
            this.knownCards.add(card)

            return true
        } else {
            return false
        }
            

    // function declareSet(this, card: Card):

    //     for c in makeNewDeck():
    //         if c.isInSameSetAs(card):
    //             if c in this.hand:
    //                 this.hand.remove(c)
    //             elif c in this.partner.hand:
    //                 this.partner.hand.remove(c)
    //             else:
    //                 return false
    }
}


function getCardInput() {

    let rank = -1
    let suit = -1
   
    while (!(2 <= rank && rank <= 14) || !(0 <= rank && rank <= 3)){
        console.log()
        
        text = getInput("Which card do you want?", ["ok"])

        if (text.includes("of")) {
            console.log("please format your answer like 'ace of spades'")
            continue
        }


        text = text.split("of")

        r = text[0].strip()
        s = text[1].strip()

        if (Card.ranks.includes(r)) {
            rank = Card.ranks.index(r)
        } else if (Card.rankSymbols.includes(r.upper())) {
            rank = Card.rankSymbols.index(r)
        }
            
        if (Card.suits.includes(s)) {
            suit = Card.suits.index(s)
        }
    }

    return new Card(rank, suit)
}

function getTargetInput(players) {
    const readline = require('node:readline');
    const { stdin: input, stdout: output } = require('node:process');
    const rl = readline.createInterface({ input, output });

    rl.question("Who would you like to ask? ", (name) => {
        if ((players[1].name).toLowerCase() == name) {
            rl.close()
            return players[1]
        }
        else if (players[3].name.toLowerCase() == name) {
            rl.close()
            return players[3]
        } else {
            rl.close()
            return getTargetInput(players)
        }
    });
}

function getComputerTargetCard(currentPlayer, target) {

    for (targetCard of target.knownCards) {
        for (card of currentPlayer.hand) {
            if (card.isInSameSetAs(targetCard)) {
                return targetCard
            }
        }
    }

    for (targetCard of target.maybeCards) {
        if (currentPlayer.hand.includes(targetCard)) {
            continue
        }
        for (card of currentPlayer.hand) {
            if (card.isInSameSetAs(targetCard)) {
                return targetCard
            }
        }
    }

    deck = makeNewDeck()
    shuffle(deck)
    for (card of deck) {
        if (!(currentPlayer.hand.includes(card)) && currentPlayer.canAskForCard(card)) {
            return card
        }
    }
        
}


function doComputerTurn(currentPlayer, players) {

    if (players[2] == currentPlayer) {
        target = players[1 + 2 * (math.random % 2) ]
    }
        
    else {
        target = players[2 * (math.random % 2)]
    }
        
    let card = getComputerTargetCard(currentPlayer, target)

    result = None

    while (result == None) {

        result = currentPlayer.askForCard(target, card, players)

        if (result != None) {
            console.log(currentPlayer.name, "asks", target.name, "for the", card.name)
        } else if (result == false) {
            console.log(target.name, "did not have the card.")
            return target
        }
        else if (result == true) {
            console.log(target.name, "had the card.")
            return currentPlayer
        }
    }
}

function doTurn(currentPlayer, players) {

    if (currentPlayer == players[0]) {

        target = getTargetInput(players)
        card = getCardInput()
        console.log()
       
        console.log(currentPlayer.name, "asks", target.name, "for the", card.name)
        result = currentPlayer.askForCard(target, card, players)

        if (result == false) {
            console.log(target.name, "did not have the card.")
            return target
        }
        else if (result == None){
            console.log("You can't ask for that card!")
            return currentPlayer
        }
        else {
            console.log("Success!!")
            return currentPlayer
        }
    }
    else {
        return doComputerTurn(currentPlayer, players)
    }
}

function gameIsOver(players) {
    for (player of players) {
        if (player.hand.size != 0) {
            return false
        }
    }
    return true
}

function setUpPlayers() {
    let player1 = new Player("Huit")
    let player2 = new Player("Conan")
    let player3 = new Player("Ana")
    let player4 = new Player("Hasan")

    player1.partner = player3
    player2.partner = player4
    player3.partner = player1
    player4.partner = player2

    return [player1, player2, player3, player4]
}
function dealCards(players) {

    const deck = makeNewDeck()
    shuffle(deck)

    for (let _ = 0; _ < 13; _ ++) {
        for (player of players) {
            player.hand.add(deck.pop())
        }
    }
}

function printStatus(currentPlayer, players) { 
    console.log("Your hand:")
    let sortedHand = Array.from(players[0].hand)
    sortedHand.sort( function(a, b) {
        if (a.suit == b.suit) return a.rank - b.rank
        else return a.suit - b.suit;
    });

    for (let i = 0; i < sortedHand.length; i++) {

        process.stdout.write(sortedHand[i].name)
        if (i < sortedHand.length -1 && sortedHand[i+1].suit != sortedHand[i].suit) {
            console.log()
        } else if (i == sortedHand.length - 1) {
            console.log()
            console.log()
        } else {
            process.stdout.write(", ")
        }
    }
        
    for (let i = 1; i < 4; i++) {
        console.log(players[i].name, "has", players[i].hand.size, "cards")
    }

    console.log()
    console.log("Up next:", currentPlayer.name)

}

function runGame() {

    let players = setUpPlayers()
    dealCards(players)

    console.log(players[0].hand.size)
    let currentPlayer = players[0]

    while (!gameIsOver(players)) {
        console.log("---------------")

        printStatus(currentPlayer, players)
        let nextPlayer = doTurn(currentPlayer, players)

        console.log("---------------")
        currentPlayer = nextPlayer
    }
      
    return

}

runGame()
