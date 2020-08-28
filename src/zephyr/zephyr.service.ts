import Zephyr from './zephyr.model';
import {UpdateZephyrsNotInLatestListFail} from './errors/UpdateZephyrsNotInLatestListFail';
import {ZephyrApp} from './zephyr-app.interface';
import {GetZephyrFail} from './errors/GetZephyrFail';
import {ZephyrNotFound} from './errors/ZephyrNotFound';


export async function getZephyr(zNumber: number): Promise<ZephyrApp> {

  let zephyr;
  try {
    zephyr = await Zephyr.findOne({zNumber}).exec();
  } catch (err) {
    throw new GetZephyrFail(undefined, err.message);
  }

  if (!zephyr) {
    throw new ZephyrNotFound(`A zephyr with zNumber '${zNumber}' could not be found`);
  }

  return zephyrDbToApp(zephyr);

}



export async function updateZephyrsNotInLatestList(zNumbersInList: number[]): Promise<number> {

  let result;
  try {

    result = await Zephyr.updateMany(
      {
        zNumber: {$nin: zNumbersInList}
      },
      {
        stillInEarthsenseList: false
      }
    ).exec();

  } catch (err) {
    throw new UpdateZephyrsNotInLatestListFail(undefined, err.message);
  }

  // Let's return the number of Zephyrs that matched (this is rather than .nModified which can be less that .n if the Zephyr already has stillInEarthsenseList set as false.)
  return result.n;

}


function zephyrDbToApp(zephyrDb: any): ZephyrApp {
  const zephyrApp = zephyrDb.toObject();
  delete zephyrApp._id;
  delete zephyrApp.__v;
  return zephyrApp;
}