// ═══════════════════════════════════════════════════════
// Kraepelin Test — Main Application Logic (Redesigned)
// ═══════════════════════════════════════════════════════

const DURATION_MS = 5 * 60 * 1000; // 5 minutes in ms
const TIMER_UPDATE_INTERVAL = 100; // timer tick interval

// ─── State ───────────────────────────────────────────
let state = {
  status: 'IDLE', // 'IDLE' | 'RUNNING' | 'FINISHED'
  endTime: null,
  previousQuestion: null, // { a, b, correctDigit, chosenDigit }
  currentQuestion: null,  // { a, b, correctDigit }
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

  // Screens
  screenIdle: $('screen-idle'),
  screenRunning: $('screen-running'),
  screenFinished: $('screen-finished'),

  // Stream Question Blocks
  previousBlock: $('previous-block'),
  prevA: $('prev-a'),
  prevB: $('prev-b'),
  prevKeypad: $('prev-keypad'),

  currentBlock: $('current-block'),
  currentA: $('current-a'),
  currentB: $('current-b'),
  currentKeypad: $('current-keypad'),

  // Action Buttons
  btnStart: $('btn-start'),
  btnRestart: $('btn-restart'),

  // Result Elements
  resultCorrect: $('result-correct'),
  resultWrong: $('result-wrong'),
  resultTotal: $('result-total'),
  resultAccuracy: $('result-accuracy'),
  resultScore: $('result-score'),
  resultEmoji: $('result-emoji'),
};

// ─── Question Generator ──────────────────────────────
// Generates numbers 1..99 (or 1..9 weighted for familiar single-digit start)
function generateQuestion() {
  const a = Math.floor(Math.random() * 99) + 1;
  const b = Math.floor(Math.random() * 99) + 1;
  const correctDigit = (a + b) % 10;
  return { a, b, correctDigit };
}

// ─── Screen Switcher ─────────────────────────────────
function showScreen(screenName) {
  dom.screenIdle.classList.remove('active');
  dom.screenRunning.classList.remove('active');
  dom.screenFinished.classList.remove('active');

  if (screenName === 'IDLE') dom.screenIdle.classList.add('active');
  else if (screenName === 'RUNNING') dom.screenRunning.classList.add('active');
  else if (screenName === 'FINISHED') dom.screenFinished.classList.add('active');
}

// ─── Timer Functions ─────────────────────────────────
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

  if (remaining <= 60000) {
    dom.timerCard.classList.add('urgent');
  }
  if (remaining <= 30000) {
    dom.timerCard.classList.add('critical');
  }
}

// ─── Render Logic ────────────────────────────────────
function renderQuestions() {
  // Render Previous Question (if exists)
  if (state.previousQuestion) {
    dom.previousBlock.style.display = 'flex';
    dom.prevA.textContent = state.previousQuestion.a;
    dom.prevB.textContent = state.previousQuestion.b;

    // Highlight the chosen digit with orange active class
    const prevKeys = dom.prevKeypad.querySelectorAll('.key-item');
    prevKeys.forEach((key) => {
      const digit = parseInt(key.dataset.digit, 10);
      if (digit === state.previousQuestion.chosenDigit) {
        key.classList.add('selected');
      } else {
        key.classList.remove('selected');
      }
    });
  } else {
    dom.previousBlock.style.display = 'none';
  }

  // Render Current Active Question
  if (state.currentQuestion) {
    dom.currentA.textContent = state.currentQuestion.a;
    dom.currentB.textContent = state.currentQuestion.b;

    // Clear selected state on active keypad
    const currentKeys = dom.currentKeypad.querySelectorAll('.key-item');
    currentKeys.forEach((key) => key.classList.remove('selected'));
  }
}

function renderScores() {
  dom.correctCount.textContent = state.correctCount;
  dom.wrongCount.textContent = state.wrongCount;
  dom.totalCount.textContent = state.totalAnswered;
}

function pulseCard(card) {
  card.classList.remove('pulse');
  void card.offsetWidth;
  card.classList.add('pulse');
}

// ─── Core Interaction Logic ──────────────────────────
function submitAnswer(digit) {
  if (state.status !== 'RUNNING') return;

  // Visual button feedback on current keypad
  const activeBtn = dom.currentKeypad.querySelector(`[data-digit="${digit}"]`);
  if (activeBtn) {
    activeBtn.classList.add('selected');
  }

  state.totalAnswered += 1;
  const isCorrect = digit === state.currentQuestion.correctDigit;

  if (isCorrect) {
    state.correctCount += 1;
    pulseCard(dom.correctCard);
  } else {
    state.wrongCount += 1;
    pulseCard(dom.wrongCard);
  }

  renderScores();

  // Shift current question to previous question
  state.previousQuestion = {
    ...state.currentQuestion,
    chosenDigit: digit,
    isCorrect,
  };

  // Generate new question immediately
  state.currentQuestion = generateQuestion();
  renderQuestions();
}

function startSession() {
  state.status = 'RUNNING';
  state.correctCount = 0;
  state.wrongCount = 0;
  state.totalAnswered = 0;
  state.endTime = Date.now() + DURATION_MS;
  state.previousQuestion = null;
  state.currentQuestion = generateQuestion();

  // Reset UI
  dom.timerCard.classList.remove('urgent', 'critical');
  dom.timerDisplay.textContent = '05:00';
  renderScores();
  renderQuestions();
  showScreen('RUNNING');

  // Start timer
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, TIMER_UPDATE_INTERVAL);
}

function finishSession() {
  state.status = 'FINISHED';
  clearInterval(timerInterval);
  timerInterval = null;

  dom.timerDisplay.textContent = '00:00';

  const accuracy = state.totalAnswered === 0
    ? 0
    : (state.correctCount / state.totalAnswered) * 100;

  let emoji = '🎯';
  if (accuracy >= 90) emoji = '🏆';
  else if (accuracy >= 75) emoji = '🌟';
  else if (accuracy >= 50) emoji = '💪';
  else emoji = '📈';

  dom.resultCorrect.textContent = state.correctCount;
  dom.resultWrong.textContent = state.wrongCount;
  dom.resultTotal.textContent = state.totalAnswered;
  dom.resultAccuracy.textContent = `${accuracy.toFixed(1)}%`;
  dom.resultScore.textContent = state.correctCount;
  dom.resultEmoji.textContent = emoji;

  showScreen('FINISHED');
}

// ─── Keyboard Listener ───────────────────────────────
function mapKeyToDigit(event) {
  if (event.key >= '0' && event.key <= '9') {
    return parseInt(event.key, 10);
  }

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

// ─── Event Bindings ──────────────────────────────────
document.addEventListener('keydown', onKeyDown);

dom.btnStart.addEventListener('click', startSession);
dom.btnRestart.addEventListener('click', startSession);

// On-screen keypad button clicks
dom.currentKeypad.addEventListener('click', (e) => {
  const btn = e.target.closest('.key-item');
  if (!btn) return;
  if (state.status !== 'RUNNING') return;

  const digit = parseInt(btn.dataset.digit, 10);
  submitAnswer(digit);
});

// ─── Initialize ──────────────────────────────────────
showScreen('IDLE');
