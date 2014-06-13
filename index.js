var avconv = require('avconv')
  , fs = require('fs')
  , CBuffer = require('CBuffer') 
  , express = require('express')
  ;


var server = express();
var streamurl = "http://l2cm2566367a6a00539a5798000000.484079e0c53754dd.smoote2c.npostreaming.nl/d/live/npo/tvlive/ned1/ned1.isml/ned1-audio%3D128000-video%3D1300000.m3u8";

var params = ['-i',streamurl,'-f','avi','pipe:1'];

var stream = avconv(params);

var buffer = new CBuffer(512); 

var hasOverflown = false
buffer.overflow = function(data) {
  if(hasOverflown) return;
  hasOverflown= true;
  console.log("overflow: ", data);
}

stream.on('error', function(e) {
  console.error("oops", e);
  process.exit(1);
});

/*
stream.on('message', function(m) {
  console.log(m);
});
*/

console.log("Starting streaming...");

stream.on('data', function(data) {
  buffer.push(data);
});


var streamurl2gif = function(streamurl, cb) {
  var params = ['-y','-t',10,'-i',streamurl,'-s','qvga','-vf','format=rgb8,format=rgb24','-pix_fmt','rgb24','-r',10,'gif/output.gif'];
  // -s qvga -vf format=rgb8,format=rgb24 -pix_fmt rgb24 -r 10 output.gif
  var stream = avconv(params);
  stream.on('message', function(m) {
    console.log(m);
  });
  stream.on('end', function() {
    cb(null,gif);
  });
};


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
  buffer2gif(function(err, file) {
    res.sendfile(file);
  });
});


server.get('/stream', function(req, res) {
  streamurl2gif(streamurl, function(err, file) {
    res.sendfile(file);
  });
});

console.log("Server listening on port 1212");
server.listen(1212);
