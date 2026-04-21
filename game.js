// Load Settings From setup.js
const username = sessionStorage.getItem("username");
const maxRetries = parseInt(sessionStorage.getItem("maxRetries"));
const timerEnabled = sessionStorage.getItem("timerEnabled") === "true";
const timerDuration = parseInt(sessionStorage.getItem("timerDuration"));

if (!username || !maxRetries || (timerEnabled && !timerDuration)) {
  window.location.href = "index.html";
}

// Card Data
const cardPairs = [
  { id: 1, value: "images/cat.png" },
  { id: 2, value: "images/crab.png" },
  { id: 3, value: "images/dog.png" },
  { id: 4, value: "images/fish.png" },
  { id: 5, value: "images/moon.png" },
  { id: 6, value: "images/sun.png" },
];

let cards = [];

// Game Variables
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

// Helper Functions
function stopTimers() {
  clearInterval(timerInterval);
  clearTimeout(secondPickTimer);
}

function getCardElement(cardId) {
  return document.querySelector(`[data-card-id="${cardId}"]`);
}

function getSelectedCardElements() {
  return {
    firstCardElement: firstCard ? getCardElement(firstCard.cardId) : null,
    secondCardElement: secondCard ? getCardElement(secondCard.cardId) : null,
  };
}

function updateSelectedCardClasses(action, ...classes) {
  const { firstCardElement, secondCardElement } = getSelectedCardElements();
  firstCardElement?.classList[action](...classes);
  secondCardElement?.classList[action](...classes);
}

function setAllCardsState(state, classAction) {
  cards.forEach((card) => {
    card.state = state;
    getCardElement(card.cardId)?.classList[classAction]("flipped");
  });
}

function formatDisplayTime(totalSeconds) {
  let mins = Math.floor(totalSeconds / 60);
  let secs = totalSeconds % 60;
  if (secs < 10) secs = "0" + secs;
  return `${mins}:${secs}`;
}

function shuffleCards(cardsArray) {
  for (let i = cardsArray.length - 1; i > 0; i--) {
    const randIndex = Math.floor(Math.random() * (i + 1));
    [cardsArray[i], cardsArray[randIndex]] = [
      cardsArray[randIndex],
      cardsArray[i],
    ];
  }
}

// Create Cards Array
function createCards() {
  let uniqueCardId = 1;

  cards = cardPairs.flatMap((pair) => [
    {
      cardId: uniqueCardId++,
      id: pair.id,
      value: pair.value,
      state: "hidden",
    },
    {
      cardId: uniqueCardId++,
      id: pair.id,
      value: pair.value,
      state: "hidden",
    },
  ]);

  shuffleCards(cards);
}

// Get Known Unmatched Pairs (For Misses Counter)
function getKnownUnmatchedPairs() {
  const counts = {};

  cards.forEach((card) => {
    if (seenCards.has(card.cardId) && card.state !== "matched") {
      counts[card.id] = (counts[card.id] || 0) + 1;
    }
  });

  return Object.keys(counts).filter((id) => counts[id] === 2);
}

function wouldFirstClickCreateKnownPair(card) {
  if (!card || card.state === "matched") return false;

  const seenSamePair = cards.filter(
    (other) =>
      other.cardId !== card.cardId &&
      other.id === card.id &&
      seenCards.has(other.cardId) &&
      other.state !== "matched",
  );

  return seenSamePair.length > 0;
}

// Start Game
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

// Preview
function showPreview() {
  canFlip = false;
  setAllCardsState("flipped", "add");

  setTimeout(() => {
    setAllCardsState("hidden", "remove");
    canFlip = true;
  }, 700);
}

// Flip Card
function flipCard() {
  if (!canFlip) return;

  const clickedCardId = Number(this.dataset.cardId);
  const clickedCard = cards.find((c) => c.cardId === clickedCardId);

  if (!clickedCard) return;
  if (clickedCard.state === "flipped" || clickedCard.state === "matched")
    return;

  if (!timerRunning) startTimer();

  seenCards.add(clickedCard.cardId);

  clickedCard.state = "flipped";
  this.classList.add("flipped");

  // First Card
  if (!firstCard) {
    const knownPairsBeforeMove = getKnownUnmatchedPairs();

    missOpportunityThisMove =
      knownPairsBeforeMove.length > 0 ||
      wouldFirstClickCreateKnownPair(clickedCard);

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

  // Second Card
  secondCard = clickedCard;
  clearTimeout(secondPickTimer);

  canFlip = false;
  checkMatch();
}

// Check Match
function checkMatch() {
  const isMatch = firstCard.id === secondCard.id;

  if (isMatch) {
    setTimeout(() => {
      firstCard.state = "matched";
      secondCard.state = "matched";

      updateSelectedCardClasses("add", "matched", "just-matched");

      setTimeout(() => {
        updateSelectedCardClasses("remove", "just-matched");
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

    updateSelectedCardClasses("add", "mismatch");

    setTimeout(() => {
      firstCard.state = "hidden";
      secondCard.state = "hidden";

      updateSelectedCardClasses("remove", "flipped", "mismatch");

      if (missOpportunityThisMove) {
        misses++;
      }

      updateStats();
      resetCards();
    }, 1000);
  }
}

// Reset Cards
function resetCards() {
  firstCard = null;
  secondCard = null;
  canFlip = true;
  missOpportunityThisMove = false;
}

// Timer
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

// Update UI
function updateStats() {
  document.getElementById("retries").textContent = `${failures}/${maxRetries}`;
  document.getElementById("misses").textContent = misses;
  document.getElementById("matches").textContent =
    `${matches}/${cardPairs.length}`;
  document.getElementById("time").textContent = formatDisplayTime(seconds);
}

function getStatsHTML() {
  return `
    <div class="dialog-stat-row"><span>Matches</span><span>${matches}/${cardPairs.length}</span></div>
    <div class="dialog-stat-row"><span>Retries</span><span>${failures}/${maxRetries}</span></div>
    <div class="dialog-stat-row"><span>Misses</span><span>${misses}</span></div>
    <div class="dialog-stat-row"><span>Time Taken</span><span>${formatDisplayTime(elapsedSeconds)}</span></div>
  `;
}

// Win / Lose
function winGame() {
  stopTimers();
  canFlip = false;

  document.getElementById("winMessage").textContent =
    `Congratulations, ${username}!`;
  document.getElementById("winStats").innerHTML = getStatsHTML();

  setTimeout(() => {
    document.getElementById("winModal").classList.remove("hidden");
  }, 300);
}

function loseGame() {
  stopTimers();
  canFlip = false;

  document.getElementById("loseStats").innerHTML = getStatsHTML();

  setTimeout(() => {
    document.getElementById("loseModal").classList.remove("hidden");
  }, 300);
}

// Restart
function restartGame() {
  stopTimers();

  document.getElementById("winModal").classList.add("hidden");
  document.getElementById("loseModal").classList.add("hidden");

  startGame();
}

// Reset State
function resetGameState() {
  stopTimers();

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

// Start
startGame();