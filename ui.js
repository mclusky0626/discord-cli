const blessed = require('blessed');

function esc(s) {
  return String(s == null ? '' : s).replace(/[{}]/g, '');
}

function createUI(handlers, initialTheme, strings) {
  const t = initialTheme;
  const s = strings;

  let messageLines = [];

  const screen = blessed.screen({
    smartCSR: true,
    title: s.appTitle,
    fullUnicode: true,
    autoPadding: true,
  });

  // ── 위젯 ────────────────────────────────────────────────────
  const header = blessed.box({
    top: 0, left: 0, right: 0, height: 1,
    tags: true,
    style: { bg: t.header.bg, fg: t.header.fg },
    content: ` {bold}${s.appTitle}{/bold} `,
  });

  const footer = blessed.box({
    bottom: 0, left: 0, right: 0, height: 1,
    tags: true,
    style: { bg: t.footer.bg, fg: t.footer.fg },
    content: s.footerText,
  });

  const sidebar = blessed.list({
    top: 1, left: 0, width: '28%', bottom: 1,
    label: s.sidebarTitle,
    border: 'line',
    keys: true, vi: true, mouse: true, tags: true,
    style: {
      selected: { bg: t.sidebar.selected.bg, fg: t.sidebar.selected.fg, bold: true },
      border: { fg: t.sidebar.border },
      label: { fg: t.sidebar.border },
    },
  });

  const messages = blessed.box({
    top: 1, left: '28%', right: 0, bottom: 4,
    label: s.messagesTitle,
    border: 'line',
    tags: true,
    scrollable: true,
    alwaysScroll: false,
    keys: true,
    mouse: true,
    scrollbar: { ch: ' ', style: { bg: 'grey' } },
    style: {
      border: { fg: t.messages.border },
      label: { fg: t.messages.border },
    },
  });

  const inputBox = blessed.textbox({
    left: '28%', right: 0, bottom: 1, height: 3,
    label: s.inputTitle,
    border: 'line',
    inputOnFocus: true,
    style: {
      border: { fg: t.input.border },
      label: { fg: t.input.border },
    },
  });

  screen.append(header);
  screen.append(footer);
  screen.append(sidebar);
  screen.append(messages);
  screen.append(inputBox);

  // ── 이벤트 ──────────────────────────────────────────────────
  sidebar.on('select', (_item, index) => handlers.onListSelect(index));

  inputBox.on('submit', (value) => {
    inputBox.clearValue();
    screen.render();
    handlers.onInput(value || '');
    inputBox.focus();
    screen.render();
  });

  inputBox.key(['escape'], () => { sidebar.focus(); screen.render(); });
  sidebar.key(['escape'], () => handlers.onQuit());
  screen.key(['C-c'], () => handlers.onQuit());
  screen.key(['tab'], () => {
    if (screen.focused === inputBox) sidebar.focus(); else inputBox.focus();
    screen.render();
  });

  sidebar.focus();
  screen.render();

  // ── 공개 API ────────────────────────────────────────────────
  const ui = {
    screen,
    render: () => screen.render(),

    setStatus(text) {
      header.setContent(` {bold}${s.appTitle}{/bold}   {grey-fg}│{/}   ${esc(text)}`);
      screen.render();
    },

    renderList(items) {
      sidebar.setItems(items);
      screen.render();
    },

    clearMessages() {
      messageLines = [];
      messages.setContent('');
      screen.render();
    },

    appendMessage(line) {
      messageLines.push(line);
      messages.pushLine(line);
      messages.setScrollPerc(100);
      screen.render();
    },

    prependMessages(lines) {
      if (!lines.length) return;
      messageLines = [...lines, ...messageLines];
      messages.setContent('');
      for (const l of messageLines) messages.pushLine(l);
      messages.scrollTo(lines.length);
      screen.render();
    },

    focusInput() { inputBox.focus(); screen.render(); },
    focusList()  { sidebar.focus(); screen.render(); },

    applyTheme(newT) {
      sidebar.style.border.fg       = newT.sidebar.border;
      sidebar.style.label.fg        = newT.sidebar.border;
      sidebar.style.selected.bg     = newT.sidebar.selected.bg;
      sidebar.style.selected.fg     = newT.sidebar.selected.fg;
      messages.style.border.fg      = newT.messages.border;
      messages.style.label.fg       = newT.messages.border;
      inputBox.style.border.fg      = newT.input.border;
      inputBox.style.label.fg       = newT.input.border;
      header.style.bg               = newT.header.bg;
      header.style.fg               = newT.header.fg;
      footer.style.bg               = newT.footer.bg;
      footer.style.fg               = newT.footer.fg;
      screen.render();
    },

    // ── 첫 실행 토큰 입력 화면 ────────────────────────────────
    promptToken() {
      return new Promise((resolve) => {
        const overlay = blessed.box({
          top: 0, left: 0, right: 0, bottom: 0,
          style: { bg: 'black' },
        });

        const box = blessed.box({
          parent: overlay,
          top: 'center', left: 'center',
          width: 62, height: 22,
          border: 'line', tags: true,
          style: { border: { fg: 'cyan' }, bg: 'black' },
        });

        blessed.text({
          parent: box, top: 1, left: 2, right: 2,
          tags: true, style: { bg: 'black', fg: 'white' },
          content:
            `{center}{bold}{cyan-fg}${s.tokenPromptTitle}{/}{/center}\n` +
            `{center}{grey-fg}${s.tokenPromptSubtitle}{/}{/center}`,
        });

        blessed.line({
          parent: box, top: 4, left: 1, right: 1,
          orientation: 'horizontal', style: { fg: 'grey' },
        });

        blessed.text({
          parent: box, top: 5, left: 2, right: 2,
          tags: true, style: { bg: 'black', fg: 'white' },
          content: s.tokenPromptNeed + '\n\n' + s.tokenPromptHow,
        });

        blessed.line({
          parent: box, top: 15, left: 1, right: 1,
          orientation: 'horizontal', style: { fg: 'grey' },
        });

        blessed.text({
          parent: box, top: 16, left: 2,
          tags: true, style: { bg: 'black', fg: 'grey' },
          content: s.tokenPromptLabel,
        });

        const tbox = blessed.textbox({
          parent: box,
          top: 17, left: 2, right: 2, height: 3,
          border: 'line', inputOnFocus: true, censor: true,
          style: { bg: 'black', fg: 'white', border: { fg: 'green' } },
        });

        screen.append(overlay);
        tbox.focus();
        screen.render();

        tbox.on('submit', (val) => {
          overlay.destroy();
          screen.render();
          resolve((val || '').trim());
        });
      });
    },
  };

  return ui;
}

module.exports = { createUI, esc };
