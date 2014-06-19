var THUMBNAILS_DIR = "thumbnails/";
var BUFFER_DIR = "buffer/";

var fs = require('fs')
  , async = require('async')
  , express = require('express')
  , spawn = require('child_process').spawn
  , exec = require('child_process').exec
  , humanize = require('humanize')
  , utils = require('./lib/utils')
  , mw = require('./lib/middlewares')
  , env = process.env.NODE_ENV || "development"
  ;

utils.ensureDirectoryExists('videos');
utils.ensureDirectoryExists('thumbnails');

var hooks = require('./hooks');

var settings = require('./settings.'+env+'.json');
var streamurl = settings.videostream;

var server = express();
var port = process.env.PORT || process.env.NODE_PORT || 1212;
server.set('port', port);

require('./config/express')(server);

server.lastRecording = { time: 0, data: {} };

/* *************
 * Server routes
 */
server.get('/record', mw.localhost, function(req, res) {
  if(server.busy) {
    return res.send("Sorry server already busy recording");
  }

  if(((new Date).getTime() - server.lastRecording.time) < 10000) {
    console.error("Last recording less than 10s ago, aborting");
    return res.send("Last recording less than 10s ago, aborting"); 
  }

  server.lastRecording.time = new Date;
  server.busy = true;

  var start = req.param('start', 0);
  var duration = req.param('duration', 30);

  console.log(humanize.date('Y-m-d H:i:s')+" /record?start="+start+"&duration="+duration);
  utils.record(start, duration, function(err, videofilename) {
    if(err || !videofilename) return res.send(500, "No video filename returned");

    // Generating the thumbnail and animated gif
    async.parallel([
      function(done) {
        utils.mp4toJPG(videofilename, Math.floor(duration/2), done); 
      },
      function(done) {
        utils.mp4toGIF(videofilename, start, duration, done); 
      }], function(err, results) {
        server.busy = false;
        var videoId = videofilename.replace('videos/','').replace('.mp4','');
        var videoUrl = settings.base_url+"/video?v="+videoId;
        var data = {
            id: videoId 
          , text: req.param('text','')
          , video: videoUrl
          , thumbnail: videoUrl.replace('video','thumbnail')
          , gif: videoUrl.replace('video','gif')
        }
        server.lastRecording.data = data;
        hooks(data);
        res.send(data);
    });
  });
});

server.get('/latest.gif', function(req, res) {
  res.redirect("/gif?v="+server.lastRecording.data.id);
});

server.get('/', function(req, res) {
  res.render('home', { title: "@ReplayLastGoal" });
});

server.get('/latest', function(req, res) {
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
