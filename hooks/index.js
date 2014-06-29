var env = process.env.NODE_ENV || "development"
  , fs = require('fs')
  , async = require('async')
  , path = require('path')
  ;

// Loads hooks/config.[development|production].json with the definition of each hooks
var configFile = path.join(__dirname,'config.'+env+'.json');
var config = { hooks: [] };
if(fs.existsSync(configFile)) {
  config = require(configFile);
}

console.log(">>> "+config.hooks.length+" external hooks loaded");

var services = {
  hipchat: require('./hipchat'),
  slack: require('./slack'),
  twitter: require('./twitter'),
  facebook: require('./facebook')
};

module.exports = function(data, cb) {
  var cb = cb || function() {};

  console.log("Processing "+config.hooks.length+" external hooks");

  async.each(config.hooks, function(h, done) {
    if(!services[h.service]) {
      console.error("Invalid service "+h.service+", skipping");
      return done();
    }

    console.log("> Notifying "+h.service+" with options ", h.options);
    var fn = new services[h.service](h.options);
    fn(data, done);
  }, function(e) {
    if(e) console.log("> Hook error: "+e, e.stack);
    cb();
  });

};
