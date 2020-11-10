const { v4: uuidv4 } = require("uuid");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const seconds_per_tick = 12;

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

const sessionMiddleware = require('express-session')({
  secret: '21BCADF8-8770-40DB-863A-3A0532B81003'
});

io.use(function(socket, next){
  sessionMiddleware(socket.request, {}, next);
});

app.use(sessionMiddleware);

var games = [];

app.get("/", (req, res) => {
  console.log(req.session);
  res.sendFile(__dirname + "/index.html");
});

app.get("/index.html", (req, res) => {
  res.sendFile(__dirname + "/index.html");
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
      }
    }
    console.log(games);
    res.redirect("/game/"+game.game_id);
  }
});

app.get("/game/:game_id", (req, res) => {
  console.log(req.params);
  res.sendFile(__dirname + "/game.html");
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

  socket.on("tick", function (data) {
    console.log("client tick");
    console.log(data);
    console.log(socket.request.session);
    socket.request.session.client_id = data.client_id;
    socket.request.session.save();
    console.log(socket.request.session);
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
}
