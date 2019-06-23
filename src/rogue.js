import settings from "./settings.js";
import * as Utils from "./utils.js";

let { assert } = Utils;

export let Inheritance = {
  /**
   * @param {string} id
   */
  getAncestors(id) {
    let ancestors = [];
    let stack = [id];
    let visited = new Set();
    let root = id;

    while (stack.length) {
      let id = stack.pop();
      let type = Entity.registry[id];

      if (type == null) {
        console.error(`entity is not defined "${id}" (while parsing "${root}")`);
        continue;
      }

      visited.add(id);
      ancestors.unshift(type);

      if (type.extends) {
        for (let id of type.extends) {
          if (!visited.has(id)) {
            stack.push(id);
          }
        }
      }
    }

    return ancestors;
  },

  /**
   * @param {string} id
   */
  getInheritedProps(id) {
    /** @type {Component[]} */
    let components = [];

    /** @type {string[]} */
    let types = [];

    /** @type {Rogue.EntityType["attributes"]} */
    let attributes = {};

    let ancestors = this.getAncestors(id);
    let spec = {};

    for (let type of ancestors) {
      types.push(type.id);
      Object.assign(spec, type.components);
      Object.assign(attributes, type.attributes);
    }

    for (let id in spec) {
      let params = spec[id];
      let component = Component.create(id, params);

      if (component) {
        components.push(component);
      }
    }

    return { types, components, attributes };
  }
};

/**
 * @template T
 */
export class Component {
  /**
   * @type {{ [id: string]: Rogue.ComponentClass<any> }}
   */
  static registry = {};

  /**
   * @param {typeof Component.registry} components
   */
  static register(components) {
    Object.assign(this.registry, components);
  }

  /**
   * @param {string} id
   */
  static exists(id) {
    return id in this.registry;
  }

  /**
   * @param {string} id
   */
  static create(id, params) {
    let constructor = Component.registry[id];

    if (Component.exists(id)) {
      return new constructor(params);
    } else {
      console.error(`Component does not exist: "${id}"`);
      return null;
    }
  }

  get name() {
    return this.constructor.name;
  }

  get target() {
    return Entity;
  }

  /**
   * @type {T}
   */
  entity = null;

  /**
   * Checks whether the component can be added to a specific entity.
   *
   * @param {Entity} entity
   * @return {string | true}
   */
  validate(entity) {
    if (this.target && !(entity instanceof this.target)) {
      return `"${this.name}" component can only be added to ${this.target.name}`;
    }

    return true;
  }

  onEnter() {}
  onExit() {}

  /**
   * @param {Rogue.Event} [event]
   */
  onEvent(event) {}
}

export class Entity {
  /**
   * @type {{ [id: string]: Rogue.EntityType }}
   */
  static registry = {};

  /**
   * @param {Rogue.EntityType[]} types
   */
  static register(types) {
    for (let type of types) {
      this.registry[type.id] = type;
    }
  }

  /**
   * @param {string} type
   */
  constructor(type) {
    let inherited = Inheritance.getInheritedProps(type);

    this.id = Utils.uid();
    this.type = Entity.registry[type];
    this.types = new Set(inherited.types);
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.glyph = inherited.attributes.glyph;
    this.color = inherited.attributes.color;

    /** @type {World} */
    this.world = null;

    /** @type {Component[]} */
    this.components = [];

    for (let component of inherited.components) {
      this.add(component);
    }
  }

  /**
   * @param {string} type
   */
  is(type) {
    return this.types.has(type);
  }

  /**
   * @param {Rogue.Event | string} event
   */
  send(event) {
    if (typeof event === "string") {
      event = { type: event };
    }

    for (let component of this.components) {
      component.onEvent(event);
    }
  }

  /**
   * @param {Component} component
   */
  add(component) {
    let result = component.validate(this);

    if (result !== true) {
      return console.error(`Can't add "${component.name}" component to ${this.type.id}!\n\n${result}`)
    }

    this.components.push(component);
    component.entity = this;

    if (this.active) {
      component.onEnter();
    }
  }

  /**
   * @param {Component} component
   */
  delete(component) {
    if (this.active) {
      component.onExit();
    }

    component.entity = null;
    Utils.removeFromList(this.components, component);
  }

  /**
   * @template {Component} T
   * @param {Rogue.ComponentClass<T>} constructor
   * @returns {T}
   */
  get(constructor) {
    return /** @type {?} */ (
      this.components.find(component => {
        return component instanceof constructor;
      })
    );
  }

  /**
   * @param {Rogue.ComponentClass<any>} constructor
   * @return {boolean}
   */
  has(constructor) {
    return this.components.some(component => {
      return component instanceof constructor;
    });
  }

  onEnter() {
    this.active = true;

    for (let component of this.components) {
      component.onEnter();
    }
  }

  onExit() {
    for (let component of this.components) {
      component.onExit();
    }

    this.active = false;
  }

  onBeforeTurn() {
    this.send({ type: "before-turn" });
  }

  onAfterTurn() {
    this.send({ type: "after-turn" });
  }

  /**
   * @param {Entity} other
   */
  distance(other) {
    return Utils.distance(this.x, this.y, other.x, other.y);
  }
}

export class Item extends Entity {
  /**
   * @param {string} type
   */
  constructor(type) {
    super(type);

    // Render items above entities
    this.z = 1;
  }
}

export class Actor extends Entity {
  /**
   * @param {string} type
   */
  constructor(type) {
    super(type);
    // Render actors above items
    this.z = 2;
  }

  /**
   * @param {Action} action
   */
  onBeforeAction(action) {
    this.send({ type: "before-action", action });
  }

  /**
   * @param {Action} action
   * @param {Rogue.ActionResult} result
   */
  onAfterAction(action, result) {
    this.send({ type: "after-action", action, result });
  }

  /**
   * @return {Action | Promise<Action>}
   */
  takeTurn() {
    // Default action is a no-op
    let defaultAction = new Action();

    // Request an action from any of our components
    let event = { type: "request-action", action: null };

    this.send(event);

    if (event.action) {
      return event.action;
    } else {
      return defaultAction;
    }
  }
}

class Player extends Actor {
  /**
   * @param {Action} action
   */
  setNextAction = (action) => {};

  /**
   * @param {Rogue.ActionResult} result
   */
  onAfterAction(_, result) {
    if (result.message) {
      this.world.message(result.message);
    }
  }

  /**
   * The player takes turns in a different way to most actors. After
   * a turn is requested, we block whilst we wait for an input. The
   * UI is responsible for passing an input to us asynchronously.
   *
   * @return {Promise<Action>}
   */
  async takeTurn() {
    return new Promise(resolve => {
      this.setNextAction = resolve;
    });
  }
}

export class TileMap {
  /**
   * @type {{ [id: string]: Rogue.TileType }}
   */
  static registry = {};

  /**
   * @param {typeof TileMap.registry} types
   */
  static register(types) {
    Object.assign(this.registry, types);
  }

  /**
   * @param {number} width
   * @param {number} height
   */
  constructor(width, height) {
    this.width = width;
    this.height = height;

    /** @type {Rogue.Tile[]} */
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
   * @param {Rogue.Tile} tile
   */
  set(x, y, tile) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return null;
    }

    return this.tiles[x + y * this.width] = tile;
  }

  autotile(x0=0, y0=0, x1=this.width, y1=this.height) {
    for (let x = x0; x <= x1; x++) {
      for (let y= y0; y <= y1; y++) {
        let tile = this.get(x, y);
        if (tile == null) continue;

        let type = TileMap.registry[tile.type];
        if (type == null) continue;

        // If this tile has variants and hasn't already been assigned
        // a glyph, pick one of the variant glyphs at random.
        if (type.variants && tile.glyph == null) {
          tile.glyph = type.glyph + Random.int(type.variants);
          continue;
        }

        if (!type.autotile) continue;

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

        // The font is laid out so that we can use the mask as an
        // index offset to get the correct glyph.
        tile.glyph = type.glyph + mask;
      }
    }
  }
}

export class World {
  map = new TileMap(
    settings["map.width"],
    settings["map.height"],
  );

  events = new Utils.Emitter();

  /**
   * @type {Map<number, Entity>}
   */
  entities = new Map();

  player = new Player("Player");
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
    entity.onEnter();
  }

  /**
   * @param {Entity} entity
   */
  despawn(entity) {
    entity.onExit();
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
    for (let [, entity] of this.entities) {
      if (entity.x === x && entity.y === y) {
        return entity;
      }
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @return {Entity[]}
   */
  getEntitiesAt(x, y) {
    let entities = [];

    for (let [, entity] of this.entities) {
      if (entity.x === x && entity.y === y) {
        entities.push(entity);
      }
    }

    return entities;
  }

  getEntityAtCursor() {
    return this.cursor && this.getEntityAt(this.cursor.x, this.cursor.y);
  }

  getEntitiesAtCursor() {
    if (this.cursor) {
      return this.getEntitiesAt(this.cursor.x, this.cursor.y)
    } else {
      return [];
    }
  }

  async start() {
    const MAX_ACTION_TRIES = settings["rules.maxActionTries"];
    const DEBUG = settings["debug"];

    while (true) {
      let stats = { entities: 0, actions: 0 };

      for (let [, entity] of this.entities) {
        if (DEBUG) {
          stats.entities += 1;
        }

        entity.onBeforeTurn();

        if (entity instanceof Actor) {
          while (true) {
            let actor = entity;
            let action = await actor.takeTurn();
            let tries = 0;

            /** @type {Rogue.ActionResult} */
            let result = null;

            while (tries++ < MAX_ACTION_TRIES) {
              actor.onBeforeAction(action);
              result = action.perform(actor);
              actor.onAfterAction(action, result);

              if (DEBUG) {
                stats.actions += 1;
              }

              if (result.ok || result.alt == null) {
                break;
              }

              action = result.alt;
            }

            if (tries >= MAX_ACTION_TRIES) {
              console.warn("entity took too many tries", entity);
            }

            // Allow the player to try a retry if their action failed
            if (!result.ok && entity instanceof Player) {
              continue;
            }

            // Prevent non-player characters getting stuck if they
            // are unable to produce an action
            break;
          }
        }

        entity.onAfterTurn();
      }

      this.turns += 1;
      this.events.emit("turn", this.turns);

      if (DEBUG) {
        this.events.emit("stats", stats);
      }
    }
  }

  /**
   * @param {string} text
   */
  message(text) {
    this.events.emit("message", text);
  }
}

export class Action {
  /**
   * @param {string} [message]
   * @return {Rogue.ActionResult}
   */
  static succeed(message) {
    return { ok: true, message };
  }

  /**
   * @param {string} [message]
   * @return {Rogue.ActionResult}
   */
  static fail(message) {
    return { ok: false, message };
  }

  /**
   * @param {Action} action
   * @return {Rogue.ActionResult}
   */
  static alternate(action) {
    return { ok: false, alt: action };
  }

  /**
   * @param {Entity} entity
   * @return {Rogue.ActionResult}
   */
  perform(entity) {
    return Action.fail();
  }
}

export let Random = {
  /**
   * @template T
   * @param {T[]} items
   */
  pick(...items) {
    return items[Math.floor(Math.random() * items.length)];
  },

  /**
   * @param {number} size
   */
  int(size) {
    return Math.floor(Math.random() * size);
  },

  /**
   * @param {string} code - 1d6, 2d10 etc
   */
  dice(code) {
    let parts = code.split("d");

    let count = Number(parts[0]);
    let sides = Number(parts[1]);

    let total = 0;

    for (let i = 0; i < count; i++) {
      total += 1 + Random.int(sides);
    }

    return total;
  }
};
