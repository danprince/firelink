import data from "./data.js";

function fail(message) {
  return { ok: false, message };
}

function succeed(message) {
  return { ok: true, message };
}

function alternate(action) {
  return { ok: false, alt: action };
}

export let Rest = (actor, game) => {
  return succeed();
};

export let MoveTo = (x, y) => (actor, game) => {
  let tile = game.map.get(x, y);

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

export let MoveBy = (dx, dy) => (actor) => {
  return alternate(
    MoveTo(actor.x + dx, actor.y + dy)
  );
};
