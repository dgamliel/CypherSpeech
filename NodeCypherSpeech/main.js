'use strict';

//On Page load, create an io socket connection to the server
//On click of the connect button --> fetch value from user bar and send to server
//TODO: Implement response from the server s.t. a resposne from the server constitutes a new button on the screen


$(function () {
		var socket = io();
		console.log("owo called multiple times");
		$('#connect').click(function () {
				var userName = $("#username").val();
				socket.emit('message', userName);
				$("#username").val('');
		});

		socket.on('response', (data) => {
			console.log("Received message from server!", data);
			var listData = `<li><a href="#">${data}</a></li>`
			$("#users").append(listData);
		});

})
