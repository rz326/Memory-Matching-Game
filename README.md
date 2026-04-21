# Memory Matching Game

A browser-based memory matching game built with HTML, CSS and JavaScript.
The project focuses on state-driven game logic, player behaviour tracking and polished UI feedback.

## Features

- Setup screen for player name, retry limit and optional timer
- Card preview at game start (brief reveal before play begins)
- Interactive memory-based gameplay
- Randomised card placement on every game start
- Retry system (limits number of incorrect moves)
- Timer modes:
  - Count up (normal mode)
  - Count down (challenge mode)

- Match tracking and completion detection
- Advanced **Miss tracking system** (tracks missed opportunities based on player knowledge)
- End-of-game dialogs displaying full performance statistics:
  - Matches
  - Retries
  - Misses
  - Time taken

- Play Again (restart with same settings) and Reset (return to setup)
- Visual feedback:
  - Card flip animations
  - Shake animation on mismatch
  - Pop/glow animation on match
  - Delayed dialog appearance for smoother UX

---

## Files

- `index.html` – setup screen
- `game.html` – main game screen
- `styles.css` – styling and animations
- `setup.js` – setup page logic
- `game.js` – core game logic

---

## Technical Implementation Details

### Session Storage for State Transfer

This project uses `sessionStorage` to transfer user inputs from the setup screen to the game screen.

- Ensures data persists only within the current session
- Prevents stale values across multiple sessions
- Redirects user back to setup if required data is missing

This guarantees controlled access to the game flow and avoids invalid states.

---

### Card Data Model (State-Driven Design)

Each card is represented as a JavaScript object:

- `cardId` – unique identifier for each card instance
- `id` – pair identifier (used for matching)
- `value` – image source
- `state` – `"hidden"`, `"flipped"`, or `"matched"`

This separates:

- **data (game logic)** from
- **DOM (visual representation)**

The DOM simply reflects the state of the card objects.

---

### Deck Generation & Randomisation

- Each pair is duplicated to create a full deck
- Cards are assigned unique `cardId`s
- The deck is shuffled using a Fisher–Yates shuffle for a more reliable random ordering

This ensures a new layout every game.

---

### Game Flow

1. Cards are generated and rendered
2. All cards briefly reveal (preview phase)
3. Player selects cards:
   - First click stores `firstCard`
   - Second click triggers match check

4. If match:
   - Cards are permanently marked as matched

5. If not:
   - Cards flip back after brief delay
   - Retry counter increases

6. Game ends when:
   - All pairs are matched (win)
   - Retry limit is reached (loss)
   - Timer reaches zero (challenge mode)

---

### Timer System

Two time values are maintained:

- `seconds`
  - Controls the visible timer
  - Counts up or down depending on mode

- `elapsedSeconds`
  - Always counts upwards
  - Used for accurate **time taken** in end dialogs

This avoids incorrect time reporting when using countdown mode.

---

### Miss Tracking System

This project introduces a **behaviour-based metric**:

> A _Miss_ occurs when the player had enough information to make a correct match but failed to do so.

#### How it works

- The game tracks all previously seen cards using a `Set`
- It detects when:
  - A full pair is already known, or
  - The first card of a move completes a known pair

- If the player fails to match such a pair within that move:
  - `misses++`

#### Key Design Rule

Miss is evaluated based on whether the player had enough information to make a known match during that move and failed to do so.

This introduces a deeper layer of gameplay analysis beyond simple success/failure.

---

### Delayed Game Feedback

- Match confirmation delay (~500ms)
- Mismatch reveal delay (~1000ms)
- End-game dialog delay (~300ms)

These delays:

- Improve readability
- Allow players to process outcomes
- Prevent abrupt UI transitions

---

### Visual Feedback & Animations

- **Mismatch animation**
  - Cards briefly shake to indicate incorrect selection

- **Match animation**
  - Subtle pop/scale effect
  - Subtle glow for matched cards

- **Flip transitions**
  - Smooth card flipping using CSS transforms

Animations are intentionally kept short and subtle to maintain clarity without overwhelming the user.

---

### Defensive Programming

- Prevents interaction during animations (`canFlip`)
- Prevents clicking already flipped or matched cards
- Handles timeout edge cases (e.g., first card not followed by second)
- Resets all state cleanly between games

---

### Code Structure

- `setup.js`
  - Handles input validation and session storage

- `game.js`
  - Handles:
    - Card generation
    - Game logic
    - State tracking
    - Timer logic
    - UI updates

Clear separation of concerns improves readability and maintainability.

---

## Design Decisions

- **State-driven logic over DOM-driven logic**
  - Ensures consistency and easier debugging

- **Session-based storage**
  - Prevents unintended persistence across sessions

- **Miss tracking system**
  - Adds analytical depth and demonstrates reasoning-based logic

- **Dual timer system**
  - Separates gameplay timing from display timing for accuracy

- **Delayed feedback**
  - Improves user experience and clarity

---

## Future Improvements

- Sound effects
- Additional animations or themes
- Local leaderboard using `localStorage`
- Difficulty levels (more cards / larger grid)

---

## Live Demo

Play the game here: https://funmemorymatchinggame.netlify.app/

---

## How to Run Locally

Clone or download the repository, then open `index.html` in a web browser.
