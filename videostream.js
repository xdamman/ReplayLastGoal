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

var streamurl = require('./settings.json').videostream;

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

