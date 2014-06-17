var RECORD_URL_QUERY = "?start=-7&duration=20";
var TWITTER_USERNAME = "GoalFlash";

var twitter = require('twitter')
  , humanize = require('humanize')
  , request = require('request')
  , env = process.env.NODE_ENV || "development"
  , settings = require('./settings.'+env+'.json')
  ;

var keys = settings.twitter;
var twit = new twitter(keys);

var sendTweet = function(text, imageurl, cb) {
  var form, r;
  keys.token = keys.access_token_key;
  keys.token_secret = keys.access_token_secret;
  r = request.post("https://api.twitter.com/1.1/statuses/update_with_media.json", {oauth: keys}, cb);
  form = r.form();
  form.append('status', text);
  return form.append('media[]', request(imageurl));
}

var notify = function(url) {
  var text = lastTweet.replace(/http.*/i,'').replace(/^RT @[a-zA-Z]{1,15}:? ?/i,'').replace(/ $/,'');
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

    text = "Goal for "+scorer.name+" "+scorer.hashtag+"! Video replay: "+url+" ("+team1.hashtag+" "+score+" "+team2.hashtag+") #WorldCup";
  }
  else {
    text += " " + url;
  }

  var thumbnail = url.replace('video','thumbnail');
  console.log(humanize.date("Y-m-d H:i:s")+" Sending tweet: ", text, thumbnail);
  sendTweet(text, thumbnail, function(err, result) {
    console.error(err);
  });
};

var lastTweet = '';
// var lastTweet = 'RT @GoalFlash: Colombia 3-1* Greece (90\') #COL vs #GRE http://t.co/xsiYol5i5F #GoalFlash #WorldCup';

/* For testing: 
setTimeout(function() {
  var url = "http://localhost:"+settings.port+"/record"+RECORD_URL_QUERY;
  request(url, function(err, res, body) {
    console.log(humanize.date("Y-m-d H:i:s")+" "+url+": ", body);
    notify(body);
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
      lastTweet = tweet.text;
      var url = "http://localhost:"+settings.port+"/record"+RECORD_URL_QUERY;
      request(url, function(err, res, body) {
        console.log(humanize.date("Y-m-d H:i:s")+" "+url+": ", body);
        if(body.match(/http/))
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
