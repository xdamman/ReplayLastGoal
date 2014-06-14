var FILENAME = "nederlands1";
var DOWNLOADS_DIR = "downloads/";
var MAX_DOWNLOADS = 60;

var streamurl = "http://l2cm2566367a6a00539a5798000000.484079e0c53754dd.smoote2c.npostreaming.nl/d/live/npo/tvlive/ned1/ned1.isml/ned1-audio%3D128000-video%3D1300000.m3u8";

var avconv = require('avconv')
  , fs = require('fs')
  , express = require('express')
  , spawn = require('child_process').spawn
  , exec = require('child_process').exec
  , _ = require('underscore')
  , humanize = require('humanize')
  , utils = require('./lib/utils')
  , twitter = require('twitter')
  , googl = require('goo.gl')
  ;

var logs = {
  avconv: {
    out: fs.createWriteStream('logs/avconv.out.log'),
    err: fs.createWriteStream('logs/avconv.err.log')
  }
}

var server = express();

require('./config/express')(server);

var twit = new twitter(require('./config/twitter'));

var notify = function(filename) {
  googl.shorten("http://95.85.37.43:1212/"+filename)
    .then(function (shortUrl) {
      twit.updateStatus("@xdamman Goal! "+shortUrl, function(data) {
        console.log("notify> ", data);
      });
    })
    .catch(function (err) {
        console.error(err.message);
    });
};

server.lastRecording = { time: new Date, filename: null };
var record = function(start, duration, cb) {
  cb = cb || function() {};

  var start = parseInt(start,10);
  var duration = parseInt(duration, 10);
  // If we request 25 seconds starting 10 seconds ago 
  // we wait 15 seconds and re-run the call asking for
  // 25 seconds starting 25 seconds ago
  if(start < 0 && (start + duration) > 0) {
    console.log(">>> Waiting "+(start+duration)+" seconds");
    setTimeout(function() {
      record(start - (start+duration), duration, cb);
    }, 1000 * (start+duration));
    return;
  }

  if(((new Date).getTime() - server.lastRecording.time) < 20000) {
    console.error("Last recording less than 20s ago, returning last recording file ",server.lastRecording.filename);
    return cb(null, server.lastRecording.filename); 
  }
  server.lastRecording.time = new Date;
  server.busy = true;
  var outputfilename = 'videos/'+humanize.date('Y-m-d-H-i-s')+'.mp4';
  var dir = DOWNLOADS_DIR;

  var params = ['-t',duration,'-y','-i'];

  if(start < 0) {
    var files = fs.readdirSync(dir);
    files.sort(function(a, b) { return utils.seq(a) - utils.seq(b); });
    files = _.map(files, function(f) { return dir+f; });
    files = _.last(files, Math.round(start*-1/2+1));
    var concat = 'concat:' + files.slice(1).join('|');
    params.push(concat);
  }
  else {
    params.push(streamurl);
  }

  params.push(outputfilename);

  var stream = spawn('avconv', params);
  stream.stdout.pipe(process.stdout);
  stream.stderr.pipe(process.stderr);

  stream.on('exit', function(e) {
    console.log("Video saved!",e);
    server.lastRecording.filename = outputfilename;
    server.busy = false;
    notify(outputfilename);
    cb(null, outputfilename);
  });
};


/* *************
 * Server routes
 */
server.get('/record', function(req, res) {
  if(server.busy) {
    return res.send("Sorry server already busy recording");
  }
  var start = req.param('start', 0);
  var duration = req.param('duration', 30);
  console.log(humanize.date('Y-m-d H:i:s')+" /record?start="+start+"&duration="+duration);
  record(start, duration);
  res.send("Starting recording. Your file will be soon available on /latest.mp4 and /latest.gif");
});

server.get('/latest.gif', function(req, res) {
  res.redirect(server.lastRecording.filename.replace('.mp4','.gif'));
});

server.get(/\/latest(\.mp4)?/, function(req, res) {
  res.redirect(server.lastRecording.filename);
});

server.get('/live', function(req, res) {
  res.render('live.hbs', {
    //videostream: 'downloads/'+FILENAME+'.m3u8'// streamurl
    videostream: streamurl 
  });
});

server.use('/videos', express.static('videos/'));
server.use('/downloads', express.static('downloads/'));

console.log("Server listening on port 1212");
server.listen(1212);
