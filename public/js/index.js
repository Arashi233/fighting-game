/** @type {HTMLCanvasElement} */

const STATUS = {
	WAIT: 1,
	START: 2
};

const canvas = document.querySelector('#cv1');
const c = canvas.getContext('2d');

const cw = canvas.width = 1024;
const ch = canvas.height = 576;
let animateId = 0;
let stepInterval = 0;
let stepTime = 0;
let gameStatus = 2;
let gameObjects = {};
let isConnected = false;
let currentAccount = null;
let currentId = null;
let isFastRunning = false;
let gameState = true;
let inputDirection = null;
const gravity = 0.3;
let player = null;
let enemy = null;
let me = null;
let remotePlayer = null;
let serverData = null;
let socket = null;
let jsonData = null;

const background = new Sprite({
	position: {
		x: 0,
		y: 0
	},
	imageSrc: './img/background.png'
});

const shop = new Sprite({
	position: {
		x: 760,
		y: 224
	},
	imageSrc: './img/shop.png',
	scale: 2,
	framesMax: 6
});

const keys = {
	a: {
		pressed: false
	},
	d: {
		pressed: false
	}
};

function createControlState() {
	return {
		a: false,
		d: false
	};
}

function clonePosition(position) {
	return {
		x: position.x,
		y: position.y
	};
}

function getCharacterNameByObject(character) {
	if (character === player) {
		return 'player';
	}
	return 'enemy';
}

function getRemoteState() {
	if (!remotePlayer || !serverData) {
		return null;
	}
	return remotePlayer === player ? serverData.player : serverData.enemy;
}

function setMoveState(character, direction, isPressed) {
	if (!character || !character.controlState) {
		return;
	}
	if (direction === 'a') {
		character.controlState.a = isPressed;
	}
	if (direction === 'd') {
		character.controlState.d = isPressed;
	}
}

function applyCommandToCharacter(character, command) {
	if (!character) {
		return;
	}

	if (command.type === 'keydown') {
		if (command.direction === 'a' || command.direction === 'd') {
			setMoveState(character, command.direction, true);
		}
		if (command.direction === 'w') {
			character.lastKey = 'w';
			character.jumpQueued = true;
		}
		if (command.direction === ' ') {
			character.lastKey = ' ';
			character.attack();
		}
	}

	if (command.type === 'keyup') {
		if (command.direction === 'a' || command.direction === 'd') {
			setMoveState(character, command.direction, false);
		}
		if (command.direction === 'w' || command.direction === ' ') {
			character.lastKey = null;
		}
	}

	character.move();
	character.updateSprite();
}

function applyLocalCommand(direction, type) {
	if (!me) {
		return;
	}
	applyCommandToCharacter(me, {
		direction: direction,
		type: type,
		socketId: currentId
	});
}

function syncRemoteState() {
	const remoteState = getRemoteState();
	if (!remotePlayer || !remoteState) {
		return;
	}

	remotePlayer.health = remoteState.health;
	const dx = remoteState.position.x - remotePlayer.position.x;
	const dy = remoteState.position.y - remotePlayer.position.y;
	if (Math.abs(dx) > 120) {
		remotePlayer.position.x = remoteState.position.x;
	} else if (Math.abs(dx) > 2) {
		remotePlayer.position.x += dx * 0.35;
	}
	if (Math.abs(dy) > 120) {
		remotePlayer.position.y = remoteState.position.y;
	} else if (Math.abs(dy) > 2) {
		remotePlayer.position.y += dy * 0.35;
	}
}

function emitMyState() {
	if (!me) {
		return;
	}
	socket.emit('update', {
		position: clonePosition(me.position),
		character: getCharacterNameByObject(me)
	});
}

function emitHit(target, damage) {
	socket.emit('hit', {
		target: target,
		damage: damage
	});
}

function emitAttack() {
	socket.emit('attack', {
		socketId: currentId
	});
}

let newGame = function(id) {
	player = new Fighter({
		position: {
			x: 250,
			y: 200
		},
		velocity: {
			x: 0,
			y: 1
		},
		offset: {
			x: 170,
			y: 95
		},
		imageSrc: './img/samuraiMack/Idle.png',
		imageSrc2: './img/samuraiMack2/Idle.png',
		scale: 2,
		framesMax: 8,
		attacktime: 0,
		isAttacking: false,
		toward: 0,
		sprites: {
			idle: {
				imageSrc: './img/samuraiMack/Idle.png',
				framesMax: 8
			},
			run: {
				imageSrc: './img/samuraiMack/Run.png',
				framesMax: 8
			},
			jump: {
				imageSrc: './img/samuraiMack/Jump.png',
				framesMax: 2
			},
			fall: {
				imageSrc: './img/samuraiMack/Fall.png',
				framesMax: 2
			},
			attack1: {
				imageSrc: './img/samuraiMack/Attack1.png',
				framesMax: 6
			}
		},
		sprites2: {
			idle: {
				imageSrc: './img/samuraiMack2/Idle.png',
				framesMax: 8
			},
			run: {
				imageSrc: './img/samuraiMack2/Run.png',
				framesMax: 8
			},
			jump: {
				imageSrc: './img/samuraiMack2/Jump.png',
				framesMax: 2
			},
			fall: {
				imageSrc: './img/samuraiMack2/Fall.png',
				framesMax: 2
			},
			attack1: {
				imageSrc: './img/samuraiMack2/Attack1.png',
				framesMax: 6
			}
		},
		attackBox: {
			offset: {
				x: 35,
				y: 50
			},
			width: 150,
			height: 50
		}
	});

	enemy = new Fighter({
		position: {
			x: 800,
			y: 100
		},
		velocity: {
			x: 0,
			y: 1
		},
		offset: {
			x: 170,
			y: 105
		},
		color: 'blue',
		imageSrc: './img/kenji/Idle.png',
		imageSrc2: './img/kenji2/Idle.png',
		scale: 2,
		framesMax: 4,
		attacktime: 0,
		isAttacking: false,
		toward: 1,
		sprites: {
			idle: {
				imageSrc: './img/kenji/Idle.png',
				framesMax: 4
			},
			run: {
				imageSrc: './img/kenji/Run.png',
				framesMax: 8
			},
			jump: {
				imageSrc: './img/kenji/Jump.png',
				framesMax: 2
			},
			fall: {
				imageSrc: './img/kenji/Fall.png',
				framesMax: 2
			},
			attack1: {
				imageSrc: './img/kenji/Attack1.png',
				framesMax: 4
			}
		},
		sprites2: {
			idle: {
				imageSrc: './img/kenji2/Idle.png',
				framesMax: 4
			},
			run: {
				imageSrc: './img/kenji2/Run.png',
				framesMax: 8
			},
			jump: {
				imageSrc: './img/kenji2/Jump.png',
				framesMax: 2
			},
			fall: {
				imageSrc: './img/kenji2/Fall.png',
				framesMax: 2
			},
			attack1: {
				imageSrc: './img/kenji2/Attack1.png',
				framesMax: 4
			}
		},
		attackBox: {
			offset: {
				x: 3,
				y: 55
			},
			width: 130,
			height: 50
		}
	});

	player.controlState = createControlState();
	enemy.controlState = createControlState();
	gameObjects = { player, enemy };
};

$(function() {
	socket = io.connect('http://localhost:3000/');

	socket.on('open', function(json) {
		currentId = socket.id;
		isConnected = true;
		stepInterval = json.stepInterval;
	});

	let par = window.location.href.split('?')[1];
	if (par) {
		currentAccount = par.split('=')[1];
		socket.emit('join', {
			account: currentAccount,
			id: currentId
		});
	}

	$('#start_btn').click(function() {
		currentAccount = $('#account').val();
		currentId = socket.id;
		if (isConnected == false) {
			showTips('socket connect failed');
		} else if (currentAccount == '') {
			showTips('please enter player id');
		} else {
			socket.emit('join', {
				account: currentAccount,
				id: currentId
			});
		}
	});

	$('#again_btn').click(function() {
		$(location).attr('href', '?account=' + currentAccount);
	});

	socket.on('system', function(msg) {
		showTips(msg);
	});

	socket.on('join', function(json) {
		showTips(json.message);
		if (json.result) {
			$('#login').hide();
			$('#content').show();
		}
	});

	socket.on('timeSync', function(json) {
		serverData = json;
	});

	socket.on('timeend', function() {
		determineWinner({ player, enemy });
	});

	socket.on('start', function(json) {
		newGame();
		jsonData = JSON.parse(json);
		gameObjects[jsonData[0].socket] = player;
		gameObjects[jsonData[1].socket] = enemy;
		stepTime = 0;
		serverData = {
			timer: 60,
			player: {
				position: clonePosition(player.position),
				health: player.health
			},
			enemy: {
				position: clonePosition(enemy.position),
				health: enemy.health
			}
		};
		$('.container').show();
		showTips('game start');
		animate();
		gameStatus = 1;
		socket.emit('inigameobj', {
			player: {
				position: clonePosition(player.position),
				health: player.health
			},
			enemy: {
				position: clonePosition(enemy.position),
				health: enemy.health
			},
			socketId: currentId
		});
	});

	socket.on('userCharacter', function(json) {
		if (json.me == 'player') {
			me = player;
			remotePlayer = enemy;
		} else if (json.me == 'enemy') {
			me = enemy;
			remotePlayer = player;
		}
	});

	socket.on('message', function(command) {
		if (gameStatus !== STATUS.START) {
			return;
		}
		if (command.socketId === currentId) {
			return;
		}

		const character = gameObjects[command.socketId];
		if (!character) {
			return;
		}

		stepTime = command.step;
		applyCommandToCharacter(character, command);
	});

	socket.on('attack', function(payload) {
		if (!payload || payload.socketId === currentId) {
			return;
		}
		const character = gameObjects[payload.socketId];
		if (!character) {
			return;
		}
		character.attack();
	});
});

function sendCommand(type) {
	if (isFastRunning) {
		console.log('waiting');
		return;
	}

	socket.emit('message', {
		direction: inputDirection,
		step: stepTime,
		type: type,
		id: currentAccount,
		socketId: currentId
	});
}

function animate() {
	animateId = window.requestAnimationFrame(animate);

	background.update();
	shop.update();
	player.updateSprite();
	enemy.updateSprite();
	player.update();
	enemy.update();
	game();
	update();
	if (towardConditional({ rectangle1: player, rectangle2: enemy })) {
		player.toward = 0;
		enemy.toward = 1;
	} else {
		player.toward = 1;
		enemy.toward = 0;
	}
	emitMyState();
}

function update() {
	if (!serverData) {
		return;
	}
	player.health = serverData.player.health;
	enemy.health = serverData.enemy.health;
	if (serverData.timer <= 0) {
		determineWinner({ player, enemy });
		gameState = false;
	}
	if (serverData.timer >= 0) {
		document.querySelector('#timer').innerHTML = serverData.timer;
	}
	syncRemoteState();
}

function game() {
	if (
		rectangularCollision({
			rectangle1: player,
			rectangle2: enemy
		}) && player.isAttacking && player.framesCurrent === 4 && new Date().getTime() - player.attacktime >= 350
	) {
		player.isAttacking = false;
		player.attacktime = new Date().getTime();
		if (enemy.health > 0) {
			if (me === player) {
				emitHit('enemy', 20);
			}
		}
	}
	if (player.isAttacking) {
		if (player.framesCurrent === 4) {
			player.isAttacking = false;
		}
	}
	if (
		rectangularCollision({
			rectangle1: enemy,
			rectangle2: player
		}) && enemy.isAttacking && enemy.framesCurrent === 1 && new Date().getTime() - enemy.attacktime >= 350
	) {
		enemy.isAttacking = false;
		enemy.attacktime = new Date().getTime();
		if (player.health > 0) {
			if (me === enemy) {
				emitHit('player', 10);
			}
		}
	}
	if (enemy.isAttacking && enemy.framesCurrent === 1) {
		enemy.isAttacking = false;
	}
	document.querySelector('#enemyHealth').style.width = enemy.health + '%';
	document.querySelector('#playerHealth').style.width = player.health + '%';
}

window.addEventListener('keydown', (event) => {
	if (gameState) {
		inputDirection = event.key;
		applyLocalCommand(event.key, 'keydown');
		if (event.key === ' ') {
			emitAttack();
		}
		sendCommand('keydown');
	}
});

window.addEventListener('keyup', (event) => {
	inputDirection = event.key;
	applyLocalCommand(event.key, 'keyup');
	sendCommand('keyup');
});

function showTips(str) {
	let width = str.length * 20 + 50;
	let halfScreenWidth = $(window).width() / 2;
	let halfScreenHeight = $(window).height() / 2;
	$('#tips').stop();
	$('#tips').show();
	$('#tips').text(str);
	$('#tips').css('width', width);
	$('#tips').css('top', halfScreenHeight);
	$('#tips').css('left', halfScreenWidth - width / 2);
	$('#tips').animate({ top: halfScreenHeight - 100 });
	$('#tips').fadeOut();
	console.log(str);
}
