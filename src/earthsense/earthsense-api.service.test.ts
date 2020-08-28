import exampleZephyrListResponse from './zephyr-list-response.example.json';
import exampleZephyrDataResponse from './zephyr-data-response.example.json';
import {reformatZephyrListResponse, convertToEarthsenseUrlDate, sinceStringToJavascriptDate, reformatZephyrDataResponse} from './earthsense-api.service';

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
        cartridge: 'standard-cartridge-slot-b',
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
        cartridge: 'standard-cartridge-slot-b',
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