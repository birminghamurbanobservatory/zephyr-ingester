import {config} from '../config';
import {getZephyrList, getZephyrData, getAveragedZephyrData} from '../earthsense/earthsense-api.service';
import * as logger from 'node-logger';
import * as Promise from 'bluebird';
import {ZephyrApp} from '../zephyr/zephyr-app.interface';
import * as event from 'event-stream';
import {updateZephyrsNotInLatestList, getZephyr, upsertZephyr} from '../zephyr/zephyr.service';
import {sub} from 'date-fns';
import {convertAveragedZephyrTimestepDataToObservations, convertUnaveragedZephyrTimestepDataToObservations} from './observation.service';
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
  let zephyrOnRecord: ZephyrApp;
  try {
    zephyrOnRecord = await getZephyr(zephyr.zNumber);
  } catch (err) {
    if (err.name === 'ZephyrNotFound') {
      // Allow to continue
    } else {
      throw err;
    }
  }

  const zephyrToUpsert = cloneDeep(zephyr);
  zephyrToUpsert.stillInEarthsenseList = true;

  //-------------------------------------------------
  // Unaveraged Data
  //-------------------------------------------------
  if (zephyrOnRecord && zephyrOnRecord.getUnaveragedData) {
      
    let getReadingsFrom = sub(new Date, {hours: 1}); // set a default
    if (zephyrOnRecord && zephyrOnRecord.timeOfLatestUnaveragedValue) {
      const threshold = sub(new Date, {hours: 12});
      if (zephyrOnRecord.timeOfLatestUnaveragedValue > threshold) {
        getReadingsFrom = zephyrOnRecord.timeOfLatestUnaveragedValue;
      } else {
        // We don't want to go too far back in time otherwise the request to earthsense will take forever and there could be 10's of thousands of observations to process at once.
        getReadingsFrom = threshold;
      }
    }

    logger.debug(`Requesting unaveraged readings from ${getReadingsFrom.toISOString()}`);

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

    if (observations.length) {
      // observations should already be sorted chronologically
      const lastObs = last(observations);
      // This essentially sets the startDate for the next request.
      zephyrToUpsert.timeOfLatestUnaveragedValue = new Date(lastObs.resultTime);
    }

    // Publish the observations
    await publishObservations(observations);
  
  }

  //-------------------------------------------------
  // 15 minute average data
  //-------------------------------------------------
  // Let's default to getting the 15 minute data for Zephyr's that aren't on record yet.
  if (!zephyrOnRecord || (zephyrOnRecord && zephyrOnRecord.get15MinAverageData)) {

    const averagedOver = '15Min';
      
    let getReadingsFrom = sub(new Date, {hours: 3}); // set a default
    if (zephyrOnRecord && zephyrOnRecord.timeOfLatest15MinAverageValue) {
      const threshold = sub(new Date, {weeks: 1}); // can get away with this being much longer than for 10 secondly data 
      if (zephyrOnRecord.timeOfLatest15MinAverageValue > threshold) {
        getReadingsFrom = zephyrOnRecord.timeOfLatest15MinAverageValue;
      } else {
        getReadingsFrom = threshold;
      }
    }

    logger.debug(`Requesting ${averagedOver} readings from ${getReadingsFrom.toISOString()}`);

    // Get the readings
    const settings = {
      zNumber: zephyr.zNumber,
      start: getReadingsFrom,
      end: new Date(),
      averagedOver
    };
    const zephyrAveragedData = await getAveragedZephyrData(settings, config.earthsense);
    logger.debug(`Got ${zephyrAveragedData.length} timesteps worth of ${averagedOver} data.`);

    // Convert the readings into UO format.
    const observations = convertAveragedZephyrTimestepDataToObservations(zephyrAveragedData, averagedOver);
    logger.debug(`Equating to ${observations.length} observations.`);

    if (observations.length) {
      // observations should already be sorted chronologically
      const lastObs = last(observations);
      // This essentially sets the startDate for the next request.
      zephyrToUpsert.timeOfLatest15MinAverageValue = new Date(lastObs.resultTime);
    }

    // Publish the observations
    await publishObservations(observations);
  
  }

  //-------------------------------------------------
  // Hourly average data
  //-------------------------------------------------
  if (zephyrOnRecord && zephyrOnRecord.getHourlyAverageData) {

    const averagedOver = 'hourly';
      
    let getReadingsFrom = sub(new Date, {days: 1}); // Needs to be a long enough timeframe that it's likely to find data.
    if (zephyrOnRecord && zephyrOnRecord.timeOfLatestHourlyAverageValue) {
      const threshold = sub(new Date, {months: 1}); // can get away with this being much longer than for 10 secondly data 
      if (zephyrOnRecord.timeOfLatestHourlyAverageValue > threshold) {
        getReadingsFrom = zephyrOnRecord.timeOfLatestHourlyAverageValue;
      } else {
        getReadingsFrom = threshold;
      }
    }

    logger.debug(`Requesting ${averagedOver} readings from ${getReadingsFrom.toISOString()}`);

    // Get the readings
    const settings = {
      zNumber: zephyr.zNumber,
      start: getReadingsFrom,
      end: new Date(),
      averagedOver
    };
    const zephyrAveragedData = await getAveragedZephyrData(settings, config.earthsense);
    logger.debug(`Got ${zephyrAveragedData.length} timesteps worth of ${averagedOver} data.`);

    // Convert the readings into UO format.
    const observations = convertAveragedZephyrTimestepDataToObservations(zephyrAveragedData, averagedOver);
    logger.debug(`Equating to ${observations.length} observations.`);

    if (observations.length) {
      // observations should already be sorted chronologically
      const lastObs = last(observations);
      // This essentially sets the startDate for the next request.
      zephyrToUpsert.timeOfLatestHourlyAverageValue = new Date(lastObs.resultTime);
    }

    // Publish the observations
    await publishObservations(observations);
  
  }

  //-------------------------------------------------
  // Daily average data
  //-------------------------------------------------
  if (zephyrOnRecord && zephyrOnRecord.getDailyAverageData) {

    const averagedOver = 'daily';
      
    let getReadingsFrom = sub(new Date, {weeks: 1}); // Needs to be a long enough timeframe that it's likely to find data.
    if (zephyrOnRecord && zephyrOnRecord.timeOfLatestDailyAverageValue) {
      const threshold = sub(new Date, {months: 3}); // can get away with this being much longer than for 10 secondly data 
      if (zephyrOnRecord.timeOfLatestDailyAverageValue > threshold) {
        getReadingsFrom = zephyrOnRecord.timeOfLatestDailyAverageValue;
      } else {
        getReadingsFrom = threshold;
      }
    }

    logger.debug(`Requesting ${averagedOver} readings from ${getReadingsFrom.toISOString()}`);

    // Get the readings
    const settings = {
      zNumber: zephyr.zNumber,
      start: getReadingsFrom,
      end: new Date(),
      averagedOver
    };
    const zephyrAveragedData = await getAveragedZephyrData(settings, config.earthsense);
    logger.debug(`Got ${zephyrAveragedData.length} timesteps worth of ${averagedOver} data.`);

    // Convert the readings into UO format.
    const observations = convertAveragedZephyrTimestepDataToObservations(zephyrAveragedData, averagedOver);
    logger.debug(`Equating to ${observations.length} observations.`);

    if (observations.length) {
      // observations should already be sorted chronologically
      const lastObs = last(observations);
      // This essentially sets the startDate for the next request.
      zephyrToUpsert.timeOfLatestDailyAverageValue = new Date(lastObs.resultTime);
    }

    // Publish the observations
    await publishObservations(observations);
  
  }

  //-------------------------------------------------
  // Upsert Zephyr in database
  //-------------------------------------------------
  const upsertedZephyr = await upsertZephyr(zephyrToUpsert);
  logger.debug('Zephyr upserted', upsertedZephyr);
  
  return;
}



async function publishObservations(observations: any[]): Promise<void> {

  await Promise.mapSeries(observations, async (observation): Promise<void> => {
    await event.publish('observation.incoming', observation);
  });

  return;
}