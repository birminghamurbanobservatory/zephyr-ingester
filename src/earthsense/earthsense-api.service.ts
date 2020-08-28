import axios from 'axios';
import {ZephyrApp} from '../zephyr/zephyr-app.interface';
import {EarthsenseCredentials} from './earthsense-credentials.interface';
import * as check from 'check-types';
import {cloneDeep, concat} from 'lodash';
import {ZephyrTimestepData} from './zephyr-timestep-data.interface';


export async function getZephyrList(credentials: EarthsenseCredentials): Promise<ZephyrApp[]> {

  let response;

  try {
 
    response = await axios.get(
      `https://data.earthsense.co.uk/zephyrsForUser/${credentials.username}/${credentials.key}`
    );

  } catch (err) {
    throw new Error(`Failed to get Zephyr List from Earthsense API. Reason: ${err.message}`);
  }

  const formatted = reformatZephyrListResponse(response.data);

  return formatted;

}



export function reformatZephyrListResponse(response: any): ZephyrApp[] {

  if (check.not.nonEmptyObject(response)) {
    throw new Error('Expected Zephyr list response from Earthsense API to be a non-empty object');
  }

  if (check.not.object(response.usersZephyrs)) {
    throw new Error(`Expected Zephyr list response to contain an object called 'usersZephyrs'`);
  }

  const usersZephyrs = cloneDeep(response.usersZephyrs);

  const formattedZephyrs = Object.keys(usersZephyrs).map((key) => {

    const rawZephyr = usersZephyrs[key];

    const formattedZephyr: ZephyrApp = {
      zNumber: rawZephyr.zNumber,
      lastKnownLocation: {
        // It's worth keeping the full
        lat: Number(rawZephyr.location.lat),
        lng: Number(rawZephyr.location.lng),
        description: rawZephyr.location.desc,
        since: sinceStringToJavascriptDate(rawZephyr.location.since)
      }
    };

    return formattedZephyr;

  });

  return formattedZephyrs;

}


export async function getZephyrData(settings: {zNumber: number, start: Date, end: Date}, credentials: EarthsenseCredentials): Promise<ZephyrTimestepData[]> {

  let response;

  const startInEarthsenseFormat = convertToEarthsenseUrlDate(settings.start);
  const endInEarthsenseFormat = convertToEarthsenseUrlDate(settings.end);
  const slots = 'AB';

  try {
    
    // This gets the raw unaveraged data
    response = await axios.get(
      `https://data.earthsense.co.uk/dataForViewBySlots/${credentials.username}/${credentials.key}/${settings.zNumber}/${startInEarthsenseFormat}/${endInEarthsenseFormat}/${slots}/def/JSON/api`
    );

  } catch (err) {
    throw new Error(`Failed to Zephyr Data from Earthsense API. Reason: ${err.message}`);
  }

  return reformatZephyrDataResponse(response.data);

}


export function reformatZephyrDataResponse(response: any): ZephyrTimestepData[] {

  const slotAData = response.slotA ? processSlot(response.slotA, 'a') : [];
  const slotBData = response.slotB ? processSlot(response.slotB, 'b') : [];

  const combined = concat(slotAData, slotBData);

  return combined;

}


export function processSlot(slotData: any, slotLetter: string): ZephyrTimestepData[] {

  const mappings = {
    dateTime: 'dateTime',
    latitude: 'latitude',
    longitude: 'longitude',
    O3: 'o3',
    NO: 'no',
    NO2: 'no2',
    particulatePM1: 'pm1',
    particulatePM25: 'pm2p5',
    particulatePM10 : 'pm10',
    tempC: 'tempC',
    ambTempC: 'ambTempC',
    humidity: 'humidity',
    ambHumidity: 'ambHumidity',
    ambPressure: 'ambPressure'
  };

  // First check which variables are available and restructure the data slightly
  const interFormat = [];
  Object.keys(mappings).forEach((oldKey) => {
    const newKey = mappings[oldKey];
    if (slotData[oldKey] && slotData[oldKey].data) {
      interFormat.push({
        newKey,
        data: slotData[oldKey].data
      });
    }
  });

  if (interFormat.length === 0) {
    // If none of the variables were present then return an empty array
    return [];
  }

  const cartridgeType = 'standard'; // TODO: set this as 'enhanced' if there variables that indicate this is the case

  // Now let's check each variable has data of the same length, otherwise you could end up matching measurements to the wrong timestamp.
  const dataLengths = interFormat.map((variable) => variable.data.length);
  const allEqual = dataLengths.every((length) => length === dataLengths[0]);
  if (!allEqual) {
    throw new Error(`Not every variable's data is the same length. Expected all variables to have a length of ${dataLengths[0]}`);
  }
  const nTimesteps = dataLengths[0];

  let timestepData = [];
  for (let idx = 0; idx < nTimesteps; idx++) {
    timestepData.push({
      cartridge: `${cartridgeType}-cartridge-slot-${slotLetter}`
    });
  }

  interFormat.forEach((variable) => {
    variable.data.forEach((dataValue, idx) => {
      timestepData[idx][variable.newKey] = dataValue;
    });
  });

  timestepData = timestepData.map((timestep) => {
    timestep.dateTime = new Date(timestep.dateTime);
    return timestep;
  });

  return timestepData;

}


export function convertToEarthsenseUrlDate(date: Date): string {

  const isoDate = date.toISOString();
  const earthsenseUrlDate = `${isoDate.slice(0, 4)}${isoDate.slice(5, 7)}${isoDate.slice(8, 10)}${isoDate.slice(11, 13)}${isoDate.slice(14, 16)}${isoDate.slice(17, 19)}`;
  return earthsenseUrlDate;

}


export function sinceStringToJavascriptDate(since: string): Date {

  // I'm assuming this string (e.g. '2020-08-06 14:41:36') is in UTC, however in order for this to parsed as UTC I need to add Z on the end of it
  const stringToParse = since.includes('Z') ? since : `${since}Z`;
  return new Date(stringToParse);

}