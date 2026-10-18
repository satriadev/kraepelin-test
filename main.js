// ═══════════════════════════════════════════════════════
// Kraepelin Test — Main Application Logic
// ═══════════════════════════════════════════════════════

const DURATION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
const TIMER_UPDATE_INTERVAL = 100; // update timer display every 100ms

// ─── State ───────────────────────────────────────────
let state = {
  status: 'IDLE', // 'IDLE' | 'RUNNING' | 'FINISHED'
  endTime: null,
  currentQuestion: null,
  correctCount: 0,
  wrongCount: 0,
  totalAnswered: 0,
};

let timerInterval = null;

// ─── DOM References ──────────────────────────────────
const $ = (id) => document.getElementById(id);

const dom = {
  timerDisplay: $('timer-display'),
  timerCard: $('timer-card'),
  correctCount: $('correct-count'),
  correctCard: $('correct-card'),
  wrongCount: $('wrong-count'),
  wrongCard: $('wrong-card'),
  totalCount: $('total-count'),
  questionA: $('question-a'),
  questionB: $('question-b'),
  questionContainer: $('question-container'),
  feedbackFlash: $('feedback-flash'),
  screenIdle: $('screen-idle'),
  screenRunning: $('screen-running'),
  screenFinished: $('screen-finished'),
  btnStart: $('btn-start'),
  btnRestart: $('btn-restart'),
  keypad: $('keypad'),
  // Result screen
  resultCorrect: $('result-correct'),
  resultWrong: $('result-wrong'),
  resultTotal: $('result-total'),
  resultAccuracy: $('result-accuracy'),
  resultScore: $('result-score'),
  resultEmoji: $('result-emoji'),
};

// ─── Question Generator ──────────────────────────────
function generateQuestion() {
  const a = Math.floor(Math.random() * 99) + 1; // 1..99
  const b = Math.floor(Math.random() * 99) + 1; // 1..99
  const correctDigit = (a + b) % 10;
  return { a, b, correctDigit };
}

// ─── Screen Management ───────────────────────────────
function showScreen(screenName) {
  dom.screenIdle.classList.remove('active');
  dom.screenRunning.classList.remove('active');
  dom.screenFinished.classList.remove('active');

  if (screenName === 'IDLE') dom.screenIdle.classList.add('active');
  else if (screenName === 'RUNNING') dom.screenRunning.classList.add('active');
  else if (screenName === 'FINISHED') dom.screenFinished.classList.add('active');
}

// ─── Timer ───────────────────────────────────────────
function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateTimer() {
  if (state.status !== 'RUNNING') return;

  const remaining = state.endTime - Date.now();

  if (remaining <= 0) {
    finishSession();
    return;
  }

  dom.timerDisplay.textContent = formatTime(remaining);

  // Add urgency class when less than 60 seconds
  if (remaining <= 60000) {
    dom.timerCard.classList.add('urgent');
  }
  // Add warning class when less than 30 seconds
  if (remaining <= 30000) {
    dom.timerCard.classList.add('critical');
  }
}

// ─── Render ──────────────────────────────────────────
function renderQuestion() {
  if (!state.currentQuestion) return;
  dom.questionA.textContent = state.currentQuestion.a;
  dom.questionB.textContent = state.currentQuestion.b;
}

function renderScores() {
  dom.correctCount.textContent = state.correctCount;
  dom.wrongCount.textContent = state.wrongCount;
  dom.totalCount.textContent = state.totalAnswered;
}

// ─── Feedback Flash ──────────────────────────────────
function showFeedback(isCorrect) {
  const flash = dom.feedbackFlash;
  flash.className = 'feedback-flash';

  // Force reflow to restart animation
  void flash.offsetWidth;

  flash.classList.add(isCorrect ? 'flash-correct' : 'flash-wrong');

  // Also flash the corresponding score card
  const card = isCorrect ? dom.correctCard : dom.wrongCard;
  card.classList.remove('pulse');
  void card.offsetWidth;
  card.classList.add('pulse');
}

// ─── Core Logic ──────────────────────────────────────
function submitAnswer(digit) {
  if (state.status !== 'RUNNING') return;

  state.totalAnswered += 1;
  const isCorrect = digit === state.currentQuestion.correctDigit;

  if (isCorrect) {
    state.correctCount += 1;
  } else {
    state.wrongCount += 1;
  }

  showFeedback(isCorrect);
  renderScores();

  // Generate and show new question immediately
  state.currentQuestion = generateQuestion();
  renderQuestion();
}

function startSession() {
  state.status = 'RUNNING';
  state.correctCount = 0;
  state.wrongCount = 0;
  state.totalAnswered = 0;
  state.endTime = Date.now() + DURATION_MS;
  state.currentQuestion = generateQuestion();

  // Reset UI
  dom.timerCard.classList.remove('urgent', 'critical');
  dom.timerDisplay.textContent = '05:00';
  renderScores();
  renderQuestion();
  showScreen('RUNNING');

  // Start timer
  timerInterval = setInterval(updateTimer, TIMER_UPDATE_INTERVAL);
}

function finishSession() {
  state.status = 'FINISHED';
  clearInterval(timerInterval);
  timerInterval = null;

  dom.timerDisplay.textContent = '00:00';

  // Calculate results
  const accuracy = state.totalAnswered === 0
    ? 0
    : (state.correctCount / state.totalAnswered) * 100;

  // Pick result emoji
  let emoji = '🎯';
  if (accuracy >= 90) emoji = '🏆';
  else if (accuracy >= 75) emoji = '🌟';
  else if (accuracy >= 50) emoji = '💪';
  else emoji = '📈';

  // Populate result screen
  dom.resultCorrect.textContent = state.correctCount;
  dom.resultWrong.textContent = state.wrongCount;
  dom.resultTotal.textContent = state.totalAnswered;
  dom.resultAccuracy.textContent = `${accuracy.toFixed(1)}%`;
  dom.resultScore.textContent = state.correctCount;
  dom.resultEmoji.textContent = emoji;

  showScreen('FINISHED');
}

function resetToIdle() {
  state.status = 'IDLE';
  state.endTime = null;
  state.currentQuestion = null;
  state.correctCount = 0;
  state.wrongCount = 0;
  state.totalAnswered = 0;

  clearInterval(timerInterval);
  timerInterval = null;

  dom.timerCard.classList.remove('urgent', 'critical');
  dom.timerDisplay.textContent = '05:00';
  renderScores();
  showScreen('IDLE');
}

// ─── Keyboard Listener ──────────────────────────────
function mapKeyToDigit(event) {
  // Standard digit keys (top row)
  if (event.key >= '0' && event.key <= '9') {
    return parseInt(event.key, 10);
  }

  // Numpad keys
  const numpadMap = {
    'Numpad0': 0, 'Numpad1': 1, 'Numpad2': 2, 'Numpad3': 3,
    'Numpad4': 4, 'Numpad5': 5, 'Numpad6': 6, 'Numpad7': 7,
    'Numpad8': 8, 'Numpad9': 9,
  };

  if (numpadMap.hasOwnProperty(event.code)) {
    return numpadMap[event.code];
  }

  return null;
}

function onKeyDown(event) {
  if (state.status !== 'RUNNING') return;
  if (event.repeat) return;
  if (event.ctrlKey || event.altKey || event.metaKey) return;

  const digit = mapKeyToDigit(event);
  if (digit === null) return;

  event.preventDefault();
  submitAnswer(digit);
}

// ─── Event Listeners ─────────────────────────────────
document.addEventListener('keydown', onKeyDown);

dom.btnStart.addEventListener('click', startSession);
dom.btnRestart.addEventListener('click', startSession);

// On-screen keypad for touch devices (UX-10)
dom.keypad.addEventListener('click', (e) => {
  const btn = e.target.closest('.keypad-btn');
  if (!btn) return;
  if (state.status !== 'RUNNING') return;

  const digit = parseInt(btn.dataset.digit, 10);
  submitAnswer(digit);
});

// Prevent zoom on double-tap for mobile
document.addEventListener('touchstart', (e) => {
  if (e.target.closest('.keypad-btn') || e.target.closest('.btn-primary')) {
    // Allow single tap but prevent default to avoid zoom
  }
}, { passive: true });

// ─── Initialize ──────────────────────────────────────
showScreen('IDLE');
