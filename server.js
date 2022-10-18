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
let player=null;
let enemy=null;
let gameState = false;
const STATUS = {
	WAIT:1,
	START:2
}
let g_gameStatus = STATUS.WAIT;
let timer = 0;
let timerId = null
app.engine('html',require('express-art-template'))
app.use(express.static('./'));
app.use(router)
io.on('connection', function(socket){
  socket.emit("open", {id:socket.id, stepInterval:g_stepInterval})

	//ユーザーID
	function getAccount(socketId) {
		for(let key in g_onlines) {
			if(socketId == g_onlines[key].socket) {
				return key
			}
		}
	}

	socket.on('join', function(json) {
		// ゲーム参加
		let userData = {account:json['account'],socket: socket.id, online: true};
		g_onlines.push(userData)
		if(g_joinCount < g_maxJoinCount) {
			console.log(json['account'], "参加した")
			socket.emit('join', {result:true, message:"マッチング中..."})
			g_joinCount++
		}
		// ゲーム開始
		if(g_joinCount == g_maxJoinCount) {
			g_commands = new Array()
			g_commands_histroy = new Array()
			g_gameStatus = 1
			g_joinCount = 0
			timer = 60
			gameState = true
			decreaseTimer()
			stepUpdate()
			console.log(JSON.stringify(g_onlines))
			io.sockets.emit('start', JSON.stringify(g_onlines))
		}
	})
	socket.on('inigameobj',function(json){
		player = json.player;
		enemy = json.enemy;
		player.socketId = g_onlines[0].socket;
		enemy.socketId = g_onlines[1].socket;
	})
	socket.on('disconnect', function () {
		let accountkey = getAccount(socket.id)
		if(accountkey) {
			console.log(g_onlines[accountkey].account, "退室した")
			let isGameOver = true
			for(let key in g_onlines) {
			}
			if(isGameOver) {
				io.sockets.emit('system', "ゲーム終了")
				g_joinCount = 0
				g_stepTime = 0
				g_gameStatus = STATUS.WAIT
				console.log("ゲーム終了")
			} else {
				io.sockets.emit('system', g_onlines[accountkey].account + "退室した！")
			}
		}
		g_onlines.splice(accountkey,1);
	})
  socket.on("join", function (id) {
    userList.push(this.id);
  })

	socket.on("message", function (msg) {
		if(gameState){
			if(msg.type === 'keydown'){
                switch(msg.direction){
                    case 'd':
                        inputDirection = 'd'
                        keys.d.pressed = true;
                        break;
                    case 'a' :
                        inputDirection = 'a'
                        keys.a.pressed = true;
                        break;
                    case 'w' :
                        inputDirection = 'w'
                        break;
                }
            }else if(msg.type === 'keyup'){
                switch(msg.direction){
                    case 'd':
                        keys.d.pressed = false;
                        break;
                    case 'a' :
                        keys.a.pressed = false;
                        break;
                }
                inputDirection = null;
            }
			io.emit("message", msg) 
		}
	})
  socket.on('disconnect', function(msg){
    io.emit('end',socket.name)
  })
  if(gameState){
	  while(true){
		move(player);
		move(enemy);
	  }
  }
  function move(obj){
        this.velocity.x = 0;
        if(this.keys.a.pressed){
            this.velocity.x = -5;
        }else if(this.keys.d.pressed){
            this.velocity.x = 5;
        }
        if(this.position.y + this.height >= ch-96 && this.lastKey === 'w'){
            this.velocity.y = -11;
        }
  }
  function stepUpdate() {
	  
	  timeSyncTimerId =  setTimeout(stepUpdate, 200);
	  socket.emit('timeSync', {timer:timer, player:player,enemy:enemy})
	  // let message = {}
	  // for(let key in g_onlines) {
	  // 	message[key] = {step:g_stepTime, id:key}
	  // }
	  // for(let i = 0; i < g_commands.length; ++i) {
	  // 	let command = g_commands[i]
	  // 	command.step = g_stepTime
	  // 	message[command.id] = command
	  // }
	  // g_commands = new Array()
  
	  // // コマンド送る
	  // let commands = new Array()
	  // for(let key in message) {
	  // 	commands.push(message[key])
	  // }
	  // g_commands_histroy.push(commands)
	  // for(let key in g_onlines) {
	  // 	g_onlines[key].socket.emit('message', new Array(commands))
	  // }
  }
  
});

function decreaseTimer(){
    if(timer >= 0){
        timerId = setTimeout(decreaseTimer, 1000);
        timer --;
    }
    if(timer < 0){
        clearTimeout(timerId);
		clearTimeout(timeSyncTimerId);
    }
}
http.listen(3000, function() {
  console.log('listening on http://localhost:3000/game');
});