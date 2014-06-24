var THUMBNAILS_DIR = "thumbnails/";
var BUFFER_DIR = "buffer/";
var FILENAME = "livestream";

var spawn = require('child_process').spawn
  , humanize = require('humanize')
  , _ = require('underscore')
  , fs = require('fs')
  , path = require('path')
  , env = process.env.NODE_ENV || "development"
  ;

var settings = require('../settings.'+env+'.json');
var streamurl = settings.videostream;

var logs = {
  ffmpeg: {
    out: fs.createWriteStream('logs/ffmpeg.out.log'),
    err: fs.createWriteStream('logs/ffmpeg.err.log')
  }
}

var logerror = function(e) {
  console.error(humanize.date('Y-m-d-H-i-s')+" Stream error in lib/utils: ", e);
};

logs.ffmpeg.out.on("error", function(e) { console.error(humanize.date('Y-m-d-H-i-s')+" Error in stream logs/ffmpeg.out.log", e); });
logs.ffmpeg.err.on("error", function(e) { console.error(humanize.date('Y-m-d-H-i-s')+" Error in stream logs/ffmpeg.err.log", e); });

var utils = {

  ensureDirectoryExists: function(dir) {
    if(!fs.existsSync(dir)) {
      fs.mkdir(dir);
    }
  },
  record: function(channel, start, duration, cb) {
    cb = cb || function() {};

    var start = parseInt(start,10);
    var duration = parseInt(duration, 10);
    
    // If we request 25 seconds starting 10 seconds ago 
    // we wait 15 seconds and re-run the call asking for
    // 25 seconds starting 25 seconds ago
    if(start < 0 && (start + duration) > 0) {
      console.log(">>> Waiting "+(start+duration)+" seconds");
      setTimeout(function() {
        utils.record(channel, start - (start+duration), duration, cb);
      }, 1000 * (start+duration));
      return;
    }

    var outputfilename = 'videos/'+channel+'-'+humanize.date('Y-m-d-H-i-s')+'.mp4';

    var params = ['-t',duration,'-y','-i'];

    if(start < 0) {
      var files = fs.readdirSync(path.join(BUFFER_DIR,channel));
      files.sort(function(a, b) { return utils.seq(a) - utils.seq(b); });
      files = _.map(files, function(f) { return path.join(BUFFER_DIR,channel,f); });
      files = _.last(files, Math.round(start*-1/2+1));
      var concat = 'concat:' + files.slice(1).join('|');
      params.push(concat);
    }
    else {
      params.push(streamurl);
    }

    params.push(outputfilename);

    console.log(">>> Recording with ffmpeg");
    var stream = spawn('ffmpeg', params);
    stream.stdout.pipe(logs.ffmpeg.out);
    stream.stderr.pipe(logs.ffmpeg.err);
    
    stream.on('error', logerror);

    stream.on('exit', function(e) {
      console.log(outputfilename+" created",e);
      cb(null, outputfilename);
    });
  },
  buffer2mp4: function(channel, start, duration, cb) {
    var start = start || 0;
    var cb = cb || function() {};
    // -i myvideo.avi -f image2 -vf fps=fps=1/60 img%03d.jpg
    var files = fs.readdirSync(path.join(BUFFER_DIR,channel));
    files.sort(function(a, b) { return utils.seq(b) - utils.seq(a); });
    var concat = "concat:"+files.join('|');
    var params = ['-y','-i',concat,'-ss',start];
    if(duration) params.push(duration);
    var outputfile = "workspace/buffer.mp4";
    params.push(outputfile);
    var stream = spawn('ffmpeg', params);
    stream.stdout.pipe(logs.ffmpeg.out);
    stream.stderr.pipe(logs.ffmpeg.err);

    stream.on('error', logerror);
    stream.on('exit', function(e) {
      if(e == 1) {
        console.error("Error while creating the thumbnail. See logs for details");
        return cb(1);
      }
      console.log(outputfilename+ " created");
      cb(null, outputfilename);
    });
  },
  mp4thumbs: function(mp4, framerate, cb) {
    var cb = cb || function() {};
    // We create one image per second for the editor
    var outputfile = mp4.replace('.mp4','.%03d.jpg');
    var params = ['-y','-i',mp4,'-f','image2','-vf','fps=fps=1',outputfile];
    var stream = spawn('ffmpeg', params);
    stream.stdout.pipe(logs.ffmpeg.out);
    stream.stderr.pipe(logs.ffmpeg.err);

    stream.on('error', logerror);
    stream.on('exit', function(e) {
      if(e == 1) {
        console.error("Error while creating the thumbnail. See logs for details");
        return cb(1);
      }
      console.log("Thumbnails for " + mp4 + " created");
      cb(null, outputfile);
    });
  },
  mp4toJPG: function(mp4file, start, cb) {
    cb = cb || function() {};
    // -i input.flv -ss 00:00:14.435 -f image2 -vframes 1 out.png
    var outputfilename = mp4file.replace('videos/',THUMBNAILS_DIR).replace('.mp4','.jpg');
    var params = ['-y','-i',mp4file,'-ss',start,'-f','image2','-vframes',1,outputfilename];

    var stream = spawn('ffmpeg', params);
    stream.stdout.pipe(logs.ffmpeg.out);
    stream.stderr.pipe(logs.ffmpeg.err);

    stream.on('error', logerror);
    stream.on('exit', function(e) {
      if(e == 1) {
        console.error("Error while creating the thumbnail. See logs for details");
        return cb(1);
      }
      console.log(outputfilename+ " created");
      cb(null, outputfilename);
    });
  },
  mp4toGIF: function(mp4file, start, duration, cb) {
    cb = cb || function() {};

    // ffmpeg -y -ss 0 -t 20 -i 2014-06-18-16-20-06.mp4 -t 14 -s qvga -r 8 out/anim.gif
    var outputfilename = mp4file.replace('.mp4','.gif');
    var params = ['-y','-ss',start,'-t',duration,'-i',mp4file];

    params.push('-s');
    params.push('qvga');
    params.push('-r');
    params.push('7');

    params.push(outputfilename);

    var stream = spawn('ffmpeg', params);
    // for debugging:
    // stream.stdout.pipe(process.stdout);
    // stream.stderr.pipe(process.stderr);

    console.log(">>> Creating animated gif");
    stream.on('error', logerror);
    stream.on('exit', function(e) {
      console.log(outputfilename+ " created - optimizing the animated gif with gifsicle...");
      var stream2 = spawn('gifsicle', ['-O3',outputfilename,'-o',outputfilename]);
      stream2.on('error', logerror);
      stream2.on('exit', function(e) {
        cb(null, outputfilename);
      });
    });
  },
  seq: function(str) {
    return parseInt(str.replace(FILENAME,''),10);
  },
  cleanDirectory: function(dir, max_downloads, cb) {
    cb = cb || function() {};

    var max_downloads = (typeof max_downloads != 'undefined') ? max_downloads : MAX_DOWNLOADS;
    var files = fs.readdirSync(dir);

    if(files.length <= max_downloads) return cb(null);

    files.sort(function(a, b) { return utils.seq(b) - utils.seq(a); });

    for(var i= max_downloads; i < files.length; i++) {
      // console.log("Removing file "+dir+files[i]+ " modified "+(new Date(fs.statSync(dir+files[i]).mtime.getTime()).toString()));
      fs.unlink(path.join(dir,files[i]));
    }
    cb(null);
  }
};

module.exports = utils;
