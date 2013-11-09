

domready(function () {

	console.log('dom ready');

	var _pageData = {
		files: [],
		doc: {},
		docProperties: {},
		display: {
			showInfo: false,
			showFilter: false,
			view: {
				grid: true
			},
			save: {
				label: 'Save',
				icon: 'fa-save'
			}
		},
		keys: function(obj) {
			return Object.keys(obj);
		}
	};

	var _template = "";	
	var _r;

	var _ee = new EventEmitter2();

	// Setup some listeners

	_ee.on('getDocs', function(data) {
		console.log('Get Documents');	
		if (!data) {
			$.get('/files/_all', function(data) {
				_ee.emit('gotDocs', data);
			});	
		}
	});

	_ee.on('gotDocs', function(data) {
		console.log('Got Documents');	
		_r.set('files', data);
	});


	_ee.on('getDocInfo', function(data) {
		$.get('/file/' + data.id, function(data) {
			_ee.emit('gotDocInfo', data);	
		});
	});

	_ee.on('gotDocInfo', function(data) {
		console.log('Got Document Info');
	});

	_ee.on('gotDocInfo', function(data) {
		_pageData.doc = data;
		_r.set('doc', _pageData.doc);
		_pageData.display.showInfo = true;
		_r.set('display.showInfo', _pageData.display.showInfo);
	});

	_ee.on('saveDocInfo', function(data) {
		$.post('/file/' + data.id, data, function(data) {
			_ee.emit('savedDocInfo', data);	
		});
	});

	_ee.on('savedDocInfo', function(data) {
		setTimeout(function() {
			_pageData.display.save.label = 'Save';
			_pageData.display.save.icon = 'fa-save';
			_r.set('display.save', _pageData.display.save);
		}, 1000);
	});

	// Lets get some templates
	function getTemplates(callback) {
		$.get('/template/files.html', function(data) {
			_template = data;
			
			// Lets do some Ractive love!
			_r = new Ractive({
				el: "maincontainer",
				template: _template,
				data: _pageData
			});
			
			_r.on({
				itemClick: function(event) {
					var id = event.node.getAttribute('data-fileid');

					// Get document info or close...
					if (_pageData.doc.id===id && _pageData.display.showInfo) {
						_pageData.display.showInfo = false;
						_r.set('display.showInfo', _pageData.display.showInfo);
					} else {
						_ee.emit('getDocInfo', {
							id: id
						});
					}
					
				},
				filterClick: function(event) {
					_pageData.display.showFilter = (_pageData.display.showFilter? false: true);
					_r.set('display.showFilter', _pageData.display.showFilter);
				},
				gridView: function(event) {
					
				},
				infoClose: function(event) {
					_pageData.display.showInfo = false;
					_r.set('display.showInfo', _pageData.display.showInfo);
				},
				infoLock: function(event) {
					_pageData.doc.properties.lock = true;
					_r.set('doc', _pageData.doc);
					_ee.emit('saveDocInfo', _pageData.doc);
				},
				infoSave: function(event) {
					console.log('save data');
					_pageData.display.save.label = 'Saving';
					_pageData.display.save.icon = 'fa-spinner fa-spin';
					_r.set('display.save', _pageData.display.save);

					var newProperties = {};
					for (var i=0; i<event.node.form.length; i++) {
						var ele = event.node.form[i];
						if (ele.id!=="") {
							_pageData.doc.properties[ele.id] = ele.value;
						}
					}
					_r.set('doc', _pageData.doc);
					_ee.emit('saveDocInfo', _pageData.doc);
				}
			});

			callback();
		});
	}
	
	function getDocProperties(callback) {
		$.get('/properties', function(data) {
			_pageData.docProperties = data;
			_ee.emit('GotDocProperties');
			callback();
		});
	}

	_ee.emit('getDocProperties');

	
	getDocProperties(function() {
		getTemplates(function() {
			console.log('ractive init');
			doDZ();
			_ee.emit('getDocs');
		});
	});

	var uploadMap = {};

	function doDZ() {
		var myDropzone = new Dropzone("div.dropzone", {
			url: "/file/upload",
			dictDefaultMessage: '',
			maxFilesize: 4, // MB
			createImageThumbnails: true,
			params: {
				Category: 'a',
				Type: 't1'
			},
			accept: function(file, done) {
				if (file.name == "justinbieber.jpg") {
					done("Naha, you don't.");
				} else {
					done();
				}
			}
		});

		myDropzone.on('thumbnail', function(file, url) {
			console.log('***** thumbnail');
			save(file, url);
		});

		myDropzone.on('sending', function(file, xhr, formdata) {
			console.log(formdata);
		});

		myDropzone.on('success', function(file, res) {
			console.log('***** success');	
			save(file, null, res);
		});
		function save(file, url, res) {
			(function() {
				uploadMap[file.name] = uploadMap[file.name] || {};
				if (url) {
					uploadMap[file.name].src = url;	
				}
				if (res) {
					uploadMap[file.name].obj = res;	
				}
				if (uploadMap[file.name].obj && uploadMap[file.name].src) {
					var src = uploadMap[file.name].src;
					uploadMap[file.name] = uploadMap[file.name].obj;
					uploadMap[file.name].src = src;

					$.post('/file/thumbnail/' + uploadMap[file.name].id, uploadMap[file.name], function(res) {
						file.previewElement.style.display = 'none';
						_pageData.files.push(res);
						_r.set('files',_pageData.files);
					});	
				}
			})();
		}
	}

	function startGI() {
		var url = 'https://goinstant.net/frizzauk/dmsme';
		goinstant.connect(url, function (err, connection, lobby) {
			if (err) {
				console.log(err); // Could not connect to GoInstant
			}
			// You are now connected!

			// The listener will be invoked every time the value of name is changed by another user
			var name = lobby.key('name');
			var el = $('input[name="name"]');

			name.on('set', function(value, context) {
				el.val(value);
			});

			el.on('keyup', function() {
				name.set($(this).val());
			});
		});	
	}
	
	startGI();

	function createGUID() {
		var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});     
		return guid;
	}
});