import { Request, Response } from "express";
import filterClasses from "./filter-classes";
import geocode from "./mapsclient";

import express from "express";
import cors from "cors";
import findVirtualClasses from "./find-virtual-classes";
const app = express();

const parseLL = (ll_string: string) => {
  const numbersArray = ll_string.split(",");
  const latitude = parseFloat(numbersArray[0]);
  const longitude = parseFloat(numbersArray[1]);

  const cityLatLongObject = {
    latitude,
    longitude,
  };
  return cityLatLongObject;
};

app.use(cors());

// the "/" endpoint should be used only for the initial request of the user uses the headers provided by google to detect the location
app.get("/", async (req: Request, res: Response) => {
  try {
    // "x-appengine-city":"bossier city"
    // "x-appengine-citylatlong":"32.515985,-93.732123"

    const data = {
      city: req.headers["x-appengine-city"],
      cityLatLong: req.headers["x-appengine-citylatlong"],
    };

    // example data
    //{"city":"bossier city","cityLatLong":"32.515985,-93.732123"}

    //code to parse the address

    const target_city = data.city as string;
    const target_lat_lng = parseLL(data.cityLatLong as string);
    const requestedOffering = req.query.offering || "";

    const [finalArray, virtClasses] = await Promise.all([
      filterClasses(
        requestedOffering as string,
        target_lat_lng.latitude,
        target_lat_lng.longitude
      ),
      findVirtualClasses(
        requestedOffering as string,
        target_lat_lng.latitude,
        target_lat_lng.longitude
      ),
    ]);

    let niceLocation = target_city
      .split(" ")
      .map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");

    res.json({
      location: niceLocation,
      classes: finalArray,
      virtclasses: virtClasses,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

//the "/map" endpoint is used when you search for a location different
//than the one detected. query parameters of location and offering are useable
//must implement where if an offering parameter is not provided
app.get("/map", async (req: Request, res: Response) => {
  try {
    const location = req.query.location || "";

    let result = await geocode(location as string);

    if (!result) {
      // append usa
      result = await geocode(location + " USA");
    }

    const targetLat = result.geometry.location.lat;
    const targetLng = result.geometry.location.lng;

    let requestedOffering = (req.query.offering as string) || "all";

    const [finalArray, virtClasses] = await Promise.all([
      filterClasses(requestedOffering, targetLat, targetLng),
      findVirtualClasses(requestedOffering, targetLat, targetLng),
    ]);
    //sends the final array
    res.json({
      location: result.formatted_address,
      classes: finalArray,
      virtclasses: virtClasses,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

module.exports.app = app;
