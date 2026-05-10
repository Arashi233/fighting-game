const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const router = require('./router');

let g_onlines = [];
let g_joinCount = 0;
const g_maxJoinCount = 2;
const g_stepInterval = 100;
let player = null;
let enemy = null;
let gameState = false;
let timer = 0;
let timerId = null;
let timeSyncTimerId = null;

app.engine('html', require('express-art-template'));
app.use(express.static('./'));
app.use(router);

function getAccountIndex(socketId) {
	return g_onlines.findIndex((user) => user.socket === socketId);
}

function buildState() {
	return {
		timer: timer,
		player: player,
		enemy: enemy
	};
}

function applyDamage(target, damage) {
	if (!target) {
		return;
	}
	target.health = Math.max(0, target.health - damage);
}

function broadcastState() {
	if (!gameState || !player || !enemy) {
		return;
	}
	io.sockets.emit('timeSync', buildState());
}

function clearGameTimers() {
	if (timerId) {
		clearTimeout(timerId);
		timerId = null;
	}
	if (timeSyncTimerId) {
		clearInterval(timeSyncTimerId);
		timeSyncTimerId = null;
	}
}

function startStateSync() {
	if (timeSyncTimerId) {
		return;
	}
	timeSyncTimerId = setInterval(broadcastState, g_stepInterval);
}

function decreaseTimer() {
	clearTimeout(timerId);
	if (!gameState) {
		return;
	}
	if (timer >= 0) {
		timerId = setTimeout(decreaseTimer, 1000);
		timer--;
	}
	if (timer < 0) {
		io.sockets.emit('timeend');
		clearGameTimers();
		gameState = false;
	}
}

io.on('connection', function(socket) {
	socket.emit('open', { id: socket.id, stepInterval: g_stepInterval });

	socket.on('join', function(json) {
		if (g_onlines.some((user) => user.socket === socket.id)) {
			return;
		}
		if (g_onlines.length >= g_maxJoinCount) {
			socket.emit('join', { result: false, message: 'room is full' });
			return;
		}

		let userData = { account: json.account, socket: socket.id, online: true };
		g_onlines.push(userData);

		if (g_joinCount < g_maxJoinCount) {
			console.log(json.account, 'joined');
			socket.emit('join', { result: true, message: 'matching...' });
			g_joinCount++;
		}

		if (g_joinCount === g_maxJoinCount) {
			g_joinCount = 0;
			timer = 60;
			gameState = true;
			player = null;
			enemy = null;
			clearGameTimers();
			decreaseTimer();
			io.sockets.emit('start', JSON.stringify(g_onlines));
		}
	});

	socket.on('inigameobj', function(json) {
		if (!player || !enemy) {
			player = json.player;
			enemy = json.enemy;
			if (g_onlines[0]) {
				player.socketId = g_onlines[0].socket;
			}
			if (g_onlines[1]) {
				enemy.socketId = g_onlines[1].socket;
			}
			startStateSync();
		}

		if (player && json.socketId === player.socketId) {
			socket.emit('userCharacter', { me: 'player' });
		} else if (enemy && json.socketId === enemy.socketId) {
			socket.emit('userCharacter', { me: 'enemy' });
		}

		broadcastState();
	});

	socket.on('message', function(msg) {
		if (gameState) {
			io.emit('message', msg);
		}
	});

	socket.on('update', function(json) {
		if (!player || !enemy) {
			return;
		}
		if (json.character === 'player') {
			player.position = json.position;
		} else if (json.character === 'enemy') {
			enemy.position = json.position;
		}
	});

	socket.on('hit', function(json) {
		if (!player || !enemy) {
			return;
		}
		if (json.target === 'player') {
			applyDamage(player, json.damage);
		} else if (json.target === 'enemy') {
			applyDamage(enemy, json.damage);
		}
		broadcastState();
		if (player.health <= 0 || enemy.health <= 0) {
			gameState = false;
			clearGameTimers();
			io.sockets.emit('timeend');
		}
	});

	socket.on('attack', function(json) {
		if (!gameState) {
			return;
		}
		io.emit('attack', json);
	});

	socket.on('timeend', function() {
		gameState = false;
		clearGameTimers();
	});

	socket.on('disconnect', function() {
		const accountIndex = getAccountIndex(socket.id);
		if (accountIndex !== -1) {
			const account = g_onlines[accountIndex].account;
			g_onlines.splice(accountIndex, 1);
			io.sockets.emit('system', account + ' disconnected');
		}
		gameState = false;
		player = null;
		enemy = null;
		clearGameTimers();
		io.emit('end', socket.name);
	});
});

http.listen(3000, function() {
	console.log('listening on http://localhost:3000/game');
});
