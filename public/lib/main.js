

domready(function () {

	console.log('dom ready');

	var myFiles = [];

	var _template = "";	
	var r; 

	// Lets get some templates
	function getTemplates(callback) {
		$.get('/template/files.html', function(data) {
			_template = data;
			
			// Lets do some Ractive love!
			r = new Ractive({
				el: "filelist",
				template: _template,
				data: {
					files: myFiles
				}
			});
			callback();
		});
	}
	
	getTemplates(function() {
		console.log('ractive init');
		doDB();
	});

	function loadFiles(data) {
		r.set('files', data);	
	}
	

	function getAllFiles() {
		$.get('/files/_all', function(data) {
			loadFiles(data);
		});
	}


	var uploadMap = {};

	function doDB() {
		var myDropzone = new Dropzone("div.dropzone", {
			url: "/file/post",
			maxFilesize: 2, // MB
			createImageThumbnails: true,
			params: {
				category: 'the special one',
				type: 'some kind of type'
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
			uploadMap[file.name] = {
				src: url
			};
		});
		myDropzone.on('sending', function(file, xhr, formdata) {
			console.log(formdata);
		});
		myDropzone.on('success', function(file, res) {
			console.log('***** success');
			console.log(file);
			console.log(uploadMap[file.name]);
			console.log(res.id);
			// Save thumbnail data
			if (uploadMap[file.name]) {
				$.post('/file/thumbnail/' + res.id, uploadMap[file.name], function(res) {
					console.log(res);
				})
			}
		});
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

	$(".fa-cog").click(function() {
		$("#bigwell").show();

		if ($("#bigwell").hasClass('slideInRight')) {
			$("#bigwell").removeClass('slideInRight');
			$("#bigwell").addClass('slideOutRight');
		} else {
			$("#bigwell").removeClass('slideOutRight');
			$("#bigwell").addClass('slideInRight');
			getAllFiles();
		}
		
	});

	function createGUID() {
		var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});     
		return guid;
	}
});