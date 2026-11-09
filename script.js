const QUESTIONS_PER_LEVEL = 4;
const MAX_TRIES = 2;
const MAX_SUGGESTIONS = 5;      // per group (starting / in-between)
const REVEAL_DELAY_MS = 2000;   // how long a revealed answer stays before the next flag
const STORAGE_PREFIX = 'flagQuiz.';  // keeps stats separate from other local quizzes

// Inline icons (stroke follows the text colour)
const ICONS = {
    globe: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20z"></path></svg>',
    people: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"></path><circle cx="17" cy="9" r="2.5"></circle><path d="M17 14c2.4 0 4 1.5 4.5 4"></path></svg>',
    coin: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M14.5 9.5c-.4-1-1.4-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1.1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2.1-.5-2.5-1.5"></path><path d="M12 6.5v1.5M12 16v1.5"></path></svg>',
    compass: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M16 8l-2.5 5.5L8 16l2.5-5.5z"></path></svg>',
    lock: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>',
    heartFull: '<svg width="30" height="30" viewBox="0 0 24 24" fill="#D24A2E" stroke="#D24A2E" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.4 5 6.8 5c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.4 0 5.8 3.3 4.3 6.8C19.5 16.4 12 21 12 21z"></path></svg>',
    heartEmpty: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#B9C6D8" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.4 5 6.8 5c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.4 0 5.8 3.3 4.3 6.8C19.5 16.4 12 21 12 21z"></path></svg>'
};

function normalize(text) {
    return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function capitalText(entry) {
    return entry.capitals.join(' / ');
}

function currencyText(entry) {
    return entry.currencies.map(currency => currency.name).join(' or ');
}

// One choice per currency, however many Countries use it (e.g. the Euro)
function currencyChoices() {
    const byCode = new Map();
    FLAG_ENTRIES.filter(entry => entry.kind === 'country').forEach(entry => {
        entry.currencies.forEach(currency => byCode.set(currency.code, {
            text: currency.name,
            searchNames: [currency.name, currency.code, ...currency.otherNames].map(normalize),
            code: currency.code
        }));
    });
    return [...byCode.values()];
}

// Rounded to two significant figures, e.g. 1.4 billion, 68 million, 9.3 million
function roundPopulation(count) {
    return Number(count.toPrecision(2));
}

function populationText(count) {
    const rounded = roundPopulation(count);
    if (rounded >= 1e9) return `${+(rounded / 1e9).toFixed(2)} billion`;
    if (rounded >= 1e6) return `${+(rounded / 1e6).toFixed(2)} million`;
    return rounded.toLocaleString('en');
}

// The Country next to this one in Population Rank whose population is closest
function similarCountry(entry) {
    const nearby = FLAG_ENTRIES.filter(other => other.kind === 'country' &&
                                                Math.abs(other.rank - entry.rank) === 1);
    const gap = other => Math.abs(Math.log(other.populationCount / entry.populationCount));
    return nearby.sort((a, b) => gap(a) - gap(b))[0];
}

// The 100 Countries with the best Population Rank, 20 to a Level
function top100Levels(points) {
    return points.map((levelPoints, i) => ({
        type: `Level ${i + 1}`, fromRank: i * 20 + 1, toRank: i * 20 + 20, points: levelPoints
    }));
}

// Clues are always revealed in this order; the first is free
const CONTINENT_CLUE = { label: 'Continent', value: entry => entry.continent, icon: ICONS.globe };
const POPULATION_CLUE = { label: 'Population', value: entry => entry.population, icon: ICONS.people };
const NEIGHBOUR_CLUE = { label: 'Neighbour', value: entry => entry.neighbour, icon: ICONS.compass };
const COUNTRY_CLUE = { label: 'Country', value: entry => entry.name, icon: ICONS.compass };
const SIMILAR_CLUE = { label: 'Similar population', value: entry => similarCountry(entry).name, icon: ICONS.people };
const MAP_CONTINENT_CLUE = { ...CONTINENT_CLUE, onReveal: entry => zoomMapToContinent(entry.continent) };
const SYMBOL_CLUE ={ label: 'Symbol', value: entry => entry.currencies.map(currency => currency.symbol).join(' / '), icon: ICONS.coin };

// Each choice is one line in the dropdown: what it shows, the names it is found by
// (lower case, no accents) and the Flag Entry it stands for
const MODES = {
    country: {
        chip: 'Countries',
        question: 'Which country is this?',
        placeholder: 'Start typing a country...',
        learnHeading: 'Flags to learn',
        learnNote: 'Missed, skipped, or needed a paid clue',
        learnName: entry => entry.name,
        learnDetail: (entry, level) => `${entry.continent} · ${level.type}`,
        levels: [
            { type: 'Level 1', fromRank: 1, toRank: 30, points: 1 },
            { type: 'Level 2', fromRank: 31, toRank: 70, points: 2 },
            { type: 'Level 3', fromRank: 71, toRank: 120, points: 3 },
            { type: 'Level 4', fromRank: 121, toRank: 197, points: 4 },
            { type: 'Level 5', territories: true, points: 5 }
        ],
        clues: [CONTINENT_CLUE, POPULATION_CLUE, NEIGHBOUR_CLUE],
        answer: entry => entry.name,
        choices: FLAG_ENTRIES.map(entry => ({
            text: entry.name,
            searchNames: [entry.name, ...entry.otherNames].map(normalize),
            entry
        }))
    },
    capital: {
        chip: 'Capitals',
        question: 'What is the capital of this country?',
        placeholder: 'Start typing a capital...',
        learnHeading: 'Capitals to learn',
        learnNote: 'Missed, skipped, or needed a paid clue',
        learnName: entry => capitalText(entry),
        learnDetail: (entry, level) => `Capital of ${entry.name} · ${level.type}`,
        levels: top100Levels([1, 2, 3, 4, 5]),
        clues: [CONTINENT_CLUE, POPULATION_CLUE, COUNTRY_CLUE],
        answer: entry => `${capitalText(entry)} (${entry.name})`,
        choices: FLAG_ENTRIES.filter(entry => entry.kind === 'country').map(entry => ({
            text: capitalText(entry),
            searchNames: [...entry.capitals, ...entry.capitalOtherNames].map(normalize),
            entry
        }))
    },
    // A currency can belong to several Countries, so a choice is right if this Country
    // uses it, and a Quiz never asks two Countries that share a currency
    currency: {
        chip: 'Currencies',
        question: 'What currency does this country use?',
        placeholder: 'Start typing a currency...',
        learnHeading: 'Currencies to learn',
        learnNote: 'Missed, skipped, or needed a paid clue',
        learnName: entry => currencyText(entry),
        learnDetail: (entry, level) => `Currency of ${entry.name} · ${level.type}`,
        levels: top100Levels([1, 2, 3, 4, 5]),
        clues: [CONTINENT_CLUE, COUNTRY_CLUE, SYMBOL_CLUE],
        answer: entry => `${currencyText(entry)} (${entry.name})`,
        answerKeys: entry => entry.currencies.map(currency => currency.code),
        isRight: (choice, entry) => entry.currencies.some(currency => currency.code === choice.code),
        choices: currencyChoices()
    },
    // Picked from five Population Choices instead of the dropdown; Clues are free and a
    // right second Try is worth one point less
    population: {
        chip: 'Population',
        question: 'How many people live in this country?',
        learnHeading: 'Populations to learn',
        learnNote: 'Missed, skipped, or needed a second try',
        learnName: entry => entry.name,
        learnDetail: (entry, level) => `${populationText(entry.populationCount)} · ${level.type}`,
        // Population Choices are evenly spaced multiples of one step; starting higher than
        // 1x keeps neighbouring Choices further apart by factor. Level 5 has no Higher/Lower
        // hint, since with three Choices it would give the answer away.
        levels: top100Levels([2, 2, 2, 4, 5]).map((level, i) => ({ ...level, ...[
            { choiceCount: 5, lowestMultiple: 1, hint: true },
            { choiceCount: 5, lowestMultiple: 1, hint: true },
            { choiceCount: 5, lowestMultiple: 2, hint: true },
            { choiceCount: 5, lowestMultiple: 2, hint: true },
            { choiceCount: 3, lowestMultiple: 2, hint: false }
        ][i] })),
        clues: [CONTINENT_CLUE, COUNTRY_CLUE, SIMILAR_CLUE],
        answer: entry => populationText(entry.populationCount),
        pickFromChoices: true,
        secondTryCosts: true,
        freeClues: true,
        choices: []
    },
    // Answered by clicking the World Map; a wrong first Try gets a Nudge
    map: {
        chip: 'Map',
        question: 'Where is this country? Click it on the map.',
        learnHeading: 'Countries to find',
        learnNote: 'Missed, skipped, needed a second try or a paid clue',
        learnName: entry => entry.name,
        learnDetail: (entry, level) => `${entry.continent} · ${level.type}`,
        levels: top100Levels([1, 2, 3, 4, 5]),
        clues: [MAP_CONTINENT_CLUE, NEIGHBOUR_CLUE, COUNTRY_CLUE],
        answer: entry => entry.name,
        clickOnMap: true,
        secondTryCosts: true,
        choices: []
    }
};

let mode = 'country';
let questions = [], questionResults = [], currentQuestion = 0, totalPoints = 0, tries = 0, cluesShown = 0;
let flagsToLearn = [], quizOver = true, waiting = false, answeredAny = false;
let suggestionItems = [], highlighted = -1;
const totalQuestions = MODES.country.levels.length * QUESTIONS_PER_LEVEL;
document.getElementById('totalQuestions').textContent = `${totalQuestions}`;

let timerInterval;
let timeElapsed = 0;
let timerStarted = false;
let progressChart, timeChart;

function plural(count, word) {
    return count === 1 ? word : word + 's';
}

function startTimer() {
    timerInterval = setInterval(function() {
        timeElapsed += 0.1;
        document.getElementById('timer').textContent = formatTime(timeElapsed);
    }, 100);  // Update every 100ms (0.1s)
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = (seconds % 1).toFixed(1).substr(2);  // To capture the decimal part
    return `${mins}:${secs < 10 ? '0' : ''}${secs}.${millis}`;
}

function stopTimer() {
    clearInterval(timerInterval);
}

// Like the multiplication quiz, the clock waits for the player's first action
function startTimerOnce() {
    if (!timerStarted && !quizOver) {
        startTimer();
        timerStarted = true;
    }
}

function levels() {
    return MODES[mode].levels;
}

function calculateMaxPoints() {
    return levels().reduce((sum, level) => sum + (QUESTIONS_PER_LEVEL * level.points), 0);
}

function displayMaxPoints() {
    document.getElementById('maxPointsDisplay').textContent = `Maximum possible points: ${calculateMaxPoints()}`;
}

function levelPool(level) {
    if (level.territories) {
        return FLAG_ENTRIES.filter(entry => entry.kind === 'territory');
    }
    return FLAG_ENTRIES.filter(entry => entry.kind === 'country' &&
                                        entry.rank >= level.fromRank && entry.rank <= level.toRank);
}

function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

function buildQuestions() {
    const answerKeys = MODES[mode].answerKeys;
    const usedKeys = new Set();
    const result = [];
    levels().forEach(level => {
        let picked = 0;
        for (const entry of shuffle(levelPool(level))) {
            if (picked === QUESTIONS_PER_LEVEL) break;
            // Leave out a Country whose answer an earlier Question already had
            const keys = answerKeys ? answerKeys(entry) : [];
            if (keys.some(key => usedKeys.has(key))) continue;
            keys.forEach(key => usedKeys.add(key));
            result.push({ entry, level });
            picked++;
        }
    });
    return result;
}

function showScreen(id) {
    ['start', 'quiz', 'results'].forEach(screen => {
        document.getElementById(screen).hidden = screen !== id;
    });
    document.getElementById('quizChips').hidden = id !== 'quiz';
    window.scrollTo(0, 0);
}

function showStart() {
    showScreen('start');
}

function startQuiz(newMode) {
    mode = newMode;
    const settings = MODES[mode];
    document.getElementById('modeChip').textContent = settings.chip;
    document.getElementById('questionText').textContent = settings.question;
    document.getElementById('userAnswer').placeholder = settings.placeholder || '';
    document.getElementById('learnHeading').textContent = settings.learnHeading;
    document.getElementById('learnNote').textContent = settings.learnNote;
    document.querySelector('.answerBox').hidden = !!(settings.pickFromChoices || settings.clickOnMap);
    document.getElementById('populationChoices').hidden = !settings.pickFromChoices;
    document.getElementById('quiz').classList.toggle('mapMode', !!settings.clickOnMap);
    document.getElementById('mapBox').hidden = !settings.clickOnMap;
    displayMaxPoints();

    questions = buildQuestions();
    questionResults = [];
    currentQuestion = 0;
    totalPoints = 0;
    flagsToLearn = [];
    quizOver = false;
    waiting = false;
    answeredAny = false;
    updatePointsDisplay();
    showMessage('', '');
    showScreen('quiz');
    document.getElementById('endButton').disabled = false;

    stopTimer();
    timerStarted = false;
    timeElapsed = 0;
    document.getElementById('timer').textContent = formatTime(timeElapsed);

    buildProgressStops();
    nextQuestion();
}

function nextQuestion() {
    currentQuestion++;

    if (currentQuestion > totalQuestions) {
        endQuiz();
        return;
    }

    const question = questions[currentQuestion - 1];
    tries = 0;
    cluesShown = 0;

    showFlag(question.entry.flag);
    document.getElementById('questionCounter').textContent = `${currentQuestion}`;

    updateProgressStops();
    renderLevelCard();
    renderClues();

    if (MODES[mode].pickFromChoices) {
        renderPopulationChoices(populationChoices(question.entry, question.level));
        setControlsEnabled(true);
        return;
    }
    if (MODES[mode].clickOnMap) {
        setUpWorldMap(document.getElementById('mapBox'), pickOnMap);
        resetMap();
        setControlsEnabled(true);
        return;
    }
    setControlsEnabled(true);
    const input = document.getElementById('userAnswer');
    input.value = '';
    input.focus();
}

// ---- Waving flag ----

// The flag is redrawn on a canvas every frame, one 2-pixel column at a time. Each column is
// shifted up or down along a sine wave that runs from the pole side to the free end, and a
// soft band of light and shadow follows the slope of the wave. The hidden img underneath
// gives the flag its size on the page.
const WAVE_SECONDS = 6;     // one up-and-down swing
const WAVES_ACROSS = 1.2;   // how many ripples fit across the flag at once
const WAVE_HEIGHT = 0.01;   // how far the free end moves, as a share of the flag's height
const WAVE_SHADE = 0.18;    // how strongly the folds catch the light (0 = flat)
const WAVE_COLUMN = 2;      // width of each redrawn column, in screen pixels

const flagImage = document.getElementById('flag');
const flagCanvas = document.createElement('canvas');
flagCanvas.id = 'flagCanvas';
flagCanvas.setAttribute('aria-hidden', 'true');
flagImage.parentElement.appendChild(flagCanvas);
const flagContext = flagCanvas.getContext('2d');
const stillFlag = document.createElement('canvas');  // the flag drawn once at screen size
let flagWidth = 0, flagHeight = 0, flagMargin = 0, flagPad = 0;

function showFlag(src) {
    flagImage.src = src;
}

// Sizes the canvas to the flag (with room above and below for the wave) and draws the
// still flag once, in sharp screen pixels
function prepareFlag() {
    if (!flagImage.naturalWidth || !flagImage.offsetWidth) return;
    const scale = window.devicePixelRatio || 1;
    flagWidth = Math.round(flagImage.offsetWidth * scale);
    flagHeight = Math.round(flagImage.offsetHeight * scale);
    flagMargin = Math.ceil(flagHeight * WAVE_HEIGHT + 2 * scale);
    flagCanvas.width = flagWidth;
    flagCanvas.height = flagHeight + 2 * flagMargin;
    flagCanvas.style.width = `${flagImage.offsetWidth}px`;
    flagCanvas.style.height = `${flagCanvas.height / scale}px`;
    flagCanvas.style.top = `${-flagMargin / scale}px`;
    // The still flag gets a few extra rows above and below (copies of its edge rows), so the
    // columns always reach past the smooth outline that trims them
    flagPad = Math.ceil(2 * scale);
    stillFlag.width = flagWidth;
    stillFlag.height = flagHeight + 2 * flagPad;
    const still = stillFlag.getContext('2d');
    still.drawImage(flagImage, 0, flagPad, flagWidth, flagHeight);
    still.drawImage(stillFlag, 0, flagPad, flagWidth, 1, 0, 0, flagWidth, flagPad);
    still.drawImage(stillFlag, 0, flagPad + flagHeight - 1, flagWidth, 1, 0, flagPad + flagHeight, flagWidth, flagPad);
}

function drawWavingFlag(time) {
    requestAnimationFrame(drawWavingFlag);
    if (!flagWidth || !flagImage.offsetWidth) return;  // no flag yet, or not on screen
    const context = flagContext;
    const column = Math.round(WAVE_COLUMN * (window.devicePixelRatio || 1));
    const phaseAt = x => 2 * Math.PI * (time / 1000 / WAVE_SECONDS - WAVES_ACROSS * x / flagWidth);
    const reachAt = x => 0.1 + 0.9 * x / flagWidth;  // the pole side barely moves
    const height = flagHeight * WAVE_HEIGHT;

    const topAt = x => flagMargin + height * reachAt(x) * Math.sin(phaseAt(x));

    context.clearRect(0, 0, flagCanvas.width, flagCanvas.height);
    context.globalCompositeOperation = 'source-over';
    const tops = [];
    for (let x = 0; x < flagWidth; x += column) {
        const top = topAt(x);
        context.drawImage(stillFlag, x, 0, column, stillFlag.height, x, top - flagPad, column, stillFlag.height);
        tops.push([x, top]);
    }
    tops.push([flagWidth, topAt(flagWidth)]);

    // The flag's outline: a smooth curve along the top, back along the bottom. Trimming the
    // columns to it gives soft edges instead of a 2-pixel staircase.
    const outline = new Path2D();
    tops.forEach(([x, top], i) => i ? outline.lineTo(x, top) : outline.moveTo(x, top));
    for (let i = tops.length - 1; i >= 0; i--) outline.lineTo(tops[i][0], tops[i][1] + flagHeight);
    outline.closePath();
    context.globalCompositeOperation = 'destination-in';
    context.fillStyle = 'black';  // any solid colour: only its coverage counts here
    context.fill(outline);

    // Light where the cloth faces up the slope, shadow where it faces down
    const shade = context.createLinearGradient(0, 0, flagWidth, 0);
    const stops = 32;
    for (let i = 0; i <= stops; i++) {
        const x = i / stops * flagWidth;
        const light = -Math.cos(phaseAt(x)) * reachAt(x) * WAVE_SHADE;
        shade.addColorStop(i / stops, light > 0 ? `rgba(255,255,255,${light})` : `rgba(0,0,0,${-light})`);
    }
    context.globalCompositeOperation = 'source-atop';  // shade the flag only
    context.fillStyle = shade;
    context.fillRect(0, 0, flagCanvas.width, flagCanvas.height);

    // A thin edge that follows the wave, so white parts of flags still show
    context.globalCompositeOperation = 'source-over';
    context.strokeStyle = 'rgba(23, 38, 74, 0.25)';
    context.lineWidth = 1;
    context.stroke(outline);
}

flagImage.addEventListener('load', prepareFlag);
new ResizeObserver(prepareFlag).observe(flagImage);  // e.g. turning a phone sideways
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    requestAnimationFrame(drawWavingFlag);
}

function currentEntry() {
    return questions[currentQuestion - 1].entry;
}

function paidClues() {
    if (MODES[mode].freeClues) return 0;
    return Math.max(0, cluesShown - 1);  // the first clue (continent) is free
}

function questionWorth() {
    const points = questions[currentQuestion - 1].level.points;
    const tryCost = MODES[mode].secondTryCosts ? tries : 0;  // a right second Try is worth one less
    return Math.max(0, points - tryCost - paidClues());
}

function updatePointsDisplay() {
    document.getElementById('totalPoints').textContent = totalPoints;
    document.getElementById('pointsWord').textContent = plural(totalPoints, 'point');
}

function setControlsEnabled(enabled) {
    document.getElementById('userAnswer').disabled = !enabled;
    document.getElementById('skipButton').disabled = !enabled;
    document.querySelectorAll('#clues button').forEach(button => button.disabled = !enabled);
    document.querySelectorAll('#populationChoices button:not(.crossed)').forEach(button => button.disabled = !enabled);
}

function showMessage(text, className) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = className;
}

// ---- Progress stops, level card and clue tiles ----

function buildProgressStops() {
    const container = document.getElementById('progressStops');
    container.innerHTML = '';
    levels().forEach((level, levelIndex) => {
        const group = document.createElement('div');
        group.className = 'levelStops' + (level.territories ? ' super' : '');
        group.dataset.level = levelIndex;
        const stops = document.createElement('div');
        stops.className = 'stops';
        for (let i = 0; i < QUESTIONS_PER_LEVEL; i++) {
            const stop = document.createElement('div');
            stop.className = 'stop';
            stops.appendChild(stop);
        }
        const label = document.createElement('span');
        label.textContent = level.type.toUpperCase();
        group.appendChild(stops);
        group.appendChild(label);
        container.appendChild(group);
    });
}

function updateProgressStops() {
    const stops = document.querySelectorAll('#progressStops .stop');
    stops.forEach((stop, index) => {
        stop.className = 'stop';
        if (questionResults[index]) {
            stop.classList.add(questionResults[index]);
        } else if (index === currentQuestion - 1) {
            stop.classList.add('now');
        }
    });
    const currentLevel = Math.floor((currentQuestion - 1) / QUESTIONS_PER_LEVEL);
    document.querySelectorAll('#progressStops .levelStops').forEach(group => {
        group.classList.toggle('current', Number(group.dataset.level) === currentLevel);
    });
}

function renderLevelCard() {
    const level = questions[currentQuestion - 1].level;
    const levelName = document.getElementById('levelName');
    levelName.textContent = level.type;
    levelName.classList.toggle('super', !!level.territories);

    const worth = questionWorth();
    document.getElementById('questionWorth').textContent = worth;
    document.getElementById('worthWord').textContent = `${plural(worth, 'point')} for this flag`;

    const triesLeft = MAX_TRIES - tries;
    let hearts = '';
    for (let i = 0; i < MAX_TRIES; i++) {
        hearts += i < triesLeft ? ICONS.heartFull : ICONS.heartEmpty;
    }
    const heartsBox = document.getElementById('hearts');
    heartsBox.innerHTML = hearts;
    heartsBox.setAttribute('aria-label', `${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} left`);
}

function renderClues() {
    const container = document.getElementById('clues');
    const entry = currentEntry();
    container.innerHTML = '';

    MODES[mode].clues.forEach((clue, index) => {
        const paid = index > 0 && !MODES[mode].freeClues;
        let tile;
        const icon = document.createElement('div');
        icon.className = 'clueIcon';
        const text = document.createElement('div');
        const label = document.createElement('div');
        label.className = 'clueLabel';
        const detail = document.createElement('div');

        if (index < cluesShown) {
            tile = document.createElement('div');
            tile.className = 'clue revealed';
            icon.innerHTML = clue.icon;
            label.textContent = clue.label + (paid ? ' · −1' : '');
            detail.className = 'clueValue';
            detail.textContent = clue.value(entry);
        } else if (index === cluesShown) {
            tile = document.createElement('button');
            tile.className = 'clue next';
            tile.addEventListener('click', showClue);
            icon.innerHTML = clue.icon;
            label.textContent = clue.label;
            detail.className = 'clueAction';
            detail.textContent = 'Reveal · ';
            const cost = document.createElement('span');
            cost.className = paid ? 'clueCost' : '';
            cost.textContent = paid ? '−1 point' : 'free';
            detail.appendChild(cost);
        } else {
            tile = document.createElement('div');
            tile.className = 'clue locked';
            icon.innerHTML = ICONS.lock;
            label.textContent = clue.label;
            detail.className = 'clueAction';
            detail.textContent = 'Locked';
        }

        text.appendChild(label);
        text.appendChild(detail);
        tile.appendChild(icon);
        tile.appendChild(text);
        container.appendChild(tile);
    });
}

// ---- Answer dropdown ----

function findSuggestions(typed) {
    const query = normalize(typed.trimStart());
    if (query.length < 2) return null;

    const starting = [], inbetween = [];
    MODES[mode].choices.forEach(choice => {
        if (choice.searchNames.some(name => name.startsWith(query))) {
            starting.push(choice);
        } else if (choice.searchNames.some(name => name.includes(query))) {
            inbetween.push(choice);
        }
    });
    const byName = (a, b) => a.text.localeCompare(b.text);
    return {
        starting: starting.sort(byName).slice(0, MAX_SUGGESTIONS),
        inbetween: inbetween.sort(byName).slice(0, MAX_SUGGESTIONS)
    };
}

function renderSuggestions() {
    const list = document.getElementById('suggestions');
    const found = findSuggestions(document.getElementById('userAnswer').value);
    list.innerHTML = '';
    suggestionItems = [];
    highlighted = -1;

    if (!found || (found.starting.length === 0 && found.inbetween.length === 0)) {
        list.hidden = true;
        return;
    }

    const addItem = choice => {
        const li = document.createElement('li');
        li.textContent = choice.text;
        li.dataset.index = suggestionItems.length;
        li.addEventListener('mousedown', event => {
            event.preventDefault();  // keep focus in the input
            pickAnswer(choice);
        });
        list.appendChild(li);
        suggestionItems.push(choice);
    };

    found.starting.forEach(addItem);
    if (found.starting.length > 0 && found.inbetween.length > 0) {
        const divider = document.createElement('li');
        divider.className = 'divider';
        list.appendChild(divider);
    }
    found.inbetween.forEach(addItem);

    list.hidden = false;
    setHighlight(0);
}

function setHighlight(index) {
    highlighted = index;
    document.querySelectorAll('#suggestions li[data-index]').forEach(li => {
        li.classList.toggle('highlighted', Number(li.dataset.index) === index);
    });
}

function hideSuggestions() {
    document.getElementById('suggestions').hidden = true;
    suggestionItems = [];
    highlighted = -1;
}

// ---- Answering, skipping and clues ----

function pickAnswer(choice) {
    if (waiting || quizOver) return;
    answeredAny = true;
    hideSuggestions();
    const input = document.getElementById('userAnswer');
    const entry = currentEntry();
    const isRight = MODES[mode].isRight || ((choice, entry) => choice.entry === entry);

    if (isRight(choice, entry)) {
        const points = questionWorth();
        totalPoints += points;
        updatePointsDisplay();
        showMessage(`Correct! +${points}`, 'correct');
        if (paidClues() > 0) flagsToLearn.push(entry);
        questionResults[currentQuestion - 1] = 'correct';
        nextQuestion();
        return;
    }

    tries++;
    renderLevelCard();
    if (tries >= MAX_TRIES) {
        revealAnswer(`Not quite! It was ${MODES[mode].answer(currentEntry())}`);
    } else {
        showMessage('Not quite! Try again.', 'incorrect');
        input.value = '';
        input.focus();
    }
}

function revealAnswer(text) {
    const entry = currentEntry();
    showMessage(text, 'incorrect');
    document.getElementById('userAnswer').value = MODES[mode].answer(entry);
    document.querySelectorAll('#populationChoices button.isRight').forEach(button => button.classList.add('shown'));
    if (MODES[mode].clickOnMap) {
        fillMapCountry(entry.code, 'missed');
        zoomMapToCountry(entry.code);
    }
    flagsToLearn.push(entry);
    questionResults[currentQuestion - 1] = 'missed';
    updateProgressStops();
    waiting = true;
    setControlsEnabled(false);
    setTimeout(() => {
        waiting = false;
        if (!quizOver) nextQuestion();
    }, REVEAL_DELAY_MS);
}

function skipQuestion() {
    if (waiting || quizOver) return;
    startTimerOnce();
    hideSuggestions();
    revealAnswer(`Skipped! It was ${MODES[mode].answer(currentEntry())}`);
}

function showClue() {
    if (waiting || quizOver || cluesShown >= MODES[mode].clues.length) return;
    startTimerOnce();
    cluesShown++;
    renderClues();
    renderLevelCard();
    const clue = MODES[mode].clues[cluesShown - 1];
    if (clue.onReveal) clue.onReveal(currentEntry());
    if (!MODES[mode].pickFromChoices && !MODES[mode].clickOnMap) document.getElementById('userAnswer').focus();
}

// ---- Population Choices ----

// Evenly spaced Choices: the actual population lands on a random multiple of a step, and
// the other Choices are the neighbouring multiples (e.g. 2, 3, 4, 5, 6 x the step)
function populationChoices(entry, level) {
    const rightMultiple = level.lowestMultiple + Math.floor(Math.random() * level.choiceCount);
    const step = entry.populationCount / rightMultiple;
    return Array.from({ length: level.choiceCount }, (_, i) => {
        const multiple = level.lowestMultiple + i;
        return { count: multiple * step, right: multiple === rightMultiple };
    });
}

function renderPopulationChoices(choices) {
    const container = document.getElementById('populationChoices');
    container.innerHTML = '';
    choices.forEach(choice => {
        const button = document.createElement('button');
        button.className = 'choiceButton' + (choice.right ? ' isRight' : '');
        button.textContent = populationText(choice.count);
        button.addEventListener('click', () => pickPopulation(button, choice));
        container.appendChild(button);
    });
}

function pickPopulation(button, choice) {
    if (waiting || quizOver) return;
    answeredAny = true;
    startTimerOnce();
    const entry = currentEntry();

    if (choice.right) {
        const points = questionWorth();
        totalPoints += points;
        updatePointsDisplay();
        showMessage(`Correct! +${points}`, 'correct');
        if (tries > 0) flagsToLearn.push(entry);
        questionResults[currentQuestion - 1] = 'correct';
        nextQuestion();
        return;
    }

    tries++;
    button.classList.add('crossed');
    button.disabled = true;
    renderLevelCard();
    if (tries >= MAX_TRIES) {
        revealAnswer(`Not quite! It was ${MODES[mode].answer(entry)}`);
    } else if (questions[currentQuestion - 1].level.hint) {
        const higher = entry.populationCount > choice.count;
        showMessage(higher ? 'More people than that! ↑' : 'Fewer people than that! ↓', 'incorrect');
    } else {
        showMessage('Not quite! Try again.', 'incorrect');
    }
}

// ---- Clicking the World Map ----

const MAP_FOUND_DELAY_MS = 1200;  // how long a found Country stays green before the next flag

function pickOnMap(lon, lat) {
    if (waiting || quizOver || !MODES[mode].clickOnMap) return;
    answeredAny = true;
    startTimerOnce();
    const entry = currentEntry();
    markMapClick(lon, lat);

    if (isMapHit(entry.code, lon, lat)) {
        const points = questionWorth();
        totalPoints += points;
        updatePointsDisplay();
        showMessage(`Correct! +${points}`, 'correct');
        if (tries > 0 || paidClues() > 0) flagsToLearn.push(entry);
        questionResults[currentQuestion - 1] = 'correct';
        updateProgressStops();
        fillMapCountry(entry.code, 'found');
        waiting = true;
        setControlsEnabled(false);
        setTimeout(() => {
            waiting = false;
            if (!quizOver) nextQuestion();
        }, MAP_FOUND_DELAY_MS);
        return;
    }

    tries++;
    renderLevelCard();
    if (tries >= MAX_TRIES) {
        revealAnswer(`Not quite! It was ${MODES[mode].answer(entry)}`);
    } else {
        showMessage(`Not quite! Try further ${mapNudge(entry.code, lon, lat)}.`, 'incorrect');
    }
}

// ---- End of quiz ----

function endQuiz() {
    if (quizOver) return;
    quizOver = true;
	stopTimer();
    hideSuggestions();
    setControlsEnabled(false);
    document.getElementById('endButton').disabled = true;

	const maxPoints = calculateMaxPoints();
    const percentage = (totalPoints / maxPoints) * 100;
    document.getElementById('finalPercent').textContent = `${Math.round(percentage)}%`;
    document.getElementById('finalPoints').textContent = `${totalPoints} / ${maxPoints}`;
    document.getElementById('finalTime').textContent = formatTime(timeElapsed);
    const ringLength = 2 * Math.PI * 70;
    document.getElementById('ringFill').setAttribute('stroke-dasharray',
        `${(percentage / 100) * ringLength} ${ringLength}`);
    displayFlagsToLearn();

    showScreen('results');

    // A Quiz where no answer was ever picked isn't saved in the stats
    document.getElementById('notSaved').hidden = answeredAny;
    if (answeredAny) {
        // Save the percentage of points earned in this session
        let progressData = JSON.parse(localStorage.getItem(statsKey(mode, 'progressData'))) || [];
        progressData.push(percentage);
        localStorage.setItem(statsKey(mode, 'progressData'), JSON.stringify(progressData));

        // Update the number of games played
        let gamesPlayed = parseInt(localStorage.getItem(statsKey(mode, 'gamesPlayed'))) || 0;
        gamesPlayed += 1;
        localStorage.setItem(statsKey(mode, 'gamesPlayed'), gamesPlayed);

        // Save elapsedTime
        let timeData = JSON.parse(localStorage.getItem(statsKey(mode, 'timeData'))) || [];
        timeData.push(timeElapsed);
        localStorage.setItem(statsKey(mode, 'timeData'), JSON.stringify(timeData));
    }

    showTrends(mode);
}

function displayFlagsToLearn() {
    const list = document.getElementById('flagsToLearn');
    list.innerHTML = '';
    if (flagsToLearn.length === 0) {
        const li = document.createElement('li');
        li.className = 'learnName';
        li.textContent = 'None - well done!';
        list.appendChild(li);
        return;
    }
    flagsToLearn.forEach(entry => {
        const level = questions.find(q => q.entry === entry).level;
        const li = document.createElement('li');
        const thumb = document.createElement('div');
        thumb.className = 'thumb';
        const img = document.createElement('img');
        img.src = entry.flag;
        img.alt = '';
        thumb.appendChild(img);
        const text = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'learnName';
        name.textContent = MODES[mode].learnName(entry);
        const detail = document.createElement('div');
        detail.className = 'learnDetail';
        detail.textContent = MODES[mode].learnDetail(entry, level);
        text.appendChild(name);
        text.appendChild(detail);
        li.appendChild(thumb);
        li.appendChild(text);
        list.appendChild(li);
    });
}

// Bar chart of past sessions, latest bar highlighted
function drawTrendChart(canvasId, existingChart, data, colour, latestColour, yMax) {
    if (existingChart) {
        existingChart.destroy();
    }
    return new Chart(document.getElementById(canvasId).getContext('2d'), {
        type: 'bar',
        data: {
            labels: Array.from({ length: data.length }, (_, i) => i + 1),
            datasets: [{
                data: data,
                backgroundColor: data.map((_, i) => i === data.length - 1 ? latestColour : colour),
                borderRadius: 8,
                maxBarThickness: 48
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, max: yMax, grid: { color: '#E6EEF7' } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Each Mode keeps its own stats, e.g. flagQuiz.capital.timeData
const STATS_NAMES = ['progressData', 'gamesPlayed', 'timeData'];

function statsKey(statsMode, name) {
    return `${STORAGE_PREFIX}${statsMode}.${name}`;
}

// Stats saved before there were Modes belong to Country Mode
function moveOldStats() {
    STATS_NAMES.forEach(name => {
        const old = localStorage.getItem(STORAGE_PREFIX + name);
        if (old === null) return;
        if (localStorage.getItem(statsKey('country', name)) === null) {
            localStorage.setItem(statsKey('country', name), old);
        }
        localStorage.removeItem(STORAGE_PREFIX + name);
    });
}

let trendsMode = 'country';

function showTrends(statsMode) {
    trendsMode = statsMode;
    document.querySelectorAll('.modeTabs button').forEach(tab => {
        tab.setAttribute('aria-selected', tab.dataset.mode === statsMode);
    });
    displayProgressTrend();
    displayTimeTrend();
}

function clearChart(chart) {
    if (chart) chart.destroy();
    return null;
}

function displayProgressTrend() {
    const progressData = JSON.parse(localStorage.getItem(statsKey(trendsMode, 'progressData'))) || [];
    const gamesPlayed = parseInt(localStorage.getItem(statsKey(trendsMode, 'gamesPlayed'))) || 0;
    document.getElementById('progressTrend').querySelector('h3').textContent = `Score % · ${gamesPlayed} ${gamesPlayed === 1 ? 'quiz' : 'quizzes'}`;
    if (progressData.length === 0) { progressChart = clearChart(progressChart); return; }
    progressChart = drawTrendChart('trendlineCanvas', progressChart, progressData, '#9CC9EE', '#2E9E6A', 100);
}

function displayTimeTrend() {
    const timeData = JSON.parse(localStorage.getItem(statsKey(trendsMode, 'timeData'))) || [];
    document.getElementById('timeTrend').querySelector('h3').textContent = 'Time (seconds)';
    if (timeData.length === 0) { timeChart = clearChart(timeChart); return; }
    timeChart = drawTrendChart('timeTrendCanvas', timeChart, timeData, '#FFD877', '#E0A912', undefined);
}

function resetStats() {
    Object.keys(MODES).forEach(statsMode => {
        STATS_NAMES.forEach(name => localStorage.removeItem(statsKey(statsMode, name)));
    });
    showTrends(trendsMode);
    alert('All stats have been reset.');
}

// ---- Keyboard and typing ----

const answerInput = document.getElementById('userAnswer');
answerInput.addEventListener('input', function() {
    startTimerOnce();
    renderSuggestions();
});
answerInput.addEventListener('blur', hideSuggestions);
answerInput.addEventListener('keydown', function(event) {
    startTimerOnce();
    const count = suggestionItems.length;
    if (event.key === 'ArrowDown' && count > 0) {
        event.preventDefault();
        setHighlight((highlighted + 1) % count);
    } else if (event.key === 'ArrowUp' && count > 0) {
        event.preventDefault();
        setHighlight((highlighted - 1 + count) % count);
    } else if (event.key === 'Enter') {
        event.preventDefault();  // only answers picked from the dropdown count
        if (highlighted >= 0) pickAnswer(suggestionItems[highlighted]);
    } else if (event.key === 'Escape') {
        hideSuggestions();
    }
});

// In Population Mode the keys 1-5 pick a Population Choice, smallest first
document.addEventListener('keydown', function(event) {
    if (quizOver || !MODES[mode].pickFromChoices || !/^[1-5]$/.test(event.key)) return;
    const button = document.querySelectorAll('#populationChoices button')[Number(event.key) - 1];
    if (button && !button.disabled) button.click();
});

moveOldStats();
