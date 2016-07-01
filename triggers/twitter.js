// var RECORD_URL_QUERY = "?start=-8&duration=20";
var RECORD_URL_QUERY = "?window=default";
var TWITTER_USERNAME = "GoalUpdatesLive";
// var TWITTER_USERNAME = "xdamman_test";

var twitter = require('twitter')
  , humanize = require('humanize')
  , request = require('request')
  , env = process.env.NODE_ENV || "development"
  , settings = require('../settings.'+env+'.json')
  ;

/*
var mapping = {
  "USA": "ned1",
  "POR": "ned2",
  "BEL": "ned3",
  "ALG": "ned1"
}
*/

var getChannel = function(tweet) {
  /*
  for(var i in mapping) {
    if(tweet.match(new RegExp(i))) return mapping[i];
  }
  */
  return "ned1";
}

var twit = new twitter(settings.twitter);

var makeMessage = function(tweet) {

  tweet += " \n📺HD Video:"; // 14 chars long
  
  return tweet;

};

//var lastTweet = 'RT #BRA @GoalFlash: Colombia 3-1* Greece (90\') #COL vs #GRE http://t.co/xsiYol5i5F #GoalFlash #WorldCup';

/* For testing:
setTimeout(function() {
  var tweet= "RT @GoalFlash: Italy 0-1* Uruguay (81') #ITAvsURU http://t.co/xsiYol5i5F #GoalFlash #WorldCup";
  var text = makeMessage(tweet);
  var url = "http://localhost:"+settings.port+"/record"+RECORD_URL_QUERY+"&channel="+getChannel(text)+"&text="+encodeURIComponent(text);
  console.log("Text: ", text);
      var tweet = { text: text }; 
      if(tweet.text.match(/correction/i)) {
        twit.updateStatus(tweet.text, function(data) {}); 
        return;
      }
  console.log("Request: ", url);
  request(url, function(err, res, body) {
    console.log(humanize.date("Y-m-d H:i:s")+" "+url+": ", body);
  });
}, 1000);
*/

console.log(humanize.date("Y-m-d H:i:s")+" Connecting to the Twitter Stream for @"+TWITTER_USERNAME);
twit.stream('user', {track:TWITTER_USERNAME}, function(stream) {
    console.log(humanize.date("Y-m-d H:i:s")+" Connected");
    stream.on('data', function(tweet) {
      console.log(humanize.date("Y-m-d H:i:s")+" tweet.text: ", tweet);
      if(!tweet.text) return;
      if(tweet.user.screen_name != TWITTER_USERNAME) return;
      // If the tweet is just correcting the score, just tweet it without generating a video
      var text = makeMessage(tweet.text);
	console.log("Making tweet", text);
      var url = "http://localhost:"+settings.port+"/record"+RECORD_URL_QUERY+"&channel="+getChannel(text)+"&text="+encodeURIComponent(text);
console.log("Requesting ", url);
      request(url, function(err, res, body) {
        console.log(humanize.date("Y-m-d H:i:s")+" "+url+": ", body);
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
