'use strict';

//On Page load, create an io socket connection to the server
//On click of the connect button --> fetch value from user bar and send to server
//TODO: Implement response from the server s.t. a resposne from the server constitutes a new button on the screen

$(function() {
	//const player = document.getElementById('player');
	//const handleSuccess = function(stream) {
		//if (window.URL){
			//player.srcObject = stream;
		//} else {
			//player.src = stream;
		//}
	//};
	
	const audioOnly = {audio: true, video: false};

	//From our navigator
	//1) Get the mediaDevices available
	//2) Ask user for permission via getUserMedia
	//3) Get the packetized data to encrypt
	navigator
		.mediaDevices
		.getUserMedia(audioOnly)
		.then( mediaStream => {
	
				//Use MediaStream Recording API
				const recorder = new MediaRecorder(mediaStream);

				recorder.ondataavailable = event => {
					const blob = event.data;
					console.log("Blob data", blob);
				}
			
				//Every 1 ms our data available event goes off
				recorder.start(1);
		}

	).catch(err => {console.log(err)});
});


$(function () {
	//On document render, open websocket to our server
	var socket = io();

	$('#connect').click(function () {
			var userName = $("#username").val();
			socket.emit('message', userName);
			$("#username").val('');
			$("#connect").prop('disabled', true);
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
