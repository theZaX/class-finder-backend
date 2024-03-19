const { Client } = require("@googlemaps/google-maps-services-js");

const key = "AIzaSyBQMs9MaCULeEo138EBs1flJO8IRkUaFQM";

const client = new Client({});

const geocode = async (address: string) => {
  const geocoding = await client.geocode({
    params: {
      key,
      address,
    },
  });

  return geocoding.data.results[0];
};

export default geocode;
