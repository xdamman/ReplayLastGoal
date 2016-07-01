var MAX_SEGMENTS = 30; // Number of segments to keep in the buffer directory. A segment is generally 2s of video
var FILENAME = "livestream";
var BUFFER_DIR = "buffer";

var fs = require('fs')
  , spawn = require('child_process').spawn
  , exec = require('child_process').exec
  , path = require('path')
  , humanize = require('humanize')
  , utils = require('./lib/utils')
  , env = process.env.NODE_ENV || "development"
  , getStreamURL = require('./getStreamURL')
  ;

var settings = require('./settings.'+env+'.json');
var videostreams = settings.videostreams;
var channel = process.env.CHANNEL || settings.channel || Object.keys(videostreams)[0]; 

utils.ensureDirectoryExists(BUFFER_DIR);
utils.ensureDirectoryExists(path.join(BUFFER_DIR,channel));

var logs = {
  ffmpeg: {
    out: fs.createWriteStream('logs/'+channel+'.out.log'),
    err: fs.createWriteStream('logs/'+channel+'.err.log')
  }
}

var startStreaming = function(streamurl) { 
  var params = ['-i',streamurl,'-acodec','libfaac','-vcodec','libx264','-vf','scale=320:240','-b:v','180k','-profile:v','high',path.join(BUFFER_DIR,channel,FILENAME+'.m3u8')];
  var stream = spawn('ffmpeg', params);
  stream.stdout.pipe(logs.ffmpeg.out);
  stream.stderr.pipe(logs.ffmpeg.err);
  stream.on('exit', function(code) {
    console.log(humanize.date("Y-m-d H:i:s")+" Stream ended (see error log in logs/"+channel+".err.log), exiting");
    process.exit(code);
  });
  console.log(humanize.date("Y-m-d H:i:s")+" Starting streaming " + channel + "...");
};

// We start from a fresh directory
exec('killall ffmpeg', function(err, stdout, stderr) {
  utils.cleanDirectory(path.join(BUFFER_DIR,channel),0);
  // We start streaming
  getStreamURL(function(err, streamurl) {
    startStreaming(streamurl);
  });
});

// We only keep the latest segments
setInterval(function() {
  utils.cleanDirectory(path.join(BUFFER_DIR,channel),MAX_SEGMENTS);
}, 1000 * 20); 

