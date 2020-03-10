'use strict';

var userName;
var remoteUserName;
var stream;
var peerConnection;
var iv;

//Function to generate public and private keys for ECDH

var handshake = {};

handshake.genEcdhKeyPair = function () {
	return crypto.subtle.generateKey(
		{
			name: "ECDH",
			namedCurve: "P-256"
		},
		true,
		["deriveKey"]
	)
		.then(function (key) {
			console.log("EC Key Pair is generated.");
			var localEcKeyPair = key;
			handshake.keyPair = key;
			return crypto.subtle.exportKey("raw", localEcKeyPair.publicKey);
		})
		.then(function (result) {
			var finalResult = new Uint8Array(result.byteLength);
			finalResult.set(new Uint8Array(result));

			return finalResult;
		})
		.catch(function (err) {
			console.error(err);
			return null;
		})
}

//TODO: make this return an AES key pair that functions correctly
handshake.createSharedKey = function (receivedKey) {
	//console.log("Trying to create shared secret from ", receivedKey);
	let rawKey = crypto.subtle.exportKey("raw", receivedKey);
	return crypto.subtle.importKey("raw", receivedKey, { name: "ECDH", namedCurve: "P-256" }, true, [])
	.then( importedKey => {
		return crypo.subtle.deriveBits(
			{
				name: 'ECDH',
				namedCurve: 'P-256',
				public: importedKey
			},
			handshake.keyPair.privateKey,
			256
		)
	})
	.then(sharedSecret => {
		var secret = new Uint8Array(sharedSecret.length);
		secret.set(new Uint8Array(sharedSecret));
		return secret;
	})
}

handshake.symmetricEncrypt = function (msg, key) {
	//var enc = new TextEncoder();
	//msg = enc.encode(msg);
	iv = crypto.getRandomValues(new Uint8Array(16));

	//Uint8Array
	return window.subtle.encrypt(
		{
			name: "AES-CBC",
			iv
		},
		key,
		msg
	);
}


handshake.symmetricDecrypt = function (ciphertext, key) {
	//Returns Uint8Array
	return window.subtle.decrypt(
		{
			name: "AES-CBC",
			iv
		},
		key,
		ciphertext
	);
}

//Test function to show how we should call the function
async function testCrypto() {
	var toSend = await handshake.genEcdhKeyPair();
	var pub = handshake.keyPair.publicKey;
	var priv = handshake.keyPair.privateKey;

	console.log(pub);
	console.log(priv);
	console.log(toSend);
	console.log(handshake);

}

//Run this only when we need to test some async crypto stuff
$(function(){
	//var whatever = testCrypto();
	return;
})

//On Page load, create an io socket connection to the server
//On click of the connect button --> fetch value from user bar and send to server
//TODO: Implement response from the server s.t. a response from the server constitutes a new button on the screen

$(function () {

	const audioOnly = { audio: true, video: false };

	// var player = document.getElementById('player')

	//From our navigator
	//1) Get the mediaDevices available
	//2) Ask user for permission via getUserMedia
	//3) Get the packetized data to encrypt
	navigator
		.mediaDevices
		.getUserMedia(audioOnly)
		.then(mediaStream => {
			stream = mediaStream;
			console.log('stream', stream);
			// player.srcObject = stream;
		}

		).catch(err => { console.log(err) });
});


$(function () {
	//On document render, open websocket to our server
	var socket = io();

	//Violates DRY but I don't care lol
	$('form').submit(function (e) {
		e.preventDefault();
		userName = $("#username").val();
		socket.emit('message', userName);
		$("#username").val('');
		$("#connect").prop('disabled', true);
	});

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
			establishEncryption(socket);
			makeCall(socket, data);
		}
	});

	socket.on('initialize', data => {
		remoteUserName = data.remote;
		$(`#${remoteUserName}`).removeClass('btn-primary');
		$(`#${remoteUserName}`).addClass('btn-success');
		establishEncryption(socket);
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

	/* CRYPTO FUNCTIONALITY */

	//On receiving a public key from a peer, gen our keyPair and send back our public key
	socket.on('pubFromPeer', async data => {
		let remoteKeyPair = await handshake.genEcdhKeyPair();
		let receivedKey = data;

		console.log("in pubFromPeer key generated is ", remoteKeyPair);
		//handshake.sharedKey = await handshake.createSharedKey(receivedKey);

		//console.log('Sending publicKey from remote', remoteKeyPair);
		console.log('Creating shared key from peer', handshake.sharedKey);
		socket.emit('pubFromRemote', remoteKeyPair);

	});

	//On receiving our publicKey from remote we create our shared key and exit
	socket.on('pubFromRemote', async data => {
		handshake.sharedKey = await handshake.createSharedKey(data);
		console.log('Creating shared key from remote', handshake.sharedKey);
	});

})

async function establishEncryption(socket){
	// PSEDUO CODE FOR ESTABLISHING AN ENCRYPTED CONNECTION
	/*
	 * 1) The peer creates a DH Key Pair
	 * 2) Peer signals server to send DH Pub Key to Remote
	 * 3) On receiving DH Pub Key, Remote creates DH Key Pair and sends Remote Pub Key to Peer
	 * 4) Remote and Peer create sharedSecret key
	 */ 

	var keyPair = await handshake.genEcdhKeyPair()
	console.log('keyPair from public is', keyPair);
	socket.emit('pubFromPeer', keyPair.publicKey);

}


async function makeCall(socket, data) {
	// var config = {
	// 	iceServers: [{
	// 		urls: [
	// 			'stun:stun.l.google.com:19302',
	// 			'stun:stun1.l.google.com:19302',				
	// 		]
	// 	}]
	// };

	//JSON object with iceServers that map to another JSON object with URLS to TURN and STUN servers
	var ICE_CONFIG = {
		iceServers: [
			{
				urls:'stun:stun.l.google.com:19302'
			},
			{
				urls:'stun:stun1.l.google.com:19302'
			},
			{
				urls: 'turn:192.158.29.39:3478?transport=udp',
				credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
				username: '28224511:1379330808'
			},
			{
				urls: 'turn:192.158.29.39:3478?transport=tcp',
				credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
				username: '28224511:1379330808'
			}
		]
	}

	peerConnection = new RTCPeerConnection(ICE_CONFIG);
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

		var player = document.getElementById('player')
		if (player.srcObject != event.streams[0]) {
			player.srcObject = event.streams[0];
		}
		//$('#player').srcObject = event.streams[0];

		// const recorder = new MediaRecorder(event.streams[0]);

		// recorder.ondataavailable = event => {
		// 	const blob = event.data;
		// 	// console.log("Blob data", blob);
		// }

		// //Every 1 ms our data available event goes off
		// recorder.start(1);
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

	var toSend = await handshake.genEcdhKeyPair(); //Returns a Uint8Array
	var pub = handshake.keyPair.publicKey;        //Public  key object used by WebCrypto
	var priv = handshake.keyPair.privateKey;       //Private key object used by WebCrypto

}
