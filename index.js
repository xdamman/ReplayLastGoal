var FILENAME = "nederlands1";
var DOWNLOADS_DIR = "downloads/";
var MAX_DOWNLOADS = 60;

var avconv = require('avconv')
  , fs = require('fs')
  , express = require('express')
  , spawn = require('child_process').spawn
  , exec = require('child_process').exec
  , _ = require('underscore')
  , humanize = require('humanize')
  , utils = require('./lib/utils')
  ;

var logs = {
  avconv: {
    out: fs.createWriteStream('logs/avconv.out.log'),
    err: fs.createWriteStream('logs/avconv.err.log')
  }
}

var server = express();
var streamurl = "http://l2cm2566367a6a00539a5798000000.484079e0c53754dd.smoote2c.npostreaming.nl/d/live/npo/tvlive/ned1/ned1.isml/ned1-audio%3D128000-video%3D1300000.m3u8";

var startStreaming = function() { 
  var params = ['-i',streamurl,'-c','copy',DOWNLOADS_DIR+FILENAME+'.m3u8'];
  var stream = spawn('avconv', params);
  stream.stdout.pipe(logs.avconv.out);
  stream.stderr.pipe(logs.avconv.err);

  console.log("Starting streaming...");
};

var seq = function(a) { return parseInt(a.replace(FILENAME,''),10); };

var cleanDownloads = function(max_downloads, cb) {
    cb = cb || function() {};

    var max_downloads = (typeof max_downloads != 'undefined') ? max_downloads : MAX_DOWNLOADS;
    var dir = DOWNLOADS_DIR;
    var files = fs.readdirSync(dir);

    if(files.length <= max_downloads) return cb(null);

    files.sort(function(a, b) { return seq(b) - seq(a); });

    for(var i= max_downloads; i < files.length; i++) {
      // console.log("Removing file "+dir+files[i]+ " modified "+(new Date(fs.statSync(dir+files[i]).mtime.getTime()).toString()));
      fs.unlink(dir+files[i]);
    }
    cb(null);
};

// We start from a fresh directory
exec('killall avconv');
cleanDownloads(0);

// We start streaming
setTimeout(startStreaming, 200);

// We only keep the latest segments
setInterval(function() {
  console.log("Removing old segments (keeping the "+MAX_DOWNLOADS+" latest)");
  cleanDownloads(MAX_DOWNLOADS);
}, 1000 * 20); 


server.lastRecording = { time: new Date, filename: null };
var record = function(seconds, cb) {
  cb = cb || function() {};

  if(((new Date).getTime() - server.lastRecording.time) < 20000) {
    console.error("Last recording less than 20s ago, returning last recording file ",server.lastRecording.filename);
    return cb(null, server.lastRecording.filename); 
  }
  server.lastRecording.time = new Date;
  server.busy = true;
  var outputfilename = 'videos/'+humanize.date('Y-m-d-H-i-s')+'.mp4';
  var dir = DOWNLOADS_DIR;
  var files = fs.readdirSync(dir);

  files.sort(function(a, b) { return seq(a) - seq(b); });

  var params = ['-y','-i'];
  files = _.map(files, function(f) { return dir+f; });
  files = _.first(files, Math.round(seconds/2));
  var concat = 'concat:' + files.slice(1).join('|');
  params.push(concat);

  params.push(outputfilename);

  var stream = spawn('avconv', params);
  stream.stdout.pipe(process.stdout);
  stream.stderr.pipe(process.stderr);

  stream.on('exit', function(e) {
    console.log("Video saved!",e);
    server.lastRecording.filename = outputfilename;
    server.busy = false;
    cb(null, outputfilename);
    utils.mp4toGIF(outputfilename);
  });

};


/* *************
 * Server routes
 */
server.get('/record', function(req, res) {
  if(server.busy) {
    return res.send("Sorry server already busy recording");
  }
  var seconds = req.param('seconds',15);
  console.log(humanize.date('Y-m-d H:i:s')+" /record?seconds="+seconds);
  record(seconds);
  res.send("Starting recording. Your file will be soon available on /latest.mp4 and /latest.gif");
});

server.get(/\/latest(\.mp4)?/, function(req, res) {
  res.redirect(server.lastRecording.filename);
});

server.get('/latest.gif', function(req, res) {
  res.redirect(server.lastRecording.filename.replace('.mp4','.gif'));
});

server.use('/videos', express.static('videos/'));

console.log("Server listening on port 1212");
server.listen(1212);
