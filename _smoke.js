/*
 * _smoke.js — Web版そよぎ（nameless_pulse_web）の疑似DOMスモークテスト（Node）
 *
 * node --check は参照切れ（存在しないid参照など）を検出できないため、
 * index.html に実在する id だけを返す疑似DOMで app.js を実際に起動し、
 * 起動全死・未定義id参照・i18n適用漏れを機械的に検出する（soyogi_aac\_smoke.js と同方式）。
 *
 * 検証内容：
 *   [1] app.js が疑似DOM上で例外なく起動（DOMContentLoaded → init()）
 *   [2] 言語チップが全14言語ぶん描画される
 *   [3] 14言語すべてで言語切替 → applyI18n() が通り、主要ラベル（アプリ名/おやすみ/
 *       初回ヒント/設定タイトル/もどる/タイマーチップ）が I18N の該当訳と一致
 *   [4] ar 選択時に documentElement.dir === 'rtl'、他言語は 'ltr'
 *   [5] 設定パネルの開閉（btn-settings → btn-back）が例外なく通る
 *
 * 使い方： node _smoke.js
 * 失敗時は非0で終了する。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
let FAIL = 0;
const fail = (m) => { console.log('  [NG] ' + m); FAIL++; };
const ok   = (m) => { console.log('  [OK] ' + m); };

// ── index.html から実在する要素（id・class・data-*）を抽出 ──────────
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const allEls = [];
const byId = {};

function camel(s) { return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); }

function makeEl(tag, attrs) {
  const el = {
    tagName: tag.toUpperCase(),
    id: attrs.id || '',
    dataset: {},
    textContent: '',
    value: attrs.value || '',
    checked: false,
    style: {},
    children: [],
    _handlers: {},
    classList: null,
    addEventListener(type, fn) { (this._handlers[type] = this._handlers[type] || []).push(fn); },
    removeEventListener() {},
    appendChild(ch) { this.children.push(ch); },
    setPointerCapture() {},
    closest() { return null; },
    getBoundingClientRect() { return { width: 400, height: 800, left: 0, top: 0 }; },
  };
  const set = new Set((attrs.class || '').split(/\s+/).filter(Boolean));
  el.classList = {
    add: (c) => set.add(c),
    remove: (c) => set.delete(c),
    toggle: (c, f) => { const v = (f === undefined) ? !set.has(c) : !!f; v ? set.add(c) : set.delete(c); return v; },
    contains: (c) => set.has(c),
  };
  // innerHTML = '' で子要素をクリア（renderLangChips が使う）
  Object.defineProperty(el, 'innerHTML', {
    get() { return ''; },
    set() { el.children.length = 0; },
  });
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('data-')) el.dataset[camel(k.slice(5))] = v;
  }
  // canvas は 2D コンテキストのスタブを返す
  if (tag.toLowerCase() === 'canvas') {
    const gradient = { addColorStop() {} };
    const ctx = {
      setTransform() {}, clearRect() {}, fillRect() {}, beginPath() {}, arc() {}, fill() {},
      moveTo() {}, lineTo() {}, stroke() {},
      createRadialGradient() { return gradient; },
      fillStyle: '', strokeStyle: '', lineWidth: 0, lineCap: '', lineJoin: '',
    };
    el.getContext = () => ctx;
    el.width = 0; el.height = 0;
  }
  return el;
}

// タグを走査して id 付き or class/data 付き要素を疑似DOMに登録
const tagRe = /<([a-zA-Z][\w-]*)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*\/?>/g;
let tm;
while ((tm = tagRe.exec(html)) !== null) {
  const tag = tm[1];
  if (['meta', 'link', 'script', 'title', 'html', 'head', 'body'].includes(tag.toLowerCase())) continue;
  const attrs = {};
  const attrRe = /([\w-]+)="([^"]*)"/g;
  let am;
  while ((am = attrRe.exec(tm[2])) !== null) attrs[am[1]] = am[2];
  const el = makeEl(tag, attrs);
  allEls.push(el);
  if (el.id) byId[el.id] = el;
}

// ── 疑似 document / window / localStorage / navigator ──────────────
const docHandlers = {};
const documentElement = { lang: 'ja', dir: 'ltr', style: {} };
const fakeDocument = {
  documentElement,
  // 実在idのみ返す。未知のidは null（=参照切れは即例外で検出される）
  getElementById(id) { return byId[id] || null; },
  querySelectorAll(sel) {
    const m = sel.match(/^\.([\w-]+)\[data-([\w-]+)\]$/);
    if (!m) throw new Error('疑似DOM未対応のセレクタ: ' + sel);
    return allEls.filter((e) => e.classList.contains(m[1]) && e.dataset[camel(m[2])] !== undefined);
  },
  createElement(tag) { const el = makeEl(tag, {}); allEls.push(el); return el; },
  addEventListener(type, fn) { (docHandlers[type] = docHandlers[type] || []).push(fn); },
};
const store = new Map();
const fakeLocalStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const fakeWindow = {
  addEventListener() {},
  open() {},
  devicePixelRatio: 1,
  self: {}, top: {},
};
let rafCount = 0;
const fakeRaf = (cb) => { if (rafCount < 3) { rafCount++; cb(Date.now()); } return 0; };

// ── app.js をサンドボックスで起動 ──────────────────────────────────
const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const boot = new Function(
  'document', 'window', 'localStorage', 'navigator', 'requestAnimationFrame',
  appSrc
);

console.log('=== nameless_pulse_web 疑似DOMスモークテスト ===\n');

console.log('[1] 起動（DOMContentLoaded → init）');
try {
  boot(fakeDocument, fakeWindow, fakeLocalStorage, {}, fakeRaf);
  for (const fn of docHandlers['DOMContentLoaded'] || []) fn();
  ok('例外なく起動した');
} catch (e) {
  fail('起動時に例外: ' + e.message);
  console.log('\n=== 結果: ' + FAIL + ' 件の失敗 ===');
  process.exit(1);
}

// ── I18N の期待値を app.js から取り出す（起動済みソースと同一の定義）──
const anchor = 'const I18N = {';
const s = appSrc.indexOf(anchor);
let i = s + anchor.length - 1, depth = 0, end = -1;
for (; i < appSrc.length; i++) {
  if (appSrc[i] === '{') depth++;
  else if (appSrc[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const I18N = new Function('return (' + appSrc.slice(s + 'const I18N = '.length, end) + ');')();
const ALL_LANGS = ['ja', 'en', 'ar', 'bn', 'de', 'es', 'fr', 'hi', 'id', 'it', 'ko', 'pt', 'ru', 'zh'];

console.log('\n[2] 言語チップの描画数');
const chips = byId['lang-chips'].children;
if (chips.length === ALL_LANGS.length) ok(`言語チップ ${chips.length} 個（全14言語）`);
else fail(`言語チップが ${chips.length} 個（期待 ${ALL_LANGS.length}）`);

console.log('\n[3][4] 14言語の切替と主要ラベル・RTL');
function click(el) { for (const fn of el._handlers['click'] || []) fn({ target: el }); }
for (const lang of ALL_LANGS) {
  const chip = byId['lang-chips'].children.find((c) => c.dataset.lang === lang);
  if (!chip) { fail(`${lang}: 言語チップが無い`); continue; }
  click(chip);
  const exp = I18N[lang];
  const checks = [
    ['app-name', exp.appName],
    ['first-hint', exp.firstHint],
    ['good-night', exp.goodNight],
    ['title-settings', exp.settings],
    ['btn-back', exp.back],
    ['chip-timer-off', exp.timerOff],
  ];
  let bad = 0;
  for (const [id, want] of checks) {
    const got = byId[id].textContent;
    if (got !== want) { fail(`${lang}: #${id} が ${JSON.stringify(got)}（期待 ${JSON.stringify(want)}）`); bad++; }
  }
  // タイマーチップ（idなし・data-timer属性）も確認
  const t15 = allEls.find((e) => e.dataset.timer === '15');
  if (t15 && t15.textContent !== exp.timer15) { fail(`${lang}: timer15 チップが ${JSON.stringify(t15.textContent)}`); bad++; }
  const wantDir = (lang === 'ar') ? 'rtl' : 'ltr';
  if (documentElement.dir !== wantDir) { fail(`${lang}: dir=${documentElement.dir}（期待 ${wantDir}）`); bad++; }
  if (documentElement.lang !== lang) { fail(`${lang}: documentElement.lang=${documentElement.lang}`); bad++; }
  if (bad === 0) ok(`${lang}: ラベル一致・dir=${wantDir}`);
}

console.log('\n[5] 設定パネルの開閉');
try {
  click(byId['btn-settings']);
  click(byId['btn-back']);
  ok('開閉とも例外なし');
} catch (e) {
  fail('設定パネル開閉で例外: ' + e.message);
}

console.log('\n=== 結果: ' + (FAIL === 0 ? 'ALL OK' : `${FAIL} 件の失敗`) + ' ===');
process.exit(FAIL === 0 ? 0 : 1);
