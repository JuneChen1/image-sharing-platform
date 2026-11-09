const REQUIRED_ENVS = [
  'UNSPLASH_ACCESS_KEY',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_DAY'
];

function getMissingEnvs() {
  return REQUIRED_ENVS.filter((name) => !process.env[name]);
}

module.exports = { getMissingEnvs };
