
var Slack = function(options) {

  if(typeof options == "string")
    options = { webhookurl: options };

  var slack = require('slack-notify')(options.webhookurl);

  return function(data, cb) {
    var cb = cb || function() {};

    var tokens = data.text.match(/(.*)(#.{3} [0-9]\-[0-9] #.{3})/);
    var fields = { video: data.video };
    var text = data.text;
    if(tokens && tokens.length > 2) {
      text = tokens[1];
      fields.score = tokens[2];
    }

    slack.send({
      channel: options.channel || "#general",
      icon_url: 'http://i.imgur.com/4gkmsLq.png',
      text: text+" "+data.gif,
      username: options.username || "ReplayLastGoal",
      unfurl_links: true,
      fields: fields
    }, cb);
  };
};

module.exports = Slack;

