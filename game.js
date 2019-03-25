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
}

const start = new Vector(30, 50);
const moveTo = new Vector(5, 10);
const finish = start.plus(moveTo.times(2));

console.log(`Исходное расположение: ${start.x}:${start.y}`);
console.log(`Текущее расположение: ${finish.x}:${finish.y}`);