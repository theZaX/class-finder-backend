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
		fetch(`http://localhost:3000/?${query}`),
		fetch(`http://localhost:3000/map?${query}`)
	]).then(responses => {
		if (eachResponse) responses.forEach(eachResponse);
		return Promise.all(responses.map(response => response.json()));
	}).then(jsons => {
		if (eachJson) jsons.forEach(eachJson);
		return jsons;
	});
}

beforeAll(() => {
	server = app.listen(3000);
});

describe("Response Structure Checking", () => {
	test("Default query", async () => {
		return queryEndpoints(
			"",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The default response should always return a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				expect(json.classes.length).toBeGreaterThan(0);
				expect(json.virtclasses.length).toBeGreaterThan(0);
				// The distance between classes will be null since no location was specified
				json.classes.forEach((clazz: any) => expect(clazz).toMatchObject({...classStruct, distanceBetween: null}));
				json.virtclasses.forEach((clazz: any) => expect(clazz).toMatchObject(classStruct));
			}
		);
	});
	
	test("Location query", async () => {
		return queryEndpoints(
			"location=Houston,TX",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response location should contain the provided location
				expect(json).toHaveProperty("location");
				expect(json.location).toContain("Houston");
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				// The length of physical classes should be greater than 0
				expect(json.classes.length).toBeGreaterThan(0);
				// Each physical class should have a numeric distance
				json.classes.forEach((clazz: any) => expect(clazz).toMatchObject({...classStruct, distanceBetween: expect.any(Number)}));
				json.virtclasses.forEach((clazz: any) => expect(clazz).toMatchObject(classStruct));
			}
		);
	});
	
	test("Infer location query", async () => {
		return Promise.all([
			fetch("http://localhost:3000/", {
				headers: {
					"x-appengine-city": "houston",
					"x-appengine-citylatlong": "29.749,-95.358"
				}
			}),
			fetch("http://localhost:3000/map", {
				headers: {
					"x-appengine-city": "houston",
					"x-appengine-citylatlong": "29.749,-95.358"
				}
			})
		]).then(responses => {
			responses.forEach(response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			});
			return Promise.all(responses.map(response => response.json()));
		}).then(jsons => {
			jsons.forEach(json => {
				// The response location should contain the inferred location
				expect(json).toHaveProperty("location");
				expect(json.location).toContain("Houston");
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				// The length of physical classes should be greater than 0
				expect(json.classes.length).toBeGreaterThan(0);
				// Each physical class should have a numeric distance
				json.classes.forEach((clazz: any) => expect(clazz).toMatchObject({...classStruct, distanceBetween: expect.any(Number)}));
				json.virtclasses.forEach((clazz: any) => expect(clazz).toMatchObject(classStruct));
			});
		});
	});
	
	test("Offering query", async () => {
		return queryEndpoints(
			"offering=Emotional Resilience",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				// The length of physical classes should be greater than 0
				expect(json.classes.length).toBeGreaterThan(0);
				// Each class should contain the expected offering
				json.classes.forEach((clazz: any) => expect(clazz).toMatchObject({...classStruct, classOffering: "Emotional Resilience"}));
				json.virtclasses.forEach((clazz: any) => expect(clazz).toMatchObject({...classStruct, classOffering: "Emotional Resilience"}));
			}
		);
	});
	
	test("Any English classes query", async () => {
		return queryEndpoints(
			"offering=english",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				// The length of physical classes should be greater than 0
				expect(json.classes.length).toBeGreaterThan(0);
				// The classes should contain only English(Connect), and not every class should be the same level
				json.classes.forEach((clazz: any) => expect(clazz).toMatchObject({...classStruct, classOffering: expect.stringMatching(/^english(connect)? \d$/gi)}));
				expect(json.classes.every((clazz: any) => json.classes[0].classOffering === clazz.classOffering)).toBeFalsy();
				json.virtclasses.forEach((clazz: any) => expect(clazz).toMatchObject({...classStruct, classOffering: expect.stringMatching(/^english(connect)? \d$/gi)}));
				expect(json.virtclasses.length !== 0 && json.virtclasses.every((clazz: any) => json.virtclasses[0].classOffering === clazz.classOffering)).toBeFalsy();
			}
		);
	});
	
	test("Language query", async () => {
		return queryEndpoints(
			"language=English",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				// The length of physical classes should be greater than 0
				expect(json.classes.length).toBeGreaterThan(0);
				// Each class should contain the expected language
				json.classes.forEach((clazz: any) => expect(clazz).toMatchObject({...classStruct, classLanguage: "English"}));
				json.virtclasses.forEach((clazz: any) => expect(clazz).toMatchObject({...classStruct, classLanguage: "English"}));
			}
		);
	});
	
	test("Physical modality query", async () => {
		return queryEndpoints(
			"modality=In Person",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				// There should be no virtual classes
				expect(json.classes.length).toBeGreaterThan(0);
				expect(json.virtclasses).toHaveLength(0);
				// Each class should contain the expected modality
				json.classes.forEach((clazz: any) => expect(clazz).toMatchObject({...classStruct, classModality: "In Person"}));
			}
		);
	});
	
	test("Virtual modality query", async () => {
		return queryEndpoints(
			"modality=Virtual-Online",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				// There should be no physical classes
				expect(json.classes).toHaveLength(0);
				expect(json.virtclasses.length).toBeGreaterThan(0);
				// Each class should contain the expected modality
				json.virtclasses.forEach((clazz: any) => expect(clazz).toMatchObject({...classStruct, classModality: "Virtual-Online"}));
			}
		);
	});
	
	test("Offset and limit query", async () => {
		const classes = await queryEndpoints(
			"limit=2",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				// There should be 2 physical classes
				expect(json.classes).toHaveLength(2);
				// Each class should match the expected response structure
				json.classes.forEach((clazz: any) => expect(clazz).toMatchObject(classStruct));
				json.virtclasses.forEach((clazz: any) => expect(clazz).toMatchObject(classStruct));
			}
		);
	
		return Promise.all([
			queryEndpoints(
				"offset=0&limit=1",
				response => {
					expect(response.status).toBe(200);
					expect(response.headers.get("Content-Type")).toContain("application/json");
				},
				json => {
					let i = 0;
					// The response should contain a list of classes
					expect(json).toHaveProperty("classes");
					expect(json).toHaveProperty("virtclasses");
					// There should be exactly 1 physical class
					expect(json.classes).toHaveLength(1);
					// The response should contain the first class grabbed previously
					expect(json.classes[0]).toStrictEqual(classes[i++].classes[0]);
					expect(json.classes[0]).toMatchObject(classStruct);
					json.virtclasses.forEach((clazz: any) => expect(clazz).toMatchObject(classStruct));
				}
			),
			queryEndpoints(
				"offset=1&limit=1",
				response => {
					expect(response.status).toBe(200);
					expect(response.headers.get("Content-Type")).toContain("application/json");
				},
				json => {
					let i = 0;
					// The response should contain a list of classes
					expect(json).toHaveProperty("classes");
					expect(json).toHaveProperty("virtclasses");
					// There should be exactly 1 physical class
					expect(json.classes).toHaveLength(1);
					// The response should contain the second class grabbed previously
					expect(json.classes[0]).toStrictEqual(classes[i++].classes[1]);
					expect(json.classes[0]).toMatchObject(classStruct);
					json.virtclasses.forEach((clazz: any) => expect(clazz).toMatchObject(classStruct));
				}
			)
		]);
	});
	
	test("Combo query", async () => {
		return queryEndpoints(
			"location=Houston,TX&offering=English&language=Spanish&modality=In Person&limit=5",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response location should contain the provided location
				expect(json).toHaveProperty("location");
				expect(json.location).toContain("Houston");
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				// There should only be exactly 5 physical classes
				expect(json.classes).toHaveLength(5);
				expect(json.virtclasses).toHaveLength(0);
				// Each physical class should have a numeric distance, be either English(Connect) 1/2, and be held in Spanish
				json.classes.forEach((clazz: any) => expect(clazz).toMatchObject({
					...classStruct,
					distanceBetween: expect.any(Number),
					classOffering: expect.stringMatching(/^english(connect)? \d$/gi),
					classLanguage: "Spanish"
				}));
				expect(json.classes.every((clazz: any) => json.classes[0].classOffering === clazz.classOffering)).toBeFalsy();
			}
		);
	});
});

describe("Unusual Requests", () => {
	test("Multiple locations query", async () => {
		return queryEndpoints(
			"location=Houston,TX&location=Phoenix,AZ",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response location should contain the first provided location
				expect(json).toHaveProperty("location");
				expect(json.location).toContain("Houston");
			}
		);
	});

	test("Indeterminate location query", async () => {
		return queryEndpoints(
			"location=93uo82h4gfub34",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response location should default to the United States
				expect(json).toHaveProperty("location");
				expect(json.location).toBe("United States");
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				expect(json.classes.length).toBeGreaterThan(0);
				expect(json.virtclasses.length).toBeGreaterThan(0);
			}
		);
	});

	test("Multiple offerings query", async () => {
		return queryEndpoints(
			"offering=Emotional Resilience&offering=Personal Finance",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				// The length of physical classes should be greater than 0
				expect(json.classes.length).toBeGreaterThan(0);
				// Each class should contain the first provided offering
				json.classes.forEach((clazz: any) => expect(clazz).toMatchObject({classOffering: "Emotional Resilience"}));
				json.virtclasses.forEach((clazz: any) => expect(clazz).toMatchObject({classOffering: "Emotional Resilience"}));
			}
		);
	});

	test("Multiple languages query", async () => {
		return queryEndpoints(
			"language=English&language=Spanish",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				// The length of physical classes should be greater than 0
				expect(json.classes.length).toBeGreaterThan(0);
				// Each class should contain the first provided language
				json.classes.forEach((clazz: any) => expect(clazz).toMatchObject({classLanguage: "English"}));
				json.virtclasses.forEach((clazz: any) => expect(clazz).toMatchObject({classLanguage: "English"}));
			}
		);
	});

	test("Multiple modalities query", async () => {
		return queryEndpoints(
			"modality=In Person&modality=Virtual",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				// There should be no virtual classes
				expect(json.classes.length).toBeGreaterThan(0);
				expect(json.virtclasses).toHaveLength(0);
				// Each class should contain the first provided modality
				json.classes.forEach((clazz: any) => expect(clazz).toMatchObject({classModality: "In Person"}));
			}
		);
	});

	test("Multiple offsets and limits query", async () => {
		const classes = await queryEndpoints(
			"limit=1&limit=2",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				// There should be exactly 1 physical class
				expect(json.classes).toHaveLength(1);
			}
		);

		return queryEndpoints(
			"offset=0&offset=1&limit=1",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				let i = 0;
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				// There should be exactly 1 physical class
				expect(json.classes).toHaveLength(1);
				// The response should contain the class grabbed previously
				expect(json.classes[0]).toStrictEqual(classes[i++].classes[0]);
			}
		);
	});

	test("Floating point, out-of-bounds offset and limit query", async () => {
		const classes = await queryEndpoints(
			"offset=0.5&limit=0",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				// There should be exactly 1 physical class
				expect(json.classes).toHaveLength(1);
			}
		);

		return Promise.all([
			queryEndpoints(
				"offset=-1&limit=-3.1415",
				response => {
					expect(response.status).toBe(200);
					expect(response.headers.get("Content-Type")).toContain("application/json");
				},
				json => {
					let i = 0;
					// The response should contain a list of classes
					expect(json).toHaveProperty("classes");
					expect(json).toHaveProperty("virtclasses");
					// There should be exactly 1 physical class
					expect(json.classes).toHaveLength(1);
					// The response should contain the class grabbed previously
					expect(json.classes[0]).toStrictEqual(classes[i++].classes[0]);
				}
			),
			queryEndpoints(
				"offset=999999999",
				response => {
					expect(response.status).toBe(200);
					expect(response.headers.get("Content-Type")).toContain("application/json");
				},
				json => {
					// The response should contain a list of classes
					expect(json).toHaveProperty("classes");
					expect(json).toHaveProperty("virtclasses");
					// There should be exactly 0 physical classes
					expect(json.classes).toHaveLength(0);
				}
			),
			queryEndpoints(
				"limit=999999999",
				response => {
					expect(response.status).toBe(200);
					expect(response.headers.get("Content-Type")).toContain("application/json");
				},
				json => {
					// The response should contain a list of classes
					expect(json).toHaveProperty("classes");
					expect(json).toHaveProperty("virtclasses");
					// There should be less than or equal to 100 physical classes
					expect(json.classes.length).toBeLessThanOrEqual(100);
				}
			)
		]);
	});

	test("NaN offset and limit query", async () => {
		const classes = await queryEndpoints(
			"",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				expect(json.classes.length).toBeGreaterThan(0);
				expect(json.virtclasses.length).toBeGreaterThan(0);
			}
		);

		return queryEndpoints(
			"offset=foo&limit=bar",
			response => {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toContain("application/json");
			},
			json => {
				let i = 0;
				// The response should contain a list of classes
				expect(json).toHaveProperty("classes");
				expect(json).toHaveProperty("virtclasses");
				// The response should be the classes grabbed previously
				expect(json.classes).toStrictEqual(classes[i++].classes);
				expect(json.virtclasses).toStrictEqual(classes[i++].virtclasses);
			}
		);
	});
});

describe("Invalid Requests", () => {
	test("Invalid offering query", async () => {
		return queryEndpoints(
			"offering=foo",
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

	test("Invalid language query", async () => {
		return queryEndpoints(
			"language=foo",
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

	test("Invalid modality query", async () => {
		return queryEndpoints(
			"modality=foo",
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