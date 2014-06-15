module.exports = {
  localhost: function(req, res, next) {
    if(req.socket.remoteAddress == "127.0.0.1") {
      return next(); 
    }
    else return res.send(403, "Unauthorized call");
  }
};
