/* ---------- CONFIG ---------- */
const WORDS = [
  "most","much","year","may","right","real","at","do","problem","another",
  "still","course","should","good","want","way","must","about","where",
  "feel","large","more","if","because","increase","time","group","early",
  "lead","look","will","what"
];
const TEST_SECONDS = 30;

/* ---------- STATE ---------- */
let testActive = false;
let testStart  = 0;
let intervalId = null;

let wordEls   = [];          // DOM <span> for each word
let wordIndex = 0;           // which word we’re on
let charIndex = 0;           // which char inside that word
let typedHistory = [];       // every character typed
let errorSet = new Set();    // positions of errors for accuracy

/* ---------- DOM ---------- */
const textBox  = document.getElementById('textBox');
const hidden   = document.getElementById('hiddenInput');
const wpmEl    = document.getElementById('wpm');
const accEl    = document.getElementById('acc');
const timeEl   = document.getElementById('time');
const themeBtn = document.getElementById('themeBtn');
const restartBtn = document.getElementById('commandBtn');

/* ---------- INIT ---------- */
generateTest();
hidden.focus();

/* ---------- EVENTS ---------- */
textBox.addEventListener('click', () => hidden.focus());

hidden.addEventListener('input', e => {
  const value = hidden.value;
  handleTyping(value);
});

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key === 'P') {
    e.preventDefault();
    restartTest();
  }
});

restartBtn.addEventListener('click', restartTest);
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
  charIndex = 0;
  typedHistory.length = 0;
  errorSet.clear();
  testActive = false;
  testStart  = 0;
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  hidden.value = '';
  updateStats(0);
  highlight();
}

function highlight() {
  wordEls.forEach((el, i) => {
    el.classList.remove('current', 'correct', 'wrong');
    if (i === wordIndex) el.classList.add('current');
  });
}

function handleTyping(value) {
  const currentWord = wordEls[wordIndex].textContent;
  typedHistory = value.split('');
  if (!testActive) startTest();

  // color characters
  let html = '';
  for (let i = 0; i < Math.max(currentWord.length, value.length); i++) {
    const typed   = value[i];
    const correct = currentWord[i];
    if (!typed) {
      html += `<span>${correct}</span>`;
    } else if (typed === correct) {
      html += `<span class="correct">${correct}</span>`;
    } else {
      html += `<span class="wrong">${correct}</span>`;
      errorSet.add(wordIndex * 1000 + i);
    }
  }
  wordEls[wordIndex].innerHTML = html;

  // advance on space
  if (value.endsWith(' ')) {
    wordIndex++;
    charIndex = 0;
    hidden.value = '';
    if (wordIndex >= wordEls.length) return finishTest();
    highlight();
    return;
  }

  updateStats((Date.now() - testStart) / 1000);
}

function startTest() {
  testActive = true;
  testStart  = Date.now();
  intervalId = setInterval(() => {
    const elapsed = (Date.now() - testStart) / 1000;
    if (elapsed >= TEST_SECONDS) {
      finishTest();
      return;
    }
    updateStats(elapsed);
  }, 100);
}

function updateStats(elapsed) {
  const typed = typedHistory.filter(c => c !== ' ');
  const wpm = Math.round((typed.length / 5) / (elapsed / 60));
  const acc = Math.max(0, 100 - Math.round(errorSet.size / Math.max(typed.length,1) * 100));
  wpmEl.textContent = `${wpm} wpm`;
  accEl.textContent = `${acc} %`;
  timeEl.textContent = `${Math.floor(elapsed)} s`;
}

function finishTest() {
  testActive = false;
  clearInterval(intervalId);
  hidden.blur();
}

function restartTest() {
  generateTest();
  hidden.focus();
}

function toggleTheme() {
  const root = document.documentElement.style;
  const isDark = getComputedStyle(document.documentElement)
                   .getPropertyValue('--bg') === 'rgb(17, 17, 17)';
  if (isDark) {
    root.setProperty('--bg', '#fafafa');
    root.setProperty('--fg', '#111');
    root.setProperty('--sub', '#999');
    themeBtn.textContent = '☀️';
  } else {
    root.setProperty('--bg', '#111');
    root.setProperty('--fg', '#eee');
    root.setProperty('--sub', '#555');
    themeBtn.textContent = '🌙';
  }
}