const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
//开发静态资源
app.use(express.static('./'));
io.on('connection', function(socket){
  socket.on("join", function (name) {
    console.log(io)
  })

  socket.on("message", function (msg) {
    io.emit("message", msg) //将新消息广播出去
  })
  socket.on('disconnect', function(msg){
    io.emit('end',socket.name)
  })
  
});

http.listen(3000, function() {
  console.log('listening on http://localhost:3000');
});