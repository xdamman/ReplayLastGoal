var fs = require('fs')
  , expect = require('chai').expect
  , _ = require('underscore')
  , utils = require('../lib/utils');

var MP4FILE = "test/videos/test.mp4";

describe("utils", function() {

  it.only("converts a mp4 to 1 image per second jpg", function(done) {
    utils.mp4thumbs(MP4FILE, 1, function(err, output) {
      expect(err).to.not.exist;
      var files = fs.readdirSync("test/videos");
      files = _.filter(files, function(f) { return f.match(/[0-9]{3}\.jpg/); });
      expect(files.length).to.equal(6);
      for(var i=0; i<files.length;i++) {
        fs.unlink("test/videos/"+files[i]);
      };
      done();
    });
  });

  it("converts a mp4 to a jpg", function(done) {
    utils.mp4toJPG(MP4FILE, 2, function(err, thumbnail) {
      expect(err).to.not.exist;
      console.log("Thumbnail file: ", thumbnail);
      expect(fs.existsSync(thumbnail)).to.be.true;
      done();
    });
  });

  it("converts a mp4 to a gif", function(done) {
    utils.mp4toGIF(MP4FILE, 0, 5, function(err, giffile) {
      expect(err).to.not.exist;
      console.log("Gif file: ", giffile);
      expect(fs.existsSync(giffile)).to.be.true;
      done();
    });
  });

  after(function(done) {
    // Remove GIF file 
    fs.unlink(MP4FILE.replace('.mp4','.gif'));
    fs.unlink(MP4FILE.replace('.mp4','.jpg'));
    done();
  });

});
