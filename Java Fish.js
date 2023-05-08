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

    get symbol() {
        let rankString = this.rankSymbols[this.rank]
        let suitString = this.suitSymbols[this.suit]

        return rankString + suitString
    }

    isInSameSetAs(other) {
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
    let currentIndex = array.length 
    let randomIndex;
  
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
    points = 0;
    isCurrentPlayer;

    constructor(name) {
        this.name = name
        this.hand = new Set()
        this.knownCards = new Set()
        this.maybeCards = new Set()
    }

    canAskForCard(card) {
        for (const c of this.hand) {
            if (card.isInSameSetAs(c)) return true
        }
        return false
    }

    // Returns true if legal ask
    askForCard(target, card, players) {

        if (!this.canAskForCard(card)) return null

        // Since they asked for the card, add all cards of that set to 
        // the 'maybe'list
        for (const c of makeNewDeck()) {
            if (c.isInSameSetAs(card)) this.maybeCards.add(c)
        }

        // Either the target doesn't have the card, or they'll give it away
        target.knownCards.delete(card)
        target.maybeCards.delete(card)
        this.maybeCards.delete(card)
        
        if (target.hand.has(card)) {
            target.hand.remove(card)
            this.hand.add(card)

            // Remove card from other players
            for (const player of players) {
                player.knownCards.delete(card)
                player.maybeCards.delete(card)
            }

            // The asking player has the card
            this.knownCards.add(card)

            return true
        } else {
            return false
        }
    }

    static declareSet(card, players) {
        let goodDeclaration = true
        // Go through all cards of deck

        for (const c of makeNewDeck()) {
            if (c.isInSameSetAs(card)) {
                if (self.hand.has(c)) {
                    self.hand.remove(c)
                } else if (self.partner.hand.has(c)) {
                    self.partner.hand.remove(c)
                } else {
                    goodDeclaration = false
                }
            }
        }
        // print("%s declares the set with the %s, " % (self.name, card.getName()), end = "")

        if (goodDeclaration) {
            self.points += 1
            // print("and they are successful.")
            return
        }
        // print("but they are unsuccessful.")

        for (const c of makeNewDeck()) {
            if (c.isInSameSetAs(card)) {
                for (let player of players) player.hand.delete(c)
            }   
        }
        return
    }
}


function getCardInput() {
    rank = 2 + Math.floor(13*Math.random())
    suit = Math.floor(4*Math.random())

    return new Card(rank, suit)
}

function getTargetInput(players) {
    const i = 1 + Math.floor(2*Math.random())
    return players[i]
}

function getComputerCard(currentPlayer, target) {

    for (const targetCard of target.knownCards) {
        for (const card of currentPlayer.hand) {
            if (card.isInSameSetAs(targetCard)) {
                return targetCard
            }
        }
    }

    for (const targetCard of target.maybeCards) {
        if (currentPlayer.hand.has(targetCard)) {
            continue
        }
        for (const card of currentPlayer.hand) {
            if (card.isInSameSetAs(targetCard)) {
                return targetCard
            }
        }
    }

    deck = makeNewDeck()
    shuffle(deck)
    for (const card of deck) {
        if (!(currentPlayer.hand.has(card)) && currentPlayer.canAskForCard(card)) {
            return card
        }
    }
        
}

function getComputerTarget(currentPlayer, players) {
    if (currentPlayer == players[0] || currentPlayer == players[2]) {
        return players[1 + 2 * Math.floor(2 * Math.random())]
    } else {
        return players[2 * Math.floor(2 * Math.random())]
    }
}

function doTurn(currentPlayer, players) {

    let target = null
    let card = null

    if (currentPlayer == players[0]) {
        target = getComputerTarget(currentPlayer, players)
        card = getComputerCard(currentPlayer, target)

        if (target == null) {
            currentPlayer.declareSet(card, players)
            return currentPlayer
        }

    } else {
        target = getComputerTarget(currentPlayer, players)
        card = getComputerCard(currentPlayer, target)
    
        // tryComputerDeclare(currentPlayer, players)
    }

    console.log(`${currentPlayer.name}: ${target.name}, do you have the ${card.symbol}?`)
    result = currentPlayer.askForCard(target, card, players)

    if (result == false) {
        console.log(`${target.name}: no.`)
        return target
    } else if (result == true) {
        console.log(`${target.name}: yes.`)
        return currentPlayer
    } else if (result == null) {
        // print("You can't ask for that card!")
        return currentPlayer
    }
       
}

function gameIsOver(players) {
    for (const player of players) {
        if (player.hand.size != 0) {
            return false
        }
    }
    return true
}

function setUpPlayers(name1, name2, name3, name4) {
    let player1 = new Player(name1)
    let player2 = new Player(name2)
    let player3 = new Player(name3)
    let player4 = new Player(name4)

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
        for (const player of players) {
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

        process.stdout.write(sortedHand[i].symbol)

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

function test() {
    console.log("Test successful");
}

function runGame() {

    let players = setUpPlayers("Huit", "Conan", "Ana", "Hasan")
    dealCards(players)

    console.log(players[0].hand.size)
    let currentPlayer = players[0]

    // while (!gameIsOver(players)) {

    for (_ = 0; _ < 5; _ ++) {
        console.log("---------------")

        printStatus(currentPlayer, players)
        let nextPlayer = doTurn(currentPlayer, players)

        console.log("---------------")
        currentPlayer = nextPlayer
    }
      
    return

}

// runGame()


module.exports = {
    Card,
    shuffle,
    makeNewDeck,
    Player,
    getCardInput,
    getTargetInput,
    getComputerCard,
    doTurn,
    gameIsOver,
    setUpPlayers,
    dealCards,
    printStatus,
    test
}