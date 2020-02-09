var app = require('express')();
var http    = require('http').createServer(app);
var io      = require('socket.io')(http);

var port = 8082;

//On a get request --> send back html
app.get('/', function(req, res){
    res.sendFile(__dirname + "/index.html");
    console.log("served page!");
});

io.on('connection', function(socket) {
    console.log("A user connected!");
});

io.on('disconnect', () => {
    console.log("User disconnected");
})

http.listen(port, () => console.log(`Running on port ${port}`))