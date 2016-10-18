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
