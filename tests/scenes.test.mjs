import fs from 'node:fs';
import assert from 'node:assert/strict';

const saved = new Map();
globalThis.localStorage = { getItem: k => saved.get(k) || null, setItem: (k, v) => saved.set(k, String(v)) };
globalThis.Phaser = {
  Scene: class { constructor(key) { this.key = key; } },
  Physics: { Matter: { Matter: { Vertices: { centre: points => ({ x: points.reduce((n, p) => n + p.x, 0) / points.length, y: points.reduce((n, p) => n + p.y, 0) / points.length }) } } } }
};
const source = fs.readFileSync('js/GameScene.js', 'utf8');
const { GameScene, HubScene, EnemyNavigator } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const data = {};
function attach(scene) {
  const object = (x = 0, y = 0) => {
    const obj = { x, y, scene };
    for (const name of ['setOrigin', 'setInteractive', 'on', 'setBackgroundColor', 'setDepth', 'setVisible', 'setScale', 'setAngle', 'setCollisionCategory', 'setStrokeStyle', 'setTint', 'setVelocity', 'setVelocityX', 'setVelocityY', 'setText', 'setColor']) obj[name] = () => obj;
    obj.setFillStyle = color => { obj.fillColor = color; return obj; };
    obj.setPosition = (x, y) => { obj.x = x; obj.y = y; obj.body.position = { x, y }; obj.body.bounds = { min: { x: x - 12, y: y - 12 }, max: { x: x + 12, y: y + 12 } }; return obj; };
    obj.setDisplayOrigin = (x, y) => { obj.displayOriginX = x; obj.displayOriginY = y; return obj; };
    obj.body = { gameObject: obj, position: { x, y }, bounds: { min: { x: x - 10, y: y - 10 }, max: { x: x + 10, y: y + 10 } } };
    obj.body.parent = obj.body;
    return obj;
  };
  scene.cache = { json: { get: key => data[key] } };
  scene.load = { image() {}, json(key, file) {
    data[key] = JSON.parse(fs.readFileSync(this.path + file));
  } };
  scene.cameras = { main: { setBackgroundColor() {} } };
  scene.shapes = [];
  scene.add = { text: object, circle: object, polygon(x, y, vertices) {
    const shape = object(x, y);
    shape.vertices = vertices;
    shape.displayOriginX = 10;
    shape.displayOriginY = 10;
    scene.shapes.push(shape);
    return shape;
  }, group: () => ({ add() {} }) };
  scene.scale = { width: 900, height: 600 };
  scene.input = { keyboard: { createCursorKeys: () => Object.fromEntries(['left', 'right', 'up', 'down'].map(k => [k, { isDown: false }])) } };
  scene.matter = { world: {
    nextCategory: () => 1, setBounds() {},
    on(event, handler, context) { assert.equal(context, scene); scene.collision = handler.bind(context); },
    off(event, handler, context) {
      assert.equal(event, 'collisionstart');
      assert.equal(handler, scene.handleCollision);
      assert.equal(context, scene);
      scene.collisionRemoved = true;
    }
  }, add: { sprite: object, gameObject: obj => obj } };
  scene.events = { once(event, handler) { scene.shutdown = handler; } };
  scene.time = { delayedCall(ms, handler) { scene.finish = handler; } };
  scene.scene = { start(key) { scene.nextScene = key; }, restart(data) { scene.restartData = data; } };
  return scene;
}
const hub = attach(new HubScene());
hub.preload(); hub.create(); hub.update();
assert.ok(Array.isArray(hub.getLevels(hub)));
for (let levelIndex = 0; levelIndex < data.levelData.length; levelIndex++) {
  const scene = attach(new GameScene());
  scene.preload(); scene.create({ levelIndex }); scene.update();
  const definitions = [...scene.wallData, ...scene.gateData];
  scene.shapes.forEach((shape, index) => {
    shape.vertices.forEach((point, vertex) => {
      assert.ok(Math.abs(shape.x + point.x - shape.displayOriginX - definitions[index].shape[vertex * 2]) < 1e-8);
      assert.ok(Math.abs(shape.y + point.y - shape.displayOriginY - definitions[index].shape[vertex * 2 + 1]) < 1e-8);
    });
  });
  assert.equal(scene.playerColor, 'white');
  assert.equal(scene.enemy.body.label, 'enemy');
  assert.equal(scene.enemyColor, 'white');
  assert.ok(scene.enemyNavigator.clear(scene.enemySpawn));
  assert.ok(Math.hypot(scene.enemySpawn.x - scene.levelStart.x, scene.enemySpawn.y - scene.levelStart.y) > 200);
  const pursuit = scene.enemyNavigator.route(scene.enemy, scene.player, 'white');
  assert.ok(pursuit.length > 0, 'Enemy can reach player in level ' + levelIndex);
  let plannedColor = 'white';
  for (let i = 1; i < pursuit.length; i++) {
    assert.ok(scene.enemyNavigator.segmentClear(pursuit[i - 1], pursuit[i]));
    plannedColor = scene.enemyNavigator.nextColor(plannedColor, scene.enemyNavigator.crossedColors(pursuit[i - 1], pursuit[i]));
    assert.ok(plannedColor, 'Pursuit alternates colors');
  }
  const gate = { label: 'gates', gameObject: { color: 'red', direction: 'horizontal' }, bounds: { min: { x: 0, y: 100 }, max: { x: 100, y: 110 } } };
  gate.parent = gate;
  scene.player.body.position = { x: 50, y: 95 };
  scene.player.body.bounds = { min: { x: 40, y: 90 }, max: { x: 60, y: 120 } };
  scene.collision({ pairs: [{ bodyA: scene.player.body, bodyB: gate }] });
  scene.checkWallCrossings();
  assert.equal(scene.playerColor, 'white');
  scene.player.body.bounds.min.y = 111;
  scene.checkWallCrossings();
  assert.equal(scene.playerColor, 'red');
  scene.enemy.body.position = { x: 50, y: 95 };
  scene.enemy.body.bounds = { min: { x: 40, y: 90 }, max: { x: 60, y: 120 } };
  scene.collision({ pairs: [{ bodyA: gate, bodyB: scene.enemy.body }] });
  scene.checkWallCrossings(scene.enemy, scene.enemyCrossings, true);
  assert.equal(scene.enemyColor, 'white');
  scene.enemy.body.bounds.min.y = 111;
  scene.checkWallCrossings(scene.enemy, scene.enemyCrossings, true);
  assert.equal(scene.enemyColor, 'red');
  assert.equal(scene.enemy.fillColor, 0xef4444);
  scene.enemy.body.position.y = 95;
  scene.collision({ pairs: [{ bodyA: scene.enemy.body, bodyB: gate }] });
  scene.checkWallCrossings(scene.enemy, scene.enemyCrossings, true);
  assert.equal(scene.enemyColor, 'white');
  assert.equal(scene.enemy.x, scene.enemySpawn.x);
  assert.equal(scene.enemyCrossings.size, 0);
  assert.equal(scene.playerColor, 'red');
  gate.gameObject.isExit = true;
  scene.enemy.body.position = { x: 50, y: 95 };
  scene.enemy.body.bounds = { min: { x: 40, y: 111 }, max: { x: 60, y: 135 } };
  scene.collision({ pairs: [{ bodyA: gate, bodyB: scene.enemy.body }] });
  scene.checkWallCrossings(scene.enemy, scene.enemyCrossings, true);
  assert.equal(scene.enemyColor, 'red');
  assert.equal(scene.playerWon, false, 'Enemy cannot complete the level');
  scene.enemy.setPosition(300, 300);
  scene.enemyPath = [{ x: 310, y: 300 }];
  scene.player.body.position.y = 95;
  scene.collision({ pairs: [{ bodyA: scene.player.body, bodyB: gate }] });
  scene.checkWallCrossings();
  assert.equal(scene.playerColor, 'white', 'Repeated red crossing resets player');
  assert.equal(scene.enemy.x, scene.enemySpawn.x);
  assert.equal(scene.enemy.y, scene.enemySpawn.y);
  assert.equal(scene.enemyColor, 'white');
  assert.equal(scene.enemyCrossings.size, 0);
  assert.equal(scene.enemyPath.length, 0);
  scene.elapsedTime = 2500;
  scene.completeLevel();
  assert.equal(saved.get(scene.scoreKey + ':complete'), 'true');
  assert.equal(scene.elapsedTime, 0);
  scene.finish();
  assert.equal(scene.nextScene, 'Hub');
  scene.playerWon = false;
  scene.collision({ pairs: [{ bodyA: scene.enemy.body, bodyB: scene.player.body }] });
  assert.equal(scene.restartData.levelIndex, levelIndex);
  assert.equal(scene.restarting, true);
  // Phaser may clear the plugin's world before our shutdown listener runs.
  scene.matter.world = null;
  scene.shutdown();
  assert.equal(scene.collisionRemoved, true);
}
for (const solution of JSON.parse(fs.readFileSync('tests/level-solutions.json'))) {
  const level = data.levelData[solution.levelIndex];
  const navigator = new EnemyNavigator(level.walls, level.gates);
  let color = 'white';
  const crossed = [];
  for (let i = 1; i < solution.points.length; i++) {
    const a = solution.points[i - 1], b = solution.points[i];
    const colors = navigator.crossedColors(a, b);
    crossed.push(...colors);
    color = navigator.nextColor(color, colors);
    assert.ok(color, level.name + ': solution alternates colors');
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)));
    for (let j = 0; j <= steps; j++) {
      const x = a.x + (b.x - a.x) * j / steps, y = a.y + (b.y - a.y) * j / steps;
      for (const wall of level.walls) {
        const xs = wall.shape.filter((_, k) => k % 2 === 0), ys = wall.shape.filter((_, k) => k % 2 === 1);
        assert.ok(!(x + 22 > Math.min(...xs) && x - 22 < Math.max(...xs) && y + 22 > Math.min(...ys) && y - 22 < Math.max(...ys)), level.name + ': full player clearance');
      }
    }
  }
  assert.deepEqual(crossed, solution.colors);
  const exit = level.gates.find(g => g.exit);
  const finish = solution.points.at(-1);
  assert.ok(finish.y - 22 > Math.max(...exit.shape.filter((_, i) => i % 2 === 1)));
  assert.ok(finish.y + 22 < 600);
}
console.log('Passed all ' + data.levelData.length + ' levels and eight redesigned player solutions: clearance, alternating colors, enemy pursuit, respawn, catch/restart, completion, and shutdown.');
