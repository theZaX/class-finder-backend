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




  const result = await geocode(location);
  const targetLat = result.geometry.location.lat;
  const targetLng = result.geometry.location.lng;
  console.log(targetLat + " " + targetLng);
  // res.send(result);
  const client = await getConnectedClient();
  const classesData= await client.sql`select address_formatted, id, days_class_held, start_time, lat, lng, city, class_offering from master_calendar`

  //creates an array with classes containing the distance from the provided location


const classesWithDistance = classesData.rows.map((classRecord) => {
      const distanceBetween = calculateDistance(
        classRecord.lat, 
        classRecord.lng, 
        targetLat,
        targetLng
      );
    
      return {
        ...classRecord,
        distanceBetween
      };
  });

classesWithDistance.sort((a,b) => a.distanceBetween - b.distanceBetween);
//if the requested class is english connect then filter for both english connect one and two
let filteredArray;
if(requestedOffering === "EnglishConnect"){
  filteredArray = classesWithDistance.filter((classData) => {
    if(classData.class_offering === "EnglishConnect 1" || classData.class_offering === "EnglishConnect 2" ){
      return true;
    }
    else return false;
  })
}
else if(requestedOffering === null || requestedOffering === undefined || requestedOffering === ""){
  filteredArray = classesWithDistance;
}
else{
  //if it is anything else filter based on the requested offering query
  filteredArray = classesWithDistance.filter((classData) => {
    if(classData.class_offering === requestedOffering ){
      return true;
    }
    else return false;
  })
}

//slices the top 10 closest classes
const finalArray = filteredArray.slice(0,10);
//sends the final array
res.send(finalArray);  
})



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})