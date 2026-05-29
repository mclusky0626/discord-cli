# discord but in terminal
---


# Discord TUI

**터미널 기반 디스코드 클라이언트 | Terminal-based Discord Client**
---

## 📖 한국어 (Korean)

### 소개

Discord TUI는 터미널에서 실행 가능한 경량의 디스코드 클라이언트입니다. 사용자 토큰을 이용하여 로그인하고, 풀스크린 TUI 인터페이스에서 메시지 송수신, 파일 첨부, 테마 변경 등 모든 기능을 사용할 수 있습니다.

### 설치

npm을 통해 전역으로 설치합니다:

```bash
npm install -g discord-but-in-terminal
```

### 시작하기

터미널에서 다음 명령어를 입력하면 됩니다:

```bash
discord-tui
```

처음 실행할 때는 **디스코드 사용자 토큰**을 입력해야 합니다. 토큰을 얻는 방법:

1. https://discord.com 에서 웹 디스코드 접속
2. F12 를 눌러 개발자 도구 열기
3. Network 탭으로 이동
4. 페이지 새로고침 후 아무 요청이나 클릭
5. Headers 탭에서 `authorization` 헤더 값 복사하여 입력
또는 아래 방법이 더 쉽습니다.
아래 명령어를 디스코드 콘슬에 복사 붙여넣기(컨트롤+쉬프트+i)
```js
window.webpackChunkdiscord_app.push([
	[Symbol()],
	{},
	req => {
		if (!req.c) return;
		for (let m of Object.values(req.c)) {
			try {
				if (!m.exports || m.exports === window) continue;
				if (m.exports?.getToken) return copy(m.exports.getToken());
				for (let ex in m.exports) {
					if (m.exports?.[ex]?.getToken && m.exports[ex][Symbol.toStringTag] !== 'IntlMessagesProxy') return copy(m.exports[ex].getToken());
				}
			} catch {}
		}
	},
]);

window.webpackChunkdiscord_app.pop();
console.log('%cWorked!', 'font-size: 50px');
console.log(`%cYou now have your token in the clipboard!`, 'font-size: 16px');
```

### 주요 기능

- ✅ 메시지 송수신 (텍스트)
- ✅ 파일/사진 첨부 (`/attach` 명령어)
- ✅ 메시지 히스토리 로드 (`/more` 명령어로 이전 50개 메시지 로드)
- ✅ 읽지 않은 메시지 배지 표시
- ✅ 다양한 색상 테마 (Dark, AMOLED, Nord, Dracula, Light)
- ✅ 언어 지원 (한국어, English, 日本語)
- ✅ 라이브 테마 전환
- ✅ 설정 관리 (언어, 테마, 토큰 변경)

### 명령어

| 명령어 | 설명 |
|--------|------|
| `/help` | 도움말 표시 |
| `/settings` | 설정 화면 (언어, 테마, 토큰) |
| `/theme <이름>` | 테마 변경 (dark, amoled, nord, dracula, light) |
| `/lang ko\|en\|ja` | 언어 변경 (한국어, 영어, 일본어) |
| `/token` | 토큰 변경 |
| `/attach <파일경로> [메시지]` | 파일 첨부하여 전송 |
| `/more` | 이전 메시지 50개 로드 |
| `/quit` 또는 `/exit` | 종료 |

### 조작법

| 키 | 기능 |
|----|------|
| `Tab` | 패널 이동 (목록 ↔ 입력창) |
| `Enter` | 메시지 선택 또는 전송 |
| `↑↓` | 목록 내비게이션 |
| `Escape` (입력창) | 목록으로 돌아가기 |
| `Ctrl+C` | 종료 |

### 설정

첫 실행 시 생성되는 `.config.json` 파일에서 다음을 설정할 수 있습니다:

- **언어** (ko, en, ja)
- **테마** (dark, amoled, nord, dracula, light)

또는 `/lang`, `/theme` 명령어로 실시간 변경 가능합니다 (자동 재시작).

### 주의사항

- ⚠️ 이 클라이언트는 **셀프봇(Self-bot)** 입니다. Discord 이용약관에 따라 셀프봇 사용은 계정 제한의 위험이 있습니다.
- 🔒 토큰은 절대 다른 사람과 공유하지 마세요.
- 💾 토큰은 `.token` 파일에 로컬로 저장되며, 절대 npm에 배포되지 않습니다.

### 문제해결

**Q: 메시지가 전송되지 않는다**
- A: 먼저 채널을 선택했는지 확인하세요. 채널을 선택한 후 메시지를 입력하세요.

**Q: 한글이 깨져 보인다**
- A: 터미널의 문자 인코딩이 UTF-8로 설정되어 있는지 확인하세요.

**Q: 로그인이 안 된다**
- A: 토큰이 올바르게 입력되었는지 확인하세요. `/token` 명령어로 다시 입력할 수 있습니다.

---

## 📖 English

### Introduction

Discord TUI is a lightweight Discord client that runs in the terminal. It uses your user token to log in and provides a full-screen TUI interface where you can send and receive messages, attach files, change themes, and more.

### Installation

Install globally via npm:

```bash
npm install -g discord-but-in-terminal
```

### Getting Started

Simply run this command in your terminal:

```bash
discord-tui
```

On first launch, you'll need to enter your **Discord user token**. Here's how to get it:

1. Open https://discord.com in your web browser
2. Press F12 to open Developer Tools
3. Go to the Network tab
4. Refresh the page and click any request
5. Go to the Headers tab and copy the `authorization` header value, then paste it
or use this method. paste this code in discord console(control+shift+i)
```js
window.webpackChunkdiscord_app.push([
	[Symbol()],
	{},
	req => {
		if (!req.c) return;
		for (let m of Object.values(req.c)) {
			try {
				if (!m.exports || m.exports === window) continue;
				if (m.exports?.getToken) return copy(m.exports.getToken());
				for (let ex in m.exports) {
					if (m.exports?.[ex]?.getToken && m.exports[ex][Symbol.toStringTag] !== 'IntlMessagesProxy') return copy(m.exports[ex].getToken());
				}
			} catch {}
		}
	},
]);

window.webpackChunkdiscord_app.pop();
console.log('%cWorked!', 'font-size: 50px');
console.log(`%cYou now have your token in the clipboard!`, 'font-size: 16px');
```

### Key Features

- ✅ Send and receive messages (text)
- ✅ Attach files/images (`/attach` command)
- ✅ Load message history (`/more` command to load 50 previous messages)
- ✅ Unread message badges
- ✅ Multiple color themes (Dark, AMOLED, Nord, Dracula, Light)
- ✅ Language support (Korean, English, Japanese)
- ✅ Live theme switching
- ✅ Settings management (language, theme, token)

### Commands

| Command | Description |
|---------|-------------|
| `/help` | Show help |
| `/settings` | Open settings (language, theme, token) |
| `/theme <name>` | Switch theme (dark, amoled, nord, dracula, light) |
| `/lang ko\|en\|ja` | Change language (Korean, English, Japanese) |
| `/token` | Change token |
| `/attach <filepath> [message]` | Attach and send file |
| `/more` | Load 50 previous messages |
| `/quit` or `/exit` | Exit |

### Controls

| Key | Function |
|-----|----------|
| `Tab` | Switch panels (list ↔ input) |
| `Enter` | Select item or send message |
| `↑↓` | Navigate list |
| `Escape` (input box) | Back to list |
| `Ctrl+C` | Quit |

### Configuration

The `.config.json` file created on first launch lets you configure:

- **Language** (ko, en, ja)
- **Theme** (dark, amoled, nord, dracula, light)

You can also change these in real-time using `/lang` and `/theme` commands (app auto-restarts).

### Important Notes

- ⚠️ This is a **Self-bot** client. Using a self-bot violates Discord's Terms of Service and may result in account restrictions.
- 🔒 Never share your token with anyone.
- 💾 Your token is stored locally in a `.token` file and is never published to npm.

### Troubleshooting

**Q: Messages won't send**
- A: Make sure you've selected a channel first. Select a channel, then type and send.

**Q: Korean text looks corrupted**
- A: Ensure your terminal's character encoding is set to UTF-8.

**Q: Login fails**
- A: Verify your token is correct. You can re-enter it with the `/token` command.

---


## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
feel free to contact discord: fasdads_

---

**작자 | Created by:** mclusky0626
**버전 | Version:** 1.0.1
**NPM:** https://www.npmjs.com/package/discord-but-in-terminal
