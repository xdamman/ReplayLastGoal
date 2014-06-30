var Hipchatter = require('hipchatter');

var Hipchat = function(options) {

  var hipchatter = new Hipchatter(options.auth_token);

  return function(data, cb) {
    var cb = cb || function() {};

    var text = data.text+" "+data.video+" "+data.gif;
    text = text.replace(/\n/g,' ');
    hipchatter.notify(options.room || "World Cup", { message: text, token: options.room_token, message_format: 'text' }, cb); 
  };
};

module.exports = Hipchat;
