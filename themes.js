/**
 * 색상 테마 정의.
 * blessed는 기본 색상 이름 및 #RRGGBB(트루컬러 터미널) 지원.
 */
const themes = {
  dark: {
    label: '다크 (기본)',
    header:   { bg: 'blue',     fg: 'white' },
    footer:   { bg: 'black',    fg: 'grey' },
    sidebar:  { border: 'cyan',    selected: { bg: 'blue',    fg: 'white' } },
    messages: { border: 'cyan' },
    input:    { border: 'green' },
  },

  amoled: {
    label: 'AMOLED (순수 검정)',
    header:   { bg: '#1A1A2E',  fg: '#E0E0E0' },
    footer:   { bg: 'black',    fg: '#444444' },
    sidebar:  { border: '#7B2FBE', selected: { bg: '#7B2FBE', fg: 'black' } },
    messages: { border: '#7B2FBE' },
    input:    { border: '#00E5FF' },
  },

  nord: {
    label: 'Nord',
    header:   { bg: '#5E81AC',  fg: '#ECEFF4' },
    footer:   { bg: '#2E3440',  fg: '#4C566A' },
    sidebar:  { border: '#88C0D0', selected: { bg: '#5E81AC', fg: '#ECEFF4' } },
    messages: { border: '#88C0D0' },
    input:    { border: '#A3BE8C' },
  },

  dracula: {
    label: '드라큘라',
    header:   { bg: '#44475A',  fg: '#F8F8F2' },
    footer:   { bg: '#282A36',  fg: '#6272A4' },
    sidebar:  { border: '#BD93F9', selected: { bg: '#44475A', fg: '#F8F8F2' } },
    messages: { border: '#BD93F9' },
    input:    { border: '#50FA7B' },
  },

  light: {
    label: '라이트',
    header:   { bg: '#4285F4',  fg: 'white' },
    footer:   { bg: '#E8E8E8',  fg: '#555555' },
    sidebar:  { border: 'blue',    selected: { bg: 'blue',    fg: 'white' } },
    messages: { border: 'blue' },
    input:    { border: 'green' },
  },
};

const defaultTheme = 'dark';

module.exports = { themes, defaultTheme };
