var hooks = require('../hooks/index')
  , expect = require('chai').expect;

var data = { id: '2014-06-19-20-31-24',
  text: 'Goal for Belgium! #URU 1-1 #ENG #WorldCup \n📺Video:',
  video: 'http://replaylastgoal.com/video?v=2014-06-19-20-31-24',
  thumbnail: 'http://replaylastgoal.com/thumbnail?v=2014-06-19-20-31-24',
  gif: 'http://replaylastgoal.com/videos/2014-06-19-20-31-24.gif',
  gifsize: 2499245 };  

describe("hooks", function() {

  it("sends a notification to all hooks", function(done) {

    this.timeout(5000);

    hooks(data, function(e) {
      expect(e).to.not.exist;
      done();
    });

  });

});
