import settings from "./settings.js";
import data from "./data.js";

export class Emitter {
  handlers = {};

  /**
   * @param {string | Symbol} type
   * @param {any} data
   */
  emit(type, data) {
    let handlers = this.handlers[type];

    if (handlers) {
      for (let handler of handlers) {
        handler(data);
      }
    }
  }

  /**
   * @param {string | Symbol} type
   * @param {(data: any) => void} handler
   */
  on(type, handler) {
    this.handlers[type] = this.handlers[type] || [];
    this.handlers[type].push(handler);
  }

  /**
   * @param {string | Symbol} type
   * @param {(data: any) => void} handler
   */
  off(type, handler) {
    if (type in this.handlers) {
      Utils.removeFromList(this.handlers[type], handler);
    }
  }
}


export class Component {
  entity = null;

  onEnter() {}
  onExit() {}
  onEvent() {}
}

export class Entity {
  static counter = 0;

  static getNextId() {
    return this.counter += 1;
  }

  /**
   * @typedef {Object} EntityDef
   * @property {number} glyph
   * @property {number} color
   * @param {EntityDef} def
   */
  constructor(def) {
    this.glyph = def.glyph;
    this.color = def.color;
    this.id = Entity.getNextId();
    this.disabled = false;
    this.x = 0
    this.y = 0
    this.z = 0

    /**
     * @type {World}
     */
    this.world = null;

    /**
     * @type {Component[]}
     */
    this.components = [];
  }

  disable() {
    if (this.disabled === false) {
      this.send("disable");
      this.disabled = true;
    }
  }

  enable() {
    if (this.disabled === true) {
      this.send("enable");
      this.disabled = false;
    }
  }

  send(event) {
    for (let component of this.components) {
      component.onEvent(event);
    }
  }

  add(component) {
    this.components.push(component);
    component.entity = this;
    component.onEnter();
  }

  delete(component) {
    component.onExit();
    component.entity = null;
    Utils.removeFromList(this.components, component);
  }

  get(constructor) {
    return this.components.find(component => {
      return component.constructor === constructor;
    });
  }

  has(constructor) {
    return this.components.some(component => {
      return component.constructor === constructor;
    });
  }

  takeTurn() {
    // Default action is to rest
    let action = () => ({ ok: true });

    // Request an action from any of our components
    let event = { type: "request-action", action };
    this.send(event);

    return event.action;
  }

  /**
   * Pre-action update hook
   */
  onBeforeAction(action) {
    this.send("before-action", action);
  }

  /**
   * Post-action update hook
   */
  onAfterAction(action) {
    this.send("after-action", action);
  }
}

export class Item extends Entity {
  /**
   * @typedef {Object} ItemDef
   * @property {number} glyph
   * @property {number} color
   * @param {ItemDef} def
   */
  constructor(def) {
    super(def);
  }
}

export class Actor extends Entity {
  /**
   * @typedef {Object} ActorDef
   * @property {number} glyph
   * @property {number} color
   * @property {number} hp
   * @property {number} stamina
   * @property {number} souls
   * @param {ActorDef} def
   */
  constructor(def) {
    super(def);

    this.maxHp = def.hp;
    this.hp = def.hp;

    this.maxStamina = def.stamina;
    this.stamina = def.stamina;

    this.souls = def.souls;
  }

  hasStamina() {
    return this.stamina > 0;
  }

  hasFullStamina() {
    return this.stamina === this.maxStamina;
  }

  hasFullHp() {
    return this.hp === this.maxHp;
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  moveTo(x, y) {
    let tile = this.engine.map.get(x, y);

    if (tile && tile.walkable) {
      this.x = x;
      this.y = y;
    }
  }

  /**
   * @param {number} dx
   * @param {number} dy
   */
  moveBy(dx, dy) {
    this.moveTo(this.x + dx, this.y + dy);
  }

  /**
   * @param {number} value
   */
  setHp(value) {
    actor.hp = Utils.clamp(0, value, this.maxHp);
  }

  /**
   * @param {number} value
   */
  changeHp(amount) {
    this.setHp(this.hp + amount);
  }

  /**
   * @param {number} value
   */
  setStamina(value) {
    actor.stamina = Utils.clamp(0, value, actor.maxStamina);
  }

  /**
   * @param {number} value
   */
  changeStamina(amount) {
    this.setStamina(actor.stamina + amount);
  }

  takeTurn() {
    // TODO: Only take a turn if this.hasStamina()
    return super.takeTurn();
  }
}

class Player extends Actor {
  addActionAsync = () => {};

  onAfterAction(action) {
    if (action.message) {
      this.world.message(action.message);
    }
  }

  /**
   * The player takes turns in a different way to most actors. After
   * a turn is requested, we block whilst we wait for an input. The
   * UI is responsible for passing an input to us asynchronously.
   */
  async takeTurn() {
    return new Promise(resolve => {
      this.addActionAsync = resolve;
    });
  }
}

export let Random = {
  pick(...items) {
    return items[Math.floor(Math.random() * items.length)];
  },
  int(size) {
    return Math.floor(Math.random() * size);
  }
};

export let Utils = {
  /**
   * @param {number} min
   * @param {number} val
   * @param {number} max
   */
  clamp(min, val, max) {
    if (val < min) return min;
    if (val > max) return max;
    return val;
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * @template T
   * @param {T[]} list
   * @param {T} item
   */
  removeFromList(list, item) {
    for (let i = 0; i < list.length; i++) {
      if (list[i] === item) {
        list.splice(i, 1);
        return true;
      }
    }

    return false;
  },

  /**
   * @param {number} n
   */
  range(n) {
    let nums = [];

    for (let i = 0; i < n; i++) {
      nums.push(i);
    }

    return nums;
  }
};

/**
 * @typedef {Object} Tile
 * @property {number} type
 * @property {number} glyph
 * @property {number} color
 * @property {number} light
 */

export class TileMap {

  /**
   * @param {number} width
   * @param {number} height
   */
  constructor(width, height) {
    this.width = width;
    this.height = height;

    /** @type {Tile[]} */
    this.tiles = new Array(this.width * this.height);
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return null;
    }

    return this.tiles[x + y * this.width];
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {Tile} tile
   */
  set(x, y, tile) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return null;
    }

    return this.tiles[x + y * this.width] = tile;
  }

  /**
   * @typedef {{[K in keyof typeof TileMap.AUTOTILING_PATTERNS]}} Rules
   * @param {Rules} rules
   */
  autotile(x0=0, y0=0, x1=this.width, y1=this.height) {
    for (let x = x0; x <= x1; x++) {
      for (let y= y0; y <= y1; y++) {
        let tile = this.get(x, y);
        if (tile == null) continue;
        let def = data.tiles[tile.type];
        if (def == null || !def.autotile) continue;

        let n = this.get(x, y - 1);
        let s = this.get(x, y + 1);
        let e = this.get(x + 1, y);
        let w = this.get(x - 1, y);

        let mask = (
          Number(n && n.type === tile.type) << 3 |
          Number(e && e.type === tile.type) << 2 |
          Number(s && s.type === tile.type) << 1 |
          Number(w && w.type === tile.type) << 0
        );

        tile.glyph = def.glyph + mask;
      }
    }
  }
}

export class World {
  map = new TileMap(
    settings.map.width,
    settings.map.height,
  );

  events = new Emitter();

  /** @type {Map<number, Entity>} */
  entities = new Map();

  player = new Player(data.actors.player);
  cursor = { x: 0, y: 0 };
  camera = { x: 0, y: 0 };
  ticks = 0;
  turns = 0;

  /**
   * @param {Entity} entity
   */
  spawn(entity) {
    entity.world = this;
    this.entities.set(entity.id, entity);
    entity.send("enter");
  }

  /**
   * @param {Entity} entity
   */
  despawn(entity) {
    entity.send("exit");
    entity.world = null;
    this.entities.delete(entity.id);
  }

  /**
   * @param {number} id
   */
  getEntityById(id) {
    return this.entities.get(id);
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  getEntityAt(x, y) {
    for (let [_, entity] of this.entities) {
      if (entity.x === x && entity.y === y) {
        return entity;
      }
    }
  }

  getEntityAtCursor() {
    return this.cursor && this.getEntityAt(this.cursor.x, this.cursor.y);
  }

  async start() {
    while (true) {
      for (let [_, entity] of this.entities) {
        // Try actions until one succeeds
        while (true) {
          let action = await entity.takeTurn();
          let result = this.tryAction(entity, action);
          if (result.ok) break;
        }
      }

      this.turns += 1;
      this.events.emit("turn");
    }
  }

  tryAction(entity, action, tries=0) {
    if (tries > settings.rules.maxActionTries) {
      this.debug(`Entity took too many tries`, entity, action);
      return { ok: true };
    }

    entity.onBeforeAction(action);
    let result = action(entity, this);
    entity.onAfterAction(result);

    if (result.alt) {
      return this.tryAction(entity, result.alt, tries + 1);
    }

    return result;
  }

  debug(...args) {
    if (settings.debug) {
      console.warn(...args);
    }
  }

  message(text) {
    this.events.emit("message", text);
  }
}
