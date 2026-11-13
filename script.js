const QUESTIONS_PER_LEVEL = 4;
const MAX_TRIES = 2;
const MAX_SUGGESTIONS = 5;      // per group (starting / in-between)
const REVEAL_DELAY_MS = 2000;   // how long a revealed answer stays before the next flag
const RIGHT_SHOWN_DELAY_MS = 1200;  // how long a right answer stays highlighted before the next flag
const STORAGE_PREFIX = 'flagQuiz.';  // keeps stats separate from other local quizzes

// Inline icons (stroke follows the text colour)
const ICONS = {
    globe: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20z"></path></svg>',
    people: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"></path><circle cx="17" cy="9" r="2.5"></circle><path d="M17 14c2.4 0 4 1.5 4.5 4"></path></svg>',
    coin: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M14.5 9.5c-.4-1-1.4-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1.1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2.1-.5-2.5-1.5"></path><path d="M12 6.5v1.5M12 16v1.5"></path></svg>',
    compass: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M16 8l-2.5 5.5L8 16l2.5-5.5z"></path></svg>',
    lock: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>',
    heartFull: '<svg width="30" height="30" viewBox="0 0 24 24" fill="#D24A2E" stroke="#D24A2E" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.4 5 6.8 5c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.4 0 5.8 3.3 4.3 6.8C19.5 16.4 12 21 12 21z"></path></svg>',
    heartEmpty: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#B9C6D8" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.4 5 6.8 5c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.4 0 5.8 3.3 4.3 6.8C19.5 16.4 12 21 12 21z"></path></svg>',
    palette: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 0 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.3-1-1.6-1-2.8 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4c0-4.4-4-7.9-9-7.9z"></path><circle cx="7.5" cy="11" r="1"></circle><circle cx="10" cy="7" r="1"></circle><circle cx="15" cy="7.5" r="1"></circle></svg>',
    crossOut: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M8 9l8 6M16 9l-8 6"></path></svg>',
    medal: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#FFC93C" stroke="#B7860B" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M8 2h3l1 5-3.5 1zM16 2h-3l-1 5 3.5 1z" fill="#D24A2E" stroke="#8F2C17"></path><circle cx="12" cy="15" r="6.5"></circle><path d="M12 11.5l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z" fill="#FFF6DB"></path></svg>',
    hatTrick: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#FFC93C" stroke="#B7860B" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><path d="M5 3.5l1.1 2.2 2.4.3-1.8 1.7.5 2.4L5 9l-2.2 1.1.5-2.4L1.5 6l2.4-.3zM19 3.5l1.1 2.2 2.4.3-1.8 1.7.5 2.4L19 9l-2.2 1.1.5-2.4L15.5 6l2.4-.3z"></path><path d="M12 9l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z"></path></svg>',
    noClues: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#FFC93C" stroke="#B7860B" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.7.5 1.1 1.3 1.1 2.2h5.4c0-.9.4-1.7 1.1-2.2A6.5 6.5 0 0 0 12 2.5z"></path><path d="M9.5 19.5h5M10.5 22h3" fill="none"></path><path d="M4 4l16 16" fill="none" stroke="#D24A2E" stroke-width="2.4"></path></svg>',
    levelFiveAce: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#FFC93C" stroke="#B7860B" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M12 1.8l3 6.2 6.8.9-5 4.7 1.3 6.7L12 17l-6.1 3.3 1.3-6.7-5-4.7L9 8z"></path><text x="12" y="15.2" text-anchor="middle" font-size="7.5" font-family="Fredoka, sans-serif" font-weight="700" fill="#7A5600" stroke="none">5</text></svg>',
    record: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#FFC93C" stroke="#B7860B" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M10 1.8h4M12 1.8v2.4M18.5 6l1.4-1.4" fill="none"></path><circle cx="12" cy="13.5" r="8.5"></circle><path d="M12 13.5V8.5M12 13.5l3.2 2" fill="none" stroke="#7A5600" stroke-width="1.8"></path></svg>',
    allModes: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#FFC93C" stroke="#B7860B" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M3 8l4.5 4L12 4.5 16.5 12 21 8l-2 11H5z"></path><circle cx="12" cy="15" r="1.6" fill="#D24A2E" stroke="#8F2C17" stroke-width="1"></circle><path d="M5 21.5h14" fill="none"></path></svg>',
    milestone: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#FFC93C" stroke="#B7860B" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M1.5 21.5l7.5-12 4 6 2.5-3.5 7 9.5z"></path><path d="M9 9.5V2.5" fill="none" stroke="#8F2C17"></path><path d="M9 2.5h6l-1.5 2 1.5 2H9" fill="#D24A2E" stroke="#8F2C17" stroke-width="1"></path></svg>'
};

// Flag Colors, and the swatch each is shown as. A flag has a color when at least a tenth of
// it is that color, and lacks it when none of it is (flag_colors.json keeps no share under 0.5%).
const FLAG_COLORS = {
    red: '#D7263D', orange: '#F28C28', yellow: '#FFD100', green: '#1E9E50',
    blue: '#2B6CD8', white: '#FFFFFF', black: '#111111'
};
const HAS_COLOR_SHARE = 0.1;

function hasColor(entry, color) {
    return (entry.colors[color] || 0) >= HAS_COLOR_SHARE;
}

function lacksColor(entry, color) {
    return !entry.colors[color];
}

// Two flags whose colors are spread almost the same (e.g. Indonesia and Monaco) are never
// offered side by side
function looksAlike(a, b) {
    const difference = Object.keys(FLAG_COLORS).reduce((sum, color) =>
        sum + Math.abs((a.colors[color] || 0) - (b.colors[color] || 0)), 0);
    return difference < 0.1;
}

function listText(words) {
    return words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}` : words[0];
}

function capitalized(word) {
    return word[0].toUpperCase() + word.slice(1);
}

// Rounded to two significant figures, e.g. 17 million km², 640,000 km², 0.49 km²
function areaText(km2) {
    const rounded = Number(km2.toPrecision(2));
    if (rounded >= 1e6) return `${+(rounded / 1e6).toFixed(2)} million km²`;
    return `${rounded.toLocaleString('en')} km²`;
}

function randomPick(list, count) {
    return shuffle([...list]).slice(0, count);
}

function normalize(text) {
    return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function capitalText(entry) {
    return entry.capitals.join(' / ');
}

// One choice per capital name; a Territory's capital may share a Country's (Kingston), and
// either one is right
function capitalChoices() {
    const byText = new Map();
    FLAG_ENTRIES.filter(entry => entry.capitals.length > 0).forEach(entry => {
        const text = capitalText(entry);
        const searchNames = [...entry.capitals, ...entry.capitalOtherNames].map(normalize);
        if (byText.has(text)) byText.get(text).searchNames.push(...searchNames);
        else byText.set(text, { text, searchNames, entry });
    });
    return [...byText.values()];
}

function currencyText(entry) {
    return entry.currencies.map(currency => currency.name).join(' or ');
}

// One choice per currency, however many Countries use it (e.g. the Euro). It is found only
// by the last word of its names ("dollar", not "Canadian"), so typing the Country gives nothing away.
function currencyChoices() {
    const byCode = new Map();
    FLAG_ENTRIES.forEach(entry => {
        entry.currencies.forEach(currency => byCode.set(currency.code, {
            text: currency.name,
            searchNames: [currency.name, ...currency.otherNames].map(name => normalize(name.split(' ').pop())),
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

// The Country next to this one in Population Rank whose population is closest. A Territory
// has no Population Rank, so it gets the Country closest in population.
function similarCountry(entry) {
    const nearby = FLAG_ENTRIES.filter(other => other.kind === 'country' &&
                                                (entry.kind === 'territory' || Math.abs(other.rank - entry.rank) === 1));
    const gap = other => Math.abs(Math.log(other.populationCount / entry.populationCount));
    return nearby.sort((a, b) => gap(a) - gap(b))[0];
}

// One Level per entry in points, each a band of perLevel Population Ranks starting at firstRank
function rankLevels(firstRank, perLevel, points) {
    return points.map((levelPoints, i) => ({
        type: `Level ${i + 1}`, fromRank: firstRank + i * perLevel, toRank: firstRank + (i + 1) * perLevel - 1, points: levelPoints
    }));
}

// Clues are always revealed in this order; the first is free
const CONTINENT_CLUE = { label: 'Continent', value: entry => entry.continent, icon: ICONS.globe };
const POPULATION_CLUE = { label: 'Population', value: entry => entry.population, icon: ICONS.people };
const NEIGHBOUR_CLUE = { label: 'Neighbour', value: entry => entry.neighbour, icon: ICONS.compass };
const COUNTRY_CLUE = { label: 'Country', value: entry => entry.name, icon: ICONS.compass };
const SIMILAR_CLUE = { label: 'Similar population', value: entry => similarCountry(entry).name, icon: ICONS.people };
const MAP_CONTINENT_CLUE = { ...CONTINENT_CLUE, onReveal: entry => zoomMapToContinent(entry.continent) };
const OUTLINE_CLUE = { label: 'Outline', value: () => 'Shown on the map', icon: ICONS.globe, onReveal: entry => outlineMapCountry(entry.code) };
const SYMBOL_CLUE ={ label: 'Symbol', value: entry => entry.currencies.map(currency => currency.symbol).join(' / '), icon: ICONS.coin };
const COLORS_CLUE = {
    label: 'Colors',
    value: entry => capitalized(listText(Object.keys(FLAG_COLORS).filter(color => hasColor(entry, color)))),
    icon: ICONS.palette
};
const CROSS_OUT_CLUE = { label: 'Cross one out', value: () => 'A wrong answer is crossed out', icon: ICONS.crossOut, onReveal: crossOutWrongChoice };

// The levels of "Which is bigger?" and "Which has more people?": the closer the two
// Countries, the harder. Difficult spreads Levels 3-5 over five Levels.
function timesLevels(bands) {
    return bands.map(([leastTimes, mostTimes], i) => ({ type: `Level ${i + 1}`, points: i + 1, leastTimes, mostTimes }));
}
// Closer than 5% is within the data's own error, so never asked
const COMPARE_LEVELS = timesLevels([[4, Infinity], [2.5, 4], [1.6, 2.5], [1.25, 1.6], [1.05, 1.25]]);
const COMPARE_DIFFICULT_LEVELS = timesLevels([[2, 2.5], [1.6, 2], [1.35, 1.6], [1.15, 1.35], [1.05, 1.15]]);

// "Which is bigger?" and "Which has more people?" share everything but the measure
function compareMode(chip, title, question, measure, measureText, canAsk) {
    return {
        chip, title, question,
        learnHeading: 'Pairs to learn',
        learnNote: 'Picked the wrong one, or skipped',
        learnName: (entry, question) => `${entry.name} beats ${question.other.name}`,
        learnDetail: (entry, level, question) => `${measureText(entry)} vs ${measureText(question.other)} · ${level.type}`,
        levels: COMPARE_LEVELS,
        difficultLevels: COMPARE_DIFFICULT_LEVELS,
        allPool: entry => entry.rank <= 100,
        canAsk,
        clues: [],
        answer: (entry, question) => `${entry.name} (${measureText(entry)} vs ${measureText(question.other)})`,
        // Both Countries come from the whole pool; the Level only sets how close they are.
        // A Country comes up at most twice a Quiz, since an Area may have fewer than 40.
        buildLevelQuestions: (level, pool, used) => {
            const pairs = [];
            pool.forEach((a, i) => pool.slice(i + 1).forEach(b => {
                const [big, small] = measure(a) > measure(b) ? [a, b] : [b, a];
                const times = measure(big) / measure(small);
                if (times >= level.leastTimes && times < level.mostTimes) pairs.push([big, small]);
            }));
            const found = [];
            for (const [big, small] of shuffle(pairs)) {
                if (found.length === QUESTIONS_PER_LEVEL) break;
                if ((used.get(big) || 0) >= 2 || (used.get(small) || 0) >= 2) continue;
                used.set(big, (used.get(big) || 0) + 1).set(small, (used.get(small) || 0) + 1);
                found.push({ entry: big, other: small, level });
            }
            return found;
        },
        makeChoices: question => shuffle([question.entry, question.other]).map(entry => ({
            flag: entry.flag, entry, right: entry === question.entry, caption: `${entry.name} · ${measureText(entry)}`
        })),
        pickFromChoices: true,
        choiceFlags: true,
        hidesFlag: true,
        tries: 1,
        worthFor: 'pair',
        choices: []
    };
}

// Each choice is one line in the dropdown: what it shows, the names it is found by
// (lower case, no accents) and the Flag Entry it stands for
// Each Mode asks only the Flag Entries it has a clear answer for: a capital, a currency,
// a shape on the World Map, or a settled population
function hasCapital(entry) {
    return entry.capitals.length > 0;
}

function isSettled(entry) {
    return entry.settled !== false;
}

const COUNTRY_LEVELS = [
    { type: 'Level 1', fromRank: 1, toRank: 30, points: 1 },
    { type: 'Level 2', fromRank: 31, toRank: 70, points: 2 },
    { type: 'Level 3', fromRank: 71, toRank: 120, points: 3 },
    { type: 'Level 4', fromRank: 121, toRank: 197, points: 4 },
    { type: 'Level 5', territories: true, points: 5 }
];

const MODES = {
    country: {
        chip: 'Countries',
        title: 'Name the country',
        question: 'Which country is this?',
        placeholder: 'Start typing a country...',
        learnHeading: 'Flags to learn',
        learnNote: 'Missed, skipped, or needed a paid clue',
        learnName: entry => entry.name,
        learnDetail: (entry, level) => `${entry.continent} · ${level.type}`,
        levels: COUNTRY_LEVELS,
        allowsTerritories: true,
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
        title: 'Name the capital',
        question: 'What is the capital of this country?',
        placeholder: 'Start typing a capital...',
        learnHeading: 'Capitals to learn',
        learnNote: 'Missed, skipped, or needed a paid clue',
        learnName: entry => capitalText(entry),
        learnDetail: (entry, level) => `Capital of ${entry.name} · ${level.type}`,
        // The 20 best-known Countries are left out, so Level 1 starts at rank 21
        levels: rankLevels(21, 30, [1, 2, 3, 4, 5]),
        clues: [CONTINENT_CLUE, POPULATION_CLUE, COUNTRY_CLUE],
        canAsk: hasCapital,
        answer: entry => `${capitalText(entry)} (${entry.name})`,
        isRight: (choice, entry) => choice.text === capitalText(entry),
        choices: capitalChoices()
    },
    // A currency can belong to several Countries, so a choice is right if this Country
    // uses it, and a Quiz limits how often one currency is the answer (see tryBuildQuestions)
    currency: {
        chip: 'Currencies',
        title: 'Name the currency',
        question: 'What currency does this country use?',
        placeholder: 'Start typing a currency...',
        learnHeading: 'Currencies to learn',
        learnNote: 'Missed, skipped, or needed a paid clue',
        learnName: entry => currencyText(entry),
        learnDetail: (entry, level) => `Currency of ${entry.name} · ${level.type}`,
        levels: rankLevels(1, 20, [1, 2, 3, 4, 5]),
        clues: [CONTINENT_CLUE, COUNTRY_CLUE, SYMBOL_CLUE],
        canAsk: entry => entry.currencies.length > 0,
        answer: entry => `${currencyText(entry)} (${entry.name})`,
        answerKeys: entry => entry.currencies.map(currency => currency.code),
        isRight: (choice, entry) => entry.currencies.some(currency => currency.code === choice.code),
        maxSuggestions: 25,  // all 21 dollars show at once
        choices: currencyChoices()
    },
    // Picked from five Population Choices instead of the dropdown; Clues are free and a
    // right second Try is worth one point less
    population: {
        chip: 'Population',
        title: 'Guess the population',
        question: 'How many people live in this country?',
        learnHeading: 'Populations to learn',
        learnNote: 'Missed, skipped, or needed a second try',
        learnName: entry => entry.name,
        learnDetail: (entry, level) => `${populationText(entry.populationCount)} · ${level.type}`,
        // Population Choices are evenly spaced multiples of one step; starting higher than
        // 1x keeps neighbouring Choices further apart by factor. Level 5 has no Higher/Lower
        // hint, since with three Choices it would give the answer away.
        levels: rankLevels(1, 20, [2, 2, 2, 4, 5]).map((level, i) => ({ ...level, ...[
            { choiceCount: 5, lowestMultiple: 1, hint: true },
            { choiceCount: 5, lowestMultiple: 1, hint: true },
            { choiceCount: 5, lowestMultiple: 2, hint: true },
            { choiceCount: 5, lowestMultiple: 2, hint: true },
            { choiceCount: 3, lowestMultiple: 2, hint: false }
        ][i] })),
        clues: [CONTINENT_CLUE, COUNTRY_CLUE, SIMILAR_CLUE],
        canAsk: isSettled,
        answer: entry => populationText(entry.populationCount),
        makeChoices: question => populationChoices(question.entry, question.level).map(choice => ({
            text: populationText(choice.count), count: choice.count, right: choice.right
        })),
        wrongTryMessage: (choice, question) => {
            if (!question.level.hint) return 'Not quite! Try again.';
            return question.entry.populationCount > choice.count ? 'More people than that! ↑' : 'Fewer people than that! ↓';
        },
        pickFromChoices: true,
        secondTryCosts: true,
        freeClues: true,
        choices: []
    },
    // Answered by clicking the World Map; a wrong first Try gets a Nudge
    map: {
        chip: 'Map',
        title: 'Find it on the map',
        question: 'Where is this country? Click it on the map.',
        learnHeading: 'Countries to find',
        learnNote: 'Missed, skipped, needed a second try or a paid clue',
        learnName: entry => entry.name,
        learnDetail: (entry, level) => `${entry.continent} · ${level.type}`,
        levels: rankLevels(21, 30, [1, 2, 3, 4, 5]),
        clues: [MAP_CONTINENT_CLUE, NEIGHBOUR_CLUE, COUNTRY_CLUE],
        canAsk: entry => mapShapes.has(entry.code),  // a few are too small to draw
        answer: entry => entry.name,
        clickOnMap: true,
        isHitOnMap: (entry, lon, lat) => isMapHit(entry.code, lon, lat),
        nudgeOnMap: (entry, lon, lat) => mapNudge(entry.code, lon, lat),
        showOnMap: (entry, found) => {
            fillMapCountry(entry.code, found ? 'found' : 'missed');
            if (!found) zoomMapToCountry(entry.code);
        },
        secondTryCosts: true,
        choices: []
    },
    // Like Map Mode, but the player clicks the capital city, seeing only the flag
    capitalMap: {
        chip: 'Capital on map',
        title: 'Find the capital',
        question: 'Where is the capital of this country? Click it on the map.',
        learnHeading: 'Capitals to find',
        learnNote: 'Missed, skipped, needed a second try or a paid clue',
        learnName: entry => capitalText(entry),
        learnDetail: (entry, level) => `Capital of ${entry.name} · ${level.type}`,
        levels: rankLevels(1, 20, [1, 2, 3, 4, 5]),
        clues: [MAP_CONTINENT_CLUE, COUNTRY_CLUE, OUTLINE_CLUE],
        canAsk: entry => hasCapital(entry) && mapShapes.has(entry.code),
        answer: entry => `${capitalText(entry)} (${entry.name})`,
        clickOnMap: true,
        isHitOnMap: (entry, lon, lat) => isCapitalHit(entry.capitalPlaces, lon, lat),
        nudgeOnMap: (entry, lon, lat) => capitalNudge(entry.capitalPlaces, lon, lat),
        showOnMap: (entry, found) => {
            markCapitals(entry.capitalPlaces, found ? 'found' : 'missed');
            if (!found) zoomMapToCapitals(entry.capitalPlaces);
        },
        secondTryCosts: true,
        choices: []
    },
    // The player sees a name and picks its flag from four, the others from the same continent
    pickFlag: {
        chip: 'Pick the flag',
        title: 'Pick the flag',
        question: 'Which flag belongs here?',
        learnHeading: 'Flags to learn',
        learnNote: 'Missed, skipped, needed a second try or a paid clue',
        learnName: entry => entry.name,
        learnDetail: (entry, level) => `${entry.continent} · ${level.type}`,
        levels: COUNTRY_LEVELS,
        allowsTerritories: true,
        clues: [COLORS_CLUE, CROSS_OUT_CLUE],
        answer: entry => entry.name,
        makeQuestion: (entry, level, pool) => {
            const continent = entry.continent.split(' / ')[0];
            const fits = other => other !== entry && !looksAlike(other, entry);
            let others = pool.filter(other => fits(other) && other.continent.includes(continent));
            if (others.length < 3) others = pool.filter(fits);
            const choices = [entry, ...randomPick(others, 3)];
            return { entry, level, choices: shuffle(choices).map(choice => ({
                flag: choice.flag, entry: choice, right: choice === entry, caption: choice.name
            })) };
        },
        prompt: question => ({ text: question.entry.name }),
        pickFromChoices: true,
        choiceFlags: true,
        hidesFlag: true,
        secondTryCosts: true,
        choices: []
    },
    // The player sees a Flag Color and picks the one name of four whose flag has it;
    // the other three flags have none of it
    flagColor: {
        chip: 'Flag colors',
        title: 'Spot the color',
        question: 'Whose flag has this color?',
        learnHeading: 'Flags to learn',
        learnNote: 'Missed, skipped, needed a second try or a paid clue',
        learnName: entry => entry.name,
        learnDetail: (entry, level, question) => `Has ${question.color} · ${level.type}`,
        levels: COUNTRY_LEVELS,
        allowsTerritories: true,
        clues: [CONTINENT_CLUE, CROSS_OUT_CLUE],
        answer: entry => entry.name,
        makeQuestion: (entry, level, pool) => {
            for (const color of shuffle(Object.keys(FLAG_COLORS).filter(color => hasColor(entry, color)))) {
                // Others of about the same fame first, from anywhere in the pool if too few
                let others = level.pool.filter(other => other !== entry && lacksColor(other, color));
                if (others.length < 3) others = pool.filter(other => other !== entry && lacksColor(other, color));
                if (others.length < 3) continue;
                const choices = [entry, ...randomPick(others, 3)];
                return { entry, level, color, choices: shuffle(choices).map(choice => ({
                    text: choice.name, flag: choice.flag, entry: choice, right: choice === entry
                })) };
            }
            return null;
        },
        prompt: question => ({ text: capitalized(question.color), swatch: FLAG_COLORS[question.color] }),
        worthFor: 'question',
        pickFromChoices: true,
        hidesFlag: true,
        secondTryCosts: true,
        choices: []
    },
    biggerLand: compareMode('Bigger land', 'Which is bigger?', 'Which country has more land?',
                            entry => entry.area, entry => areaText(entry.area), () => true),
    morePeople: compareMode('More people', 'Which has more people?', 'Which country has more people?',
                            entry => entry.populationCount, entry => populationText(entry.populationCount), isSettled)
};

// Where the Questions come from, chosen on the start screen. A continent group asks only
// its Countries; Russia and Turkey are in both Europe and Asia.
const AREAS = {
    all: { label: 'Whole world' },
    africa: { label: 'Africa', continents: ['Africa'] },
    americas: { label: 'Americas', continents: ['North America', 'South America'] },
    asiaOceania: { label: 'Asia & Oceania', continents: ['Asia', 'Oceania'] },
    europe: { label: 'Europe', continents: ['Europe'] },
    territories: { label: 'Territories only' }
};
const DIFFICULTIES = { easy: 'Easy', difficult: 'Difficult' };

function savedSetting(name, allowed, fallback) {
    const saved = localStorage.getItem(STORAGE_PREFIX + name);
    return saved in allowed ? saved : fallback;
}

let area = savedSetting('area', AREAS, 'all');
let difficulty = savedSetting('difficulty', DIFFICULTIES, 'easy');

let mode = 'country';
let quizLevels = [], questions = [], questionResults = [], currentQuestion = 0, totalPoints = 0, tries = 0, cluesShown = 0;
let flagsToLearn = [], quizOver = true, waiting = false, answeredAny = false;
let questionPoints = [], cluesUsed = 0;  // per Question, and in the whole Quiz, for the badges
let suggestionItems = [], highlighted = -1;

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

// Like the multiplication quiz, the clock waits for the player's first action. Until then
// the player can go back to all Modes; after it, End quiz takes over.
function startTimerOnce() {
    if (!timerStarted && !quizOver) {
        startTimer();
        timerStarted = true;
        showQuizExit(true);
    }
}

function showQuizExit(started) {
    document.getElementById('backButton').hidden = started;
    document.getElementById('endButton').hidden = !started;
}

// Leaves a Quiz that hasn't started, without saving anything
function leaveQuiz() {
    quizOver = true;
    stopTimer();
    hideSuggestions();
    showStart();
}

function levels() {
    return quizLevels;
}

function calculateMaxPoints() {
    return questions.reduce((sum, question) => sum + question.level.points, 0);
}

function displayMaxPoints() {
    document.getElementById('maxPointsDisplay').textContent = `Maximum possible points: ${calculateMaxPoints()}`;
}

function levelPool(level) {
    return level.pool;
}

// The Flag Entries one of a Mode's own Levels holds, by Population Rank or as Territories
function bandPool(level) {
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

// Cuts a list into count runs of (nearly) the same length, keeping its order
function splitInto(list, count) {
    return Array.from({ length: count }, (_, i) =>
        list.slice(Math.round(i * list.length / count), Math.round((i + 1) * list.length / count)));
}

// Territories only offers every Mode on Difficult, but on Easy only the flag Modes
function modeAllowed(modeName) {
    return area !== 'territories' || difficulty === 'difficult' || !!MODES[modeName].allowsTerritories;
}

function canAsk(settings, entry) {
    return !settings.canAsk || settings.canAsk(entry);
}

// A continent group holds its own Countries and Territories; Russia and Turkey are in both
// Europe and Asia
function inArea(entry) {
    return !AREAS[area].continents || AREAS[area].continents.some(continent => entry.continent.includes(continent));
}

// The Countries the Mode can ask about in the chosen Area, by Population Rank
function areaCountries(settings) {
    return FLAG_ENTRIES.filter(entry => entry.kind === 'country' && inArea(entry) && canAsk(settings, entry))
                       .sort((a, b) => a.rank - b.rank);
}

// The Territories the Mode can ask about in the chosen Area, most people first
function areaTerritories(settings) {
    return FLAG_ENTRIES.filter(entry => entry.kind === 'territory' && inArea(entry) && canAsk(settings, entry))
                       .sort((a, b) => b.populationCount - a.populationCount);
}

// Every Flag Entry the Mode can ask about in the chosen Area and Difficulty, easiest first.
// Easy keeps Whole world to each Mode's own Levels and a continent to its Countries;
// Difficult takes in every Country and Territory with a clear answer.
function areaPool(settings) {
    if (area === 'territories') return areaTerritories(settings);
    if (difficulty === 'difficult') return [...areaCountries(settings), ...areaTerritories(settings)];
    if (area !== 'all') return areaCountries(settings);
    if (settings.allPool) return areaCountries(settings).filter(settings.allPool);
    return settings.levels.flatMap(bandPool).filter(entry => canAsk(settings, entry));
}

// The five Levels of this Quiz. Whole world and Easy keeps each Mode's own Levels, and a
// continent splits its Countries into five equal Levels. Difficult splits the Countries from
// where the Mode's own Level 3 starts (in a continent, all but the best-known two fifths)
// down to the smallest into Levels 1-4, and Level 5 is the Territories. Territories only
// splits them into five by population, Difficult leaving out the best-known two fifths.
function buildLevels() {
    const settings = MODES[mode];
    const base = settings.levels;
    const named = (pools, territoryLevel) => pools.map((pool, i) => ({
        ...base[i], type: `Level ${i + 1}`, pool, territories: territoryLevel && i === pools.length - 1
    }));
    if (settings.buildLevelQuestions) {
        const pool = areaPool(settings);
        const timesLevels = difficulty === 'difficult' ? settings.difficultLevels : base;
        return timesLevels.map(level => ({ ...level, pool }));
    }
    if (area === 'territories') {
        const pool = areaPool(settings);
        return named(splitInto(difficulty === 'difficult' ? pool.slice(Math.round(pool.length * 0.4)) : pool, 5), false);
    }
    if (difficulty === 'easy') {
        if (area !== 'all') return named(splitInto(areaPool(settings), 5), false);
        return named(base.map(level => bandPool(level).filter(entry => canAsk(settings, entry))), !!base[4].territories);
    }
    const countries = areaCountries(settings);
    const harder = area === 'all'
        ? countries.filter(entry => entry.rank >= base[2].fromRank)
        : countries.slice(Math.round(countries.length * 0.4));
    return named([...splitInto(harder, 4), areaTerritories(settings)], true);
}

// Pairs are matched at random, which can now and then leave a small Area short, so the
// fullest of a few tries is kept
function buildQuestions() {
    let best = [];
    for (let attempt = 0; attempt < 10 && best.length < quizLevels.length * QUESTIONS_PER_LEVEL; attempt++) {
        const tried = tryBuildQuestions();
        if (tried.length > best.length) best = tried;
    }
    return best;
}

function tryBuildQuestions() {
    const settings = MODES[mode];
    const answerKeys = settings.answerKeys;
    const keyCounts = new Map(), usedEntries = new Set(), timesAsked = new Map();
    // On Difficult an answer (a currency) may come up three times a Quiz, but never twice in
    // a Level, so the many places sharing the Euro can still be asked; Easy keeps every
    // answer different
    const mostRepeats = difficulty === 'difficult' ? 3 : 1;
    const result = [];
    const pool = areaPool(settings);
    quizLevels.forEach((level, levelIndex) => {
        if (settings.buildLevelQuestions) {
            settings.buildLevelQuestions(level, level.pool, timesAsked)
                    .forEach(question => result.push({ ...question, levelIndex }));
            return;
        }
        // A Level short of Flag Entries (e.g. Currencies shared in Europe) borrows from the
        // harder Levels, then the easier ones, then whatever else the Area has, hardest first.
        // A Level of Countries borrows Territories only when nothing else is left.
        const later = quizLevels.slice(levelIndex + 1), earlier = quizLevels.slice(0, levelIndex).reverse();
        const borrowed = [...later, ...earlier].filter(other => level.territories || !other.territories);
        const territoryLevels = level.territories ? [] : quizLevels.filter(other => other.territories);
        const inLevels = new Set(quizLevels.flatMap(other => other.pool));
        const candidates = [level, ...borrowed].flatMap(other => shuffle([...other.pool]))
            .concat(pool.filter(entry => !inLevels.has(entry)).reverse())
            .concat(territoryLevels.flatMap(other => shuffle([...other.pool])));
        const levelKeys = new Set();
        let picked = 0;
        for (const entry of candidates) {
            if (picked === QUESTIONS_PER_LEVEL) break;
            if (usedEntries.has(entry)) continue;
            const keys = answerKeys ? answerKeys(entry) : [];
            if (keys.some(key => levelKeys.has(key) || (keyCounts.get(key) || 0) >= mostRepeats)) continue;
            const question = settings.makeQuestion ? settings.makeQuestion(entry, level, pool) : { entry, level };
            if (!question) continue;
            keys.forEach(key => {
                levelKeys.add(key);
                keyCounts.set(key, (keyCounts.get(key) || 0) + 1);
            });
            usedEntries.add(entry);
            result.push({ ...question, levelIndex });
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
    renderStart();
    showScreen('start');
}

function quizLabel() {
    return [MODES[mode].chip, area === 'all' ? '' : AREAS[area].label, difficulty === 'difficult' ? 'Difficult' : '']
        .filter(Boolean).join(' · ');
}

function startQuiz(newMode) {
    if (!modeAllowed(newMode)) return;
    mode = newMode;
    const settings = MODES[mode];
    document.getElementById('modeChip').textContent = quizLabel();
    document.getElementById('questionText').textContent = settings.question;
    document.getElementById('userAnswer').placeholder = settings.placeholder || '';
    document.getElementById('learnHeading').textContent = settings.learnHeading;
    document.getElementById('learnNote').textContent = settings.learnNote;
    document.querySelector('.answerBox').hidden = !!(settings.pickFromChoices || settings.clickOnMap);
    document.getElementById('choices').hidden = !settings.pickFromChoices;
    document.getElementById('choices').classList.toggle('flagChoices', !!settings.choiceFlags);
    document.getElementById('choices').classList.toggle('twoFlags', !!settings.buildLevelQuestions);
    document.querySelector('.postcard').hidden = !!settings.hidesFlag;
    document.getElementById('promptCard').hidden = !settings.prompt;
    document.getElementById('quiz').classList.toggle('noClues', settings.clues.length === 0);
    document.getElementById('quiz').classList.toggle('mapMode', !!settings.clickOnMap);
    document.getElementById('mapBox').hidden = !settings.clickOnMap;

    quizLevels = buildLevels();
    questions = buildQuestions();
    displayMaxPoints();
    document.getElementById('totalQuestions').textContent = `${questions.length}`;
    questionResults = [];
    questionPoints = [];
    cluesUsed = 0;
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
    showQuizExit(false);

    stopTimer();
    timerStarted = false;
    timeElapsed = 0;
    document.getElementById('timer').textContent = formatTime(timeElapsed);

    buildProgressStops();
    nextQuestion();
}

function nextQuestion() {
    currentQuestion++;

    if (currentQuestion > questions.length) {
        endQuiz();
        return;
    }

    const question = questions[currentQuestion - 1];
    const settings = MODES[mode];
    tries = 0;
    cluesShown = 0;

    if (!settings.hidesFlag) showFlag(question.entry.flag);
    if (settings.prompt) showPrompt(settings.prompt(question));
    document.getElementById('questionCounter').textContent = `${currentQuestion}`;

    updateProgressStops();
    renderLevelCard();
    renderClues();

    if (settings.pickFromChoices) {
        renderChoices(settings.makeChoices ? settings.makeChoices(question) : question.choices);
        setControlsEnabled(true);
        return;
    }
    if (settings.clickOnMap) {
        setUpWorldMap(document.getElementById('mapBox'), pickOnMap);
        resetMap();
        setControlsEnabled(true);
        return;
    }
    setControlsEnabled(true);
    const input = document.getElementById('userAnswer');
    input.value = '';
    input.classList.remove('rightAnswer');
    input.focus();
}

// The name or Flag Color the player is asked about, where the flag usually is
function showPrompt(prompt) {
    document.getElementById('promptText').textContent = prompt.text;
    const swatch = document.getElementById('promptSwatch');
    swatch.hidden = !prompt.swatch;
    if (prompt.swatch) swatch.style.background = prompt.swatch;
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

function currentQuestionData() {
    return questions[currentQuestion - 1];
}

function currentEntry() {
    return currentQuestionData().entry;
}

function maxTries() {
    return MODES[mode].tries || MAX_TRIES;
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
    document.querySelectorAll('#choices button:not(.crossed)').forEach(button => button.disabled = !enabled);
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
        const count = questions.filter(question => question.levelIndex === levelIndex).length;
        for (let i = 0; i < count; i++) {
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
    const currentLevel = currentQuestionData() ? currentQuestionData().levelIndex : -1;
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
    document.getElementById('worthWord').textContent = `${plural(worth, 'point')} for this ${MODES[mode].worthFor || 'flag'}`;

    const triesLeft = maxTries() - tries;
    let hearts = '';
    for (let i = 0; i < maxTries(); i++) {
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
    const most = MODES[mode].maxSuggestions || MAX_SUGGESTIONS;
    return {
        starting: starting.sort(byName).slice(0, most),
        inbetween: inbetween.sort(byName).slice(0, most)
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
        if (Number(li.dataset.index) === index) li.scrollIntoView({ block: 'nearest' });
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
        if (paidClues() > 0) flagsToLearn.push(currentQuestionData());
        input.value = answerText();
        input.classList.add('rightAnswer');
        answeredRight(RIGHT_SHOWN_DELAY_MS);
        return;
    }

    tries++;
    renderLevelCard();
    if (tries >= maxTries()) {
        revealAnswer(`Not quite! It was ${answerText()}`);
    } else {
        showMessage('Not quite! Try again.', 'incorrect');
        input.value = '';
        input.focus();
    }
}

function answerText() {
    return MODES[mode].answer(currentEntry(), currentQuestionData());
}

// Scores a right answer and names it, then keeps it on screen for a moment before the
// next flag, in every Mode
function answeredRight(holdMs) {
    const points = questionWorth();
    totalPoints += points;
    questionPoints[currentQuestion - 1] = points;
    updatePointsDisplay();
    showMessage(`Correct! +${points} · ${answerText()}`, 'correct');
    questionResults[currentQuestion - 1] = 'correct';
    updateProgressStops();
    waiting = true;
    setControlsEnabled(false);
    setTimeout(() => {
        waiting = false;
        if (!quizOver) nextQuestion();
    }, holdMs);
}

function revealAnswer(text) {
    const entry = currentEntry();
    showMessage(text, 'incorrect');
    document.getElementById('userAnswer').value = answerText();
    document.querySelectorAll('#choices button.isRight').forEach(button => button.classList.add('shown'));
    showChoiceCaptions();
    if (MODES[mode].clickOnMap) MODES[mode].showOnMap(entry, false);
    flagsToLearn.push(currentQuestionData());
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
    revealAnswer(`Skipped! It was ${answerText()}`);
}

function showClue() {
    if (waiting || quizOver || cluesShown >= MODES[mode].clues.length) return;
    startTimerOnce();
    cluesShown++;
    cluesUsed++;
    renderClues();
    renderLevelCard();
    const clue = MODES[mode].clues[cluesShown - 1];
    if (clue.onReveal) clue.onReveal(currentEntry());
    if (!MODES[mode].pickFromChoices && !MODES[mode].clickOnMap) document.getElementById('userAnswer').focus();
}

// ---- Choices: Population Choices, flags or names ----

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

const CHOICE_SHOWN_DELAY_MS = 1800;  // how long whose flags they were stays after a right answer

// A Choice shows a text or a flag. Where flags are involved, whose they are (the caption)
// appears once the Question ends, so every Question also teaches the other flags.
function renderChoices(choices) {
    const container = document.getElementById('choices');
    container.innerHTML = '';
    container.classList.remove('revealed');
    choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'choiceButton' + (choice.right ? ' isRight' : '');
        if (MODES[mode].choiceFlags) {
            const img = document.createElement('img');
            img.src = choice.flag;
            img.alt = `Flag ${index + 1}`;
            button.appendChild(img);
            const caption = document.createElement('span');
            caption.className = 'choiceCaption';
            caption.textContent = choice.caption;
            caption.hidden = true;
            button.appendChild(caption);
        } else {
            const text = document.createElement('span');
            text.textContent = choice.text;
            button.appendChild(text);
            if (choice.flag) {
                const img = document.createElement('img');
                img.src = choice.flag;
                img.alt = '';
                img.className = 'choiceCaption';
                img.hidden = true;
                button.appendChild(img);
            }
        }
        button.addEventListener('click', () => pickChoice(button, choice));
        container.appendChild(button);
    });
}

function showChoiceCaptions() {
    document.getElementById('choices').classList.add('revealed');
    document.querySelectorAll('#choices .choiceCaption').forEach(caption => caption.hidden = false);
}

function crossOut(button) {
    button.classList.add('crossed');
    button.disabled = true;
}

// The Cross one out Clue
function crossOutWrongChoice() {
    const wrong = [...document.querySelectorAll('#choices button:not(.isRight):not(.crossed)')];
    if (wrong.length > 0) crossOut(wrong[Math.floor(Math.random() * wrong.length)]);
}

function pickChoice(button, choice) {
    if (waiting || quizOver) return;
    answeredAny = true;
    startTimerOnce();
    const settings = MODES[mode];

    if (choice.right) {
        if (tries > 0 || paidClues() > 0) flagsToLearn.push(currentQuestionData());
        button.classList.add('shown');
        // Where flags are involved, a little longer to see whose they all were
        const captions = !!document.querySelector('#choices .choiceCaption');
        showChoiceCaptions();
        answeredRight(captions ? CHOICE_SHOWN_DELAY_MS : RIGHT_SHOWN_DELAY_MS);
        return;
    }

    tries++;
    crossOut(button);
    renderLevelCard();
    if (tries >= maxTries()) {
        revealAnswer(`Not quite! It was ${answerText()}`);
    } else {
        showMessage(settings.wrongTryMessage ? settings.wrongTryMessage(choice, currentQuestionData()) : 'Not quite! Try again.', 'incorrect');
    }
}

// ---- Clicking the World Map ----

const MAP_FOUND_DELAY_MS = 1200;  // how long a found Country or capital stays green before the next flag

function pickOnMap(lon, lat) {
    const settings = MODES[mode];
    if (waiting || quizOver || !settings.clickOnMap) return;
    answeredAny = true;
    startTimerOnce();
    const entry = currentEntry();
    markMapClick(lon, lat);

    if (settings.isHitOnMap(entry, lon, lat)) {
        if (tries > 0 || paidClues() > 0) flagsToLearn.push(currentQuestionData());
        settings.showOnMap(entry, true);
        answeredRight(MAP_FOUND_DELAY_MS);
        return;
    }

    tries++;
    renderLevelCard();
    if (tries >= maxTries()) {
        revealAnswer(`Not quite! It was ${answerText()}`);
    } else {
        showMessage(`Not quite! Try further ${settings.nudgeOnMap(entry, lon, lat)}.`, 'incorrect');
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
    const perfect = totalPoints === maxPoints;
    showBadgesEarned(answeredAny ? awardBadges(perfect) : [], perfect);

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
    flagsToLearn.forEach(question => {
        const { entry, level } = question;
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
        name.textContent = MODES[mode].learnName(entry, question);
        const detail = document.createElement('div');
        detail.className = 'learnDetail';
        detail.textContent = MODES[mode].learnDetail(entry, level, question);
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
        Object.keys(DIFFICULTIES).forEach(level => RUN_NAMES.forEach(name =>
            localStorage.removeItem(statsKey(statsMode, `${level}.${name}`))));
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

// When the answer is picked from Choices, the keys 1-5 pick one, first to last
document.addEventListener('keydown', function(event) {
    if (quizOver || !MODES[mode].pickFromChoices || !/^[1-5]$/.test(event.key)) return;
    const button = document.querySelectorAll('#choices button')[Number(event.key) - 1];
    if (button && !button.disabled) button.click();
});

// ---- Badges ----

// Badges are earned only in Whole world Quizzes, each Mode's separately for Easy and
// Difficult, and stay when stats are reset. A Continent or Territories only Quiz neither
// earns one nor breaks a Hat trick run.
const BADGES_KEY = STORAGE_PREFIX + 'badges';
const RIGHT_ANSWERS_KEY = STORAGE_PREFIX + 'rightAnswers';
const BADGE_KINDS = {
    perfect: { label: 'Perfect score', icon: ICONS.medal, banner: 'Perfect score!' },
    hatTrick: { label: 'Hat trick', icon: ICONS.hatTrick, banner: 'Hat trick!' },
    noClues: { label: 'No clues', icon: ICONS.noClues, banner: 'No clues!' },
    levelFiveAce: { label: 'Level 5 ace', icon: ICONS.levelFiveAce, banner: 'Level 5 ace!' },
    record: { label: 'Record holder', icon: ICONS.record, banner: 'New record!' }
};
const MILESTONES = [50, 100, 250, 500, 1000, 2500, 5000, 10000];  // right answers in all
const RECORD_AFTER_QUIZZES = 5;  // a Record needs this many Quizzes played before it
// Kept per Mode and Difficulty, and cleared with the stats: the 100% run for the Hat trick,
// the Whole world Quizzes played and the fastest 100% Quiz, for Record holder
const RUN_NAMES = ['perfectRun', 'wholeWorldQuizzes', 'bestPerfectTime'];

function loadBadges() {
    return JSON.parse(localStorage.getItem(BADGES_KEY)) || {};
}

function today() {
    return new Date().toLocaleDateString('en-CA');  // e.g. 2026-11-10, in local time
}

function dateText(day, withYear) {
    return new Date(`${day}T00:00`).toLocaleDateString('en-GB', withYear
        ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });
}

function rightAnswersSoFar() {
    return parseInt(localStorage.getItem(RIGHT_ANSWERS_KEY)) || 0;
}

// Full points on every Level 5 Question of the Quiz
function acedLevelFive() {
    const lastLevel = quizLevels.length - 1;
    const asked = questions.map((question, i) => ({ question, i })).filter(({ question }) => question.levelIndex === lastLevel);
    return asked.length > 0 && asked.every(({ question, i }) => questionPoints[i] === question.level.points);
}

// The modes still missing a Perfect score badge on this Difficulty, for All modes
function modesWithoutPerfect(badges, level) {
    return Object.keys(MODES).filter(badgeMode => !badges[`${badgeMode}.${level}.perfect`]);
}

// All modes and the Milestones, which may also come from badges and right answers counted
// before they existed
function awardGoals(badges, earned) {
    Object.keys(DIFFICULTIES).forEach(level => {
        if (!badges[`allModes.${level}`] && modesWithoutPerfect(badges, level).length === 0) {
            badges[`allModes.${level}`] = { first: today() };
            earned.push({ kind: 'allModes', level });
        }
    });
    const total = rightAnswersSoFar();
    MILESTONES.filter(count => total >= count && !badges[`milestone.${count}`]).forEach(count => {
        badges[`milestone.${count}`] = { first: today() };
        earned.push({ kind: 'milestone', count, total });
    });
}

function awardBadges(perfect) {
    if (area !== 'all') return [];
    const badges = loadBadges();
    const earned = [];
    const award = (kind, extra = {}) => {
        const key = `${mode}.${difficulty}.${kind}`;
        const badge = badges[key] || { first: today(), count: 0 };
        badge.count++;
        badges[key] = badge;
        earned.push({ kind, count: badge.count, ...extra });
        return badge;
    };
    const runKey = statsKey(mode, `${difficulty}.perfectRun`);
    const quizzesKey = statsKey(mode, `${difficulty}.wholeWorldQuizzes`);
    const bestKey = statsKey(mode, `${difficulty}.bestPerfectTime`);
    const quizzesBefore = parseInt(localStorage.getItem(quizzesKey)) || 0;
    localStorage.setItem(quizzesKey, quizzesBefore + 1);
    if (perfect) {
        const run = (parseInt(localStorage.getItem(runKey)) || 0) + 1;
        localStorage.setItem(runKey, run);
        award('perfect');
        if (run % 3 === 0) award('hatTrick');
        if (cluesUsed === 0 && MODES[mode].clues.length > 0) award('noClues');
        // Faster than every earlier 100% Quiz; the first ones only set the time to beat
        const best = parseFloat(localStorage.getItem(bestKey));
        if (isNaN(best) || timeElapsed < best) {
            localStorage.setItem(bestKey, timeElapsed);
            if (quizzesBefore >= RECORD_AFTER_QUIZZES) {
                award('record', { time: timeElapsed, beaten: isNaN(best) ? null : best }).best = timeElapsed;
            }
        }
    } else {
        localStorage.setItem(runKey, 0);
    }
    if (acedLevelFive()) award('levelFiveAce');
    const rightAnswers = questionResults.filter(result => result === 'correct').length;
    localStorage.setItem(RIGHT_ANSWERS_KEY, rightAnswersSoFar() + rightAnswers);
    awardGoals(badges, earned);
    localStorage.setItem(BADGES_KEY, JSON.stringify(badges));
    return earned;
}

// Right answers weren't counted before the Milestones, only each Quiz's percentage of points,
// so each earlier Quiz counts as that share of 20 right answers, rounded down
function countEarlierRightAnswers() {
    if (localStorage.getItem(RIGHT_ANSWERS_KEY) !== null) return;
    const estimate = Object.keys(MODES).reduce((sum, statsMode) => {
        const percentages = JSON.parse(localStorage.getItem(statsKey(statsMode, 'progressData'))) || [];
        return sum + percentages.reduce((modeSum, percentage) => modeSum + Math.floor(percentage / 100 * 20), 0);
    }, 0);
    localStorage.setItem(RIGHT_ANSWERS_KEY, estimate);
    const badges = loadBadges();
    awardGoals(badges, []);
    localStorage.setItem(BADGES_KEY, JSON.stringify(badges));
}

function badgeIcon(icon) {
    const span = document.createElement('span');
    span.className = 'badgeIcon';
    span.innerHTML = icon;
    return span;
}

function badgeText(titleText, detailText) {
    const text = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'badgeTitle';
    title.textContent = titleText;
    const detail = document.createElement('div');
    detail.className = 'learnDetail';
    detail.textContent = detailText;
    text.append(title, detail);
    return text;
}

function showBadgesEarned(earned, perfect) {
    const banner = document.getElementById('badgeBanner');
    banner.innerHTML = '';
    const what = `${MODES[mode].title} · ${DIFFICULTIES[difficulty]}`;
    earned.forEach(badge => {
        let icon, title, detail;
        if (badge.kind === 'allModes') {
            [icon, title, detail] = [ICONS.allModes, 'All modes!', `100% in all ${Object.keys(MODES).length} modes · ${DIFFICULTIES[badge.level]}`];
        } else if (badge.kind === 'milestone') {
            [icon, title, detail] = [ICONS.milestone, `${badge.count.toLocaleString('en')} right answers!`,
                                     `Milestone · ${badge.total.toLocaleString('en')} so far`];
        } else {
            icon = BADGE_KINDS[badge.kind].icon;
            title = BADGE_KINDS[badge.kind].banner;
            detail = {
                perfect: badge.count === 1 ? `New badge · ${what}` : `${what} · ${badge.count} times now`,
                hatTrick: `Three 100% quizzes in a row · ${what}`,
                noClues: `100% without a single clue · ${what}`,
                levelFiveAce: `Full points on every Level 5 question · ${what}`,
                record: badge.beaten === null
                    ? `${formatTime(badge.time)}, your record to beat · ${what}`
                    : `${formatTime(badge.time)}, beating ${formatTime(badge.beaten)} · ${what}`
            }[badge.kind];
        }
        const row = document.createElement('div');
        row.className = 'badgeEarned';
        row.append(badgeIcon(icon), badgeText(title, detail));
        banner.appendChild(row);
    });
    if (perfect && area !== 'all') {
        const note = document.createElement('p');
        note.className = 'mutedText';
        note.textContent = 'Badges are earned in Whole world quizzes.';
        banner.appendChild(note);
    }
    banner.hidden = banner.children.length === 0;
}

// ---- Start screen: Area, Difficulty and badges ----

function renderSettingButtons(containerId, options, chosen, label, choose) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    Object.keys(options).forEach(value => {
        const button = document.createElement('button');
        button.setAttribute('role', 'radio');
        button.setAttribute('aria-checked', value === chosen);
        button.textContent = label(value);
        button.addEventListener('click', () => choose(value));
        container.appendChild(button);
    });
}

function chooseArea(value) {
    area = value;
    localStorage.setItem(STORAGE_PREFIX + 'area', value);
    renderStart();
}

function chooseDifficulty(value) {
    difficulty = value;
    localStorage.setItem(STORAGE_PREFIX + 'difficulty', value);
    renderStart();
}

// Territories only offers the other Modes on Difficult only
function renderStart() {
    renderSettingButtons('areaButtons', AREAS, area, value => AREAS[value].label, chooseArea);
    renderSettingButtons('difficultyButtons', DIFFICULTIES, difficulty, value => DIFFICULTIES[value], chooseDifficulty);
    const badges = loadBadges();
    document.querySelectorAll('.modeCard').forEach(card => {
        const allowed = modeAllowed(card.dataset.mode);
        card.disabled = !allowed;
        card.querySelector('.cardNote').hidden = allowed;
        card.querySelector('.cardNote').textContent = 'Difficult only';
        renderCardBadges(card, badges);
    });
    renderBadgeShelf(badges);
}

// A row of badge icons per Difficulty; tapping one names it instead of opening the Mode
function renderCardBadges(card, badges) {
    const container = card.querySelector('.cardBadges');
    container.innerHTML = '';
    const caption = document.createElement('span');
    caption.className = 'cardBadgeName';
    Object.keys(DIFFICULTIES).forEach(level => {
        const kinds = Object.keys(BADGE_KINDS).filter(kind => badges[`${card.dataset.mode}.${level}.${kind}`]);
        if (kinds.length === 0) return;
        const row = document.createElement('span');
        row.className = 'badgeRow';
        const label = document.createElement('span');
        label.className = 'badgeRowLabel';
        label.textContent = DIFFICULTIES[level];
        row.appendChild(label);
        kinds.forEach(kind => {
            const badge = badges[`${card.dataset.mode}.${level}.${kind}`];
            const name = `${BADGE_KINDS[kind].label}${badge.count > 1 ? ` ×${badge.count}` : ''} · ${DIFFICULTIES[level]}`;
            const icon = badgeIcon(BADGE_KINDS[kind].icon);
            icon.title = name;
            icon.setAttribute('role', 'img');
            icon.setAttribute('aria-label', name);
            icon.addEventListener('click', event => {
                event.stopPropagation();
                caption.textContent = name;
            });
            row.appendChild(icon);
        });
        container.appendChild(row);
    });
    if (container.children.length > 0) container.appendChild(caption);
}

function badgeItem(icon, title, detail, locked) {
    const li = document.createElement('li');
    if (locked) li.className = 'locked';
    li.append(badgeIcon(icon), badgeText(title, detail));
    return li;
}

// Big goals first (All modes and the Milestones, with progress), then each Mode's badges
function renderBadgeShelf(badges) {
    const goals = document.getElementById('goalList');
    goals.innerHTML = '';
    const modeCount = Object.keys(MODES).length;
    Object.keys(DIFFICULTIES).forEach(level => {
        const goal = badges[`allModes.${level}`];
        const missing = modesWithoutPerfect(badges, level);
        goals.appendChild(goal
            ? badgeItem(ICONS.allModes, `All modes · ${DIFFICULTIES[level]}`, `100% in all ${modeCount} modes · ${dateText(goal.first, true)}`)
            : badgeItem(ICONS.allModes, `All modes · ${DIFFICULTIES[level]}`,
                        `${modeCount - missing.length} of ${modeCount} · still to go: ${missing.map(badgeMode => MODES[badgeMode].chip).join(', ')}`, true));
    });
    const total = rightAnswersSoFar();
    const reached = MILESTONES.filter(count => badges[`milestone.${count}`]);
    if (reached.length > 0) {
        const highest = reached[reached.length - 1];
        goals.appendChild(badgeItem(ICONS.milestone, `${highest.toLocaleString('en')} right answers`,
            reached.map(count => `${count.toLocaleString('en')} · ${dateText(badges[`milestone.${count}`].first)}`).join(', ')));
    }
    const next = MILESTONES.find(count => !badges[`milestone.${count}`]);
    if (next) {
        goals.appendChild(badgeItem(ICONS.milestone, `${next.toLocaleString('en')} right answers`,
                                    `${total.toLocaleString('en')} of ${next.toLocaleString('en')}`, true));
    }

    const groups = document.getElementById('badgeGroups');
    groups.innerHTML = '';
    Object.keys(MODES).forEach(badgeMode => {
        const list = document.createElement('ul');
        list.className = 'badgeList';
        Object.keys(DIFFICULTIES).forEach(level => Object.keys(BADGE_KINDS).forEach(kind => {
            const badge = badges[`${badgeMode}.${level}.${kind}`];
            if (!badge) return;
            const best = kind === 'record' ? ` · best ${formatTime(badge.best)}` : '';
            list.appendChild(badgeItem(BADGE_KINDS[kind].icon, BADGE_KINDS[kind].label + (badge.count > 1 ? ` ×${badge.count}` : ''),
                                       `${DIFFICULTIES[level]} · first ${dateText(badge.first, true)}${best}`));
        }));
        if (list.children.length === 0) return;
        const heading = document.createElement('h3');
        heading.className = 'badgeGroupHeading';
        heading.textContent = MODES[badgeMode].title;
        groups.append(heading, list);
    });
    document.getElementById('badgeEmpty').hidden = groups.children.length > 0;
}

moveOldStats();
countEarlierRightAnswers();
renderStart();
