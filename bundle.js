(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict;"

/* Classes */
const Game = require('./game.js');
const Player = require('./player.js');
const Vector = require('./vector');

/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var player = new Player({x: canvas.width/2, y: canvas.height/2}, canvas);
var death = new Audio();
death.src = 'assets/death.wav';
var hit = new Audio();
hit.src = 'assets/hit.wav';
hit.volume = 0.25;
var destroy = new Audio();
destroy.src = 'assets/destroy.wav';
var initialAsteroids = 10;
var asteroidsLeft = initialAsteroids*2;
var axisList = [];
var asteroids = [];
var lives = 3;
var score = 0;
var level = 1;
placeAsteroids();

/**
 * @function masterLoop
 * Advances the game in sync with the refresh rate of the screen
 * @param {DOMHighResTimeStamp} timestamp the current time
 */
var masterLoop = function(timestamp) {
  game.loop(timestamp);
  window.requestAnimationFrame(masterLoop);
}
masterLoop(performance.now());
function placeAsteroids()
{
	for (var i = 0; i < initialAsteroids; i++)
	{
		var x = Math.floor(Math.random()*canvas.width);
		var y = Math.floor(Math.random()*canvas.height);
		asteroids.push({
			position: {x: x, y: y},
			mass: Math.floor(Math.random()*10 + 5),
			angle: Math.floor(Math.random()*6),
			speed: 0.8,
			radius: 32,
			index: i,
			destroyed: false,
			velocity: {x:0, y:0}
		});
		asteroids[i].velocity.x = Math.sin(asteroids[i].angle) * asteroids[i].speed;
		asteroids[i].velocity.y = Math.cos(asteroids[i].angle) * asteroids[i].speed;
		axisList.push(asteroids[i]);
	}
	axisList.push(player);
	axisList.sort(function(a,b){return a.position.x - b.position.x});
}
function restart()
{
	initialAsteroids = 10;
	asteroidsLeft = initialAsteroids*2;
	axisList = [];
	asteroids = [];
	lives = 3;
	score = 0;
	level = 1;
	placeAsteroids();
}

/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {
	player.update(elapsedTime);
	// TODO: Update the game objects
	asteroids.forEach(function(asteroid, index)
	{
		asteroid.color = 'white';
		// Apply velocity
		asteroid.position.x += asteroid.velocity.x;
		asteroid.position.y += asteroid.velocity.y;

		// Wrap around the screen
		if(asteroid.position.x < 0 && !asteroid.destroyed) asteroid.position.x += canvas.width;
		if(asteroid.position.x > canvas.width && !asteroid.destroyed) asteroid.position.x -= canvas.width;
		if(asteroid.position.y < 0 && !asteroid.destroyed) asteroid.position.y += canvas.height;
		if(asteroid.position.y > canvas.height && !asteroid.destroyed) asteroid.position.y -= canvas.height;
		
	});
	
	axisList.sort(function(a,b){return a.position.x - b.position.x});
	

	//Array of shots that could be hitting asteroids
	var potentialShots = [];
	
	//Check if shots might hit asteroids
	player.shots.forEach(function(shot, sindex){
		axisList.forEach(function(asteroid, aindex){
			if( Math.abs(asteroid.position.x - shot.position.x)  < asteroid.radius + 1)
			{
				potentialShots.push({shot: shot, sindex: sindex, asteroid: asteroid, aindex: aindex});
			}
		});
	});
	
	var shotCollisions = [];
	potentialShots.forEach(function(pair){
		var distSquared =
		  Math.pow(pair.shot.position.x - pair.asteroid.position.x, 2) +
		  Math.pow(pair.shot.position.y - pair.asteroid.position.y, 2);

		if(distSquared < Math.pow(pair.asteroid.radius + 1, 2)) {
		  // Push the colliding pair into the shot collisions array
		  if(pair.asteroid != player) shotCollisions.push(pair);	  
		}
	});
	
	shotCollisions.forEach(function(pair) 
	{
		destroy.play();
		player.shots.splice(pair.sindex, 1);

		if(pair.asteroid.radius <= 16)
		{

			pair.asteroid.destroyed = true;			
			pair.asteroid.velocity.x = 0;
			pair.asteroid.velocity.y = 0;
			pair.asteroid.position.x = -50;
			score += 50;
			asteroidsLeft--;
		}
		else
		{
			var acceleration = {
				x: Math.sin(pair.asteroid.angle-0.5),
				y: Math.cos(pair.asteroid.angle-0.5)
			}

			asteroids.push(
			{
				position: {x: pair.asteroid.position.x, y: pair.asteroid.position.y},
				mass: Math.floor(Math.random()*10 + 5),
				angle: pair.asteroid.angle-0.5,
				speed: 0.8,
				radius: 16,
				index: asteroids.length,
				velocity: {x: acceleration.x, y: acceleration.y}
			});	

			axisList.push(asteroids[asteroids.length - 1]);
			pair.asteroid.radius = 16;
			pair.asteroid.angle += 0.5;
			acceleration = {
				x: Math.sin(pair.asteroid.angle),
				y: Math.cos(pair.asteroid.angle)
			}
			pair.asteroid.velocity.x = acceleration.x;
			pair.asteroid.velocity.y = acceleration.y;
		}
		
		if(asteroidsLeft <= 0)
		{
			level++;
			axisList = [];
			asteroids = [];
			initialAsteroids += 2;
			asteroidsLeft = initialAsteroids*2;
			placeAsteroids();
		}
	});
	
	//Array of asteroids being considered for collision
	var active = [];

	//Array of asteroids that could be colliding 
	var potentiallyColliding = [];

	axisList.forEach(function(asteroid, aindex){
		//Filter out asteroids that are too far away to collide
		//with the current asteroid.
		active = active.filter(function(oasteroid){
		  return asteroid.position.x - oasteroid.position.x  < asteroid.radius + oasteroid.radius;
		});
		//Any asteroids left on the active array could be colliding,
		//so add them to the potentiallyColliding array.
		active.forEach(function(oasteroid, bindex){
		  potentiallyColliding.push({a: oasteroid, b: asteroid});
		});

		active.push(asteroid);
	});
	
	//Check if collisions are actually happening
	var collisions = [];

	potentiallyColliding.forEach(function(pair){
		var distSquared =
		  Math.pow(pair.a.position.x - pair.b.position.x, 2) +
		  Math.pow(pair.a.position.y - pair.b.position.y, 2);

		if(distSquared < Math.pow(pair.a.radius + pair.b.radius, 2)) {
		  // Push the colliding pair into the asteroid collisions array
		  if(pair.b != player && pair.a != player) collisions.push(pair);
		  else if(player.invulnTime <= 0)
		  {
			lives--;
			death.play();
			if(lives == 0)
			{
				restart();
			}
			player.respawn();
		  }
		}
	});

	// Process asteroid collisions
	collisions.forEach(function(pair) {
		hit.play();
		// Find the normal of collision
		var collisionNormal = {
		  x: pair.a.position.x - pair.b.position.x,
		  y: pair.a.position.y - pair.b.position.y
		}
		// calculate the overlap between asteroids
		var overlap = pair.a.radius + pair.b.radius + 4 - Vector.magnitude(collisionNormal);
		var collisionNormal = Vector.normalize(collisionNormal);
		pair.a.position.x += collisionNormal.x * overlap / 2;
		pair.a.position.y += collisionNormal.y * overlap / 2;
		pair.b.position.x -= collisionNormal.x * overlap / 2;
		pair.b.position.y -= collisionNormal.y * overlap / 2;
		// Rotate the problem space so that the normal
		// of collision lies along the x-axis
		var angle = Math.atan2(collisionNormal.y, collisionNormal.x);
		var a = Vector.rotate(pair.a.velocity, angle);
		var b = Vector.rotate(pair.b.velocity, angle);
		// Solve the collision along the x-axis
		var s = a.x;
		a.x = b.x;
		b.x = s;
		// Rotate the problem space back to world space
		a = Vector.rotate(a, -angle);
		b = Vector.rotate(b, -angle);
		pair.a.velocity.x = a.x;
		pair.a.velocity.y = a.y;
		pair.b.velocity.x = b.x;
		pair.b.velocity.y = b.y;
	});
}

/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {DOMHighResTimeStamp} elapsedTime indicates
  * the number of milliseconds passed since the last frame.
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function render(elapsedTime, ctx) {

	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	//Render the player
	player.render(elapsedTime, ctx);
	
	//Render the asteroids
	asteroids.forEach(function(asteroid, index)
	{
		ctx.beginPath();
		
		ctx.strokeStyle = asteroid.color;
		ctx.lineWidth=5;
		ctx.arc(asteroid.position.x,asteroid.position.y,asteroid.radius,0,2*Math.PI);
		ctx.stroke();
		ctx.fill();
		
		ctx.closePath();
	});
  
	//Render the lives left
	ctx.strokeStyle = 'white';
	ctx.lineWidth = 2;
	ctx.fillRect(15, canvas.height - 35, 80, 30);  
	ctx.strokeRect(15, canvas.height - 35, 80, 30);
	ctx.lineWidth = 1;
	for(var i = 0; i < lives; i++)
	{ 
		ctx.beginPath();
		ctx.moveTo(30 + 25*i, canvas.height - 30);
		ctx.lineTo(20 + 25*i, canvas.height - 10);
		ctx.lineTo(30 + 25*i, canvas.height - 20);
		ctx.lineTo(40 + 25*i, canvas.height - 10);
		ctx.closePath();
		ctx.stroke();
	}
	
	//Render the level and score
	ctx.lineWidth = 2;
	ctx.fillStyle = 'black';	
	ctx.fillRect(665, canvas.height - 35, 80, 30);  
	ctx.fillRect(15, 5, 80, 30);  
	ctx.strokeRect(665, canvas.height - 35, 80, 30);
	ctx.strokeRect(15, 5, 80, 30);
	ctx.fillStyle = 'white';
	ctx.font="20px Verdana";
	ctx.fillText(score, 698, canvas.height - 12, 40);
	ctx.fillText("Level " + level, 20, 27, 70);
	
}

},{"./game.js":2,"./player.js":3,"./vector":4}],2:[function(require,module,exports){
"use strict";

/**
 * @module exports the Game class
 */
module.exports = exports = Game;

/**
 * @constructor Game
 * Creates a new game object
 * @param {canvasDOMElement} screen canvas object to draw into
 * @param {function} updateFunction function to update the game
 * @param {function} renderFunction function to render the game
 */
function Game(screen, updateFunction, renderFunction) {
  this.update = updateFunction;
  this.render = renderFunction;

  // Set up buffers
  this.frontBuffer = screen;
  this.frontCtx = screen.getContext('2d');
  this.backBuffer = document.createElement('canvas');
  this.backBuffer.width = screen.width;
  this.backBuffer.height = screen.height;
  this.backCtx = this.backBuffer.getContext('2d');

  // Start the game loop
  this.oldTime = performance.now();
  this.paused = false;
}

/**
 * @function pause
 * Pause or unpause the game
 * @param {bool} pause true to pause, false to start
 */
Game.prototype.pause = function(flag) {
  this.paused = (flag == true);
}

/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
Game.prototype.loop = function(newTime) {
  var game = this;
  var elapsedTime = newTime - this.oldTime;
  this.oldTime = newTime;

  if(!this.paused) this.update(elapsedTime);
  this.render(elapsedTime, this.frontCtx);

  // Flip the back buffer
  this.frontCtx.drawImage(this.backBuffer, 0, 0);
}

},{}],3:[function(require,module,exports){
"use strict";

const MS_PER_FRAME = 1000/8;

/**
 * @module exports the Player class
 */
module.exports = exports = Player;

/**
 * @constructor Player
 * Creates a new player object
 * @param {Postition} position object specifying an x and y
 */
function Player(position, canvas) {
  this.worldWidth = canvas.width;
  this.worldHeight = canvas.height;
  this.state = "idle";
  this.shoot = new Audio();
  this.shoot.src = 'assets/shoot.wav';
  this.position = {
    x: position.x,
    y: position.y
  };
  this.velocity = {
    x: 0,
    y: 0
  }
  this.maxVelocity = 
  {
	x: 1,
	y: 1
  }
  this.minVelocity = 
  {
	x: -1,
	y: -1
  }
  this.asteroidVelocity = 
  {
	  x: 0,
	  y: 0
  }
  this.angle = 0;
  this.radius  = 14;
  this.thrusting = false;
  this.steerLeft = false;
  this.steerRight = false;
  this.shooting = false;
  this.shots = [];
  this.shotDelay = 250;
  this.shotTimer = this.shotDelay;
  this.shotSpeed = 8;
  this.lives = 3;
  this.invulnTime = 100;
  var self = this;
  window.onkeydown = function(event) {
    switch(event.key) {
      case 'ArrowUp': // up
      case 'w':
        self.thrusting = true;
		event.preventDefault();
        break;
      case 'ArrowLeft': // left
      case 'a':
        self.steerLeft = true;
		event.preventDefault();
        break;
      case 'ArrowRight': // right
      case 'd':
        self.steerRight = true;
		event.preventDefault();
        break;
	  case ' ': //shoot (space)
		self.shooting = true;
		event.preventDefault();
		break;
	  case 'ArrowDown':
	  case 's':
		event.preventDefault();
		break;
    }
  }

  window.onkeyup = function(event) {
    switch(event.key) {
      case 'ArrowUp': // up
      case 'w':
        self.thrusting = false;
        break;
      case 'ArrowLeft': // left
      case 'a':
        self.steerLeft = false;
        break;
      case 'ArrowRight': // right
      case 'd':
        self.steerRight = false;
        break;
	  case ' ': //shoot (space)
	  self.shooting = false;
	  break;
    }
  }
}

Player.prototype.respawn = function()
{
	this.position.x = this.worldWidth/2;
	this.position.y = this.worldHeight/2;
	this.velocity.x = 0.0;
	this.velocity.y = 0.0;
	this.invulnTime = 100;
	this.angle = 0;
}

/**
 * @function updates the player object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Player.prototype.update = function(time) {
	this.shotTimer+=time;
	if(this.invulnTime > 0) this.invulnTime--;
  // Apply angular velocity
  if(this.steerLeft) {
    this.angle += time * 0.005;
  }
  if(this.steerRight) {
    this.angle -= 0.1;
  }
  // Apply acceleration
  if(this.thrusting) {
    var acceleration = {
      x: Math.sin(this.angle),
      y: Math.cos(this.angle)
    }

	if(acceleration.x > 0) //Moving left
	{
		if(this.velocity.x > this.minVelocity.x) this.velocity.x -= acceleration.x;
	}
	else if(acceleration.x < 0) //Moving right
	{
		if(this.velocity.x < this.maxVelocity.x) this.velocity.x -= acceleration.x;
	}
	if(acceleration.y > 0) //Moving up
	{
		if(this.velocity.y > this.minVelocity.y) this.velocity.y -= acceleration.y;
	}
	else if(acceleration.y < 0) //Moving down
	{
		if(this.velocity.y < this.maxVelocity.y) this.velocity.y -= acceleration.y;
	}
  }
  
  if(this.shooting)
  {
	if(this.shotTimer >= this.shotDelay)
	{
		this.shoot.play();
		var acceleration = {
			x: Math.sin(this.angle),
			y: Math.cos(this.angle)
		}
		this.shotTimer = 0;
		this.shots.push({
			index: this.shots.length,
			start: 
			{
				x: this.position.x, 
				y: this.position.y
			},			
			velocity:
			{
				x: - acceleration.x * this.shotSpeed,
				y: - acceleration.y * this.shotSpeed
			},
			position: 
			{
				x: this.position.x + acceleration.x * -this.shotSpeed, 
				y: this.position.y + acceleration.y * -this.shotSpeed
			}

		});
	}
  }
  
  var self = this;
  //Update shot positions
  this.shots.forEach(function(shot, index)
  {
		shot.start.x = shot.position.x;
		shot.start.y = shot.position.y;
		shot.position.x += shot.velocity.x;
		shot.position.y += shot.velocity.y;
		if(shot.position.x < 0 || shot.position.x > self.worldWidth
			|| shot.position.y < 0 || shot.position.y > self.worldHeight)
		{
			self.shots.splice(index, 1);
		}
  });
  
  // Apply velocity
  this.position.x += this.velocity.x;
  this.position.y += this.velocity.y;
  
  // Wrap around the screen
  if(this.position.x < 0) this.position.x += this.worldWidth;
  if(this.position.x > this.worldWidth) this.position.x -= this.worldWidth;
  if(this.position.y < 0) this.position.y += this.worldHeight;
  if(this.position.y > this.worldHeight) this.position.y -= this.worldHeight;
}

/**
 * @function renders the player into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Player.prototype.render = function(time, ctx) {
  ctx.save();
  ctx.lineWidth = 1;
  //Draw the player's shots
  this.shots.forEach(function(shot, index)
  {
	  ctx.beginPath();
	  ctx.moveTo(shot.start.x, shot.start.y);
	  ctx.lineTo(shot.position.x, shot.position.y);
	  ctx.closePath();
	  ctx.strokeStyle = 'white';
	  ctx.stroke();
  });
  
  // Draw player's ship
  ctx.translate(this.position.x, this.position.y);
  ctx.rotate(-this.angle);
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(-10, 10);
  ctx.lineTo(0, 0);
  ctx.lineTo(10, 10);
  ctx.closePath();
  ctx.strokeStyle = 'white';
  ctx.stroke();
  
  // Draw engine thrust
  if(this.thrusting) {
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(5, 10);
    ctx.arc(0, 10, 5, 0, Math.PI, true);
    ctx.closePath();
    ctx.strokeStyle = 'orange';
    ctx.stroke();
  }
  ctx.restore();
  
}

},{}],4:[function(require,module,exports){
/**
 * @module Vector
 * A library of vector functions.
 */
module.exports = exports = {
  rotate: rotate,
  dotProduct: dotProduct,
  magnitude: magnitude,
  normalize: normalize
}

/**
 * @function rotate
 * Rotates a vector about the Z-axis
 * @param {Vector} a - the vector to rotate
 * @param {float} angle - the angle to roatate by (in radians)
 * @returns a new vector representing the rotated original
 */
function rotate(a, angle) {
  return {
    x: a.x * Math.cos(angle) - a.y * Math.sin(angle),
    y: a.x * Math.sin(angle) + a.y * Math.cos(angle)
  }
}

/**
 * @function dotProduct
 * Computes the dot product of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed dot product
 */
function dotProduct(a, b) {
  return a.x * b.x + a.y * b.y
}

/**
 * @function magnitude
 * Computes the magnitude of a vector
 * @param {Vector} a the vector
 * @returns the calculated magnitude
 */
function magnitude(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
}

/**
 * @function normalize
 * Normalizes the vector
 * @param {Vector} a the vector to normalize
 * @returns a new vector that is the normalized original
 */
function normalize(a) {
  var mag = magnitude(a);
  return {x: a.x / mag, y: a.y / mag};
}

},{}]},{},[1]);
