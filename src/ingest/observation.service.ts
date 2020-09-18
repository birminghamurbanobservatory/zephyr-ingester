import {Observation} from './observation.interface';
import {ZephyrTimestepData} from '../earthsense/zephyr-timestep-data.interface';
import {sortBy} from 'lodash';
import * as check from 'check-types';
import {v4 as uuid} from 'uuid';
import {sub} from 'date-fns';

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
    const validLocationAvailable = check.number(timestep.longitude) && check.number(timestep.latitude);
    let location;
    if (validLocationAvailable) {
      location = {
        id: uuid(),
        validAt: resultTime,
        geometry: {
          type: 'Point',
          coordinates: [timestep.longitude, timestep.latitude]
        } 
      };
    }

    // Makes sense for the location observation to be added to the observations array first in case it is being used to update a platform's location in the sensor-deployment-manager.
    if (validLocationAvailable) {
      const obs: Observation = {
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
        aggregation
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    if (check.assigned(timestep.o3)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.o3,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'ozone-mass-concentration',
        aggregation
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    if (check.assigned(timestep.no)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.no,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'nitrogen-monoxide-mass-concentration',
        aggregation
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    if (check.assigned(timestep.no2)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.no2,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'nitrogen-dioxide-mass-concentration',
        aggregation
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    if (check.assigned(timestep.pm1)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.pm1,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'pm1-mass-concentration',
        aggregation
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    if (check.assigned(timestep.pm2p5)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.pm2p5,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'pm2p5-mass-concentration',
        aggregation
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    if (check.assigned(timestep.pm10)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.pm10,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'pm10-mass-concentration',
        aggregation
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    // For now at least only bother with the ambient humidity
    if (check.assigned(timestep.ambHumidity)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.ambHumidity,
          unit: 'percent'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'relative-humidity',
        aggregation
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    // For now at least only bother with the ambient temperature
    if (check.assigned(timestep.ambTempC)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.ambTempC,
          unit: 'degree-celsius'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'air-temperature',
        aggregation
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    if (check.assigned(timestep.ambPressure)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.ambPressure / 100, // converting from pascal to hectopascal
          unit: 'hectopascal'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'air-pressure', // appears to be station pressure not MSLP
        aggregation
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

  });

  return observations;

}



export function convertAveragedZephyrTimestepDataToObservations(data: ZephyrTimestepData[], averagedOver: string): Observation[] {

  const averageChoices = {
    '15Min': {
      procedureIdSnippet: '15-min',
      duration: {minutes: 15}
    },
    hourly: {
      procedureIdSnippet: '1-hour',
      duration: {hours: 1}
    },
    daily: {
      procedureIdSnippet: '1-day',
      duration: {days: 1}
    }
  };

  const averageChoice = averageChoices[averagedOver];

  if (!averageChoice) {
    throw new Error(`${averagedOver} is not a valid average choice.`);
  }

  // Looks to me as if Earthsense are performing a mean average and then rounding to the same level of precision as the 10-secondly values. E.g. if the 10 second readings were [27, 27, 27, 28] then the mean value would be 27 rather than 27.25. The latitude and longitude are also averaged in the same way.
  const averagingProcedure = `zephyr-${averageChoice.procedureIdSnippet}-avg-of-10-sec-samples`;
  const aggregation = 'average';

  const observations: Observation[] = [];

  // Let's make sure the data is in consecutive order
  const ordered = sortBy(data, 'dateTime');

  ordered.forEach((timestep) => {

    const resultTime = timestep.dateTime.toISOString();
    const slotSensorId = `zephyr-${timestep.zNumber}-${timestep.cartridge}`;
    const gpsSensorId = `zephyr-${timestep.zNumber}-gps-sensor`;
    const hasBeginning = sub(timestep.dateTime, averageChoice.duration).toISOString();
    const hasEnd = resultTime;
    const phenomenonTime = {hasBeginning, hasEnd};

    // Decided the best approach was to add the Zephyr's GPS location to each observation, then the sensor-deployment-manager with its passLocationToObservations setting can decide if it wants to use these GPS readings or inherit the host platform's location instead. 
    const validLocationAvailable = check.number(timestep.longitude) && check.number(timestep.latitude);
    let location;
    if (validLocationAvailable) {
      location = {
        id: uuid(),
        validAt: resultTime,
        geometry: {
          type: 'Point',
          coordinates: [timestep.longitude, timestep.latitude]
        } 
      };
    }

    // Makes sense for the location observation to be added to the observations array first in case it is being used to update a platform's location in the sensor-deployment-manager.
    if (validLocationAvailable) {
      const obs: Observation = {
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
        phenomenonTime,
        usedProcedures: [averagingProcedure]
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    if (check.assigned(timestep.o3)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.o3,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'ozone-mass-concentration',
        aggregation,
        phenomenonTime,
        usedProcedures: [averagingProcedure]
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    if (check.assigned(timestep.no)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.no,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'nitrogen-monoxide-mass-concentration',
        aggregation,
        phenomenonTime,
        usedProcedures: [averagingProcedure]
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    if (check.assigned(timestep.no2)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.no2,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'nitrogen-dioxide-mass-concentration',
        aggregation,
        phenomenonTime,
        usedProcedures: [averagingProcedure]
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    if (check.assigned(timestep.pm1)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.pm1,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'pm1-mass-concentration',
        aggregation,
        phenomenonTime,
        usedProcedures: [averagingProcedure]
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    if (check.assigned(timestep.pm2p5)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.pm2p5,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'pm2p5-mass-concentration',
        aggregation,
        phenomenonTime,
        usedProcedures: [averagingProcedure]
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    if (check.assigned(timestep.pm10)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.pm10,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'pm10-mass-concentration',
        aggregation,
        phenomenonTime,
        usedProcedures: [averagingProcedure]
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    // For now at least only bother with the ambient humidity
    if (check.assigned(timestep.ambHumidity)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.ambHumidity,
          unit: 'percent'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'relative-humidity',
        aggregation,
        phenomenonTime,
        usedProcedures: [averagingProcedure]
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    // For now at least only bother with the ambient temperature
    if (check.assigned(timestep.ambTempC)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.ambTempC,
          unit: 'degree-celsius'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'air-temperature',
        aggregation,
        phenomenonTime,
        usedProcedures: [averagingProcedure]
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

    if (check.assigned(timestep.ambPressure)) {
      const obs: Observation = {
        resultTime,
        hasResult: {
          value: timestep.ambPressure / 100, // converting from pascal to hectopascal
          unit: 'hectopascal'
        },
        madeBySensor: slotSensorId,
        observedProperty: 'air-pressure', // appears to be station pressure not MSLP
        aggregation,
        phenomenonTime,
        usedProcedures: [averagingProcedure]
      };
      if (validLocationAvailable) obs.location = location; 
      observations.push(obs);
    }

  });

  return observations;

}
