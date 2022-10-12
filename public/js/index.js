/** @type {HTMLCanvasElement} */

// 游戏状态枚举
const STATUS = {
	WAIT:1,
	START:2
}
const canvas = document.querySelector('#cv1');
const c = canvas.getContext('2d');

const cw = canvas.width = 1024;
const ch = canvas.height = 576;
// STEP　ms
let stepInterval = 0
// STEPタイム
let stepTime = 0
// ゲーム状態
let gameStatus = 2
// ゲームOBJ
let gameObjects = {}
// SOCKETアクセスしてるか
let isConnected = false
// 実行中コマンド
let runningCommands = null
// ユーザー
let currentAccount = null
// 遅延
let isFastRunning = false;

let kenjiNowFramesCurrent = 0;
let samuraiNowFramesCurrent = 0;
let gameState = true;
let recvCommands = new Array();
let inputDirection = null;
//背景を描く
//重力
const gravity = 0.3;
let player = null;
let enemy = null;

let lastUpdate = Date.now()
let now = Date.now()
let dt = now - lastUpdate

//背景image
const background = new Sprite({
    position:{
        x:0,
        y:0
    },
    imageSrc:'./img/background.png'
})
//shopアニメーション
const shop = new Sprite({
    position:{
        x:760,
        y:224
    },
     
    imageSrc:'./img/shop.png',
    scale : 2,
    framesMax:6
})
const keys = {
    a:{
        pressed :false
    },
    d:{
        pressed :false
    },
}
let newGame = function(id){
    player = new Fighter({
        position:{
            x:250,
            y:200
        },
        velocity:{
            x:0,
            y:1
        },
        offset:{
            x:170,
            y:95
        },
        imageSrc:'./img/samuraiMack/Idle.png',
        imageSrc2:'./img/samuraiMack2/Idle.png',
        scale : 2,
        framesMax:8,
        attacktime:0,
        isAttacking:false,
        toward:0,
        sprites:{
            idle:{
                imageSrc:'./img/samuraiMack/Idle.png',
                framesMax:8
            },
            run:{
                imageSrc:'./img/samuraiMack/Run.png',
                framesMax:8
            },
            jump:{
                imageSrc:'./img/samuraiMack/Jump.png',
                framesMax:2
            },
            fall:{
                imageSrc:'./img/samuraiMack/Fall.png',
                framesMax:2
            },
            attack1:{
                imageSrc:'./img/samuraiMack/Attack1.png',
                framesMax:6
            },
        },
        sprites2:{
            idle:{
                imageSrc:'./img/samuraiMack2/Idle.png',
                framesMax:8
            },
            run:{
                imageSrc:'./img/samuraiMack2/Run.png',
                framesMax:8
            },
            jump:{
                imageSrc:'./img/samuraiMack2/Jump.png',
                framesMax:2
            },
            fall:{
                imageSrc:'./img/samuraiMack2/Fall.png',
                framesMax:2
            },
            attack1:{
                imageSrc:'./img/samuraiMack2/Attack1.png',
                framesMax:6
            },
        },
        attackBox:{
            offset:{
                x:35,
                y:50
            },
            width:150,
            height:50
        }
    });
        
    enemy = new Fighter({
        position:{
            x:800,
            y:100
        },
        velocity:{
            x:0,
            y:1
        },
        offset:{
            x:170,
            y:105
        },
        color:'blue',
        imageSrc:'./img/kenji/Idle.png',
        imageSrc2:'./img/kenji2/Idle.png',
        scale : 2,
        framesMax:4,
        attacktime:0,
        isAttacking:false,
        toward:1,
        sprites:{
            idle:{
                imageSrc:'./img/kenji/Idle.png',
                framesMax:4
            },
            run:{
                imageSrc:'./img/kenji/Run.png',
                framesMax:8
            },
            jump:{
                imageSrc:'./img/kenji/Jump.png',
                framesMax:2
            },
            fall:{
                imageSrc:'./img/kenji/Fall.png',
                framesMax:2
            },
            attack1:{
                imageSrc:'./img/kenji/Attack1.png',
                framesMax:4
            },
        },
        sprites2:{
            idle:{
                imageSrc:'./img/kenji2/Idle.png',
                framesMax:4
            },
            run:{
                imageSrc:'./img/kenji2/Run.png',
                framesMax:8
            },
            jump:{
                imageSrc:'./img/kenji2/Jump.png',
                framesMax:2
            },
            fall:{
                imageSrc:'./img/kenji2/Fall.png',
                framesMax:2
            },
            attack1:{
                imageSrc:'./img/kenji2/Attack1.png',
                framesMax:4
            },
        },
        attackBox:{
            offset:{
                x:3,
                y:55
            },
            width:130,
            height:50
        }
    })
    gameObjects = {player,enemy};
}



$(function () {
    socket = io.connect('http://localhost:3000/');
    socket.on('open', function(json) {
        isConnected = true
        stepInterval = json.stepInterval
		id = json.id
        console.log("Socketアクセス成功：", id)
    })
    let par = window.location.href.split("?")[1]
    if(par){
        currentAccount = par.split("=")[1]
        socket.emit("join", currentAccount)
    }
    // ゲーム開始
	$('#start_btn').click(function(){
		currentAccount = $("#account").val()
		if(isConnected == false) {
			showTips("アクセス失败！")
		} else if(currentAccount == "") {
			showTips("idを入力してください。")
		} else {
			socket.emit("join", currentAccount)
		}
	})
    //もう一度プレイ
    $('#again_btn').click(function(){
        $(location).attr('href',"?account="+currentAccount);
	})
    // メッセージ受け
	socket.on('system',function(msg) {
		showTips(msg)
	})
    // ゲーム参加のメッセージを受け
	socket.on('join',function(json) {
		showTips(json.message)
		if(json.result) {
			$("#login").hide()
			$("#content").show()
		}
	})
    // ゲーム開始メッセージを受け
	socket.on('start',function(json) {
        const startGame = new newGame();
        gameObjects[json.player[0]] = player
        gameObjects[json.player[1]] = enemy
        
		stepTime = 0
        $(".container").show()
		showTips("ゲーム開始")
        decreaseTimer();
        animate();
        gameStatus = 1;
	})
    socket.on('message',function(json){
        console.log(json)
        if(gameStatus == 1) {
            let command = json
            recvCommands.push(command)
            stepTime = command.step
            let stepUpdateCounter = 0
            let lastUpdate = Date.now()
            
            stepUpdateCounter += dt
            if(stepUpdateCounter >= stepInterval) {
                stepUpdateCounter -= stepInterval
            }

            // コマンド実行
            if(json.type === 'keydown'){
                switch(command['direction']){
                    case 'd':
                        inputDirection = 'd'
                        keys.d.pressed = true;
                        break;
                    case 'a' :
                        inputDirection = 'a'
                        keys.a.pressed = true;
                        break;
                    case 'w' :
                        //ジャンプ一回のみ
                        inputDirection = 'w'
                        // if(this.position.y + this.height >= ch-96){
                        //     this.velocity.y = -11;
                        // }
                        break;
                    case ' ':
                        inputDirection = ' '
                        break;
                }
            }else if(json.type === 'keyup'){
                switch(command['direction']){
                    case 'd':
                        keys.d.pressed = false;
                        break;
                    case 'a' :
                        keys.a.pressed = false;
                        break;
                    case 'ArrowRight':
                        keys.ArrowRight.pressed = false;
                        break;
                    case 'ArrowLeft' :
                        keys.ArrowLeft.pressed = false;
                        break;
                }
                inputDirection = null;
            }
				for (let i = 0; i < recvCommands.length; i++) {
					let obj = gameObjects[command.id]
                    // console.log(recvCommands[i]['direction'])
                    obj.lastKey = recvCommands[i]['direction']
                    if(obj.lastKey === ' '){
                        obj.attack();
                    }
					obj.move()
                    obj.updateSprite()
				}
                recvCommands.shift()
        }
    })
})
// コマンド送る
function sendCommand(type) {
    if(isFastRunning) {
        console.log("waiting")
        return
    }
    let direction = inputDirection
    
    socket.emit("message", {
        direction: direction,
        step:stepTime,
        type:type,
        id:currentAccount
    })
}
//無限ループアニメーション
function animate(){
    window.requestAnimationFrame(animate);
    
    background.update();
    shop.update();
    //攻撃判定
    player.updateSprite();
    enemy.updateSprite();
    player.update();
    enemy.update();
    game();
    //向き
    if(towardConditional({rectangle1:player,rectangle2:enemy})){
        player.toward = 0;
        enemy.toward = 1;
    }else{
        player.toward = 1;
        enemy.toward = 0;
    }
}

function game(){
    if(
        rectangularCollision({
            rectangle1:player,
            rectangle2:enemy
        })&& player.isAttacking && player.framesCurrent === 4  && new Date().getTime() - player.attacktime >= 350
    ){
        player.isAttacking = false;
        player.attacktime =  new Date().getTime();
        if(enemy.health > 0){
            enemy.health -= 20;
            document.querySelector('#enemyHealth').style.width = enemy.health + '%'
        }
    }
    if(player.isAttacking){
        if(player.framesCurrent === 4){
            player.isAttacking = false;
        }
    }
    if(
        rectangularCollision({
            rectangle1:enemy,
            rectangle2:player
        })&& enemy.isAttacking && enemy.framesCurrent === 1  && new Date().getTime() - enemy.attacktime >= 350
    ){
        enemy.isAttacking = false;
        enemy.attacktime =  new Date().getTime();
        if(player.health > 0){
            player.health -= 20;
            document.querySelector('#playerHealth').style.width = player.health + '%'
        }
    }
    if(enemy.isAttacking && enemy.framesCurrent === 1){
        enemy.isAttacking = false;
    }
    if(enemy.health <= 0 || player.health <= 0){
        determineWinner({player,enemy,timerId});
        gameState = false;
    }
}

//イベントリスナー
window.addEventListener('keydown',(event)=>{
    if(gameState){
        inputDirection = event.key
        sendCommand('keydown');
    }
})
window.addEventListener('keyup',(event)=>{
    switch(event.key){
        case 'd':
            inputDirection = 'd'
            keys.d.pressed = false;
            break;
        case 'a' :
            inputDirection = 'a'
            keys.a.pressed = false;
            break;
    }
    switch(event.key){
        case 'ArrowRight':
            inputDirection = 'ArrowRight'
            keys.ArrowRight.pressed = false;
            break;
        case 'ArrowLeft' :
            inputDirection = 'ArrowLeft'
            keys.ArrowLeft.pressed = false;
            break;
    }
    sendCommand('keyup');
})

function showTips(str) {
	let width = str.length * 20 + 50
	let halfScreenWidth = $(window).width() / 2
	let halfScreenHeight = $(window).height() / 2
	$("#tips").stop()
	$("#tips").show()
	$("#tips").text(str)
	$("#tips").css("width", width)
	$("#tips").css("top", halfScreenHeight)
	$("#tips").css("left", halfScreenWidth - width / 2)
	$("#tips").animate({top:halfScreenHeight - 100})
	$("#tips").fadeOut()
	console.log(str)
}