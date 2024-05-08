import { sql } from "./Database.js";

export async function getClassInfo(id: string) {
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
		WHERE mc.id = ${id}
		GROUP BY mc.id;
	`.then(rows => rows[0]);
}