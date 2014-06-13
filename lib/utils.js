var spawn = require('child_process').spawn;

module.exports = {

  mp4toGIF: function(mp4file, cb) {
    cb = cb || function() {};

    var params = ['-y','-i',mp4file];

    params.push('-s');
    params.push('vga');
    params.push('-vf');
    params.push('format=rgb8,format=rgb24');
    params.push('-pix_fmt');
    params.push('rgb24');
    params.push('-r');
    params.push('10');

    outputfilename = mp4file.replace('.mp4','.gif');
    params.push(outputfilename);

    var stream = spawn('avconv', params);
    stream.stdout.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);

    stream.on('exit', function(e) {
      console.log("Video " + outputfilename+ " created");
      cb(null, outputfilename);
    });

  }

};
