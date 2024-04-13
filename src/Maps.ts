import "dotenv/config";
import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

/**
 * Retrieves maps data for the given address.
 */
export async function getGeocode(address: string) {
	return client.geocode({params: {
		key: process.env.GMAPS_TOKEN || "",
		address
	}}).then(response => response.data.results[0]);
}