var FILENAME = "nederlands1";
var DOWNLOADS_DIR = "downloads/";
var MAX_DOWNLOADS = 60;

var avconv = require('avconv')
  , fs = require('fs')
  , spawn = require('child_process').spawn
  , exec = require('child_process').exec
  , humanize = require('humanize')
  , utils = require('./lib/utils')
  ;

var logs = {
  avconv: {
    out: fs.createWriteStream('logs/avconv.out.log'),
    err: fs.createWriteStream('logs/avconv.err.log')
  }
}

var streamurl = "http://l2cm2566367a6a00539a5798000000.484079e0c53754dd.smoote2c.npostreaming.nl/d/live/npo/tvlive/ned1/ned1.isml/ned1-audio%3D128000-video%3D1300000.m3u8";

var startStreaming = function() { 
  var params = ['-i',streamurl,'-c','copy',DOWNLOADS_DIR+FILENAME+'.m3u8'];
  var stream = spawn('avconv', params);
  stream.stdout.pipe(logs.avconv.out);
  stream.stderr.pipe(logs.avconv.err);

  console.log(humanize.date("Y-m-d H:i:s")+" Starting streaming...");
};

// We start from a fresh directory
exec('killall avconv', function(err, stdout, stderr) {
  utils.cleanDownloadsDirectory(0);
  // We start streaming
  setTimeout(startStreaming, 200);
});

// We only keep the latest segments
setInterval(function() {
  utils.cleanDownloadsDirectory(MAX_DOWNLOADS);
}, 1000 * 20); 

