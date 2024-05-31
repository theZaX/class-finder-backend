import { greatCircle } from "./Distance.js";
import { sql } from "./Database.js";

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
			maps_link,
			lat,
			lng,
			(
				SELECT COUNT(e.id) AS num_enrollments
				FROM enrollments AS e
				WHERE
					e.class_id = mc.id
					AND e.created >= CURRENT_DATE - 30
			)
		FROM master_calendar AS mc
		WHERE
			active = true
			AND start_date <= CURRENT_DATE + 21
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
			classes: classes.filter(clazz => clazz.classModality !== "Virtual-Online")
				.map(clazz => ({
					...clazz,
					distanceBetween: greatCircle(clazz.lat, clazz.lng, options.lat, options.lon)
				})).sort((class1, class2) => {
					// Sort by distance. In the case of a tie, sort by number of enrollments, then by advertising.
					return (class1.distanceBetween - class2.distanceBetween)
						|| (class1.numEnrollments - class2.numEnrollments)
						|| (class1.advertising !== class2.advertising ? (class1.advertising ? -1 : 1) : 0);
				}).slice(options.offset || 0, (options.offset || 0) + (options.limit || 10)),
			virtclasses: classes.filter(clazz => clazz.classModality === "Virtual-Online")
				.sort((class1, class2) => {
					// Sort by number of enrollments, then by advertising.
					return (class1.numEnrollments - class2.numEnrollments)
						|| (class1.advertising !== class2.advertising ? (class1.advertising ? -1 : 1) : 0);
				})
		}
	});
}