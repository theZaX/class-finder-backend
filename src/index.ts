import cors from "cors";
import express from "express";

import { sql } from "./Database.js";
import { getClasses } from "./GetClasses.js";
import { getClassInfo } from "./GetClassInfo.js";
import { Localize } from "./GetTranslation.js";
import { getGeocode } from "./Maps.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

interface IndexRequest extends express.Request<{}, {}, {}, IndexParams> {};
interface ClassInfoRequest extends express.Request<{}, {}, {}, ClassInfoParams> {};
interface L10nRequest extends express.Request<{}, {}, Partial<L10nParams>> {};

/**
 * Fetch a list of classes from the database, matching the given query
 */
app.get("/", (request: IndexRequest, response) => {
	findClasses(request)
		.then(data => response.status(200).json(data))
		.catch(error => {
			if (process.env.NODE_ENV !== "test") console.error(error);
			response.status(400).json({error: "Invalid request"});
		});
});

/**
 * Fetch a single class from the database
 */
app.get("/class", (request: ClassInfoRequest, response) => {
	const {classId} = request.query;
	if (!classId) return response.status(400).json({error: "Invalid request"});
	getClassInfo(normalize(classId))
		.then(data => response.status(200).json(data))
		.catch(error => {
			if (process.env.NODE_ENV !== "test") console.error(error);
			response.status(400).json({error: "Invalid request"});
		});
});

async function findClasses(request: IndexRequest) {
	const {location, offering, language, modality, startDateWindow, offset, limit} = request.query;

	if (process.env.NODE_ENV !== "test") console.log("Finding classes...", location, offering, language, modality, startDateWindow, offset, limit);

	// Get the location from the query params.
	// If not provided, default to the headers "x-appengine-city" and "x-appengine-citylatlong"
	// provided by the Google Cloud Functions runtime.
	// Example headers:
	// "x-appengine-city": "bossier city"
	// "x-appengine-citylatlong": "32.515985,-93.732123"
	const {geometry: {location: {lat, lng: lon}}, formatted_address: address} = location
		? (await getGeocode(normalize(location)))
			?? (await getGeocode((normalize(location) + " USA")))
			?? {geometry: {location: {lat: NaN, lng: NaN}}, formatted_address: "USA"}
		: {
			geometry: {location: {
				lat: Number((request.headers["x-appengine-citylatlong"] as string)?.split(",")[0]),
				lng: Number((request.headers["x-appengine-citylatlong"] as string)?.split(",")[1])
			}},
			formatted_address: request.headers["x-appengine-city"] as string
		};

	return {
		location: address?.replace(/\b([a-z])(?!\s|$)/g, char => char.toUpperCase()),
		...await getClasses({
			lat,
			lon,
			offering: normalize(offering),
			language: normalize(language),
			modality: normalize(modality),
			startDateWindow: Math.max(isNaN(parseInt(normalize(startDateWindow) ?? "")) ? 21 : parseInt(normalize(startDateWindow) ?? "21"), -1),
			offset: Math.max(parseInt(normalize(offset) ?? "") || 0, 0),
			limit: Math.min(Math.max(parseInt(normalize(limit) ?? ""), 1), 100) || 10
		})
	}
}

/**
 * Return the interpolated translation for the given key and language
 */
app.post("/l10n", (request: L10nRequest, response) => {
	let {key, lang, args = []} = request.body;

	if (typeof(key) !== "string") return response.status(400).json({error: "Invalid request"});
	if (typeof(lang) !== "string") return response.status(400).json({error: "Invalid request"});
	if (!Array.isArray(args)) return response.status(400).json({error: "Invalid request"});

	if (["English", "Spanish", "Chinese", "French"].indexOf(lang) === -1) return response.status(400).json({error: "Invalid request"});
	
	if (process.env.NODE_ENV !== "test") console.log("L10n", key, lang);

	Localize(key, lang, args)
		.then(data => response.status(200).json(data))
		.catch(error => {
			if (process.env.NODE_ENV !== "test") console.error(error);
			response.status(400).json({error: "Invalid request"});
		});
});

/**
 * Normalizes the given param. Returns the first item in an array if the param is an array, or the param itself.
 */
function normalize<T extends Param | undefined>(param: T) {
	return Array.isArray(param) ? param[0] : (param as Exclude<T, string[]>);
}

process.on("SIGINT", async () => {
	console.log("Closing server and database connection...");
	await sql.end();
	process.exit(0);
});

export { app, sql };