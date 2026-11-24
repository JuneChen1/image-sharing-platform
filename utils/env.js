const REQUIRED_ENVS = [
  'UNSPLASH_ACCESS_KEY',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_DAY'
];

function getMissingEnvs() {
  return REQUIRED_ENVS.filter((name) => !process.env[name]);
}

// 讀選填的正整數環境變數；沒設或不是正整數就用預設值（設錯時不要讓上限變成 0 或 NaN）
function getPositiveIntEnv(name, defaultValue) {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value > 0 ? value : defaultValue;
}

module.exports = { getMissingEnvs, getPositiveIntEnv };
