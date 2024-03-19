import calculateDistance from "./calculate-distance";
import { db } from "./database";
const findVirtualClasses = async (
  requestedOffering: string,
  targetLat: number,
  targetLng: number
) => {
  const classesData = await db.query.masterCalendar.findMany({
    columns: {
      addressFormatted: true,
      active: true,
      id: true,
      daysClassHeld: true,
      startTime: true,
      lat: true,
      lng: true,
      city: true,
      classOffering: true,
      classModality: true,
    },
  });
  const classesWithDistance = classesData

    .filter((classRecord) => {
      // Add your filter condition here, for example:
      // Only include classes with class_modality of 'virtual'
      return classRecord.classModality === "Virtual-Online";
    })

    .map((classRecord) => {
      const distanceBetween = calculateDistance(
        classRecord.lat as any,
        classRecord.lng as any,
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
        classData.classOffering === "EnglishConnect 1" ||
        classData.classOffering === "EnglishConnect 2"
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
      if (classData.classOffering === requestedOffering) {
        return true;
      } else return false;
    });
  }

  // Filter by active classes
  filteredArray = filteredArray.filter((classData) => classData.active);

  for (let i = 0; i < filteredArray.length; ++i) {
    filteredArray[i].distanceBetween = 0;
    filteredArray[i].addressFormatted = "Zoom";
    filteredArray[i].city = "Online Class";
  }

  const finalArray = filteredArray.slice(0, 10);
  return finalArray;
};

export default findVirtualClasses;
