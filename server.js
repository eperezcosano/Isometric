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

function addPlayer(id) {
  players[id] = [];
  players[id]['coordX'] = 1;
  players[id]['coordY'] = 1;
}

function mapPlayers() {

  var tmp = [];

  for (var i = 0; i < map.length; i++) {
    tmp[i] = [];
    for (var j = 0; j < map[i].length; j++) {
      tmp[i][j] = map[i][j];
    }
  }

  for (var id in players) {
    tmp[players[id]['coordX']][players[id]['coordY']] = 2;
  }

  return tmp;
}

function onConnection(socket) {

  socket.on('mapRequest', function() {

    if (typeof players[socket.id] == 'undefined') {
      console.log(">> User connected");
      addPlayer(socket.id);
    }
    io.emit('mapResponse', mapPlayers());
  });

  socket.on('moveRequest', function(key) {
    switch(key) {
      case 37:
        if (players[socket.id]['coordX'] == 0) return;
        players[socket.id]['coordX']--;
        break;
      case 39:
        if (players[socket.id]['coordX'] == map.length - 1) return;
        players[socket.id]['coordX']++;
        break;
      case 38:
      if (players[socket.id]['coordY'] == 0) return;
        players[socket.id]['coordY']--;
        break;
      case 40:
        if (players[socket.id]['coordY'] == map[players[socket.id]['coordX']].length - 1) return;
        players[socket.id]['coordY']++;
        break;
    }
    io.emit('mapResponse', mapPlayers());
  });

  socket.on('disconnect', function(){
    console.log('>> User disconnected');
    delete players[socket.id];
    io.emit('mapResponse', mapPlayers());
  });
}
