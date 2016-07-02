// var RECORD_URL_QUERY = "?start=-8&duration=20";
var RECORD_URL_QUERY = "?window=default";
var TWITTER_USERNAME = "GoalUpdatesLive";
var TWITTER_QUERY = "goal #GER #ITA";
var THRESHOLD_TWEETS_PER_SECOND = 7;
// var TWITTER_USERNAME = "xdamman_test";

var twitter = require('twitter')
  , humanize = require('humanize')
  , request = require('request')
  , env = process.env.NODE_ENV || "development"
  , settings = require('../settings.'+env+'.json')
  ;

var twit = new twitter(settings.twitter);
var tweet = {};

var makeMessage = function(tweet) {
  var text = "https://twitter.com/" + tweet.user.screen_name + "/statuses/" + tweet.id_str;
  text += " \n📺HD Video:"; // 14 chars long
  return text;
};

var previous_tps = 0;
var tps = 0;
var tpm = 0;
var lastRecording = 0;

setInterval(function() {
  console.log("tpm: ", tpm);
  tpm = 0;
}, 60000);

setInterval(function() {

  console.log("Tweet in last interval: " + tps + " (" + Math.round((tps - previous_tps) / previous_tps * 100) + "%)");

  // If we cross the threshold of tweets per second for two consecutives windows (so total of 4s)
  if(tps + previous_tps > THRESHOLD_TWEETS_PER_SECOND * 2 && tps > tpm / 60) {
    if(((new Date).getTime() - lastRecording) < 1000 * 60) {
      console.error("Last recording less than 60s ago, aborting");
      return;
    }
    var text = makeMessage(tweet);
    console.log("Making tweet", text);
    var url = "http://localhost:"+settings.port+"/record"+RECORD_URL_QUERY+"&channel="+getChannel(text)+"&text="+encodeURIComponent(text);
    console.log("Requesting ", url);
    lastRecording = new Date;
    request(url, function(err, res, body) {
      console.log(humanize.date("Y-m-d H:i:s")+" "+url+": ", body);
    });
  }
  previous_tps = tps;
  tps = 0;
}, 1000);

console.log(humanize.date("Y-m-d H:i:s")+" Connecting to the Twitter Stream for '"+TWITTER_QUERY+"'");
twit.stream('statuses/filter', {track:TWITTER_QUERY}, function(stream) {
    console.log(humanize.date("Y-m-d H:i:s")+" Connected");
    stream.on('data', function(t) {
      if(!t.text) return;
      // console.log(tweet);
      tps++;
      tpm++;
      tweet = t;
      console.log(humanize.date("Y-m-d H:i:s")+" tweet.text: ", tweet.text);
      //if(tweet.user.screen_name != TWITTER_USERNAME) return;
      // If the tweet is just correcting the score, just tweet it without generating a video
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
