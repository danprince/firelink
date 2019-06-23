export default {
  "debug": true,
  "map.width": 10,
  "map.height": 10,
  "renderer.width": 20,
  "renderer.height": 20,
  "renderer.scale": 2.25,
  "font.url": "assets/10x10.png",
  "font.glyphWidth": 10,
  "font.glyphHeight": 10,
  "colors": [
    "#222321", // 0 black
    "#eaeaea", // 1 white
    "#a33333", // 2 red
    "#419562", // 3 green
    "#698cea", // 4 blue
    "#177c76", // 5 aqua
    "magenta", // 6 reserved
    "magenta", // 7 reserved
    "#2a3127", // 8-11 greens
    "#363e32",
    "#555d51",
    "#dbe6d6",
    "#1d252a", // 12-15 greys
    "#2a3139",
    "#485263",
    "#bfd4ea",
    "#2e2439", // 16-19 purples
    "#473355",
    "#492a80",
    "#7445c6",
    "#392424", // 20-23 browns
    "#553333",
    "#784d4d",
    "#eab1a1",
    "#804315", // 24-27 oranges
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
