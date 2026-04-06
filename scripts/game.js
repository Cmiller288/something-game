import { saveScore, getScore, saveSettings, getSettings } from './storage.js';

const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const highScoreEl = document.getElementById('highScore');
const timerProgress = document.getElementById('timerProgress');
const boardEl = document.getElementById('board');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const settingsForm = document.getElementById('settingsForm');
const playerNameInput = document.getElementById('playerName');
const difficultySelect = document.getElementById('difficulty');
const playerNameError = document.getElementById('playerNameError');
const difficultyError = document.getElementById('difficultyError');

const gameData = [
  { difficulty: 'easy', label: 'Easy', time: 15 },
  { difficulty: 'medium', label: 'Medium', time: 10 },
  { difficulty: 'hard', label: 'Hard', time: 5 }
];

const boardData = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  label: `Target ${index + 1}`
}));

let score = 0;
let timeLeft = 10;
let timer = null;
let gameActive = false;
let activeCellId = null;
let playerName = 'Guest';

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function getDifficultyTime(value) {
  return gameData.find((option) => option.difficulty === value)?.time || 10;
}

function getStoredHighScore() {
  return parseInt(getScore(), 10) || 0;
}

function renderDifficultyOptions() {
  difficultySelect.innerHTML = '<option value="">Select Difficulty</option>';
  gameData.forEach(({ difficulty, label, time }) => {
    const option = document.createElement('option');
    option.value = difficulty;
    option.textContent = `${label} (${time}s)`;
    difficultySelect.append(option);
  });
}

function renderBoard() {
  boardEl.innerHTML = '';
  boardData.forEach((cell) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'board-button';
    button.dataset.cellId = cell.id;
    button.textContent = cell.label;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', handleBoardClick);

    const wrapper = document.createElement('div');
    wrapper.className = 'board-cell';
    wrapper.appendChild(button);
    boardEl.appendChild(wrapper);
  });

  chooseNewTarget();
}

function updateActiveCell() {
  boardData.forEach((cell) => {
    const button = boardEl.querySelector(`[data-cell-id="${cell.id}"]`);
    if (!button) return;

    const active = cell.id === activeCellId;
    button.classList.toggle('active', active);
    button.setAttribute('aria-label', active ? `${cell.label} active target` : `${cell.label} inactive target`);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.textContent = active ? 'CLICK ME!' : cell.label;
  });
}

function chooseNewTarget() {
  const availableIds = boardData.map((cell) => cell.id).filter((id) => id !== activeCellId);
  activeCellId = availableIds[Math.floor(Math.random() * availableIds.length)];
  updateActiveCell();
}

function updateDisplays() {
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  highScoreEl.textContent = getStoredHighScore();
  const currentDifficulty = difficultySelect.value || getSettings().difficulty || 'medium';
  const maxTime = getDifficultyTime(currentDifficulty);
  const progressPercent = Math.max(0, (timeLeft / maxTime) * 100);
  timerProgress.style.width = `${progressPercent}%`;
  timerProgress.setAttribute('aria-valuenow', `${Math.round(progressPercent)}`);
}

function loadSettings() {
  const settings = getSettings();

  if (settings.name) {
    playerName = settings.name;
    playerNameInput.value = settings.name;
  }

  if (settings.difficulty) {
    difficultySelect.value = settings.difficulty;
  }
}

function showFieldError(field, message) {
  field.classList.add('is-invalid');
  const messageElement = field === playerNameInput ? playerNameError : difficultyError;
  messageElement.textContent = message;
}

function clearFieldError(field) {
  field.classList.remove('is-invalid');
  const messageElement = field === playerNameInput ? playerNameError : difficultyError;
  messageElement.textContent = '';
}

function validateForm() {
  let valid = true;

  if (!playerNameInput.checkValidity()) {
    showFieldError(playerNameInput, 'Please enter at least 3 letters for your name.');
    valid = false;
  }

  if (!difficultySelect.checkValidity()) {
    showFieldError(difficultySelect, 'Select a difficulty level before playing.');
    valid = false;
  }

  return valid;
}

function resetGameState() {
  clearInterval(timer);
  timer = null;
  gameActive = false;
  score = 0;
  const difficulty = difficultySelect.value || getSettings().difficulty || 'medium';
  timeLeft = getDifficultyTime(difficulty);
  shuffle(boardData);
  renderBoard();
  startBtn.disabled = false;
  updateDisplays();
}

function startGame() {
  if (gameActive) {
    return;
  }

  if (!difficultySelect.checkValidity()) {
    difficultySelect.reportValidity();
    return;
  }

  score = 0;
  timeLeft = getDifficultyTime(difficultySelect.value);
  gameActive = true;
  shuffle(boardData);
  renderBoard();
  startBtn.disabled = true;
  updateDisplays();

  timer = setInterval(() => {
    timeLeft -= 1;
    updateDisplays();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  clearInterval(timer);
  timer = null;
  gameActive = false;
  startBtn.disabled = false;

  if (score > getStoredHighScore()) {
    saveScore(score);
  }

  updateDisplays();
}

function handleBoardClick(event) {
  if (!gameActive) {
    return;
  }

  const clickedId = Number(event.currentTarget.dataset.cellId);
  if (clickedId !== activeCellId) {
    return;
  }

  score += 1;
  chooseNewTarget();
  updateDisplays();
}

function toggleSecretTheme() {
  const currentTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = currentTheme;
  console.log(`Secret theme enabled: ${currentTheme}`);
}

settingsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  clearFieldError(playerNameInput);
  clearFieldError(difficultySelect);

  if (!validateForm()) {
    return;
  }

  playerName = playerNameInput.value.trim();
  saveSettings({ name: playerName, difficulty: difficultySelect.value });

  resetGameState();
});

[playerNameInput, difficultySelect].forEach((field) => {
  field.addEventListener('input', () => clearFieldError(field));
});

startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', resetGameState);

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'g') {
    toggleSecretTheme();
  }
});

console.log('Hint: Press "G" on your keyboard to unlock a secret theme.');

renderDifficultyOptions();
loadSettings();
resetGameState();