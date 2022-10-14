const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');
const userList = new Array();
const router = require('./router')
let g_onlines = [] // オンラインユーザー
let g_commands = new Array() // コマンド
let g_joinCount = 0 // 入った人数
let g_maxJoinCount = 2 // 最大人数
let g_stepTime = 0 // step
let g_stepInterval = 100 // step　ms

const STATUS = {
	WAIT:1,
	START:2
}
let g_gameStatus = STATUS.WAIT;
let timer = 60;
app.engine('html',require('express-art-template'))
app.use(express.static('./'));
app.use(router)
io.on('connection', function(socket){
  socket.emit("open", {id:socket.id, stepInterval:g_stepInterval})

	//ユーザーID
	function getAccount(socketId) {
		for(let key in g_onlines) {
			if(socketId == g_onlines[key].socket.id) {
				return key
			}
		}
	}

	socket.on('join', function(json) {
		// ゲーム参加
		if(g_joinCount < g_maxJoinCount) {
			console.log(json['account'], "参加した")
			socket.emit('join', {result:true, message:"マッチング中..."})
			let userData = {account:json['account'],socket: socket.id, online: true};
			g_onlines.push(userData)
			g_joinCount++
		}
		// ゲーム開始
		if(g_joinCount == g_maxJoinCount) {
			g_commands = new Array()
			g_commands_histroy = new Array()
			g_gameStatus = 1
			g_joinCount = 0
			io.sockets.emit('start', JSON.stringify(g_onlines))
		}
	})
	socket.on('timeSync', function(time) {
		socket.emit('timeSync', {client:time, server:Date.now()})
	})
	socket.on('disconnect', function () {
		let account = getAccount(socket.id)
		if(account) {
			g_onlines[account].online = false
			console.log(account, "退室した")
			let isGameOver = true
			for(let key in g_onlines) {
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
  socket.on("join", function (id) {
    userList.push(this.id);
  })

  socket.on("message", function (msg) {
    io.emit("message", msg) 
  })
  socket.on('disconnect', function(msg){
    io.emit('end',socket.name)
  })
  
});

function stepUpdate() {
	let message = {}
	for(let key in g_onlines) {
		message[key] = {step:g_stepTime, id:key}
	}
	for(let i = 0; i < g_commands.length; ++i) {
		let command = g_commands[i]
		command.step = g_stepTime
		message[command.id] = command
	}
	g_commands = new Array()

	// コマンド送る
	let commands = new Array()
	for(let key in message) {
		commands.push(message[key])
	}
	g_commands_histroy.push(commands)
	for(let key in g_onlines) {
		g_onlines[key].socket.emit('message', new Array(commands))
	}
}
http.listen(3000, function() {
  console.log('listening on http://localhost:3000/game');
});