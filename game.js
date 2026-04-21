// LOAD SETTINGS FROM SETUP
const username = sessionStorage.getItem("username");
const maxRetries = parseInt(sessionStorage.getItem("maxRetries"));
const timerEnabled = sessionStorage.getItem("timerEnabled") === "true";
const timerDuration = parseInt(sessionStorage.getItem("timerDuration"));

if (!username || !maxRetries || (timerEnabled && !timerDuration)) {
    window.location.href = "index.html";
}

document.getElementById("winMessage").textContent = `Congratulations, ${username}!`;

// CARD DATA
const cardPairs = [
    { id: 1, value: "images/cat.png" },
    { id: 2, value: "images/crab.png" },
    { id: 3, value: "images/dog.png" },
    { id: 4, value: "images/fish.png" },
    { id: 5, value: "images/moon.png" },
    { id: 6, value: "images/sun.png" },
];

let cards = [];

// GAME VARIABLES
let firstCard = null;
let secondCard = null;
let canFlip = true;

let matches = 0;
let failures = 0;
let misses = 0;

let seenCards = new Set();

let seconds = timerEnabled ? timerDuration : 0;
let elapsedSeconds = 0;
let timerInterval;
let timerRunning = false;

let secondPickTimer = null;
let missOpportunityThisMove = false;

// CREATE CARDS ARRAY
function createCards() {
    cards = [];
    let uniqueCardId = 1;

    cardPairs.forEach((pair) => {
        cards.push({
            cardId: uniqueCardId++,
            id: pair.id,
            value: pair.value,
            state: "hidden",
        });

        cards.push({
            cardId: uniqueCardId++,
            id: pair.id,
            value: pair.value,
            state: "hidden",
        });
    });

    cards.sort(() => Math.random() - 0.5);
}

// GET CARD ELEMENT
function getCardElement(cardId) {
    return document.querySelector(`[data-card-id="${cardId}"]`);
}

// GET KNOWN UNMATCHED PAIRS
function getKnownUnmatchedPairs() {
    const counts = {};

    cards.forEach(card => {
        if (seenCards.has(card.cardId) && card.state !== "matched") {
            counts[card.id] = (counts[card.id] || 0) + 1;
        }
    });

    return Object.keys(counts).filter(id => counts[id] === 2);
}

function wouldFirstClickCreateKnownPair(card) {
    if (!card || card.state === "matched") return false;

    const seenSamePair = cards.filter(other =>
        other.cardId !== card.cardId &&
        other.id === card.id &&
        seenCards.has(other.cardId) &&
        other.state !== "matched"
    );

    return seenSamePair.length > 0;
}

// START GAME
function startGame() {
    const board = document.getElementById("gameBoard");
    board.innerHTML = "";

    resetGameState();
    createCards();

    cards.forEach((card) => {
        const cardElement = document.createElement("div");
        cardElement.className = "card";
        cardElement.dataset.cardId = card.cardId;

        cardElement.innerHTML = `
        <div class="card-front">?</div>
        <div class="card-back">
            <img src="${card.value}" alt="Memory card image">
        </div>
        `;

        cardElement.onclick = flipCard;
        board.appendChild(cardElement);
    });

    showPreview();
}

// PREVIEW
function showPreview() {
    canFlip = false;

    cards.forEach((card) => {
        card.state = "flipped";
        getCardElement(card.cardId)?.classList.add("flipped");
    });

    setTimeout(() => {
        cards.forEach((card) => {
            card.state = "hidden";
            getCardElement(card.cardId)?.classList.remove("flipped");
        });

        canFlip = true;
    }, 700);
}

// FLIP CARD
function flipCard() {
    if (!canFlip) return;

    const clickedCardId = Number(this.dataset.cardId);
    const clickedCard = cards.find(c => c.cardId === clickedCardId);

    if (!clickedCard) return;
    if (clickedCard.state === "flipped" || clickedCard.state === "matched") return;

    if (!timerRunning) startTimer();

    // mark as seen
    seenCards.add(clickedCard.cardId);

    clickedCard.state = "flipped";
    this.classList.add("flipped");

    // FIRST CARD
    if (!firstCard) {
        const knownPairsBeforeMove = getKnownUnmatchedPairs();

        missOpportunityThisMove =
            knownPairsBeforeMove.length > 0 || wouldFirstClickCreateKnownPair(clickedCard);

        firstCard = clickedCard;

        secondPickTimer = setTimeout(() => {
            if (firstCard && firstCard.state === "flipped") {
                firstCard.state = "hidden";
                getCardElement(firstCard.cardId)?.classList.remove("flipped");
                firstCard = null;
                missOpportunityThisMove = false;
            }
        }, 10000);

        return;
    }

    // SECOND CARD
    secondCard = clickedCard;
    clearTimeout(secondPickTimer);

    canFlip = false;
    checkMatch();
}

// CHECK MATCH
function checkMatch() {
    const isMatch = firstCard.id === secondCard.id;

    if (isMatch) {
        setTimeout(() => {
            firstCard.state = "matched";
            secondCard.state = "matched";

            const firstCardElement = getCardElement(firstCard.cardId);
            const secondCardElement = getCardElement(secondCard.cardId);

            firstCardElement?.classList.add("matched", "just-matched");
            secondCardElement?.classList.add("matched", "just-matched");

            setTimeout(() => {
                firstCardElement?.classList.remove("just-matched");
                secondCardElement?.classList.remove("just-matched");
            }, 350);

            matches++;
            updateStats();
            resetCards();

            if (matches === cardPairs.length) winGame();
        }, 500);
    } else {
        failures++;
        updateStats();

        if (failures >= maxRetries) {
            loseGame();
            return;
        }

        const firstCardElement = getCardElement(firstCard.cardId);
        const secondCardElement = getCardElement(secondCard.cardId);

        firstCardElement?.classList.add("mismatch");
        secondCardElement?.classList.add("mismatch");

        setTimeout(() => {
            firstCard.state = "hidden";
            secondCard.state = "hidden";

            firstCardElement?.classList.remove("flipped", "mismatch");
            secondCardElement?.classList.remove("flipped", "mismatch");

            // MISS LOGIC
            if (missOpportunityThisMove) {
                misses++;
            }

            updateStats();
            resetCards();
        }, 1000);
    }
}

// RESET CARDS
function resetCards() {
    firstCard = null;
    secondCard = null;
    canFlip = true;
    missOpportunityThisMove = false;
}

// TIMER
function startTimer() {
    timerRunning = true;

    timerInterval = setInterval(() => {
        elapsedSeconds++;

        if (timerEnabled) {
            seconds--;

            if (seconds <= 0) {
                seconds = 0;
                updateStats();
                loseGame();
                return;
            }
        } else {
            seconds++;
        }

        updateStats();
    }, 1000);
}

// UPDATE UI
function updateStats() {
    document.getElementById("retries").textContent = `${failures}/${maxRetries}`;
    document.getElementById("misses").textContent = misses;
    document.getElementById("matches").textContent = `${matches}/${cardPairs.length}`;

    let mins = Math.floor(seconds / 60);
    let secs = seconds % 60;
    if (secs < 10) secs = "0" + secs;

    document.getElementById("time").textContent = `${mins}:${secs}`;
}

function formatDisplayTime(totalSeconds) {
    let mins = Math.floor(totalSeconds / 60);
    let secs = totalSeconds % 60;
    if (secs < 10) secs = "0" + secs;
    return `${mins}:${secs}`;
}

function getStatsHTML() {
    return `
        <div class="dialog-stat-row"><span>Matches</span><span>${matches}/${cardPairs.length}</span></div>
        <div class="dialog-stat-row"><span>Retries</span><span>${failures}/${maxRetries}</span></div>
        <div class="dialog-stat-row"><span>Misses</span><span>${misses}</span></div>
        <div class="dialog-stat-row"><span>Time Taken</span><span>${formatDisplayTime(elapsedSeconds)}</span></div>
    `;
}

// WIN / LOSE
function winGame() {
    clearInterval(timerInterval);
    clearTimeout(secondPickTimer);
    canFlip = false;

    document.getElementById("winStats").innerHTML = getStatsHTML();

    setTimeout(() => {
        document.getElementById("winModal").classList.remove("hidden");
    }, 300);
}

function loseGame() {
    clearInterval(timerInterval);
    clearTimeout(secondPickTimer);
    canFlip = false;

    document.getElementById("loseStats").innerHTML = getStatsHTML();

    setTimeout(() => {
        document.getElementById("loseModal").classList.remove("hidden");
    }, 300);
}

// RESTART
function restartGame() {
    clearInterval(timerInterval);
    clearTimeout(secondPickTimer);

    document.getElementById("winModal").classList.add("hidden");
    document.getElementById("loseModal").classList.add("hidden");

    startGame();
}

// RESET STATE
function resetGameState() {
    clearInterval(timerInterval);
    clearTimeout(secondPickTimer);

    firstCard = null;
    secondCard = null;
    canFlip = true;
    missOpportunityThisMove = false;

    matches = 0;
    failures = 0;
    misses = 0;

    seenCards.clear();

    seconds = timerEnabled ? timerDuration : 0;
    elapsedSeconds = 0;
    timerRunning = false;

    updateStats();
}

function resetGame() {
    sessionStorage.clear();
    window.location.href = "index.html";
}

// START
startGame();
