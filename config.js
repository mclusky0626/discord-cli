const fs   = require('fs');
const path = require('path');

const TOKEN_FILE  = path.join(__dirname, '.token');
const CONFIG_FILE = path.join(__dirname, '.config.json');

// ── 토큰 ─────────────────────────────────────────────────────
function loadToken() {
  if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN.trim())
    return process.env.DISCORD_TOKEN.trim();
  if (fs.existsSync(TOKEN_FILE)) {
    const t = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    if (t) return t;
  }
  return null;
}

function saveToken(token) {
  fs.writeFileSync(TOKEN_FILE, token.trim(), { mode: 0o600 });
}

// ── 앱 설정 (테마 등) ─────────────────────────────────────────
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
    catch { /* 파싱 실패 시 기본값 */ }
  }
  return {};
}

function saveConfig(obj) {
  const current = loadConfig();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ ...current, ...obj }, null, 2));
}

module.exports = { loadToken, saveToken, loadConfig, saveConfig, TOKEN_FILE };
