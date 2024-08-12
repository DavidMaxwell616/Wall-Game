function preload ()
    {
       this.load.path = '../assets/images/';
       this.load.image('walls', 'walls.png');
       this.load.image('gates', 'gates.png');
       this.load.image('arrow', 'arrow.png');
       this.load.image('player', 'player.png');
       this.load.path = '../assets/json/';
      this.load.json('levelData', 'level_data.json');

      }