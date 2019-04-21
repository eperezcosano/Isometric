'use strict';
(function(isometric) {

  var socket = io();
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var tileGraphics = [];

  // Set as your tile pixel sizes, alter if you are using larger tiles.
  var tileH = 25;
  var tileW = 52;

  // mapX and mapY are offsets to make sure we can position the map as we want.
  var mapX = 76*6;
  var mapY = 52;

  function loadImg() {
    var tileGraphicsToLoad = [
      "/images/water.png",
      "/images/land.png",
      "/images/ralph.png"];
    var tileGraphicsLoaded = 0;

    for (var i = 0; i < tileGraphicsToLoad.length; i++) {
      tileGraphics[i] = new Image();
      tileGraphics[i].src = tileGraphicsToLoad[i];
      tileGraphics[i].onload = function() {
        tileGraphicsLoaded++;
        if (tileGraphicsLoaded === tileGraphicsToLoad.length) {
            socket.emit('mapRequest');
            console.log('>> Map Request');
        }
      }
    }
  }

  function drawMap(map) {

    var drawTile;

    // Clear the  canvas
    ctx.clearRect(0, 0, 800, 500);

    for (var i = 0; i < map.length; i++) {
      for (var j = 0; j < map[i].length; j++) {
        drawTile = map[i][j];
        if (drawTile == 2) {
          ctx.drawImage(tileGraphics[drawTile], (i - j) * tileH + mapX, (i + j) * tileH / 4 + mapY - drawTile);
        } else {
          ctx.drawImage(tileGraphics[drawTile], (i - j) * tileH + mapX, (i + j) * tileH / 2 + mapY);
        }
      }
    }
  }

  function init() {
    // Remove Event Listener and load images.
    isometric.removeEventListener('load', init);
    loadImg();
    isometric.addEventListener("keyup", function(e) {
      switch(e.keyCode) {
        case 37:
          socket.emit('playerXDownRequest');
          //playerX--;
        break;
        case 39:
          socket.emit('playerXUpRequest');
          //playerX++;
        break;
        case 38:
          socket.emit('playerYDownRequest');
          //playerY--;
        break;
        case 40:
          socket.emit('playerYUpRequest');
          //playerY++;
        break;
      }
    });
  };

  // Add Event Listener to dectect when page has fully loaded.
  isometric.addEventListener('load', init, false);

  socket.on('coordsResponse', function(data) {
    console.log(">> Coords response: ");
    console.log(data);
    playerX = data[0];
    playerY = data[1];
  });

  socket.on('mapResponse', function(map) {
    console.log(">> Map response: ");
    console.log(map);
    drawMap(map);
  });


})(this);
