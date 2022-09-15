const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');
const userList = new Array();
const router = require('./router')
var g_onlines = {} // 所有在线玩家
var g_commands = new Array() // 指令数组
var g_commands_histroy = new Array() // 历史指令，用于断线重连
var g_joinCount = 0 // 已准备的人数
var g_maxJoinCount = 2 // 最大人数
var g_stepTime = 0 // 当前step时间戳
var g_stepInterval = 100 // 每个step的间隔ms

// 游戏状态枚举
var STATUS = {
	WAIT:1,
	START:2
}
var g_gameStatus = STATUS.WAIT;
let timer = 60;
//开发静态资源
app.engine('html',require('express-art-template'))
app.use(express.static('./'));
app.use(router)
io.on('connection', function(socket){
  socket.emit("open", {id:socket.id, stepInterval:g_stepInterval})

	// 获取用户账户
	function getAccount(socketId) {
		for(var key in g_onlines) {
			if(socketId == g_onlines[key].socket.id) {
				return key
			}
		}
	}

	socket.on('join', function(account) {
		// 加入游戏
		if(g_joinCount < g_maxJoinCount) {
			console.log(account, "参加した")
			socket.emit('join', {result:true, message:"マッチング中..."})
			g_onlines[account] = {socket: socket, online: true}
			g_joinCount++
		}
		// 开始游戏
		if(g_joinCount == g_maxJoinCount) {
			g_commands = new Array()
			g_commands_histroy = new Array()
			g_gameStatus = 1
			io.sockets.emit('start', {player:Object.keys(g_onlines)})
		}

		socket.on('param',function(json){
			console.log(json)
		})
	})

	socket.on('timeSync', function(time) {
		socket.emit('timeSync', {client:time, server:Date.now()})
	})
	socket.on('disconnect', function () {
		var account = getAccount(socket.id)
		if(account) {
			g_onlines[account].online = false
			console.log(account, "退室した")
			var isGameOver = true
			for(var key in g_onlines) {
				if(g_onlines[key].online) {
					isGameOver = false
				}
			}
			if(isGameOver) {
				io.sockets.emit('system', "ゲーム終了")
				g_joinCount = 0
				g_stepTime = 0
				g_gameStatus = STATUS.WAIT
				g_onlines = {}
				console.log("ゲーム終了")
			} else {
				io.sockets.emit('system', account + "退室した！")
			}
		}
	})
  socket.emit("open", {userList:userList})
  //有人加入
  socket.on("join", function (id) {
    userList.push(this.id);
  })

  socket.on("message", function (msg) {
    io.emit("message", msg) //将新消息广播出去
  })
  socket.on('disconnect', function(msg){
    io.emit('end',socket.name)
  })
  
});

// step定时器
function stepUpdate() {
	// 过滤同帧多次指令
	var message = {}
	for(var key in g_onlines) {
		message[key] = {step:g_stepTime, id:key}
	}
	for(var i = 0; i < g_commands.length; ++i) {
		var command = g_commands[i]
		command.step = g_stepTime
		message[command.id] = command
	}
	g_commands = new Array()

	// 发送指令
	var commands = new Array()
	for(var key in message) {
		commands.push(message[key])
	}
	g_commands_histroy.push(commands)
	for(var key in g_onlines) {
		g_onlines[key].socket.emit('message', new Array(commands))
	}
}
http.listen(3000, function() {
  console.log('listening on http://localhost:3000/game');
});