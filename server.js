// https://github.com/nko4/website/blob/master/module/README.md#nodejs-knockout-deploy-check-ins
require('nko')('eKl5JXv67hEA6IFK');

var isProduction = (process.env.NODE_ENV === 'production');
var port = (isProduction ? 80 : 8000);

var express = require('express')
  , app = express()
  , MemoryStore = express.session.MemoryStore
  , fs = require('fs')
  , uuid = require('node-uuid')
  , _ = require('lodash')
  , moment = require('moment')
  ;

var gFileProperties = {
  'Name': {
    type: 'input'
  },
  'Category': {
    type: 'select',
    options: [
      { option: '', value: ''},
      { option: 'Category 1', value: 'category-1'},
      { option: 'Category 2', value: 'category-2'}
    ]
  },
  'Type': {
    type: 'select',
    options: [
      { option: '', value: ''},
      { option: 'Type 1', value: 'type-1'},
      { option: 'Type 2', value: 'type-2'}
    ]
  }
  // 'Date': {
  //   type: 'date'
  // }
};

var gLimit = 1000;
var gFileStore = {};
var gFileStoreStats = {
  count: 0,
  limit: gLimit
};

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

app.get('/properties', function(req, res){
  res.send(gFileProperties);
});

app.get('/files/_all', function(req, res){
  var results = [];
  for (var key in gFileStore) {
    results.push(gFileStore[key]);
  }
  res.send(results);
});

app.get('/files/_stats', function(req, res){
  res.send(gFileStoreStats);
});

app.get('/files/_search/:search', function(req, res){
  var results = [];
  for (var key in gFileStore) {
    var obj = gFileStore[key];
    if (obj.name.indexOf(req.params.search)>-1) {
      results.push(obj);
    } else {
      var props = JSON.stringify(obj.properties);
      if (props.indexOf(req.params.search)>-1) {
        results.push(obj);
      } else {
        if (obj.lastModifiedDate && obj.lastModifiedDate.indexOf(req.params.search)>-1) {
          results.push(obj);
        }
      }
    }
  }
  res.send(results);
});

app.get('/file/:id', function(req, res){
  res.send(gFileStore[req.params.id]);
});

app.post('/file/thumbnail/:id', function(req, res){
  if (gFileStoreStats && gFileStoreStats.count<gLimit) {
    // Set last modified date
    if (req.body.lastModifiedDate) {
      moment.lang('en-gb');
      gFileStore[req.params.id].lastModifiedDate = moment(req.body.lastModifiedDate.substring(0,15), "ddd MMM DD YYYY").format("YYYY-MM-DD");  
    }

    if (gFileStore[req.params.id]) {
      gFileStore[req.params.id].thumbnail = req.body.thumbnail;
    }
    res.send(gFileStore[req.params.id]);
  } else {
    res.send(200);
  }
});

// Routes
app.post('/file/upload', function(req, res) {
  if (gFileStoreStats && gFileStoreStats.count<gLimit) {
    var id = uuid.v1();

    var defaults = {
      Name: '',
      Category: '',
      Type: '',
      lock: false
    };
    
    var properties = _.extend(defaults, req.body);
    
    
    gFileStore[id] = {
      id: id,
      name: req.files.file.name,
      size: req.files.file.size,
      location: '/uploads/' + id,
      properties: properties
    };
    
    res.send(gFileStore[id]);

    doStats();  
  } else {
    res.send(200);
  }
  
  //res.redirect("back");
  
  // fs.readFile(req.files.file.path, function (err, data) {
  //   var newPath = __dirname + "/uploads/" + req.files.file.name;
  //   fs.writeFile(newPath, data, function (err) {
  //     res.redirect("back");
  //   });
  // });
});

function doStats() {
  gFileStoreStats.count = Object.keys(gFileStore).length;
}

app.post('/file/:id', function(req, res){
  if (gFileStore[req.params.id]) {
    gFileStore[req.params.id] = req.body;
    if (gFileStore[req.params.id].properties.lock==='true') {
      gFileStore[req.params.id].properties.lock = true;
    } else {
      gFileStore[req.params.id].properties.lock = false;
    }
  }
  res.send(gFileStore[req.params.id]);
});


app.listen(port);
console.log('Listening on port ' + port);
