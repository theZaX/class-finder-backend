const getConnectedClient = require("./database");
const calculateDistance = require("./calculate-distance");
const filterClasses = async (requestedOffering, targetLat, targetLng) => {
  // res.send(result);
  const client = await getConnectedClient();
  const classesData =
    await client.sql`select address_formatted, active, id, days_class_held, start_time, lat, lng, city, class_offering from master_calendar`;
  await client.end();

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
      distanceBetween,
    };
  });

  classesWithDistance.sort((a, b) => a.distanceBetween - b.distanceBetween);
  //if the requested class is english connect then filter for both english connect one and two
  let filteredArray;

  if (requestedOffering === "EnglishConnect") {
    filteredArray = classesWithDistance.filter((classData) => {
      if (
        classData.class_offering === "EnglishConnect 1" ||
        classData.class_offering === "EnglishConnect 2"
      ) {
        return true;
      } else return false;
    });
  } else if (
    requestedOffering === null ||
    requestedOffering === undefined ||
    requestedOffering === "" ||
    requestedOffering == "all"
  ) {
    filteredArray = classesWithDistance;
  } else {
    //if it is anything else filter based on the requested offering query
    filteredArray = classesWithDistance.filter((classData) => {
      if (classData.class_offering === requestedOffering) {
        return true;
      } else return false;
    });
  }

  // Filter by active classes

  // todo: add a filter for ending and starting date.
  // class has to have a start date that is within the next 14 days and an end date that is after the current date

  filteredArray = filteredArray.filter((classData) => classData.active);

  const finalArray = filteredArray.slice(0, 10);
  return finalArray;
};

module.exports = filterClasses;
