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
      }
    });
  });

  Client.socket.on("tick", function (data) {
    console.log("server tick");
    console.log(data);
  });

  Client.socket.on("disconnect", function (reason) {
    console.log("the server went away: " + reason);
    document.getElementById("connection_status").innerHTML =
      'lost connection <a href="javascript:window.location.href=window.location.href">reload</a>';
  });

  console.log(
    "setting client tick interval to " + seconds_per_tick + " seconds"
  );
  setInterval(function () {
    clientTick();
  }, seconds_per_tick * 1000);
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./sw.js")
    .then((reg) => {
      // registration worked
      console.log("Registration succeeded. Scope is " + reg.scope);
    })
    .catch((error) => {
      // registration failed
      console.log("Registration failed with " + error);
    });
}

function clientTick() {
  console.log("client tick");

  get("client_id").then(function (val) {
    Client.socket.emit("tick", { client_id: val });
  });
}
