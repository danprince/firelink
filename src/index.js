import {
  Actor,
  World,
  Random,
  Component,
  Entity,
  TileMap,
} from "./rogue.js";

import { UI, Font, CanvasRenderer } from "./ui.js";
import { mount } from "./widgets.js";
import data from "./data.js";
import settings from "./settings.js";
import * as Actions from "./actions.js";
import * as Components from "./components.js";

TileMap.register(data.tiles);
Entity.register(data.entities);
Component.register(Components);

let font = new Font({
  url: settings["font.url"],
  glyphWidth: settings["font.glyphWidth"],
  glyphHeight: settings["font.glyphHeight"],
});

let renderer = new CanvasRenderer({
  width: settings["renderer.width"],
  height: settings["renderer.height"],
  scale: settings["renderer.scale"],
  palette: settings["colors"],
  font: font,
});

let world = new World();

let ui = new UI(world, renderer);

for (let command of data.commands) {
  let buttons = Array.isArray(command.on) ? command.on : [command.on];
  ui.input.bind(command.mode, buttons, command.trigger);
}

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
  "set-cursor": (x, y) => {
    x = Number(x);
    y = Number(y);
    world.cursor = { x, y };
  },
  "set-camera-target": (id) => {
    world.camera.target = Number(id);
  },
  "walk-north": () => {
    world.player.setNextAction(
      new Actions.Walk(0, -1)
    );
  },
  "walk-south": () => {
    world.player.setNextAction(
      new Actions.Walk(0, 1)
    );
  },
  "walk-east": () => {
    world.player.setNextAction(
      new Actions.Walk(1, 0)
    );
  },
  "walk-west": () => {
    world.player.setNextAction(
      new Actions.Walk(-1, 0)
    );
  },
  "dodge-north": () => {
    world.player.setNextAction(
      new Actions.Dodge(0, -2)
    );
  },
  "dodge-south": () => {
    world.player.setNextAction(
      new Actions.Dodge(0, 2)
    );
  },
  "dodge-east": () => {
    world.player.setNextAction(
      new Actions.Dodge(2, 0)
    );
  },
  "dodge-west": () => {
    world.player.setNextAction(
      new Actions.Dodge(-2, 0)
    );
  },
  "teleport": (x, y) => {
    x = Number(x);
    y = Number(y);
    world.player.setNextAction(
      new Actions.MoveTo(x, y)
    );
  },
  "popup": (text) => {
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

function setupSandboxArea() {
  // Test out autotiling
  for (let x = 0; x < world.map.width; x++) {
    for (let y = 0; y < world.map.height; y++) {
      world.map.set(x, y, { type: 0 });

      if (x === 0 || y === 0 || x === world.map.width - 1 || y === world.map.height - 1) {
        world.map.set(x, y, { type: 2 });
      }
    }
  }

  world.map.set(10, 5, { type: 0 });
  world.map.set(7, 8,   { type: 1 });
  world.map.set(10, 10, { type: 1 });
  world.map.set(10, 11, { type: 1 });
  world.map.set(11, 10, { type: 1 });
  world.map.set(11, 11, { type: 1 });
  world.map.set(12, 11, { type: 1 });
  world.map.set(11, 12, { type: 1 });

  world.player.x = 3;
  world.player.y = 3;
  world.player.z = 3;

  for (let i = 0; i < 20; i++) {
    let entity = new Actor("Human");
    entity.add(new Components.Wandering);
    entity.x = 1 + Random.int(world.map.width - 2);
    entity.y = 1 + Random.int(world.map.height - 2);
    world.spawn(entity);
  }
}

function init() {
  // Reset entities
  world.entities = new Map();

  setupSandboxArea();

  world.map.autotile();
  world.camera.target = world.player.id;
  world.spawn(world.player);

  ui.push("default");
}

function start() {
  init();

  world.start();
  ui.start();

  mount("#root", ui);
}

ui.events.on("ready", start);

let globals = {
  Random,
  world,
  ui,
};

Object.assign(window, globals);
