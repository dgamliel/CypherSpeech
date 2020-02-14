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

		//On receveing a message
    socket.on('message', (data) => {
			map.set(socket, data);
			var response = `${data}`
			console.log("Sending ...", data);
			io.emit('response', response);
    });

    socket.on('disconnect', () => {
				var userName = map.get(socket);
				io.emit('remove', userName); 
				map.delete(socket);
        console.log(`User ${userName} disconnected`);
    });
});

server.listen(port, () => console.log(`Running on port ${port}`))
