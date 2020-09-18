export interface ZephyrApp {
  zNumber: number; // the unique id that earthsense use for each Zephyr, e.g. 469
  stillInEarthsenseList?: boolean;
  getUnaveragedData?: boolean;
  get15MinAverageData?: boolean;
  getHourlyAverageData?: boolean;
  getDailyAverageData?: boolean;
  timeOfLatestUnaveragedValue?: Date;
  timeOfLatest15MinAverageValue?: Date;
  timeOfLatestHourlyAverageValue?: Date;
  timeOfLatestDailyAverageValue?: Date;
  lastKnownLocation?: LastKnownLocation;
}


interface LastKnownLocation {
  lat: number,
  lng: number,
  description: string,
  since: Date,
}