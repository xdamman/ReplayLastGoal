var env = process.env.NODE_ENV || "development"
  , fs = require('fs')
  , async = require('async')
  , path = require('path')
  , settings = require('../settings.'+env+'.json')
  ;

console.log(">>> "+settings.hooks.length+" external hooks loaded");

var services = {
  webhook: require('./webhook'),
  hipchat: require('./hipchat'),
  slack: require('./slack'),
  twitter: require('./twitter'),
  facebook: require('./facebook'),
  flowdock: require('./flowdock')
};

module.exports = {
  all: function(data, cb) {
    var cb = cb || function() {};

    console.log("Processing "+settings.hooks.length+" external hooks");

    async.eachLimit(settings.hooks, 8, function(h, done) {
      if(!services[h.service]) {
        console.error("Invalid service "+h.service+", skipping");
        return done();
      }

      if(!h.active) return done();

      console.log("> Notifying "+h.service+" with options ", h.options);
      var fn = new services[h.service](h.options);
      fn(data, done);
    }, function(e) {
      if(e) console.log("> Hook error: "+e, e.stack);
      cb();
    });
  },
  twitter: services.twitter,
  facebook: services.facebook,
  flowdock: services.flowdock,
  webhook: services.webhook,
  hipchat: services.hipchat,
  slack: services.slack
};
