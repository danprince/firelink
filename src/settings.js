export default {
  debug: true,
  map: {
    width: 40,
    height: 40,
  },
  renderer: {
    width: 20,
    height: 20,
    scale: 2.25,
    font: {
      url: "assets/10x10.png",
      glyphWidth: 10,
      glyphHeight: 10,
    },
    colors: {
      0: "#2a3127",
      1: "#dbe6d6",
      2: "#363e32",
      3: "#2a5a61",
      4: "#555d51",
      5: "#712f24",
      6: "#357124",
    }
  },
  controls: {
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
  rules: {
    maxActionTries: 10
  }
}
