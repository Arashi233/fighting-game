const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');
const userList = new Array();
const router = require('./router')

const gravity = 0.3
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
let timeSyncTimerId = null
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
			console.log(g_joinCount)
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
			io.sockets.emit('start', JSON.stringify(g_onlines))
		}
	})
	socket.on('inigameobj',function(json){
		player = json.player;
		enemy = json.enemy;
		player.socketId = g_onlines[0].socket;
		enemy.socketId = g_onlines[1].socket;
		if(json.socketId == player.socketId){
			socket.emit('userCharacter',{me:'player'})
		}else if(json.socketId == enemy.socketId){
			socket.emit('userCharacter',{me:'enemy'})
		}
		stepUpdate()
	})
	socket.on('uphealthdate',function(json){
		
		console.log(player.health)
        if(json.character == 'player'){
			player.health -= 10
		}
        if(json.character == 'enemy'){
			enemy.health -= 20
		}
		socket.emit('uphealthdate', {timer:timer, player:player,enemy:enemy})
    })
	socket.on('disconnect', function () {
		let accountkey = getAccount(socket.id)
		g_gameStatus = false
		if(accountkey) {
			console.log(g_onlines[accountkey].account, "退室した")
			let isGameOver = true
			for(let key in g_onlines) {
			}
			if(isGameOver) {
				io.sockets.emit('system', "ゲーム終了")
				g_stepTime = 0
				console.log("ゲーム終了")
			} else {
				io.sockets.emit('system', g_onlines[accountkey].account + "退室した！")
			}
			g_onlines.splice(accountkey,1);
		}
	})

	socket.on("message", function (msg) {
		if(gameState){
			io.emit("message", msg) 
		}
	})
  socket.on('disconnect', function(msg){
    io.emit('end',socket.name)
  })
  socket.on('timeend',function(){
	
	clearTimeout(timerId);
	clearTimeout(timeSyncTimerId);
})
  socket.on('update', function(json){
	if(json.character == 'player'){
		player.position = json.position
		player.health = json.health
	}else if(json.character == 'enemy'){
		enemy.position = json.position
		enemy.health = json.health
	}
  })
  function stepUpdate() {
	  timeSyncTimerId =  setTimeout(stepUpdate, 100);
	  socket.emit('timeSync', {timer:timer, player:player,enemy:enemy})
  }
function decreaseTimer(){
	if(timer >= 0){
		timerId = setTimeout(decreaseTimer, 1000);
		timer --;
	}
	if(timer < 0){
		socket.emit('timeend')
	  }
  }
});
http.listen(3000, function() {
  console.log('listening on http://localhost:3000/game');
});