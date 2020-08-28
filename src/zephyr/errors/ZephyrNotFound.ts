import {NotFound} from '../../errors/NotFound';

export class ZephyrNotFound extends NotFound {

  public constructor(message = 'Zephyr could not be found') {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain   
  }

}