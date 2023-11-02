const express = require('express')
var cors = require('cors');
const app = express()
const getConnectedClient = require("./database")
const geocode = require('./mapsclient')
const filterClasses = require('./filter-classes')

app.use(cors());

app.get('/', async (req, res) => {
  const client = await getConnectedClient();
  //"x-appengine-city":"bossier city"
  //"x-appengine-citylatlong":"32.515985,-93.732123"

  const data = {
    city: req.headers["x-appengine-city"],
    cityLatLong: req.headers["x-appengine-citylatlong"],
  }
  console.log(data);
  //{"city":"bossier city","cityLatLong":"32.515985,-93.732123"}
  //code to parse the address
  const parseLL = (ll_string) => {
    // Find the index of the colon to split the string
    // Extract the numbers substring
    // Split the substring by the comma
    const numbersArray = ll_string.split(',');
    // Convert the numbers to floating-point values
    const latitude = parseFloat(numbersArray[0]);
    const longitude = parseFloat(numbersArray[1]);
    console.log(latitude);
    console.log(longitude);
    // Create an object with the extracted numbers
    const cityLatLongObject = {
      latitude,
      longitude,
    };
    return cityLatLongObject;
  }

  target_city = data.city
  console.log(target_city);
  
  target_lat_lng = parseLL(data.cityLatLong);
  console.log(target_lat_lng);
  const requestedOffering = "";
  const finalArray = (await filterClasses(requestedOffering, target_lat_lng.latitude, target_lat_lng.longitude)).finalArray
  res.send(finalArray);
})

app.get('/map', async (req, res) => {

  const location = req.query.location
  const result = await geocode(location);
  const targetLat = result.geometry.location.lat;
  const targetLng = result.geometry.location.lng;
  console.log(targetLat + " " + targetLng);
  let requestedOffering = req.query.offering

  const finalArray = (await filterClasses(requestedOffering, targetLat, targetLng)).finalArray

  //sends the final array
  res.send(finalArray);
})

module.exports.app = app

