import type { Server } from "http";
import { app, sql } from "../build/index.js";

const classStruct = {
	id: expect.any(String),
	active: expect.any(Boolean),
	advertising: expect.any(Boolean),
	classOffering: expect.any(String),
	classModality: expect.any(String),
	classLanguage: expect.any(String),
	startDate: expect.any(String),
	endDate: expect.any(String),
	daysClassHeld: expect.any(String),
	startTime: expect.any(String),
	classEnd: expect.any(String),
	locationAddress: expect.any(String),
	city: expect.any(String),
	state: expect.any(String),
	zipCode: expect.any(String),
	addressFormatted: expect.any(String),
	mapsLink: expect.any(String),
	lat: expect.any(String),
	lng: expect.any(String),
	numEnrollments: expect.any(String)
};

let server: Server;

async function queryEndpoints(query?: string, eachResponse?: (response: Response) => void, eachJson?: (json: any) => void) {
	return Promise.all([
		fetch(`http://localhost:3001/class?${query}`)
	]).then(responses => {
		if (eachResponse) responses.forEach(eachResponse);
		return Promise.all(responses.map(response => response.json()));
	}).then(jsons => {
		if (eachJson) jsons.forEach(eachJson);
		return jsons
	});
}

beforeAll(() => {
	server = app.listen(3001);
});

describe("Response Structure Checking", () => {
	test("Example class", async () => {
		return queryEndpoints(
			"classId=2074a44d-e29a-400a-a50d-ffdec33af670",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a class
				expect(json).toMatchObject(classStruct);
			}
	)});
});

describe("Invalid Requests", () => {
	test("Invalid class ID", async () => {
		return queryEndpoints(
			"classId=intentionally-invalid-id",
			response => {
				expect(response.status).toBe(400);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain an error
				expect(json).toEqual({error: "Invalid request"});
			}
		);
	});

	test("Missing class ID", async () => {
		return queryEndpoints(
			"",
			response => {
				expect(response.status).toBe(400);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain an error
				expect(json).toEqual({error: "Invalid request"});
			}
		);
	})
});

afterAll(done => {
	server.close(() => sql.end().then(done));
}, 30000);