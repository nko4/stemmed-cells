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
  business: {
    Name: {
      type: 'input',
      label: 'Contact'
    },
    Category: {
      type: 'select',
      label: 'Category',
      options: [
        { option: '', value: ''},
        { option: 'Suppliers', value: 'suppliers'},
        { option: 'Partners', value: 'partners'},
        { option: 'Creditors', value: 'creditors'},
        { option: 'Shareholders', value: 'shareholders'},
        { option: 'Customers', value: 'customers'},
        { option: 'Employees', value: 'employees'},
        { option: 'Directors', value: 'directors'},
        { option: 'Investors', value: 'investors'},
        { option: 'Misc 3rd Party', value: 'miscparty'}
      ]
    },
    Type: {
      type: 'select',
      label: 'Type',
      options: [
        { option: '', value: ''},
        { option: 'Purchase Orders', value: 'purchaseorder'},
        { option: 'Requisitions', value: 'requisitions'},
        { option: 'Invoices', value: 'invoices'},
        { option: 'Receipts', value: 'receipts'},
        { option: 'Media', value: 'media'},
        { option: 'Emails', value: 'emails'},
        { option: 'Misc', value: 'misc'}
      ]
    }
  },
  photo: {
    Name: {
      type: 'input',
      label: 'Album'
    },
    Category: {
      type: 'select',
      label: 'Category',
      options: [
        { option: '', value: ''},
        { option: 'Animals', value: 'animals'},
        { option: 'Industrial', value: 'industrial'},
        { option: 'Nature', value: 'nature'},
        { option: 'People', value: 'people'},
        { option: 'Transportation', value: 'transportation'}
      ]
    }
  }
};

var gFileStore = {
  photo: {},
  business: {}
};
var gFileStoreStats = {
  photo: {
    count: 0,
    limit: 1000
  },
  business: {
    count: 0,
    limit: 1000
  }
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

app.get('/photo', function(req, res) {
  res.redirect('/docs.html?site=photo');
});

app.get('/business', function(req, res) {
  res.redirect('/docs.html?site=business');
});

app.get('/:site/properties', function(req, res){
  res.send(gFileProperties[req.params.site]);
});

app.get('/:site/files/_all', function(req, res){
  var results = [];
  for (var key in gFileStore[req.params.site]) {
    results.push(gFileStore[req.params.site][key]);
  }
  res.send(results);
});

app.get('/:site/files/_stats', function(req, res){
  res.send(gFileStoreStats[req.params.site]);
});

app.get('/:site/files/_search/:search', function(req, res){
  var results = [];
  for (var key in gFileStore[req.params.site]) {
    var obj = gFileStore[req.params.site][key];
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

app.get('/:site/file/:id', function(req, res){
  res.send(gFileStore[req.params.site][req.params.id]);
});

app.post('/:site/file/thumbnail/:id', function(req, res){
  if (gFileStoreStats[req.params.site] && gFileStoreStats[req.params.site].count<gFileStoreStats[req.params.site].limit) {
    // Set last modified date
    if (req.body.lastModifiedDate) {
      moment.lang('en-gb');
      gFileStore[req.params.site][req.params.id].lastModifiedDate = moment(req.body.lastModifiedDate.substring(0,15), "ddd MMM DD YYYY").format("YYYY-MM-DD");  
    }

    if (gFileStore[req.params.site][req.params.id]) {
      gFileStore[req.params.site][req.params.id].thumbnail = req.body.thumbnail;
    }
    res.send(gFileStore[req.params.site][req.params.id]);
  } else {
    res.send(200);
  }
});

app.post('/:site/file/upload', function(req, res) {
  if (gFileStoreStats[req.params.site] && gFileStoreStats[req.params.site].count<gFileStoreStats[req.params.site].limit) {
    var id = uuid.v1();

    var defaults = {
      Name: '',
      Category: '',
      Type: '',
      lock: false
    };
    
    var properties = _.extend(defaults, req.body);
    
    
    gFileStore[req.params.site][id] = {
      id: id,
      name: req.files.file.name,
      size: req.files.file.size,
      location: '/uploads/' + req.params.site + '/' + id,
      properties: properties
    };
    
    res.send(gFileStore[req.params.site][id]);

    doStats(req.params.site);  
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

app.post('/:site/file/:id', function(req, res){
  if (gFileStore[req.params.site][req.params.id]) {
    gFileStore[req.params.site][req.params.id] = req.body;
    if (gFileStore[req.params.site][req.params.id].properties.lock==='true') {
      gFileStore[req.params.site][req.params.id].properties.lock = true;
    } else {
      gFileStore[req.params.site][req.params.id].properties.lock = false;
    }
  }
  res.send(gFileStore[req.params.site][req.params.id]);
});

app.get('/:site/file/:id/_delete', function(req, res){
  if (gFileStore[req.params.site][req.params.id]) {
    if (!gFileStore[req.params.site][req.params.id].properties.lock) {
      delete gFileStore[req.params.site][req.params.id];
    }
  }
  res.send(200);
});

function doStats(site) {
  gFileStoreStats[site].count = Object.keys(gFileStore[site]).length;
}


app.listen(port);
console.log('Listening on port ' + port);
