import exampleZephyrListResponse from './zephyr-list-response.example.json';
import exampleZephyrDataResponse from './zephyr-data-response.example.json';
import exampleZephyr15MinAverageDataResponse from './zephyr-15-min-response.example.json';
import {reformatZephyrListResponse, convertToEarthsenseUrlDate, sinceStringToJavascriptDate, reformatZephyrDataResponse, reformatZephyrAveragedDataResponse} from './earthsense-api.service';

describe('Testing of reformatZephyrListResponse function', () => {

  test('Converts typical response as expected', async () => {

    expect.assertions(1);

    const expected = [
      {
        zNumber: 362,
        lastKnownLocation: {
          lat: 52.652643000,
          lng: -1.133957000,
          description: 'OTS or Transit',
          since: new Date('2020-03-06T09:00:00Z')
        }
      },
      {
        zNumber: 469,
        lastKnownLocation: {
          lat: 52.450859070,
          lng: -1.932933331,
          description: 'Automatic location',
          since: new Date('2020-08-06T14:41:36Z')
        }
      },
    ];

    const zephyrs = reformatZephyrListResponse(exampleZephyrListResponse);

    expect(zephyrs).toEqual(expected);

  });

});



describe('Testing of reformatZephyrDataResponse function', () => {

  test('Check it converts as expected', () => {
    
    const expected = [
      {
        zNumber: 469,
        cartridge: 'std-cartridge-slot-b',
        dateTime: new Date('2020-08-27T14:39:44+00:00'),
        longitude: -1.932965,
        latitude: 52.450895,
        o3: 2,
        no: 0,
        no2: 27,
        pm1: 5,
        pm2p5: 6,
        pm10: 14,
        humidity: 87,
        ambHumidity: 84,
        ambPressure: 99376,
        tempC: 14,
        ambTempC: 14
      },
      {
        zNumber: 469,
        cartridge: 'std-cartridge-slot-b',
        dateTime: new Date('2020-08-27T14:39:54+00:00'),
        longitude: -1.93297,
        latitude: 52.450895,
        o3: 2,
        no: 4,
        no2: 25,
        pm1: 5,
        pm2p5: 6,
        pm10: 14,
        humidity: 86,
        ambHumidity: 84,
        ambPressure: 99376,
        tempC: 14,
        ambTempC: 14
      },
    ];

    const formattedData = reformatZephyrDataResponse(exampleZephyrDataResponse);
    expect(formattedData).toEqual(expected);

  });

});



describe('Testing of reformatZephyrAverageDataResponse function', () => {

  test('Check it converts as expected', () => {
    
    // The first timestep from the response isn't expected because it's always just null values.
    const expected = [
      {
        zNumber: 469,
        cartridge: 'std-cartridge-slot-b',
        dateTime: new Date('2020-08-27T12:45:00+00:00'),
        longitude: -1.93294,
        latitude: 52.450763,
        o3: 9,
        no: 4,
        no2: 31,
        pm1: 5,
        pm2p5: 7,
        pm10: 14,
        humidity: 83,
        ambHumidity: 81,
        ambPressure: 99597,
        tempC: 14,
        ambTempC: 14
      },
      {
        zNumber: 469,
        cartridge: 'std-cartridge-slot-b',
        dateTime: new Date('2020-08-27T13:00:00+00:00'),
        longitude: -1.932934,
        latitude: 52.450833,
        o3: 8,
        no: 4,
        no2: 29,
        pm1: 5,
        pm2p5: 6,
        pm10: 13,
        humidity: 83,
        ambHumidity: 81,
        ambPressure: 99568,
        tempC: 14,
        ambTempC: 14
      },
    ];

    const formattedData = reformatZephyrAveragedDataResponse(exampleZephyr15MinAverageDataResponse, '15 min average on the quarter hours');
    expect(formattedData).toEqual(expected);

  });

});


describe('Testing of convertToEarthsenseUrlDate function', () => {

  test('Converts date as expected', () => {
    
    const date = new Date('2020-08-28T12:57:32.348Z');
    const expected = '20200828125732';

    const earthsenseDate = convertToEarthsenseUrlDate(date);
    expect(earthsenseDate).toBe(expected);

  });

});


describe('Testing of sinceStringToJavascriptDate function', () => {

  test('Check it converts as expected', () => {
    
    const since = '2020-08-06 14:41:36';
    const expected = new Date('2020-08-06T14:41:36Z');
    const date = sinceStringToJavascriptDate(since);
    expect(date).toEqual(expected);

  });

});