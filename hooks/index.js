var hooks = require('../hooks.json')
  , async = require('async');

var services = {
  hipchat: require('./hipchat'),
  slack: require('./slack')
}

module.exports = function(data, cb) {
  var cb = cb || function() {};

  console.log("Processing "+hooks.length+" hooks");

  console.log("Calling hook twitter with ", data);
  require('./twitter')(data);

  async.each(hooks, function(h, done) {
    if(!services[h.service]) {
      console.error("Invalid service "+h.service+", skipping");
      return done();
    }

    console.log("> Notifying "+h.service+" with options ", h.options);
    var fn = new services[h.service](h.options);
    fn(data, done);
  }, cb);

};
