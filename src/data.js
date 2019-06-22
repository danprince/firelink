export default {
  /** @type {Defs.Dict<Defs.Tile>} */
  tiles: {
    // Floor
    0: { id: 0, name: "Floor", glyph: 1,  color: 8, walkable: true,  autotile: false, variants: 5 },
    1: { id: 1, name: "Water", glyph: 16, color: 5, walkable: false, autotile: true  },

    // Walls
    2: { id: 2, name: "Wall", glyph: 32, color: 9, walkable: false, autotile: true },
    3: { id: 3, name: "Wall", glyph: 48, color: 9, walkable: false, autotile: true },
  },

  /** @type {Defs.Dict<Defs.Actor>} */
  actors: {
    "player": { glyph: 80, color: 1, hp: 5, stamina: 3, souls: 0 }
  },

  /** @type {Defs.Dict<Defs.Item>} */
  items: {

  }
}
