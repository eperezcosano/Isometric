const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));
http.listen(port, () => console.log('listening on port ' + port));
io.on('connection', onConnection);

var map = [
  [1,0,0,0,1,1,0,0],
  [1,0,0,1,0,0,1,1],
  [0,0,1,1,1,0,0,0],
  [1,1,1,1,1,0,0,1],
  [1,0,0,1,0,0,1,1],
  [0,0,1,1,1,0,0,0],
  [1,1,1,1,1,0,0,1]
];
var numplayers = 0;
var players = [];

function mapPlayers() {

  var tmp = [];

  for (var i = 0; i < map.length; i++) {
    tmp[i] = [];
    for (var j = 0; j < map[i].length; j++) {
      tmp[i][j] = map[i][j];
    }
  }

  for (var id in players) {
    tmp[players[id]['x']][players[id]['y']] = players[id]['username'];
  }

  return tmp;
}

function onConnection(socket) {

  var addedUser = false;

  socket.on('add user', (username) => {
    if (addedUser) return;
    socket.username = username;
    socket.x = 0;
    socket.y = 0;
    ++numplayers;
    players[socket.id] = [];
    players[socket.id]['username'] = socket.username;
    players[socket.id]['x'] = socket.x;
    players[socket.id]['y'] = socket.y;
    addedUser = true;
    socket.emit('login', {
      numplayers: numplayers
    });
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numplayers: numplayers
    });
    io.emit('mapResponse', mapPlayers());
    console.log(">> " + socket.username + " connected");
    console.log(">> " + numplayers + " players online");
  });

  socket.on('new message', (data) => {
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
    console.log(">> " + socket.username + ": " + data);
  });

  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
    console.log(">> " + socket.username + " is typing...");
  });

  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
    console.log(">> " + socket.username + " stopped typing");
  });

  socket.on('disconnect', () => {
    if (addedUser) {
      --numplayers;
      delete players[socket.id];
      socket.broadcast.emit('user left', {
        username: socket.username,
        numplayers: numplayers
      });
      io.emit('mapResponse', mapPlayers());
      console.log(">> " + socket.username + " disconnected");
      console.log(">> " + numplayers + " players left");
    }
  });

  socket.on('moveRequest', function(key) {
    switch(key) {
      case 37:
        if (players[socket.id]['x'] == 0) return;
        players[socket.id]['x']--;
        break;
      case 39:
        if (players[socket.id]['x'] == map.length - 1) return;
        players[socket.id]['x']++;
        break;
      case 38:
      if (players[socket.id]['y'] == 0) return;
        players[socket.id]['y']--;
        break;
      case 40:
        if (players[socket.id]['y'] == map[players[socket.id]['x']].length - 1) return;
        players[socket.id]['y']++;
        break;
    }
    io.emit('mapResponse', mapPlayers());
  });
}
