var FILENAME = "nederlands1";
var DOWNLOADS_DIR = "downloads/";
var MAX_DOWNLOADS = 30;

var avconv = require('avconv')
  , fs = require('fs')
  , express = require('express')
  , spawn = require('child_process').spawn
  , exec = require('child_process').exec
  , _ = require('underscore')
  , humanize = require('humanize')
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


server.lastReplay = { time: new Date, filename: null };
var replay = function(seconds, format, cb) {
  if(((new Date).getTime() - server.lastReplay.time) < 20000) {
    console.error("Last replay less than 20s ago, returning last replay file ",server.lastReplay.filename);
    return cb(null, server.lastReplay.filename); 
  }
  server.lastReplay.time = new Date;
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

  if(format == 'gif') {
    outputfilename = outputfilename.replace('.mp4','.gif');
    //-s qvga -vf format=rgb8,format=rgb24 -pix_fmt rgb24 -r 10
    params.push('-s');
    params.push('vga');
    params.push('-vf');
    params.push('format=rgb8,format=rgb24');
    params.push('-pix_fmt');
    params.push('rgb24');
    params.push('-r');
    params.push('10');
  }

  params.push(outputfilename);

  var stream = spawn('avconv', params);
  stream.stdout.pipe(process.stdout);
  stream.stderr.pipe(process.stderr);

  stream.on('exit', function(e) {
    console.log("Video saved!",e);
    server.lastReplay.filename = outputfilename;
    server.busy = false;
    cb(null, outputfilename);
  });

};

server.get('/replay', function(req, res) {
  if(server.busy) {
    return res.send("Sorry server busy");
  }
  var seconds = req.param('seconds',10);
  var format = req.param('format', 'mp4');
  console.log(humanize.date('Y-m-d H:i:s')+" /replay?seconds="+seconds+"&format="+format);
  replay(seconds, format, function(err, filename) {
    res.redirect(filename);
  });
});


var buffer2gif = function(cb) {
  var gif = 'gif/output.gif';
  var params = ['-t',4,'-y','-f','avi','-i','pipe:0','-s','qvga','-vf','format=rgb8,format=rgb24','-pix_fmt','rgb24','-r',10,'-f','gif','pipe:1'];

  var file = fs.createWriteStream(gif);
  var stream = avconv(params);
  var buf = Buffer.concat(buffer.toArray());
  
  stream.on('message', function(m) {
    console.log(m);
  });

  stream.pipe(file);

  stream.on('exit', function(e) {
    console.log("Exit: ", e);
  });
  stream.on('error', function(e) {
    console.error("oops: ", e);
  });
  stream.on('end', function() {
    console.log("Ending");
    cb(null,gif);
  });
  stream.end(buf, function () {
    console.log('cb to stream.write', arguments);
  });
  // stream.push(null);
};


server.get('/buffer', function(req, res) {
  buffer2gif(function(err, filename) {
    console.log("Sending " + filename);
    res.sendfile(filename);
  });
});


server.get('/stream', function(req, res) {
  streamurl2gif(streamurl, function(err, file) {
    res.sendfile(file);
  });
});

server.use('/videos', express.static('videos/'));

console.log("Server listening on port 1212");
server.listen(1212);
