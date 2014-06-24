var env = process.env.NODE_ENV || "development"
  , fs = require('fs')
  , async = require('async')
  , path = require('path')
  , twitter = require('./twitter')
  ;

// Loads hooks/config.[development|production].json with the definition of each hooks
var configFile = path.join(__dirname,'config.'+env+'.json');
var config = { hooks: [] };
if(fs.existsSync(configFile)) {
  config = require(configFile);
}

var services = {
  hipchat: require('./hipchat'),
  slack: require('./slack')
}

module.exports = function(data, cb) {
  var cb = cb || function() {};

  console.log("Calling hook twitter with ", data);
  twitter(data);

  console.log("Processing "+config.hooks.length+" external hooks");

  async.each(config.hooks, function(h, done) {
    if(!services[h.service]) {
      console.error("Invalid service "+h.service+", skipping");
      return done();
    }

    console.log("> Notifying "+h.service+" with options ", h.options);
    var fn = new services[h.service](h.options);
    fn(data, done);
  }, cb);

};
