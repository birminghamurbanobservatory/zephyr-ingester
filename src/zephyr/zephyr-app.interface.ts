export interface ZephyrApp {
  zNumber: number; // the unique id that earthsense use for each Zephyr, e.g. 469
  stillInEarthsenseList?: boolean;
  timeOfLatestUnaveragedValue?: Date;
  lastKnownLocation?: LastKnownLocation;
}


interface LastKnownLocation {
  lat: number,
  lng: number,
  description: string,
  since: Date,
}