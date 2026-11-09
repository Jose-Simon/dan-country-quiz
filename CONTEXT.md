# Flag Game

A quiz in which the player is shown a flag and must name the place it belongs to (or its capital), starting with easy places and getting harder as the quiz goes on.

## Language

**Flag Entry**:
Any one of the roughly 245 places the game can show a flag for — either a Country or a Territory.
_Avoid_: Item, nation (when the distinction matters)

**Country**:
A Flag Entry that is one of the 193 UN member states, or Vatican City, Palestine, Taiwan or Kosovo (197 in total).
_Avoid_: Nation, state, sovereign state

**Territory**:
A Flag Entry that is not a Country — a dependency, overseas territory or similar place with a flag of its own (e.g. Greenland, Bermuda, Hong Kong). Places that fly their Country's flag (e.g. Bouvet Island, Saint Martin) are not Territories and are not in the game. Always harder than every Country.
_Avoid_: Dependency, region, "country" when referring to these

**Display Name**:
The single common English name the game shows for a Flag Entry (e.g. "United States", "Ivory Coast").
_Avoid_: Official name, title

**Other Name**:
Any further name a Flag Entry is known by (e.g. "USA", "Côte d'Ivoire", "Czechia"); accepted as a correct answer and searched by the dropdown, which always shows the Display Name.
_Avoid_: Alias, synonym

**Population Rank**:
A Country's position when all Countries are ordered from largest population (1) to smallest (197). The measure of how easy a Country's flag is.
_Avoid_: Difficulty score

## Playing

**Mode**:
What the player is asked about the flag, chosen before each Quiz: Country Mode, Capital Mode, Currency Mode or Population Mode.
_Avoid_: Game type, variant

**Country Mode**:
The player names the Flag Entry. Questions come from every Flag Entry.

**Capital Mode**:
The player names the Country's capital city. Questions come only from the 100 Countries with the best Population Rank; Territories are never asked.

**Currency Mode**:
The player names the Currency the Country uses. Questions come from the same 100 Countries as Capital Mode, but a Quiz never asks two Countries that share a Currency (e.g. at most one Euro Country).

**Currency**:
The money a Country uses (e.g. "Indian rupee", "Euro"). Several Countries may share one Currency, and a Country that uses two (e.g. Cambodia: Cambodian riel and United States dollar) accepts either. Every Currency is offered as one choice, found by its name, its three-letter code (e.g. "INR") or an Other Name (e.g. "Renminbi").
_Avoid_: Money, denomination

**Map Mode**:
The player finds the Country on the World Map by clicking it. Questions come from the same 100 Countries as Capital Mode, with Levels worth 1–5 points. A wrong first Try gets a Nudge; a right second Try is worth one point less than a right first Try (so nothing at Level 1).

**World Map**:
The map in Map Mode: every Country's outline drawn with thin borders and no names, which the player can zoom into and move around. Only a Country's Home Parts count as that Country; disputed areas belong to whichever Country the map shows controlling them, except that breakaway regions no Country recognises (Somaliland, Northern Cyprus) are part of the Country the world recognises (Somalia, Cyprus).

**Home Parts**:
The parts of a Country that count in Map Mode: its largest landmass, plus any part within about 500 km of another Home Part, so island chains link up (all of Japan, the Philippines or Indonesia; Sicily, Corsica, Northern Ireland, Tasmania, Kaliningrad). Parts further out don't count, however well known: Alaska and Hawaii for the United States, the Canary Islands for Spain, French Guiana for France, the Galápagos for Ecuador. The sea between Home Parts also counts, if it lies inside the shape wrapped around them and within about 250 km of their coast; another Country's land never does.
_Avoid_: Mainland (Japan has no single one), overseas parts (as a synonym)

**Nudge**:
After a wrong first Try in Map Mode, the compass direction from the click towards the Country (e.g. "Further north-east"), and nothing more — no distance. Measured on the globe, so it points the short way round.
_Avoid_: Hint, hot/cold

**Hit Area**:
Where a click counts as right in Map Mode: anywhere inside the Country's outline, or inside an unseen circle centred on the Country that is four times the Country's width but never wider than about 300 km. Small Countries (e.g. Rwanda, Belgium) are therefore a little forgiving: Lille counts for Belgium, but Amsterdam and Bujumbura (for Rwanda) don't. A Country wider than the circle (e.g. Hungary, France) must be clicked inside its border. The circle is measured against the Country itself, so zooming doesn't change it.
_Avoid_: Target, tolerance

**Reveal** (Map Mode):
When a Question ends, the Country's true outline is filled in: green if the player found it, red-orange if they missed twice or Skipped (and the map moves to show it, with the player's clicks marked).

**Population Mode**:
The player picks the Country's population from five Population Choices. Only the flag is shown. Questions come from the same 100 Countries as Capital Mode.

**Population Choice**:
One of the values offered for a Question in Population Mode, shown smallest to largest: five at Levels 1–4, three at Level 5. The Choices are evenly spaced, with the same gap between each pair of neighbours, and one of them is the Country's actual population (rounded) at a random position. Neighbouring Choices always differ by at least a fifth of the larger one, so no two look alike.
_Avoid_: Option, answer (for the wrong ones)

**Capital**:
The city or cities a Country names as its capital, or where its government sits (e.g. Amsterdam and The Hague for the Netherlands). A Country with more than one is offered as a single choice listing all of them (e.g. "Pretoria / Bloemfontein / Cape Town"); typing any of them, or any Other Name of one of them (e.g. "Kiev" for Kyiv), finds that choice. A city that is merely famous (e.g. Sydney, Istanbul) is never a Capital, and a city is the Capital of only one Country. Every Country has a Capital and all of them are offered as choices in Capital Mode, though only some are ever asked.
_Avoid_: Capital city (in the glossary), seat

**Quiz**:
One play-through of exactly 20 Questions, 4 from each Level, in one Mode.
_Avoid_: Game, session, round

**Question**:
One flag shown to the player, to be named.

**Level**:
A band of Flag Entries that Questions are drawn from at random, worth a fixed number of points (Levels 1–5 are worth 1–5 points, except in Population Mode where they are worth 2, 2, 2, 4 and 5; either way a Quiz is out of 60). In Country Mode, Levels 1–4 are bands of Population Rank and Level 5 is every Territory. In Capital Mode, Currency Mode and Population Mode, each Level is a band of 20 Population Ranks (1–20, 21–40 … 81–100). A Quiz splits its Questions evenly across all five Levels, easiest first. Every Level, including Level 5, is shown to the player simply by its number.
_Avoid_: Stage, tier, category, "Super Difficult"

**Try**:
One answer picked for a Question. A Question allows two Tries; after the second wrong Try the answer is revealed. In Population Mode the wrong Population Choice is crossed out and, except at Level 5, the player is told whether the population is higher or lower; a right second Try is worth one point less than a right first Try.
_Avoid_: Attempt, guess

**Skip**:
Giving up on a Question without using its Tries; the answer is revealed and no points are scored.
_Avoid_: Pass, "I don't know"

## Clues

**Clue**:
A hint the player may reveal for the current Question, always in a fixed order that depends on the Mode:
- Country Mode: Continent Clue, Population Clue, Neighbour Clue.
- Capital Mode: Continent Clue, Population Clue, Country Clue.
- Currency Mode: Continent Clue, Country Clue, Symbol Clue.
- Map Mode: Continent Clue (which also brings that continent into view), Neighbour Clue, Country Clue.
- Population Mode: Continent Clue, Country Clue, Similar Country Clue.

The first Clue is free. In Country Mode, Capital Mode, Currency Mode and Map Mode each later Clue costs one point from that Question, never going below zero; in Population Mode Clues are free.
_Avoid_: Hint, help

**Continent Clue**:
The continent (or two continents) the Flag Entry is on. Free.

**Population Clue**:
The Flag Entry's population, rounded (e.g. "about 68 million"), or "Uninhabited".

**Neighbour Clue**:
One related Flag Entry: the most populous land neighbour; or, for a Territory, the Country it belongs to; or, for an island Country with no land border, its nearest neighbour across the sea.
_Avoid_: Border clue

**Country Clue**:
The Display Name of the Country whose flag is shown.

**Similar Country Clue**:
Another Country with a population close to this one's, named without its population.

**Symbol Clue**:
The sign of the Country's Currency (e.g. "₹", "€"). Signs such as "$" and "Fr" are shared by many Currencies, so it narrows the answer without giving it away.
