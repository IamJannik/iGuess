let lang = 'en';
let region = 'world';
let queue = [];
let current = null;
let correctCount = 0;
let total = 0;
let timer = 0;
let timerActive = false;
let hints = 0;
let guessedHistory = [];

const STORAGE_KEY = 'iguess.state';

function saveState() {
    try {
        const state = {
            lang,
            region,
            light: document.body.classList.contains('light'),
            queueCodes: queue.map(f => f.code),
            currentCode: current ? current.code : null,
            guessed: guessedHistory,
            correctCount,
            total,
            timer,
            finished: total > 0 && queue.length === 0 && !current
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
}

function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function renderFlagInto(el, flag) {
    el.innerHTML = `<img src="./flags/${flag.code}.svg" style="width:1.2em;height:1.2em;" alt="flag" draggable="false">`;
    //twemoji.parse(el, { folder: 'svg', ext: '.svg' });
}

function addToGrid(flag, guessed) {
    const grid = document.getElementById('flag-grid');
    const item = document.createElement('div');
    item.className = 'flag-item';
    const flagDiv = document.createElement('div');
    flagDiv.className = 'small-flag';
    const nameDiv = document.createElement('div');
    nameDiv.className = guessed ? 'guessed-name' : 'skipped-name';
    nameDiv.textContent = flag[lang][0];
    renderFlagInto(flagDiv, flag);
    item.appendChild(flagDiv);
    item.appendChild(nameDiv);
    grid.prepend(item);
}

function setRegion(r) {
    region = r;
    document.querySelectorAll('.region-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.region === r)
    );
    startGame();
}

function startGame() {
    current = null;
    const pool = region === 'world' ? ALL_FLAGS : ALL_FLAGS.filter(f => f.region === region);
    queue = shuffle(pool);
    total = queue.length;

    correctCount = 0;
    guessedHistory = [];
    document.getElementById('flag-grid').innerHTML = '';
    document.getElementById('game').style.display = 'block';
    document.getElementById('finish-screen').classList.remove('visible');
    const maps = document.querySelectorAll('path');
    maps.forEach(map => {map.style.fill = 'var(--border)'});
    resetTimer();
    nextFlag();
}

function nextFlag() {
    hints = 0;

    if (queue.length === 0) {
        showFinish();
        return;
    }

    current = queue.shift();
    const flagEl = document.getElementById('flag-display');
    flagEl.classList.remove('show');
    flagEl.classList.add('hide');
    setTimeout(() => {
        renderFlagInto(flagEl, current);
        flagEl.classList.remove('hide');
        flagEl.classList.add('show');
    }, 200);

    const input = document.getElementById('guess-input');
    const t = i18n[lang];
    input.value = '';
    input.className = 'guess-input';
    input.placeholder = t.placeholder;
    input.focus();
    updateProgress();
    saveState();
}

function normalize(str) {
    return str.trim().toLowerCase()
        .replace(/[äÄ]/g, 'a').replace(/[öÖ]/g, 'o').replace(/[üÜ]/g, 'u')
        .replace(/[ß]/g, 'ss').replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a')
        .replace(/[-\s]+/g, ' ');
}

function checkGuess() {
    if (!current) return;
    timerActive = true;
    const input = document.getElementById('guess-input');
    const val = input.value;
    if (!val.trim()) {
        input.className = 'guess-input';
        return;
    }

    const answers = current[lang].map(normalize);
    const guess = normalize(val);

    if (answers.includes(guess)) {
        const t = i18n[lang];
        input.placeholder = t.placeholder;
        input.classList.add('correct');
        correctCount++;
        input.readonly = true;
        guessedHistory.push({ code: current.code, guessed: true });
        setTimeout(() => {
            input.readonly = false;
            addToGrid(current, true);
            nextFlag();
        }, 800);
    }
}

function skipFlag() {
    if (!current) return;
    const input = document.getElementById('guess-input');
    if (input.readonly) return;
    input.value = current[lang][0];
    input.classList.add('wrong');
    input.readonly = true;
    guessedHistory.push({ code: current.code, guessed: false });
    setTimeout(() => {
        input.readonly = false;
        addToGrid(current, false);
        nextFlag();
    }, 1200);
}

function showHint() {
    if (!current) return;
    hints++;
    const input = document.getElementById('guess-input');
    input.value = '';
    const country = current[lang][0];
    input.placeholder = country.slice(0, hints) + country.slice(hints).replace(/\p{L}/gu, "_");
    input.focus();
}

function updateProgress() {
    const done = total - queue.length;
    const pct = Math.round(done / total * 100);
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-score').textContent = `${done} / ${total}`;
}

function showFinish() {
    current = null;
    document.getElementById('game').style.display = 'none';
    const fs = document.getElementById('finish-screen');
    fs.classList.add('visible');
    const t = i18n[lang];
    document.getElementById('finish-title').textContent = t.finishTitle;
    document.getElementById('finish-time').textContent = `${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(timer % 100).padStart(2, "0")}`;
    document.getElementById('finish-score').textContent = `${correctCount} / ${total}`;
    document.getElementById('btn-restart').textContent = t.restart;
    timerActive = false;
    saveState();
}

function toggleTheme() {
    const light = document.body.classList.toggle('light');
    document.getElementById('theme-toggle').textContent = light ? 'C' : 'O';
    saveState();
}

function toggleLangDropdown() {
    document.getElementById('lang-dropdown').classList.toggle('open');
}

function closeLangDropdown() {
    document.getElementById('lang-dropdown').classList.remove('open');
}

function setLang(l) {
    lang = l;
    const entry = LANGUAGES.find(x => x.code === l);
    document.getElementById('lang-selected-label').textContent = entry.label;
    document.querySelectorAll('.lang-option').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === l);
    });
    const t = i18n[l];
    document.getElementById('guess-input').placeholder = t.placeholder;
    document.getElementById('btn-hint').textContent = t.hint;
    document.getElementById('btn-skip').textContent = t.skip;
    document.querySelectorAll('.region-btn').forEach(b => {
        b.textContent = t.regions[b.dataset.region];
    });
}

function buildLangDropdown() {
    const container = document.getElementById('lang-options');
    LANGUAGES.forEach(l => {
        const btn = document.createElement('button');
        btn.className = 'lang-option';
        btn.dataset.lang = l.code;
        btn.textContent = l.name;
        btn.onclick = () => { setLang(l.code); saveState(); closeLangDropdown(); };
        container.appendChild(btn);
    });
}

function resetTimer() {
    timerActive = false;
    timer = 0
    document.getElementById('progress-time').textContent = `00:00`;
}

function updateTimer() {
    if (!timerActive) return;
    timer++;
    document.getElementById('progress-time').textContent = `${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(timer % 100).padStart(2, "0")}`;
}

document.getElementById('guess-input').addEventListener('input', () => checkGuess());

document.getElementById('guess-input').addEventListener('keydown', e => {
    if (e.key === 'Tab') {
        e.preventDefault();
        showHint();
    }
    if (e.key === 'Enter') {
        e.preventDefault();
        skipFlag();
    }
});

document.addEventListener('click', e => {
    if (!document.getElementById('lang-dropdown').contains(e.target)) {
        closeLangDropdown();
    }
});

function restoreFromState(state) {
    const byCode = Object.fromEntries(ALL_FLAGS.map(f => [f.code, f]));

    if (state.light) {
        document.body.classList.add('light');
        document.getElementById('theme-toggle').textContent = 'C';
    }
    setLang(state.lang || 'en');

    region = state.region || 'world';
    document.querySelectorAll('.region-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.region === region)
    );

    queue = (state.queueCodes || []).map(c => byCode[c]).filter(Boolean);
    total = state.total || 0;
    correctCount = state.correctCount || 0;
    timer = state.timer || 0;
    guessedHistory = state.guessed || [];

    document.getElementById('flag-grid').innerHTML = '';
    guessedHistory.forEach(g => {
        const f = byCode[g.code];
        if (!f) return;
        addToGrid(f, g.guessed);
    });

    document.getElementById('progress-time').textContent = `${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(timer % 100).padStart(2, "0")}`;

    if (state.finished || (total > 0 && queue.length === 0 && !state.currentCode)) {
        current = null;
        showFinish();
        return true;
    }

    if (state.currentCode && byCode[state.currentCode]) {
        current = byCode[state.currentCode];
        const flagEl = document.getElementById('flag-display');
        renderFlagInto(flagEl, current);
        flagEl.classList.remove('hide');
        flagEl.classList.add('show');
        document.getElementById('game').style.display = 'block';
        document.getElementById('finish-screen').classList.remove('visible');
        updateProgress();
        document.getElementById('guess-input').focus();
        timerActive = timer > 0;
        return true;
    }

    return false;
}

buildLangDropdown();
const savedState = loadState();
if (!savedState || !restoreFromState(savedState)) {
    setLang('en');
    startGame();
}
setInterval(updateTimer, 1000);
