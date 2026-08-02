function hasRequiredEnvs() {
  if (!process.env.UNSPLASH_ACCESS_KEY) return false;
  if (!process.env.DATABASE_URL) return false;
  return true;
}

module.exports = { hasRequiredEnvs };
