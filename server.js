const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const port = 3000;

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
  res.sendFile(__dirname + "/sw.js");
});

app.use(express.static("redketchup"));

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.emit("init", {
    foo: "bar",
  });
});

http.listen(port, () => {
  console.log("listening on *:" + port);
});

function serverTick() {
  second = Math.floor(Date.now() / 1000);
  seconds_per_tick = 3;
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
}, 3000);
