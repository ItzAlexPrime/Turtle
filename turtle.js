const turtleSounds = [
  "hiss", "hiss-a", "hiss-o", "hss", "hi-hiss", "hiss-u",
  "squeak", "squi", "sqk", "squeak-v", "squ-z", "squeek",
  "clack", "click", "clak-t", "cloc", "clack-p", "clack-k",
  "honk", "muff-m", "honk-l", "muff-n", "hum", "honk-r",
  "puff", "pf-sh", "puff-z", "pff", "puff-h", "pf-ch"
];

// Переводы интерфейса
const I18N = {
  ru: {
    btnToTurtle: "Человек ➔ Черепаха",
    btnFromTurtle: "Черепаха ➔ Человек",
    inputToTurtle: "Введи текст на человеческом:",
    inputFromTurtle: "Введи черепашью фразу:",
    placeholderToTurtle: "Привет...",
    placeholderFromTurtle: "hiss-clack-honk / squeak-puff-hum...",
    outputLabel: "Результат:",
    copyBtn: "Скопировать",
    copiedBtn: "Скопировано!",
    empty: "... (пусто)",
    silence: "... (тишина)",
    unknownSound: "[неизвестный звук]",
    footer: "Словарь сохраняется в память устройства"
  },
  en: {
    btnToTurtle: "Human ➔ Turtle",
    btnFromTurtle: "Turtle ➔ Human",
    inputToTurtle: "Enter text in human language:",
    inputFromTurtle: "Enter turtle phrase:",
    placeholderToTurtle: "Hello...",
    placeholderFromTurtle: "hiss-clack-honk / squeak-puff-hum...",
    outputLabel: "Result:",
    copyBtn: "Copy",
    copiedBtn: "Copied!",
    empty: "... (empty)",
    silence: "... (silence)",
    unknownSound: "[unknown sound]",
    footer: "Dictionary saved to local device storage"
  }
};

// Загрузка словаря и языка
let wordToTurtleMap = JSON.parse(localStorage.getItem('wordToTurtleMap')) || {};
let turtleToWordMap = JSON.parse(localStorage.getItem('turtleToWordMap')) || {};
let currentMode = 'toTurtle';
let currentLang = localStorage.getItem('uiLang') || 'en'; // По умолчанию EN

// DOM Элементы
const btnToTurtle = document.getElementById('btnToTurtle');
const btnFromTurtle = document.getElementById('btnFromTurtle');
const inputLabel = document.getElementById('inputLabel');
const inputText = document.getElementById('inputText');
const outputLabel = document.getElementById('outputLabel');
const outputText = document.getElementById('outputText');
const copyBtn = document.getElementById('copyBtn');
const footerText = document.getElementById('footerText');
const langRu = document.getElementById('langRu');
const langEn = document.getElementById('langEn');

function saveDict() {
  localStorage.setItem('wordToTurtleMap', JSON.stringify(wordToTurtleMap));
  localStorage.setItem('turtleToWordMap', JSON.stringify(turtleToWordMap));
}

// Потоковое изменение текстов UI
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('uiLang', lang);

  if (langRu) langRu.classList.toggle('active', lang === 'ru');
  if (langEn) langEn.classList.toggle('active', lang === 'en');

  const t = I18N[lang];
  if (btnToTurtle) btnToTurtle.innerText = t.btnToTurtle;
  if (btnFromTurtle) btnFromTurtle.innerText = t.btnFromTurtle;
  if (outputLabel) outputLabel.innerText = t.outputLabel;
  if (copyBtn) copyBtn.innerText = t.copyBtn;
  if (footerText) footerText.innerText = t.footer;

  updateInputTexts();
  handleTranslate();
}

function updateInputTexts() {
  const t = I18N[currentLang];
  if (currentMode === 'toTurtle') {
    if (inputLabel) inputLabel.innerText = t.inputToTurtle;
    if (inputText) inputText.placeholder = t.placeholderToTurtle;
  } else {
    if (inputLabel) inputLabel.innerText = t.inputFromTurtle;
    if (inputText) inputText.placeholder = t.placeholderFromTurtle;
  }
}

function setMode(mode) {
  currentMode = mode;
  if (btnToTurtle) btnToTurtle.classList.toggle('active', mode === 'toTurtle');
  if (btnFromTurtle) btnFromTurtle.classList.toggle('active', mode === 'fromTurtle');

  updateInputTexts();
  if (inputText) inputText.value = '';
  if (outputText) outputText.innerText = I18N[currentLang].empty;
}

function splitWordAndPunctuation(token) {
  let cleanWord = '';
  let punct = '';
  for (let char of token) {
    if (/[^\w\u0400-\u04FF-]/.test(char) && char !== '-') {
      punct += char;
    } else {
      cleanWord += char;
    }
  }
  return { cleanWord, punct };
}

// 32-bit FNV-1a Hash (Sync with C++)
function fnv1a32(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

function generateTurtleCode(word) {
  if (!word) return "";
  let clean = word.toLowerCase();

  if (wordToTurtleMap[clean]) {
    return wordToTurtleMap[clean];
  }

  let hash = fnv1a32(clean);

  let idx1 = hash % 30;
  let idx2 = Math.floor(hash / 30) % 30;
  let idx3 = Math.floor(hash / 900) % 30;

  let code = `${turtleSounds[idx1]}-${turtleSounds[idx2]}-${turtleSounds[idx3]}`;

  if (turtleToWordMap[code] && turtleToWordMap[code] !== clean) {
    let idx4 = Math.floor(hash / 27000) % 30;
    code += `-${turtleSounds[idx4]}`;
  }

  wordToTurtleMap[clean] = code;
  turtleToWordMap[code] = clean;
  saveDict();

  return code;
}

function handleTranslate() {
  if (!inputText || !outputText) return;
  let input = inputText.value.trim();
  const t = I18N[currentLang];

  if (!input) {
    outputText.innerText = t.silence;
    return;
  }

  if (currentMode === 'toTurtle') {
    let tokens = input.split(/\s+/);
    let result = tokens.map(token => {
      let { cleanWord, punct } = splitWordAndPunctuation(token);
      let code = generateTurtleCode(cleanWord);
      return code ? code + punct : punct;
    }).join('  /  ');

    outputText.innerText = result;
  } else {
    let tokens = input.split(/\s+/);
    let result = '';

    tokens.forEach(token => {
      if (token === '/') {
        result += ' ';
      } else {
        let { cleanWord, punct } = splitWordAndPunctuation(token);
        let lowerClean = cleanWord.toLowerCase();
        if (turtleToWordMap[lowerClean]) {
          result += turtleToWordMap[lowerClean] + punct + ' ';
        } else {
          result += t.unknownSound + punct + ' ';
        }
      }
    });

    outputText.innerText = result.trim();
  }
}

// Навешиваем клики
if (copyBtn) {
  copyBtn.addEventListener('click', () => {
    const text = outputText ? outputText.innerText : '';
    const t = I18N[currentLang];
    if (text && text !== t.silence && text !== t.empty) {
      navigator.clipboard.writeText(text);
      copyBtn.innerText = t.copiedBtn;
      setTimeout(() => copyBtn.innerText = t.copyBtn, 1500);
    }
  });
}

if (btnToTurtle) btnToTurtle.addEventListener('click', () => setMode('toTurtle'));
if (btnFromTurtle) btnFromTurtle.addEventListener('click', () => setMode('fromTurtle'));
if (inputText) inputText.addEventListener('input', handleTranslate);

if (langRu) langRu.addEventListener('click', () => setLanguage('ru'));
if (langEn) langEn.addEventListener('click', () => setLanguage('en'));

// Инициализация при запуске
setLanguage(currentLang);
