import { TileMap, Entity, Action, Directions } from "./rogue.js";
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
   * @param {Rogue.Direction} dir
   */
  constructor(dir) {
    super();
    this.dir = dir;
  }

  /**
   * @param {Entity} entity
   */
  perform(entity) {
    let steps = Directions.steps(this.dir, 1);
    let x = entity.x + steps.x;
    let y = entity.y + steps.y;
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
   * @param {Rogue.Direction} dir
   */
  constructor(dir) {
    super();
    this.dir = dir;
  }

  /**
   * @param {Entity} entity
   */
  perform(entity) {
    let steps = Directions.steps(this.dir, 2);
    let x = entity.x + steps.x;
    let y = entity.y + steps.y;
    let stamina = entity.get(Stamina);

    if (stamina.value < 1) {
      return alternate(
        new Walk(this.dir)
      );
    }

    stamina.value -= 1;

    // TODO: Prevent entities from being able to dodge through solid
    // objects such as walls or other entities.

    return alternate(
      new MoveTo(x, y)
    );
  }
}
