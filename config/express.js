var VIEWS_DIR = "views/";

var exphbs  = require('express3-handlebars')
  , bodyParser = require('body-parser')
  , logger = require('express-logger')

module.exports = function(server) {

  var hbs = exphbs.create({
      extname: '.hbs'
    , layoutsDir: VIEWS_DIR
    , partialsDir: VIEWS_DIR+"/partials"
    , defaultLayout: 'layout'
  });

  server.use(logger({path:'logs/access.log'}));
  server.set('views', VIEWS_DIR);
  server.set('view engine', 'hbs');
  server.engine('hbs', hbs.engine);
  server.use(bodyParser.urlencoded({extended:true}))

}
