const mongoose = require('mongoose');
const Promise = require('bluebird');
const mongo = require('mongodb');

Promise.promisifyAll(mongoose);
Promise.promisifyAll(mongo);

mongoose.connect('mongodb://localhost/whaleThen', { useMongoClient: true });
const db = mongoose.connection;

db.on('error', () => {
  console.log('mongoose connection error');
});

db.once('open', () => {
  console.log('mongoose connected successfully');
});

const eventSchema = mongoose.Schema({
  name: String,
  address: String,
  rating: String,
  votes: { type: Number, default: 0 },
});

const daySchema = mongoose.Schema({
  day: Number,
  timelineId: Number,
  events: [eventSchema],
});

const Day = mongoose.model('Day', daySchema);
const Event = mongoose.model('Event', eventSchema);

const addNewTimeline = (timelineId, numberOfDays) => {
  const timeline = [];
  for (let day = 1; day <= numberOfDays; day += 1) {
    const newDay = new Day({ day, timelineId });
    timeline.push(newDay);
  }

  return Promise.map(timeline, day => day.save());
}

const getTimelineById = timelineId => Day.findAsync({ timelineId });

const addEventToDay = (event, timelineId, day) => {
  return Day.findOneAsync({ timelineId, day })
    .tap(model => model.events.push(event))
    .then(model => model.save());
};

const addNewEvent = (event, timelineId, day) => {
  const newEvent = new Event(event);
  return newEvent.saveAsync()
    .then(result => addEventToDay(result, timelineId, day));
};

module.exports.getTimelineById = getTimelineById;
module.exports.addNewTimeline = addNewTimeline;
module.exports.addNewEvent = addNewEvent;
module.exports.addEventToDay = addEventToDay;

//
// addNewTimeline(1234, 5)
// .then(() => addNewEvent({ name: 'test2', address: '1234 test 2 st' }, 1234, 3))
