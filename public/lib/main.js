

domready(function () {

	console.log('dom ready');

	function doDB() {
		//var myDropzone = new Dropzone("div.dropzone", { url: "/file/post"});
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
	

	doDB();
	startGI();
});