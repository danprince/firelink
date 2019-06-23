export default {
  /**
   * @type {Rogue.Binding[]}
   */
  commands: [
    // Default controls
    { mode: "default", "on": "restart",       trigger: "restart" },
    { mode: "default", "on": "north",         trigger: "move-north" },
    { mode: "default", "on": "east",          trigger: "move-east" },
    { mode: "default", "on": "south",         trigger: "move-south" },
    { mode: "default", "on": "west",          trigger: "move-west" },
    { mode: "default", "on": "toggle-editor", trigger: "editor-open" },
    { mode: "default", "on": "focus-console", trigger: "focus-console" },

    // Editor controls
    { mode: "editor", "on": "toggle-editor", trigger: "editor-close" },
    { mode: "editor", "on": "editor-cycle",  trigger: "editor-cycle" },
    { mode: "editor", "on": "exit",          trigger: "editor-close" },
  ],

  /**
   * @type {{ [id: string]: Rogue.TileType }}
   */
  tiles: {
    // Floor
    0: { id: 0, name: "Floor", glyph: 1,  color: 8, walkable: true,  autotile: false, variants: 5 },
    1: { id: 1, name: "Water", glyph: 16, color: 5, walkable: false, autotile: true  },

    // Walls
    2: { id: 2, name: "Wall", glyph: 32, color: 9, walkable: false, autotile: true },
    3: { id: 3, name: "Wall", glyph: 48, color: 9, walkable: false, autotile: true },
  },

  /**
   * @type {Rogue.EntityType[]}
   */
  entities: [
    {
      id: "Creature",
      components: {
        Hitpoints: 1,
        Stamina: 1,
      }
    },
    {
      id: "Human",
      extends: ["Creature"],
      attributes: {
        glyph: 80,
        color: 23,
      },
    },
    {
      id: "Player",
      extends: ["Human"],
      attributes: {
        color: 1,
      },
      components: {
        Hitpoints: 3,
        Stamina: 3,
      },
    },
  ],
}
