
var Slack = function(options) {

  if(typeof options == "string")
    options = { webhookurl: options };

  var slack = require('slack-notify')(options.webhookurl);

  return function(data, cb) {
    var cb = cb || function() {};

    var tokens = data.text.match(/(.*)(#.{3} [0-9]\-[0-9] #.{3})/);
    var text = tokens[1];
    var score = tokens[2];

    slack.send({
      channel: options.channel || "#general", 
      icon_url: 'http://replaylastgoal.com/img/avatar.png',
      text: text+" "+data.gif,
      username: options.username || "ReplayLastGoal",
      fields: {
        score: score,
        video: data.video
      }
    }, cb);
  };
};

module.exports = Slack;

