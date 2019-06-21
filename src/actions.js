import data from "./data.js";
import { succeed, fail, alternate } from "./rogue.js";

/**
 * @type {Rogue.Action}
 */
export let Rest = () => {
  return succeed();
};

/**
 * @type {(x: number, y: number) => Rogue.Action}
 */
export let MoveTo = (x, y) => (actor) => {
  let tile = actor.world.map.get(x, y);

  if (tile == null) {
    return fail("There's nothing here!");
  }

  let def = data.tiles[tile.type];

  if (def.walkable) {
    actor.x = x;
    actor.y = y;
    return succeed();
  } else {
    return fail("You can't move there")
  }
};

/**
 * @type {(dx: number, dy: number) => Rogue.Action}
 */
export let MoveBy = (dx, dy) => (actor) => {
  return alternate(
    MoveTo(actor.x + dx, actor.y + dy)
  );
};
