var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path')
var io = require('socket.io')(server);
var port = 8082;

var users = new Set();
var map   = new Map();

//On a get request --> send back html
app.get('/', function(req, res){
    res.sendFile(__dirname + "/index.html");
});

//Not scalable but since we only need one external js file it works
app.use('/main.js', express.static(path.join(__dirname, '/main.js')));

io.on('connection', function(socket) {
    console.log("A user connected!");
		
	//Users that have connected after things have been posted should get
	//Everything that has already been posted
	map.forEach( (valueItem, keyItem, map) => {
		console.log("key: some socket...", "value", valueItem);
		socket.emit('response', valueItem);
	});

	socket.on('request', data => {
		console.log('connection request for', data);
		io.emit('request-broadcast', data);
	});

	socket.on('initialize', data => {
		console.log('initializing connection between', data.from, 'and', data.to);
		io.emit('initialize-broadcast', data);
		map
	});

	socket.on('offer', data => {
		io.emit('offer-broadcast', data);
	});

	socket.on('answer', data => {
		io.emit('answer-broadcast', data);
	});

	socket.on('icecandidate', data => {
		io.emit('icecandidate-broadcast', data);
	});

	//On receveing a message
    socket.on('message', (data) => {
		if (users.has(data)) return;
		map.set(socket, data);
		users.add(data);
		var response = `${data}`
		console.log("Sending ...", data);
		io.emit('response', response);
    });

    socket.on('disconnect', () => {
		var userName = map.get(socket);
		io.emit('remove', userName); 
		map.delete(socket);
		users.delete(userName);
        console.log(`User ${userName} disconnected`);
    });
});

server.listen(port, () => console.log(`Running on port ${port}`))
