var THUMBNAILS_DIR = "thumbnails/";
var BUFFER_DIR = "buffer/";
var FILENAME = "livestream";

var spawn = require('child_process').spawn
  , fs = require('fs')

var utils = {

  ensureDirectoryExists: function(dir) {
    if(!fs.existsSync(dir)) {
      fs.mkdir(dir);
    }
  },
  buffer2mp4: function(start, duration, cb) {
    var start = start || 0;
    var cb = cb || function() {};
    // -i myvideo.avi -f image2 -vf fps=fps=1/60 img%03d.jpg
    var files = fs.readdirSync(BUFFER_DIR);
    files.sort(function(a, b) { return utils.seq(b) - utils.seq(a); });
    var concat = "concat:"+files.join('|');
    var params = ['-y','-i',concat,'-ss',start];
    if(duration) params.push(duration);
    var outputfile = "workspace/buffer.mp4";
    params.push(outputfile);
    var stream = spawn('avconv', params);

    stream.stdout.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('exit', function(e) {
      if(e == 1) {
        console.error("Error while creating the thumbnail. See logs for details");
        return cb(1);
      }
      console.log("Thumbnail " + outputfilename+ " created");
      cb(null, outputfilename);
    });
  },
  mp4thumbs: function(mp4, framerate, cb) {
    var cb = cb || function() {};
    // We create one image per second for the editor
    var outputfile = mp4.replace('.mp4','.%03d.jpg');
    var params = ['-y','-i',mp4,'-f','image2','-vf','fps=fps=1',outputfile];
    var stream = spawn('avconv', params);

    stream.stdout.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
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

    var stream = spawn('avconv', params);

    stream.stdout.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('exit', function(e) {
      if(e == 1) {
        console.error("Error while creating the thumbnail. See logs for details");
        return cb(1);
      }
      console.log("Thumbnail " + outputfilename+ " created");
      cb(null, outputfilename);
    });
  },
  mp4toGIF: function(mp4file, start, duration, cb) {
    cb = cb || function() {};

    var outputfilename = mp4file.replace('.mp4','.gif');
    var params = ['-y','-ss',start,'-t',duration,'-i',mp4file];

    params.push('-s');
    params.push('qvga');
    params.push('-vf');
    params.push('format=rgb8,format=rgb24');
    params.push('-pix_fmt');
    params.push('rgb24');
    params.push('-r');
    params.push('10');

    params.push(outputfilename);

    var stream = spawn('avconv', params);
    // for debugging:
    // stream.stdout.pipe(process.stdout);
    // stream.stderr.pipe(process.stderr);

    stream.on('exit', function(e) {
      console.log("Video " + outputfilename+ " created");
      cb(null, outputfilename);
    });

  },
  seq: function(str) {
    return parseInt(str.replace(FILENAME,''),10);
  },
  cleanBufferDirectory: function(max_downloads, cb) {
    cb = cb || function() {};

    var max_downloads = (typeof max_downloads != 'undefined') ? max_downloads : MAX_DOWNLOADS;
    var dir = BUFFER_DIR;
    var files = fs.readdirSync(dir);

    if(files.length <= max_downloads) return cb(null);

    files.sort(function(a, b) { return utils.seq(b) - utils.seq(a); });

    for(var i= max_downloads; i < files.length; i++) {
      // console.log("Removing file "+dir+files[i]+ " modified "+(new Date(fs.statSync(dir+files[i]).mtime.getTime()).toString()));
      fs.unlink(dir+files[i]);
    }
    cb(null);
  }
};

module.exports = utils;
