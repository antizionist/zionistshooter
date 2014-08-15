var doc = document;
doc.byId = doc.getElementById;

$(function () {
	var canvas = doc.byId("canvas");

	function startGame(images, values) {
		if (doc.body.offsetHeight > doc.body.offsetWidth) {//TODO: write message to user
			setTimeout(function () {
				startGame(images, values)
			}, 200);
			return;
		}
		canvas.height = doc.body.offsetHeight * window.devicePixelRatio;
		canvas.width = doc.body.offsetWidth * window.devicePixelRatio;
		game.width = doc.body.offsetWidth * window.devicePixelRatio;
		game.height = doc.body.offsetHeight * window.devicePixelRatio;

		scaleImagesAndValues(images, canvas, values);
		//TODO: start screen
		game.init(new Engine(canvas), images, values);
		if ('ontouchstart' in document.documentElement) {
			$(doc.body).bind('touchstart', game.touchHandler);
		} else {
			$(canvas).bind('click', game.touchHandler);
		}
	}

	var images = ['back.jpg', 'enemy.png', 'enemy-dead.png', 'weapon.png', 'weapon-fire.png', 'hud-score.png', 'hud-life.png', 'fire-splash.png', 'enemy-shooting.png'];
	//var levelBackgrounds = ['back2.jpg', 'back3.jpg'];

	$.when.apply($, images.map($.loadImage)).then(function (background, enemy, enemyDead, weapon, weaponFire, hudScore, hudLife, fireSplash, enemyShooting) {
		var images = {background: background, enemy: enemy, enemyDead: enemyDead,
			enemyShooting: enemyShooting, weapon: weapon, weaponFire: weaponFire,
			hudScore: hudScore, hudLife: hudLife, fireSplash: fireSplash};
		$.when.apply($,levelBackgrounds.map($.loadImage)).then(function(){
			var backgrounds = Array.prototype.slice.call(arguments);
			images.backgrounds = backgrounds;
			var values = {lifeX: 180, lifeY: 70, scoreX: 210, scoreY: 70, fontSize: 65, baseWalkRange: 1};
			startGame(images, values);
		});
	});
});

function scaleImagesAndValues(images, canvas, values) {
	var sampleWidth = 0.25 * canvas.width;
	var realWidth = images.hudScore.width;
	scaleFactor = sampleWidth / realWidth;
	for (var i in images) {
		if (!images.hasOwnProperty(i)) continue;
		if (i == 'background') continue;
		images[i].height *= scaleFactor;
		images[i].width *= scaleFactor;
	}
	for (i in values) {
		if (!values.hasOwnProperty(i)) continue;
		values[i] *= scaleFactor;
	}

}

var game = {
	width: null,
	height: null,
	engine: null,
	images: null,
	values: null,
	init: function (engine, images, values) {
		game.engine = engine;
		game.images = images;
		game.values = values;
		game.engine.setBackground(game.images.background);
		game.weapon.drawWeapon();
		game.hud.drawHud();
		game.engine.start();
		game.start();
	},
	start: function () {
		game.hud.setLife(game.hud.MAX_LIFE);
		game.hud.setScore(0);
		game.startSpawningCycle();
	},
	ended: false,
	levelUpProcess: false,
	currentLevel:0,
	scoreToLevelUp:100,
	levelUp:function(){
		if (game.ended || game.levelUpProcess) return;
		game.levelUpProcess = true;
		game.stopSpawningCycle();
		game.spawner.killAll();
		game.SPAWN_INTERVAL -= 200;
		if(game.SPAWN_INTERVAL < 500) game.SPAWN_INTERVAL = 500;
		game.values.baseWalkRange++;
		game.currentLevel++;
		game.scoreToLevelUp += 100 + game.currentLevel*20;

		game.hud.setLife(game.hud.MAX_LIFE);
		var overlay = game.engine.addRectObject("rgba(100,100,100,0.6)",0,0,game.width, game.height, 50);
		var levelUpText = game.engine.addTextObject('Level UP!',0,0,51);
		levelUpText.setFontOptions("#cca747","bold " + (game.values.fontSize | 0)*2 + "px sans-serif");
		levelUpText.measureText();
		levelUpText.moveTo(game.width/2-(levelUpText.width/2),game.height/2+(levelUpText.height/2));

		setTimeout(function(){
			if(game.images.backgrounds.length >= game.currentLevel){
				game.engine.setBackground(game.images.backgrounds[game.currentLevel-1]);
			}
			overlay.remove();
			levelUpText.remove();
			game.startSpawningCycle();
			game.levelUpProcess = false;
		},2000);
	},
	end: function () {//TODO: end game screen
		if (game.ended) return;
		game.ended = true;
		game.stopSpawningCycle();
		game.spawner.killAll();
		var canvas = game.engine.canvas;
		setInterval(function () {
			game.engine.stop();
			canvas.fillStyle = "rgba(255,0,0,0.2)";
			canvas.fillRect(0, 0, game.width, game.height);
		}, 200);
		setTimeout(function () {
			//game.engine.stop();
			window.location = "final.html?score=" + game.hud.score;
			//alert("Game over! You earned " + game.hud.score + " points.");
		}, 1000);
	},
	touchHandler: function (e) {
		var x, y;
		if (e.type == 'touchstart') {
			var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
			x = touch.clientX;
			y = touch.clientY;
		} else {
			x = e.clientX;
			y = e.clientY;
		}
		x *= window.devicePixelRatio;
		y *= window.devicePixelRatio;
		game.weapon.renderFire(x);
		game.spawner.shoot(x, y);
		var fireImage = game.images.fireSplash;
		var splash = game.engine.addObject(fireImage,
			x - 0.5 * fireImage.width, y - 0.5 * fireImage.height);
		setTimeout(function () {
			splash.remove();
		}, 100);
		if(game.hud.score >= game.scoreToLevelUp)game.levelUp();
	},
	weapon: {
		weaponObject: null,
		drawWeapon: function () {
			var weaponImage = game.images.weapon;
			game.weapon.weaponObject = game.engine.addObject(weaponImage,
				game.width - weaponImage.width,
				game.height - weaponImage.height, 1);
		},
		renderFire: function (x) {
			var audio = new Audio('gunfire.mp3');//
			audio.play();//
			var weaponImage = game.images.weapon;
			var wX = game.width / 2 - weaponImage.width + (x / 2);
			game.weapon.weaponObject.moveTo(wX, game.height - weaponImage.height);
			game.weapon.weaponObject.setImage(game.images.weaponFire);
			setTimeout(function () {
				game.weapon.weaponObject.setImage(weaponImage);
			}, 400);
		}
	},

	hud: {
		MAX_LIFE: 100,
		lifeImageObject: null,
		scoreImageObject: null,
		lifeObject: null,
		scoreObject: null,
		life: 100,
		score: 0,
		drawHud: function () {
			game.hud.scoreImageObject = game.engine.addObject(game.images.hudScore, 0, 0, 2);
			game.hud.lifeImageObject = game.engine.addObject(game.images.hudLife,
				game.width - game.images.hudLife.width, 0, 2);
			game.hud.scoreObject = game.engine.addTextObject(game.hud.score, game.values.scoreX, game.values.scoreY, 3);
			game.hud.scoreObject.setFontOptions("#cca747", "bold " + (game.values.fontSize | 0) + "px sans-serif");
			game.hud.lifeObject = game.engine.addTextObject(game.hud.life,
				game.width - game.images.hudLife.width + game.values.lifeX, game.values.lifeY, 3);
			game.hud.lifeObject.setFontOptions("#cca747", "bold " + (game.values.fontSize | 0) + "px sans-serif");
		},
		setLife: function (value) {
			game.hud.life = value;
			game.hud.lifeObject.setText(value.toString());
		},
		setScore: function (value) {
			game.hud.score = value;
			game.hud.scoreObject.setText(value.toString());
		},
		earnScore: function (value) {
			game.hud.setScore(game.hud.score + value);
		},
		loseLife: function (value) {
			game.hud.setLife(game.hud.life - value);
			if (game.hud.life <= 0) {
				game.end();
			}
		}
	},
	SPAWN_INTERVAL: 2000,
	SPAWN_DISPERSION: 1000,
	spawnTimer: null,
	startSpawningCycle: function () {
		function getSpawnInterval() {
			return game.SPAWN_INTERVAL + Math.random() * game.SPAWN_DISPERSION - game.SPAWN_DISPERSION / 2;
		}

		function spawnNextEnemy() {
			if (game.spawner.enemies.length < 10) {
				game.spawner.spawnEnemy();
			}
			game.spawnTimer = setTimeout(spawnNextEnemy, getSpawnInterval());
		}

		spawnNextEnemy();
	},
	stopSpawningCycle: function () {
		clearTimeout(game.spawnTimer);
	},
	spawner: {
		enemies: [],
		selectEnemyPlace: function () {
			var yRange = game.height * 0.3;
			var y = game.height - Math.random() * yRange - game.images.enemy.height;
			var x = Math.random() * game.width * 0.8 + game.width * 0.1;
			return {x: x, y: y};
		},
		spawnEnemy: function () {
			var place = game.spawner.selectEnemyPlace();
			var enemy = new Enemy(game.engine.addObject(game.images.enemy, place.x, place.y, 0));
			game.spawner.enemies.push(enemy);
		},
		killAll: function () {
			for (var i = 0; i < game.spawner.enemies.length; i++) {
				game.spawner.enemies[i].kill(true);
				game.spawner.enemies.splice(i, 1);
				i--;
			}
		},
		shoot: function (x, y) {
			var height = game.images.enemy.height;
			var width = game.images.enemy.width;
			var enemies = game.spawner.enemies;
			for (var i = 0; i < enemies.length; i++) {
				var enemy = enemies[i];
				if (enemy.object.x <= x && enemy.object.y <= y) {
					if (enemy.object.x + width >= x && enemy.object.y + height >= y) {
						enemy.hit();
						if (enemy.killed) {
							enemies.splice(i, 1);
							i--;
						}
					}
				}
			}
		}
	}
};

var Enemy = function (drawObject) {
	this.object = drawObject;
	this.MAX_HP = 3;
	this.DAMAGE = 5;
	this.ACCURACY = 0.5;
	this.FIRE_DELAY = 1000;
	this.WALK_DELAY = 50;
	this.WALK_TIME = 3000;
	this.DECAY_TIME = 1000;
	this.BASE_WALK_RANGE = game.values.baseWalkRange;
	this.hp = this.MAX_HP;
	this.walkInterval = null;
	this.killed = false;
	this.walk = function () {
		var dx = (Math.random() * 6 - 3) * this.BASE_WALK_RANGE;
		var dy = (Math.random() * 2 - 1) * this.BASE_WALK_RANGE;
		var that = this;
		this.walkInterval = setInterval(function () {
			that.object.move(dx, dy);
		}, this.WALK_DELAY);
		setTimeout(function () {
			clearInterval(that.walkInterval);
		}, this.WALK_TIME);
	};
	this.walk();
	this.shootTimeout = null;
	this.shootAnimationTimeout = null;
	this.shoot = function () {
		var audio = new Audio('gunfire2.mp3');//
		audio.play();//
		var that = this;
		this.object.setImage(game.images.enemyShooting);
		this.shootAnimationTimeout = setTimeout(function () {
			that.object.setImage(game.images.enemy);
		}, 200);
		if (Math.random() > this.ACCURACY) {
			game.hud.loseLife(this.DAMAGE);
		}
		this.shootTimeout = setTimeout(function () {
			that.shoot()
		}, this.FIRE_DELAY);
	};
	this.shoot();
	this.hit = function () {
		if (this.hp == 0)return;
		this.hp--;
		if (this.hp == 0) {
			this.kill();
		}
	};
	this.kill = function (giveNoPoints) {
		this.killed = true;
		if (!giveNoPoints)game.hud.earnScore(10);
		this.object.setImage(game.images.enemyDead);
		clearInterval(this.walkInterval);
		clearTimeout(this.shootTimeout);
		clearTimeout(this.shootAnimationTimeout);
		var that = this;
		setTimeout(function () {
			that.object.remove()
		}, this.DECAY_TIME)
	};
};