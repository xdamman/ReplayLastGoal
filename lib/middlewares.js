module.exports = {
  requireValidVideoID: function(req, res, next) {
    var v = req.param('v');
    if(!v || !v.match(/201[0-9]\-[0-9]{2}\-[0-9]{2}\-[0-9]{2}\-[0-9]{2}\-[0-9]{2}/))
      return res.send(400,"Invalid video id");

    return next();
  },
  localhost: function(req, res, next) {
    if(req.socket.remoteAddress == "127.0.0.1") {
      return next(); 
    }
    else return res.send(403, "Unauthorized call");
  }
};
