var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path')
var io = require('socket.io')(server);
var port = 8082;

var users = new Set();

//On a get request --> send back html
app.get('/', function(req, res){
    res.sendFile(__dirname + "/index.html");
});

//Not scalable but since we only need one external js file it works
app.use('/main.js', express.static(path.join(__dirname, '/main.js')));

io.on('connection', function(socket) {
    console.log("A user connected!");

    socket.on('message', (data) => {
			users.add(data);
			var response = `Hello ${data}`
			socket.emit('response', response);
    });

    socket.on('disconnect', () => {
        console.log("A user disconnected");
    });
});


server.listen(port, () => console.log(`Running on port ${port}`))
