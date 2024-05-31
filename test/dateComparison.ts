import type { MatcherFunction } from "expect";

const toBeLaterThanOrEqualToDate: MatcherFunction<[minimum: unknown]> = function (value, minimum) {
	if (typeof value !== "string" || typeof minimum !== "string") {
		throw new TypeError("Arguments must be strings");
	}

	const valueDate = new Date(value);
	const minimumDate = new Date(minimum);

	if (isNaN(valueDate.getTime()) || isNaN(minimumDate.getTime())) {
		throw new TypeError("Arguments must be valid dates");
	}

	const pass = valueDate >= minimumDate;

	if (pass) {
		return {
			message: () => `expected ${this.utils.printReceived(value)} not to be greater than or equal to ${this.utils.printExpected(minimum)}`,
			pass: true
		};
	} else {
		return {
			message: () => `expected ${this.utils.printReceived(value)} to be greater than or equal to ${this.utils.printExpected(minimum)}`,
			pass: false
		};
	}
}

const toBeEarlierThanOrEqualToDate: MatcherFunction<[maximum: unknown]> = function (value, maximum) {
	if (typeof value !== "string" || typeof maximum !== "string") {
		throw new TypeError("Arguments must be strings");
	}

	const valueDate = new Date(value);
	const maximumDate = new Date(maximum);

	if (isNaN(valueDate.getTime()) || isNaN(maximumDate.getTime())) {
		throw new TypeError("Arguments must be valid dates");
	}

	const pass = valueDate <= maximumDate;

	if (pass) {
		return {
			message: () => `expected ${this.utils.printReceived(value)} not to be less than or equal to ${this.utils.printExpected(maximum)}`,
			pass: true
		};
	} else {
		return {
			message: () => `expected ${this.utils.printReceived(value)} to be less than or equal to ${this.utils.printExpected(maximum)}`,
			pass: false
		};
	}
}

const toBeWithinDateRange: MatcherFunction<[minimum: unknown, maximum: unknown]> = function (value, minimum, maximum) {
	if (typeof value !== "string" || typeof minimum !== "string" || typeof maximum !== "string") {
		throw new TypeError("Arguments must be strings");
	}

	const valueDate = new Date(value);
	const minimumDate = new Date(minimum);
	const maximumDate = new Date(maximum);

	if (isNaN(valueDate.getTime()) || isNaN(minimumDate.getTime()) || isNaN(maximumDate.getTime())) {
		throw new TypeError("Arguments must be valid dates");
	}

	const pass = valueDate >= minimumDate && valueDate <= maximumDate;

	if (pass) {
		return {
			message: () => `expected ${this.utils.printReceived(value)} not to be within range ${this.utils.printExpected([minimum, maximum])}`,
			pass: true
		};
	} else {
		return {
			message: () => `expected ${this.utils.printReceived(value)} to be within range ${this.utils.printExpected([minimum, maximum])}`,
			pass: false
		};
	}
}

expect.extend({ toBeLaterThanOrEqualToDate, toBeEarlierThanOrEqualToDate, toBeWithinDateRange });

declare module "expect" {
	interface AsymmetricMatchers {
		toBeLaterThanOrEqualToDate(minimum: string): void;
		toBeEarlierThanOrEqualToDate(maximum: string): void;
		toBeWithinDateRange(minimum: string, maximum: string): void;
	}
	interface Matchers<R> {
		toBeLaterThanOrEqualToDate(minimum: string): R;
		toBeEarlierThanOrEqualToDate(maximum: string): R;
		toBeWithinDateRange(minimum: string, maximum: string): R;
	}
}