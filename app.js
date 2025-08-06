/* ---------- CONFIG ---------- */
const WORDS = [
  "most","much","year","may","right","real","at","do","problem","another",
  "still","course","should","good","want","way","must","about","where",
  "feel","large","more","if","because","increase","time","group","early",
  "lead","look","will","what"
];
const TEST_SECONDS = 30;

/* ---------- STATE ---------- */
let testActive  = false;
let testStart   = 0;
let intervalId  = null;
let wordEls     = [];
let wordIndex   = 0;
let correctChars = 0;
let totalChars   = 0;

/* ---------- LIVE DATA FOR GRAPH ---------- */
const wpmHistory = []; // [[time, wpm], ...]

/* ---------- DOM ---------- */
const textBox   = document.getElementById('textBox');
const hidden    = document.getElementById('hiddenInput');
const wpmEl     = document.getElementById('wpm');
const accEl     = document.getElementById('acc');
const timeEl    = document.getElementById('time');
const themeBtn  = document.getElementById('themeBtn');

/* ---------- CANVAS ---------- */
const canvas    = document.createElement('canvas');
const ctx       = canvas.getContext('2d');
canvas.id       = 'wpmGraph';
canvas.style.cssText = 'margin-top:1rem; width:100%; max-width:600px; height:150px;';
document.querySelector('main').appendChild(canvas);

/* ---------- INIT ---------- */
generateTest();
hidden.focus();
loadTheme();

/* ---------- EVENTS ---------- */
textBox.addEventListener('click', () => hidden.focus());
hidden.addEventListener('input', handleInput);
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
    e.preventDefault();
    restartTest();
  }
});
themeBtn.addEventListener('click', toggleTheme);

/* ---------- FUNCTIONS ---------- */
function generateTest() {
  textBox.innerHTML = '';
  wordEls = [];
  for (let i = 0; i < 50; i++) {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const span = document.createElement('span');
    span.textContent = word;
    wordEls.push(span);
    textBox.appendChild(span);
    textBox.appendChild(document.createTextNode(' '));
  }
  resetState();
}

function resetState() {
  wordIndex = 0;
  correctChars = 0;
  totalChars   = 0;
  wpmHistory.length = 0;
  testActive = false;
  testStart  = 0;
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  hidden.value = '';
  updateDisplay(0, 0, 0);
  highlightWord();
  textBox.classList.remove('finished');
  canvas.style.display = 'none'; // Hide graph initially
}

function highlightWord() {
  wordEls.forEach((el, i) => el.classList.toggle('current', i === wordIndex));
}

function handleInput() {
  if (wordIndex >= wordEls.length) return;

  const value = hidden.value.trimStart();
  const currentWord = wordEls[wordIndex].textContent;
  if (!testActive) startTimer();

  // reset counters for this word
  let correctThis = 0;
  let totalThis   = 0;

  let html = '';
  for (let i = 0; i < Math.max(currentWord.length, value.length); i++) {
    const typed   = value[i];
    const correct = currentWord[i];
    totalThis++;
    if (typed === correct) {
      html += `<span class="correct">${correct}</span>`;
      correctThis++;
    } else {
      html += `<span class="wrong">${correct || ''}</span>`;
    }
  }
  wordEls[wordIndex].innerHTML = html;

  // update global
  correctChars += correctThis;
  totalChars   += totalThis;

  // advance on space
  if (value.endsWith(' ')) {
    wordIndex++;
    hidden.value = '';
    if (wordIndex >= wordEls.length) {
      finishTest();
      return;
    }
    highlightWord();
  }

  const elapsed = (Date.now() - testStart) / 1000 || 0;
  const wpm = Math.round((correctChars / 5) / (elapsed / 60));
  const acc = totalChars ? Math.round((correctChars / totalChars) * 100) : 100;
  updateDisplay(wpm, acc, elapsed);
}

function startTimer() {
  testActive = true;
  testStart  = Date.now();
  intervalId = setInterval(() => {
    const elapsed = (Date.now() - testStart) / 1000;
    if (elapsed >= TEST_SECONDS) {
      finishTest();
      return;
    }
    const wpm = Math.round((correctChars / 5) / (elapsed / 60));
    const acc = totalChars ? Math.round((correctChars / totalChars) * 100) : 100;
    wpmHistory.push([elapsed, wpm]);
    updateDisplay(wpm, acc, elapsed);
  }, 1000);
}

function finishTest() {
  clearInterval(intervalId);
  testActive = false;
  const elapsed = (Date.now() - testStart) / 1000 || 1;
  const wpm = Math.round((correctChars / 5) / (elapsed / 60));
  const acc = totalChars ? Math.round((correctChars / totalChars) * 100) : 100;
  updateDisplay(wpm, acc, elapsed);
  drawGraph(); // Draw graph only after test completion
  showResult(wpm, acc);
}

function updateDisplay(wpm, acc, time) {
  wpmEl.textContent = `${wpm} wpm`;
  accEl.textContent  = `${acc}%`;
  timeEl.textContent = `${Math.floor(time)} s`;
}

function drawGraph() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const maxWpm = Math.max(50, ...wpmHistory.map(p => p[1])) * 1.1;
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--fg');
  ctx.lineWidth   = 2;

  ctx.beginPath();
  wpmHistory.forEach(([t, w], i) => {
    const x = (t / TEST_SECONDS) * canvas.width;
    const y = canvas.height - (w / maxWpm) * canvas.height;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  canvas.style.display = 'block'; // Show graph after test completion
}

function showResult(wpm, acc) {
  const remarks = getRemarks(wpm, acc);
  textBox.innerHTML = `
    <div class="result">
      <h2>Test Complete</h2>
      <p>${wpm} wpm – ${acc}% accuracy</p>
      <p>${remarks}</p>
      <button onclick="restartTest()">Test Again</button>
    </div>
  `;
  textBox.classList.add('finished');
}

function getRemarks(wpm, acc) {
  if (wpm < 30) {
    return "Keep practicing! You'll get better.";
  } else if (wpm < 50) {
    return "Not bad, but there's room for improvement.";
  } else if (wpm < 70) {
    return "Great job! You're above average.";
  } else if (wpm < 90) {
    return "Impressive! You're a fast typer.";
  } else {
    return "Excellent! You're a typing master.";
  }
}

function hideResult() {
  // handled by generateTest()
}

function restartTest() {
  generateTest();
  hidden.focus();
}

/* ---------- THEME ---------- */
function toggleTheme() {
  const body = document.body;
  body.classList.toggle('light');
  localStorage.setItem('theme', body.classList.contains('light') ? 'light' : 'dark');
  themeBtn.textContent = body.classList.contains('light') ? '🌙' : '☀️';
  drawGraph(); // redraw in new theme color
}

function loadTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.body.classList.add('light');
    themeBtn.textContent = '🌙';
  }
}