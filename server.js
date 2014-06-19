var THUMBNAILS_DIR = "thumbnails/";
var BUFFER_DIR = "buffer/";

var avconv = require('avconv')
  , fs = require('fs')
  , async = require('async')
  , express = require('express')
  , spawn = require('child_process').spawn
  , exec = require('child_process').exec
  , _ = require('underscore')
  , humanize = require('humanize')
  , utils = require('./lib/utils')
  , googl = require('goo.gl')
  , mw = require('./lib/middlewares')
  , env = process.env.NODE_ENV || "development"
  ;

utils.ensureDirectoryExists('videos');
utils.ensureDirectoryExists('thumbnails');

var logs = {
  avconv: {
    out: fs.createWriteStream('logs/avconv.out.log'),
    err: fs.createWriteStream('logs/avconv.err.log')
  }
}

var settings = require('./settings.'+env+'.json');
var streamurl = settings.videostream;

var server = express();
var port = process.env.PORT || process.env.NODE_PORT || 1212;
server.set('port', port);

require('./config/express')(server);

server.lastRecording = { time: 0, filename: '' };
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

  if(((new Date).getTime() - server.lastRecording.time) < 10000) {
    console.error("Last recording less than 10s ago, returning last recording file ",server.lastRecording.filename);
    return cb(null, server.lastRecording.filename); 
  }
  server.lastRecording.time = new Date;
  server.busy = true;
  var outputfilename = 'videos/'+humanize.date('Y-m-d-H-i-s')+'.mp4';

  var params = ['-t',duration,'-y','-i'];

  if(start < 0) {
    var files = fs.readdirSync(BUFFER_DIR);
    files.sort(function(a, b) { return utils.seq(a) - utils.seq(b); });
    files = _.map(files, function(f) { return BUFFER_DIR+f; });
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
    // Generating the thumbnail and animated gif
    async.parallel([
      function(done) {
        utils.mp4toJPG(outputfilename, Math.floor(duration/2), done); 
      },
      function(done) {
        utils.mp4toGIF(outputfilename, start, duration, done); 
      }], function(err, results) {
        cb(null, outputfilename);
    });
  });
};


/* *************
 * Server routes
 */
server.get('/record', mw.localhost, function(req, res) {
  if(server.busy) {
    return res.send("Sorry server already busy recording");
  }
  var start = req.param('start', 0);
  var duration = req.param('duration', 30);
  console.log(humanize.date('Y-m-d H:i:s')+" /record?start="+start+"&duration="+duration);
  record(start, duration, function(err, videofilename) {
    if(err || !videofilename) return res.send(500, "No video filename returned");
    var url = settings.base_url+"/video?v="+videofilename.replace('videos/','').replace('.mp4','');
    res.send(url);
  });
});

server.get('/latest.gif', function(req, res) {
  res.redirect(server.lastRecording.filename.replace('.mp4','.gif'));
});

server.get('/', function(req, res) {
  res.render('home', { title: "@ReplayLastGoal" });
});

server.get('/latest', function(req, res) {
  res.redirect("/video?v="+server.lastRecording.filename.replace('.mp4',''));
});

server.get('/video', mw.requireValidVideoID, function(req, res, next) {
  var v = req.param('v');
  var thumbnail = '/'+THUMBNAILS_DIR + v + '.jpg';
  res.render('video.hbs', {title: "View video replay of the world cup goal", thumbnail: thumbnail});
});

server.get('/thumbnail', mw.requireValidVideoID, function(req, res, next) {
  var v = req.param('v');
  res.sendfile('./'+THUMBNAILS_DIR + v + '.jpg');
});

server.get('/gif', mw.requireValidVideoID, function(req, res, next) {
  var v = req.param('v');
  res.sendfile('./videos/' + v + '.gif');
});

server.get('/live', function(req, res) {
  res.render('live.hbs', {
    videostream: streamurl 
  });
});

server.use('/videos', express.static('videos/'));
server.use('/status', require('./lib/status'));

console.log("Server listening on port "+port);
server.listen(port);
