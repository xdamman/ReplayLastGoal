var os = require('os')
  , exec = require('child_process').exec
  , async = require('async')
  , package = require('../package.json')
  , humanize = require('humanize')
  , started_at = humanize.time()
  ;

var connections = {}
  , swap;

var getConnectedIPs = function(port, cb) {
  exec('netstat -n | grep ESTABLISHED | grep :'+port+' | awk \'{print $4}\'| grep -v :'+port+' | sed -E "s/:[0-9]+//', function(e, res) {
    cb(e, res.split('\n'));
  });
};

module.exports = function(req, res, next) {

    var server = req.app;

    async.parallel([
      function(done) {
        getConnectedIPs(server.set('port'), function(err, ips) {
          connections[server.set('port')] = ips.length;
          done();
        });
      },
      function(done) {
        getConnectedIPs(22, function(err, ips) {
          connections[22] = ips;
          done();
        });
      },
      function(done) {
        exec('vmstat -SM -s | grep "used swap" | sed -E "s/[^0-9]*([0-9]{1,8}).*/\1/"', function(e, res) {
          swap = parseInt(res,10);
          done();
        });
      }], function(e) {
        res.send({
          server: {
            env        : process.env.NODE_ENV,
            version    : package.version, 
            started    : humanize.relativeTime(started_at),
            status     : server.status || 'up'
          },
          node       : {
            version   : process.version,
            memoryUsage: Math.round(process.memoryUsage().rss / 1024 / 1024)+"M",
            uptime     : process.uptime()
          },
          system    : {
            hostname   : os.hostname(),
            connections: connections,
            loadavg    : os.loadavg(),
            freeMemory : Math.round(os.freemem()/1024/1024)+"M",
            swap       : swap
          }
        });
    });
};

