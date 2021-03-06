'use strict';

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    };

    plus(vector) {
        if (!vector instanceof Vector) {
            throw Error('Можно прибавлять к вектору только вектор типа Vector');
        }
        return new Vector(this.x + vector.x, this.y + vector.y);
    };

    times(number) {
        return new Vector(this.x * number, this.y * number);
    };
};

class Actor {
    constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
        if (!(pos instanceof Vector) && (size instanceof Vector) && (speed instanceof Vector)) {
            throw Error('Переданы не объекты Vector для создания Actor');
        }
        this.pos = pos;
        this.size = size;
        this.speed = speed;
    };

    get left() {
        return this.pos.x
    };

    get top() {
        return this.pos.y
    };

    get right() {
        return this.pos.x + this.size.x
    };

    get bottom() {
        return this.pos.y + this.size.y
    };

    get type() {
        return 'actor';
    };

    act() {};

    isIntersect(other) {
        if (!(other instanceof Actor)) {
            throw Error('Передан не объект Actor');
        };
        return !(other === this || other.left >= this.right || other.top >= this.bottom || other.right <= this.left || other.bottom <= this.top)
    };
};

class Level {
    constructor(grid = [], actors = []) {
        this.grid = grid;
        this.height = grid.length;
        this.width = 0;
        this.grid.forEach(line => {if (line.length > this.width) {this.width = line.length}});
        this.actors = actors;
        this._player = this.actors.find(actor => actor.type === 'player');
        this.status = null;
        this.finishDelay = 1;
    };

    get player() {
        return this._player;
    };

    isFinished() {
        return (this.status !== null && this.finishDelay < 0);
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
        }
        if (pos.x < 0 || pos.x + size.x > this.width || pos.y < 0) {
            return 'wall';
        }
        if (pos.y + size.y > this.height) {
            return 'lava';
        }
        for (let i = Math.floor(pos.y); i < Math.ceil(pos.y + size.y); i++) {
            for (let j = Math.floor(pos.x); j < Math.ceil(pos.x + size.x); j++) {
                if (this.grid[i][j] !== undefined) {
                    return this.grid[i][j];
                }
            }
        }
    };

    removeActor(actor) {
        this.actors.splice(this.actors.indexOf(this.actors.find(obj => obj === actor)), 1)
    };

    noMoreActors(type) {
        return !this.actors.find(actor => actor.type === type);
    };

    playerTouched(type, actor) {
        if (!this.status === null) {
            return;
        }
        if (type === 'lava' || type === 'fireball') {
            this.status = 'lost';
        }
        if (type === 'coin' && actor.type === 'coin') {
            this.removeActor(actor)
            if (this.noMoreActors(type)) {
                this.status = 'won'
            }
        }
    }
}

class LevelParser {
    constructor(actorsDict = {}) {
        this.actorsDict = actorsDict;
    };

    actorFromSymbol(actorSymbol) {
        if (actorSymbol) {
            let actorKeys = Object.getOwnPropertyNames(this.actorsDict);
            if (actorKeys.length === 0) return;
            if (actorKeys.includes(actorSymbol)) {
                return this.actorsDict[actorSymbol];
            }
        }
        return actorSymbol
    };

    obstacleFromSymbol(obstacleSymbol) {
        if (!obstacleSymbol) return;
        if (obstacleSymbol === 'x') return 'wall';
        else if (obstacleSymbol === '!') return 'lava';
        else return;
    };

    createGrid(plan) {
        let grid = [];
        if (plan.length === 0) {
            return [];
        }
        for (let line of plan) {
            let draftLineArray = line.split('');
            draftLineArray.forEach((obstacleSymbol, index) => {
                draftLineArray.splice(index, 1, this.obstacleFromSymbol(obstacleSymbol))
            });
            grid.push(draftLineArray);
        }
        return grid;
    };

    createActors(plan) {
        const actors = [];
        plan.forEach((line, y) => {
            line.split('').forEach((actorSymbol, x) => {
                if (this.actorFromSymbol(actorSymbol) !== undefined &&
                    this.actorFromSymbol(actorSymbol) instanceof Function &&
                    (Actor.prototype === this.actorFromSymbol(actorSymbol).prototype ||
                        this.actorFromSymbol(actorSymbol).prototype instanceof Actor)
                ) {
                    actors.push(new(this.actorFromSymbol(actorSymbol))(new Vector(x, y)))
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
    constructor(pos, size, speed = new Vector(1, 0)) {
        super(pos, size, speed);
    };

    get type() {
        return 'fireball';
    };

    getNextPosition(time = 1) {
        let x = this.left + this.speed.x * time;
        let y = this.top + this.speed.y * time;
        return new Vector(x, y);
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
    constructor(pos, size, speed  = new Vector(2, 0)) {
        super(pos, size, speed);
    };
};

class VerticalFireball extends Fireball {
    constructor(pos, size, speed = new Vector(0, 2)) {
        super(pos, size, speed);
    };
};

class FireRain extends Fireball {
    constructor(pos, size, speed = new Vector(0, 3)) {
        super(pos, size, speed);
        this.startPos = pos;
    };

    handleObstacle() {
        this.pos.x = this.startPos.x;
        this.pos.y = this.startPos.y;
    };
};

class Coin extends Actor {
    constructor(pos, size = new Vector(0.6, 0.6), speed) {
            super(pos, size, speed);
            this.pos.x = pos.x + 0.2;
            this.pos.y = pos.y + 0.1;
            this._startPos = new Vector(this.pos.x, this.pos.y);
            this.springSpeed = 8;
            this.springDist = 0.07;
            this.spring = Math.random() * 2 * Math.PI;
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
    constructor(pos, size = new Vector(0.8, 1.5), speed = new Vector(0, 0)) {
        super(pos, size, speed);
        this.pos.x = pos.x;
        this.pos.y = pos.y - 0.5;
        };

        get type() {
            return 'player';
        };
    };

//run game
    const actorDict = {
    '@': Player,
    'o': Coin,
    '=': HorizontalFireball,
    '|': VerticalFireball,
    'v': FireRain
};
    const parser = new LevelParser(actorDict);
    loadLevels().then(result => (runGame(JSON.parse(result), parser, DOMDisplay).then(result => alert('Вы выиграли!'))));