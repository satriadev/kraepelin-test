// ═══════════════════════════════════════════════════════
// Kraepelin Test — Main Application Logic v2
// Pre-generated question pool + Pace chart
// ═══════════════════════════════════════════════════════

const TIMER_UPDATE_INTERVAL = 100;
const INITIAL_POOL_SIZE = 100;   // pre-generate 100 questions
const REFILL_THRESHOLD = 50;     // when 50 answered, add 50 more
const REFILL_AMOUNT = 50;
const DURATION_OPTIONS = [5, 10, 15, 30]; // allowed durations in minutes

// ─── Settings (chosen on idle screen) ────────────────
let settings = {
  durationMin: 5,          // 5 | 10 | 15 | 30
  mode: 'HARD',            // 'HARD' | 'EASY'
};

// ─── State ───────────────────────────────────────────
let state = {
  status: 'IDLE',          // 'IDLE' | 'RUNNING' | 'FINISHED'
  startTime: null,
  endTime: null,
  durationMs: 5 * 60 * 1000, // actual duration of current session
  mode: 'HARD',              // 'HARD' | 'EASY' of current session
  questionPool: [],        // Array of { a, b, correctDigit, answered, chosenDigit, isCorrect }
  currentIndex: 0,         // index into questionPool of the active question
  correctCount: 0,
  wrongCount: 0,
  totalAnswered: 0,
  answerLog: [],           // Array of { timestamp, isCorrect } for pace tracking
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

  screenIdle: $('screen-idle'),
  screenRunning: $('screen-running'),
  screenFinished: $('screen-finished'),

  streamScroll: $('stream-scroll'),
  streamContainer: $('stream-container'),

  btnStart: $('btn-start'),
  btnRestart: $('btn-restart'),

  modeOptions: $('mode-options'),
  durationOptions: $('duration-options'),
  modeDesc: $('mode-desc'),
  instrRange: $('instr-range'),
  instrDuration: $('instr-duration'),

  resultCorrect: $('result-correct'),
  resultWrong: $('result-wrong'),
  resultTotal: $('result-total'),
  resultAccuracy: $('result-accuracy'),
  resultScore: $('result-score'),
  resultEmoji: $('result-emoji'),
  resultSubtitle: $('result-subtitle'),
  paceChart: $('pace-chart'),
};

// ─── Heroicon SVGs for Results ───────────────────────
const RESULT_ICONS = {
  trophy: `<svg class="result-svg result-svg-trophy" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fill-rule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.27 15H8.25a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-1.02a6.708 6.708 0 0 1-1.127-3.176c1.01-.32 1.94-.783 2.742-1.346a6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c1.666-.213 3.36-.34 5.084-.378V9.75a5.253 5.253 0 0 1-4.706-4.5H5.166Zm13.668 0h-.378a5.253 5.253 0 0 1-4.706 4.5V4.872c1.724.038 3.418.165 5.084.378ZM19.645 6.44c-.452 2.378-2.146 4.298-4.395 4.908.435.535.952.997 1.536 1.365a5.253 5.253 0 0 0 3.754-4.887c-.298-.466-.6-.928-.895-1.386ZM4.355 6.44c.296.458.597.92.895 1.386a5.253 5.253 0 0 0 3.754 4.887 6.754 6.754 0 0 1 1.536-1.365c-2.25-.61-3.943-2.53-4.395-4.908A48.647 48.647 0 0 1 4.355 6.44ZM12 18a.75.75 0 0 1 .75.75v1.5h2.25a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1 0-1.5h2.25v-1.5A.75.75 0 0 1 12 18Z" clip-rule="evenodd" />
  </svg>`,
  star: `<svg class="result-svg result-svg-star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
  </svg>`,
  sparkles: `<svg class="result-svg result-svg-sparkles" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fill-rule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.502.8.95 0.95l1.182.394a.75.75 0 0 1 0 1.42l-1.183.394a1.875 1.875 0 0 0-.95.95l-.394 1.183a.75.75 0 0 1-1.424 0l-.394-1.183a1.875 1.875 0 0 0-.95-.95l-1.183-.394a.75.75 0 0 1 0-1.42l1.183-.394a1.875 1.875 0 0 0 .95-.95l.394-1.183A.75.75 0 0 1 16.5 15Z" clip-rule="evenodd" />
  </svg>`,
  trend: `<svg class="result-svg result-svg-trend" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
  </svg>`
};

// ─── Question Pool Generator ─────────────────────────
function generateQuestion() {
  // HARD: two numbers 1–99 (current behavior)
  // EASY: units addition only, both operands 0–9
  const a = state.mode === 'EASY'
    ? Math.floor(Math.random() * 10)   // 0–9
    : Math.floor(Math.random() * 99) + 1; // 1–99
  const b = state.mode === 'EASY'
    ? Math.floor(Math.random() * 10)   // 0–9
    : Math.floor(Math.random() * 99) + 1; // 1–99
  const correctDigit = (a + b) % 10;
  return { a, b, correctDigit, answered: false, chosenDigit: null, isCorrect: null };
}

function generatePool(count) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    questions.push(generateQuestion());
  }
  return questions;
}

// ─── DOM: Create Question Block Element ──────────────
function createQuestionBlockEl(question, index) {
  const block = document.createElement('div');
  block.className = 'question-block';
  block.dataset.index = index;

  // Determine state class
  if (index < state.currentIndex) {
    block.classList.add('answered-block');
  } else if (index === state.currentIndex) {
    block.classList.add('active-block');
  } else {
    block.classList.add('upcoming-block');
  }

  // Equation: a + b
  const eq = document.createElement('div');
  eq.className = 'question-equation';
  eq.innerHTML = `
    <span class="equation-num">${question.a}</span>
    <span class="equation-op">+</span>
    <span class="equation-num">${question.b}</span>
  `;

  // Keypad row: 0–9
  const row = document.createElement('div');
  row.className = 'keypad-row';

  for (let d = 0; d < 10; d++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'key-item';
    btn.dataset.digit = d;
    btn.textContent = d;

    // If already answered, highlight chosen digit
    if (question.answered && question.chosenDigit === d) {
      btn.classList.add('selected');
    }

    row.appendChild(btn);
  }

  block.appendChild(eq);
  block.appendChild(row);
  return block;
}

// ─── Render Pool into DOM ────────────────────────────
function renderPool() {
  dom.streamContainer.innerHTML = '';
  for (let i = 0; i < state.questionPool.length; i++) {
    const el = createQuestionBlockEl(state.questionPool[i], i);
    dom.streamContainer.appendChild(el);
  }
}

// Append new questions to the end of the DOM stream
function appendToStream(startIndex, count) {
  for (let i = startIndex; i < startIndex + count && i < state.questionPool.length; i++) {
    const el = createQuestionBlockEl(state.questionPool[i], i);
    dom.streamContainer.appendChild(el);
  }
}

// ─── Update Block States (Efficient) ─────────────────
function updateBlockStates(prevIndex, newIndex) {
  const blocks = dom.streamContainer.children;

  // Mark the previous active block as answered
  if (prevIndex >= 0 && prevIndex < blocks.length) {
    const prevBlock = blocks[prevIndex];
    prevBlock.classList.remove('active-block');
    prevBlock.classList.add('answered-block');

    // Highlight the chosen digit in previous block
    const q = state.questionPool[prevIndex];
    if (q.answered) {
      const keys = prevBlock.querySelectorAll('.key-item');
      keys.forEach((k) => {
        const d = parseInt(k.dataset.digit, 10);
        if (d === q.chosenDigit) {
          k.classList.add('selected');
        }
      });
    }
  }

  // Mark the new active block
  if (newIndex >= 0 && newIndex < blocks.length) {
    const newBlock = blocks[newIndex];
    newBlock.classList.remove('upcoming-block');
    newBlock.classList.add('active-block');
  }
}

// ─── Auto-Scroll to Active Question ──────────────────
function scrollToActive() {
  const blocks = dom.streamContainer.children;
  const idx = state.currentIndex;
  if (idx < 0 || idx >= blocks.length) return;

  const activeBlock = blocks[idx];
  const scrollContainer = dom.streamScroll;

  // Scroll so the active block is near the top with some padding
  const blockTop = activeBlock.offsetTop;
  const containerHeight = scrollContainer.clientHeight;
  const targetScroll = blockTop - 12; // small top padding

  scrollContainer.scrollTo({
    top: targetScroll,
    behavior: state.totalAnswered <= 1 ? 'auto' : 'smooth',
  });
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

  if (remaining <= 60000) dom.timerCard.classList.add('urgent');
  if (remaining <= 30000) dom.timerCard.classList.add('critical');
}

// ─── Render Scores ───────────────────────────────────
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

// ─── Core Logic ──────────────────────────────────────
function submitAnswer(digit) {
  if (state.status !== 'RUNNING') return;

  const q = state.questionPool[state.currentIndex];
  if (!q || q.answered) return;

  // Record answer
  q.answered = true;
  q.chosenDigit = digit;
  q.isCorrect = digit === q.correctDigit;

  state.totalAnswered += 1;

  if (q.isCorrect) {
    state.correctCount += 1;
    pulseCard(dom.correctCard);
  } else {
    state.wrongCount += 1;
    pulseCard(dom.wrongCard);
  }

  // Log for pace tracking
  state.answerLog.push({
    timestamp: Date.now(),
    isCorrect: q.isCorrect,
  });

  renderScores();

  // Update DOM block states
  const prevIndex = state.currentIndex;
  state.currentIndex += 1;
  updateBlockStates(prevIndex, state.currentIndex);

  // Check if we need to refill the pool
  const answeredCount = state.totalAnswered;
  const remaining = state.questionPool.length - state.currentIndex;
  if (remaining <= REFILL_THRESHOLD) {
    const newQuestions = generatePool(REFILL_AMOUNT);
    const startIdx = state.questionPool.length;
    state.questionPool.push(...newQuestions);
    appendToStream(startIdx, REFILL_AMOUNT);
  }

  // Scroll to the new active question
  scrollToActive();
}

function startSession() {
  // Reset state
  state.status = 'RUNNING';
  state.startTime = Date.now();
  state.durationMs = settings.durationMin * 60 * 1000;
  state.mode = settings.mode;
  state.endTime = Date.now() + state.durationMs;
  state.correctCount = 0;
  state.wrongCount = 0;
  state.totalAnswered = 0;
  state.currentIndex = 0;
  state.answerLog = [];

  // Pre-generate question pool
  state.questionPool = generatePool(INITIAL_POOL_SIZE);

  // Reset UI
  dom.timerCard.classList.remove('urgent', 'critical');
  dom.timerDisplay.textContent = formatTime(state.durationMs);
  renderScores();
  renderPool();
  showScreen('RUNNING');

  // Scroll to top
  dom.streamScroll.scrollTop = 0;

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

  let iconKey = 'trophy';
  if (accuracy >= 90) iconKey = 'trophy';
  else if (accuracy >= 75) iconKey = 'star';
  else if (accuracy >= 50) iconKey = 'sparkles';
  else iconKey = 'trend';

  dom.resultCorrect.textContent = state.correctCount;
  dom.resultWrong.textContent = state.wrongCount;
  dom.resultTotal.textContent = state.totalAnswered;
  dom.resultAccuracy.textContent = `${accuracy.toFixed(1)}%`;
  dom.resultScore.textContent = state.correctCount;
  dom.resultEmoji.innerHTML = RESULT_ICONS[iconKey] || RESULT_ICONS.trophy;
  dom.resultSubtitle.textContent =
    `Mode ${state.mode === 'EASY' ? 'Easy' : 'Hard'} · ${state.durationMs / 60000} Menit`;

  showScreen('FINISHED');
  drawPaceChart();
}

// ─── Pace Chart ──────────────────────────────────────
function drawPaceChart() {
  const canvas = dom.paceChart;
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.parentElement.clientWidth;
  const cssHeight = 220;

  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Calculate pace data bucketed into ~5 bars regardless of duration
  const totalMinutes = Math.round(state.durationMs / 60000);
  const bucketMinutes = Math.max(1, Math.ceil(totalMinutes / 5));
  const bucketCount = Math.ceil(totalMinutes / bucketMinutes);

  const minuteData = [];
  for (let m = 0; m < bucketCount; m++) {
    const bucketStart = state.startTime + m * bucketMinutes * 60000;
    const bucketEnd = state.startTime + (m + 1) * bucketMinutes * 60000;

    let correct = 0;
    let wrong = 0;

    for (const log of state.answerLog) {
      if (log.timestamp >= bucketStart && log.timestamp < bucketEnd) {
        if (log.isCorrect) correct++;
        else wrong++;
      }
    }

    const label = bucketMinutes === 1
      ? `Menit ${m + 1}`
      : `Menit ${m * bucketMinutes + 1}–${(m + 1) * bucketMinutes}`;
    minuteData.push({ label, correct, wrong, total: correct + wrong });
  }

  const maxTotal = Math.max(...minuteData.map((d) => d.total), 1);

  // Chart dimensions
  const padding = { top: 28, right: 16, bottom: 36, left: 40 };
  const chartW = cssWidth - padding.left - padding.right;
  const chartH = cssHeight - padding.top - padding.bottom;
  const barGap = 16;
  const barWidth = (chartW - barGap * (minuteData.length + 1)) / minuteData.length;

  // Clear
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  // Y-axis gridlines
  const gridSteps = 4;
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;
  ctx.font = '500 11px Inter, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= gridSteps; i++) {
    const val = Math.round((maxTotal / gridSteps) * i);
    const y = padding.top + chartH - (chartH * i) / gridSteps;

    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(cssWidth - padding.right, y);
    ctx.stroke();

    ctx.fillText(val.toString(), padding.left - 8, y);
  }

  // Draw bars
  for (let i = 0; i < minuteData.length; i++) {
    const d = minuteData[i];
    const x = padding.left + barGap + i * (barWidth + barGap);
    const totalHeight = (d.total / maxTotal) * chartH;
    const correctHeight = (d.correct / maxTotal) * chartH;
    const wrongHeight = (d.wrong / maxTotal) * chartH;
    const barBottom = padding.top + chartH;
    const barRadius = Math.min(6, barWidth / 2);

    // Draw correct portion (bottom, green)
    if (correctHeight > 0) {
      const y = barBottom - correctHeight;
      ctx.fillStyle = '#10b981';
      if (wrongHeight > 0) {
        // No rounded top, straight rectangle
        ctx.fillRect(x, y, barWidth, correctHeight);
      } else {
        // Rounded top (this is the top of the bar)
        drawRoundedRect(ctx, x, y, barWidth, correctHeight, barRadius, true, false);
        ctx.fill();
      }
    }

    // Draw wrong portion (top, stacked on correct, red)
    if (wrongHeight > 0) {
      const y = barBottom - totalHeight;
      ctx.fillStyle = '#ef4444';
      drawRoundedRect(ctx, x, y, barWidth, wrongHeight, barRadius, true, false);
      ctx.fill();
    }

    // Value label on top
    if (d.total > 0) {
      ctx.fillStyle = '#334155';
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(d.total.toString(), x + barWidth / 2, barBottom - totalHeight - 6);
    }

    // X-axis label
    ctx.fillStyle = '#64748b';
    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(d.label, x + barWidth / 2, barBottom + 10);
  }
}

function drawRoundedRect(ctx, x, y, w, h, r, roundTop, roundBottom) {
  const rt = roundTop ? r : 0;
  const rb = roundBottom ? r : 0;

  ctx.beginPath();
  ctx.moveTo(x + rt, y);
  ctx.lineTo(x + w - rt, y);
  if (roundTop) {
    ctx.quadraticCurveTo(x + w, y, x + w, y + rt);
  } else {
    ctx.lineTo(x + w, y);
  }
  ctx.lineTo(x + w, y + h - rb);
  if (roundBottom) {
    ctx.quadraticCurveTo(x + w, y + h, x + w - rb, y + h);
  } else {
    ctx.lineTo(x + w, y + h);
  }
  ctx.lineTo(x + rb, y + h);
  if (roundBottom) {
    ctx.quadraticCurveTo(x, y + h, x, y + h - rb);
  } else {
    ctx.lineTo(x, y + h);
  }
  ctx.lineTo(x, y + rt);
  if (roundTop) {
    ctx.quadraticCurveTo(x, y, x + rt, y);
  } else {
    ctx.lineTo(x, y);
  }
  ctx.closePath();
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

// ─── Settings Selection ──────────────────────────────
const MODE_DESC = {
  HARD: 'Dua angka 1–99, jawab dengan digit satuan hasil penjumlahan',
  EASY: 'Penjumlahan angka satuan saja (0–9 + 0–9)',
};

function renderSettingsUI() {
  // Mode buttons
  dom.modeOptions.querySelectorAll('.segment').forEach((btn) => {
    const active = btn.dataset.mode === settings.mode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-checked', active ? 'true' : 'false');
  });

  // Duration buttons
  dom.durationOptions.querySelectorAll('.segment').forEach((btn) => {
    const active = parseInt(btn.dataset.minutes, 10) === settings.durationMin;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-checked', active ? 'true' : 'false');
  });

  // Instruction texts
  dom.modeDesc.textContent = MODE_DESC[settings.mode];
  dom.instrRange.innerHTML = settings.mode === 'EASY'
    ? 'Soal berupa penjumlahan dua angka satuan <strong>0 – 9</strong>'
    : 'Soal berupa penjumlahan dua angka <strong>a + b</strong> (1–99)';
  dom.instrDuration.textContent = `${settings.durationMin} menit`;

  // Header timer preview while idle
  if (state.status !== 'RUNNING') {
    dom.timerDisplay.textContent = formatTime(settings.durationMin * 60000);
  }
}

// ─── Event Bindings ──────────────────────────────────
document.addEventListener('keydown', onKeyDown);

dom.btnStart.addEventListener('click', startSession);
// After a test, restart returns to the setup screen so duration/mode can be changed
dom.btnRestart.addEventListener('click', () => {
  state.status = 'IDLE';
  dom.timerCard.classList.remove('urgent', 'critical');
  showScreen('IDLE');
  renderSettingsUI();
});

dom.modeOptions.addEventListener('click', (e) => {
  const btn = e.target.closest('.segment');
  if (!btn) return;
  settings.mode = btn.dataset.mode;
  renderSettingsUI();
});

dom.durationOptions.addEventListener('click', (e) => {
  const btn = e.target.closest('.segment');
  if (!btn) return;
  const minutes = parseInt(btn.dataset.minutes, 10);
  if (!DURATION_OPTIONS.includes(minutes)) return;
  settings.durationMin = minutes;
  renderSettingsUI();
});

// Delegated click handler on the stream container for keypad buttons
dom.streamContainer.addEventListener('click', (e) => {
  const btn = e.target.closest('.key-item');
  if (!btn) return;
  if (state.status !== 'RUNNING') return;

  // Only allow clicks on the active block
  const block = btn.closest('.question-block');
  if (!block || !block.classList.contains('active-block')) return;

  const digit = parseInt(btn.dataset.digit, 10);
  submitAnswer(digit);
});

window.addEventListener('resize', () => {
  if (state.status === 'FINISHED') {
    drawPaceChart();
  }
});

// Expose finishSession on window for automated testing or manual trigger
window.__finishSession = finishSession;

// ─── Initialize ──────────────────────────────────────
renderSettingsUI();
showScreen('IDLE');
