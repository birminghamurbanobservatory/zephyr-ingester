import {config} from '../config';
import {getZephyrList} from '../earthsense/earthsense-api.service';
import * as logger from 'node-logger';
import * as Promise from 'bluebird';
import {ZephyrApp} from '../zephyr/zephyr-app.interface';
import * as event from 'event-stream';
import {updateZephyrsNotInLatestList} from '../zephyr/zephyr.service';


export async function ingest(): Promise<void> {

  // Begin by getting an up-to-date list of our Zephyrs
  const zephyrs = await getZephyrList(config.earthsense);

  logger.debug(`${zephyrs.length} zephyrs currently listed by Earthsense.`);

  // Find any zephyrs in our database that are weren't returned in the response and set their 'stillInEarthsenseList' property to false.
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

  // See if we have a document in our database for this Zephyr. If so, find out when the last readings we had from it was, then get readings from this time. If no readings yet then default to an hour ago?

  // Convert the readings into UO format.

  // Update the Zephyr document with the time of the latest reading

  // Publish the observations
  // Need to be really careful with the publication order here because for Zephyrs that are mobile the sensor-deployment-manager will be using the GPS readings to up the location of the platform which in turn will be used to update non-locational observations linked to this platform. Therefore you need to publish the timesteps in cronological order with the location observation first, potentially with delays in between so that the sensor-deployment-manager has time to update it's platform location before non-location information arrives.

  return;

}



async function publishObservations(observations: any[]): Promise<void> {

  await Promise.mapSeries(observations, async (observation): Promise<void> => {
    await event.publish('observation.incoming', observation);
  });

  return;
}