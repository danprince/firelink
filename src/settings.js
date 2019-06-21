export default {
  "debug": true,
  "map.width": 40,
  "map.height": 40,
  "renderer.width": 20,
  "renderer.height": 20,
  "renderer.scale": 2.25,
  "renderer.font.url": "assets/10x10.png",
  "renderer.font.glyphWidth": 10,
  "renderer.font.glyphHeight": 10,
  "renderer.colors": [
    "#222321", // 0 - black
    "#eaeaea", // 1 - white
    "#a33333", // 2 - red
    "#419562", // 3 - green
    "#698cea", // 4 - blue
    "magenta", // 5 - reserved
    "magenta", // 6 - reserved
    "magenta", // 7 - reserved

    // greens (8-11)
    "#2a3127",
    "#363e32",
    "#555d51",
    "#dbe6d6",

    // greys (12-15)
    "#1d252a",
    "#2a3139",
    "#485263",
    "#bfd4ea",

    // purples (16-19)
    "#2a1728",
    "#392439",
    "#553354",
    "#eaa1d1",

    // browns (20-23)
    "#2a1717",
    "#392424",
    "#553333",
    "#eaa1a1",

    // oranges (24-27)
    "#804315",
    "#bf6b07",
    "#cd8b3c",
    "#ffc14a",
  ],
  "controls": {
    "exit": ["Escape"],
    "toggle-editor": ["e"],
    "editor-cycle": ["left-click"],
    "focus-console": ["/"],
    "north": ["k"],
    "east": ["l"],
    "south": ["j"],
    "west": ["h"],
    "restart": ["r"],
  },
  "rules.maxActionTries": 10,
}
