const localStorageName = 'Wall Game';
const PLAYER_START_X = 50;
const PLAYER_START_Y = 550;
const RULES_TEXT = "Rules: Can't pass through the same color wall twice.";

export class GameScene extends Phaser.Scene {
  constructor(key = "Game") {
    super(key);
    this.level = 1;
  }


  preload() {
    this.load.path = 'assets/images/';
    this.load.image('walls', 'walls.png');
    this.load.image('gates', 'gates.png');
    this.load.image('arrow', 'arrow.png');
    this.load.image('player', 'player.png');
    this.load.path = 'assets/json/';
    this.load.json('levelData', 'levels.json');

  }



  getLevels(scene) {
    return scene.cache.json.get('levelData');
  }

  addButton(scene, x, y, label, action, boss = false) {
    const button = scene.add.text(x, y, label, {
      fontFamily: 'Arial', fontSize: 20, color: '#ffffff',
      backgroundColor: boss ? '#92400e' : '#1e40af', align: 'center', padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setBackgroundColor(boss ? '#b45309' : '#2563eb'));
    button.on('pointerout', () => button.setBackgroundColor(boss ? '#92400e' : '#1e40af'));
    button.on('pointerdown', action);
    return button;
  }

  createHub() {
    this.cameras.main.setBackgroundColor('#0f172a');
    const levels = this.getLevels(this);
    const completed = levels.filter((_, i) => localStorage.getItem(localStorageName + ':level:' + i + ':complete') === 'true').length;
    this.add.text(450, 45, 'THE WALL GAME', {
      fontFamily: 'Arial', fontSize: 40, fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);
    this.add.text(450, 95, 'Cross completely. Alternate colors. Find the exit.', {
      fontFamily: 'Arial', fontSize: 20, color: '#cbd5e1'
    }).setOrigin(0.5);
    this.add.text(450, 135, completed + ' / ' + levels.length + ' LEVELS COMPLETE', {
      fontFamily: 'Arial', fontSize: 18, color: '#fcd34d'
    }).setOrigin(0.5);
    levels.forEach((level, i) => {
      const key = localStorageName + ':level:' + i;
      const best = Number(localStorage.getItem(key));
      const done = localStorage.getItem(key + ':complete') === 'true';
      const x = 245 + (i % 2) * 410;
      const y = 200 + Math.floor(i / 2) * 76;
      this.addButton(this, x, y, `${i + 1}. ${level.name}\n${done ? 'COMPLETE · ' : ''}${best ? 'Best: ' + Math.floor(best / 1000) + 's' : 'Play level'}`,
        () => this.scene.start('Game', { levelIndex: i }), level.boss === true);
    });
  }

  create(data = {}) {
    this.levelIndex = data.levelIndex || 0;
    this.objectData = this.getLevels(this)[this.levelIndex];
    this.levelStart = this.objectData.start || { x: PLAYER_START_X, y: PLAYER_START_Y };
    this.scoreKey = localStorageName + ':level:' + this.levelIndex;
    this.elapsedTime = 0;
    this.startTimer = false;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.polygons = this.add.group()
    this.wallData = this.objectData['walls'];
    this.gateData = this.objectData['gates'];
    this.cat1 = this.matter.world.nextCategory();
    this.cat2 = this.matter.world.nextCategory();
    this.buildWalls(this);
    this.buildGates(this);
    this.matter.world.setBounds(0, 0, this.scale.width, this.scale.height);
    this.titleText = this.add.text(620, 45, RULES_TEXT,
      {
        fontFamily: 'Arial', fontSize: 24, color: '#172554',
        wordWrap: { width: 250 },
      })

    this.highScoreText = this.add.text(620, 240, 'HIGH SCORE: 0',
      {
        fontFamily: 'Arial', fontSize: 24, color: '#172554'
      })
    this.timerText = this.add.text(620, 200, 'TIMER: 0s',
      {
        fontFamily: 'Arial', fontSize: 24, color: '#172554'
      })
    this.lastWallText = this.add.text(620, 280, 'Last wall: None', {
      fontFamily: 'Arial', fontSize: 20, color: '#333333'
    });
    this.completeText = this.add.text(300, 300, 'LEVEL COMPLETE!', {
      fontFamily: 'Arial', fontSize: 36, color: '#ffffff',
      backgroundColor: '#166534', padding: { x: 16, y: 12 }
    }).setOrigin(0.5).setDepth(10).setVisible(false);
    this.playerWon = false;
    this.pendingCrossings = new Map();
    this.player = this.matter.add.sprite(this.levelStart.x, this.levelStart.y, 'player').setScale(.8).setAngle(45);
    this.player.setCollisionCategory(this.cat1);
    this.player.body.label = 'player';
    this.restarting = false;
    this.createEnemy();
    const collisionWorld = this.matter.world;
    collisionWorld.on('collisionstart', this.handleCollision, this);
    this.events.once('shutdown', () => collisionWorld.off('collisionstart', this.handleCollision, this));

    this.playerColor = 'white';
    this.lastWallColor = null;
    this.highScore = Number(localStorage.getItem(this.scoreKey)) || 0;
    this.add.text(620, 12, (this.objectData.boss ? 'BOSS LEVEL ' : 'LEVEL ') + (this.levelIndex + 1), { fontSize: 22, color: this.objectData.boss ? '#92400e' : '#172554' });
    this.addButton(this, 740, 500, 'RESTART', () => this.scene.restart({ levelIndex: this.levelIndex }));
    this.addButton(this, 740, 555, 'LEVEL HUB', () => this.scene.start('Hub'));
  }

  buildWalls(scene) {
    this.wallData.forEach(wall => this.buildShape(scene, wall, false));
  }

  buildGates(scene) {
    this.gateData.forEach(gate => this.buildShape(scene, gate, true));
  }

  buildShape(scene, data, isGate) {
    const points = [];
    for (let i = 0; i < data.shape.length; i += 2) points.push({ x: data.shape[i], y: data.shape[i + 1] });
    const center = Phaser.Physics.Matter.Matter.Vertices.centre(points);
    const vertices = points.map(p => ({ x: p.x - center.x, y: p.y - center.y }));
    const color = isGate ? (data.color === 'red' ? 0xef4444 : 0x2563eb) : 0x334155;
    const polygon = scene.add.polygon(center.x, center.y, vertices, color);
    const object = scene.matter.add.gameObject(polygon, {
      shape: { type: 'fromVerts', verts: vertices, flagInternal: true },
      isStatic: true, isSensor: isGate
    });
    // Vertices are relative to the body's center, so rendering must not
    // subtract Phaser's default half-width / half-height display origin.
    polygon.setDisplayOrigin(0, 0);
    object.body.label = isGate ? 'gates' : 'wall';
    object.color = data.color;
    object.direction = data.direction;
    object.isExit = data.exit === true;
    this.polygons.add(polygon);
    if (object.isExit) {
      polygon.setStrokeStyle(3, 0xffc107);
      scene.add.text(center.x, Math.max(...points.map(p => p.y)) + 8, 'EXIT \u2193', {
        fontFamily: 'Arial', fontSize: 20, fontStyle: 'bold', color: '#172554',
        backgroundColor: '#ffd54f', padding: { x: 8, y: 3 }
      }).setOrigin(0.5, 0);
    }
  }

  handleCollision(event) {
    if (this.playerWon || this.restarting) return;
    for (const pair of event.pairs) {
      const bodyA = this.getRootBody(pair.bodyA);
      const bodyB = this.getRootBody(pair.bodyB);
      if ((bodyA.label === 'enemy' && bodyB.label === 'player') ||
          (bodyB.label === 'enemy' && bodyA.label === 'player')) {
        this.restarting = true;
        this.player.setVelocity(0);
        this.enemy.setVelocity(0);
        this.scene.restart({ levelIndex: this.levelIndex });
        return;
      }
      const playerBody = ['player', 'enemy'].includes(bodyA.label) ? bodyA : ['player', 'enemy'].includes(bodyB.label) ? bodyB : null;
      const gateBody = bodyA.label === 'gates' ? bodyA : bodyB.label === 'gates' ? bodyB : null;
      if (!playerBody || !gateBody) continue;

      const color = gateBody.gameObject.color;
      if (color !== 'red' && color !== 'blue') continue;
      const crossings = playerBody.label === 'enemy' ? this.enemyCrossings : this.pendingCrossings;
      if (crossings.has(gateBody)) continue;
      const bounds = gateBody.bounds;
      const axis = gateBody.gameObject.direction === 'horizontal' ? 'y' : 'x';
      const center = (bounds.min[axis] + bounds.max[axis]) / 2;
      crossings.set(gateBody, {
        axis,
        entrySide: playerBody.position[axis] < center ? -1 : 1
      });
    }
  }

  checkWallCrossings(actor = this.player, crossings = this.pendingCrossings, isEnemy = false) {
    if (this.playerWon || this.restarting) return;
    const playerBounds = actor.body.bounds;
    for (const [gate, crossing] of crossings) {
      const { axis, entrySide } = crossing;
      const along = axis === 'x' ? 'y' : 'x';
      const bounds = gate.bounds;
      // Leaving around an end or returning to the entry side is not a crossing.
      const besideWall = playerBounds.max[along] < bounds.min[along] ||
        playerBounds.min[along] > bounds.max[along];
      const returned = entrySide === -1
        ? playerBounds.max[axis] < bounds.min[axis]
        : playerBounds.min[axis] > bounds.max[axis];
      if (besideWall || returned) {
        crossings.delete(gate);
        continue;
      }
      const cleared = entrySide === -1
        ? playerBounds.min[axis] > bounds.max[axis]
        : playerBounds.max[axis] < bounds.min[axis];
      if (!cleared) continue;
      crossings.delete(gate);
      const color = gate.gameObject.color;
      if (isEnemy) {
        if (this.enemyColor === color) {
          this.respawnEnemy();
          return;
        }
        this.enemyColor = color;
        this.enemy.setFillStyle(color === 'red' ? 0xef4444 : 0x2563eb);
        this.enemyRepathAt = 0;
        continue;
      }
      this.lastWallColor = color;
      if (this.playerColor === color) {
        this.resetPlayer(this.player.body);
        return;
      }
      this.playerColor = color;
      this.player.setTint(color === 'red' ? 0xff0000 : 0x0000ff);
      if (gate.gameObject.isExit && axis === 'y' && entrySide === -1) {
        this.completeLevel();
        return;
      }
    }
  }

  createEnemy() {
    this.enemyNavigator = new EnemyNavigator(this.wallData, this.gateData);
    const opposite = { x: 600 - this.levelStart.x, y: 600 - this.levelStart.y };
    this.enemySpawn = this.enemyNavigator.nearest(opposite, true);
    const circle = this.add.circle(this.enemySpawn.x, this.enemySpawn.y, 12, 0xffffff)
      .setStrokeStyle(3, 0x7c3aed).setDepth(3);
    this.enemy = this.matter.add.gameObject(circle, {
      shape: { type: 'circle', radius: 12 }, frictionAir: 0, restitution: 0
    });
    this.enemy.body.label = 'enemy';
    this.enemyCrossings = new Map();
    this.respawnEnemy();
    this.add.text(620, 330, 'Avoid the circle!\nIt follows the same\nred / blue rules.', {
      fontFamily: 'Arial', fontSize: 18, color: '#7c3aed'
    });
  }

  respawnEnemy() {
    this.enemy.setPosition(this.enemySpawn.x, this.enemySpawn.y);
    this.enemy.setVelocity(0);
    this.enemy.setFillStyle(0xffffff);
    this.enemyColor = 'white';
    this.enemyCrossings.clear();
    this.enemyPath = [];
    this.enemyRepathAt = 0;
  }

  updateEnemy() {
    this.enemy.setVelocity(0);
    if (this.playerWon || this.restarting) return;
    const now = Date.now();
    if (now >= this.enemyRepathAt) {
      // Navigation anticipates a gate whose center has been crossed; the
      // actual color changes only after the whole circle clears that gate.
      let plannedColor = this.enemyColor;
      for (const [gate, { axis, entrySide }] of this.enemyCrossings) {
        const center = (gate.bounds.min[axis] + gate.bounds.max[axis]) / 2;
        if ((this.enemy.body.position[axis] - center) * entrySide < 0) plannedColor = gate.gameObject.color;
      }
      this.enemyPath = this.enemyNavigator.route(this.enemy, this.player, plannedColor);
      // If no legal route remains, keep pursuing; the normal crossing check
      // will respawn the enemy if that pursuit repeats its current color.
      if (!this.enemyPath.length) this.enemyPath = this.enemyNavigator.route(this.enemy, this.player, 'white');
      this.enemyRepathAt = now + 500;
    }
    while (this.enemyPath.length && Math.hypot(this.enemyPath[0].x - this.enemy.x, this.enemyPath[0].y - this.enemy.y) < 2) this.enemyPath.shift();
    const target = this.enemyPath[0];
    if (!target) return;
    const dx = target.x - this.enemy.x, dy = target.y - this.enemy.y;
    const distance = Math.hypot(dx, dy);
    const speed = Math.min(0.85, distance);
    this.enemy.setVelocity(dx / distance * speed, dy / distance * speed);
  }

  completeLevel() {
    if (this.startTimer) this.elapsedTime = Date.now() - this.startTime;
    if (this.highScore == 0 || this.elapsedTime < this.highScore) {
      this.highScore = this.elapsedTime;
      localStorage.setItem(this.scoreKey, this.highScore);
    }
    localStorage.setItem(this.scoreKey + ':complete', 'true');
    this.resetPlayer(this.player.body);
    this.lastWallColor = null;
    this.playerWon = true;
    this.enemy.setVelocity(0);
    this.completeText.setVisible(true);
    this.time.delayedCall(1500, () => {
      this.scene.start('Hub');
    });
  }

  getRootBody(body) {
    if (body.parent === body) {
      return body;
    }
    while (body.parent !== body) {
      body = body.parent;
    }
    return body;
  }

  update() {
    if (this.restarting) return;
    this.checkWallCrossings();
    this.checkWallCrossings(this.enemy, this.enemyCrossings, true);
    this.updateEnemy();
    this.player.setVelocity(0);
    const lastColor = this.lastWallColor;
    this.lastWallText.setText('Last wall: ' + (lastColor || 'None'));
    this.lastWallText.setColor(lastColor || '#333333');

    this.updateScore();
    if (this.playerWon) return;
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-1);
      this.playerDirection = 'left';
      if (!this.startTimer) {
        this.startTimer = true;
        this.startTime = new Date().getTime();
      }
    }
    else if (this.cursors.right.isDown) {
      this.player.setVelocityX(1);
      this.playerDirection = 'right';
      if (!this.startTimer) {
        this.startTimer = true;
        this.startTime = new Date().getTime();
      }
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-1);
      this.playerDirection = 'up';
      if (!this.startTimer) {
        this.startTimer = true;
        this.startTime = new Date().getTime();
      }
    }
    else if (this.cursors.down.isDown) {
      this.player.setVelocityY(1);
      this.playerDirection = 'down';
      if (!this.startTimer) {
        this.startTimer = true;
        this.startTime = new Date().getTime();
      }
    }
  }
  updateScore() {
    this.highScoreText.setText('BEST: ' + (this.highScore ? Math.floor(this.highScore / 1000) + 's' : '--'));
    if (this.startTimer) {
      var now = new Date().getTime();
      this.elapsedTime = now - this.startTime;
    }
    this.timerText.setText('TIMER: ' + Math.floor(this.elapsedTime / 1000) + 's');
  }

  resetPlayer(gate) {
    this.player.x = this.player.scene.levelStart.x;
    this.player.y = this.player.scene.levelStart.y;
    gate.gameObject.setTint(0xffffff);
    this.playerColor = 'white';
    this.hitExit = false;
    this.player.scene.pendingCrossings.clear();
    this.player.setVelocity(0);
    this.elapsedTime = 0;
    this.startTimer = false;
    this.respawnEnemy();
  }

}

// A small navigation grid, with color included in each search state.
export class EnemyNavigator {
  constructor(walls, gates) {
    this.walls = walls.map(w => w.shape);
    this.gates = gates.map(g => ({
      color: g.color, axis: g.direction === 'horizontal' ? 'y' : 'x',
      min: { x: Math.min(...g.shape.filter((_, i) => i % 2 === 0)), y: Math.min(...g.shape.filter((_, i) => i % 2 === 1)) },
      max: { x: Math.max(...g.shape.filter((_, i) => i % 2 === 0)), y: Math.max(...g.shape.filter((_, i) => i % 2 === 1)) }
    }));
    this.nodes = [];
    const grid = new Map();
    for (let y = 15; y <= 585; y += 15) for (let x = 15; x <= 585; x += 15) {
      const point = { x, y, id: this.nodes.length, edges: [] };
      if (!this.clear(point)) continue;
      this.nodes.push(point);
      grid.set(`${x},${y}`, point);
    }
    for (const node of this.nodes) for (const [dx, dy] of [[15, 0], [-15, 0], [0, 15], [0, -15]]) {
      const other = grid.get(`${node.x + dx},${node.y + dy}`);
      if (other && this.segmentClear(node, other)) node.edges.push({ node: other, colors: this.crossedColors(node, other) });
    }
  }

  clear(point) {
    if (point.x < 14 || point.x > 586 || point.y < 14 || point.y > 586) return false;
    return !this.walls.some(shape => {
      let inside = false;
      for (let i = 0, j = shape.length - 2; i < shape.length; j = i, i += 2) {
        const ax = shape[j], ay = shape[j + 1], bx = shape[i], by = shape[i + 1];
        if ((ay > point.y) !== (by > point.y) && point.x < (bx - ax) * (point.y - ay) / (by - ay) + ax) inside = !inside;
        const length = (bx - ax) ** 2 + (by - ay) ** 2;
        const t = length ? Math.max(0, Math.min(1, ((point.x - ax) * (bx - ax) + (point.y - ay) * (by - ay)) / length)) : 0;
        if (Math.hypot(point.x - ax - t * (bx - ax), point.y - ay - t * (by - ay)) < 14) return true;
      }
      return inside;
    });
  }

  segmentClear(a, b) {
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4));
    for (let i = 0; i <= steps; i++) if (!this.clear({ x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps })) return false;
    return true;
  }

  crossedColors(a, b) {
    const crossed = [];
    for (const gate of this.gates) {
      const axis = gate.axis, along = axis === 'x' ? 'y' : 'x';
      const center = (gate.min[axis] + gate.max[axis]) / 2;
      if ((a[axis] <= center) === (b[axis] <= center)) continue;
      const t = (center - a[axis]) / (b[axis] - a[axis]);
      const position = a[along] + t * (b[along] - a[along]);
      if (position >= gate.min[along] && position <= gate.max[along]) crossed.push({ t, color: gate.color });
    }
    return crossed.sort((a, b) => a.t - b.t).map(g => g.color);
  }

  nextColor(color, colors) {
    for (const next of colors) {
      if (color === next) return null;
      color = next;
    }
    return color;
  }

  nearest(point, spawning = false) {
    const sorted = [...this.nodes].sort((a, b) => Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y));
    return sorted.find(node => spawning
      ? !this.gates.some(g => node.x + 14 >= g.min.x && node.x - 14 <= g.max.x && node.y + 14 >= g.min.y && node.y - 14 <= g.max.y)
      : this.segmentClear(point, node)) || (spawning ? sorted[0] : null);
  }

  route(from, to, color) {
    const start = this.nearest(from), target = this.nearest(to);
    if (!start || !target) return [];
    color = this.nextColor(color, this.crossedColors(from, start));
    if (!color) return [];
    const queue = [{ node: start, color, parent: null }];
    const seen = new Set([`${start.id}:${color}`]);
    for (let i = 0; i < queue.length; i++) {
      const current = queue[i];
      if (current.node === target) {
        const path = [];
        for (let p = current; p; p = p.parent) path.unshift(p.node);
        if (this.nextColor(current.color, this.crossedColors(target, to))) path.push({ x: to.x, y: to.y });
        return path;
      }
      for (const edge of current.node.edges) {
        const next = this.nextColor(current.color, edge.colors);
        const key = `${edge.node.id}:${next}`;
        if (!next || seen.has(key)) continue;
        seen.add(key);
        queue.push({ node: edge.node, color: next, parent: current });
      }
    }
    return [];
  }
}

export class HubScene extends GameScene {
  constructor() {
    super('Hub');
  }

  create() {
    this.createHub();
  }

  update() { }
}
