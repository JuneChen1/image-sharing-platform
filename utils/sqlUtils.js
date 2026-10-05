// 跳脫 LIKE / ILIKE 的萬用字元，讓使用者輸入的 % _ \ 被當成一般字元
function escapeLike(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

module.exports = { escapeLike };
