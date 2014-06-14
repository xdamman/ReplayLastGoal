var RECORD_URL = "http://localhost:1212/record?start=-5&duration=20";
var TWITTER_USERNAME = "GoalFlash";

var twitter = require('twitter')
  , humanize = require('humanize')
  , googl = require('goo.gl')
  , request = require('request');

var twit = new twitter(require('./config/twitter'));

var notify = function(url) {
  var text = lastTweet.replace(/http.*/i,'').replace(/^RT @[a-zA-Z]{1,15}:? ?/i,'').replace(/ $/,'');
  googl.shorten(url)
    .then(function (shortUrl) {
      twit.updateStatus(text + " - Video: "+shortUrl, function(data) {
        console.log("notify> ", data);
      });
    })
    .catch(function (err) {
        console.error(err.message);
    });
};

var lastTweet = 'RT @GoalFlash: Colombia *3-0 Greece (90\') #COL vs #GRE http://t.co/xsiYol5i5F #GoalFlash #WorldCup';

/* For testing: 
setTimeout(function() {
  request(RECORD_URL, function(err, res, body) {
    console.log("body: ", body);
    notify(body);
  });

}, 1000);
*/

console.log(humanize.date("Y-m-d H:i:s")+" Connecting to the Twitter Stream for @"+TWITTER_USERNAME);
twit.stream('user', {track:TWITTER_USERNAME}, function(stream) {
    console.log(humanize.date("Y-m-d H:i:s")+" Connected");
    stream.on('data', function(data) {
      console.log(humanize.date("Y-m-d H:i:s")+" DATA: ", data);
      if(!data.text) return;       
      if(data.user.screen_name != TWITTER_USERNAME) return;
      lastTweet = data.text;
      request(RECORD_URL, function(err, res, body) {
        console.log("body: ", body);
        notify(body);
      });
    });

    stream.on('error', function(error) {
      console.error("Error in the twitter stream: ", error);
      process.exit(1);
    });

    stream.on('end', function(error) {
      console.error("Twitter stream ended - exiting");
      process.exit(1);
    });
});
