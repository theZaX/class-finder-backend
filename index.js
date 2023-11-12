const express = require("express");
var cors = require("cors");
const app = express();
const getConnectedClient = require("./database");
const geocode = require("./mapsclient");
const filterClasses = require("./filter-classes");

app.use(cors());

// the "/" endpoint should be used only for the initial request of the user uses the headers provided by google to detect the location
app.get("/", async (req, res) => {
  const client = await getConnectedClient();
  //"x-appengine-city":"bossier city"
  //"x-appengine-citylatlong":"32.515985,-93.732123"

  const data = {
    city: req.headers["x-appengine-city"],
    cityLatLong: req.headers["x-appengine-citylatlong"],
  };

  // example data
  //{"city":"bossier city","cityLatLong":"32.515985,-93.732123"}

  //code to parse the address
  const parseLL = (ll_string) => {
    // Find the index of the colon to split the string
    // Extract the numbers substring
    // Split the substring by the comma
    const numbersArray = ll_string.split(",");
    // Convert the numbers to floating-point values
    const latitude = parseFloat(numbersArray[0]);
    const longitude = parseFloat(numbersArray[1]);

    const cityLatLongObject = {
      latitude,
      longitude,
    };
    return cityLatLongObject;
  };

  target_city = data.city;
  target_lat_lng = parseLL(data.cityLatLong);
  const requestedOffering = req.query.offering || "";

  const finalArray = await filterClasses(
    requestedOffering,
    target_lat_lng.latitude,
    target_lat_lng.longitude
  );

  let niceLocation = target_city
    .split(" ")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");

  res.json({
    location: niceLocation,
    classes: finalArray,
  });
});

//the "/map" endpoint is used when you search for a location different
//than the one detected. query parameters of location and offering are useable
//must implement where if an offering parameter is not provided
app.get("/map", async (req, res) => {
  const location = req.query.location || "";
  const result = await geocode(location);
  const targetLat = result.geometry.location.lat;
  const targetLng = result.geometry.location.lng;

  let requestedOffering = req.query.offering || "";

  const finalArray = await filterClasses(
    requestedOffering,
    targetLat,
    targetLng
  );

  //sends the final array
  res.json({
    location: result.formatted_address,
    classes: finalArray,
  });
});

module.exports.app = app;
