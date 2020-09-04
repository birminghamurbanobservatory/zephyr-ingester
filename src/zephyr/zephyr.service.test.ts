import {connectDb, disconnectDb} from '../db/mongodb-service';
import * as logger from 'node-logger';
import {config} from '../config';
import * as MongodbMemoryServer from 'mongodb-memory-server';
import {upsertZephyr} from './zephyr.service';
import {ZephyrApp} from './zephyr-app.interface';
import Zephyr from './zephyr.model';

describe('Testing of zephyr service', () => {

  let mongoServer;

  beforeAll(() => {
    // Configure the logger
    logger.configure(config.logger);
  });

  beforeEach(() => {
    // Create fresh database
    mongoServer = new MongodbMemoryServer.MongoMemoryServer();
    return mongoServer.getConnectionString()
    .then((url) => {
      return connectDb(url);
    });    
  });

  afterEach(() => {
    // Disconnect from, then stop, database.
    return disconnectDb()
    .then(() => {
      mongoServer.stop();
      return;
    });
  });  


  test('Test zephyr upserting', async () => {

    expect.assertions(3);
    
    const zephyrToInsert: ZephyrApp = {
      zNumber: 469,
      lastKnownLocation: {
        // It's worth keeping the full
        lat: 52.5432,
        lng: -1.9234,
        description: 'Automatic location',
        since: new Date('2020-09-04T18:16:26.562Z')
      },
      stillInEarthsenseList: true,
      // Let's assume we weren't able to get any observations first time round and thus couldn't set timeOfLatestUnaveragedValue
    };

    // Insert it
    const inserted = await upsertZephyr(zephyrToInsert);
    expect(inserted).toEqual(zephyrToInsert);

    // Now let's update it
    const zephyrToUpdate: ZephyrApp = {
      zNumber: 469,
      lastKnownLocation: {
        // It's worth keeping the full
        lat: 52.555,
        lng: -1.9222,
        description: 'Automatic location',
        since: new Date('2020-09-04T18:29:56.333Z')
      },
      stillInEarthsenseList: true,
      timeOfLatestUnaveragedValue: new Date('2020-09-04T18:31:44.333Z')
    };

    const updated = await upsertZephyr(zephyrToUpdate);
    expect(updated).toEqual(zephyrToUpdate);

    // Check theres only 1 document in the database
    const zephyrs = await Zephyr.find({}).exec();
    expect(zephyrs.length).toBe(1);

  });

});