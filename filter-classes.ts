import calculateDistance from "./calculate-distance";
import { db } from "./database";

const filterClasses = async (
  requestedOffering: string,
  targetLat: number,
  targetLng: number
) => {
  // res.send(result);
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
    },
  });

  //creates an array with classes containing the distance from the provided location

  const classesWithDistance = classesData.map((classRecord) => {
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

  // todo: add a filter for ending and starting date.
  // class has to have a start date that is within the next 14 days and an end date that is after the current date

  filteredArray = filteredArray.filter((classData) => classData.active);

  const finalArray = filteredArray.slice(0, 10);
  return finalArray;
};

export default filterClasses;
