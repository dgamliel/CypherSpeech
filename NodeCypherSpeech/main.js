'use strict';

//On Page load, create an io socket connection to the server
//On click of the connect button --> fetch value from user bar and send to server
//TODO: Implement response from the server s.t. a resposne from the server constitutes a new button on the screen


$(function () {
	//On document render, open websocket to our server
	var socket = io();

	$('#connect').click(function () {
			var userName = $("#username").val();
			socket.emit('message', userName);
			$("#username").val('');
	});

	//Handle "response" event
	socket.on('response', (data) => {
		console.log("Adding online user", data);
		var listData = `<button id="${data}" class="btn btn-lg btn-primary spacingTop spacingLeft">${data}</button>`
		$("#users").append(listData);
	});

	socket.on('remove', (data) => {
		console.log("User disconnected", data);
		var removeName = data;
		$(`#${removeName}`).remove();
	})
		

})
