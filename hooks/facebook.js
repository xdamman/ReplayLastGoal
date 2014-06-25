var humanize = require('humanize'),
    request = require('request'),
    fs = require('fs'),
    path = require('path');

var Facebook = function (options) {

  var uploadUrl = 'https://graph-video.facebook.com/' + options.page_id + '/videos?access_token=' + options.page_access_token;

  return function (data, cb) {

    console.log(humanize.date('Y-m-d H:i:s')+' Posting on facebook: ', data.text, data.thumbnail);

    var r = request.post(uploadUrl, function (err, httpResponse, body) {
      if (err){
        console.error(humanize.date('Y-m-d H:i:s')+' Error while posting on facebook: ', err);
      }
      console.log("Response from facebook: ", body);
      cb(err);
    });

    var form = r.form();
    form.append('description', data.text + ' ' + data.video);
    form.append('title', data.text.split('#WorldCup')[0]);
    form.append('source', fs.createReadStream(path.join(__dirname, '..', data.videofilename)));
  }
};

module.exports = Facebook;
