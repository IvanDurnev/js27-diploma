'use strict';

class Vector {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	};
	
	plus(vector) {
		if (vector instanceof Vector) {
			return new Vector(this.x + vector.x, this.y + vector.y);
		} else {
			throw Error('Можно прибавлять к вектору только вектор типа Vector');
		}
	};
	
	times(number) {
		return new Vector(this.x * number, this.y * number);
	};
};

class Actor {
	constructor(pos = new Vector(0,0), size = new Vector(1,1), speed = new Vector(0,0)) {
		if ((pos instanceof Vector) && (size instanceof Vector) && (speed instanceof Vector)) {
			this.pos = pos;
			this.size = size;
    		this.speed = speed;
    		Object.defineProperties(this, {
      			'left': {
        			get: function(){
						return this.pos.x
					}
				},
				'top': {
					get: function(){
					return this.pos.y
					}
				},
				'right': {
					get: function(){
					return this.pos.x + this.size.x
					}
				},
				'bottom': {
					get: function(){
					return this.pos.y + this.size.y
					}
				}
			});
		} else {
			throw Error();
		}
  	};
	
	get type() {
		return 'actor';
	};

	act() {};

	isIntersect(other) {
    	if (!(other instanceof Actor)) {
			throw Error('Передан не объект Actor');
		};
		if (other === this || other.left >= this.right || other.top >= this.bottom || other.right <= this.left || other.bottom <= this.top) {
			return false;
		};
		return true;
	};
};

class Level {
  constructor(grid = [], actors = []) {
	  this.grid = grid;
	  this.height = grid.length;
	  this.width = 0;
	  this.grid.forEach(line => {line.length > this.width ? this.width = line.length : this.width = this.width});
	  this.actors = [];
	  actors.forEach(actor => this.actors.push(actor));
	  this.actors.forEach(actor => actor.type === 'player' ? this.player = actor : this.player = this.player);
	  this.status = null;
	  this.finishDelay = 1;
  };

  isFinished() {
    if (this.status !== null && this.finishDelay < 0) {
      return true;
    }
    return false;
  };

  actorAt(actor) {
	  if (!(actor instanceof Actor)) {
		  throw Error('Передан не объект Actor');
	  };
	  return this.actors.find(obj => obj.isIntersect(actor));
  };

  obstacleAt(pos, size) {
	  if (!(pos instanceof Vector && size instanceof Vector)) {
		  throw Error('Переданный объект - не Vector');
	  };
	  if (pos.x < 0 || pos.x > this.width || pos.x + size.x < 0 || pos.x + size.x > this.width || pos.y < 0 || pos.y + size.y < 0) {
		  return 'wall';
	  }
	  if (pos.y > this.width || pos.y + size.y > this.width) {
		  return 'lava';
	  }
	  let actor = new Actor(new Vector(Math.round(pos.x), Math.round(pos.y)), new Vector(Math.round(size.x), Math.round(size.y)));
	  return this.grid[actor.pos.y].find((obj,x) => {
		  let objActor = new Actor(new Vector(x,actor.pos.y), new Vector(1,1));
		  if (objActor.isIntersect(actor)) {
			  return this.grid[objActor.pos.x, objActor.pos.y];
		  }
	  });
  };

  removeActor(actor) {
	  this.actors.forEach(obj => {actor === obj ? this.actors.splice( obj.index,1) : obj = obj});
  };

  noMoreActors(type) {
	  return !this.actors.find(actor => actor.type === type);
  };

  playerTouched(type, actor) {
    if (this.status === null) {
      if (type === 'lava' || type === 'fireball') {
        this.status = 'lost';
      } else if (type === 'coin') {
        this.removeActor(actor)
        let coinCount = 0;
        this.actors.forEach(obj => {obj.type === 'coin' ? coinCount++ : coinCount = coinCount});
        if (coinCount === 0) {
          this.status = 'won';
        };
      };
    };
  };
};

class LevelParser {
	constructor(actorsDict = {}) {
		this.actorsDict = actorsDict;
	};
	
	actorFromSymbol(actorSymbol) {
		if (actorSymbol === undefined) {
      		return undefined;
		} 
		let actorKeys = Object.getOwnPropertyNames(this.actorsDict);
		if (actorKeys.length === 0) {return undefined;}
		if (actorKeys.includes(actorSymbol)) {
			return this.actorsDict[actorSymbol];
		};
		return undefined;
	};
	
	obstacleFromSymbol(obstacleSymbol) {
		if (obstacleSymbol === undefined) {return undefined};
    	if (obstacleSymbol === 'x') {return 'wall'}
    	else if (obstacleSymbol === '!') {return 'lava'}
    	else {return undefined};
	};
	
	createGrid(plan) {
		let grid = [];
    	if (plan.length === 0) {
      		return [];
    	};
    	for (let line of plan) {
      		let draftLineArray = line.split('');
      		draftLineArray.forEach((obstacleSymbol, index) => {
        		draftLineArray.splice(index, 1, this.obstacleFromSymbol(obstacleSymbol))
        	});
      	grid.push(draftLineArray);
    	};
    	return grid;
  	};
	
	createActors(plan) {
    	if (plan === []) { return [];}
    	const actors = [];
    	plan.forEach((line, y) => {
			line.split('').forEach((actorSymbol, x) => {
				if (this.actorFromSymbol(actorSymbol) !== undefined 
					&& 
					this.actorFromSymbol(actorSymbol) instanceof Function
					&&
					(Actor.prototype === this.actorFromSymbol(actorSymbol).prototype
					||
					this.actorFromSymbol(actorSymbol).prototype instanceof Actor)
					) {
					actors.push(new (this.actorFromSymbol(actorSymbol))(new Vector(x,y)))
					//console.log(actors)
				}
				});
			});
		return actors;
	};
	
	parse(plan) {
		let grid = this.createGrid(plan);
    	let actors = this.createActors(plan);
    	return new Level(grid, actors);
  }
};

class Fireball extends Actor {
	constructor(pos = new Vector(0,0), speed = new Vector(0,0), size = new Vector(1,1)) {
    	super(pos, size, speed);
	};
	
	get type() {
		return 'fireball';
	};
	
	getNextPosition(time = 1) {
    	let x = this.left + this.speed.x * time;
    	let y = this.top + this.speed.y * time;
    	return new Vector(x,y);
  	};
	
	handleObstacle() {
    	this.speed.x = this.speed.x * -1;
    	this.speed.y = this.speed.y * -1;
  	};
	
	act(time, level) {
		let nextPos = this.getNextPosition(time);
    	let thisInNextPos = new Fireball(nextPos, this.speed, this.size);
    	let intersection = level.obstacleAt(nextPos, this.size);
    	intersection !== undefined ? this.handleObstacle() : this.pos = thisInNextPos.pos;
  };
};

class HorizontalFireball extends Fireball {
  constructor(pos = new Vector(0,0), size = new Vector(1,1)) {
    super(pos, size);
	this.speed = new Vector(2,0);
  };
};

class VerticalFireball extends Fireball {
  constructor(pos = new Vector(0,0), size = new Vector(1,1)) {
    super(pos, size);
	this.speed = new Vector(0,2);
  };
};

class FireRain extends Fireball {
	constructor(pos = new Vector(0,0), size = new Vector(1,1)) {
    super(pos, size);
	this.speed = new Vector(0,3);
    this.startPos = pos;
	};
	
	handleObstacle() {
		this.pos.x = this.startPos.x;
		this.pos.y = this.startPos.y;
	};
};

class Coin extends Actor {
	constructor(pos = new Vector(0,0)) {
    	super();
    	this.pos.x = pos.x + 0.2;
    	this.pos.y = pos.y + 0.1;
		this._startPos = new Vector(this.pos.x, this.pos.y);
    	this.size = new Vector(0.6, 0.6);
		this.springSpeed = 8;
		this.springDist = 0.07;
		this.spring = Math.random()*2*Math.PI;
	};
	
	get type() {
		return 'coin';
	};
	
	updateSpring(time = 1) {
		this.spring += this.springSpeed * time;
	};
	
	getSpringVector() {
    	let y = Math.sin(this.spring) * this.springDist;
    	return new Vector(0, y);
  	};
	
	getNextPosition(time = 1) {
		this.updateSpring(time);
    	let newPos = this._startPos.y + this.getSpringVector().y;
    	return new Vector(this.pos.x, newPos);
  	};
	
	act(time) {
    	let nextPos = this.getNextPosition(time);
    	this.pos = new Vector(nextPos.x, nextPos.y);
	};
};

class Player extends Actor {
	constructor(pos = new Vector(0,0)) {
    	super();
    	this.pos.x = pos.x;
    	this.pos.y = pos.y - 0.5;
    	this.size = new Vector(0.8, 1.5);
    	this.speed = new Vector(0, 0);
	};
	get type() {
		return 'player';
	};
};