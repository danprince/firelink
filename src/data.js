export default {
  /** @type {Defs.Dict<Defs.Tile>} */
  tiles: {
    0: { glyph: 2,  color: 8,  walkable: true,  autotile: false },
    1: { glyph: 16, color: 10, walkable: false, autotile: true  },
    2: { glyph: 32, color: 4,  walkable: false, autotile: true  },
  },

  /** @type {Defs.Dict<Defs.Actor>} */
  actors: {
    "player": { glyph: 64, color: 1, hp: 5, stamina: 3, souls: 0 }
  },

  /** @type {Defs.Dict<Defs.Item>} */
  items: {

  }
}
