(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict;"

/* Classes */
const Game = require('./game.js');
const Player = require('./player.js');

/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var player = new Player({x: canvas.width/2, y: canvas.height/2}, canvas);

var initialAsteroids = 10;
var axisList = [];
var asteroids = [];
for (var i = 0; i < initialAsteroids; i++)
{
	var x = Math.floor(Math.random()*canvas.width);
	var y = Math.floor(Math.random()*canvas.height);
	asteroids.push({
		position: {x: x, y: y},
		angle: Math.floor(Math.random()*360),
		mass: Math.floor(Math.random()*10 + 5),
		size: "full",
		angle: Math.floor(Math.random()*6),
		speed: 0.8,
		velocity: {x:0, y:0}
	});
	asteroids[i].velocity.x = Math.sin(asteroids[i].angle) * asteroids[i].speed;
	asteroids[i].velocity.y = Math.cos(asteroids[i].angle) * asteroids[i].speed;
	axisList.push(asteroids[i]);
}

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
	// Apply velocity
	asteroid.position.x += asteroid.velocity.x;
	asteroid.position.y += asteroid.velocity.y;

	// Wrap around the screen
	if(asteroid.position.x < 0) asteroid.position.x += canvas.width;
	if(asteroid.position.x > canvas.width) asteroid.position.x -= canvas.width;
	if(asteroid.position.y < 0) asteroid.position.y += canvas.height;
	if(asteroid.position.y > canvas.height) asteroid.position.y -= canvas.height;
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
  player.render(elapsedTime, ctx);
  
  asteroids.forEach(function(asteroid, index)
  {
	ctx.beginPath();
	ctx.strokeStyle = "white";

	if(asteroid.size == "full")
	{	
		ctx.lineWidth=5;
		ctx.arc(asteroid.position.x,asteroid.position.y,32,0,2*Math.PI);
		ctx.stroke();
		ctx.fill();
	}
	else if(asteroid.size == "half")
	{
		ctx.lineWidth=2.5;
		ctx.arc(asteroid.position.x,asteroid.position.y,16,0,2*Math.PI);
		ctx.stroke();
		ctx.fill();
	}	
	ctx.closePath();
  });
}

},{"./game.js":2,"./player.js":3}],2:[function(require,module,exports){
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
  this.radius  = 64;
  this.thrusting = false;
  this.steerLeft = false;
  this.steerRight = false;
  this.shooting = false;
  this.shots = [];
  this.shotDelay = 250;
  this.shotTimer = this.shotDelay;
  this.shotSpeed = 8;
  
  var self = this;
  window.onkeydown = function(event) {
    switch(event.key) {
      case 'ArrowUp': // up
      case 'w':
        self.thrusting = true;
        break;
      case 'ArrowLeft': // left
      case 'a':
        self.steerLeft = true;
        break;
      case 'ArrowRight': // right
      case 'd':
        self.steerRight = true;
        break;
	  case ' ': //shoot (space)
		self.shooting = true;
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



/**
 * @function updates the player object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Player.prototype.update = function(time) {
	this.shotTimer+=time;

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
		var acceleration = {
			x: Math.sin(this.angle),
			y: Math.cos(this.angle)
		}
		this.shotTimer = 0;
		this.shots.push({
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
			end: 
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
		shot.start.x = shot.end.x;
		shot.start.y = shot.end.y;
		shot.end.x += shot.velocity.x;
		shot.end.y += shot.velocity.y;
		if(shot.end.x < 0 || shot.end.x > self.worldWidth
			|| shot.end.y < 0 || shot.end.y > self.worldHeight)
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
	  ctx.lineTo(shot.end.x, shot.end.y);
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

},{}]},{},[1]);
