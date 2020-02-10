var app = require('express')();
var server    = require('http').Server(app);
var io      = require('socket.io')(server);

var port = 8082;

var users = new Set();

//On a get request --> send back html
app.get('/', function(req, res){
    res.sendFile(__dirname + "/index.html");
});

io.on('connection', function(socket) {
    console.log("A user connected!");

    socket.on('message', (data) => {
        console.log("Message:", data)
        users.add(data);
    });

    socket.on('disconnect', () => {
        console.log("A user disconnected");
    });
});


server.listen(port, () => console.log(`Running on port ${port}`))