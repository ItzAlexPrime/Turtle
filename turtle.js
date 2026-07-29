const turtleSounds = [
  "hiss", "hiss-a", "hiss-o", "hss", "hi-hiss", "hiss-u",
  "squeak", "squi", "sqk", "squeak-v", "squ-z", "squeek",
  "clack", "click", "clak-t", "cloc", "clack-p", "clack-k",
  "honk", "muff-m", "honk-l", "muff-n", "hum", "honk-r",
  "puff", "pf-sh", "puff-z", "pff", "puff-h", "pf-ch"
];

// Загрузка словаря из localStorage
let wordToTurtleMap = JSON.parse(localStorage.getItem('wordToTurtleMap')) || {};
let turtleToWordMap = JSON.parse(localStorage.getItem('turtleToWordMap')) || {};

let currentMode = 'toTurtle';

// DOM элементы
const btnToTurtle = document.getElementById('btnToTurtle');
const btnFromTurtle = document.getElementById('btnFromTurtle');
const inputLabel = document.getElementById('inputLabel');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const copyBtn = document.getElementById('copyBtn');

function saveDict() {
  localStorage.setItem('wordToTurtleMap', JSON.stringify(wordToTurtleMap));
  localStorage.setItem('turtleToWordMap', JSON.stringify(turtleToWordMap));
}

function setMode(mode) {
  currentMode = mode;
  btnToTurtle.classList.toggle('active', mode === 'toTurtle');
  btnFromTurtle.classList.toggle('active', mode === 'fromTurtle');

  inputLabel.innerText = mode === 'toTurtle'
    ? 'Введи текст на человеческом:'
    : 'Введи черепашью фразу:';

  inputText.value = '';
  outputText.innerText = '... (пусто)';
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

function generateTurtleCode(word) {
  if (!word) return "";
  let clean = word.toLowerCase();

  if (wordToTurtleMap[clean]) {
    return wordToTurtleMap[clean];
  }

  // Генерация 32-битного хэша
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }

  let idx1 = hash % 30;
  let idx2 = Math.floor(hash / 30) % 30;
  let idx3 = Math.floor(hash / 900) % 30;

  let code = `${turtleSounds[idx1]}-${turtleSounds[idx2]}-${turtleSounds[idx3]}`;

  if (turtleToWordMap[code]) {
    let idx4 = Math.floor(hash / 27000) % 30;
    code += `-${turtleSounds[idx4]}`;
  }

  wordToTurtleMap[clean] = code;
  turtleToWordMap[code] = clean;
  saveDict();

  return code;
}

function handleTranslate() {
  let input = inputText.value.trim();

  if (!input) {
    outputText.innerText = '... (тишина)';
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
        if (turtleToWordMap[cleanWord]) {
          result += turtleToWordMap[cleanWord] + punct + ' ';
        } else {
          result += '[неизвестный звук]' + punct + ' ';
        }
      }
    });

    outputText.innerText = result.trim();
  }
}

// Копирование в буфер обмена
copyBtn.addEventListener('click', () => {
  const text = outputText.innerText;
  if (text && text !== '... (тишина)' && text !== '... (пусто)') {
    navigator.clipboard.writeText(text);
    copyBtn.innerText = 'Скопировано!';
    setTimeout(() => copyBtn.innerText = 'Скопировать', 1500);
  }
});

// Слушатели событий
btnToTurtle.addEventListener('click', () => setMode('toTurtle'));
btnFromTurtle.addEventListener('click', () => setMode('fromTurtle'));
inputText.addEventListener('input', handleTranslate);