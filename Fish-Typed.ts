class Card {
    rank: number;
    suit: number;

    static ranks = ["", "", "two", "three", "four", "five", "six", "seven", 
    "eight", "nine", "ten", "jack", "queen", "king", "ace"]

    static rankSymbols = ["", "", "2", "3", "4", "5", "6", "7", "8", "9",
    "10", "J", "Q", "K", "A"]

    static suits = ["spades", "diamonds", "hearts", "clubs"]
    static suitSymbols = ["♠️", "♦️", "♥️", "♣️"]

    constructor(rank: number, suit: number) {
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

        let set: Array<Card> = []

        for (const card of makeNewDeck()) {
            if (card.isInSameSetAs(this)) {
                set.push(card)
            }
        }

        return set

    }

    equals(other: Card) {
        return this.rank == other.rank && this.suit == other.suit
    }
}

interface Set<T> {
    hasCard(item: Card): boolean;
    removeCard(item: Card): void;
}

Set.prototype.hasCard = function(item: Card) {
    for (let thing of this) {
        if (thing.equals(item)) return true
    }
    return false
}

Set.prototype.removeCard = function(item: Card) {
    for (let thing of this) {
        if (thing.equals(item)) this.delete(thing)
    }
}

function shuffle(array: any) {
    let currentIndex = array.length 
    let randomIndex = 0
  
    while (currentIndex != 0) {
  
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

function makeNewDeck(): Array<Card> {
    let deck: Array<Card> = []

    for (let rank = 2; rank < 15; rank ++) {
        for (let suit = 0; suit < 4; suit ++)  {
            deck.push(new Card(rank, suit))
        }
    }

    return deck
}
    
class Player {
    name: string;
    hand: Set<Card>;
    knownCards: Set<Card>;
    maybeCards: Set<Card>;
    partner: Player;

    points = 0;
    opponents: Array<Player> = [];
    isComputer = false;


    constructor(name: string) {
        this.name = name
        this.hand = new Set()
        this.knownCards = new Set()
        this.maybeCards = new Set()
    }

    canAskForCard(card: Card) {
        for (const c of this.hand) {
            if (card.isInSameSetAs(c)) return true
        }
        return false
    }

    // Returns true if legal ask
    askForCard(target: Player, card: Card, players: Array<Player>) {

    
        if (!this.canAskForCard(card)) {
            console.log("THIS PLAYER CANT ASK FOR THAT CARD!!!!!")
            return null
        }

        for (const c of makeNewDeck()) {
            if (c.isInSameSetAs(card)) this.maybeCards.add(c)
        }
   
        this.maybeCards.removeCard(card)
        

        if (target.hand.hasCard(card)) {

            target.hand.removeCard(card); // TODO was delete not delete
            this.hand.add(card);

            // delete card from other players
            for (const player of players) {
                player.knownCards.removeCard(card)
                player.maybeCards.removeCard(card)
            }

            // The asking player has the card
            this.knownCards.add(card)

            return true
        } else {
            target.knownCards.removeCard(card)
            target.maybeCards.removeCard(card)
            return false
        }
    }

    declareSet(card, players) {
        let goodDeclaration = true
        // Go through all cards of deck

        for (const c of makeNewDeck()) {
            if (c.isInSameSetAs(card)) {
                if (this.hand.hasCard(c)) {
                    this.hand.removeCard(c)
                } else if (this.partner.hand.hasCard(c)) {
                    this.partner.hand.removeCard(c)
                } else {
                    goodDeclaration = false
                }
            }
        }
        // print("%s declares the set with the %s, " % (this.name, card.getName()), end = "")

        if (goodDeclaration) {
            this.points += 1
            console.log("and they are successful.")
        } else {
            this.opponents[0].points += 1
            console.log("but they are unsuccessful.")
            for (const c of makeNewDeck()) {
                if (c.isInSameSetAs(card)) {
                    for (let player of players) player.hand.removeCard(c)
                }   
            }
        }
        
        return

      
    }

    getComputerCard(target) {

        for (const targetCard of target.knownCards) {
            for (const card of this.hand) {
                if (card.isInSameSetAs(targetCard)) {
                    return targetCard
                }
            }
        }
    
        for (const targetCard of target.maybeCards) {
            if (!this.hand.hasCard(targetCard)) {
                for (const card of this.hand) {
                    if (card.isInSameSetAs(targetCard)) {
                        return targetCard
                    }
                }
            }
        }
    
        const deck = makeNewDeck()
        shuffle(deck)
        for (const card of deck) {
            if (!(this.hand.hasCard(card)) && this.canAskForCard(card)) {
                return card
            }
        }
    }
    
    getComputerTarget(players) {
        if (this == players[0] || this == players[2]) {
            return players[1 + 2 * Math.floor(2 * Math.random())]
        } else {
            return players[2 * Math.floor(2 * Math.random())]
        }
    }
}

function setUpPlayers(nameList: Array<string>, isComputerList: Array<boolean>) {
    let player1 = new Player(nameList[0])
    let player2 = new Player(nameList[1])
    let player3 = new Player(nameList[2])
    let player4 = new Player(nameList[3])

    let players = [player1, player2, player3, player4]

    for (let index in players) {
        let i = parseInt(index)
        players[i].partner = players[(i+2) % 4]

        players[i].opponents.push(players[(i+1) % 4])
        players[i].opponents.push(players[(i+3) % 4])
        players[i].isComputer = isComputerList[i]
    }

    return players
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

    for (const player of players) {
        console.log(player.name+":")
        let sortedHand: Array<Card> = Array.from(player.hand)

        sortedHand.sort( function(a: Card, b: Card) {
            if (a.suit == b.suit) return a.rank - b.rank
            else return a.suit - b.suit;
        });

        for (let i = 0; i < sortedHand.length; i++) {

            // process.stdout.write(sortedHand[i].symbol)

            if (i < sortedHand.length -1 && sortedHand[i+1].suit != sortedHand[i].suit) {
                console.log()
            } else if (i == sortedHand.length - 1) {
                console.log()
                console.log()
            } else {
                console.log(", ")
            }
        }
    }

    // for (let i = 1; i < 4; i++) {
    //     console.log(players[i].name, "has", players[i].hand.size, "cards")
    // }

    console.log()
    console.log("Up next:", currentPlayer.name)

}

function findNextPlayer(goal: Player) {
    if (goal.hand) {

    }
}

function test() {
    console.log("Test successful");
}


// module.exports = {
//     Card,
//     shuffle,
//     makeNewDeck,
//     Player,
//     getCardInput,
//     getTargetInput,
//     doTurn,
//     gameIsOver,
//     setUpPlayers,
//     dealCards,
//     printStatus,
//     test
// }