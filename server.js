// https://github.com/nko4/website/blob/master/module/README.md#nodejs-knockout-deploy-check-ins
require('nko')('eKl5JXv67hEA6IFK');

var isProduction = (process.env.NODE_ENV === 'production');
var port = (isProduction ? 80 : 8000);

var express = require('express')
  , app = express()
  , MemoryStore = express.session.MemoryStore
  ;

app.configure(function(){
  app.use(express.cookieParser()); 
  app.use(express.session({
    store: new MemoryStore(),
    secret: 'some $ecret key',
    key: 'foo'
    })
  );
  app.use(express.bodyParser());

  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.get('/test', function(req, res){
  var body = 'Hello World';
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', body.length);
  res.end(body);
});

// Routes

app.listen(port);
console.log('Listening on port ' + port);
