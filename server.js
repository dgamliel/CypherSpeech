var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path')
var io = require('socket.io')(server);
var port = process.env.PORT || 8082;

var users = new Set();
var map   = new Map();


//Helper function to get key by value
//Found at https://stackoverflow.com/questions/47135661/how-to-get-a-key-in-a-javascript-map-by-its-value
function getByValue(m, searchValue) {
	for (let [key, value] of m.entries()) {
		if (value === searchValue)
			return key;
	}
}

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
		getByValue(map, data.remote).emit('request', data);
	});

	socket.on('initialize', data => {
		console.log('initializing connection between', data.peer, 'and', data.remote);
		getByValue(map, data.peer).emit('initialize', data);
	});

	socket.on('offer', data => {
		getByValue(map, data.remote).emit('offer', data);
	});

	socket.on('answer', data => {
		getByValue(map, data.peer).emit('answer', data);
	});

	socket.on('icecandidate', data => {
		getByValue(map, data.remote).emit('icecandidate', data);
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

		//On receving a disconnect
    socket.on('disconnect', () => {
		var userName = map.get(socket);
		io.emit('remove', userName); 
		map.delete(socket);
		users.delete(userName);
        console.log(`User ${userName} disconnected`);
    });

		/* Cryptographic Key exchange socket events */
		socket.on('pubKey', data => {
			console.log(data);
		});
});

server.listen(port, () => console.log(`Running on port ${port}`))
