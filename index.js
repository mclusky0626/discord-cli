#!/usr/bin/env node
const path   = require('path');
const { spawn } = require('child_process');
const { Client } = require('discord.js-selfbot-v13');
const { loadToken, saveToken, loadConfig, saveConfig } = require('./config');
const { createUI, esc } = require('./ui');
const { themes, defaultTheme } = require('./themes');
const { getStrings, languages, defaultLang } = require('./i18n');

// ── 설정 로드 ─────────────────────────────────────────────────
const cfg          = loadConfig();
const currentThemeId = (() => { const id = cfg.theme;    return (id && themes[id])    ? id    : defaultTheme; })();
const currentLang    = (() => { const l  = cfg.language; return (l  && languages[l])  ? l     : defaultLang;  })();
const s              = getStrings(currentLang);
const client         = new Client();

const ui = createUI(
  { onListSelect, onInput, onQuit: quit },
  themes[currentThemeId],
  s,
);

// ── 상태 ──────────────────────────────────────────────────────
let activeChannel   = null;
let currentView     = 'root';   // 'root' | 'guild' | 'dms' | 'friends'
let currentGuild    = null;
let listData        = [];
let themeId         = currentThemeId;
let oldestMsgId     = null;     // 히스토리 더 로드용

const unread        = new Map(); // channelId → number

// ── 프레전스 상태 ─────────────────────────────────────────────
let presenceStatus      = 'online';   // 'online'|'idle'|'dnd'|'invisible'
let presenceCustomMsg   = '';         // 커스텀 상태 메시지

// 상태 표시 아이콘 (터미널에서 안전한 ASCII 대체)
const STATUS_ICON = { online: '{green-fg}●{/}', idle: '{yellow-fg}●{/}', dnd: '{red-fg}●{/}', invisible: '{grey-fg}●{/}' };

// ── 재시작 ────────────────────────────────────────────────────
function restart() {
  ui.setStatus(s.restartRequired);
  ui.render();
  setTimeout(() => {
    try { ui.screen.destroy(); } catch (_) {}
    spawn(process.execPath, process.argv.slice(1), {
      stdio: 'inherit', detached: false, env: process.env, cwd: process.cwd(),
    });
    process.exit(0);
  }, 600);
}

// ── 헤더 갱신 ────────────────────────────────────────────────
function refreshHeader() {
  const icon    = STATUS_ICON[presenceStatus] || STATUS_ICON.online;
  const channel = activeChannel ? `  {grey-fg}│{/}  ${esc(channelTitle(activeChannel))}` : '';
  const custom  = presenceCustomMsg ? `  {grey-fg}「${esc(presenceCustomMsg)}」{/}` : '';
  ui.setStatus(`${icon} ${custom}${channel}`);
}

// ── 메시지 포맷 ──────────────────────────────────────────────
function channelTitle(ch) {
  if (ch.type === 'DM')       return `@${ch.recipient ? ch.recipient.username : 'DM'}`;
  if (ch.type === 'GROUP_DM') return ch.name || 'Group DM';
  return `#${ch.name}`;
}

function formatMessage(m) {
  const ts     = new Date(m.createdTimestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  const author = (m.member && m.member.nickname) ? m.member.nickname : m.author.username;
  let line = `{grey-fg}${ts}{/} {bold}{cyan-fg}${esc(author)}{/}: ${esc(m.content)}`;
  for (const a of m.attachments.values())
    line += `\n  {magenta-fg}📎 ${esc(a.name)}{/} {grey-fg}${a.url}{/}`;
  return line;
}

// ── 읽지 않은 배지 ────────────────────────────────────────────
function getUnreadBadge(id) {
  const n = unread.get(id) || 0;
  return n > 0 ? ` {red-fg}(${n}){/}` : '';
}

function getGuildUnread(guild) {
  return [...guild.channels.cache.values()]
    .reduce((sum, ch) => sum + (unread.get(ch.id) || 0), 0);
}

// ── 사이드바 ─────────────────────────────────────────────────
function buildRoot() {
  currentView = 'root'; listData = [];
  const items = [];

  // 친구 목록
  const pendingCount = client.relationships?.incomingCache?.size ?? 0;
  const pendingBadge = pendingCount > 0 ? ` {yellow-fg}(${pendingCount}){/}` : '';
  items.push(`{cyan-fg}${s.friendsTitle}{/}${pendingBadge}`);
  listData.push({ type: 'friends' });

  // DM
  items.push(`{cyan-fg}${s.dmsTitle}{/}${getUnreadBadge('__dms__')}`);
  listData.push({ type: 'dms' });

  // 서버
  [...client.guilds.cache.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((g) => {
      const total = getGuildUnread(g);
      const badge = total > 0 ? ` {red-fg}(${total}){/}` : '';
      items.push(`🏠  ${esc(g.name)}${badge}`);
      listData.push({ type: 'guild', guild: g });
    });
  ui.renderList(items);
}

function buildGuild(guild) {
  currentView = 'guild'; currentGuild = guild; listData = [];
  const items = [`{grey-fg}${s.back}{/}`];
  listData.push({ type: 'back' });
  [...guild.channels.cache.values()]
    .filter((c) => c.type === 'GUILD_TEXT' && c.viewable)
    .sort((a, b) => a.rawPosition - b.rawPosition)
    .forEach((ch) => {
      items.push(`# ${esc(ch.name)}${getUnreadBadge(ch.id)}`);
      listData.push({ type: 'channel', channel: ch });
    });
  ui.renderList(items);
}

function buildDMs() {
  currentView = 'dms'; listData = [];
  const items = [`{grey-fg}${s.back}{/}`];
  listData.push({ type: 'back' });
  const dms = [...client.channels.cache.values()]
    .filter((c) => c.type === 'DM' || c.type === 'GROUP_DM');
  dms.forEach((ch) => {
    const label = ch.type === 'DM'
      ? `@ ${esc(ch.recipient ? ch.recipient.username : 'DM')}`
      : `👥 ${esc(ch.name || 'Group DM')}`;
    items.push(label + getUnreadBadge(ch.id));
    listData.push({ type: 'channel', channel: ch });
  });
  if (!dms.length) {
    items.push(`{grey-fg}${s.noDMs}{/}`);
    listData.push({ type: 'none' });
  }
  ui.renderList(items);
}

function buildFriends() {
  currentView = 'friends'; listData = [];
  const items = [`{grey-fg}${s.back}{/}`];
  listData.push({ type: 'back' });

  // 대기 중인 친구 요청
  const pending = [...(client.relationships?.incomingCache?.values() ?? [])].filter(Boolean);
  if (pending.length) {
    items.push(`{yellow-fg}── ${s.friendsPending} (${pending.length}) ──{/}`);
    listData.push({ type: 'none' });
    for (const user of pending) {
      items.push(`  {yellow-fg}? ${esc(user?.username ?? '???')}{/}`);
      listData.push({ type: 'none' });
    }
  }

  // 친구 목록 상태별 그루핑
  const friends = [...(client.relationships?.friendCache?.values() ?? [])].filter(Boolean);
  const grouped = { online: [], idle: [], dnd: [], offline: [] };
  for (const user of friends) {
    const st = client.presences.cache.get(user.id)?.status ?? 'offline';
    (grouped[st] || grouped.offline).push(user);
  }

  const groups = [
    { key: 'online',  icon: '{green-fg}●{/}',  label: s.friendsOnline },
    { key: 'idle',    icon: '{yellow-fg}●{/}', label: s.friendsIdle },
    { key: 'dnd',     icon: '{red-fg}●{/}',    label: s.friendsDnd },
    { key: 'offline', icon: '{grey-fg}●{/}',   label: s.friendsOffline },
  ];

  let total = 0;
  for (const { key, icon, label } of groups) {
    const users = grouped[key];
    if (!users.length) continue;
    items.push(`{grey-fg}── ${label} (${users.length}) ──{/}`);
    listData.push({ type: 'none' });
    for (const user of users) {
      const nick = client.relationships.friendNicknames.get(user.id);
      const name = nick || user.username;
      items.push(`  ${icon} ${esc(name)}`);
      listData.push({ type: 'friend', user });
      total++;
    }
  }

  if (!total && !pending.length) {
    items.push(`{grey-fg}${s.friendsNone}{/}`);
    listData.push({ type: 'none' });
  }

  ui.renderList(items);
}

function refreshCurrentList() {
  if      (currentView === 'root')    buildRoot();
  else if (currentView === 'friends') buildFriends();
  else if (currentView === 'guild' && currentGuild) buildGuild(currentGuild);
  else if (currentView === 'dms')   buildDMs();
}

// ── 채널 열기 ────────────────────────────────────────────────
async function openChannel(ch) {
  activeChannel = ch; oldestMsgId = null;
  unread.set(ch.id, 0);
  ui.clearMessages();
  refreshHeader();
  try {
    const fetched = await ch.messages.fetch({ limit: 50 });
    const arr = [...fetched.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    if (arr.length) oldestMsgId = arr[0].id;
    arr.forEach((m) => ui.appendMessage(formatMessage(m)));
    ui.render();
  } catch (e) {
    ui.appendMessage(`{red-fg}${s.historyFailed(esc(e.message))}{/}`);
    ui.render();
  }
  refreshCurrentList(); // 읽은 채널 뱃지 초기화
  ui.focusInput();
}

// ── 친구 DM 열기 ─────────────────────────────────────────────
async function openFriendDM(user) {
  try {
    const dm = await user.createDM();
    await openChannel(dm);
  } catch (e) {
    ui.appendMessage(`{red-fg}${s.friendsDmFailed(esc(e.message))}{/}`);
    ui.render();
  }
}

// ── 히스토리 더 로드 ─────────────────────────────────────────
async function loadMore() {
  if (!activeChannel) { ui.setStatus(s.selectChannel); return; }
  if (!oldestMsgId)   {
    ui.appendMessage(`{grey-fg}${s.historyEmpty}{/}`);
    ui.render();
    return;
  }
  ui.appendMessage(`{grey-fg}${s.historyLoading}{/}`);
  ui.render();
  try {
    const fetched = await activeChannel.messages.fetch({ limit: 50, before: oldestMsgId });
    const arr = [...fetched.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    if (!arr.length) {
      ui.appendMessage(`{grey-fg}${s.historyEmpty}{/}`);
      ui.render();
      return;
    }
    oldestMsgId = arr[0].id;
    // 로딩 메시지 제거 후 이전 메시지 앞에 삽입
    ui.prependMessages(arr.map(formatMessage));
    ui.appendMessage(`{grey-fg}${s.historyLoaded(arr.length)}{/}`);
    ui.render();
  } catch (e) {
    ui.appendMessage(`{red-fg}${s.historyFailed(esc(e.message))}{/}`);
    ui.render();
  }
}

// ── 리스트 선택 ──────────────────────────────────────────────
function onListSelect(index) {
  const item = listData[index];
  if (!item) return;
  if (item.type === 'friends')  return buildFriends();
  if (item.type === 'dms')      return buildDMs();
  if (item.type === 'guild')    return buildGuild(item.guild);
  if (item.type === 'back')     return buildRoot();
  if (item.type === 'channel')  return openChannel(item.channel);
  if (item.type === 'friend')   return openFriendDM(item.user);
}

// ── 입력 처리 ────────────────────────────────────────────────
async function onInput(value) {
  const text = value.trim();
  if (!text) return;
  if (text.startsWith('/')) return handleCommand(text);
  if (!activeChannel) { ui.setStatus(s.selectChannel); return; }
  try {
    await activeChannel.send(text);
  } catch (e) {
    ui.appendMessage(`{red-fg}${s.sendFailed(esc(e.message))}{/}`);
    ui.render();
  }
}

async function handleCommand(text) {
  const parts = text.trim().split(/\s+/);
  const cmd   = parts[0].toLowerCase();

  if (cmd === '/quit' || cmd === '/exit') return quit();
  if (cmd === '/help')     return showHelp();
  if (cmd === '/more')     return loadMore();
  if (cmd === '/settings') return showSettings();
  if (cmd === '/friends')  { buildFriends(); ui.focusList(); return; }
  if (cmd === '/lang')     return switchLang(parts[1]);
  if (cmd === '/token')    return changeToken();

  if (cmd === '/theme') {
    if (parts.length === 1) return showThemeList();
    return switchTheme(parts[1].toLowerCase());
  }

  if (cmd === '/status')      return changePresenceStatus(parts[1]);
  if (cmd === '/setstatus')   return setCustomStatus(parts.slice(1).join(' '));
  if (cmd === '/clearstatus') return clearCustomStatus();

  if (['/attach', '/file', '/img'].includes(cmd)) {
    const m = text.match(/^\/(attach|file|img)\s+(?:"([^"]+)"|(\S+))\s*(.*)$/i);
    if (m) return sendFile(m[2] || m[3], (m[4] || '').trim());
    ui.appendMessage(`{yellow-fg}${s.attachUsage}{/}`);
    ui.render();
    return;
  }

  ui.appendMessage(`{yellow-fg}${s.unknownCmd(esc(cmd))}{/}`);
  ui.render();
}

// ── 프레전스 / 프로필 ─────────────────────────────────────────
async function changePresenceStatus(status) {
  const valid = ['online', 'idle', 'dnd', 'invisible'];
  if (!status || !valid.includes(status)) {
    ui.appendMessage(`{yellow-fg}${s.statusUsage}{/}`);
    ui.render();
    return;
  }
  try {
    await client.user.setStatus(status);
    presenceStatus = status;
    refreshHeader();
    const label = (s.statusLabels && s.statusLabels[status]) || status;
    ui.appendMessage(`{green-fg}${s.statusChanged(label)}{/}`);
    ui.render();
  } catch (e) {
    ui.appendMessage(`{red-fg}${s.statusFailed(esc(e.message))}{/}`);
    ui.render();
  }
}

async function setCustomStatus(message) {
  const msg = message.trim();
  if (!msg) {
    ui.appendMessage(`{yellow-fg}${s.customStatusUsage}{/}`);
    ui.render();
    return;
  }
  try {
    await client.user.setPresence({
      status: presenceStatus,
      activities: [{ name: 'Custom Status', type: 'CUSTOM', state: msg }],
    });
    presenceCustomMsg = msg;
    refreshHeader();
    ui.appendMessage(`{green-fg}${s.customStatusSet(esc(msg))}{/}`);
    ui.render();
  } catch (e) {
    ui.appendMessage(`{red-fg}${s.statusFailed(esc(e.message))}{/}`);
    ui.render();
  }
}

async function clearCustomStatus() {
  try {
    await client.user.setPresence({
      status: presenceStatus,
      activities: [],
    });
    presenceCustomMsg = '';
    refreshHeader();
    ui.appendMessage(`{green-fg}${s.customStatusCleared}{/}`);
    ui.render();
  } catch (e) {
    ui.appendMessage(`{red-fg}${s.statusFailed(esc(e.message))}{/}`);
    ui.render();
  }
}

// ── 설정 (텍스트 방식) ───────────────────────────────────────
function showSettings() {
  const token    = loadToken() || '';
  const masked   = token.length > 12
    ? token.slice(0, 7) + '••••••••••••••••' + token.slice(-4)
    : '(없음)';
  const langNames = { ko: '한국어', en: 'English', ja: '日本語' };

  const statusLabel = (s.statusLabels && s.statusLabels[presenceStatus]) || presenceStatus;
  const customPart  = presenceCustomMsg ? `  {grey-fg}「${esc(presenceCustomMsg)}」{/}` : '  {grey-fg}(없음){/}';

  ui.appendMessage('{yellow-fg}{bold}⚙  Settings{/}');
  ui.appendMessage('{grey-fg}──────────────────────────────────────{/}');
  ui.appendMessage(`  {bold}Language{/bold}  ${esc(langNames[currentLang] || currentLang)}   {grey-fg}/lang ko|en|ja{/}`);
  ui.appendMessage(`  {bold}Token   {/bold}  ${esc(masked)}   {grey-fg}/token{/}`);
  ui.appendMessage('{grey-fg}──────────────────────────────────────{/}');
  ui.appendMessage(`  {bold}Status  {/bold}  ${STATUS_ICON[presenceStatus]} ${esc(statusLabel)}   {grey-fg}/status online|idle|dnd|invisible{/}`);
  ui.appendMessage(`  {bold}Msg     {/bold}${customPart}   {grey-fg}/setstatus <msg>  /clearstatus{/}`);
  ui.appendMessage('{grey-fg}──────────────────────────────────────{/}');
  ui.appendMessage(`  {bold}Theme{/bold}  {grey-fg}/theme <name>{/}`);

  for (const [id, theme] of Object.entries(themes)) {
    const cur = id === themeId ? '{green-fg}[현재]{/} ' : '       ';
    ui.appendMessage(`  ${cur}{cyan-fg}/theme ${id}{/}   ${esc(theme.label)}`);
  }

  ui.appendMessage('{grey-fg}──────────────────────────────────────{/}');
  ui.render();
}

function switchLang(code) {
  const valid = { ko: true, en: true, ja: true };
  if (!code || !valid[code]) {
    ui.appendMessage('{yellow-fg}사용법: /lang ko|en|ja{/}');
    ui.render();
    return;
  }
  saveConfig({ language: code });
  ui.appendMessage(`{green-fg}언어 변경됨 → ${code}  재시작 중...{/}`);
  ui.render();
  setTimeout(restart, 800);
}

function changeToken() {
  ui.promptToken().then((token) => {
    if (token) { saveToken(token); restart(); }
  });
}

// ── 테마 (명령어 방식) ────────────────────────────────────────
function showThemeList() {
  ui.appendMessage(`{yellow-fg}{bold}${s.themeListTitle}{/}`);
  for (const [id, theme] of Object.entries(themes)) {
    const mark = id === themeId ? '{green-fg}▶{/} ' : '  ';
    ui.appendMessage(`${mark}{cyan-fg}/theme ${id}{/}  ${esc(theme.label)}`);
  }
  ui.render();
}

function switchTheme(id) {
  if (!themes[id]) {
    ui.appendMessage(`{red-fg}${s.themeNotFound(esc(id))}{/}`);
    ui.render();
    return;
  }
  themeId = id;
  ui.applyTheme(themes[id]);
  saveConfig({ theme: id });
  ui.appendMessage(`{green-fg}${s.themeChanged(themes[id].label)}{/}`);
  ui.render();
}

// ── 파일 전송 ────────────────────────────────────────────────
async function sendFile(filePath, msg) {
  if (!activeChannel) { ui.setStatus(s.selectChannel); return; }
  const fs       = require('fs');
  const expanded = filePath.replace(/^~(?=$|\/)/, process.env.HOME || '~');
  if (!fs.existsSync(expanded)) {
    ui.appendMessage(`{red-fg}${s.fileNotFound(esc(expanded))}{/}`);
    ui.render();
    return;
  }
  try {
    await activeChannel.send({ content: msg || undefined, files: [expanded] });
    ui.appendMessage(`{green-fg}${s.attachSent(esc(path.basename(expanded)))}{/}`);
    ui.render();
  } catch (e) {
    ui.appendMessage(`{red-fg}${s.attachFailed(esc(e.message))}{/}`);
    ui.render();
  }
}

// ── 도움말 ───────────────────────────────────────────────────
function showHelp() {
  ui.appendMessage(`{yellow-fg}{bold}${s.helpTitle}{/}`);
  s.helpLines.forEach((l) => ui.appendMessage(l));
  ui.render();
}

// ── 종료 ─────────────────────────────────────────────────────
function quit() {
  try { client.destroy(); } catch (_) {}
  process.exit(0);
}

// ── 디스코드 이벤트 ──────────────────────────────────────────
client.on('messageCreate', (m) => {
  const fromSelf = m.author.id === client.user?.id;
  if (activeChannel && m.channel.id === activeChannel.id) {
    // 자신 메시지 포함 모두 표시 (gateway 에코가 유일한 표시 수단)
    ui.appendMessage(formatMessage(m));
    ui.render();
    return;
  }
  // 다른 채널: 자신 메시지 제외하고 읽지 않은 카운트 증가
  if (!fromSelf) {
    unread.set(m.channel.id, (unread.get(m.channel.id) || 0) + 1);
    refreshCurrentList();
  }
});

// 친구 상태 변경 시 친구 목록 실시간 갱신
client.on('presenceUpdate', (_old, _new) => {
  if (currentView === 'friends') buildFriends();
  // 루트에서도 친구 온라인 배지 표시를 위해 갱신
  if (currentView === 'root') buildRoot();
});

// 친구 관계 변경 (요청 수신 등) 시 갱신
client.on('relationshipAdd', () => { if (currentView === 'root' || currentView === 'friends') refreshCurrentList(); });
client.on('relationshipRemove', () => { if (currentView === 'root' || currentView === 'friends') refreshCurrentList(); });

client.on('ready', () => {
  presenceStatus = client.user.presence?.status ?? 'online';
  refreshHeader();
  buildRoot();
  ui.focusList();
});

// ── 시작 ─────────────────────────────────────────────────────
(async () => {
  let token = loadToken();
  if (!token) {
    token = await ui.promptToken();
    if (!token) return quit();
    saveToken(token);
  }
  ui.setStatus(s.connecting);
  try {
    await client.login(token);
  } catch (e) {
    ui.appendMessage(`{red-fg}${s.loginFailedMsg(esc(e.message))}{/}`);
    ui.setStatus(s.loginFailed);
    ui.render();
  }
})();
