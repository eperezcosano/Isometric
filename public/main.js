'use strict';
(function(isometric) {

  var socket = io();
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var tileGraphics = [];

  //Tile pixel sizes
  var tileH = 25;
  var tileW = 52;

  // mapX and mapY are offsets to make sure we can position the map as we want.
  var mapX = 80;
  var mapY = 10;

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
    // Clear the  canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < map.length; i++) {
      for (var j = 0; j < map[i].length; j++) {
        if (map[i][j] == 2) {
          ctx.drawImage(tileGraphics[map[i][j]], (i - j) * tileH + mapX, (i + j) * tileH / 2 + mapY - tileH);
        } else {
          ctx.drawImage(tileGraphics[map[i][j]], (i - j) * tileH + mapX, (i + j) * tileH / 2 + mapY);
        }
      }
    }
  }

  function init() {
    // Remove Event Listener and load images.
    isometric.removeEventListener('load', init);
    loadImg();
    isometric.addEventListener("keyup", function(e) {
      socket.emit('moveRequest', e.keyCode);
    });
  };

  // Add Event Listener to dectect when page has fully loaded.
  isometric.addEventListener('load', init, false);

  socket.on('mapResponse', function(map) {
    console.log(">> Map response: ");
    console.log(map);
    drawMap(map);
  });

})(this);
