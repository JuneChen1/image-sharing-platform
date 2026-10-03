// 檢查錯誤碼是否一致：config/errors.js ↔ 前端 i18n 字典 ↔ 程式碼裡實際使用的碼
// 用法：npm run check:errors（有問題時以 exit code 1 結束）
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const sourceDirs = ['controllers', 'middlewares', 'utils'];

// i18n.js 是瀏覽器端的 IIFE，沒有匯出，只能從原始碼把 STRINGS 物件字面量取出來
function loadStrings() {
  const source = fs.readFileSync(
    path.join(rootDir, 'public/js/i18n.js'),
    'utf8'
  );
  const start = source.indexOf('const STRINGS = {');
  const end = source.indexOf('\n  };', start);
  if (start === -1 || end === -1) throw new Error('找不到 i18n.js 的 STRINGS');

  return new Function(
    `return ${source.slice(start + 'const STRINGS = '.length, end + 4)}`
  )();
}

function listSourceFiles() {
  const files = ['app.js'];
  sourceDirs.forEach((dir) => {
    fs.readdirSync(path.join(rootDir, dir))
      .filter((name) => name.endsWith('.js'))
      .forEach((name) => files.push(path.join(dir, name)));
  });

  return files;
}

// 程式碼中 appError('X')、errorBody('X') 呼叫的碼，以及所有出現過的 'X' 字面量（找沒被引用的設定）
function scanSources() {
  const called = new Set();
  let allText = '';
  listSourceFiles().forEach((file) => {
    const text = fs.readFileSync(path.join(rootDir, file), 'utf8');
    allText += `\n${text}`;
    for (const match of text.matchAll(
      /(?:appError|errorBody)\(\s*'([A-Z][A-Z_]*)'/g
    )) {
      called.add(match[1]);
    }
  });

  return { called, allText };
}

function check({ errors, strings, called, allText }) {
  const problems = [];
  const warnings = [];
  const codes = Object.keys(errors);

  codes.forEach((code) => {
    const { status, message } = errors[code];
    if (!Number.isInteger(status)) problems.push(`${code}：status 必須是整數`);
    if (typeof message !== 'string' || message.trim() === '') {
      problems.push(`${code}：缺少 message`);
    }

    Object.keys(strings).forEach((lang) => {
      if (!strings[lang][`error.${code}`]) {
        problems.push(`${code}：前端 i18n.js 的 ${lang} 缺少 error.${code}`);
      }
    });

    if (
      !called.has(code) &&
      !allText.replace(/config\/errors/g, '').includes(`'${code}'`)
    ) {
      warnings.push(`${code}：設定了但程式碼沒有用到`);
    }
  });

  Object.keys(strings).forEach((lang) => {
    Object.keys(strings[lang])
      .filter((key) => key.startsWith('error.'))
      .forEach((key) => {
        if (!errors[key.slice('error.'.length)]) {
          problems.push(
            `i18n.js 的 ${lang} 有 ${key}，但 config/errors.js 沒有這個碼`
          );
        }
      });
  });

  called.forEach((code) => {
    if (!errors[code])
      problems.push(`程式碼使用了 '${code}'，但 config/errors.js 沒有定義`);
  });

  return { problems, warnings, total: codes.length };
}

module.exports = { check };

if (require.main === module) {
  const errors = require('../config/errors');
  const { called, allText } = scanSources();
  const { problems, warnings, total } = check({
    errors,
    strings: loadStrings(),
    called,
    allText
  });

  warnings.forEach((warning) => console.warn(`警告：${warning}`));
  if (problems.length > 0) {
    problems.forEach((problem) => console.error(`錯誤：${problem}`));
    console.error(`\n檢查失敗：${problems.length} 個問題`);
    process.exit(1);
  }

  console.log(`檢查通過：${total} 個錯誤碼，設定檔、前端中英字典與程式碼一致`);
}
