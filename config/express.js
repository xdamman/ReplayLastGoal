var VIEWS_DIR = "views/";

var exphbs  = require('express3-handlebars')

module.exports = function(server) {

  var hbs = exphbs.create({
      extname: '.hbs'
    , layoutsDir: VIEWS_DIR
    , partialsDir: VIEWS_DIR+"/partials"
    , defaultLayout: 'layout'
  });

  server.set('views', VIEWS_DIR);
  server.set('view engine', 'hbs');
  server.engine('hbs', hbs.engine);

}
