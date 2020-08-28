import axios from 'axios';
import {ZephyrApp} from '../zephyr/zephyr-app.interface';
import {EarthsenseCredentials} from './earthsense-credentials.interface';
import * as check from 'check-types';
import {cloneDeep} from 'lodash';
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

  const formatted = reformatZephyrListResponse(response);

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
        since: new Date(rawZephyr.location.since) // TODO: is the string, e.g. 2020-08-06 14:41:36, that we get from earthsense in GMT or local time (e.g. BST)
      }
    };

    return formattedZephyr;

  });

  return formattedZephyrs;

}


// Unaveraged data
export async function getZephyrData(settings: {zNumber: number, start: Date, end: Date}, credentials: EarthsenseCredentials): Promise<ZephyrTimestepData[]> {

  let response;

  const startInEarthsenseFormat = convertToEarthsenseUrlDate(settings.start);
  const endInEarthsenseFormat = convertToEarthsenseUrlDate(settings.end);
  const slots = 'AB';

  try {
    
    response = await axios.get(
      `https://data.earthsense.co.uk/dataForViewBySlots/${credentials.username}/${credentials.key}/${settings.zNumber}/${startInEarthsenseFormat}/${endInEarthsenseFormat}/${slots}/def/JSON/api`
    );

  } catch (err) {
    throw new Error(`Failed to Zephyr Data from Earthsense API. Reason: ${err.message}`);
  }

  return reformatZephyrDataResponse(response);

}

export function reformatZephyrDataResponse(response: any): ZephyrTimestepData[] {

  return response;

} 


export function convertToEarthsenseUrlDate(date: Date): string {

  const isoDate = date.toISOString();
  const earthsenseUrlDate = `${isoDate.slice(0, 4)}${isoDate.slice(5, 7)}${isoDate.slice(8, 10)}${isoDate.slice(11, 13)}${isoDate.slice(14, 16)}${isoDate.slice(17, 19)}`;
  return earthsenseUrlDate;

}