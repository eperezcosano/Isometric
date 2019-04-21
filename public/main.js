'use strict';
(function(isometric) {

  //Chat
  var TYPING_TIMER_LENGTH = 2000;
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  var usernameInput   = document.getElementsByClassName("usernameInput")[0];
  var messages        = document.getElementsByClassName("messages")[0];
  var inputMessage    = document.getElementsByClassName("inputMessage")[0];
  var loginPage       = document.getElementsByClassName("login page")[0];
  var chatPage        = document.getElementsByClassName("chat page")[0];
  var username;
  var connected       = false;
  var typing          = false;
  var lastTypingTime;

  //Socket and canvas
  var socket          = io();
  var canvas          = document.getElementById('canvas');
  var ctx             = canvas.getContext('2d');
  ctx.font            = "30px Arial";

  const cleanInput = (input) => {
    var div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  const getTypingMessages = (data) => {
    var typingMessages = Array.from(document.getElementsByClassName("typing"));
    var result = typingMessages.filter(typingMessage => typingMessage.dataset.username === data.username);
    return result;
  }

  const getUsernameColor = (username) => {
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  const addMessageElement = (el, options) => {
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }
    if (options.fade) {
      el.style.display = "-webkit-box";
    }
    if (options.prepend) {
      messages.prepend(el);
    } else {
      messages.append(el);
    }
    messages.scrollTop = messages.scrollHeight;
  }

  const addChatMessage = (data, options = {}) => {

    var typingMessages = getTypingMessages(data);

    if (typingMessages.length !== 0) {
      options.fade = false;
      typingMessages.forEach((e) => e.remove());
    }

    var usernameDiv = document.createElement('span');
    usernameDiv.className = "username";
    usernameDiv.textContent = data.username;
    usernameDiv.style.color = getUsernameColor(data.username);

    var messageBodyDiv = document.createElement('span');
    messageBodyDiv.className = "messageBody";
    messageBodyDiv.textContent = data.message;

    var messageDiv = document.createElement('li');
    messageDiv.dataset.username = data.username;
    if (data.typing) {
      messageDiv.className = "typing";
    }
    messageDiv.append(usernameDiv, messageBodyDiv);

    addMessageElement(messageDiv, options);
  }

  const setUsername = () => {
    username = cleanInput(usernameInput.value.trim());
    if (username) {
      loginPage.style.display = "none";
      chatPage.style.display = "-webkit-box";
      socket.emit('add user', username);
    }
  }

  const sendMessage = () => {
    var message = inputMessage.value;
    message = cleanInput(message);
    if (message && connected) {
      inputMessage.value = "";
      addChatMessage({
        username: username,
        message: message
      });
      socket.emit('new message', message);
    }
  }

  const log = (message, options) => {
    var el = document.createElement('li');
    el.className = "log";
    el.textContent = message;
    addMessageElement(el, options);
  }

  const addChatTyping = (data) => {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  const removeChatTyping = (data) => {
    getTypingMessages(data).forEach((e) => e.remove());
  }

  const updateTyping = () => {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(() => {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  usernameInput.addEventListener('keydown', enterListener);
  inputMessage.addEventListener('keydown', enterListener);

  function enterListener(e) {
    if (e.key === "Enter") {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    }
  }

  inputMessage.oninput = () => {
    updateTyping();
  };

  const addParticipantsMessage = (data) => {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  }

  socket.on('login', (data) => {
    connected = true;
    var message = "Welcome " + username;
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  socket.on('new message', (data) => {
    addChatMessage(data);
  });

  socket.on('user joined', (data) => {
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  socket.on('user left', (data) => {
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  socket.on('typing', (data) => {
    addChatTyping(data);
  });

  socket.on('stop typing', (data) => {
    removeChatTyping(data);
  });

  socket.on('disconnect', () => {
    log('you have been disconnected');
  });

  socket.on('reconnect', () => {
    log('you have been reconnected');
    if (username) {
      socket.emit('add user', username);
    }
  });

  socket.on('reconnect_error', () => {
    log('attempt to reconnect has failed');
  });

  var tileGraphics = [];

  //Tile pixel sizes
  var tileH = 25;
  var tileW = 52;

  // mapX and mapY are offsets to make sure we can position the map as we want.
  var mapX = 200;
  var mapY = 50;

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
        if (map[i][j] != 0 && map[i][j] != 1) {
          ctx.fillText(map[i][j], (i - j) * tileH + mapX, (i + j) * tileH / 2 + mapY - tileH);
          ctx.drawImage(tileGraphics[2], (i - j) * tileH + mapX, (i + j) * tileH / 2 + mapY - tileH);
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
