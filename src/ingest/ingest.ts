import {config} from '../config';
import {getZephyrList, getZephyrData} from '../earthsense/earthsense-api.service';
import * as logger from 'node-logger';
import * as Promise from 'bluebird';
import {ZephyrApp} from '../zephyr/zephyr-app.interface';
import * as event from 'event-stream';
import {updateZephyrsNotInLatestList, getZephyr} from '../zephyr/zephyr.service';
import {sub} from 'date-fns';
import {convertUnaveragedZephyrTimestepDataToObservations} from './observation.service';
import {random} from 'lodash';


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

  logger.debug(`Processing zephyr ${zephyr.zNumber}`);

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

  // Convert the readings into UO format.
  const observations = convertUnaveragedZephyrTimestepDataToObservations(zephyrUnaveragedData);

  // Update the Zephyr document with the time of the latest reading

  // Publish the observations
  // Need to be really careful with the publication order here because for Zephyrs that are mobile the sensor-deployment-manager will be using the GPS readings to up the location of the platform which in turn will be used to update non-locational observations linked to this platform. Therefore you need to publish the timesteps in cronological order with the location observation first, potentially with delays in between so that the sensor-deployment-manager has time to update its platform location before non-location information arrives.

  return;

}



async function publishObservations(observations: any[]): Promise<void> {

  await Promise.mapSeries(observations, async (observation): Promise<void> => {
    await event.publish('observation.incoming', observation);
  });

  return;
}