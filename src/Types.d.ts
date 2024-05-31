/**
 * Class data
 */
declare interface Class {
	id: string;
	active: boolean;
	advertising: boolean;
	classOffering: string;
	classModality: string;
	classLanguage: string;
	startDate: string;
	endDate: string;
	daysClassHeld: string;
	startTime: string;
	classEnd: string;
	locationAddress: string;
	city: string;
	state: string;
	zipCode: string;
	addressFormatted: string;
	mapsLink: string;
	lat: number;
	lng: number;
	numEnrollments: number;
}

/**
 * Class filter options.  
 * `lat` and `lon` are in degrees.
 */
declare interface ClassFilterOptions {
	lat: number;
	lon: number;
	offering?: string;
	language?: string;
	modality?: string;
	startDateWindow?: number;
	offset?: number;
	limit?: number;
}

declare type Param = string | string[];

declare interface IndexParams extends Partial<{
	location: Param;
	offering: Param;
	language: Param;
	modality: Param;
	startDateWindow: Param;
	offset: Param;
	limit: Param;
}> {};

declare interface ClassInfoParams extends Partial<{
	classId: Param;
}> {};