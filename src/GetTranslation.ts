import { sql } from "./Database.js";

const l10nCache = new Map<string, Translation>();

sql<Translation[]>`
	SELECT *
	FROM i18n
	WHERE key LIKE 'general.day%'
`.then(rows => {
	for (const row of rows) {
		const {key, ...values} = row;
		l10nCache.set(key, values);
	}
});

async function cache(keys: string | string[]): Promise<void> {
	if (typeof(keys) === "string") keys = [keys];

	const uncached = keys.filter(key => !l10nCache.has(key));
	if (uncached.length === 0) return;

	return new Promise(resolve => sql<Translation[]>`
		SELECT *
		FROM i18n
		WHERE key = ANY(${uncached})
	`.then(rows => {
		for (const row of rows) {
			const {key, ...values} = row;
			l10nCache.set(key, values);
		}
		
		resolve();
	}));
}

const formatterRegex = /%(\d*?)([sw])/g;
const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const daysRegex = new RegExp(days.join("|"), "gi");
function interpolate(key: string, lang: string, args: (string | L10nParams)[]): string {
	if (!l10nCache.has(key)) throw new Error(`Translation key not found/cached: ${key}`);
	const formatter = l10nCache.get(key)![lang.toLowerCase()] ?? l10nCache.get(key)!.english;
	if (!formatterRegex.test(formatter) || formatter.match(formatterRegex)?.length === 0) return formatter;
	const formattedArgs = args.map(arg => arg !== null && typeof(arg) === "object" ? interpolate(arg.key, arg.lang, arg.args) : arg);

	let i = 0;
	return formatter.replace(formatterRegex, (match, number: string, tag: string) => {
		i++;

		const arg = formattedArgs[(Number(number) || i) - 1] ?? match;
		switch (tag) {
			case "s":
				return arg;
			case "w":
				return arg.replace(daysRegex, day => l10nCache.get(`general.day${days.indexOf(day.toLowerCase())}`)![lang.toLowerCase()] ?? l10nCache.get(`general.day${days.indexOf(day.toLowerCase())}`)!.english);
			default:
				return arg;
		}
	});
}

function collectKeys(key: string, args: (string | L10nParams)[]): string[] {
	const keys: string[] = [key];
	for (const arg of args) {
		if (arg && typeof(arg) === "object") keys.push(...collectKeys(arg.key, arg.args));
	}
	return keys;
}

export async function Localize(key: string, lang: string, args: (string | L10nParams)[] = []) {
	const keys = collectKeys(key, args);

	return cache(keys)
		.then(() => interpolate(key, lang, args));
}