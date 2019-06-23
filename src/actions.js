import { TileMap, Entity, Action } from "./rogue.js";
import { Stamina } from "./components.js";

let { succeed, fail, alternate } = Action;

export class Rest extends Action {
  /**
   * @param {Entity} entity
   */
  perform(entity) {
    let stamina = entity.get(Stamina);

    if (stamina.value < stamina.max) {
      stamina.value += 1;
    }

    return succeed();
  }
}

export class MoveTo extends Action {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }

  /**
   * @param {Entity} entity
   */
  perform(entity) {
    let tile = entity.world.map.get(this.x, this.y);

    if (tile == null) {
      return fail("There's nothing here!");
    }

    let type = TileMap.registry[tile.type];

    if (type.walkable) {
      entity.x = this.x;
      entity.y = this.y;
      return succeed();
    } else {
      return fail("You can't move there")
    }
  }
}

export class MoveBy extends Action {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }

  /**
   * @param {Entity} entity
   */
  perform(entity) {
    return alternate(
      new MoveTo(entity.x + this.x, entity.y + this.y)
    );
  }
}

export class Walk extends Action {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }

  /**
   * @param {Entity} entity
   */
  perform(entity) {
    let x = this.x + entity.x;
    let y = this.y + entity.y;

    let stamina = entity.get(Stamina);

    if (stamina.value < stamina.max) {
      stamina.value += 1;
    }

    return alternate(
      new MoveTo(x, y)
    );
  }
}

export class Dodge extends Action {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }

  /**
   * @param {Entity} entity
   */
  perform(entity) {
    let x = this.x + entity.x;
    let y = this.y + entity.y;
    let stamina = entity.get(Stamina);

    if (stamina.value === 0) {
      return fail("You don't have enough stamina to do that");
    }

    stamina.value -= 1;

    // TODO: Prevent entities from being able to dodge through solid
    // objects such as walls or other entities.

    return alternate(
      new MoveTo(x, y)
    );
  }
}
