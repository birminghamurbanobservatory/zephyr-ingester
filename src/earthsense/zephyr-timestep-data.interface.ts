export interface ZephyrTimestepData {
  zNumber: number,
  cartridge: string, // e.g. 'std-cartridge-slot-a'
  dateTime: Date,
  longitude: number,
  latitude: number,
  o3: number,
  no: number,
  no2: number,
  pm1: number,
  pm2p5: number,
  pm10: number,
  humidity: number, // humidity on the PCB perhaps?
  ambHumidity: number, // Ambient humidity
  ambPressure: number, // looks to be at station height (in pascals)
  tempC: number, // temp on the PCB perhaps?
  ambTempC: number,
}