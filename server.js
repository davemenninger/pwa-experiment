const { v4: uuidv4 } = require("uuid");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const seconds_per_tick = 12;
const QRCode = require('qrcode');


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

const sessionMiddleware = require('express-session')({
  secret: '21BCADF8-8770-40DB-863A-3A0532B81003',
  resave: true,
  saveUninitialized: true,
});

io.use(function(socket, next){
  sessionMiddleware(socket.request, {}, next);
});

app.use(sessionMiddleware);

var games = [];

app.set('view engine', 'pug')

app.get("/", (req, res) => {
  console.log(req.session);
  res.render('index', {});
});

app.get("/index.html", (req, res) => {
  res.render('index', {});
});

app.get("/app.css", (req, res) => {
  res.sendFile(__dirname + "/app.css");
});

app.get("/manifest.json", (req, res) => {
  res.sendFile(__dirname + "/manifest.json");
});

app.get("/main.js", (req, res) => {
  res.sendFile(__dirname + "/dist/main.js");
});

app.get("/sw.js", (req, res) => {
  res.sendFile(__dirname + "/dist/sw.js");
});

app.get("/game.js", (req, res) => {
  res.sendFile(__dirname + "/dist/game.js");
});

app.get("/play", (req, res) => {
  var client_id = req.session.client_id;
  if(client_id === undefined){
    res.redirect("/");
  }
  else{
    game = games.find(g => g.players.includes(client_id));
    if(game === undefined){
      game = games.find(g => g.players.length == 1);
      if(game === undefined){
        game = createGame(client_id);
      }
      else{
        game.players.push(client_id);
        game.ohs = client_id;
      }
    }
    console.log(games);
    res.redirect("/game/"+game.game_id);
  }
});

app.get("/game/:game_id", (req, res) => {
  console.log(req.params);
  var game_id = req.params.game_id;
  game = games.find(g => g.game_id == game_id);
  if(game === undefined){
    console.log("no such game: "+game_id);
    res.redirect("/");
  }
  else{
    res.render('game', {game: game});
  }
});

app.get("/game/qr/:game_id", (req, res) => {
  console.log("IMAGE REQUEST");
  console.log(req.params);
  var game_id = req.params.game_id;
  const proxyHost = req.headers["x-forwarded-host"];
  const host = proxyHost ? proxyHost : req.headers.host;

  res.setHeader('Content-Type', 'image/png');

  QRCode.toFileStream(res, host+"/game/"+game_id);
});

app.use(express.static("redketchup"));

io.on("connection", (socket) => {
  console.log("a client connected");
  var client_id = uuidv4();

  socket.request.session.save();

  console.log(socket.request.session);

  socket.emit("init", {
    client_id: client_id,
  });

  socket.on("init", function (data) {
    console.log("client init");
    console.log(data);
    console.log(socket.request.session);
    socket.request.session.client_id = data.client_id;
    socket.request.session.save();
    console.log(socket.request.session);
    socket.emit("ready_player", data);
  });

  socket.on("tick", function (data) {
    console.log("client tick");
    var client_id = data.client_id;
    socket.request.session.client_id = client_id;
    socket.request.session.save();
    game = games.find(g => g.players.includes(client_id));
    if(game !== undefined) {
      socket.emit("game_state", { game_state: game.game_state });
    }
  });

  socket.on("move", function(data) {
    console.log("client move");
    console.log(data);
    var client_id = socket.request.session.client_id;
    game = games.find(g => g.players.includes(client_id));
    if(game !== undefined) {
      game.handleMove(client_id, data.cell);
      socket.emit("game_state", { game_state: game.game_state });
    }
  });

});

http.listen(port, () => {
  console.log("listening on http://localhost:" + port);
});

function serverTick() {
  console.log("server tick");
  console.log(games);
  second = Math.floor(Date.now() / 1000);
  tick = Math.floor(second / seconds_per_tick);
  if (second % seconds_per_tick == 0) {
    console.log(tick);
    io.sockets.emit("tick", {
      tick: tick,
    });
  }
}

setInterval(function () {
  serverTick();
}, 1000);

function createGame(client_id) {
  var game_id = uuidv4();
  game = new Game(game_id, client_id);
  games.push(game);
  return game;
}

function Game(game_id, client_id) {
  this.game_id = game_id;
  this.players = [client_id];
  this.exes = client_id;
  this.ohs = null;
  this.game_state =
    ['', '', '',
      '', '', '',
      '', '', ''];

  this.handleMove = function(client_id, cell){
    if(this.game_state[cell] == ''){
      if(client_id == this.exes){
        if(this.current_turn() == "X" ){
          this.game_state[cell] = "X";
        }
      }
      else if (client_id == this.ohs){
        if(this.current_turn() == "O" ){
          this.game_state[cell] = "O";
        }
      }
    }
  };

  this.current_turn = function(){
    x_count = this.game_state.filter(s => s == "X").length;
    console.log("CURRENT TURN");
    console.log(x_count);
    o_count = this.game_state.filter(s => s == "O").length;
    console.log(o_count);
    if( x_count > o_count ){
      return "O";
    }
    else {
      return "X";
    }
  };
}
