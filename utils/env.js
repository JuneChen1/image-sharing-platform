// UNSPLASH_ACCESS_KEY 是選填：沒設定時 Unsplash 功能停用（見 unsplashApiUtils.js），其他功能照常
const REQUIRED_ENVS = [
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
