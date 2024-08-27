import type { Server } from "http";
import { app, sql } from "../build/index.js";

let server: Server;

async function queryEndpoint(
	body?: object,
	eachResponse?: (response: Response) => void,
	eachJson?: (json: any, lang: string) => void,
	langs: string[] = ["English", "Spanish", "Chinese", "French"]
) {
	return Promise.all(langs.map(lang => {
		return fetch("http://localhost:3002/l10n", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({lang, ...body})
		}).then(response => ({lang, response}));
	})).then(responses => {
		if (eachResponse) responses.forEach(response => eachResponse(response.response));
		return Promise.all(responses.map(response => response.response.json().then(json => ({lang: response.lang, json}))));
	}).then(jsons => {
		if (eachJson) jsons.forEach(json => eachJson(json.json, json.lang));
		return jsons;
	});
}

beforeAll(() => {
	server = app.listen(3002);
});

describe("Response Structure Checking", () => {
	test("Hello World!", async () => {
		return queryEndpoint(
			{
				key: "test.cicd.message1", // Hello %s!
				args: ["World"]
			},
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			(json, lang) => {
				// The response should contain a specific string
				switch(lang) {
					case "English":
						expect(json).toStrictEqual("Hello World!");
						break;
					case "Spanish":
						expect(json).toStrictEqual("¡Hola World!");
						break;
					case "Chinese":
						expect(json).toStrictEqual("你好World！");
						break;
					case "French":
						expect(json).toStrictEqual("Bonjour World !");
						break;
				}
			}
		);
	});

	test("Interpolation Rearrangement", async () => {
		return queryEndpoint(
			{
				key: "test.cicd.message2", // %2s%2s%s%3s
				args: ["A", "B", "C"]
			},
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a specific string
				expect(json).toStrictEqual("BBCC");
			}
		);
	});

	test("Weekday replacement", async () => {
		return queryEndpoint(
			{
				key: "test.cicd.message3", // %2w test %s
				args: ["unused", "Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday"]
			},
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			(json, lang) => {
				// The response should contain a specific string
				switch(lang) {
					case "English":
						expect(json).toStrictEqual("Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday test Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday");
						break;
					case "Spanish":
						expect(json).toStrictEqual("Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo test Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday");
						break;
					case "Chinese":
						expect(json).toStrictEqual("周一, 周二, 周三, 周四, 周五, 周六, 周日 test Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday");
						break;
					case "French":
						expect(json).toStrictEqual("Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi, Dimanche test Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday");
						break;
				}
			}
		);
	});

	test("Recursive replacement", async () => {
		return queryEndpoint(
			{
				key: "test.cicd.message2",
				args: [
					"A",
					{
						key: "test.cicd.message1",
						lang: "English",
						args: ["World"]
					},
					{
						key: "test.cicd.message1",
						lang: "Spanish",
						args: [{
							key: "test.cicd.message1",
							lang: "Chinese",
							args: ["World"]
						}]
					}
				]
			},
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a specific string
				expect(json).toStrictEqual("Hello World!Hello World!¡Hola 你好World！!¡Hola 你好World！!");
			}
		);
	});
});

describe("Unusual Requests", () => {
	test("No first-level arguments", () => {
		return queryEndpoint(
			{key: "test.cicd.message1"},
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			(json, lang) => {
				// The response should contain a specific string with all format specifiers intact
				switch(lang) {
					case "English":
						expect(json).toStrictEqual("Hello %s!");
						break;
					case "Spanish":
						expect(json).toStrictEqual("¡Hola %s!");
						break;
					case "Chinese":
						expect(json).toStrictEqual("你好%s！");
						break;
					case "French":
						expect(json).toStrictEqual("Bonjour %s !");
						break;
				}
			}
		);
	});

	test("Insufficient arguments", () => {
		return queryEndpoint(
			{
				key: "test.cicd.message2",
				args: ["A", "B"]
			},
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a specific string, with any extra format specifiers intact
				expect(json).toStrictEqual("BB%s%3s");
			}
		);
	});

	test("Too many arguments", () => {
		return queryEndpoint(
			{
				key: "test.cicd.message1",
				args: ["World", "Everyone"]
			},
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			(json, lang) => {
				// The response should contain a specific string, ignoring the extra argument
				switch(lang) {
					case "English":
						expect(json).toStrictEqual("Hello World!");
						break;
					case "Spanish":
						expect(json).toStrictEqual("¡Hola World!");
						break;
					case "Chinese":
						expect(json).toStrictEqual("你好World！");
						break;
					case "French":
						expect(json).toStrictEqual("Bonjour World !");
						break;
				}
			}
		);
	});

	test("Non-string arguments", () => {
		return queryEndpoint(
			{
				key: "test.cicd.message2",
				args: [
					"A",
					{
						key: "test.cicd.message2",
						lang: "English",
						args: ["B", "", null]
					},
					{
						key: "test.cicd.message2",
						lang: "English",
						args: ["C", true, -3.14]
					}
				]
			},
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a specific string
				expect(json).toEqual("%s%3s%s%3struetrue-3.14-3.14truetrue-3.14-3.14");
			}
		);
	});
});

describe("Invalid Requests", () => {
	test("Missing key", () => {
		return queryEndpoint(
			{args: ["World"]},
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

	test("Unknown key", () => {
		return queryEndpoint(
			{
				key: "test.cicd.nonexistantkey",
				args: ["World"]
			},
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

	test("Missing language", () => {
		return fetch("http://localhost:3002/l10n", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				key: "test.cicd.message1",
				args: ["World"]
			})
		}).then(response => {
			expect(response.status).toBe(400);
			expect(response.headers.get("Content-Type")).toContain("application/json");
			return response.json();
		}).then(json => {
			// The response should contain an error
			expect(json).toEqual({error: "Invalid request"});
		});
	});

	test("Invalid language", () => {
		return fetch("http://localhost:3002/l10n", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				key: "test.cicd.message1",
				lang: "nonexistantlang",
				args: ["World"]
			})
		}).then(response => {
			expect(response.status).toBe(400);
			expect(response.headers.get("Content-Type")).toContain("application/json");
			return response.json();
		}).then(json => {
			// The response should contain an error
			expect(json).toEqual({error: "Invalid request"});
		});
	});

	test("Non-array arguments", () => {
		return queryEndpoint(
			{
				key: "test.cicd.message1",
				args: "World"
			},
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

	test("Recursive argument missing key", () => {
		return queryEndpoint(
			{
				key: "test.cicd.message1",
				args: [
					{
						// Missing key
						lang: "English",
						args: ["World"]
					}
				]
			},
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

	test("Recursive argument missing lang", () => {
		return queryEndpoint(
			{
				key: "test.cicd.message1",
				args: [
					{
						key: "test.cicd.message1",
						// Missing lang
						args: ["World"]
					}
				]
			},
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

	test("Recursive argument missing args", () => {
		return queryEndpoint(
			{
				key: "test.cicd.message1",
				args: [
					{
						key: "test.cicd.message1",
						lang: "English"
						// Missing args
					}
				]
			},
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
});

afterAll(done => {
	server.close(() => sql.end().then(done));
}, 30000);