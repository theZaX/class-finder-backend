import { greatCircle } from "./Distance.js";
import { sql } from "./Database.js";

/**
 * Class data
 */
interface Class {
	id: string;
	active: boolean;
	advertising: boolean;
	class_offering: string;
	class_modality: string;
	class_language: string;
	start_date: string;
	end_date: string;
	days_class_held: string;
	start_time: string;
	class_end: string;
	location_address: string;
	city: string;
	state: string;
	zip_code: string;
	address_formatted: string;
	lat: number;
	lng: number;
}

/**
 * Class filter options.  
 * `lat` and `lon` are in degrees.
 */
export interface ClassFilterOptions {
	lat: number;
	lon: number;
	offering?: string;
	language?: string;
	modality?: string;
	offset?: number;
	limit?: number;
}

/**
 * Gets classes from the database which match the given filters.  
 * Sorts by distance from the given location.
 */
export async function getClasses(options: ClassFilterOptions) {
	return sql<Class[]>`
		SELECT 
			id,
			active,
			advertising,
			class_offering,
			class_modality,
			class_language,
			start_date,
			end_date,
			days_class_held,
			start_time,
			class_end,
			location_address,
			city,
			state,
			zip_code,
			address_formatted,
			lat,
			lng
		FROM master_calendar
		WHERE
			active = true
			AND start_date <= CURRENT_DATE + 14
			AND end_date >= CURRENT_DATE
			${options.offering && options.offering !== "all"
				? sql`AND class_offering IN ${sql(/english[^0-9]*$/gi.test(options.offering)
					? ["EnglishConnect 1", "EnglishConnect 2"]
					: [options.offering])}`
				: sql``
			}
			${options.language && options.language !== "all"
				? sql`AND class_language = ${options.language}`
				: sql``
			}
			${options.modality && options.modality !== "all"
				? sql`AND class_modality = ${options.modality}`
				: sql``
			};
	`.then(classes => {
		return classes
			.map(clazz => ({ // "class" is a reserved keyword, so "clazz" is used instead
				...clazz,
				distance: greatCircle(clazz.lat, clazz.lng, options.lat, options.lon)
			}))
			.sort(({distance: d1}, {distance: d2}) => d1 - d2)
			.slice(options.offset || 0, (options.offset || 0) + (options.limit || 10));
	});
}