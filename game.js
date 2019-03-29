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
				},
				'type': {
					value: 'actor',
					writable: false,
					configurable: true
				}
			});
		} else {
			throw Error();
		}
  	};

	act() {};

	isIntersect(other) {
    	if (other instanceof Actor) {
      		if (other === this) {
        		return false;
			} else {
				if (
					(
						(this.left > other.left && this.left < other.right) || (this.right > other.left && this.right < other.right)
						&& 
						(this.top > other.top && this.top < other.bottom) || (this.bottom > other.top && this.bottom < other.bottom)
					)
					||
					(
						(other.left > this.left && other.left < this.right) || (other.right > this.left && other.right < this.right)
						&& 
						(other.top > this.top && other.top < this.bottom) || (other.bottom > this.top && other.bottom < this.bottom)
					)
					&&
					(
						(this.right !== other.left) && (this.bottom !== other.top) && (this.left !== other.right) && (this.top !== other.bottom)
					) 
					||
					(
						(this.left === other.left) && (this.top === other.top) && (this.right === other.right) && (this.bottom === other.bottom)
					)
				) {
					return true;
				} else {
					return false;
				}
			}
		} else {
      			throw Error('Передан не объект Actor');
			}
	};
};

class Level {
  constructor(grid = [], actors = []) {
	  this.grid = grid;
	  this.height = grid.length;
	  this.width = 0;
	  this.grid.forEach(line => {line.length > this.width ? this.width = line.length : this.width = this.width});
	  this.actors = actors;
	  this.actors.forEach(actor => {actor.type === 'player' ? this.player = new Player(actor.pos.x, actor.pos.y) : undefined});
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
    if (actor instanceof Actor) {
      for (let obj of this.actors) {
        if (obj.isIntersect(actor)) {
          return obj;
        }
      };
    } else {
      throw Error('Передан не объект Actor');
    }
  };

  obstacleAt(pos, size) {
    if (pos instanceof Vector && size instanceof Vector) {
      if (pos.x < 0 || pos.x + size.x < 0 || pos.x + size.x > this.width || pos.y < 0 || pos.y + size.y < 0) {
        return 'wall';
      } else if (pos.y + size.y > this.height) {
        return 'lava';
      } else {
        return undefined;
      };
    } else {
      throw Error('Переданный объект - не Vector');
    };
  };

  removeActor(actor) {
    this.actors.forEach(obj => {actor === obj ? this.actors.splice( obj.index,1) : obj = obj});
  };

  noMoreActors(type) {
	  for (let obj of this.actors) {
		  if (obj.type === type) {
			  return false;
		  }
	  }
	  return true;
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
		console.log(actors)
    	return new Level(grid, actors);
  }
};

class Fireball extends Actor {
	constructor(pos = new Vector(0,0), speed = new Vector(0,0), size = new Vector(1,1)) {
    	super(pos, size, speed);
    	Object.defineProperty(this, 'type', {
      	value: 'fireball',
      	writable: false
		});
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
		Object.defineProperty(this, 'type', {
		  value: 'coin',
		  writable: false
		});
		this.springSpeed = 8;
		this.springDist = 0.07;
		this.spring = Math.random()*2*Math.PI;
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
    Object.defineProperty(this, 'type', {
      value: 'player',
      writable: false
    });
  };
};
