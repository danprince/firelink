import {
  World,
  Random,
  Component,
  Entity,
  TileMap,
  Directions,
  Action,
  Behaviour,
} from "./rogue.js";

import { UI, Font, CanvasRenderer } from "./ui.js";
import { mount } from "./widgets.js";
import data from "./data.js";
import settings from "./settings.js";
import * as Actions from "./actions.js";
import * as Components from "./components.js";
import * as Systems from "./systems.js";
import * as Behaviours from "./behaviours.js";

TileMap.register(data.tiles);
Entity.register(data.entities);
Component.register(Components);
Behaviour.register(Behaviours);

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

/**
 * Provide the player's next action
 * @param {Action} action
 */
function setPlayerAction(action) {
  world.player
       .get(Components.Actor)
       .behaviour
       // @ts-ignore
       .setNextAction(action);
}

ui.commands = {
  "inspector-open": () => {
    ui.push("inspector");
  },
  "inspector-close": () => {
    ui.pop("inspector");
  },
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
  "rest": () => {
    setPlayerAction(
      new Actions.Rest()
    );
  },
  "walk-north": () => {
    setPlayerAction(
      new Actions.Walk(Directions.North)
    );
  },
  "walk-south": () => {
    setPlayerAction(
      new Actions.Walk(Directions.South)
    );
  },
  "walk-east": () => {
    setPlayerAction(
      new Actions.Walk(Directions.East)
    );
  },
  "walk-west": () => {
    setPlayerAction(
      new Actions.Walk(Directions.West)
    );
  },
  "dodge-north": () => {
    setPlayerAction(
      new Actions.Dodge(Directions.North)
    );
  },
  "dodge-south": () => {
    setPlayerAction(
      new Actions.Dodge(Directions.South)
    );
  },
  "dodge-east": () => {
    setPlayerAction(
      new Actions.Dodge(Directions.East)
    );
  },
  "dodge-west": () => {
    setPlayerAction(
      new Actions.Dodge(Directions.West)
    );
  },
  "teleport": (x, y) => {
    x = Number(x);
    y = Number(y);
    setPlayerAction(
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
  },
  "select-consumable": () => {
    world.player.get(Components.Equipment);
  },
  "select-left-hand": () => {

  },
  "select-right-hand": () => {

  },
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

  for (let i = 0; i < 1; i++) {
    let entity = new Entity("TorchHollow");
    entity.glyph = 80 + Random.int(12);
    entity.color = Random.pick(10, 11, 14, 15, 18, 19, 22, 23, 24, 25, 26, 27);
    entity.x = 1 + Random.int(world.map.width - 2);
    entity.y = 1 + Random.int(world.map.height - 2);
    world.spawn(entity);
  }
}

function init() {
  // Reset entities
  world.entities = new Map();

  // Reset systems
  world.systems = [
    new Systems.TurnSystem(),
  ];

  // Reset input bindings
  ui.input.bindings = data.bindings;

  world.camera.target = world.player.id;

  world.spawn(world.player);

  setupSandboxArea();

  world.map.autotile();

  ui.push("default");
}

function start() {
  init();

  world.player.get(Components.Actor).onAfterAction = (_, result) => {
    if (result && result.message) {
      world.message(result.message);
    } else {
      world.message("");
    }
  };

  ui.start();

  mount("#root", ui);
}

ui.events.on("ready", start);

let globals = {
  Random,
  world,
  ui,
};

if (settings["debug"]) {
  Object.assign(window, globals);
}
