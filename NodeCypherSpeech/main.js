'use strict';

var userName;
var remoteUserName;
var stream;
var peerConnection;

//On Page load, create an io socket connection to the server
//On click of the connect button --> fetch value from user bar and send to server
//TODO: Implement response from the server s.t. a response from the server constitutes a new button on the screen

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
				stream = mediaStream;
		}

	).catch(err => {console.log(err)});
});


$(function () {
	//On document render, open websocket to our server
	var socket = io();

	$('#connect').click(function () {
			userName = $("#username").val();
			socket.emit('message', userName);
			$("#username").val('');
			$("#connect").prop('disabled', true);
	});

	//Handle "response" event
	socket.on('response', (data) => {
		console.log("Adding online user", data);
		var listData = `<button id="${data}" class="btn btn-lg btn-primary spacingTop spacingLeft">${data}</button>`
		$("#users").append(listData);
		
		$(`#${data}`).click(function () {
			var request = {
				peer: userName,
				remote: data
			};
			socket.emit('request', request);
		});

		$(`#${userName}`).prop('disabled', true);
	});

	socket.on('request', data => {
		console.log('connection request', data);
		if (confirm(data.peer + ' would like to connect with you, do you want to connect?')) {
			socket.emit('initialize', data);
			remoteUserName = data.peer;
			$(`#${remoteUserName}`).removeClass('btn-primary');
			$(`#${remoteUserName}`).addClass('btn-success');
			makeCall(socket, data);
		}
	});

	socket.on('initialize', data => {
		remoteUserName = data.remote;
		$(`#${remoteUserName}`).removeClass('btn-primary');
		$(`#${remoteUserName}`).addClass('btn-success');
		makeCall(socket, data);
	});

	socket.on('offer', async data => {
		await peerConnection.setRemoteDescription(data.offer);
		const answer = await peerConnection.createAnswer();
		await peerConnection.setLocalDescription(answer);
		
		var d = {
			peer: data.peer,
			remote: data.remote,
			answer: answer
		};
		
		socket.emit('answer', d);
	});

	socket.on('answer', async data => {
		await peerConnection.setRemoteDescription(data.answer);
	});

	socket.on('icecandidate', async data => {
		await peerConnection.addIceCandidate(data.candidate);
	});

	socket.on('remove', data => {
		console.log("User disconnected", data);
		var removeName = data;
		$(`#${removeName}`).remove();
	});
})

async function makeCall(socket, data) {
	var config = {iceServers: [{urls: [
		'stun:stun.l.google.com:19302',
		'stun:stun1.l.google.com:19302'
	]}]};
	
	peerConnection = new RTCPeerConnection(config);
	// var remoteConnection = new RTCPeerConnection(config);
	
	if (data.peer === userName) {
		peerConnection.onicecandidate = async event => {
			if (event.candidate) {
				var d = {
					peer: data.peer,
					remote: data.remote,
					candidate: event.candidate
				};

				socket.emit('icecandidate', d);
				// await remoteConnection.addIceCandidate(event.candidate);
			}
		};
	}

	peerConnection.ontrack = event => {
		console.log('ontrack', event);
		const recorder = new MediaRecorder(event.streams[0]);

			recorder.ondataavailable = event => {
				const blob = event.data;
				// console.log("Blob data", blob);
			}
		
			//Every 1 ms our data available event goes off
			recorder.start(1);
	};

	stream.getTracks().forEach(track => {
		peerConnection.addTrack(track, stream);
	});
	
	if (data.peer === userName) {
		const offer = await peerConnection.createOffer();
		await peerConnection.setLocalDescription(offer);

		var d = {
			peer: data.peer,
			remote: data.remote,
			offer: offer
		};

		socket.emit('offer', d);
	}

	// await remoteConnection.setRemoteDescription(offer);
	// const answer = await remoteConnection.createAnswer();
	// await remoteConnection.setLocalDescription(answer);
	
	// await peerConnection.setRemoteDescription(answer);
}