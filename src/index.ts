import cors from "cors";
import express from "express";

import { getClasses } from "./GetClasses.js";
import { getGeocode } from "./Maps.js";

const app = express();
app.use(cors());

type Param = string | string[];

interface QueryParams extends Partial<{
	location: Param;
	offering: Param;
	language: Param;
	modality: Param;
	offset: Param;
	limit: Param;
}> {};

interface Request extends express.Request<{}, {}, {}, QueryParams> {};

/**
 * The index endpoint is generally only used for the initial request from the user, defaulting the requested location to the user's ip.
 */
app.get("/", (request: Request, response) => {
	findClasses(request)
		.then(data => response.status(200).json(data))
		.catch(error => {
			console.error(error);
			response.status(400).json({error: "Invalid request"});
		});
});

/**
 * The `/map` endpoint is generally used when searching for a location different than the one detected from the ip.
 */
app.get("/map", async (request: Request, response) => {
	findClasses(request)
	.then(data => response.status(200).json(data))
	.catch(error => {
		console.error(error);
		response.status(400).json({error: "Invalid request"});
	});
});

async function findClasses(request: Request) {
	const {location, offering, language, modality, offset, limit} = request.query;

	console.log("Finding classes...", location, offering, language, modality, offset, limit);

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
		classes: await getClasses({
			lat,
			lon,
			offering: normalize(offering),
			language: normalize(language),
			modality: normalize(modality),
			offset: Math.max(parseInt(normalize(offset) ?? "") || 0, 0),
			limit: Math.min(Math.max(parseInt(normalize(limit) ?? "") || 10, 1), 100)
		})
	}
}

/**
 * Normalizes the given param. Returns the first item in an array if the param is an array, or the param itself.
 */
function normalize<T extends Param | undefined>(param: T) {
	return Array.isArray(param) ? param[0] : (param as Exclude<T, string[]>);
}

export { app };