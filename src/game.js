const io = require("socket.io-client");
import { set, get } from "idb-keyval";
const seconds_per_tick = 7;
var Client = {};

console.log("i'm the front-end app!");

document.addEventListener("DOMContentLoaded", function () {
  Client.socket = io.connect();

  Client.socket.on("init", function (data) {
    console.log("init");
    console.log(data);
    document.getElementById("connection_status").innerHTML = "connected";

    get("client_id").then(function (val) {
      if (val === undefined) {
        set("client_id", data.client_id)
          .then(() => console.log("client_id saved locally!"))
          .catch((err) => console.log("client_id failed to save!", err));
      } else {
        console.log("client_id already set to: " + val);
        Client.socket.emit("init", { client_id: val });
      }
    });
  });

  Client.socket.on("tick", function (data) {
    console.log("server tick");
    document.getElementById("server_time").innerHTML = data.tick;
  });

  Client.socket.on("ready_player", function(data) {
    console.log("ready player");
    var play_button = document.getElementById("play_button");
    if ( play_button !== null ){
      play_button.innerHTML = "play!";
    }
  });

  Client.socket.on("disconnect", function (reason) {
    console.log("the server went away: " + reason);
    document.getElementById("connection_status").innerHTML =
      'lost connection <a href="javascript:window.location.href=window.location.href">reload</a>';
    document.getElementById("server_time").innerHTML = "?";
  });

  console.log(
    "setting client tick interval to " + seconds_per_tick + " seconds"
  );
  setInterval(function () {
    clientTick();
  }, seconds_per_tick * 1000);
});

function clientTick() {
  console.log("client tick");

  get("client_id").then(function (val) {
    Client.socket.emit("tick", { client_id: val });
  });
}