var RECORD_URL_QUERY = "?start=-7&duration=20";
var TWITTER_USERNAME = "GoalFlash";

var twitter = require('twitter')
  , humanize = require('humanize')
  , request = require('request')
  , env = process.env.NODE_ENV || "development"
  , settings = require('../settings.'+env+'.json')
  ;

var twit = new twitter(settings.twitter);

var makeMessage = function(tweet) {
  var text = tweet.replace(/http.*/i,'').replace(/^RT @[a-zA-Z]{1,15}:? ?/i,'').replace(/ $/,'');
  var matches = text.match(/(.*) (\*?[0-9]\-[0-9]\*?) (.*) \(([0-9]+)'\).*(#[A-Z]{3}) vs (#[A-Z]{3})/);

  if(matches && matches.length > 6) {
    var scorer, against;
    var team1 = { name: matches[1], hashtag: matches[5] };
    var team2 = { name: matches[3], hashtag: matches[6] };
    var score = matches[2];
    var time  = matches[4];

    if(score[0] == '*') {
      scorer = team1;
      against = team2;
    }
    else {
      scorer = team2;
      against = team1;
    }
    score = score.replace('*','');

    text = "Goal for "+scorer.name+"! "+team1.hashtag+" "+score+" "+team2.hashtag+" #WorldCup \n📺Video:";
  }

  return text;

};

// var lastTweet = 'RT @GoalFlash: Colombia 3-1* Greece (90\') #COL vs #GRE http://t.co/xsiYol5i5F #GoalFlash #WorldCup';

/* For testing:
setTimeout(function() {
  var text = makeMessage('RT @GoalFlash: Correction: Colombia 3-1* Greece (90\') #COL vs #GRE http://t.co/xsiYol5i5F #GoalFlash #WorldCup');
  var url = "http://localhost:"+settings.port+"/record"+RECORD_URL_QUERY+"&text="+encodeURIComponent(text);
  console.log("Text: ", text);
      var tweet = { text: 'RT @GoalFlash: Correction: Colombia 3-1* Greece (90\') #COL vs #GRE http://t.co/xsiYol5i5F #GoalFlash #WorldCup'};
      if(tweet.text.match(/correction/i)) {
        twit.updateStatus(tweet.text, function(data) {}); 
        return;
      }
  request(url, function(err, res, body) {
    console.log(humanize.date("Y-m-d H:i:s")+" "+url+": ", body);
  });
}, 1000);
*/

console.log(humanize.date("Y-m-d H:i:s")+" Connecting to the Twitter Stream for @"+TWITTER_USERNAME);
twit.stream('user', {track:TWITTER_USERNAME}, function(stream) {
    console.log(humanize.date("Y-m-d H:i:s")+" Connected");
    stream.on('data', function(tweet) {
      if(!tweet.text) return;
      if(tweet.user.screen_name != TWITTER_USERNAME) return;
      console.log(humanize.date("Y-m-d H:i:s")+" tweet.text: ", tweet.text);
      // If the tweet is just correcting the score, just tweet it without generating a video
      if(tweet.text.match(/correction/i)) {
        twit.updateStatus(tweet.text, function(data) {}); 
        return;
      }
      var text = makeMessage(tweet.text);
      var url = "http://localhost:"+settings.port+"/record"+RECORD_URL_QUERY+"&text="+encodeURIComponent(text);
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
