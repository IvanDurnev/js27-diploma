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
					writable: false
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