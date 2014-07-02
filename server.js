var THUMBNAILS_DIR = "thumbnails/";
var BUFFER_DIR = "buffer/";

var fs = require('fs')
  , async = require('async')
  , md5 = require('MD5')
  , express = require('express')
  , spawn = require('child_process').spawn
  , exec = require('child_process').exec
  , humanize = require('humanize')
  , utils = require('./lib/utils')
  , _ = require('lodash')
  , mw = require('./lib/middlewares')
  , env = process.env.NODE_ENV || "development"
  ;

utils.ensureDirectoryExists('videos');
utils.ensureDirectoryExists('thumbnails');

var hooks = require('./hooks/index');

var settings = require('./settings.'+env+'.json');

var server = express();
var port = settings.port || 1212;
server.set('port', port);

server.recordingWindow = { start: -8, duration: 20 };

require('./config/express')(server);

server.lastRecording = { time: 0, data: {} };
server.set('secret', settings.secret);

server.info = function() {
  return { recordingWindow: server.recordingWindow, channel: settings.channel, lastRecording: server.lastRecording };
}

/* *************
 * Server routes
 */
server.get('/start', mw.restricted, function(req, res) {
  var channel = req.param('channel');
  if(settings.videostreams[channel]) {
    exec("pm2 restart stream-"+channel);
    return res.send("Running pm2 restart stream-"+channel);
  }
});

server.get('/stop', mw.restricted, function(req, res) {
  var channel = req.param('channel');
  if(settings.videostreams[channel]) {
    exec("pm2 stop stream-"+channel);
    return res.send("Running pm2 stop stream-"+channel);
  }
});

server.get('/settings', mw.restricted, function(req, res) {

  var start = req.param('start', server.recordingWindow.start);
  var duration = req.param('duration', server.recordingWindow.duration);
  var channel = req.param('channel');
  if(channel && settings.videostreams[channel] && channel != settings.channel) {
    console.log(humanize.date('Y-m-d H:i:s')+" changing videostream channel to "+channel);
    settings.channel = channel;
    utils.saveSettings(settings);
    exec("pm2 restart stream");
  }
  server.recordingWindow.start = start;
  server.recordingWindow.duration = duration;

  res.send(server.info());
});

server.get('/hooks', mw.restricted, function(req, res) {
  res.send(settings.hooks);
});

server.get('/record', mw.restricted, function(req, res) {
  if(server.busy) {
    return res.send("Sorry server already busy recording");
  }

  if(((new Date).getTime() - server.lastRecording.time) < 5000) {
    console.error("Last recording less than 5s ago, aborting");
    return res.send("Last recording less than 5s ago, aborting");
  }

  var channel = req.param('channel', settings.channel);
  var start = req.param('start', server.recordingWindow.start);
  var duration = req.param('duration', server.recordingWindow.duration);
  var text = req.param('text','');

  console.log(humanize.date('Y-m-d H:i:s')+" /record?channel="+channel+"&start="+start+"&duration="+duration+"&text="+text);
  res.send("Recording video...");

  server.lastRecording.time = new Date;
  server.busy = true;

  utils.record(channel, start, duration, function(err, videofilename) {
    if(err || !videofilename) return res.send(500, "No video filename returned");
    var videoId = videofilename.replace('videos/','').replace('.mp4','');
    var videoUrl = settings.base_url+"/video?v="+videoId;

    // Generating the thumbnail and animated gif
    async.parallel([
      function(done) {
        utils.mp4toJPG(videofilename, Math.floor(duration/2), done);
      },
      function(done) {
        utils.mp4toGIF(videofilename, Math.max(2,start), Math.min(14,duration), done); 
      }], function(err, results) {
        server.busy = false;
        var data = {
            id: videoId
          , text: text
          , video: videoUrl
          , videofilename: videofilename
          , thumbnail: videoUrl.replace('video','thumbnail')
          , gif: settings.base_url+"/videos/"+videoId+".gif"
          , gifsize: fs.statSync('videos/'+videoId+'.gif').size
        }
        server.lastRecording.data = data;
        try {
          hooks.all(data);
        } catch(e) {
          console.error("Error in hooks: ", e, e.stack);
        }
    });
  });
});

server.post('/webhook', function(req, res) {
  console.log("Received webhook: ", req.body);
  res.send(req.body);
});

server.post('/hooks/test', function(req, res) {

  var service = req.body.service;
  var options = req.body.options;

  if(!hooks[service]) {
    return res.send({code:500, status: "error", error: "Unknown service"});
  }

  var hook = new hooks[service](options);

  var data = { 
    id: '2014-06-19-20-31-24',
    text: 'Goal for Belgium! #ZKO 0-1 #BEL #WorldCup \n📺Video:',
    video: 'http://replaylastgoal.com/video?v=ned3-2014-06-26-21-35-23',
    videofilename: 'videos/ned3-2014-06-26-21-35-23.mp4',
    thumbnail: 'http://replaylastgoal.com/thumbnail?v=ned3-2014-06-26-21-35-23',
    gif: 'http://replaylastgoal.com/videos/ned3-2014-06-26-21-35-23.gif',
    gifsize: 1916223
  };

  console.log(humanize.date('Y-m-d H:i:s')+" Sending test data to hook "+service, data);

  hook(data, function(err, result) {
    if(err) { 
      console.error(err);
      return res.send({code:500, status: "error", error: err.toString()});
    }
    res.send({code: 200, status: "success", data: data});
  });

});

server.get('/hooks/activate', function(req, res) {

  var service = req.param('service');
  var id = req.param('id');

  console.log(humanize.date('Y-m-d H:i:s')+" Activating "+service+" hook "+id);

  if(!hooks[service]) {
    return res.send({code:500, status: "error", error: "Unknown service"});
  }

  var index = _.findIndex(settings.hooks, {id: id}); 
  if(index == -1) {
    return res.send({code: 404, status: "Not found", error: "We couldn't find any hook with this id"});
  }

  settings.hooks[index].active = true;
  settings.hooks[index].date.modified = new Date();
  utils.saveSettings(settings);

  res.send({code: 200, status: "Hook activated"});
});

server.post('/hooks/save', function(req, res) {

  var service = req.body.service;
  var options = req.body.options || {};

  if(!hooks[service]) {
    return res.send({code:500, status: "error", error: "Unknown service"});
  }

  var hookconfig = {
    service: service, 
    options: options, 
    id: md5(JSON.stringify(options)+settings.secret), 
    date: { created: new Date() }, 
    active: false
  };

  if(_.findIndex(settings.hooks, {id:hookconfig.id}) != -1) {
    return res.send({code: 500, status: "error", error: "Hook already present"})
  }

  var hook = new hooks[service](options);

  var activationUrl = settings.base_url+"/hooks/activate?service="+service+"&id="+hookconfig.id;
  var removingUrl = settings.base_url+"/hooks/remove?service="+service+"&id="+hookconfig.id;

  var data = { 
    id: '',
    text: 'Please click this link to activate your hook: '+activationUrl+'\n\n(You can remove this webhook at anytime by clicking this link: '+removingUrl+' )',
    video: '',
    videofilename: '',
    thumbnail: '',
    gif: '',
    gifsize: 0
  };

  console.log(humanize.date('Y-m-d H:i:s')+" test> Sending test data to hook "+service, data);

  hook(data, function(err, result) {
    if(err) { 
      console.error(err);
      return res.send({code:500, status: "error", error: err.toString()});
    }

    settings.hooks.push(hookconfig);
    console.log(humanize.date('Y-m-d H:i:s')+" test> Adding new hook", hookconfig);
    utils.saveSettings(settings);
    res.send({code: 200, status: "success", hook: hookconfig});
  });

});

server.get('/hooks/remove', function(req, res) {
  var service = req.param('service');
  var id = req.param('id');

  if(!hooks[service]) {
    return res.send({code:500, status: "error", error: "Unknown service"});
  }

  var hooksArray = _.filter(settings.hooks, function(hook) {
    return (hook.id != id);
  });

  if(hooksArray.length == settings.hooks.length) {
    return res.send({code: 404, status: "No such hook found"});
  }

  settings.hooks = hooksArray;
  utils.saveSettings(settings);

  res.send({code: 200, status: "success"});

});

server.get('/hooks/add', function(req, res) {
  res.render('addhook');
});

server.get('/latest.gif', function(req, res) {
  res.redirect("/gif?v="+server.lastRecording.data.id);
});

server.get('/', function(req, res) {
  res.render('home', { title: "@ReplayLastGoal" });
});

server.get('/latest', function(req, res) {
  res.redirect("/video?v="+server.lastRecording.data.id);
});

server.get('/video', mw.requireValidVideoID, function(req, res, next) {
  var v = req.param('v');
  var video = settings.base_url+'/videos/'+v+'.mp4';
  var thumbnail = settings.base_url+'/thumbnail?v='+ v;
  res.render('video.hbs', {title: "View video replay of the world cup goal", thumbnail: thumbnail, video: video });
});

server.get('/thumbnail', mw.requireValidVideoID, function(req, res, next) {
  var v = req.param('v');
  res.sendfile('./'+THUMBNAILS_DIR + v + '.jpg');
});

server.get('/gif', mw.requireValidVideoID, function(req, res, next) {
  var v = req.param('v');
  res.sendfile('./videos/' + v + '.gif');
});

server.get('/live', mw.restricted, function(req, res) {
  var channel = req.param('channel', settings.channel);
  res.render('live.hbs', {
    videostream: "/buffer/"+channel+"/livestream.m3u8" // settings.videostreams[channel]
  });
});

server.use('/videos', express.static('videos/'));
server.use('/buffer', express.static('buffer/'));
server.use('/status', require('./lib/status'));

console.log(humanize.date('Y-m-d H:i:s')+" Server listening in "+server.set('env')+" environment on port "+port+" with the following settings: ", server.info());
server.listen(port);
