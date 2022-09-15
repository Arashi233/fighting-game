

class Sprite{
    constructor({position,imageSrc,scale = 1,framesMax = 1,framesCurrent,offset={x:0,y:0}}){
        this.position = position
        this.width = 50
        this.height = 150
        this.image = new Image()
        this.image.src = imageSrc
        this.scale = scale
        this.framesMax = framesMax
        this.framesCurrent = 0
        //経った時間
        this.framesElapsed = 0
        this.framesHold = 15
        this.offset = offset 
    }
    draw(){
        c.drawImage(
            this.image,
            this.framesCurrent *( this.image.width / this.framesMax),
            0,
            this.image.width / this.framesMax,
            this.image.height,
            this.position.x-this.offset.x,
            this.position.y-this.offset.y,
            (this.image.width / this.framesMax) * this.scale,
            this.image.height * this.scale
        )
    }
    update(){
        this.draw()
        this.animateFrame();
    }
    animateFrame(){
        this.framesElapsed++
        //特定のフレーム数ごとのイメージシーケンス
        if(this.framesElapsed % this.framesHold === 0){
            //フレームを順に表示
            if(this.framesCurrent < this.framesMax - 1){
                this.framesCurrent ++;
            }else{
                this.framesCurrent = 0;
            }
        }
    }
}
//キャラクタークラス
class Fighter extends Sprite{
    constructor({
        id,
        position,
        velocity,
        direction,
        color = 'red',
        offset = {x:0,y:0},
        imageSrc,
        imageSrc2,
        scale = 1,
        framesMax = 1,
        sprites,
        sprites2,
        attacktime,
        toward,
        attackBox = {
            offset:{},
            width:undefined,
            height:undefined,
        }

    }){
        super({
            position,
            imageSrc,
            scale,
            framesMax,
            offset,
        })
        this.id = id
        this.velocity = velocity
        this.imageSrc2 = imageSrc2
        this.attacktime = attacktime
        this.width = 50
        this.height = 150
        this.lastKey
        this.direction
        this.attackBox = {
            position:{
                x:this.position.x,
                y:this.position.y
            },
            offset:attackBox.offset,
            width:attackBox.width,
            height:attackBox.height,
        }
        this.color = color
        this.toward = toward
        this.isAttacking
        this.health = 100
        this.sprites = sprites
        this.sprites2 = sprites2
        for(const sprite in this.sprites){
            sprites[sprite].image = new Image()
            sprites[sprite].image.src = sprites[sprite].imageSrc
            
        }
        for(const sprite in this.sprites2){
            sprites2[sprite].image = new Image()
            sprites2[sprite].image.src = sprites2[sprite].imageSrc
        }
    }
    move(){
        this.velocity.x = 0;
        if(keys.a.pressed){
            this.velocity.x = -5;
        }else if(keys.d.pressed){
            this.velocity.x = 5;
        }
        if(this.position.y + this.height >= ch-96 && this.lastKey === 'w'){
            this.velocity.y = -11;
        }
       
        if(this.toward === 0){
            this.attackBox.offset.x = 30;
        }else{
            this.attackBox.offset.x = -125;
        }
    }
    update(){
        this.draw()
        this.animateFrame();

        this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
        this.attackBox.position.y = this.position.y + this.attackBox.offset.y;
        
        this.position.y += this.velocity.y;
        //画面を出ないように制限
        if(this.position.x + 50 + this.velocity.x >=cw || this.position.x + this.velocity.x <=0){
            this.velocity.x = 0;
        }
        this.position.x += this.velocity.x;
        if(this.position.y + this.height+this.velocity.y>=ch-96){
            this.velocity.y = 0
        }else this.velocity.y += gravity;
    }
    updateSprite(){
        if(keys.a.pressed){
            this.switchSprite('run');
        }else if(keys.d.pressed){
            this.switchSprite('run');
        }else{
            this.switchSprite('idle');
        }
        if(this.velocity.y < 0){
            this.switchSprite('jump');
        }else if(this.velocity.y > 0){
            this.switchSprite('fall');
        }else{
            this.switchSprite('idle');

        }
    }
    attack(){
        this.switchSprite('attack1');
        this.isAttacking = true;
    }
    switchSprite(sprites){
        if(this.toward === 0){
            if(this.image === this.sprites.attack1.image && this.framesCurrent < this.sprites.attack1.framesMax - 1) {
                return;
            }
            switch (sprites){
                case 'idle':
                    if(this.image !== this.sprites.idle.image){
                        this.image = this.sprites.idle.image;
                        this.framesMax = this.sprites.idle.framesMax;
                        this.framesCurrent = 0;
                    }
                    break;
                case 'run':
                    if(this.image !== this.sprites.run.image){
                        this.framesMax = this.sprites.run.framesMax;
                        this.image = this.sprites.run.image;
                        this.framesCurrent = 0;
                    }
                    break;
                case 'jump':
                    if(this.image !== this.sprites.jump.image){
                        this.image = this.sprites.jump.image;
                        this.framesMax = this.sprites.jump.framesMax;
                        this.framesCurrent = 0;
                    }
                    break;
                case 'fall':
                    if(this.image !== this.sprites.fall.image){
                        this.image = this.sprites.fall.image;
                        this.framesMax = this.sprites.fall.framesMax;
                        this.framesCurrent = 0;
                    }
                    break;
                case 'attack1':
                    if(this.image !== this.sprites.attack1.image){
                        this.image = this.sprites.attack1.image;
                        this.framesMax = this.sprites.attack1.framesMax;
                        this.framesCurrent = 0;
                    }
                    break;
            }
        }else{
            if(this.image === this.sprites2.attack1.image && this.framesCurrent < this.sprites2.attack1.framesMax - 1) {
                return;
            }
            switch (sprites){
                case 'idle':
                    if(this.image !== this.sprites2.idle.image){
                        this.image = this.sprites2.idle.image;
                        this.framesMax = this.sprites2.idle.framesMax;
                        this.framesCurrent = 0;
                    }
                    break;
                case 'run':
                    if(this.image !== this.sprites2.run.image){
                        this.framesMax = this.sprites2.run.framesMax;
                        this.image = this.sprites2.run.image;
                        this.framesCurrent = 0;
                    }
                    break;
                case 'jump':
                    if(this.image !== this.sprites2.jump.image){
                        this.image = this.sprites2.jump.image;
                        this.framesMax = this.sprites2.jump.framesMax;
                        this.framesCurrent = 0;
                    }
                    break;
                case 'fall':
                    if(this.image !== this.sprites2.fall.image){
                        this.image = this.sprites2.fall.image;
                        this.framesMax = this.sprites2.fall.framesMax;
                        this.framesCurrent = 0;
                    }
                    break;
                case 'attack1':
                    if(this.image !== this.sprites2.attack1.image){
                        this.image = this.sprites2.attack1.image;
                        this.framesMax = this.sprites2.attack1.framesMax;
                        this.framesCurrent = 0;
                    }
                    break;
            }
        }
    }
    defense(){
        
    }
}