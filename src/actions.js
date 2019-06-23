import { TileMap, Entity, Action } from "./rogue.js";

let { succeed, fail, alternate } = Action;

export class Rest extends Action {
  /**
   * @param {Entity} entity
   */
  perform(entity) {
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
