export default {
  /**
   * @type {Rogue.UI.Binding[]}
   */
  bindings: [
    // Default controls
    { mode: "default", "on": "restart", trigger: "restart" },
    { mode: "default", "on": "toggle-editor", trigger: "editor-open" },
    { mode: "default", "on": "focus-console", trigger: "focus-console" },

    { mode: "default", "on": "rest", trigger: "rest" },
    { mode: "default", "on": "north", trigger: "walk-north" },
    { mode: "default", "on": "east", trigger: "walk-east" },
    { mode: "default", "on": "south", trigger: "walk-south" },
    { mode: "default", "on": "west", trigger: "walk-west" },
    { mode: "default", "on": "dodge-north", trigger: "dodge-north" },
    { mode: "default", "on": "dodge-east", trigger: "dodge-east" },
    { mode: "default", "on": "dodge-south", trigger: "dodge-south" },
    { mode: "default", "on": "dodge-west", trigger: "dodge-west" },

    // Editor controls
    { mode: "editor", "on": "toggle-editor", trigger: "editor-close" },
    { mode: "editor", "on": "editor-cycle", trigger: "editor-cycle" },
    { mode: "editor", "on": "exit", trigger: "editor-close" },
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
      id: "Item",
      attributes: {
        z: 1,
      },
    },
    {
      id: "Creature",
      attributes: {
        z: 2,
      },
      components: {
        Actor: { behaviour: "Resting" },
        Stats: { hitpoints: 1, stamina: 1 },
      }
    },
    {
      id: "Enemy",
      extends: "Creature",
      components: {
        Actor: { behaviour: "Guarding" },
        Disposition: "hostile-to-player"
      }
    },
    {
      id: "Human",
      extends: "Creature",
      attributes: {
        glyph: 80,
        color: 23,
      },
    },
    {
      id: "Hollow",
      extends: "Enemy",
      attributes: {
        glyph: 81,
        color: 22,
      },
      components: {
        Actor: { behaviour: "Wandering" },
        Stats: { hitpoints: 3, stamina: 3 },
      },
    },
    {
      id: "TorchHollow",
      extends: "Hollow",
      attributes: {
        glyph: 82,
        color: 26,
      },
      components: {
        Stats: { hitpoints: 3, stamina: 3 },
        Souls: 20,
      },
    },
    {
      id: "SpearHollow",
      extends: "Hollow",
      attributes: {
        glyph: 83,
      },
      components: {
        Souls: 20,
      },
    },
    {
      id: "SwordHollow",
      extends: "Hollow",
      attributes: {
        glyph: 84,
      },
      components: {
        Souls: 20,
      },
    },
    {
      id: "Player",
      extends: ["Human"],
      attributes: {
        color: 1,
        z: 3,
      },
      components: {
        Stats: { hitpoints: 6, stamina: 6 },
        Souls: 40,
        Inventory: {},
        Equipment: {
          leftHand: "BlackKnightGreatSword",
        },
      },
    },
    {
      id: "BlackKnightGreatSword",
      extends: "Item",
      attributes: {
        glyph: 94,
        color: 9,
      },
      components: {
        Item: { weight: 10 },
        Equipable: "wield",
        Modifiers: {
          Bleed: { amount: 1 },
        },
      }
    }
  ],
}
