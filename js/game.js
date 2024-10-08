const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    backgroundColor: '#ffffff',
    physics: {
        default: 'matter',
        matter: {
          gravity: {
            y: 0,
          },
          debug: true,
        },
      },
    scene: {
        preload: preload,
        create: create,
        update: update,
    }
};

const game = new Phaser.Game(config);
const game_height = game.config.height;
const game_width = game.config.width;

function create() {
    objectData = this.cache.json.get('levelData');
    this.cursors = this.input.keyboard.createCursorKeys();
    polygons = this.add.group()
    wallData = objectData['walls'];
    gateData = objectData['gates'];
    cat1 = this.matter.world.nextCategory();
    cat2 = this.matter.world.nextCategory();
    buildWalls(this);
    buildGates(this);
    this.matter.world.setBounds(0, 0, game.config.width, game.config.height);
    titleText = this.add.text(620, 0, RULES_TEXT,
        {
            fontFamily: 'Arial', fontSize: 32, color: '#00',
            wordWrap: { width: 250},
        })

    highScoreText = this.add.text(620, 240, 'HIGH SCORE: 0',
        {
            fontFamily: 'Arial', fontSize: 32, color: '#00'
        })
    timerText = this.add.text(620, 200, 'TIMER: 0',
        {
            fontFamily: 'Arial', fontSize: 32, color: '#00'
        })
    player = this.matter.add.sprite(PLAYER_START_X,PLAYER_START_Y, 'player').setScale(.8).setAngle(45);
    player.setCollisionCategory(cat1);
    player.body.label = 'player';
    this.matter.world.on('collisionstart', handleCollision);
    setUpArrows(this);
    playerColor=='white';
    localStorage.setItem(localStorageName, 0);
    highScore = localStorage.getItem(localStorageName) == null ? 0 :
    localStorage.getItem(localStorageName);
  }

function buildWalls(scene){
    wallBkgd = scene.add.sprite(0, 0, 'walls');
    wallBkgd.setOrigin(0);
    wallBkgd.setDisplaySize(
      600,
      600,
    );
    for (let index = 0; index < wallData.length; index++) {
      var vertices = wallData[index].shape;
      let polyObject = [];
      for (let i = 0; i < vertices.length / 2; i++) {
        polyObject.push({
          x: vertices[i * 2],
          y: vertices[i * 2 + 1],
        });
      }
  
      let centre = Phaser.Physics.Matter.Matter.Vertices.centre(polyObject);
      var verts = scene.matter.verts.fromPath(vertices.join(' '));
      for (let i = 0; i < verts.length; i++) {
        (verts[i].x -= centre.x) * -1 * xScale ;
        (verts[i].y -= centre.y) * -1 * yScale;
      }
      var poly = scene.add.polygon(
        centre.x * xScale,
        centre.y * yScale,
        verts,
        0x0000ff, 0,
      );
      var objBody = scene.matter.add
        .gameObject(
          poly, {
            shape: {
              type: 'fromVerts',
              verts,
              flagInternal: true,
            },
          })
        .setStatic(true)
        .setOrigin(0);
      objBody.body.label = 'wall';
      objBody.setCollisionCategory(cat1);
      polygons.add(poly);
      wallBkgd.setDepth(0);   
      }
}

function buildGates(scene){
    gateBkgd = scene.add.sprite(0, 0, 'gates');
    gateBkgd.setOrigin(0);
    gateBkgd.setDisplaySize(
      GAME_WIDTH,
      GAME_HEIGHT,
    );
    for (let index = 0; index < gateData.length; index++) {
      var vertices = gateData[index].shape;
      let polyObject = [];
      for (let i = 0; i < vertices.length / 2; i++) {
        polyObject.push({
          x: vertices[i * 2],
          y: vertices[i * 2 + 1],
        });
      }
  
      let centre = Phaser.Physics.Matter.Matter.Vertices.centre(polyObject);
      var verts = scene.matter.verts.fromPath(vertices.join(' '));
      for (let i = 0; i < verts.length; i++) {
        (verts[i].x -= centre.x) * -1 * xScale ;
        (verts[i].y -= centre.y) * -1 * yScale;
      }
      var poly = scene.add.polygon(
        centre.x * xScale,
        centre.y * yScale,
        verts,
        0x0000ff, 0,
      );
      var objBody = scene.matter.add
        .gameObject(
          poly, {
            shape: {
              type: 'fromVerts',
              verts,
              flagInternal: true,
            },
          })
        .setSensor(true)
        .setStatic(true)
        .setOrigin(0);
      objBody.color = gateData[index].color;
        objBody.body.label = 'gates';
      polygons.add(poly);
      gateBkgd.setDepth(0);   
      }
}
function passThroughGate(){

}

function handleCollision(event){
  for (var i = 0; i < event.pairs.length; i++) {
    var bodyA = getRootBody(event.pairs[i].bodyA);
    var bodyB = getRootBody(event.pairs[i].bodyB);
    if (bodyA.label == 'player' && bodyB.label == 'gates'
      || bodyB.label == 'player' && bodyA.label == 'gates')
      {
        if(bodyA.label == 'gates')
        {
         if(bodyA.gameObject.color=='red')
         {
          if(playerColor=='red')
          {
            bodyB.gameObject.setTint(0xffffff);
            playerColor = 'white';
            hitExit = false;
            resetPlayer();
            return;
          }
          playerColor = 'red';
          bodyB.gameObject.setTint(0xff0000);
         }
         else
         {
          if(playerColor=='blue')
            {
              console.log(bodyA.id);
              if(bodyA.id==24)
                {
                  console.log(hitExit);
                  hitExit = true;
                }
            
            bodyB.gameObject.setTint(0xffffff);
            playerColor = 'white';
            resetPlayer();
            return;
            }
        
            playerColor = 'blue';
            
          bodyB.gameObject.setTint(0x0000ff);
         }
        }
        return;
      }
  }
}

function getRootBody(body) {
  if (body.parent === body) {
    return body;
  }
  while (body.parent !== body) {
    body = body.parent;
  }
  return body;
}
function update() {
    player.setVelocity(0);

    updateScore();  
    if (this.cursors.left.isDown) {
        player.setVelocityX(-1);
        if(!startTimer) {
          startTimer = true;
        startTime = new Date().getTime();
      }
    }
    else if (this.cursors.right.isDown) {
        player.setVelocityX(1);
        if(!startTimer) {
          startTimer = true;
        startTime = new Date().getTime();
      }
    }

    if (this.cursors.up.isDown) {
        player.setVelocityY(-1);
        if(!startTimer) {
          startTimer = true;
        startTime = new Date().getTime();
      }
    }
    else if (this.cursors.down.isDown) {
        player.setVelocityY(1);
        if(!startTimer) {
          startTimer = true;
        startTime = new Date().getTime();
      }
    }
}
function updateScore() {
  highScoreText.setText('High SCORE: ' + highScore);
  if(startTimer)
  {
    var now = new Date().getTime();
    time = now - startTime;
  }
  timerText.setText('TIMER: ' + time);
}

function resetPlayer(gate)
{
  player.x = PLAYER_START_X;
  player.y = PLAYER_START_Y;

   if (hitExit && time < highScore && highScore==0)
   {
    highScore = time;
    localStorage.setItem(localStorageName, highScore);
   }
  time=0;
  startTimer = false;
}
function setUpArrows(scene) {
    var y = game_height - 10;
    for (let index = 0; index < arrows.length; index++) {
        var arrow = arrowStats[index];
        arrows[index] = scene.add.image(0, 0, 'arrow');
        arrows[index].setOrigin(0.5);
        arrows[index].xOffset = arrow.xOffset;
        arrows[index].yOffSet = arrow.yOffset;
        arrows[index].x = game_width * arrow.xOffset;
        arrows[index].y = game_height * arrow.yOffset;
        arrows[index].name = arrow.direction;
        arrows[index].setInteractive();
        arrows[index].angle = arrow.angle;
    }
}
