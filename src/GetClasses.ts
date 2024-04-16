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
	num_enrollments: number;
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
			mc.id,
			mc.active,
			mc.advertising,
			mc.class_offering,
			mc.class_modality,
			mc.class_language,
			mc.start_date,
			mc.end_date,
			mc.days_class_held,
			mc.start_time,
			mc.class_end,
			mc.location_address,
			mc.city,
			mc.state,
			mc.zip_code,
			mc.address_formatted,
			mc.lat,
			mc.lng,
			COUNT(e.id) AS num_enrollments
		FROM master_calendar AS mc
		LEFT JOIN enrollments AS e ON mc.id = e.class_id
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
			}
		GROUP BY mc.id;
	`.then(classes => {
		return {
			// "class" is a reserved keyword, so "clazz" is used instead
			classes: classes.filter(clazz => clazz.class_modality !== "Virtual-Online")
				.map(clazz => ({
					...clazz,
					distance: greatCircle(clazz.lat, clazz.lng, options.lat, options.lon)
				})).sort((class1, class2) => {
					// Sort by distance. In the case of a tie, sort by number of enrollments, then by advertising.
					return (class1.distance - class2.distance)
						|| (class1.num_enrollments - class2.num_enrollments)
						|| (class1.advertising !== class2.advertising ? (class1.advertising ? -1 : 1) : 0);
				}).slice(options.offset || 0, (options.offset || 0) + (options.limit || 10)),
			virtclasses: classes.filter(clazz => clazz.class_modality === "Virtual-Online")
				.sort((class1, class2) => {
					// Sort by number of enrollments, then by advertising.
					return (class1.num_enrollments - class2.num_enrollments)
						|| (class1.advertising !== class2.advertising ? (class1.advertising ? -1 : 1) : 0);
				})
		}
	});
}