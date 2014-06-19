var env = process.env.NODE_ENV || "development"
  , humanize = require('humanize')
  , settings = require('../settings.'+env+'.json')
  ;

var Hipchatter = require('hipchatter');
var hipchatter = new Hipchatter(settings.hipchat.auth_token);
console.log("Token: "+settings.hipchat.auth_token);

module.exports = function(data) {

  hipchatter.notify("World Cup", { message: data.text+" "+data.video+" "+data.gif }, function(err, res) {
    console.error("hipchat error: ", err);
    console.log("hipchat res: ", res);
  });

};
