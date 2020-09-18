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


export function reformatZephyrDataResponse(responseBody: any): ZephyrTimestepData[] {

  const slotAData = responseBody.slotA ? processSlot(responseBody.slotA, 'a') : [];
  const slotBData = responseBody.slotB ? processSlot(responseBody.slotB, 'b') : [];

  const combined = concat(slotAData, slotBData);

  // Makes things a bit easier when converting this data to UO observations if I add the zNumber to each set of readings here.
  const zNumber = Number(responseBody.queryInfo.ZephyrID);
  const timestepData = combined.map((item) => {
    item.zNumber = zNumber;
    return item;
  });

  return timestepData;

}


export async function getAveragedZephyrData(settings: {zNumber: number, start: Date, end: Date, averagedOver: string}, credentials: EarthsenseCredentials): Promise<ZephyrTimestepData[]> {

  const averageChoices = {
    '15Min': {
      chainIdForUrl: '3',
      keyInResponse: '15 min average on the quarter hours'
    },
    hourly: {
      chainIdForUrl: '1',
      keyInResponse: 'Hourly average on the hour'
    },
    daily: {
      chainIdForUrl: '2',
      keyInResponse: 'Daily average at midnight'
    }
  };

  const averageChoice = averageChoices[settings.averagedOver];

  if (!averageChoice) {
    throw new Error(`${settings.averagedOver} is not a valid average choice.`);
  }

  let response;

  const startInEarthsenseFormat = convertToEarthsenseUrlDate(settings.start);
  const endInEarthsenseFormat = convertToEarthsenseUrlDate(settings.end);
  const slots = 'AB';

  try {
    
    // This gets the raw unaveraged data
    response = await axios.get(
      `https://data.earthsense.co.uk/dataForViewBySlotsAveraged/${credentials.username}/${credentials.key}/${settings.zNumber}/${startInEarthsenseFormat}/${endInEarthsenseFormat}/${slots}/def/${averageChoice.chainIdForUrl}/JSON/api`
    );

  } catch (err) {
    throw new Error(`Failed to Zephyr Data from Earthsense API. Reason: ${err.message}`);
  }

  return reformatZephyrAveragedDataResponse(response.data, averageChoice.keyInResponse);

}


export function reformatZephyrAveragedDataResponse(responseBody: any, keyInResponse: string): ZephyrTimestepData[] {

  const subSection = responseBody.data[keyInResponse];
  if (!subSection) {
    throw new Error(`Earthsense response is not as expected, there should be an object with a key of ${keyInResponse}.`);
  }

  // The slot data is more nested than in the unaveraged response, with a key specific to the average period.
  const slotAData = subSection.slotA ? processSlot(subSection.slotA, 'a') : [];
  const slotBData = subSection.slotB ? processSlot(subSection.slotB, 'b') : [];

  // For some reason the earthsense API response for averaged data always has all null values for the first timestep. We'll therefore remove it here because it's useless.
  slotAData.shift();
  slotBData.shift();

  const combined = concat(slotAData, slotBData);

  // Add the zNumber to each set of readings to make things easier later.
  const zNumber = Number(responseBody.queryInfo.ZephyrID);
  const timestepData = combined.map((item) => {
    item.zNumber = zNumber;
    return item;
  });

  return timestepData;

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

  const cartridgeType = 'std'; // 'std' is short for standard. TODO: set this as 'enhanced' if there variables that indicate this is the case.

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