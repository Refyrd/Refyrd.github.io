// === COOKIES ===
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days || 365) * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/';
}
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

// === ЛОКАЛИЗАЦИЯ ===
const i18n = {
    en: { scoreTitle: "SCORE", mainTitle: "SNAKE", bestScore: "Best score: ", lastScore: "Last score: ", placeholder: "Your nickname", playBtn: "Play", gameOverTitle: "Game Over", finalScoreText: "Score: ", restartBtn: "Restart", menuBtn: "Menu", lbTitle: "LEADERBOARD", devTitle: "DEV", devConfetti: "Confetti", devGlow: "Glow", devAddScore: "+10 Score", devFill: "Fill Snake", devClose: "Close", lbNoScores: "No scores yet", lbLoading: "Loading...", lbOffline: "Offline", lbShowAll: "Show all", lbShowTop: "Show top 10" },
    ru: { scoreTitle: "СЧЕТ", mainTitle: "ЗМЕЙКА", bestScore: "Лучший счет: ", lastScore: "Последний счет: ", placeholder: "Твой никнейм", playBtn: "Играть", gameOverTitle: "Конец игры", finalScoreText: "Счет: ", restartBtn: "Начать заново", menuBtn: "В меню", lbTitle: "ТАБЛИЦА", devTitle: "ДЕВ", devConfetti: "Конфетти", devGlow: "Свечение", devAddScore: "+10 очков", devFill: "Длинная змейка", devClose: "Закрыть", lbNoScores: "Пока нет результатов", lbLoading: "Загрузка...", lbOffline: "Офлайн", lbShowAll: "Все", lbShowTop: "Топ 10" }
};

let currentLang = 'en';

// === NICKNAME FILTERS ===
const zalgoRegex = /[\u0300-\u036f\u0483-\u0489\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7-\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u0901-\u0903\u093c\u093e-\u094d\u0951-\u0954\u0962-\u0963\u0981-\u0983\u09bc\u09be-\u09cc\u09d7\u09e2-\u09e3\u0a01-\u0a03\u0abc\u0abe-\u0acc\u0b01-\u0b03\u0b3c\u0b3e-\u0b4c\u0b56-\u0b57\u0b82\u0bbe-\u0bcc\u0bd7\u0c01-\u0c03\u0c3e-\u0c4c\u0c55-\u0c56\u0c82-\u0c83\u0cbc\u0cbe-\u0ccc\u0cd5-\u0cd6\u0d02-\u0d03\u0d3e-\u0d4c\u0d57\u0d82-\u0d83\u0dca\u0dcf-\u0ddf\u0df2-\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb-\u0ebc\u0ec8-\u0ecd\u0f18-\u0f19\u0f35\u0f37\u0f39\u0f3e-\u0f3f\u0f71-\u0f84\u0f86-\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1056-\u1059\u1100-\u1159\u115f-\u11a2\u11a8-\u11f9\u1dc0-\u1dcf\u1dfe-\u1dff\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\ua66f\ua67c-\ua67d\ua6f0-\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880-\ua881\ua8b4-\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa7b\uaab0\uaab2-\uaab4\uaab5-\uaab6\uaab9-\uaabd\uaac1\uabe3-\uabea\uabec\uabed\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e-\uff9f]/g;
const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu;
const badSymbolsRegex = /[^\w\sа-яА-ЯёЁa-zA-Z0-9_.\-]/g;

const profanityRu = [
    'хуй', 'хуя', 'хуе', 'хую', 'хуи', 'хуё', 'пизд', 'пиzd', 'пиzdа', 'нахуй', 'нахуя', 'похуй',
    'бляд', 'бля', 'блять', 'блят', 'ебал', 'ебат', 'ебет', 'ебут', 'ебаш', 'ёб',
    'ебан', 'ебаш', 'заеб', 'наеб', 'объеб', 'выеб', 'выеб', 'доеб', 'отъеб',
    'пиздец', 'пизда', 'пизды', 'пизду', 'пiзд', 'пиздa',
    'гандон', 'гондон', 'мудак', 'муда', 'мyдак',
    'сучка', 'сука', 'сyка',
    'долбоеб', 'долбоёб', 'долбаеб',
    'хуесос', 'хуила', 'хуило',
    'залупа', 'залуп', 'шлюха', 'шлюх',
    'манда', 'мандa', 'мандов',
    'пидор', 'пидар', 'пидр', 'петух', 'петуша',
    'разъеб', 'разьеб', 'раzzеб',
    'уебищ', 'уёбищ',
    'хер', 'хера', 'хрен', 'хрена',
    'член', 'члена',
    'сперма', 'сперм',
    'гей', 'геи', 'геев',
    'трахал', 'трахат', 'трахну',
    'выебон', 'выеб',
    'охуе', 'охуи', 'охуен',
    'ахуе', 'ахуи', 'ахуен',
    'приеб', 'приєб',
    'срать', 'сру', 'срет', 'срал',
    'говно', 'гавно', 'говн',
    'какать', 'какаш',
    'ссать', 'ссыт', 'ссал',
    'моча', 'мочой', 'мочи',
    'ссанина', 'говнина',
    'пися', 'письк', 'писюн',
    'кант', 'канта',
    'клон', 'фейк',
    'смерть', 'убить', 'убива',
    'бомж', 'бомжи',
    'алкаш', 'алкогол',
    'нарком', 'наркот',
    'даун', 'дауны',
    'дебил', 'дeбил',
    'идиот', 'идиот',
    'лох', 'лоха', 'лоху', 'лохи',
    'глуп', 'туп', 'тупо',
    'жирн', 'толст',
    'урод', 'уроды',
    'соси', 'сосат', 'сосет', 'сосут',
    'отсос', 'минета', 'минет',
    'вагин', 'влагалищ',
    'мошонк', 'яичк',
    'член', 'члена',
    'анальн', 'анус',
    'оральн', 'ротов',
    'порно', 'порнух',
    'секс', 'сексу',
    'извращ', 'извращен',
    'зоофил', 'некрофил',
    'педофил', 'пeдофил',
    'проститутк', 'шалав',
    'шмара', 'шмар',
    'дрочит', 'дроч', 'дрочит',
    'мастурб',
    'конча', 'кончи',
    'военный', 'военн',
    'путин', 'путина', 'путину',
    'зеленск', 'зелен',
    'нацист', 'наци',
    'свастик', 'свасти',
    'зиг', 'зигу',
    'расист', 'расизм',
    'фашист', 'фашизм',
    'жид', 'жиды', 'жидов',
    'хач', 'хачи', 'хачей',
    'черн', 'черный', 'чернож',
    'нигер', 'нигг',
    'nигер', 'nигг',
    'лошад', 'козел', 'козл',
    'осел', 'осл',
    'баран', 'бараны',
    'свинья', 'свин',
    'собака', 'собак',
    'крыса', 'крыс',
    'обезьян', 'обезья',
    'коров', 'быдло',
    'чмо', 'чма',
    'редиск', 'редис',
    'тыква', 'тыкв',
    'сиськ', 'сися', 'сись',
    'попк', 'попа', 'попка',
    'грудь', 'груди', 'гpyдь',
    'norn', 'porn',
    'fuck', 'shit', 'fck',
];

const profanityEn = [
    'fuck', 'fck', 'fuk', 'fuk', 'shit', 'sh1t', 'sh!t',
    'asshole', 'asshol', 'ashole', 'ashol',
    'bastard', 'bastrd',
    'bitch', 'b1tch', 'biatch', 'btch',
    'cunt', 'cnt',
    'dick', 'd1ck', 'dck',
    'motherfucker', 'motherfuck', 'mothafuck', 'mf',
    'nigga', 'nigger', 'n1gga', 'n1gger', 'nigg',
    'pussy', 'pusy', 'puss',
    'slut', 'slut',
    'whore', 'hor', 'hoar',
    'damn', 'dmn',
    'douche', 'douch',
    'prick', 'prck',
    'cock', 'c0ck',
    'sucker', 'suckr',
    'wanker', 'wank',
    'twat', 'tw4t',
    'fag', 'f4g', 'faggot', 'fagot',
    'retard', 'retrd', 'r3tard',
    'moron', 'm0ron',
    'idiot', '1diot',
    'stupid', 'stpd',
    'loser', 'losr',
    'crap', 'cr4p',
    'bullshit', 'bullsh1t',
    'goddamn', 'goddmn',
    'holy', 'holyshit',
    'sex', 's3x',
    'porn', 'p0rn', 'porn',
    'anal', '4nal',
    'blowjob', 'bl0wjob', 'bj',
    'cum', 'c0m',
    'cock', 'c0ck',
    'dildo', 'd1ldo',
    'erect',
    'facial', 'fac1al',
    'handjob',
    'horny', 'h0rny',
    'incest',
    'masturbat', 'mastrubat',
    'naked', 'nak3d',
    'nude', 'n00d',
    'orgasm', '0rgasm',
    'penis', 'pen1s', 'p3nis',
    'tits', 't1ts', 'tts',
    'vagina', 'vagin',
    'boob', 'b00b',
    'ass', '4ss',
    'hitler', 'h1tler',
    'nazi', 'n4zi',
    'fascist',
    'racist', 'rac1st',
    'kkk', 'kluklux',
    'swastika',
    'terrorist',
    'bomb', 'b0mb',
    'kill', 'k1ll',
    'murder', 'murdr',
    'suicide',
    'hate', 'h4te',
];

const profanityAll = [...profanityRu, ...profanityEn];

function containsProfanity(text) {
    const lower = text.toLowerCase();
    for (const word of profanityAll) {
        if (lower.includes(word)) return true;
    }
    return false;
}

function sanitizeName(raw) {
    let val = raw.replace(zalgoRegex, '');
    val = val.replace(emojiRegex, '');
    val = val.replace(badSymbolsRegex, '');
    val = val.replace(/\s/g, '');
    return val;
}

function isValidName(val) {
    if (!val || val.length < 2) return false;
    if (val.length > 16) return false;
    if (containsProfanity(val)) return false;
    return true;
}
const cookieLang = getCookie('snakeLang');
if (cookieLang === 'ru' || cookieLang === 'en') {
    currentLang = cookieLang;
} else {
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang && browserLang.toLowerCase().startsWith('ru')) currentLang = 'ru';
    setCookie('snakeLang', currentLang);
}

const langToggle = document.getElementById('langToggle');

function applyLanguage() {
    document.documentElement.lang = currentLang;
    langToggle.innerText = currentLang.toUpperCase();
    
    document.getElementById('uiScoreTitle').innerText = i18n[currentLang].scoreTitle;
    document.getElementById('uiMainTitle').innerText = i18n[currentLang].mainTitle;
    document.getElementById('playerNameInput').placeholder = i18n[currentLang].placeholder;
    document.getElementById('uiPlayBtn').innerText = i18n[currentLang].playBtn;
    document.getElementById('uiGameOverTitle').innerText = i18n[currentLang].gameOverTitle;
    document.getElementById('uiFinalScoreText').innerText = i18n[currentLang].finalScoreText;
    document.getElementById('uiRestartBtn').innerText = i18n[currentLang].restartBtn;
    document.getElementById('uiMenuBtn').innerText = i18n[currentLang].menuBtn;
    
    document.querySelector('.leaderboard h3').innerText = i18n[currentLang].lbTitle;
    document.getElementById('uiDevTitle').innerText = i18n[currentLang].devTitle;
    document.getElementById('uiDevConfetti').innerText = i18n[currentLang].devConfetti;
    document.getElementById('uiDevGlow').innerText = i18n[currentLang].devGlow;
    document.getElementById('uiDevAddScore').innerText = i18n[currentLang].devAddScore;
    document.getElementById('uiDevFill').innerText = i18n[currentLang].devFill;
    document.getElementById('uiDevClose').innerText = i18n[currentLang].devClose;
    if (playerNameInput.disabled) {
        playerNameInput.placeholder = currentLang === 'en' ? 'DEV MODE' : 'ДЕВ РЕЖИМ';
    }
    
    const lbLoading = document.getElementById('lbLoadingText');
    if (lbLoading) lbLoading.innerText = i18n[currentLang].lbLoading;
    lbShowMore.innerText = lbShowAll ? i18n[currentLang].lbShowTop : i18n[currentLang].lbShowAll;
    
    updateHighScoreDisplay();
}

langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'ru' ? 'en' : 'ru';
    setCookie('snakeLang', currentLang);
    applyLanguage();
});


// === ТЕМА И СИСТЕМНЫЙ ЦВЕТ ===
const body = document.body;
const themeToggle = document.getElementById('themeToggle');
let isDark = true;
const cookieTheme = getCookie('snakeTheme');
if (cookieTheme === 'dark' || cookieTheme === 'light') {
    isDark = cookieTheme === 'dark';
} else {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    if (prefersLight) isDark = false;
    setCookie('snakeTheme', isDark ? 'dark' : 'light');
}

function getResolvedColor(cssVarName) {
    const temp = document.createElement('div');
    temp.style.color = cssVarName;
    document.body.appendChild(temp);
    const color = getComputedStyle(temp).color;
    temp.remove();
    return color;
}

function applyTheme() {
    body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.innerText = isDark ? '☀️' : '🌙';
}
applyTheme();

themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    setCookie('snakeTheme', isDark ? 'dark' : 'light');
    applyTheme();
});

// === ВЫБОР ЦВЕТА И РАЗМЕРА ===
const colorBtns = document.querySelectorAll('.color-btn');
const savedColor = getCookie('snakeColor') || 'green';
colorBtns.forEach(btn => {
    if (btn.getAttribute('data-c') === savedColor) {
        colorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        body.setAttribute('data-color', savedColor);
    }
    btn.addEventListener('click', () => {
        colorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const c = btn.getAttribute('data-c');
        body.setAttribute('data-color', c);
        setCookie('snakeColor', c);
    });
});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let tileCount = 20;
let gridSize = 20;
const sizeBtns = document.querySelectorAll('.size-btn');

let lastCanvasW = 0, lastCanvasH = 0;
function syncCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (w !== lastCanvasW || h !== lastCanvasH) {
        canvas.width = w;
        canvas.height = h;
        lastCanvasW = w;
        lastCanvasH = h;
        const side = Math.min(canvas.width, canvas.height);
        gridSize = side / tileCount;
    }
}

sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        sizeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tileCount = parseInt(btn.getAttribute('data-size'));
        gridSize = canvas.width / tileCount;
    });
});

// === FIREBASE LEADERBOARD ===
const firebaseConfig = {
    apiKey: "AIzaSyBj5Nxq05fVgiTiNJNM17R6xrRjBmB7qDI",
    authDomain: "refyrdsite.firebaseapp.com",
    projectId: "refyrdsite",
    storageBucket: "refyrdsite.firebasestorage.app",
    messagingSenderId: "37852850018",
    appId: "1:37852850018:web:56cc3448489f4b9699ee3b"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const LEADERBOARD_COLLECTION = 'leaderboard';

let authUid = null;
let authUser = null;
let skipAnonSignIn = false;

// === AUTH UI ===
const authOverlay = document.getElementById('authOverlay');
const authClose = document.getElementById('authClose');
const authBtn = document.getElementById('authBtn');
const authTabs = document.querySelectorAll('.auth-tab');
const authLogin = document.getElementById('authLogin');
const authRegister = document.getElementById('authRegister');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const regEmail = document.getElementById('regEmail');
const regPassword = document.getElementById('regPassword');
const authEmailBtn = document.getElementById('authEmailBtn');
const authRegisterBtn = document.getElementById('authRegisterBtn');
const authGoogle = document.getElementById('authGoogle');
const authGithub = document.getElementById('authGithub');
const authStatus = document.getElementById('authStatus');
const authSignOutBtn = document.getElementById('authSignOutBtn');
const authInfo = document.getElementById('authInfo');
const authInfoEmail = document.getElementById('authInfoEmail');

function showAuthStatus(msg, isError) {
    authStatus.textContent = msg;
    authStatus.style.color = isError ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)';
}
function clearAuthStatus() { authStatus.textContent = ''; }

authBtn.addEventListener('click', () => {
    authOverlay.classList.add('active');
    updateAuthUI();
});

authClose.addEventListener('click', () => authOverlay.classList.remove('active'));
authOverlay.addEventListener('click', e => { if (e.target === authOverlay) authOverlay.classList.remove('active'); });

authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isLogin = tab.dataset.tab === 'login';
        authLogin.style.display = isLogin ? 'flex' : 'none';
        authRegister.style.display = isLogin ? 'none' : 'flex';
        clearAuthStatus();
    });
});
authLogin.style.display = 'flex';
authRegister.style.display = 'none';

function updateAuthUI() {
    if (authUser && !authUser.isAnonymous) {
        authBtn.textContent = '✓';
        authBtn.style.color = 'var(--md-sys-color-primary)';
        authInfoEmail.textContent = authUser.email || authUser.displayName || 'Logged in';
        authSignOutBtn.style.display = 'block';
        authLogin.style.display = 'none';
        authRegister.style.display = 'none';
        document.querySelectorAll('.auth-tab').forEach(t => t.style.display = 'none');
        document.querySelector('.auth-divider').style.display = 'none';
        document.querySelectorAll('.auth-social-btn:not(#authSignOutBtn)').forEach(b => b.style.display = 'none');
        document.querySelector('.auth-title').textContent = authUser.email || 'Account';
    } else {
        authBtn.textContent = '👤';
        authBtn.style.color = '';
        authSignOutBtn.style.display = 'none';
        document.querySelectorAll('.auth-tab').forEach(t => t.style.display = '');
        document.querySelector('.auth-divider').style.display = '';
        document.querySelectorAll('.auth-social-btn:not(#authSignOutBtn)').forEach(b => b.style.display = '');
        document.querySelector('.auth-title').textContent = currentLang === 'en' ? 'Sign In' : 'Войти';
    }
}

authSignOutBtn.addEventListener('click', () => {
    auth.signOut();
    authOverlay.classList.remove('active');
});

// Helper: sign out anonymous, perform action, then write pending scores
function upgradeFromAnonymous(action) {
    if (authUser && authUser.isAnonymous) {
        const s = score;
        skipAnonSignIn = true;
        return auth.signOut().then(() => action()).then(result => {
            skipAnonSignIn = false;
            const u = auth.currentUser;
            if (u && !u.isAnonymous) {
                if (s > 0) {
                    db.collection(LEADERBOARD_COLLECTION).doc(u.uid).set({
                        name: savedName && isValidName(savedName) ? savedName : 'Anonymous',
                        score: s
                    }, { merge: true });
                }
            }
            return result;
        }).catch(e => {
            skipAnonSignIn = false;
            auth.signInAnonymously().catch(() => {});
            throw e;
        });
    }
    return action();
}

// Email + Password Login
authEmailBtn.addEventListener('click', () => {
    const email = authEmail.value.trim();
    const pass = authPassword.value;
    if (!email || !pass) { showAuthStatus('Fill in all fields', true); return; }
    showAuthStatus('Signing in...', false);
    upgradeFromAnonymous(() => auth.signInWithEmailAndPassword(email, pass))
        .then(() => { authOverlay.classList.remove('active'); clearAuthStatus(); })
        .catch(e => showAuthStatus(e.message, true));
});

// Email + Password Register
authRegisterBtn.addEventListener('click', () => {
    const email = regEmail.value.trim();
    const pass = regPassword.value;
    if (!email || !pass) { showAuthStatus('Fill in all fields', true); return; }
    if (pass.length < 6) { showAuthStatus('Password must be at least 6 characters', true); return; }
    showAuthStatus('Creating account...', false);
    upgradeFromAnonymous(() => auth.createUserWithEmailAndPassword(email, pass))
        .then(() => { authOverlay.classList.remove('active'); clearAuthStatus(); })
        .catch(e => showAuthStatus(e.message, true));
});

// Google Auth
authGoogle.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    showAuthStatus('Signing in...', false);
    upgradeFromAnonymous(() => auth.signInWithPopup(provider))
        .then(() => { authOverlay.classList.remove('active'); clearAuthStatus(); })
        .catch(e => {
            if (e.code === 'auth/account-exists-with-different-credential') {
                showAuthStatus('An account with this email already exists. Sign in with your password.', true);
            } else {
                showAuthStatus(e.message, true);
            }
        });
});

// GitHub Auth
authGithub.addEventListener('click', () => {
    const provider = new firebase.auth.GithubAuthProvider();
    showAuthStatus('Signing in...', false);
    upgradeFromAnonymous(() => auth.signInWithPopup(provider))
        .then(() => { authOverlay.classList.remove('active'); clearAuthStatus(); })
        .catch(e => showAuthStatus(e.message, true));
});

// Auth state
auth.onAuthStateChanged(user => {
    if (user) {
        authUser = user;
        authUid = user.uid;
        loadLeaderboard();
    } else {
        authUser = null;
        authUid = null;
        if (!skipAnonSignIn) {
            auth.signInAnonymously().catch(() => {});
        }
    }
    updateAuthUI();
});

const leaderboardList = document.getElementById('leaderboardList');
const lbStatus = document.getElementById('lbStatus');

let lbConnectionState = 'connecting';

function setLbStatus(state, msg) {
    lbConnectionState = state;
    const dotClass = state === 'online' ? 'online' : state === 'connecting' ? 'connecting' : state === 'error' ? 'error' : 'offline';
    lbStatus.innerHTML = `<span class="dot ${dotClass}"></span><span>${escapeHtml(msg)}</span>`;
}

let lastScoreSaveTime = 0;
async function saveScoreToLeaderboard() {
    if (score <= 0 || !authUid) return;
    const maxPossible = tileCount * tileCount;
    if (score > maxPossible || score > 50000) return;
    const now = Date.now();
    if (now - lastScoreSaveTime < 2000) return;
    lastScoreSaveTime = now;
    const displayName = savedName && savedName !== 'Refyrd.dev' ? savedName : (currentLang === 'en' ? 'Anonymous' : 'Аноним');
    try {
        const docRef = db.collection(LEADERBOARD_COLLECTION).doc(authUid);
        const existing = await docRef.get();

        if (existing.exists) {
            const existingScore = existing.data().score || 0;
            if (score <= existingScore) {
                loadLeaderboard();
                return;
            }
        }

        await docRef.set({
            name: displayName,
            score: score
        });
    } catch (e) {
        console.warn('Firebase save error:', e);
    }
    loadLeaderboard();
}

async function loadLeaderboard() {
    try {
        const snapshot = await db.collection(LEADERBOARD_COLLECTION)
            .orderBy('score', 'desc')
            .limit(lbLimit)
            .get();
        setLbStatus('online', 'Online');
        if (snapshot.empty) {
            leaderboardList.innerHTML = `<div class="lb-empty">${i18n[currentLang].lbNoScores}</div>`;
            return;
        }
        let html = '';
        let rank = 1;
        snapshot.forEach(doc => {
            const d = doc.data();
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
            html += `<div class="lb-entry">
                <span class="lb-rank">${medal || rank}</span>
                <span class="lb-name">${escapeHtml(d.name && d.name.trim() ? d.name : (currentLang === 'en' ? 'Anonymous' : 'Аноним'))}</span>
                <span class="lb-score">${d.score || 0}</span>
            </div>`;
            rank++;
        });
        leaderboardList.innerHTML = html;
    } catch (e) {
        console.warn('Firebase load error:', e);
        setLbStatus('error', `Error: ${e.message}`);
        leaderboardList.innerHTML = `<div class="lb-empty">${i18n[currentLang].lbOffline}</div>`;
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

let lbLimit = 10;
let lbShowAll = false;
const lbShowMore = document.getElementById('lbShowMore');
lbShowMore.addEventListener('click', () => {
    lbShowAll = !lbShowAll;
    lbLimit = lbShowAll ? 1000 : 10;
    lbShowMore.innerText = lbShowAll ? i18n[currentLang].lbShowTop : i18n[currentLang].lbShowAll;
    leaderboardList.innerHTML = `<div class="lb-loading">${i18n[currentLang].lbLoading}</div>`;
    loadLeaderboard();
});

setInterval(() => { if (authUid) loadLeaderboard(); }, 5000);

setInterval(() => {
    if (isRunning && authUid && score > 0) saveScoreToLeaderboard();
}, 3000);

const confettiCanvas = document.getElementById('confettiCanvas');
const cCtx = confettiCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startMenu = document.getElementById('startMenu');
const gameOverScreen = document.getElementById('gameOverScreen');
const menuHighScoreText = document.getElementById('menuHighScoreText');
const menuLastScoreText = document.getElementById('menuLastScoreText');
const playerNameInput = document.getElementById('playerNameInput');

const initialSpeed = 150; 

let snake = [];
let food = {};
let dx = 0, dy = 0;
let committedDx = 0, committedDy = -1;
let score = 0;

let bestScore = localStorage.getItem('snakeHighScore') || 0;
let lastScore = localStorage.getItem('snakeLastScore') || 0; 
let savedName = getCookie('snakeNick') || '';
let lastNickChange = 0;
playerNameInput.value = savedName;

let currentSpeed = initialSpeed;
let isRunning = false;
let lastTickTime = 0;
let inputQueue = [];
let particles = [];

let glows = []; 

function updateHighScoreDisplay() {
    const displayName = savedName && savedName.trim() ? savedName : (currentLang === 'en' ? 'Anonymous' : 'Аноним');
    const nameDisplay = ` (${displayName})`;
    menuHighScoreText.innerText = `${i18n[currentLang].bestScore}${bestScore}${nameDisplay}`;
    if (lastScore > 0) {
        menuLastScoreText.style.display = 'block';
        menuLastScoreText.innerText = `${i18n[currentLang].lastScore}${lastScore}`;
    } else {
        menuLastScoreText.style.display = 'none';
    }
}

applyLanguage();

function resizeConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeConfetti);
resizeConfetti();

setInterval(() => {
    if (isRunning) advanceLogic(performance.now());
}, 50);

function showMenu() {
    gameOverScreen.classList.remove('active');
    devMenu.classList.remove('active');
    playerNameInput.disabled = false;
    playerNameInput.placeholder = i18n[currentLang].placeholder;
    startMenu.classList.add('active');
    isRunning = false;
    updateHighScoreDisplay();
    resetGameState();
    document.body.classList.remove('gameplay');
}

function startGame() {
    const now = Date.now();
    const raw = sanitizeName(playerNameInput.value);
    playerNameInput.value = raw;
    if (raw && raw.toLowerCase() !== 'refyrd.dev') {
        if (raw !== savedName && now - lastNickChange < 3000) return;
        savedName = isValidName(raw) ? raw : '';
        if (savedName) setCookie('snakeNick', savedName);
        if (raw) lastNickChange = now;
    }
    
    startMenu.classList.remove('active');
    gameOverScreen.classList.remove('active');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    
    resetGameState();
    syncCanvasSize();
    placeFood();
    isRunning = true;
    lastTickTime = performance.now();
    document.body.classList.add('gameplay');
}

// === МЕНЮ РАЗРАБОТЧИКА ===
const devMenu = document.getElementById('devMenu');

playerNameInput.addEventListener('input', () => {
    playerNameInput.value = sanitizeName(playerNameInput.value);
    if (playerNameInput.value.toLowerCase() === 'refyrd.dev') {
        devMenu.classList.add('active');
        playerNameInput.disabled = true;
        savedName = '';
        playerNameInput.value = '';
        playerNameInput.placeholder = currentLang === 'en' ? 'DEV MODE' : 'ДЕВ РЕЖИМ';
    }
});

function closeDevMenu() {
    devMenu.classList.remove('active');
    playerNameInput.disabled = false;
    playerNameInput.placeholder = i18n[currentLang].placeholder;
    playerNameInput.value = savedName || '';
}

function devGlow() {
    glows = [{ pos: 0 }];
}

function devAddScore() {
    score += 10;
    scoreElement.innerText = score;
    triggerConfetti();
}

function devFillSnake() {
    score += 10;
    scoreElement.innerText = score;
    if (score % 10 === 0) triggerConfetti();
    const tail = snake[snake.length - 1];
    for (let i = 0; i < 10; i++) {
        snake.push({ x: tail.x, y: tail.y, rx: tail.x, ry: tail.y });
    }
}

function resetGameState() {
    syncCanvasSize();
    const center = Math.floor(tileCount / 2);
    snake = [
        { x: center, y: center, rx: center, ry: center },
        { x: center, y: center + 1, rx: center, ry: center + 1 },
        { x: center, y: center + 2, rx: center, ry: center + 2 }
    ];
    dx = 0; dy = -1;
    committedDx = 0; committedDy = -1;
    score = 0;
    currentSpeed = initialSpeed;
    glows = [];
    scoreElement.innerText = score;
}

function advanceLogic(now) {
    if (!isRunning) return;
    let guard = 0;
    while (now - lastTickTime >= currentSpeed && guard < 2000) {
        updateLogic();
        lastTickTime += currentSpeed;
        guard++;
        if (!isRunning) break;
    }
}

function animationLoop(timestamp) {
    syncCanvasSize();

    if (isRunning) {
        advanceLogic(timestamp);
        
        glows.forEach(g => g.pos += 0.12);
        glows = glows.filter(g => g.pos < snake.length + 4);
    }

    for (let s of snake) {
        s.rx += (s.x - s.rx) * 0.6;
        s.ry += (s.y - s.ry) * 0.6;
    }
    
    drawGame();
    updateConfetti();
    requestAnimationFrame(animationLoop);
}

function updateLogic() {
    if (inputQueue.length > 0) {
        const next = inputQueue.shift();
        dx = next.dx;
        dy = next.dy;
    }
    const head = { x: snake[0].x + dx, y: snake[0].y + dy, rx: snake[0].x, ry: snake[0].y };
    const ate = head.x === food.x && head.y === food.y;

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || checkSelfCollision(head, ate)) {
        handleGameOver();
        return;
    }

    snake.unshift(head);

    if (ate) {
        score++;
        scoreElement.innerText = score;
        if (score > 0 && score % 10 === 0) triggerConfetti();
        
        glows = [{ pos: 0 }];
        placeFood();
    } else {
        snake.pop();
    }

    committedDx = dx;
    committedDy = dy;
}

function checkSelfCollision(head, ate) {
    const len = ate ? snake.length : snake.length - 1;
    for (let i = 0; i < len; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return true;
    }
    return false;
}

function drawGrid() {
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvas.width; i += gridSize) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }
}

function toRGBA(color, alpha) {
    tempColorCtx.fillStyle = color;
    const computed = tempColorCtx.fillStyle;
    if (computed.startsWith('#')) {
        let hex = computed.slice(1);
        if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
        const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
        return `rgba(${r},${g},${b},${alpha})`;
    }
    const m = computed.match(/rgba?\(([^)]+)\)/);
    if (m) {
        const parts = m[1].split(',').map(s => parseFloat(s));
        return `rgba(${parts[0]},${parts[1]},${parts[2]},${alpha})`;
    }
    return color;
}

function lightenColor(color, amount) {
    if (color.startsWith('#')) {
        let hex = color.slice(1);
        if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
        if (hex.length === 6) {
            const r = Math.min(255, parseInt(hex.slice(0,2),16) + Math.round(amount * 255));
            const g = Math.min(255, parseInt(hex.slice(2,4),16) + Math.round(amount * 255));
            const b = Math.min(255, parseInt(hex.slice(4,6),16) + Math.round(amount * 255));
            return `rgb(${r},${g},${b})`;
        }
    }
    const m = color.match(/(\d+)/g);
    if (!m || m.length < 3) return color;
    const r = Math.min(255, parseInt(m[0]) + Math.round(amount * 255));
    const g = Math.min(255, parseInt(m[1]) + Math.round(amount * 255));
    const b = Math.min(255, parseInt(m[2]) + Math.round(amount * 255));
    return `rgb(${r},${g},${b})`;
}

const tempColorCanvas = document.createElement('canvas');
const tempColorCtx = tempColorCanvas.getContext('2d');

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(); 
    
    const style = getComputedStyle(document.body);
    let rawPrimary = style.getPropertyValue('--md-sys-color-primary').trim();
    if (rawPrimary === '') {
        rawPrimary = getResolvedColor('var(--md-sys-color-primary)');
    }

    const errorColor = style.getPropertyValue('--md-sys-color-error').trim();

    if (food.x !== undefined) {
        const pulse = 1 + Math.sin(performance.now() / 300) * 0.06;
        const foodSize = gridSize * 0.80 * pulse; 
        ctx.fillStyle = errorColor;
        ctx.beginPath();
        ctx.arc(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, foodSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    const total = snake.length;
    for (let i = snake.length - 1; i >= 0; i--) {
        const segment = snake[i];
        const t = total > 1 ? i / (total - 1) : 0;
        const sizeFactor = 0.85 - t * 0.40;
        const size = gridSize * sizeFactor;
        const padding = (gridSize - size) / 2;
        
        const cx = segment.rx * gridSize + gridSize / 2;
        const cy = segment.ry * gridSize + gridSize / 2;
        
        let maxGlowIntensity = 0;
        for (let g of glows) {
            let dist = Math.abs(g.pos - i);
            if (dist < 3.5) {
                let intensity = 1 - (dist / 3.5);
                if (intensity > maxGlowIntensity) maxGlowIntensity = intensity;
            }
        }
        
        if (maxGlowIntensity > 0) {
            const glowR = size * 0.95;
            const grad = ctx.createRadialGradient(cx, cy, size * 0.3, cx, cy, glowR);
            grad.addColorStop(0, toRGBA(rawPrimary, 0.6 * maxGlowIntensity));
            grad.addColorStop(0.5, toRGBA(rawPrimary, 0.25 * maxGlowIntensity));
            grad.addColorStop(1, toRGBA(rawPrimary, 0));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = i === 0 ? lightenColor(rawPrimary, 0.05) : rawPrimary;
        ctx.beginPath();
        const radius = size * (i === 0 ? 0.40 : 0.30);
        ctx.roundRect(cx - size / 2, cy - size / 2, size, size, radius);
        ctx.fill();
    }
}

function placeFood() {
    food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) { placeFood(); break; }
    }
}

function handleGameOver() {
    isRunning = false;
    
    lastScore = score;
    localStorage.setItem('snakeLastScore', lastScore);

    if (score > bestScore) { 
        localStorage.setItem('snakeHighScore', score); 
        bestScore = score; 
    }
    document.getElementById('finalScore').innerText = score;
    gameOverScreen.classList.add('active');
    saveScoreToLeaderboard();
    document.body.classList.remove('gameplay');
}

function changeDirection(newDx, newDy) {
    if (inputQueue.length >= 4) return;
    const last = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : { dx, dy };
    const valid = (newDx === 1 && last.dx !== -1) || (newDx === -1 && last.dx !== 1) ||
                  (newDy === -1 && last.dy !== 1) || (newDy === 1 && last.dy !== -1);
    if (!valid) return;
    inputQueue.push({ dx: newDx, dy: newDy });
}

document.addEventListener('keydown', (e) => {
    if (document.activeElement === playerNameInput) {
        if (e.key === 'Enter') startGame();
        return;
    }
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight", " "].indexOf(e.code) > -1) e.preventDefault();
    switch(e.key) {
        case 'ArrowLeft': case 'a': case 'A': case 'ф': case 'Ф': changeDirection(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': case 'в': case 'В': changeDirection(1, 0); break;
        case 'ArrowUp': case 'w': case 'W': case 'ц': case 'Ц': changeDirection(0, -1); break;
        case 'ArrowDown': case 's': case 'S': case 'ы': case 'Ы': changeDirection(0, 1); break;
    }
});

// === TOUCH ===
const gameContainer = document.getElementById('gameContainer');
let touchStartX = 0;
let touchStartY = 0;

gameContainer.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

gameContainer.addEventListener('touchmove', e => {
    if (isRunning) e.preventDefault();
}, { passive: false });

gameContainer.addEventListener('touchend', e => {
    if (!isRunning) return;
    
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    
    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;
    
    if (Math.max(Math.abs(diffX), Math.abs(diffY)) < 30) return;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) changeDirection(1, 0); 
        else changeDirection(-1, 0); 
    } else {
        if (diffY > 0) changeDirection(0, 1); 
        else changeDirection(0, -1);
    }
}, { passive: true });

// === BUTTON EVENTS ===
document.getElementById('uiPlayBtn').addEventListener('click', startGame);
document.getElementById('uiRestartBtn').addEventListener('click', startGame);
document.getElementById('uiMenuBtn').addEventListener('click', showMenu);
document.getElementById('uiDevConfetti').addEventListener('click', triggerConfetti);
document.getElementById('uiDevGlow').addEventListener('click', devGlow);
document.getElementById('uiDevAddScore').addEventListener('click', devAddScore);
document.getElementById('uiDevFill').addEventListener('click', devFillSnake);
document.getElementById('uiDevClose').addEventListener('click', closeDevMenu);

// === CONFETTI ===
function triggerConfetti() {
    const colors = ['#ffb4ab', '#b7f397', '#9cd67d', '#ffffff', '#386a20'];
    const W = window.innerWidth, H = window.innerHeight;
    const corners = [
        { x: 0, y: 0, dx: 1, dy: 1 },
        { x: W, y: 0, dx: -1, dy: 1 },
        { x: 0, y: H, dx: 1, dy: -1 },
        { x: W, y: H, dx: -1, dy: -1 }
    ];
    for (const c of corners) {
        for (let i = 0; i < 25; i++) {
            const ox = c.dx * Math.random() * 60;
            const oy = c.dy * Math.random() * 60;
            particles.push(createParticle(c.x + ox, c.y + oy, c.dx, c.dy, colors));
        }
    }
}

function createParticle(x, y, dirX, dirY, colors) {
    return {
        x: x, y: y,
        vx: (Math.random() * 4 + 2) * dirX,
        vy: (Math.random() * 4 + 2) * dirY,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 9, rotation: Math.random() * 360, rs: (Math.random() - 0.5) * 8
    };
}

function updateConfetti() {
    cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.rotation += p.rs;
        
        cCtx.save();
        cCtx.translate(p.x, p.y); cCtx.rotate(p.rotation * Math.PI / 180);
        cCtx.fillStyle = p.color;
        cCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        cCtx.restore();
        
        if (p.y > confettiCanvas.height + 20) particles.splice(i, 1);
    }
}

resetGameState();
requestAnimationFrame(animationLoop);
