import { Actor, World, Random } from "./rogue.js";
import { UI } from "./ui.js";
import { mount } from "./widgets.js";
import * as Actions from "./actions.js";
import * as Components from "./components.js";

class Game {
  world = new World();
  ui = new UI(this.world);

  constructor() {
    this.ui.events.on("ready", this.start)
  }

  start = () => {
    this.world.start();
    this.ui.start();
  }
}

let game = new Game();
let { world, ui } = game;
world.events.on("message", text => ui.message(text));

ui.input.bind("default", "restart", "restart");
ui.input.bind("default", "north", "move-north");
ui.input.bind("default", "east", "move-east");
ui.input.bind("default", "west", "move-west");
ui.input.bind("default", "south", "move-south");
ui.input.bind("default", "focus-console", "focus-console");
ui.input.bind("default", "toggle-editor", "editor-open");

ui.input.bind("editor", "toggle-editor", "editor-close");
ui.input.bind("editor", "editor-cycle", "editor-cycle");
ui.input.bind("editor", "exit", "editor-close");

ui.commands = {
  "editor-open": () => {
    ui.push("editor");
  },
  "editor-close": () => {
    ui.pop("editor");
  },
  "editor-cycle": () => {
    if (world.cursor == null) return;

    let { x, y } = world.cursor;
    let tile = world.map.get(x, y);

    if (tile == null) return;

    delete tile.glyph;
    tile.type = (tile.type + 1) % 3;

    world.map.autotile(x - 1, y - 1, x + 1, y + 1);
  },
  "console-get-completions": (request) => {
    for (let key in ui.commands) {
      if (key.startsWith(request.value)) {
        request.completion = key;
        break;
      }
    }
  },
  "restart": (x, y) => {
    init();
  },
  "set-hp": (value) => {
    world.player.hp = Number(value);
    ui.refresh();
  },
  "set-max-hp": (value) => {
    world.player.maxHp = Number(value);
    ui.refresh();
  },
  "set-stamina": (value) => {
    world.player.stamina = Number(value);
    ui.refresh();
  },
  "set-max-stamina": (value) => {
    world.player.maxStamina = Number(value);
    ui.refresh();
  },
  "set-souls": (value) => {
    world.player.souls = Number(value);
    ui.refresh();
  },
  "set-cursor": (x, y) => {
    x = Number(x);
    y = Number(y);
    world.cursor = { x, y };
  },
  "set-camera-target": (id) => {
    world.camera.target = Number(id);
  },
  "move-north": () => {
    enqueue(Actions.MoveBy(0, -1));
  },
  "move-south": () => {
    enqueue(Actions.MoveBy(0, 1));
  },
  "move-east": () => {
    enqueue(Actions.MoveBy(1, 0));
  },
  "move-west": () => {
    enqueue(Actions.MoveBy(-1, 0));
  },
  "teleport": (x, y) => {
    x = Number(x);
    y = Number(y);
    enqueue(Actions.MoveTo(x, y));
  },
  "pop": (text) => {
    ui.events.emit("popup", {
      x: world.player.x,
      y: world.player.y,
      height: 1,
      body: text,
    });
  }
};

// Command Aliases
ui.commands["tp"] = ui.commands["teleport"];

// Command Utils
function enqueue(action) {
  world.player.addActionAsync(action);
}

function init() {
  world.entities = new Map();

  // Test out autotiling
  for (let x = 0; x < world.map.width; x++) {
    for (let y = 0; y < world.map.height; y++) {
      let glyph = Random.pick(2, 3, 4, 5, 6);
      world.map.set(x, y, { type: 0, glyph });

      if (x === 0 || y === 0 || x === world.map.width - 1 || y === world.map.height - 1) {
        world.map.set(x, y, { type: 1 });
      }
    }
  }

  world.map.set(10, 5, { type: 0 });
  world.map.set(7, 8, { type: 2 });
  world.map.set(10, 10, { type: 2 });
  world.map.set(10, 11, { type: 2 });
  world.map.set(11, 10, { type: 2 });
  world.map.set(11, 11, { type: 2 });
  world.map.set(12, 11, { type: 2 });
  world.map.set(11, 12, { type: 2 });
  world.map.autotile();

  world.player.x = 3;
  world.player.y = 3;
  world.spawn(world.player);
  world.camera.target = world.player.id;

  for (let i = 0; i < 20; i++) {
    let glyph = Random.pick(64, 65, 66, 67, 68, 69, 70, 71, 72);
    let color = Random.pick(1, 2, 3, 4, 5, 6);
    let entity = new Actor({ glyph, color });
    entity.add(new Components.Wandering);
    entity.x = Random.int(world.map.width);
    entity.y = Random.int(world.map.height);
    world.spawn(entity);
  }
}

init();

ui.events.on("ready", () => {
  // Mount the UI and start the game
  mount("#root", ui);
});
