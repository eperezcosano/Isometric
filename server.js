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

var players = [];

function onConnection(socket) {

  socket.on('coordsRequest', function() {
    if (typeof players[socket.id] == 'undefined') {
      players[socket.id] = [];
      players[socket.id]['coordX'] = 1;
      players[socket.id]['coordY'] = 1;
    }
    socket.emit('coordsResponse', [players[socket.id]['coordX'], players[socket.id]['coordY']]);
  });

  socket.on('mapRequest', function() {
    if (typeof players[socket.id] == 'undefined') {
      players[socket.id] = [];
    }
    tmp_map = map;
    tmp_map[1][2] = 2;
    socket.emit('mapResponse', tmp_map);
  });

  socket.on('playerXDownRequest', function() {
    //players[socket.id]['coordX']--;
    socket.emit('mapResponse', map);
  });

  socket.on('disconnect', function(){
    console.log('>> User disconnected');
    players[socket.id] = [];
  });
}
