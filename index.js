const express = require('express')
const app = express()
const port = 3000
const getConnectedClient = require("./database")
const geocode = require('./mapsclient')
const calculateDistance = require('./calculate-distance')

app.get('/', async (req, res) => {


  const client = await getConnectedClient();
  const result = await client.sql`select * from master_calendar`

  res.json(result)
})

app.get('/map', async (req, res) => {

   const location = req.query.location
   let requestedOffering = req.query.offering

  // for offering filter by an array of class offerings
  let offeringFilterArray = [requestedOffering]

  if(requestOffering=== "EnglishConnect"){
    offeringFilterArray= ["EnglishConnect 1", "EnglishConnect 2"]
  }


  const result = await geocode(location);
  const formattedAddress = result.formatted_address;

  const client = await getConnectedClient();
  const classesData= await client.sql`select address_formatted, id, days_class_held, start_time, lat, lng, city, class_offering from master_calendar`

  //creates an array with classes containing the distance from the provided location

  const classesWithDistance = classesData.data.map((classRecord) => {
    const distanceBetween = calculateDistance(
      classRecord.lat, 
      classRecord.lng, 
      //geocode result1,
      //geocode result2
    );
  
    return {
      ...classRecord,
      distanceBetween
    };
  });

//filter classses with distance based on the distance from the provided address then slice it to the top 10 closest classes

  res.json(data)
})



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})