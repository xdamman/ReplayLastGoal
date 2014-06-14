var RECORD_URL = "http://localhost:1212/record?start=-10&duration=35";
var TWITTER_USERNAME = "goalflash";

var twitter = require('twitter')
  , humanize = require('humanize')
  , request = require('request');

var twit = new twitter(require('./config/twitter'));

console.log(humanize.date("Y-m-d H:i:s")+" Connecting to the Twitter Stream for @"+TWITTER_USERNAME);
twit.stream('user', {track:TWITTER_USERNAME}, function(stream) {
    console.log(humanize.date("Y-m-d H:i:s")+" Connected");
    stream.on('data', function(data) {
      if(!data.text) return;       
      request(RECORDURL);
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
