/** @type {HTMLCanvasElement} */
const canvas = document.querySelector('#cv1');
const c = canvas.getContext('2d');

const cw = canvas.width = 1024;
const ch = canvas.height = 576;
let kenjiNowFramesCurrent = 0;
let samuraiNowFramesCurrent = 0;
let gameState = true;
let inputDirection = null
//背景を描く
//重力
const gravity = 0.3;
let player = null;
let enemy = null;
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
    ArrowLeft:{
        pressed :false
    },
    ArrowRight:{
        pressed :false
    },
    ArrowUp:{
        pressed :false
    },
}
var newGame = function(id){
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
            width:170,
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
}
const startGame = new newGame();

decreaseTimer();
$(function () {
    animate();

})
//無限ループアニメーション
function animate(){
    window.requestAnimationFrame(animate);
    background.update();
    shop.update();
    player.move();
    player.update();
    enemy.move();
    enemy.update();
    //攻撃判定
    
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
function setData(msg){
    player.position = msg.player.position;
    player.velocity = msg.player.velocity;
    player.isAttacking = msg.player.isAttacking;
    player.toward = msg.player.toward;
    player.attackBox = msg.player.attackBox;
    player.health = msg.player.health;
    enemy.position = msg.enemy.position;
    enemy.velocity = msg.enemy.velocity;
    enemy.isAttacking = msg.enemy.isAttacking;
    enemy.toward = msg.enemy.toward;
    enemy.attackBox = msg.enemy.attackBox;
    enemy.health = msg.enemy.health;
    keys.a.pressed = msg.keys.a.pressed;
    keys.d.pressed = msg.keys.d.pressed;
    keys.ArrowRight.pressed = msg.keys.ArrowRight.pressed;
    keys.ArrowLeft.pressed = msg.keys.ArrowLeft.pressed;
    keys.ArrowUp.pressed = msg.keys.ArrowUp.pressed;
}
//イベントリスナー
window.addEventListener('keydown',(event)=>{
    if(gameState){
        console.log(event)
        switch(event.key){
            case 'd':
                keys.d.pressed = true;
                player.lastKey = 'd';
                break;
            case 'a' :
                
                keys.a.pressed = true;
                player.lastKey = 'a';
                break;
            case 'w' :
                //ジャンプ一回のみ
                
                if(player.position.y + player.height >= ch-96){
                    player.velocity.y = -11;
                }
                break;
            case ' ':
                player.attack();
                break;
            case 'ArrowRight':
                
                keys.ArrowRight.pressed = true;
                enemy.lastKey = 'ArrowRight'
                break;
            case 'ArrowLeft' :
                
                keys.ArrowLeft.pressed = true;
                enemy.lastKey = 'ArrowLeft';
                break;
            case 'ArrowUp' :
                
                keys.ArrowUp.pressed = true;
                if(enemy.position.y + enemy.height >= ch -96){
                    enemy.velocity.y = -11;
                }
                break;
            case '0' :
                enemy.attack();
                break;
        }
    }
})
window.addEventListener('keyup',(event)=>{
    switch(event.key){
        case 'd':
            keys.d.pressed = false;
            break;
        case 'a' :
            keys.a.pressed = false;
            break;
    }
    switch(event.key){
        case 'ArrowRight':
            keys.ArrowRight.pressed = false;
            break;
        case 'ArrowLeft' :
            keys.ArrowLeft.pressed = false;
            break;
    }
})
