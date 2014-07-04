var humanize = require('humanize'),
    request = require('request');

var Flowdock = function(options) {
  return function(data, cb) {
    var flowdockUrl = 'https://api.flowdock.com/v1/messages/team_inbox/' + options.api_token;
    var postData = {
      source: 'ReplayLastGoal',
      from_address: options.from_address,
      subject: data.text,
      content: "<img src='"+data.gif+"' />"
    };
    request.post({url: flowdockUrl, json: postData}, function(err, httpResponse, body) {
      if (err){
        console.error(humanize.date('Y-m-d H:i:s')+' Error while posting on flowdock: ', err);
      }
      console.log("Response from flowdock: ", body);
      cb(err);
    });
  };
};

module.exports = Flowdock;
