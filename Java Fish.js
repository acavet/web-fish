class Card {

    static ranks = ["", "", "two", "three", "four", "five", "six", "seven", 
    "eight", "nine", "ten", "jack", "queen", "king", "ace"]

    static rankSymbols = ["", "", "2", "3", "4", "5", "6", "7", "8", "9",
    "10", "J", "Q", "K", "A"]

    static suits = ["spades", "diamonds", "hearts", "clubs"]
    static suitSymbols = ["♠️", "♦️", "♥️", "♣️"]

    constructor(rank, suit) {
        this.rank = rank
        this.suit = suit
    }

    get symbol() {
        const rankString = Card.rankSymbols[this.rank]
        const suitString = Card.suitSymbols[this.suit]

        return rankString + suitString
    }

    get name() {
        const rankString = Card.ranks[this.rank]
        const suitString = Card.suits[this.suit]

        return rankString + " of " + suitString
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

    get set() {
        let set = []

        for (const card of deck) {
            if (card.isInSameSetAs(this)) {
                set.push(card)
            }
        }

        return set

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
            const c = new Card(rank, suit)
            deck.push(c)
        }
    }

    return deck
}

const CardStatus = {
    inHand: "inHand",
    maybe: "maybe",
    unknown: "unknown",
    unlikely: "unlikely",
    notInHand: "notInHand"
}

const deck = makeNewDeck()
    
class Player {
    points = 0;
    opponents = [];
    cardStatusDictionary = {};
    isComputer;

    constructor(name) {
        this.name = name
        this.hand = new Set()
        
        for (const card of deck) {
            this.cardStatusDictionary[card.symbol]= CardStatus.unknown
        }
    }

    canAskForCard(card) {
        for (const c of this.hand) {
            if (card.isInSameSetAs(c)) return true
        }
        return false
    }

    get allowedAskingCards() {
        let cards = []
        for (const c of deck) {
            if (this.canAskForCard(c)) {
                cards.push(c)
            }
        }

        return cards
    }

    get sortedHand() {

        let sortedHand = Array.from(this.hand)

        sortedHand.sort( function(a, b) {
            if (a.suit == b.suit) return a.rank - b.rank
            else return a.suit - b.suit;
        });

       return sortedHand
    }

    // Returns true if legal ask
    askForCard(target, card, players) {

    
        if (!this.canAskForCard(card)) {
            console.log("THIS PLAYER CANT ASK FOR THAT CARD!!!!!")
            return null
        }

        for (const c of card.set) {
            if (this.cardStatusDictionary[c.symbol] == CardStatus.unknown) {
                this.cardStatusDictionary[c.symbol] = CardStatus.maybe
            }
        }

        if (target.hand.has(card)) {

            target.hand.delete(card);
            this.hand.add(card);

            // No one else has it
            for (const player of players) {
                player.cardStatusDictionary[card.symbol] = CardStatus.notInHand
            }

            // The asking player has the card
            this.cardStatusDictionary[card.symbol] = CardStatus.inHand

            return true
        } else {
            target.cardStatusDictionary[card.symbol] = CardStatus.notInHand
            this.cardStatusDictionary[card.symbol] = CardStatus.unlikely
            return false
        }
    }

    declareSet(card, players) {
        let goodDeclaration = true

        // Go through all cards of deck
        for (const c of card.set) {
            if (this.hand.has(c)) {
                this.hand.delete(c)
            } else if (this.partner.hand.has(c)) {
                this.partner.hand.delete(c)
            } else {
                goodDeclaration = false
            }
        }

        if (goodDeclaration) {
            this.points += 1
        } else {
            this.opponents[0].points += 1
            for (const c of card.set) {
                for (let player of players) player.hand.delete(c)
            }
        }
        
        return

    }

    getComputerCard(target) {

        // Possible choices — cards you can ask for, and that you don't have
        const askingCards = this.allowedAskingCards.filter(x => !this.hand.has(x))

        // Ask for all cards you know they have
        for (const card of askingCards) {

            if (target.cardStatusDictionary[card.symbol] == CardStatus.inHand) {
                return card
            }
        }


        const choice = Math.floor(Math.random() * 2)

        // Ask for cards they might have
        if (choice == 0) {
            for (const card of askingCards) {
                if (target.cardStatusDictionary[card.symbol] == CardStatus.maybe) {
                    return card
                }
            }
        }


        // Ask for random cards
        for (const card of askingCards) {
            if (target.cardStatusDictionary[card.symbol] == CardStatus.unknown) {
                return card
            }
        }
        
    }
    
    getComputerTarget(players) {
        if (this.opponents[0].hand.size == 0) {
            return this.opponents[1]
        } else if (this.opponents[1].hand.size == 0) {
            return this.opponents[0]
        } else {
            return this.opponents[Math.floor(2 * Math.random())]
        }
    }

    tryComputerDeclare(players) {

        let i = 0;
        while (i < this.sortedHand.length) {
            const card = this.sortedHand[i]

            let shouldDeclare = true
            for (const c of card.set) {

                if (!(this.hand.has(c) || this.partner.cardStatusDictionary[c.symbol] == CardStatus.inHand ||
                (this.opponents[0].cardStatusDictionary[c.symbol] == CardStatus.notInHand && 
                    this.opponents[1].cardStatusDictionary[c.symbol] == CardStatus.notInHand))) {
                    
                    shouldDeclare = false
                    break
                }
            }

            if (shouldDeclare) {
                this.declareSet(card, players)
            } else {
                i += 1
            }
        }
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

function setUpPlayers(nameList, isComputerList) {
    let player1 = new Player(nameList[0])
    let player2 = new Player(nameList[1])
    let player3 = new Player(nameList[2])
    let player4 = new Player(nameList[3])

    let players = [player1, player2, player3, player4]

    for (let i = 0; i < players.length; i++) {
        players[i].partner = players[(i+2) % 4]

        players[i].opponents.push(players[(i+1) % 4])
        players[i].opponents.push(players[(i+3) % 4])
        players[i].isComputer = isComputerList[i]
    }

    return players
}



function dealCards(players) {
    shuffle(deck)

    for (let i = 0; i < 52; i ++) {
        players[i%4].hand.add(deck[i])
    }
}

function findNextPlayer(goal) {

    for (const player of [goal, goal.partner, goal.opponents[0], goal.opponents[1]]) {
        if (!(player.hand.size == 0)) {
            return player
        }
    }

}



// runGame()


module.exports = {
    Card,
    shuffle,
    makeNewDeck,
    Player,
    getCardInput,
    getTargetInput,
    doTurn,
    gameIsOver,
    setUpPlayers,
    dealCards,
    printStatus,
    test
}