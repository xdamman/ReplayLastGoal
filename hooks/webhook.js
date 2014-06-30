var request = require('request');

var Webhook = function(options) {

  if(typeof options == "string")
    options = { webhookurl: options };

  return function(data, cb) {
    var cb = cb || function() {};
    var r = request.post(options.webhookurl, function(err, res, body) {
      if(err) return cb(err);
      if(res.statusCode != 200) return cb(new Error(res.statusCode+" error", body));
      return cb(null, body);
    });
    r.form(data);
  };
};

module.exports = Webhook;

