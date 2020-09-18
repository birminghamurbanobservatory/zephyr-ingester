import * as mongoose from 'mongoose';



const schema = new mongoose.Schema({
  zNumber: {
    type: Number, // I.e. the string to add onto the start of sensor IDs, e.g. aurn-ladywood
    required: true
  },
  // Some Zephyrs may have previously been included in the list from the Earthsense API, but are now no longer included, e.g. because the Zephyr was faulty and thus Earthsense removed it from our user group. Decided to still keep a record of it in the database, but can filter it out using this property if required.
  stillInEarthsenseList: {
    type: Boolean,
    required: true
  },
  getUnaveragedData: {
    type: Boolean,
    default: false
  },
  get15MinAverageData: {
    type: Boolean,
    default: true
  },
  getHourlyAverageData: {
    type: Boolean,
    default: false
  },
  getDailyAverageData: {
    type: Boolean,
    default: false
  },
  timeOfLatestUnaveragedValue: {
    type: Date,
    required: false // set as false incase we manage to get a zephyr, but it has no readings yet.
  },
  timeOfLatest15MinAverageValue: {
    type: Date,
    required: false // set as false incase we manage to get a zephyr, but it has no readings yet.
  },
  timeOfLatestHourlyAverageValue: {
    type: Date,
    required: false // set as false incase we manage to get a zephyr, but it has no readings yet.
  },
  timeOfLatestDailyAverageValue: {
    type: Date,
    required: false // set as false incase we manage to get a zephyr, but it has no readings yet.
  },
  // This location comes from the Zephyr list request, rather from the data of an individual Zephyr.
  lastKnownLocation: {
    lat: Number,
    lng: Number,
    description: String, // e.g. "Automatic Location" or "OTS or Transit"
    since: Date,
  }
});



//-------------------------------------------------
// Indexes
//-------------------------------------------------
schema.index({zNumber: 1}, {unique: true});


//-------------------------------------------------
// Create Model (and expose it to our app)
//-------------------------------------------------
export default mongoose.model('Zephyr', schema);