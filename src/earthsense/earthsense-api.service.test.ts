import exampleZephyrListResponse from './zephyr-list-response.example.json';
import {reformatZephyrListResponse, convertToEarthsenseUrlDate} from './earthsense-api.service';

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



describe('Testing of convertToEarthsenseUrlDate function', () => {

  test('Converts date as expected', () => {
    
    const date = new Date('2020-08-28T12:57:32.348Z');
    const expected = '20200828125732';

    const earthsenseDate = convertToEarthsenseUrlDate(date);
    expect(earthsenseDate).toBe(expected);

  });

});