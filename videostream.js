var MAX_SEGMENTS = 60; // Number of segments to keep in the buffer directory. A segment is generally 2s of video
var FILENAME = "livestream";
var BUFFER_DIR = "buffer/";

var fs = require('fs')
  , spawn = require('child_process').spawn
  , exec = require('child_process').exec
  , humanize = require('humanize')
  , utils = require('./lib/utils')
  , env = process.env.NODE_ENV || "development"
  ;

utils.ensureDirectoryExists(BUFFER_DIR);

var logs = {
  ffmpeg: {
    out: fs.createWriteStream('logs/ffmpeg.out.log'),
    err: fs.createWriteStream('logs/ffmpeg.err.log')
  }
}

var streamurl = require('./settings.'+env+'.json').videostream;

var startStreaming = function() { 
  var params = ['-i',streamurl,'-c','copy',BUFFER_DIR+FILENAME+'.m3u8'];
  var stream = spawn('ffmpeg', params);
  stream.stdout.pipe(logs.ffmpeg.out);
  stream.stderr.pipe(logs.ffmpeg.err);
  stream.on('exit', function(code) {
    console.log(humanize.date("Y-m-d H:i:s")+" Stream ended (see error log in logs/ffmpeg.err.log), exiting");
    process.exit(code);
  });
  console.log(humanize.date("Y-m-d H:i:s")+" Starting streaming...");
};

// We start from a fresh directory
exec('killall ffmpeg', function(err, stdout, stderr) {
  utils.cleanBufferDirectory(0);
  // We start streaming
  setTimeout(startStreaming, 200);
});

// We only keep the latest segments
setInterval(function() {
  utils.cleanBufferDirectory(MAX_SEGMENTS);
}, 1000 * 20); 

