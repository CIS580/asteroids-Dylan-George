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
