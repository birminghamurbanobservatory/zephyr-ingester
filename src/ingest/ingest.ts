import {config} from '../config';
import {getZephyrList, getZephyrData} from '../earthsense/earthsense-api.service';
import * as logger from 'node-logger';
import * as Promise from 'bluebird';
import {ZephyrApp} from '../zephyr/zephyr-app.interface';
import * as event from 'event-stream';
import {updateZephyrsNotInLatestList, getZephyr, upsertZephyr} from '../zephyr/zephyr.service';
import {sub} from 'date-fns';
import {convertUnaveragedZephyrTimestepDataToObservations} from './observation.service';
import {last, cloneDeep} from 'lodash';


export async function ingest(): Promise<void> {

  // Begin by getting an up-to-date list of our Zephyrs
  const zephyrs = await getZephyrList(config.earthsense);

  logger.debug(`${zephyrs.length} zephyrs currently listed by Earthsense.`);

  // Find any zephyrs in our database that weren't returned in the response and set their 'stillInEarthsenseList' property to false.
  const zNumbersInList = zephyrs.map((zephyr) => zephyr.zNumber);
  const nNotInList = await updateZephyrsNotInLatestList(zNumbersInList);
  if (nNotInList === 0) {
    logger.info('All Zephyrs in the database are present in the list from the Earthsense API');
  } else {
    logger.info(`${nNotInList} Zephyrs in the database are no longer present in the latest list pulled from the Earthsense API.`);
  }

  await Promise.mapSeries(zephyrs, processZephyr);

  logger.info(`${zephyrs.length} stations have been processed.`);

  return;

}



async function processZephyr(zephyr: ZephyrApp): Promise<void> {

  logger.debug(`---- Processing zephyr ${zephyr.zNumber} ----`);

  // See if we have a document in our database for this Zephyr.
  let zephyrOnRecord;
  try {
    zephyrOnRecord = await getZephyr(zephyr.zNumber);
  } catch (err) {
    if (err.name === 'ZephyrNotFound') {
      // Allow to continue
    } else {
      throw err;
    }
  }

  const getReadingsFrom = zephyrOnRecord && zephyrOnRecord.timeOfLatestUnaveragedValue ? zephyrOnRecord.timeOfLatestUnaveragedValue : sub(new Date, {hours: 1});

  // Get the unaveraged readings
  const settings = {
    zNumber: zephyr.zNumber,
    start: getReadingsFrom,
    end: new Date()
  };
  const zephyrUnaveragedData = await getZephyrData(settings, config.earthsense);
  logger.debug(`Got ${zephyrUnaveragedData.length} timesteps worth of unaveraged data.`);

  // Convert the readings into UO format.
  const observations = convertUnaveragedZephyrTimestepDataToObservations(zephyrUnaveragedData);
  logger.debug(`Equating to ${observations.length} observations.`);

  // Update the Zephyr document with the time of the latest reading and the location from the getZephyrList request
  const zephyrToUpsert = cloneDeep(zephyr);
  zephyrToUpsert.stillInEarthsenseList = true;
  if (observations.length) {
    // observations should already be sorted chronologically
    const lastObs = last(observations);
    zephyrToUpsert.timeOfLatestUnaveragedValue = new Date(lastObs.resultTime);
  }
  const upsertedZephyr = await upsertZephyr(zephyrToUpsert);
  logger.debug('Zephyr upserted', upsertedZephyr);

  // Publish the observations
  await publishObservations(observations);
  
  return;

}



async function publishObservations(observations: any[]): Promise<void> {

  await Promise.mapSeries(observations, async (observation): Promise<void> => {
    await event.publish('observation.incoming', observation);
  });

  return;
}