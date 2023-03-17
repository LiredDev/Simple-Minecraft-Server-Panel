const { exec, execFile, spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const socket = require("ws");
const readline = require('readline');
var started = false;
var send = true;
var aSent = false;
var MCServer;

function start() {
  fs.writeFile(__dirname + "/../logs/latest.log", "", function (err) {
    if (err) {
      return;
    }
  });
  MCServer = spawn("java", ["-jar","Server/Server.jar","nogui"]);
  started = true;
}

function stop() {
  MCServer.stdin.write("stop\n");
  started = false;
}

function restart() {
  MCServer.stdin.write("restart\n");
}

const HTTPSERVER = http.createServer((req, res) => {
  var url = req.url
  if (url.endsWith(".html")) {
    res.writeHead(200, { "Content-Type": "text/html" });
  } else if (url.endsWith(".css")) {
    res.writeHead(200, { "Content-Type": "text/css" });
  } else if (url.endsWith(".js")) {
    res.writeHead(200, { "Content-Type": "text/javascript" });
  } else if (url.endsWith(".png")) {
    res.writeHead(200, { "Content-Type": "image/png" });
  }

  if (url.endsWith("/")) {
    url += "Home.html";
  } else if (url == "/favicon.ico") {
    url = "/Home.html";
  }
  fs.readFile(__dirname + "/../" + url, (err, data) => {
    if (err) {
      res.write("Page not found!");
      res.end();
    } else {
      res.write(data);
      res.end();
    }
  });
});

const SOCKETSERVER = new socket.Server({ port: 8081 });

var string = "";
var strings = [];
var index = 0;

SOCKETSERVER.on("connection", (socket) => {
  
  socket.on("message", (data) => {
    var sData = data.toString();
    if (started) {
      socket.send("disable");
    }
    if (sData == "start") {
      start();
    } else if (sData == "stop") {
      stop();
    } else if (sData == "restart") {
      //  write your own logic here
    } else if (sData == "logs") {

      if (started == false) return;

      if (send == false) return;
      
      var file = readline.createInterface({
        input: fs.createReadStream(__dirname + "/../" + 'logs/latest.log'),
        output: process.stdout,
        terminal: false
      });

      file.on("line", (line) => {
          for (var i = 0; i < strings.length; i++) {
            if (strings[i] == line) {
              return;
            }
          }
          string += line + "`";
          strings.push(line);
          var ae = string.split("`");
          socket.send(ae[index] + "<br>");
          index++;
      });
    } else if (sData == "players") {
      //  write your own logic here
    } else {
      MCServer.stdin.write(sData + "\n");
    }
  });
  
  
  socket.on("close", () => {
    console.log("Client disconnected");
  });
});

HTTPSERVER.listen(8080, () => {
  console.log("HTTP Server started");
});