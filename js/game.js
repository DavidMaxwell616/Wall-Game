var config = {
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    parent: 'game',
    scene: {
      preload: preload,
      create: create,
      update: update,
    },
    physics: {
      default: 'matter',
      matter: {
        gravity: {
          y: 0,
        },
        debug: false,
      },
    },
  };
  
  
  var game = new Phaser.Game(config);
var _scene;
var game_width, game_height;

  
function create ()
    {
        _scene = this;
        game_width = _scene.game.config.width;
        game_height = _scene.game.config.height;
        walls = this.add.sprite(0, 0,'walls').setOrigin(0);
       // this.physics.world.enable([ walls ]);
       player = _scene.matter.add.sprite(0,0, 'player');
       player.setOrigin(0.5).setScale(.8);
       player.body.collideWorldBounds = true;
       player.body.label = 'player';
       
       setUpArrows();

    }

    function update ()
    {
    }

    function setUpArrows(){
        var y = game_height-10;
        for (let index = 0; index < arrows.length; index++) {
         var arrow = arrowStats[index];
         arrows[index] = _scene.add.image(0,0,'arrow');
         arrows[index].setOrigin(0.5).setScale(.25);
         arrows[index].xOffset = arrow.xOffset;  
         arrows[index].yOffSet = arrow.yOffset;  
          arrows[index].x = 60+arrows[index].game_width*.25+40+arrow.xOffset;
          arrows[index].y = y- arrows[index].game_width*.25+arrow.yOffset;
          arrows[index].name= arrow.direction;
          arrows[index].setInteractive();
         arrows[index].angle =arrow.angle;  
        }
      }
      