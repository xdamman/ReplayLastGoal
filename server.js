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

server.recordingWindow = { start: -8, duration: 20 };

require('./config/express')(server);

server.lastRecording = { time: 0, data: {} };

server.info = function() {
  return { recordingWindow: server.recordingWindow, filter: settings.filter, channel: settings.channel, lastRecording: server.lastRecording };
}

/* *************
 * Server routes
 */
server.get('/setup', function(req, res) {
  var secret = req.param('secret');

  if(secret == settings.secret) {
    var start = req.param('start', server.recordingWindow.start);
    var duration = req.param('duration', server.recordingWindow.duration);
    var filter = req.param('filter');
    if(filter) {
      console.log(humanize.date('Y-m-d H:i:s')+" changing filter to "+filter);
      settings.filter = filter;
      fs.writeFileSync('./settings.'+env+'.json',JSON.stringify(settings,null,2));
    }
    var channel = req.param('channel');
    if(channel && settings.videostreams[channel] && channel != settings.channel) {
      console.log(humanize.date('Y-m-d H:i:s')+" changing videostream channel to "+channel);
      settings.channel = channel;
      fs.writeFileSync('./settings.'+env+'.json',JSON.stringify(settings,null,2));
      exec("pm2 restart stream");
    }
    server.recordingWindow.start = start;
    server.recordingWindow.duration = duration;
  }

  res.send(server.info());
});

server.get('/record', mw.localhost, function(req, res) {
  if(server.busy) {
    return res.send("Sorry server already busy recording");
  }

  if(((new Date).getTime() - server.lastRecording.time) < 10000) {
    console.error("Last recording less than 10s ago, aborting");
    return res.send("Last recording less than 10s ago, aborting"); 
  }

  var start = req.param('start', server.recordingWindow.start);
  var duration = req.param('duration', server.recordingWindow.duration);
  var text = req.param('text','');

  console.log(humanize.date('Y-m-d H:i:s')+" /record?start="+start+"&duration="+duration+"&text="+text);

  if(!text.match(new RegExp(settings.filter))) {
    return res.send("'"+text+"' didn't pass the filter set for this server ("+settings.filter+")");
  }

  res.send("Recording video...");

  server.lastRecording.time = new Date;
  server.busy = true;

  utils.record(settings.channel, start, duration, function(err, videofilename) {
    if(err || !videofilename) return res.send(500, "No video filename returned");
    var videoId = videofilename.replace('videos/','').replace('.mp4','');
    var videoUrl = settings.base_url+"/video?v="+videoId;

    // Generating the thumbnail and animated gif
    async.parallel([
      function(done) {
        utils.mp4toJPG(videofilename, Math.floor(duration/2), done); 
      },
      function(done) {
        utils.mp4toGIF(videofilename, Math.max(2,start), Math.min(13,duration), done); 
      }], function(err, results) {
        server.busy = false;
        var data = {
            id: videoId 
          , text: text 
          , video: videoUrl
          , thumbnail: videoUrl.replace('video','thumbnail')
          , gif: settings.base_url+"/videos/"+videoId+".gif" 
          , gifsize: fs.statSync('videos/'+videoId+'.gif').size
        }
        server.lastRecording.data = data;
        hooks(data);
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

console.log(humanize.date('Y-m-d H:i:s')+" Server listening on port "+port+" with the following settings: ", server.info());
server.listen(port);
