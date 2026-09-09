import { GameScene, HubScene } from "./GameScene.js";
const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    backgroundColor: '#ffffff',
    width: 900,
    height: 600,
    physics: {
        default: 'matter',
        matter: { gravity: { y: 0 }, debug: true }
    },
    scene: [
        HubScene, GameScene
    ]
};

const game = new Phaser.Game(config);