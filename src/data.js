export default {
  tiles: {
    0: { glyph: 2, color: 2, walkable: true },
    1: { glyph: 16, color: 4, walkable: false },
    2: { glyph: 32, color: 3, walkable: false },
  },
  autotiling: {
    1: "wall",
    2: "tile",
  },
  actors: {
    "player": { glyph: 64, color: 1, hp: 5, stamina: 3 }
  }
}
