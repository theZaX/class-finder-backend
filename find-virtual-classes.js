const getConnectedClient = require("./database");
const calculateDistance = require("./calculate-distance");
const filterClasses = async (requestedOffering, targetLat, targetLng) => {
  const client = await getConnectedClient();
  const classesData =
    await client.sql`select address_formatted, active, id, days_class_held, start_time, lat, lng, city, class_offering, class_modality from master_calendar`;
  await client.end();

  const classesWithDistance = classesData.rows

    .filter((classRecord) => {
      // Add your filter condition here, for example:
      // Only include classes with class_modality of 'virtual'
      return classRecord.class_modality === "Virtual-Online";
    })

    .map((classRecord) => {
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
  filteredArray = filteredArray.filter((classData) => classData.active);

  for (let i = 0; i < filteredArray.length; ++i) {
    filteredArray[i].distanceBetween = 0;
    filteredArray[i].address_formatted = "Zoom";
    filteredArray[i].city = "Online Class";
  }

  const finalArray = filteredArray.slice(0, 10);
  console.log(finalArray);
  return finalArray;
};

module.exports = filterClasses;
