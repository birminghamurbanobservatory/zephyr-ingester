import {Observation} from './observation.interface';
import {ZephyrTimestepData} from '../earthsense/zephyr-timestep-data.interface';
import {sortBy} from 'lodash';
import * as check from 'check-types';
import {v4 as uuid} from 'uuid';

export function convertUnaveragedZephyrTimestepDataToObservations(data: ZephyrTimestepData[]): Observation[] {

  const observations: Observation[] = [];

  // Let's make sure the data is in consecutive order
  const ordered = sortBy(data, 'dateTime');

  ordered.forEach((timestep) => {

    const resultTime = timestep.dateTime.toISOString();
    const slotSensorId = `zephyr-${timestep.zNumber}-${timestep.cartridge}`;
    const gpsSensorId = `zephyr-${timestep.zNumber}-gps-sensor`;
    const aggregation = 'instant';
    // Decided the best approach was to add the Zephyr's GPS location to each observation, then the sensor-deployment-manager with its passLocationToObservations setting can decide if it wants to use these GPS readings or inherit the host platform's location instead. 
    const location = {
      id: uuid(),
      validAt: resultTime,
      geometry: {
        type: 'Point',
        coordinates: [timestep.longitude, timestep.latitude]
      } 
    };

    // Makes sense for the location observation to be added to the observations array first in case it is being used to update a platform's location in the sensor-deployment-manager.
    if (check.assigned(timestep.longitude) && check.assigned(timestep.longitude)) {
      observations.push({
        resultTime,
        hasResult: {
          value: {
            type: 'Point',
            coordinates: [timestep.longitude, timestep.latitude]
          },
          unit: 'geojson-geometry'
        },
        observedProperty: 'location',
        madeBySensor: gpsSensorId,
        aggregation,
        location
      });
    }

    if (check.assigned(timestep.o3)) {
      observations.push({
        resultTime,
        hasResult: {
          value: timestep.o3,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'ozone-mass-concentration',
        aggregation,
        location
      });
    }

    if (check.assigned(timestep.no)) {
      observations.push({
        resultTime,
        hasResult: {
          value: timestep.no,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'nitrogen-monoxide-mass-concentration',
        aggregation,
        location
      });
    }

    if (check.assigned(timestep.no2)) {
      observations.push({
        resultTime,
        hasResult: {
          value: timestep.no2,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'nitrogen-dioxide-mass-concentration',
        aggregation,
        location
      });
    }

    if (check.assigned(timestep.pm1)) {
      observations.push({
        resultTime,
        hasResult: {
          value: timestep.pm1,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'pm1-mass-concentration',
        aggregation,
        location
      });
    }

    if (check.assigned(timestep.pm2p5)) {
      observations.push({
        resultTime,
        hasResult: {
          value: timestep.pm2p5,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'pm2p5-mass-concentration',
        aggregation,
        location
      });
    }

    if (check.assigned(timestep.pm10)) {
      observations.push({
        resultTime,
        hasResult: {
          value: timestep.pm10,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'pm10-mass-concentration',
        aggregation,
        location
      });
    }

    // For now at least only bother with the ambient humidity
    if (check.assigned(timestep.ambHumidity)) {
      observations.push({
        resultTime,
        hasResult: {
          value: timestep.ambHumidity,
          unit: 'percent'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'relative-humidity',
        aggregation,
        location
      });
    }

    // For now at least only bother with the ambient temperature
    if (check.assigned(timestep.ambTempC)) {
      observations.push({
        resultTime,
        hasResult: {
          value: timestep.ambTempC,
          unit: 'degree-celsius'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'air-temperature',
        aggregation,
        location
      });
    }

    if (check.assigned(timestep.ambPressure)) {
      observations.push({
        resultTime,
        hasResult: {
          value: timestep.ambPressure / 100, // converting from pascal to hectopascal
          unit: 'hectopascal'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'air-pressure', // appears to be station pressure not MSLP
        aggregation,
        location
      });
    }

  });

  return observations;

}