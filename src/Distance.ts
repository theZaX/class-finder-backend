/**
 * Calculates the great circle (shortest) distance between two spherical polar coordinates in miles.  
 * Approximates the earth as a sphere.  
 * Latitudes and longitudes are in degrees.
 */
export function greatCircle(lat1: number, lon1: number, lat2: number, lon2: number) {
	// Convert degrees to radians
	const deg2rad = Math.PI / 180;
	lat1 *= deg2rad;
	lon1 *= deg2rad;
	lat2 *= deg2rad;
	lon2 *= deg2rad;

	const radius = 3958.7613; // Arithmetic Mean Radius of Earth in miles

	// Spherical law of cosines. More accurate than the haversine formula for short distances.
	return radius * Math.acos(Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2) + Math.sin(lat1) * Math.sin(lat2));
}