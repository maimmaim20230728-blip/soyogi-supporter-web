/* 非言語サポーターアプリ そよぎ — Web版 */

// ===== 設定（localStorage）=====
const KEYS = {
  defaultMode: 'np_default_mode',
  vibration:   'np_vibration',
  vibrationStrength: 'np_vibration_strength',
  sound:       'np_sound',
  volume:      'np_volume',
  timer:       'np_timer',
  pulseSize:   'np_pulse_size',
  pulseSpeed:  'np_pulse_speed',
  sandFade:    'np_sand_fade',
  lang:        'np_lang',
  firstLaunch: 'np_first_launch',
};

// おやすみタイマーは「都度設定」。永続保存せずアプリ内メモリだけで持つ（起動時は常に なし）。
let _timerMinutes = null;

const settings = {
  get defaultMode() { return localStorage.getItem(KEYS.defaultMode) || 'heartbeat'; },
  set defaultMode(v) { localStorage.setItem(KEYS.defaultMode, v); },
  get vibration() { const v = localStorage.getItem(KEYS.vibration); return v === null ? true : v === 'true'; },
  set vibration(v) { localStorage.setItem(KEYS.vibration, String(v)); },
  // 振動の強さ: 0=よわい / 1=ふつう / 2=つよい（デフォルト1）。webは振幅制御が無いので長さで表現。
  get vibrationStrength() { return parseInt(localStorage.getItem(KEYS.vibrationStrength) ?? '1'); },
  set vibrationStrength(v) { localStorage.setItem(KEYS.vibrationStrength, String(v)); },
  get sound() { return localStorage.getItem(KEYS.sound) === 'true'; },
  set sound(v) { localStorage.setItem(KEYS.sound, String(v)); },
  get volume() { return parseFloat(localStorage.getItem(KEYS.volume) ?? '0.5'); },
  set volume(v) { localStorage.setItem(KEYS.volume, String(v)); },
  // null = なし。都度設定：永続保存しない（設定の選択は「今回だけ」）。
  get timer() { return _timerMinutes; },
  set timer(v) { _timerMinutes = (v == null ? null : v); },
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
    goodNight: 'おやすみなさい',
    settings: '⚙️ 設定',
    language: '言語',
    defaultMode: '起動時のモード',
    modeHeart: '🫀 鼓動',
    modeSand: '🏜️ 砂',
    vibration: '振動',
    vibeStrength: '振動の強さ',
    vibeWeak: 'よわい', vibeMed: 'ふつう', vibeStrong: 'つよい',
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
    firstHint: 'Gently, try touching',
    goodNight: 'Good night',
    settings: '⚙️ Settings',
    language: 'Language',
    defaultMode: 'Default Mode',
    modeHeart: '🫀 Pulse',
    modeSand: '🏜️ Sand',
    vibration: 'Vibration',
    vibeStrength: 'Vibration Strength',
    vibeWeak: 'Weak', vibeMed: 'Med', vibeStrong: 'Strong',
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
  ar: {
    appName: 'الداعم غير اللفظي  Soyogi',
    firstHint: 'المس برفق',
    goodNight: 'تصبح على خير',
    settings: '⚙️ الإعدادات',
    language: 'اللغة',
    defaultMode: 'وضع البدء',
    modeHeart: '🫀 نبض',
    modeSand: '🏜️ رمل',
    vibration: 'الاهتزاز',
    vibeStrength: 'قوة الاهتزاز',
    vibeWeak: 'خفيف', vibeMed: 'متوسط', vibeStrong: 'قوي',
    sound: 'الصوت',
    volLo: 'منخفض', volHi: 'مرتفع', sizeLo: 'صغير', sizeHi: 'كبير',
    timer: 'مؤقت النوم',
    timer15: '15 دقيقة', timer30: '30 دقيقة', timer60: '60 دقيقة', timerOff: 'إيقاف',
    pulseSpeed: 'سرعة النبض',
    speedNormal: 'عادي', speedSlow: 'بطيء', speedVerySlow: 'أبطأ',
    pulseSize: 'حجم النبض',
    sandFade: 'تلاشي الرمل',
    fadeFast: 'سريع', fadeNormal: 'عادي', fadeSlow: 'بطيء',
    soyogiLink: '🌿 تحتاج دعمًا؟ ← Soyogi',
    credit: 'تطوير: Soyogi',
    back: 'رجوع',
  },
  bn: {
    appName: 'অবাচনিক সহায়ক  Soyogi',
    firstHint: 'আলতো করে ছুঁয়ে দেখো',
    goodNight: 'শুভ রাত্রি',
    settings: '⚙️ সেটিংস',
    language: 'ভাষা',
    defaultMode: 'শুরুর মোড',
    modeHeart: '🫀 স্পন্দন',
    modeSand: '🏜️ বালি',
    vibration: 'কম্পন',
    vibeStrength: 'কম্পনের মাত্রা',
    vibeWeak: 'হালকা', vibeMed: 'মাঝারি', vibeStrong: 'জোরালো',
    sound: 'শব্দ',
    volLo: 'কম', volHi: 'বেশি', sizeLo: 'ছোট', sizeHi: 'বড়',
    timer: 'ঘুমের টাইমার',
    timer15: '15 মিনিট', timer30: '30 মিনিট', timer60: '60 মিনিট', timerOff: 'বন্ধ',
    pulseSpeed: 'স্পন্দনের গতি',
    speedNormal: 'স্বাভাবিক', speedSlow: 'ধীর', speedVerySlow: 'আরও ধীর',
    pulseSize: 'স্পন্দনের আকার',
    sandFade: 'বালি মিলিয়ে যাওয়া',
    fadeFast: 'তাড়াতাড়ি', fadeNormal: 'স্বাভাবিক', fadeSlow: 'ধীরে ধীরে',
    soyogiLink: '🌿 সাহায্য দরকার? → Soyogi',
    credit: 'তৈরি করেছে Soyogi',
    back: 'পিছনে',
  },
  de: {
    appName: 'Nonverbaler Begleiter  Soyogi',
    firstHint: 'Ganz sanft berühren',
    goodNight: 'Gute Nacht',
    settings: '⚙️ Einstellungen',
    language: 'Sprache',
    defaultMode: 'Startmodus',
    modeHeart: '🫀 Herzschlag',
    modeSand: '🏜️ Sand',
    vibration: 'Vibration',
    vibeStrength: 'Stärke der Vibration',
    vibeWeak: 'Sanft', vibeMed: 'Mittel', vibeStrong: 'Stark',
    sound: 'Ton',
    volLo: 'Leise', volHi: 'Laut', sizeLo: 'Klein', sizeHi: 'Groß',
    timer: 'Einschlaf-Timer',
    timer15: '15 Min.', timer30: '30 Min.', timer60: '60 Min.', timerOff: 'Aus',
    pulseSpeed: 'Tempo des Herzschlags',
    speedNormal: 'Normal', speedSlow: 'Langsam', speedVerySlow: 'Noch langsamer',
    pulseSize: 'Größe des Herzschlags',
    sandFade: 'Wie der Sand verweht',
    fadeFast: 'Schnell', fadeNormal: 'Normal', fadeSlow: 'Langsam',
    soyogiLink: '🌿 Brauchst du Hilfe? → Soyogi',
    credit: 'Entwickelt von Soyogi',
    back: 'Zurück',
  },
  es: {
    appName: 'Compañero no verbal  Soyogi',
    firstHint: 'Toca con suavidad',
    goodNight: 'Buenas noches',
    settings: '⚙️ Ajustes',
    language: 'Idioma',
    defaultMode: 'Modo de inicio',
    modeHeart: '🫀 Latido',
    modeSand: '🏜️ Arena',
    vibration: 'Vibración',
    vibeStrength: 'Intensidad de la vibración',
    vibeWeak: 'Suave', vibeMed: 'Media', vibeStrong: 'Fuerte',
    sound: 'Sonido',
    volLo: 'Bajo', volHi: 'Alto', sizeLo: 'Pequeño', sizeHi: 'Grande',
    timer: 'Temporizador para dormir',
    timer15: '15 min', timer30: '30 min', timer60: '60 min', timerOff: 'Apagado',
    pulseSpeed: 'Ritmo del latido',
    speedNormal: 'Normal', speedSlow: 'Lento', speedVerySlow: 'Más lento',
    pulseSize: 'Tamaño del latido',
    sandFade: 'Cómo se desvanece la arena',
    fadeFast: 'Rápido', fadeNormal: 'Normal', fadeSlow: 'Lento',
    soyogiLink: '🌿 ¿Necesitas apoyo? → Soyogi',
    credit: 'Desarrollado por Soyogi',
    back: 'Volver',
  },
  fr: {
    appName: 'Compagnon non verbal  Soyogi',
    firstHint: 'Touche, tout doucement',
    goodNight: 'Bonne nuit',
    settings: '⚙️ Réglages',
    language: 'Langue',
    defaultMode: 'Mode au démarrage',
    modeHeart: '🫀 Battement',
    modeSand: '🏜️ Sable',
    vibration: 'Vibration',
    vibeStrength: 'Intensité de la vibration',
    vibeWeak: 'Douce', vibeMed: 'Moyenne', vibeStrong: 'Forte',
    sound: 'Son',
    volLo: 'Faible', volHi: 'Fort', sizeLo: 'Petit', sizeHi: 'Grand',
    timer: 'Minuteur de sommeil',
    timer15: '15 min', timer30: '30 min', timer60: '60 min', timerOff: 'Aucun',
    pulseSpeed: 'Rythme du battement',
    speedNormal: 'Normal', speedSlow: 'Lent', speedVerySlow: 'Plus lent',
    pulseSize: 'Taille du battement',
    sandFade: 'Comment le sable s\'efface',
    fadeFast: 'Rapide', fadeNormal: 'Normal', fadeSlow: 'Lent',
    soyogiLink: '🌿 Besoin d\'aide ? → Soyogi',
    credit: 'Développé par Soyogi',
    back: 'Retour',
  },
  hi: {
    appName: 'गैर-मौखिक सहयोगी  Soyogi',
    firstHint: 'धीरे से छूकर देखो',
    goodNight: 'शुभ रात्रि',
    settings: '⚙️ सेटिंग्स',
    language: 'भाषा',
    defaultMode: 'शुरुआती मोड',
    modeHeart: '🫀 धड़कन',
    modeSand: '🏜️ रेत',
    vibration: 'कंपन',
    vibeStrength: 'कंपन की तीव्रता',
    vibeWeak: 'हल्का', vibeMed: 'मध्यम', vibeStrong: 'तेज़',
    sound: 'आवाज़',
    volLo: 'कम', volHi: 'ज़्यादा', sizeLo: 'छोटा', sizeHi: 'बड़ा',
    timer: 'सोने का टाइमर',
    timer15: '15 मिनट', timer30: '30 मिनट', timer60: '60 मिनट', timerOff: 'बंद',
    pulseSpeed: 'धड़कन की गति',
    speedNormal: 'सामान्य', speedSlow: 'धीमी', speedVerySlow: 'और धीमी',
    pulseSize: 'धड़कन का आकार',
    sandFade: 'रेत का मिटना',
    fadeFast: 'जल्दी', fadeNormal: 'सामान्य', fadeSlow: 'धीरे-धीरे',
    soyogiLink: '🌿 मदद चाहिए? → Soyogi',
    credit: 'Soyogi द्वारा निर्मित',
    back: 'वापस',
  },
  id: {
    appName: 'Pendamping Nonverbal  Soyogi',
    firstHint: 'Sentuhlah, pelan-pelan',
    goodNight: 'Selamat tidur',
    settings: '⚙️ Pengaturan',
    language: 'Bahasa',
    defaultMode: 'Mode awal',
    modeHeart: '🫀 Detak',
    modeSand: '🏜️ Pasir',
    vibration: 'Getaran',
    vibeStrength: 'Kekuatan getaran',
    vibeWeak: 'Lembut', vibeMed: 'Sedang', vibeStrong: 'Kuat',
    sound: 'Suara',
    volLo: 'Pelan', volHi: 'Keras', sizeLo: 'Kecil', sizeHi: 'Besar',
    timer: 'Timer tidur',
    timer15: '15 menit', timer30: '30 menit', timer60: '60 menit', timerOff: 'Mati',
    pulseSpeed: 'Kecepatan detak',
    speedNormal: 'Biasa', speedSlow: 'Pelan', speedVerySlow: 'Lebih pelan',
    pulseSize: 'Ukuran detak',
    sandFade: 'Cara pasir menghilang',
    fadeFast: 'Cepat', fadeNormal: 'Biasa', fadeSlow: 'Perlahan',
    soyogiLink: '🌿 Butuh bantuan? → Soyogi',
    credit: 'Dikembangkan oleh Soyogi',
    back: 'Kembali',
  },
  it: {
    appName: 'Compagno non verbale  Soyogi',
    firstHint: 'Sfiora, con dolcezza',
    goodNight: 'Buonanotte',
    settings: '⚙️ Impostazioni',
    language: 'Lingua',
    defaultMode: 'Modalità iniziale',
    modeHeart: '🫀 Battito',
    modeSand: '🏜️ Sabbia',
    vibration: 'Vibrazione',
    vibeStrength: 'Intensità della vibrazione',
    vibeWeak: 'Leggera', vibeMed: 'Media', vibeStrong: 'Forte',
    sound: 'Suono',
    volLo: 'Basso', volHi: 'Alto', sizeLo: 'Piccolo', sizeHi: 'Grande',
    timer: 'Timer del sonno',
    timer15: '15 min', timer30: '30 min', timer60: '60 min', timerOff: 'Spento',
    pulseSpeed: 'Ritmo del battito',
    speedNormal: 'Normale', speedSlow: 'Lento', speedVerySlow: 'Più lento',
    pulseSize: 'Grandezza del battito',
    sandFade: 'Come svanisce la sabbia',
    fadeFast: 'Veloce', fadeNormal: 'Normale', fadeSlow: 'Lento',
    soyogiLink: '🌿 Ti serve aiuto? → Soyogi',
    credit: 'Sviluppato da Soyogi',
    back: 'Indietro',
  },
  ko: {
    appName: '비언어 서포터  Soyogi',
    firstHint: '살며시, 닿아 보세요',
    goodNight: '잘 자요',
    settings: '⚙️ 설정',
    language: '언어',
    defaultMode: '시작 모드',
    modeHeart: '🫀 고동',
    modeSand: '🏜️ 모래',
    vibration: '진동',
    vibeStrength: '진동 세기',
    vibeWeak: '약하게', vibeMed: '보통', vibeStrong: '세게',
    sound: '소리',
    volLo: '작게', volHi: '크게', sizeLo: '작게', sizeHi: '크게',
    timer: '취침 타이머',
    timer15: '15분', timer30: '30분', timer60: '60분', timerOff: '없음',
    pulseSpeed: '고동 빠르기',
    speedNormal: '보통', speedSlow: '천천히', speedVerySlow: '더 천천히',
    pulseSize: '고동 크기',
    sandFade: '모래가 사라지는 모습',
    fadeFast: '빨리', fadeNormal: '보통', fadeSlow: '천천히',
    soyogiLink: '🌿 힘들 때는 → Soyogi',
    credit: '개발: Soyogi',
    back: '뒤로',
  },
  pt: {
    appName: 'Companheiro não verbal  Soyogi',
    firstHint: 'Toque, bem de leve',
    goodNight: 'Boa noite',
    settings: '⚙️ Configurações',
    language: 'Idioma',
    defaultMode: 'Modo inicial',
    modeHeart: '🫀 Batimento',
    modeSand: '🏜️ Areia',
    vibration: 'Vibração',
    vibeStrength: 'Intensidade da vibração',
    vibeWeak: 'Suave', vibeMed: 'Média', vibeStrong: 'Forte',
    sound: 'Som',
    volLo: 'Baixo', volHi: 'Alto', sizeLo: 'Pequeno', sizeHi: 'Grande',
    timer: 'Temporizador para dormir',
    timer15: '15 min', timer30: '30 min', timer60: '60 min', timerOff: 'Desligado',
    pulseSpeed: 'Ritmo do batimento',
    speedNormal: 'Normal', speedSlow: 'Lento', speedVerySlow: 'Mais lento',
    pulseSize: 'Tamanho do batimento',
    sandFade: 'Como a areia se desfaz',
    fadeFast: 'Rápido', fadeNormal: 'Normal', fadeSlow: 'Devagar',
    soyogiLink: '🌿 Precisa de apoio? → Soyogi',
    credit: 'Desenvolvido por Soyogi',
    back: 'Voltar',
  },
  ru: {
    appName: 'Невербальный помощник  Soyogi',
    firstHint: 'Тихонько прикоснись',
    goodNight: 'Спокойной ночи',
    settings: '⚙️ Настройки',
    language: 'Язык',
    defaultMode: 'Режим при запуске',
    modeHeart: '🫀 Пульс',
    modeSand: '🏜️ Песок',
    vibration: 'Вибрация',
    vibeStrength: 'Сила вибрации',
    vibeWeak: 'Слабая', vibeMed: 'Средняя', vibeStrong: 'Сильная',
    sound: 'Звук',
    volLo: 'Тихо', volHi: 'Громко', sizeLo: 'Меньше', sizeHi: 'Больше',
    timer: 'Таймер сна',
    timer15: '15 мин', timer30: '30 мин', timer60: '60 мин', timerOff: 'Нет',
    pulseSpeed: 'Скорость пульса',
    speedNormal: 'Обычная', speedSlow: 'Медленная', speedVerySlow: 'Ещё медленнее',
    pulseSize: 'Размер пульса',
    sandFade: 'Как тает песок',
    fadeFast: 'Быстро', fadeNormal: 'Обычно', fadeSlow: 'Медленно',
    soyogiLink: '🌿 Нужна поддержка? → Soyogi',
    credit: 'Разработано Soyogi',
    back: 'Назад',
  },
  zh: {
    appName: '非语言陪伴　Soyogi',
    firstHint: '轻轻地，碰一碰',
    goodNight: '晚安',
    settings: '⚙️ 设置',
    language: '语言',
    defaultMode: '启动模式',
    modeHeart: '🫀 心跳',
    modeSand: '🏜️ 沙',
    vibration: '振动',
    vibeStrength: '振动强度',
    vibeWeak: '轻', vibeMed: '中', vibeStrong: '强',
    sound: '声音',
    volLo: '小', volHi: '大', sizeLo: '小', sizeHi: '大',
    timer: '晚安定时器',
    timer15: '15分钟', timer30: '30分钟', timer60: '60分钟', timerOff: '无',
    pulseSpeed: '心跳快慢',
    speedNormal: '正常', speedSlow: '慢一些', speedVerySlow: '再慢一些',
    pulseSize: '心跳大小',
    sandFade: '沙的消散',
    fadeFast: '快些', fadeNormal: '正常', fadeSlow: '慢慢地',
    soyogiLink: '🌿 需要帮助时 → Soyogi',
    credit: '由 Soyogi 开发',
    back: '返回',
  },
};
function t(k) { return (I18N[settings.lang] || I18N.ja)[k] ?? I18N.ja[k] ?? ''; }
function isEn() { return settings.lang === 'en'; }

// そよぎ標準14言語のメタ（Flutter lib/i18n.dart の kLangs と同じ並び）。
// 言語ピッカーは I18N に翻訳が入っている言語だけを表示する（全14言語注入済み）。
// ar 選択時は dir='rtl' になる。
const LANGS = [
  { code: 'ja', name: '日本語', rtl: false },
  { code: 'en', name: 'English', rtl: false },
  { code: 'ar', name: 'العربية', rtl: true },
  { code: 'bn', name: 'বাংলা', rtl: false },
  { code: 'de', name: 'Deutsch', rtl: false },
  { code: 'es', name: 'Español', rtl: false },
  { code: 'fr', name: 'Français', rtl: false },
  { code: 'hi', name: 'हिन्दी', rtl: false },
  { code: 'id', name: 'Bahasa Indonesia', rtl: false },
  { code: 'it', name: 'Italiano', rtl: false },
  { code: 'ko', name: '한국어', rtl: false },
  { code: 'pt', name: 'Português', rtl: false },
  { code: 'ru', name: 'Русский', rtl: false },
  { code: 'zh', name: '中文', rtl: false },
];
function isRtl(code) { const l = LANGS.find((x) => x.code === code); return l ? l.rtl : false; }

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
// 心音に合わせた二段振動（トッ=S1 / 休 / トクン=S2）。
// web は navigator.vibrate に振幅制御が無いので、強さは「長さ」で表現する。
const VIBE_PATTERNS = {
  0: [40, 120, 60],   // よわい
  1: [60, 120, 90],   // ふつう
  2: [90, 120, 130],  // つよい
};
function vibrateHeartbeat() {
  if (!settings.vibration) return;
  if (!navigator.vibrate) return;
  navigator.vibrate(VIBE_PATTERNS[settings.vibrationStrength] || VIBE_PATTERNS[1]);
}

// ===== モード管理 =====
let currentMode = settings.defaultMode || 'heartbeat';

// ===== タイマー =====
let timerEndAt = null;
let timerInterval = null;
let timerExpired = false;
let armedMinutes = null;   // いまアーム中の長さ（設定変更の検知用）

function startTimerIfNeeded() {
  stopTimer();
  hideGoodNight();
  if (settings.timer == null) return;
  timerExpired = false;
  armedMinutes = settings.timer;
  timerEndAt = Date.now() + settings.timer * 60 * 1000;
  const el = $('timer-display');
  el.classList.add('active');
  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}
function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  timerEndAt = null;
  armedMinutes = null;
  $('timer-display').classList.remove('active');
}
function updateTimerDisplay() {
  if (timerEndAt == null) return;
  const remain = Math.max(0, Math.floor((timerEndAt - Date.now()) / 1000));
  const m = Math.floor(remain / 60);
  const s = remain % 60;
  $('timer-display').textContent = `${m}:${String(s).padStart(2, '0')}`;
  if (remain <= 0) {
    timerExpired = true;   // 鼓動を止めて「おやすみなさい」を表示（タップで再開）
    settings.timer = null; // 都度設定なので満了で選択も「なし」に戻す（Flutter版と同じ状態遷移）
    stopTimer();
    showGoodNight();
  }
}
function showGoodNight() { $('good-night').classList.add('show'); }
function hideGoodNight() { $('good-night').classList.remove('show'); }
// 「おやすみなさい」をタップ → 鼓動を再開（復帰不能だった問題の解消）
function wakeUpFromSleep() {
  timerExpired = false;
  hideGoodNight();
  heartPulseStart = performance.now();
  lastBeatX = 0;
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

  // 眠り中（おやすみタイマー終了）は鼓動を止める。good-night オーバーレイを表示中。
  // ただし設定プレビュー中は止めない。
  if (timerExpired && !settingsOpen) return;

  // 1拍 = period。x は1拍で 0→1 を進む（見た目は 0→1→0 の三角波で膨らんで縮む）
  const period = settings.pulseMillis();
  const x = ((performance.now() - heartPulseStart) % period) / period; // 0..1
  const tri = x < 0.5 ? x * 2 : (1 - x) * 2;
  // easeInOut
  const eased = tri < 0.5 ? 2 * tri * tri : 1 - Math.pow(-2 * tri + 2, 2) / 2;
  heartPulseValue = eased;
  // ピーク(x=0.5)を上向きに通過した瞬間に1拍 → 音と見た目を完全同期
  // 眠り中は鳴らさない（設定プレビュー中は鳴らす）。
  if (lastBeatX < 0.5 && x >= 0.5 && (!timerExpired || settingsOpen)) {
    if (!settingsOpen) vibrateHeartbeat(); // 設定プレビュー中は振動させない（音だけ）
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

  // 眠り中（おやすみタイマー終了）はタップで鼓動を再開
  if (timerExpired) { wakeUpFromSleep(); return; }

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
  // ar など RTL言語のときは全体を右→左に
  document.documentElement.dir = isRtl(settings.lang) ? 'rtl' : 'ltr';
  $('app-name').textContent = t('appName');
  $('first-hint').textContent = t('firstHint');
  $('good-night').textContent = t('goodNight');
  $('title-settings').textContent = t('settings');
  $('lbl-lang').textContent = t('language');
  $('lbl-default-mode').textContent = t('defaultMode');
  $('lbl-mode-heart').textContent = t('modeHeart');
  $('lbl-mode-sand').textContent = t('modeSand');
  $('lbl-vibration').textContent = t('vibration');
  $('lbl-vibe-strength').textContent = t('vibeStrength');
  $('chip-vibe-0').textContent = t('vibeWeak');
  $('chip-vibe-1').textContent = t('vibeMed');
  $('chip-vibe-2').textContent = t('vibeStrong');
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

// 言語ピッカーを（I18N に翻訳が入っている言語だけ）動的に描画する。
// 12言語を注入すると自動で選択肢が増え、ar 選択で dir='rtl' になる。
function renderLangChips() {
  const box = $('lang-chips');
  if (!box) return;
  box.innerHTML = '';
  for (const l of LANGS) {
    if (!I18N[l.code]) continue; // 翻訳が無い言語は出さない
    const b = document.createElement('button');
    b.className = 'chip' + (settings.lang === l.code ? ' selected' : '');
    b.dataset.lang = l.code;
    b.textContent = l.name;
    b.addEventListener('click', () => {
      settings.lang = l.code;
      applyI18n();
      renderLangChips();
      refreshSettingsUI();
    });
    box.appendChild(b);
  }
}

function refreshSettingsUI() {
  // language chips（翻訳が入っている言語だけを動的表示）
  renderLangChips();
  // default mode
  $('chip-mode-heartbeat').classList.toggle('selected', settings.defaultMode === 'heartbeat');
  $('chip-mode-sand').classList.toggle('selected', settings.defaultMode === 'sand');
  // vibration
  $('chk-vibration').checked = settings.vibration;
  // vibration strength（振動ONのときだけ表示）
  $('lbl-vibe-strength').style.display = settings.vibration ? '' : 'none';
  $('vibe-strength-row').style.display = settings.vibration ? '' : 'none';
  document.querySelectorAll('.chip[data-vibe]').forEach(c => {
    c.classList.toggle('selected', parseInt(c.dataset.vibe) === settings.vibrationStrength);
  });
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

let timerSelAtOpen = null;   // 設定を開いた時点のタイマー選択（変更検知用）
function openSettings() {
  $('settings-panel').classList.add('open');
  settingsOpen = true;
  timerSelAtOpen = settings.timer;
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
  // 🔴タイマー反映（都度設定）を一貫化。設定中に選択を**変更した時だけ**反映する:
  // ・「なし」に変更 → 停止。眠り中なら起こして通常に戻す（旧: おやすみ表示が残る不具合）
  // ・長さを変更 → 眠り中なら起こしてから新しい長さでアーム（旧: 稼働中の変更が無視される不具合）
  // ・無変更 → 何もしない＝稼働中は継続・眠り中は眠ったまま（旧: 勝手に再アーム＆起床する不具合。Flutter版と同挙動に）
  if (settings.timer !== timerSelAtOpen) {
    if (settings.timer == null) {
      stopTimer();
      if (timerExpired) wakeUpFromSleep();
    } else {
      if (timerExpired) wakeUpFromSleep();
      startTimerIfNeeded();
    }
  }
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

  // 言語：#lang-chips は renderLangChips() が動的生成し、各チップに click を仕込む
  // デフォルトモード
  document.querySelectorAll('.chip[data-mode]').forEach(c => c.addEventListener('click', () => {
    settings.defaultMode = c.dataset.mode;
    refreshSettingsUI();
  }));
  // 振動
  $('chk-vibration').addEventListener('change', (e) => {
    settings.vibration = e.target.checked;
    refreshSettingsUI(); // 振動の強さチップの表示/非表示を切替
    if (settings.vibration) vibrateHeartbeat(); // ONにしたら一度手応えを返す
  });
  // 振動の強さ
  document.querySelectorAll('.chip[data-vibe]').forEach(c => c.addEventListener('click', () => {
    settings.vibrationStrength = parseInt(c.dataset.vibe);
    refreshSettingsUI();
    vibrateHeartbeat(); // 選んだ強さを一度体感
  }));
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
  // 旧仕様で永続化されていたタイマー値は起動時は無視（掃除）。都度設定なので毎起動は「なし」。
  localStorage.removeItem(KEYS.timer);
  resizeCanvas();
  bindEvents();
  applyI18n();
  renderLangChips();
  setMode(settings.defaultMode);
  startTimerIfNeeded();
  if (!settings.firstLaunch) {
    $('first-hint').style.display = 'none';
  }
  requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', init);
