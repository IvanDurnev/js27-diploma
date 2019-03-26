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
			throw 'Можно прибавлять к вектору только вектор типа Vector';
		}
	};
	
	times(number) {
		return new Vector(this.x * number, this.y * number);
	};
};

class Actor {
	constructor(pos = new Vector(0,0), size = new Vector(1,1), speed = new Vector(0,0)) {
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
        		writable: false
      		}
    	});
    
  	};

	act() {};

	isIntersect(actor) {
    	if (actor instanceof Actor) {
      		if (actor === this) {
        		return false;
			} else {
        		if ((this.left >= actor.left && this.left < actor.right) || (this.right > actor.left && this.right <= actor.right)
          			&& (this.top >= actor.top && this.top < actor.bottom) || (this.bottom > actor.top && this.bottom <= actor.bottom)) {
          			return true;
        			}
			}
		} else {
      			throw 'Передан не объект Actor';
			}
	};
};