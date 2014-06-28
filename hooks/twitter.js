var env = process.env.NODE_ENV || "development"
  , humanize = require('humanize')
  , request = require('request')
  , settings = require('../settings.'+env+'.json')
  ;

var Twitter = function(options) {

  var sendTweet = function(text, imageurl, cb) {
    var form, r;
    r = request.post("https://api.twitter.com/1.1/statuses/update_with_media.json", {oauth: options}, cb);
    form = r.form();
    form.append('status', text);
    r.on('error', function(e) {
      console.error("Error while sending the tweet: ", e);
    });
    return form.append('media[]', request(imageurl));
  }

  return function(data, cb) {
    var image = (data.gifsize < 3*1024*1024) ? data.gif : data.thumbnail;
    var tweet = data.text + " " + data.video;
    console.log(humanize.date("Y-m-d H:i:s")+" Sending tweet ("+tweet.length+" chars): ", tweet);
    sendTweet(tweet, image, cb);
  };
};

module.exports = Twitter;
