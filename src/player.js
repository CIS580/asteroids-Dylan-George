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
