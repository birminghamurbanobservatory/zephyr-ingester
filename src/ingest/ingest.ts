import {config} from '../config';
import {getZephyrList} from '../earthsense/earthsense-api.service';
import * as logger from 'node-logger';
import * as Promise from 'bluebird';
import {ZephyrApp} from '../zephyr/zephyr-app.interface';
import * as event from 'event-stream';


export async function ingest(): Promise<void> {

  // Begin by getting an up-to-date list of our Zephyrs
  const zephyrs = await getZephyrList(config.earthsense);

  logger.debug(`${zephyrs.length} zephyrs currently listed by Earthsense.`);

  // TODO: Find any zephyrs in our database that are weren't returned in the response and set their 'stillInEarthsenseList' property to false.

  await Promise.mapSeries(zephyrs, processZephyr);

  logger.info(`${zephyrs.length} stations have been processed.`);

  return;

}



async function processZephyr(zephyr: ZephyrApp): Promise<void> {

  logger.debug(`Processing zephyr ${zephyr.zNumber}`);

  // Find out when the last readings we had from it was, then get readings from this time. If no readings yet then default to an hour ago?

  // Convert the readings into UO format.
  // TODO: Use the previous location in the Zephyr database document, along with lat/lon readings pulled from the API to decide whether the zephyr is moving or not. If it's not then try to keep re-using the same location ID so that the observations manager doesn't have to keep updating it's records. You'll want to do this properly, E.g. working out the maximum distance between locations rather than justing rounding and seeing if the values are the same. Rounding can produce different values even if they are geographically very close.
  // It does appear as if Earthsense does this to some degree themselves because the since property of the location isn't nessecarily the most recent location information we have.

  // Update the Zephyr document with the time of the latest reading

  return;

}



async function publishObservations(observations: any[]): Promise<void> {

  await Promise.mapSeries(observations, async (observation): Promise<void> => {
    await event.publish('observation.incoming', observation);
  });

  return;
}