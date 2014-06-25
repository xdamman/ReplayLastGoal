var env = process.env.NODE_ENV || "development"
  , humanize = require('humanize')
  , request = require('request')
  , settings = require('../settings.'+env+'.json')
  ;

var keys = settings.twitter;

var sendTweet = function(text, imageurl, cb) {
  var form, r;
  keys.token = keys.access_token_key;
  keys.token_secret = keys.access_token_secret;
  r = request.post("https://api.twitter.com/1.1/statuses/update_with_media.json", {oauth: keys}, cb);
  form = r.form();
  form.append('status', text);
  r.on('error', function(e) {
    console.error("Error while sending the tweet: ", e);
  });
  return form.append('media[]', request(imageurl));
}

module.exports = function(data) {

  var image = (data.gifsize < 3*1024*1024) ? data.gif : data.thumbnail;
  var tweet = data.text + " " + data.video;
  console.log(humanize.date("Y-m-d H:i:s")+" Sending tweet ("+tweet.length+" chars): ", tweet);
  sendTweet(tweet, image, function(err, result) {
    if(err) console.error(err);
    // console.log("result: ", result.body);
  });
};
