var server = require('../server')
  , request = require('request')
  , expect = require('chai').expect
  , fs = require('fs')
  ;

var noop = function() {};

describe("server", function() {

  it("records a 5s video in the past", function(done) {
    this.timeout(5000);
    request("http://localhost:1212/record?start=-5&duration=5", function(err,res,body) {
      expect(err).to.not.exist;
      var matches = body.match(/http:\/\/localhost:1212\/video\?v=(201[0-9]\-[0-9]{2}\-[0-9]{2}\-[0-9]{2}\-[0-9]{2}\-[0-9]{2})/);
      expect(matches).to.exist;
      expect(matches.length).to.equal(2);
      var videoId = matches[1];
      var fileroot = "videos/"+videoId;
      expect(fs.existsSync(fileroot+".mp4")).to.be.true;
      expect(fs.existsSync(fileroot+".gif")).to.be.true;
      fs.unlink(fileroot+".mp4", noop);
      fs.unlink(fileroot+".gif", noop);
      done();    
    });
  });

});
