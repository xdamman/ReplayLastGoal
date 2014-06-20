var Hipchatter = require('hipchatter');

var Hipchat = function(options) {

  var hipchatter = new Hipchatter(options.auth_token);

  return function(data, cb) {
    var cb = cb || function() {};

    var text = data.text+" "+data.video+" \n"+data.gif;

    hipchatter.notify(options.room || "World Cup", { message: text, token: options.token }, cb); 
  };
};

module.exports = Hipchat;
