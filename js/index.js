'use strict'

const PI = Math.PI;
const FULL_CIRCLE = 2 * PI; // in radian
const KEYCODE = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
};

function distanceBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

function normalizeAngle(angle) {
    angle = angle % FULL_CIRCLE;
    if (angle < 0) { angle = FULL_CIRCLE + angle; }
    return angle;
}

function rgb2hex(red, green, blue) {
    return '#' + (~~red).toString(16).padStart(2, '0') +
        (~~green).toString(16).padStart(2, '0') +
        (~~blue).toString(16).padStart(2, '0');
}

function rad2degree(rad) {
    return rad * 180 / PI; 
}

class Canvas {
    constructor(elem) {
        this.el = elem;
        this.ctx = elem.getContext('2d');
        this.line = this.line.bind(this);
        this.circle = this.circle.bind(this);
        this.rect = this.rect.bind(this);
        this.clear = this.clear.bind(this);
    }

    line(x1, y1, x2, y2, color) {
        this.ctx.beginPath()
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
        this.ctx.closePath();
    }

    circle(x, y, r, color) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, 2 * PI, false);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.closePath();
    }

    rect(x, y, w, h, color) {
        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
        this.ctx.closePath();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.el.width, this.el.height);
    }
}

class Minimap extends Canvas {
    constructor(core) {
        const { 
            MINIMAP, 
            TILE_SIZE, 
            FOV_ANGLE,
        } = core;
      
        super(MINIMAP);
        this.MINIMAP_SCALE_FACTOR = 0.5;
        // !!! with this you can set the playable area dimension
        this.COLUMS = 16;
        this.ROWS = 11;

        this.container = document.getElementById('map');
        this.mapTable = [[]];
        this.container.appendChild(this.el);
        this.el.onclick = this.mapClickToggle.bind(this);
        this.isCollided = this.isCollided.bind(this);
        this.draw = this.draw.bind(this);
        this.core = core;
        this.generateMap(this.COLUMS, this.ROWS);
    }

    isBorderCell(x, y) {
        const maxX = this.MAX_X - 1;
        const maxY = this.MAX_Y - 1;
        return x === 0 || y === 0 || x === maxX || y === maxY;
    }

    isBlockCell(x, y) {
        return this.mapTable[y][x] !== 0;
    }

    isCollided(x, y) {
        const { TILE_SIZE } = this.core;
        x = Math.floor(x / TILE_SIZE);
        y = Math.floor(y / TILE_SIZE);
        return this.mapTable[y][x] !== 0;
    }

    mapClickToggle(e) {
        const { TILE_SIZE } = this.core; 
        const x = Math.floor((e.clientX - this.el.offsetLeft) / TILE_SIZE / this.MINIMAP_SCALE_FACTOR);
        const y = Math.floor((e.clientY - this.el.offsetTop) / TILE_SIZE / this.MINIMAP_SCALE_FACTOR);
        if (this.isBorderCell(x, y)) { return; }
        this.mapTable[y][x] = 1 - this.mapTable[y][x];
        this.core.player.update();
        this.core.update();
    }

    generateMap(maxX, maxY) {
        const { TILE_SIZE, WALL_STRIP_WIDTH, FOV_ANGLE } = this.core; 
        const mapTable = [];
        const mX = maxX - 1;
        const mY = maxY - 1;
        for (let y = 0; y < maxY; y += 1) {
            const row = [];
            for (let x = 0; x < maxX; x += 1) {        
                row.push((y > 0 && y < mY && x > 0 && x < mX) ? 0 : 1);
            }
            mapTable.push(row);
        }
        this.MAX_Y = maxY;
        this.MAX_X = maxX;
        this.MAP_WIDTH = maxX * TILE_SIZE;
        this.MAP_HEIGHT = maxY * TILE_SIZE;
        this.el.width = this.MAP_WIDTH / 2;
        this.el.height = this.MAP_HEIGHT / 2;
        this.MAX_RAYS = this.MAP_WIDTH / WALL_STRIP_WIDTH;
        this.RAY_ANGLE_DISTANCE = FOV_ANGLE / this.MAX_RAYS;
        this.mapTable = mapTable;
        this.draw();
        
    }

    draw() {
        this.clear();
        this.drawGrid(this.MAP_WIDTH, this.MAP_HEIGHT)
        this.drawMap(this.MAX_X, this.MAX_Y);
        this.drawPlayer();    
    }

    drawGrid(maxWidth, maxHeight) {
        const { TILE_SIZE } = this.core;
        for (let x = 0; x <= maxWidth; x += TILE_SIZE) {
            this.line(
                x * this.MINIMAP_SCALE_FACTOR, 
                0, 
                x * this.MINIMAP_SCALE_FACTOR, 
                maxHeight * this.MINIMAP_SCALE_FACTOR, 
                "black"
            );
        }

        for (let x = 0; x <= maxHeight; x += TILE_SIZE) {
            this.line(
                0, 
                x * this.MINIMAP_SCALE_FACTOR, 
                maxWidth * this.MINIMAP_SCALE_FACTOR, 
                x * this.MINIMAP_SCALE_FACTOR, 
                "black"
            );
        }
    }

    drawMap(maxX, maxY) {
        const { TILE_SIZE } = this.core;
        for (let y = 0; y < maxY; y += 1) {
            for (let x = 0; x < maxX; x += 1) {        
                if (this.isBlockCell(x, y)) {
                    //                        x , y, width, height
                    this.rect(
                        (x * TILE_SIZE + 1) * this.MINIMAP_SCALE_FACTOR, 
                        (y * TILE_SIZE + 1) * this.MINIMAP_SCALE_FACTOR, 
                        (TILE_SIZE - 2) * this.MINIMAP_SCALE_FACTOR, 
                        (TILE_SIZE - 2) * this.MINIMAP_SCALE_FACTOR, 
                        '#777'
                    );
                }
            }
        }
    }

    drawPlayer() {
        const { TILE_SIZE, FOV_ANGLE } = this.core;
        const { x, y, rotationAngle, radius, rays } = this.core.player;
        const FOV_LENGTH = 60;
        let rayAngle = rotationAngle - (FOV_ANGLE / 2);
        // player dot 
        this.circle(
            x * this.MINIMAP_SCALE_FACTOR, 
            y * this.MINIMAP_SCALE_FACTOR, 
            radius * this.MINIMAP_SCALE_FACTOR, 
            'red'
        )
        // Visible area
        rays.forEach((ray) => this.line(
            x * this.MINIMAP_SCALE_FACTOR, 
            y * this.MINIMAP_SCALE_FACTOR, 
            ray.x * this.MINIMAP_SCALE_FACTOR, 
            ray.y * this.MINIMAP_SCALE_FACTOR, 
            'rgba(255,255,0,0.2)'
        ));

        // direction line
        this.line(
            x * this.MINIMAP_SCALE_FACTOR, 
            y * this.MINIMAP_SCALE_FACTOR, 
            (x + Math.cos(rotationAngle) * TILE_SIZE) * this.MINIMAP_SCALE_FACTOR, 
            (y + Math.sin(rotationAngle) * TILE_SIZE) * this.MINIMAP_SCALE_FACTOR, 
            'orange'
        );
    }

}

class Player {
    constructor(core) {
        const { TILE_SIZE } = core;
        this.x = 2.5 * TILE_SIZE;
        this.y = 2.5 * TILE_SIZE;
        this.radius = 0.25 * TILE_SIZE;
        this.turnDirection = 0;  // -1 left, 1 right
        this.walkDirection = 0;  // -1 back, 1 front
        this.rotationAngle = PI / 2;
        this.moveSpeed = 2.0;
        this.rotationSpeed = 2 * (PI / 180);
        this.core = core;
        this.rays = [];
        this.getRay = this.getRay.bind(this);
        document.onkeydown = this.keyDown.bind(this);
        document.onkeyup = this.keyUp.bind(this);
    }

    keyDown(e) {
        const { UP, DOWN, LEFT, RIGHT } = KEYCODE;
        if (e.keyCode == UP) {
            this.walkDirection = 1;
        } else if (e.keyCode == DOWN) {
            this.walkDirection = -1;
        } else if (e.keyCode == LEFT) {
           this.turnDirection = -1;
        } else if (e.keyCode == RIGHT) {
           this.turnDirection = 1;
        }
        this.update();
        e.preventDefault();
        return false;
    }

    keyUp(e) {
        const { UP, DOWN, LEFT, RIGHT } = KEYCODE;
        if (e.keyCode == UP) {
            this.walkDirection = 0;
        } else if (e.keyCode == DOWN) {
            this.walkDirection = 0;
        } else if (e.keyCode == LEFT) {
           this.turnDirection = 0;
        } else if (e.keyCode == RIGHT) {
           this.turnDirection = 0;
        }
        this.update();
    }

    update() {
        const { isCollided } = this.core.map;
        this.rotationAngle += this.turnDirection * this.rotationSpeed;
        const moveStep = this.walkDirection * this.moveSpeed;
        const newX = this.x + Math.cos(this.rotationAngle) * moveStep;
        const newY = this.y + Math.sin(this.rotationAngle) * moveStep;
        if (!isCollided(newX, newY)) { 
            this.x = newX;
            this.y = newY;
        }
        this.collectRays();
        this.core.update();
    }

    collectRays() {
        const { rotationAngle, getRay, rays } = this;
        const { FOV_ANGLE, map } = this.core;
        const { MAX_RAYS, RAY_ANGLE_DISTANCE } = map;
        rays.length = 0;
        let rayAngle = rotationAngle - (FOV_ANGLE / 2)
        for (let i = 0; i < MAX_RAYS; i++) {
            rays.push(getRay(rayAngle));
            rayAngle += RAY_ANGLE_DISTANCE; 
        } 
    }

    getRay(angle) {
        angle = normalizeAngle(angle);
        const {x, y} = this;
        const { FOV_ANGLE, TILE_SIZE } = this.core;
        const { MAP_WIDTH, MAP_HEIGHT, isCollided, circle } = this.core.map;
        const FACING_DOWN = angle > 0 && angle < PI;
        const FACING_UP = !FACING_DOWN;
        const FACING_RIGHT = angle < 0.5 * PI || angle > 1.5 * PI;
        const FACING_LEFT = !FACING_RIGHT;

        let interceptX, interceptY;
        let stepX, stepY;

        //---------------------------------------------
        //--- Horizontal Ray-Grid Intersection Core ---
        //---------------------------------------------
        let foundHorizontal = false;
        let collideHX = 0;
        let collideHY = 0;

        // Get x, y coordinate for closest horizontal grid intersection 
        interceptY = ~~(y / TILE_SIZE) * TILE_SIZE + (FACING_DOWN ? TILE_SIZE : 0);
        interceptX = x + (interceptY - y) / Math.tan(angle);     
        // this.createDot(interceptX, interceptY)
        // calculate the increment stepX and stepY (NOTE: if going up or left then this step is negative)
        stepY = TILE_SIZE * (FACING_UP ? -1 : 1);
        stepX = TILE_SIZE / Math.tan(angle);
        stepX *= (FACING_LEFT && stepX > 0) ? -1 : 1;
        stepX *= (FACING_RIGHT && stepX < 0) ? -1 : 1;

        let nextHorizontalX = interceptX;
        let nextHorizontalY = interceptY;
        if (FACING_UP) { nextHorizontalY--; }

        while(nextHorizontalX >= 0 && nextHorizontalY >= 0 && nextHorizontalX <= MAP_WIDTH && nextHorizontalY <= MAP_HEIGHT) {
            if (isCollided(nextHorizontalX, nextHorizontalY)) {
                collideHX = nextHorizontalX;
                collideHY = nextHorizontalY;
                foundHorizontal = true;
                break;
            } else {
                nextHorizontalX += stepX;
                nextHorizontalY += stepY;
            }
        }

        //---------------------------------------------
        //--- VERTICAL Ray-Grid Intersection Core ---
        //---------------------------------------------
        let foundVertical = false;
        let collideVX = 0;
        let collideVY = 0;

        // Get x, y coordinate for closest vertical grid intersection 
        interceptX = ~~(x / TILE_SIZE) * TILE_SIZE + (FACING_RIGHT ? TILE_SIZE : 0);
        interceptY = y + (interceptX - x) * Math.tan(angle);     
        // this.createDot(interceptX, interceptY)
        // calculate the increment stepX and stepY (NOTE: if going up or left then this step is negative)
        stepX = TILE_SIZE * (FACING_LEFT ? -1 : 1);
        stepY = TILE_SIZE * Math.tan(angle);
        stepY *= (FACING_UP && stepY > 0) ? -1 : 1;
        stepY *= (FACING_DOWN && stepY < 0) ? -1 : 1;       

        let nextVerticalX = interceptX;
        let nextVerticalY = interceptY;

        if (FACING_LEFT) { nextVerticalX--; }

        while(nextVerticalX >= 0 && nextVerticalY >= 0 && nextVerticalX <= MAP_WIDTH && nextVerticalY <= MAP_HEIGHT) {
            if (isCollided(nextVerticalX, nextVerticalY)) {
                collideVX = nextVerticalX;
                collideVY = nextVerticalY;
                foundVertical = true;
                break;
            } else {
                nextVerticalX += stepX;
                nextVerticalY += stepY;
            }
            // this.createDot(nextVerticalX, nextVerticalY)
        }  

        // Calculate both horizontal and vertical distances and choose the smallest value
        const collideHDistance = (foundHorizontal) 
            ? distanceBetweenPoints(x, y, collideHX, collideHY)
            : Number.MAX_VALUE;

        const collideVDistance = (foundVertical) 
            ? distanceBetweenPoints(x, y, collideVX, collideVY)
            : Number.MAX_VALUE;

        // store the smallest distance between the player and the wall
        const wasHorizontal = collideHDistance < collideVDistance;
        return {
            x: wasHorizontal ? collideHX : collideVX,
            y: wasHorizontal ? collideHY : collideVY,
            dist: Math.min(collideHDistance, collideVDistance)
        }
    }
}

class World extends Canvas {
    constructor(core) {
        const { WORLD } = core;
      
        super(WORLD);
        this.player = core.player;
        this.map = core.map;
        this.core = core;

        this.container = document.getElementById('world');
        this.container.appendChild(this.el);

        const hRatio = this.map.MAP_WIDTH / this.map.MAP_HEIGHT; 
        this.el.width = this.map.MAP_WIDTH;
        this.el.height = this.map.MAP_HEIGHT;
        this.el.style.border = '1px solid #000';
        this.draw = this.draw.bind(this);
    }

    draw() {
        const { FOV_ANGLE, TILE_SIZE } = this.core;
        const { rays } = this.player;
        const distProjPlane = (this.el.width / 2) / Math.tan(FOV_ANGLE / 2);
        const colWidth = this.el.width / rays.length;
        const halfH = this.el.height / 2;
        const colHeightRatio = this.el.height / TILE_SIZE;
        this.clear();
        this.rect(0, this.el.height / 2, this.el.width, this.el.height / 2, '#777');
        rays.forEach((ray, i) => {
            const distRate = TILE_SIZE / ray.dist;
            const wallStripHeight = distRate * distProjPlane;
            const color = rgb2hex(
                255 * distRate / 2 + 75, 
                255 * distRate / 2 + 75, 
                0
            );
            this.rect(
                i * colWidth, 
                halfH / 2 - ((wallStripHeight - halfH) / 2), 
                colWidth, 
                wallStripHeight, 
                color
            );
        });
    }
}

class Details {
    constructor(core) {
        const { COLUMS, ROWS } = core.map;
        const { moveSpeed, rotationSpeed } = core.player;
        this.core = core;
        this.childs = [];
        this.container = document.getElementById('details');
        const refreshableData = [ 'coord', 'direction', 'distance' ];
        this.data = [
            ['grid', () => `${COLUMS} x ${ROWS}`], 
            ['tile', () => core.TILE_SIZE], 
            ['coord', () => {
                const {x, y} = this.core.player;
                return `${~~x} x ${~~y}`
            }], 
            ['direction', () => Math.round(rad2degree(normalizeAngle(this.core.player.rotationAngle))) + '&deg;'], 
            ['rotation', () => rad2degree(rotationSpeed) + '&deg;' ], 
            ['movSpeed', () => moveSpeed + 'm'], 
            ['distance', () => { 
                const { rays } = this.core.player;
                if (!rays || !rays.length) { return 'N/A'; }
                const middle = ~~(rays / 2);
                return rays[middle].dist.toFixed(2) + 'm'; 
            }]
        ];

        this.appendChilds(this.container, this.data.map(([label, value]) => {
            const container = document.createElement('div');
            const labelElem = this.createElement(label);
            const valueElem = this.createElement(value());
            if (refreshableData.includes(label)) {
                this.childs.push([valueElem, value]);
            }
            return this.appendChilds(container, [labelElem, valueElem]);
        }));

    }

    createElement(text) {
        const div = document.createElement('div');
        div.innerHTML = text;
        return div;
    }

    appendChilds(container, nodeList) {
        if (!container || !nodeList || !nodeList.length) { return; }
        nodeList.forEach(node => container.appendChild(node));
        return container;
    }

    update() {
        this.childs.forEach(([elem, value]) => elem.innerHTML = value());
    }
}

class Core {
    constructor() {
        this.MINIMAP = document.createElement('canvas');
        this.WORLD = document.createElement('canvas');
        this.TILE_SIZE = 32;
        this.FOV_ANGLE = 60 * (PI / 180); // need in radian and not 60 degree        
        this.WALL_STRIP_WIDTH = 1;             // higher number => faster and more pixelated
        this.player = new Player(this);
        this.map = new Minimap(this);
        this.world = new World(this);
        this.details = new Details(this);
        setTimeout(() => {
            this.player.update();
            this.update();
        }, 1000);
    }

    update() {
        this.map.draw();
        this.world.draw();
        this.details.update();
    }
}

const core = new Core()