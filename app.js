/* 非言語サポーターアプリ そよぎ — Web版 */

// ===== 設定（localStorage）=====
const KEYS = {
  defaultMode: 'np_default_mode',
  vibration:   'np_vibration',
  sound:       'np_sound',
  volume:      'np_volume',
  timer:       'np_timer',
  pulseSize:   'np_pulse_size',
  pulseSpeed:  'np_pulse_speed',
  sandFade:    'np_sand_fade',
  lang:        'np_lang',
  firstLaunch: 'np_first_launch',
};

const settings = {
  get defaultMode() { return localStorage.getItem(KEYS.defaultMode) || 'heartbeat'; },
  set defaultMode(v) { localStorage.setItem(KEYS.defaultMode, v); },
  get vibration() { const v = localStorage.getItem(KEYS.vibration); return v === null ? true : v === 'true'; },
  set vibration(v) { localStorage.setItem(KEYS.vibration, String(v)); },
  get sound() { return localStorage.getItem(KEYS.sound) === 'true'; },
  set sound(v) { localStorage.setItem(KEYS.sound, String(v)); },
  get volume() { return parseFloat(localStorage.getItem(KEYS.volume) ?? '0.5'); },
  set volume(v) { localStorage.setItem(KEYS.volume, String(v)); },
  // null = なし
  get timer() { const v = localStorage.getItem(KEYS.timer); return v === null || v === '0' ? null : parseInt(v); },
  set timer(v) { localStorage.setItem(KEYS.timer, v == null ? '0' : String(v)); },
  get pulseSize() { return parseFloat(localStorage.getItem(KEYS.pulseSize) ?? '1.0'); },
  set pulseSize(v) { localStorage.setItem(KEYS.pulseSize, String(v)); },
  get pulseSpeed() { return parseInt(localStorage.getItem(KEYS.pulseSpeed) ?? '0'); },
  set pulseSpeed(v) { localStorage.setItem(KEYS.pulseSpeed, String(v)); },
  get sandFade() { return parseInt(localStorage.getItem(KEYS.sandFade) ?? '0'); },
  set sandFade(v) { localStorage.setItem(KEYS.sandFade, String(v)); },
  get lang() { return localStorage.getItem(KEYS.lang) || 'ja'; },
  set lang(v) { localStorage.setItem(KEYS.lang, v); },
  get firstLaunch() { return localStorage.getItem(KEYS.firstLaunch) !== 'false'; },
  set firstLaunch(v) { localStorage.setItem(KEYS.firstLaunch, String(v)); },
  pulseMillis() {
    switch (this.pulseSpeed) { case 1: return 1333; case 2: return 1714; default: return 1000; }
  },
  sandFadeDelayMs() {
    switch (this.sandFade) { case -1: return 1000; case 1: return 6000; default: return 3000; }
  }
};

// ===== i18n =====
const I18N = {
  ja: {
    appName: '非言語サポーターアプリ　そよぎ',
    firstHint: 'そっと、触れてみて',
    settings: '⚙️ 設定',
    language: '言語',
    defaultMode: '起動時のモード',
    modeHeart: '🫀 鼓動',
    modeSand: '🏜️ 砂',
    vibration: '振動',
    sound: '音',
    volLo: '小', volHi: '大', sizeLo: '小', sizeHi: '大',
    timer: 'おやすみタイマー',
    timer15: '15分', timer30: '30分', timer60: '60分', timerOff: 'なし',
    pulseSpeed: '鼓動の速さ',
    speedNormal: '普通', speedSlow: 'ゆっくり', speedVerySlow: 'もっとゆっくり',
    pulseSize: '鼓動の大きさ',
    sandFade: '砂の消え方',
    fadeFast: '早く消える', fadeNormal: '普通', fadeSlow: 'ゆっくり消える',
    soyogiLink: '🌿 困ったときは → そよぎ',
    credit: '開発：介護と支援の相談どころ　そよぎ',
    back: 'もどる',
  },
  en: {
    appName: 'Nonverbal Supporter  Soyogi',
    firstHint: 'Touch softly',
    settings: '⚙️ Settings',
    language: 'Language',
    defaultMode: 'Default Mode',
    modeHeart: '🫀 Pulse',
    modeSand: '🏜️ Sand',
    vibration: 'Vibration',
    sound: 'Sound',
    volLo: 'Low', volHi: 'High', sizeLo: 'Sm', sizeHi: 'Lg',
    timer: 'Sleep Timer',
    timer15: '15 min', timer30: '30 min', timer60: '60 min', timerOff: 'Off',
    pulseSpeed: 'Pulse Speed',
    speedNormal: 'Normal', speedSlow: 'Slow', speedVerySlow: 'Very Slow',
    pulseSize: 'Pulse Size',
    sandFade: 'Sand Fade',
    fadeFast: 'Fast', fadeNormal: 'Normal', fadeSlow: 'Slow',
    soyogiLink: '🌿 Need support? → Soyogi',
    credit: 'Developed by Soyogi',
    back: 'Back',
  },
};
function t(k) { return (I18N[settings.lang] || I18N.ja)[k] ?? I18N.ja[k] ?? ''; }
function isEn() { return settings.lang === 'en'; }

// ===== DOM =====
const $ = (id) => document.getElementById(id);
const canvas = $('canvas');
const ctx = canvas.getContext('2d');

// ===== Canvas Resize =====
let DPR = Math.max(1, window.devicePixelRatio || 1);
function resizeCanvas() {
  DPR = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * DPR);
  canvas.height = Math.floor(rect.height * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', () => { resizeCanvas(); });

// ===== Web Audio (鼓動・風) =====
let audioCtx = null;
function ensureAudio() {
  if (audioCtx) return audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  audioCtx = new Ctx();
  return audioCtx;
}
function playHeartbeat() {
  if (!settings.sound) return;
  const ac = ensureAudio();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume();
  // Two-tone "lub-dub"
  // 音量は二乗カーブ：最小はごく小さく、最大はしっかり大きく（調整幅を広げる）
  const v = settings.volume;
  const vol = v * v;
  const t0 = ac.currentTime;
  function tone(at, f, dur, peak) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, at);
    osc.frequency.exponentialRampToValueAtTime(f * 0.5, at + dur);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak * vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }
  tone(t0,        90, 0.18, 0.8);
  tone(t0 + 0.16, 70, 0.22, 0.55);
}
function playWind() {
  if (!settings.sound) return;
  const ac = ensureAudio();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume();
  const dur = 1.2;
  const bufferSize = Math.floor(ac.sampleRate * dur);
  const noise = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
  const src = ac.createBufferSource();
  src.buffer = noise;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 600;
  filter.Q.value = 0.7;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, ac.currentTime);
  g.gain.linearRampToValueAtTime(0.35 * settings.volume, ac.currentTime + 0.3);
  g.gain.linearRampToValueAtTime(0, ac.currentTime + dur);
  src.connect(filter).connect(g).connect(ac.destination);
  src.start();
  src.stop(ac.currentTime + dur);
}

// ===== Vibration =====
function vibrate(ms, intensity) {
  if (!settings.vibration) return;
  if (navigator.vibrate) navigator.vibrate(ms);
}

// ===== モード管理 =====
let currentMode = settings.defaultMode || 'heartbeat';

// ===== タイマー =====
let timerEndAt = null;
let timerInterval = null;
let timerExpired = false;

function startTimerIfNeeded() {
  stopTimer();
  if (settings.timer == null) return;
  timerExpired = false;
  timerEndAt = Date.now() + settings.timer * 60 * 1000;
  const el = $('timer-display');
  el.classList.add('active');
  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}
function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  timerEndAt = null;
  $('timer-display').classList.remove('active');
}
function updateTimerDisplay() {
  if (timerEndAt == null) return;
  const remain = Math.max(0, Math.floor((timerEndAt - Date.now()) / 1000));
  const m = Math.floor(remain / 60);
  const s = remain % 60;
  $('timer-display').textContent = `${m}:${String(s).padStart(2, '0')}`;
  if (remain <= 0) {
    timerExpired = true;
    stopTimer();
  }
}

// ===== 鼓動モード =====
let heartLightPos = null;       // {x, y} or null = 中央
let heartPulseValue = 0;        // 0..1（描画用）
let heartPulseStart = performance.now();
let lastBeatX = 0;              // 前フレームの拍位相（ピーク検出用）
let settingsOpen = false;       // 設定パネル表示中フラグ（開いている間は鼓動プレビューを鳴らす）

function startHeartbeat() {
  currentMode = 'heartbeat';
  heartPulseStart = performance.now();
  lastBeatX = 0;
  // 音・振動は描画ループ内で「見た目のピーク」に合わせて発火する（別タイマーは使わない）
}
function stopHeartbeat() {
  // 旧：拍タイマーを止めていた。現在は描画ループ側で制御するため何もしない。
}

function drawHeartbeat() {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width, h = rect.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  // 1拍 = period。x は1拍で 0→1 を進む（見た目は 0→1→0 の三角波で膨らんで縮む）
  const period = settings.pulseMillis();
  const x = ((performance.now() - heartPulseStart) % period) / period; // 0..1
  const tri = x < 0.5 ? x * 2 : (1 - x) * 2;
  // easeInOut
  const eased = tri < 0.5 ? 2 * tri * tri : 1 - Math.pow(-2 * tri + 2, 2) / 2;
  heartPulseValue = eased;
  // ピーク(x=0.5)を上向きに通過した瞬間に1拍 → 音と見た目を完全同期
  if (lastBeatX < 0.5 && x >= 0.5 && !timerExpired) {
    if (!settingsOpen) vibrate(80); // 設定プレビュー中は振動させない（音だけ）
    playHeartbeat();
  }
  lastBeatX = x;

  const cx = heartLightPos ? heartLightPos.x : w / 2;
  const cy = heartLightPos ? heartLightPos.y : h / 2;
  const scale = settings.pulseSize;

  // 外側の薄いグロー
  const outerR = (60 + eased * 80) * scale;
  let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR * 2);
  g.addColorStop(0, `rgba(255, 224, 178, ${0.08 * eased})`);
  g.addColorStop(1, 'rgba(255, 224, 178, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR * 2, 0, Math.PI * 2);
  ctx.fill();

  // 中間のグロー
  const midR = (30 + eased * 50) * scale;
  g = ctx.createRadialGradient(cx, cy, 0, cx, cy, midR * 2);
  g.addColorStop(0, `rgba(255, 248, 225, ${0.15 + eased * 0.1})`);
  g.addColorStop(0.5, `rgba(255, 224, 178, ${0.05 * eased})`);
  g.addColorStop(1, 'rgba(255, 224, 178, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, midR * 2, 0, Math.PI * 2);
  ctx.fill();

  // 中心の光
  const coreR = (10 + eased * 20) * scale;
  g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  g.addColorStop(0, 'rgba(255, 248, 225, 0.9)');
  g.addColorStop(0.5, 'rgba(255, 224, 178, 0.6)');
  g.addColorStop(1, 'rgba(255, 224, 178, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();
}

// ===== 砂モード =====
const SAND_COLORS = ['#FFD54F', '#FF8A65', '#CE93D8', '#5C6BC0', '#80CBC4'];
let sandColorIndex = 0;
const strokes = [];
const activePointers = new Map();
const pointerColors = new Map();
let windAngle = 0;

function nextSandColor() {
  sandColorIndex = (sandColorIndex + 1) % SAND_COLORS.length;
  return SAND_COLORS[sandColorIndex];
}

function tickSand() {
  windAngle += 0.004;
  const wx = Math.cos(windAngle) * 1.8;
  const wy = Math.sin(windAngle) * 0.8;
  for (const stroke of strokes) {
    if (!stroke.dissolving) continue;
    stroke.dissolveProgress = Math.min(1.0, stroke.dissolveProgress + 0.014);
    const frontIdx = Math.floor(stroke.dissolveProgress * stroke.points.length);
    for (let i = stroke.lastSpawnedIdx; i < frontIdx; i++) {
      if (Math.random() > 0.6) continue;
      const speed = 0.8 + Math.random() * 1.6;
      stroke.particles.push({
        x: stroke.points[i].x,
        y: stroke.points[i].y,
        vx: wx * speed + (Math.random() - 0.5) * 1.2,
        vy: wy * speed + (Math.random() - 0.7) * 1.2,
        size: Math.random() * 2.5 + 0.8,
        opacity: 1.0,
        fade: 0.010 + Math.random() * 0.012,
      });
    }
    stroke.lastSpawnedIdx = frontIdx;
    for (const p of stroke.particles) {
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.98; p.vy *= 0.98;
      p.opacity -= p.fade;
    }
    stroke.particles = stroke.particles.filter(p => p.opacity > 0);
  }
  for (let i = strokes.length - 1; i >= 0; i--) {
    if (strokes[i].dissolving && strokes[i].dissolveProgress >= 1.0 && strokes[i].particles.length === 0) {
      strokes.splice(i, 1);
    }
  }
}

function drawSandStroke(points, color, opacity) {
  if (points.length < 2) return;
  ctx.strokeStyle = hexToRgba(color, opacity * 0.85);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
  // 薄い外側
  ctx.strokeStyle = hexToRgba(color, opacity * 0.2);
  ctx.lineWidth = 1;
  ctx.stroke();
}

function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function drawSand() {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width, h = rect.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#1A1610';
  ctx.fillRect(0, 0, w, h);

  tickSand();

  for (const stroke of strokes) {
    if (stroke.dissolving) {
      const startIdx = Math.floor(stroke.dissolveProgress * stroke.points.length);
      if (startIdx < stroke.points.length) {
        drawSandStroke(stroke.points.slice(startIdx), stroke.color, 1.0 - stroke.dissolveProgress * 0.3);
      }
      for (const p of stroke.particles) {
        ctx.fillStyle = hexToRgba(stroke.color, p.opacity);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      drawSandStroke(stroke.points, stroke.color, 1.0);
    }
  }
  for (const [pid, pts] of activePointers) {
    const color = pointerColors.get(pid) || '#FFD54F';
    drawSandStroke(pts, color, 1.0);
  }
}

// ===== ポインタイベント（砂モード用 + 鼓動の光移動）=====
function onPointerDown(e) {
  // 設定パネル表示中は何もしない
  if ($('settings-panel').classList.contains('open')) return;
  // bottom-bar 上の操作は除外
  if (e.target.closest('.bottom-bar')) return;

  // First hint fade
  hideFirstHint();

  // モード固有処理
  ensureAudio();
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (currentMode === 'sand') {
    const id = e.pointerId ?? 0;
    activePointers.set(id, [{ x, y }]);
    pointerColors.set(id, nextSandColor());
    vibrate(20);
  } else {
    heartLightPos = { x, y };
  }
  e.target.setPointerCapture?.(e.pointerId);
}

function onPointerMove(e) {
  if (!e.buttons && e.pointerType !== 'touch') return;
  if ($('settings-panel').classList.contains('open')) return;
  if (e.target.closest('.bottom-bar')) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (currentMode === 'sand') {
    const id = e.pointerId ?? 0;
    if (activePointers.has(id)) activePointers.get(id).push({ x, y });
  } else if (heartLightPos) {
    heartLightPos.x = x; heartLightPos.y = y;
  }
}

function onPointerUp(e) {
  if (currentMode === 'sand') {
    const id = e.pointerId ?? 0;
    const pts = activePointers.get(id);
    const color = pointerColors.get(id);
    activePointers.delete(id);
    pointerColors.delete(id);
    if (pts && pts.length > 0 && color) {
      const stroke = {
        points: pts,
        color,
        dissolving: false,
        dissolveProgress: 0,
        lastSpawnedIdx: 0,
        particles: [],
      };
      strokes.push(stroke);
      const delay = settings.sandFadeDelayMs() + Math.random() * 2000;
      setTimeout(() => {
        stroke.dissolving = true;
        playWind();
      }, delay);
    }
  }
}

// ===== 描画ループ =====
function tick() {
  // 設定を開いている間は、現在のモードに関わらず鼓動プレビューを表示＆再生する
  if (settingsOpen || currentMode === 'heartbeat') drawHeartbeat();
  else drawSand();
  requestAnimationFrame(tick);
}

// ===== モード切替 =====
function setMode(mode) {
  currentMode = mode;
  if (mode === 'heartbeat') {
    startHeartbeat();
    heartLightPos = null;
  } else {
    stopHeartbeat();
  }
  updateBlink();
}
function updateBlink() {
  $('btn-sand').classList.toggle('blinking', currentMode === 'heartbeat');
  $('btn-heart').classList.toggle('blinking', currentMode === 'sand');
}

// ===== 設定パネル =====
function applyI18n() {
  document.documentElement.lang = settings.lang;
  $('app-name').textContent = t('appName');
  $('first-hint').textContent = t('firstHint');
  $('title-settings').textContent = t('settings');
  $('lbl-lang').textContent = t('language');
  $('lbl-default-mode').textContent = t('defaultMode');
  $('lbl-mode-heart').textContent = t('modeHeart');
  $('lbl-mode-sand').textContent = t('modeSand');
  $('lbl-vibration').textContent = t('vibration');
  $('lbl-sound').textContent = t('sound');
  $('lbl-vol-lo').textContent = t('volLo');
  $('lbl-vol-hi').textContent = t('volHi');
  $('lbl-size-lo').textContent = t('sizeLo');
  $('lbl-size-hi').textContent = t('sizeHi');
  $('lbl-timer').textContent = t('timer');
  document.querySelectorAll('.chip[data-timer]').forEach(c => {
    const v = c.dataset.timer;
    if (v === '15') c.textContent = t('timer15');
    else if (v === '30') c.textContent = t('timer30');
    else if (v === '60') c.textContent = t('timer60');
    else c.textContent = t('timerOff');
  });
  $('lbl-pulse-speed').textContent = t('pulseSpeed');
  $('chip-speed-0').textContent = t('speedNormal');
  $('chip-speed-1').textContent = t('speedSlow');
  $('chip-speed-2').textContent = t('speedVerySlow');
  $('lbl-pulse-size').textContent = t('pulseSize');
  $('lbl-sand-fade').textContent = t('sandFade');
  $('chip-fade-fast').textContent = t('fadeFast');
  $('chip-fade-normal').textContent = t('fadeNormal');
  $('chip-fade-slow').textContent = t('fadeSlow');
  $('link-soyogi').textContent = t('soyogiLink');
  $('credit').textContent = t('credit');
  $('btn-back').textContent = t('back');
}

function refreshSettingsUI() {
  // language chips
  $('chip-lang-ja').classList.toggle('selected', settings.lang === 'ja');
  $('chip-lang-en').classList.toggle('selected', settings.lang === 'en');
  // default mode
  $('chip-mode-heartbeat').classList.toggle('selected', settings.defaultMode === 'heartbeat');
  $('chip-mode-sand').classList.toggle('selected', settings.defaultMode === 'sand');
  // vibration
  $('chk-vibration').checked = settings.vibration;
  // sound
  $('chk-sound').checked = settings.sound;
  $('volume-row').style.display = settings.sound ? '' : 'none';
  $('slider-volume').value = settings.volume;
  // timer
  document.querySelectorAll('.chip[data-timer]').forEach(c => {
    const v = parseInt(c.dataset.timer);
    const cur = settings.timer ?? 0;
    c.classList.toggle('selected', v === cur);
  });
  // pulse speed
  document.querySelectorAll('.chip[data-speed]').forEach(c => {
    c.classList.toggle('selected', parseInt(c.dataset.speed) === settings.pulseSpeed);
  });
  // pulse size
  $('slider-size').value = settings.pulseSize;
  // sand fade
  document.querySelectorAll('.chip[data-fade]').forEach(c => {
    c.classList.toggle('selected', parseInt(c.dataset.fade) === settings.sandFade);
  });
}

function openSettings() {
  $('settings-panel').classList.add('open');
  settingsOpen = true;
  ensureAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  // プレビューの拍位相をリセットして気持ちよく始める
  heartPulseStart = performance.now();
  lastBeatX = 0;
  refreshSettingsUI();
}
function closeSettings() {
  $('settings-panel').classList.remove('open');
  settingsOpen = false;
  // 設定変更を反映
  applyI18n();
  heartPulseStart = performance.now();
  lastBeatX = 0;
  if (settings.timer == null) stopTimer();
  else if (timerEndAt == null) startTimerIfNeeded();
}

// ===== First Hint =====
let firstHintHidden = false;
function hideFirstHint() {
  if (firstHintHidden) return;
  firstHintHidden = true;
  const el = $('first-hint');
  el.classList.add('fade');
  setTimeout(() => { el.style.display = 'none'; }, 800);
  settings.firstLaunch = false;
}

// ===== イベント登録 =====
function bindEvents() {
  // ポインタ：canvasにバインド（bottom-bar以外）
  const surface = $('app');
  surface.addEventListener('pointerdown', onPointerDown);
  surface.addEventListener('pointermove', onPointerMove);
  surface.addEventListener('pointerup', onPointerUp);
  surface.addEventListener('pointercancel', onPointerUp);

  // 下部ボタン
  $('btn-sand').addEventListener('click', () => setMode('sand'));
  $('btn-heart').addEventListener('click', () => setMode('heartbeat'));
  $('btn-settings').addEventListener('click', openSettings);
  $('btn-back').addEventListener('click', closeSettings);

  // 言語
  document.querySelectorAll('.chip[data-lang]').forEach(c => c.addEventListener('click', () => {
    settings.lang = c.dataset.lang;
    applyI18n();
    refreshSettingsUI();
  }));
  // デフォルトモード
  document.querySelectorAll('.chip[data-mode]').forEach(c => c.addEventListener('click', () => {
    settings.defaultMode = c.dataset.mode;
    refreshSettingsUI();
  }));
  // 振動
  $('chk-vibration').addEventListener('change', (e) => {
    settings.vibration = e.target.checked;
    if (settings.vibration) vibrate(30);
  });
  // 音
  $('chk-sound').addEventListener('change', (e) => {
    settings.sound = e.target.checked;
    ensureAudio();
    refreshSettingsUI();
    if (settings.sound) playHeartbeat();
  });
  // 音量
  $('slider-volume').addEventListener('input', (e) => {
    settings.volume = parseFloat(e.target.value);
    // 設定中は鼓動プレビューが鳴り続けるので、次の拍で新しい音量が即反映される
  });
  // タイマー
  document.querySelectorAll('.chip[data-timer]').forEach(c => c.addEventListener('click', () => {
    const v = parseInt(c.dataset.timer);
    settings.timer = v === 0 ? null : v;
    refreshSettingsUI();
  }));
  // 鼓動速度
  document.querySelectorAll('.chip[data-speed]').forEach(c => c.addEventListener('click', () => {
    settings.pulseSpeed = parseInt(c.dataset.speed);
    refreshSettingsUI();
    // テンポを即反映（モードは変えない）。位相をリセットして滑らかに切替
    heartPulseStart = performance.now();
    lastBeatX = 0;
  }));
  // 鼓動サイズ
  $('slider-size').addEventListener('input', (e) => {
    settings.pulseSize = parseFloat(e.target.value);
  });
  // 砂の消え方
  document.querySelectorAll('.chip[data-fade]').forEach(c => c.addEventListener('click', () => {
    settings.sandFade = parseInt(c.dataset.fade);
    refreshSettingsUI();
  }));
  // そよぎHP
  $('link-soyogi').addEventListener('click', () => {
    window.open('https://soyogi.hp.peraichi.com/top', '_blank', 'noopener');
  });

  // Resume audio context on first user interaction
  document.addEventListener('pointerdown', () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: true });
}

// ===== 起動 =====
function init() {
  resizeCanvas();
  bindEvents();
  applyI18n();
  setMode(settings.defaultMode);
  startTimerIfNeeded();
  if (!settings.firstLaunch) {
    $('first-hint').style.display = 'none';
  }
  requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', init);
