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
  // At somepoint we may also want to pull in the already averaged data that earthsense supplies through its API (e.g. 15 minute and 1 hour averages), so makes sense to be specific that this is time of the unaveraged value.
  timeOfLatestUnaveragedValue: {
    type: Date,
    required: false // set as false incase we manage to get a zephyr, but it has no readings yet.
  },
  lastKnownLocation: {
    lat: Number,
    lng: Number,
    description: String,
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