const io = require("socket.io-client");

console.log("i'm the app!");

document.addEventListener("DOMContentLoaded", function () {
  var Client = {};
  Client.socket = io.connect();

  Client.socket.on("init", function (data) {
    console.log("init");
    console.log(data);
    document.getElementById("connection_status").innerHTML = "connected";
  });

  Client.socket.on("tick", function (data) {
    console.log("tick");
    console.log(data);
  });

  Client.socket.on("disconnect", function (reason) {
    console.log("the server went away: " + reason);
    document.getElementById("connection_status").innerHTML =
      'lost connection <a href="javascript:window.location.href=window.location.href">reload</a>';
  });
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
