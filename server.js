const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));
io.on('connection', onConnection);
http.listen(port, () => console.log('listening on port ' + port));

var map = [
  [1,0,0,0],
  [1,0,0,1],
  [0,0,1,1],
  [1,1,1,1]
];

function onConnection(socket) {

  socket.on('maprequest', function(data) {
    
  });

  socket.on('disconnecting', function() {
    room = Object.keys(io.sockets.adapter.sids[socket.id])[1];
    io.to(room).emit('playerDisconnect', room);
    console.log('>> User leaving '+room);
  });

  socket.on('disconnect', function(){
    console.log('>> User disconnected');
  });
}
