let lang = 'en';
let region = 'world';
let queue = [];
let current = null;
let correctCount = 0;
let total = 0;
let timer = 0;
let timerActive = false;

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function renderFlagInto(el, flag) {
    el.innerHTML = `<img src="./flags/${flag.code}.svg" style="width:1.2em;height:1.2em;">`;
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
    if (region === r) return;
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
    document.getElementById('flag-grid').innerHTML = '';
    document.getElementById('game').style.display = 'block';
    document.getElementById('finish-screen').classList.remove('visible');
    const maps = document.querySelectorAll('path');
    maps.forEach(map => {map.style.fill = 'var(--border)'});
    resetTimer();
    nextFlag();
}

function nextFlag() {
    if (current) {
        const maps = document.querySelectorAll(`[class="${current["en"][0]}"], [name="${current["en"][0]}"]`);
        maps.forEach(map => {map.style.fill = "var(--muted)";})
    }

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
        addToGrid(current, true);
        input.readonly = true;

        setTimeout(() => {
            input.readonly = false;
            nextFlag();
        }, 800);
    }
}

function skipFlag() {
    if (!current) return;
    const input = document.getElementById('guess-input');
    input.value = current[lang][0];
    input.classList.add('wrong');
    input.readonly = true;
    addToGrid(current, false);
    setTimeout(() => {
        input.readonly = false;
        nextFlag();
    }, 1400);
}

function showHint() {
    if (!current) return;
    const input = document.getElementById('guess-input');
    input.value = '';
    const country = current[lang][0];
    input.placeholder = country[0] + country
        .slice(1)
        .replace(/[^\s-]/g, "_");
    input.focus();
}

function updateProgress() {
    const done = total - queue.length;
    const pct = Math.round(done / total * 100);
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-score').textContent = `${done} / ${total}`;
}

function showFinish() {
    document.getElementById('game').style.display = 'none';
    const fs = document.getElementById('finish-screen');
    fs.classList.add('visible');
    const t = i18n[lang];
    document.getElementById('finish-title').textContent = t.finishTitle;
    document.getElementById('finish-time').textContent = `${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(timer % 100).padStart(2, "0")}`;
    document.getElementById('finish-score').textContent = `${correctCount} / ${total}`;
    document.getElementById('btn-restart').textContent = t.restart;
    timerActive = false;
}

function toggleTheme() {
    const light = document.body.classList.toggle('light');
    document.getElementById('theme-toggle').textContent = light ? '☾' : '☀';
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
        btn.onclick = () => { setLang(l.code); closeLangDropdown(); };
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

buildLangDropdown();
setLang('en');
setInterval(updateTimer, 1000);
startGame();
