import "dotenv/config";
import postgres from "postgres";

/**
 * Database connection
 */
export const sql = postgres(process.env.DB_URL || "", {
	transform: {
		undefined: null, // Treat javascript `undefined` as postgres `null`
		...postgres.camel
	}, 
	connection: {application_name: "class-finder-backend"}
});