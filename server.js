const { v4: uuidv4 } = require("uuid");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const port = 3000;
const seconds_per_tick = 12;

app.get("/", (req, res) => {
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

app.use(express.static("redketchup"));

io.on("connection", (socket) => {
  console.log("a client connected");
  var client_id = uuidv4();
  console.log(client_id);
  socket.emit("init", {
    client_id: client_id,
  });
  socket.on("tick", function (data) {
    console.log("client tick");
    console.log(data);
  });
});

http.listen(port, () => {
  console.log("listening on http://localhost:" + port);
});

function serverTick() {
  console.log("server tick");
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
