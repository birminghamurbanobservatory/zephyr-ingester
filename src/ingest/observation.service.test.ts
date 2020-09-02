import {convertUnaveragedZephyrTimestepDataToObservations} from './observation.service';


describe('Testing of convertUnaveragedZephyrTimestepDataToObservations function', () => {

  test('Converts standard data as expected', () => {

    const data = [
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
        tempC: 15,
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
        tempC: 15,
        ambTempC: 14
      },
    ];

    const expected = [
      {
        resultTime: '2020-08-27T14:39:44.000Z',
        hasResult: {
          value: {
            type: 'Point',
            coordinates: [-1.932965, 52.450895]
          },
          unit: 'geojson-geometry'
        },
        madeBySensor: 'zephyr-469-gps-sensor',
        observedProperty: 'location',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:44.000Z',
        hasResult: {
          value: 2,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'ozone-mass-concentration',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:44.000Z',
        hasResult: {
          value: 0,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'nitrogen-monoxide-mass-concentration',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:44.000Z',
        hasResult: {
          value: 27,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'nitrogen-dioxide-mass-concentration',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:44.000Z',
        hasResult: {
          value: 5,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'pm1-mass-concentration',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:44.000Z',
        hasResult: {
          value: 6,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'pm2p5-mass-concentration',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:44.000Z',
        hasResult: {
          value: 14,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'pm10-mass-concentration',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:44.000Z',
        hasResult: {
          value: 84,
          unit: 'percent'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'relative-humidity',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:44.000Z',
        hasResult: {
          value: 14,
          unit: 'degree-celsius'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'air-temperature',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:44.000Z',
        hasResult: {
          value: 993.76,
          unit: 'hectopascal'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'air-pressure',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:54.000Z',
        hasResult: {
          value: {
            type: 'Point',
            coordinates: [-1.93297, 52.450895]
          },
          unit: 'geojson-geometry'
        },
        madeBySensor: 'zephyr-469-gps-sensor',
        observedProperty: 'location',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:54.000Z',
        hasResult: {
          value: 2,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'ozone-mass-concentration',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:54.000Z',
        hasResult: {
          value: 4,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'nitrogen-monoxide-mass-concentration',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:54.000Z',
        hasResult: {
          value: 25,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'nitrogen-dioxide-mass-concentration',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:54.000Z',
        hasResult: {
          value: 5,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'pm1-mass-concentration',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:54.000Z',
        hasResult: {
          value: 6,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'pm2p5-mass-concentration',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:54.000Z',
        hasResult: {
          value: 14,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'pm10-mass-concentration',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:54.000Z',
        hasResult: {
          value: 84,
          unit: 'percent'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'relative-humidity',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:54.000Z',
        hasResult: {
          value: 14,
          unit: 'degree-celsius'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'air-temperature',
        aggregation: 'instant'
      },
      {
        resultTime: '2020-08-27T14:39:54.000Z',
        hasResult: {
          value: 993.76,
          unit: 'hectopascal'
        },
        madeBySensor: 'zephyr-469-std-cartridge-slot-b',
        observedProperty: 'air-pressure',
        aggregation: 'instant'
      }
    ];

    const observations = convertUnaveragedZephyrTimestepDataToObservations(data);

    expect(observations).toEqual(expected);

  });

});