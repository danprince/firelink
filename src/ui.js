import settings from "./settings.js";
import { Emitter } from "./rogue.js";

export class Font {
  /**
   * @typedef {Object} FontConfig
   * @property {string} url
   * @property {number} columns
   * @property {number} rows
   * @param {FontConfig} config
   */
  constructor(config) {
    this.image = new Image();
    this.image.src = config.url;
    this.columns = 0;
    this.rows = 0;
    this.glyphWidth = config.glyphWidth;
    this.glyphHeight = config.glyphHeight;

    this.image.addEventListener("load", () => {
      this.columns = this.image.width / this.glyphWidth;
      this.rows = this.image.height / this.glyphHeight;
    });
  }
}

export class Console {
  /**
   * @param {number} width
   * @param {number} height
   */
  constructor(width, height) {
    this.resize(width, height);
  }

  /**
   * @param {number} glyph
   * @param {number} color
   * @param {number} x
   * @param {number} y
   */
  put(glyph, color, x, y, z) {
    let index = x + y * this.width;

    if (z >= this.depth[index]) {
      this.glyphs[index] = glyph;
      this.colors[index] = color;
      this.depth[index] = z;
    }
  }

  /**
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.glyphs = new Uint8Array(this.width * this.height);
    this.colors = new Uint8Array(this.width * this.height);
    this.depth = new Uint8Array(this.width * this.height);
  }

  clear() {
    this.glyphs.fill(0);
    this.colors.fill(0);
    this.depth.fill(0);
  }
}

export class Renderer {
  /**
   * @typedef {Object} RendererConfig
   * @property {number} width
   * @property {number} height
   * @property {Font} font
   * @property {string[]} palette
   * @property {number} scale
   * @param {RendererConfig}
   */
  constructor({ width, height, font, palette, scale=1 }) {
    this.palette = palette;
    this.font = font;
    this.scale = scale;
    this.ready = false;
    this.console = new Console(width, height);
    this.screen = new Console(width, height);
    this.events = new Emitter();
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  worldToScreen = (x, y) => {
    return {
      x: x * this.scale * this.font.glyphWidth,
      y: y * this.scale * this.font.glyphHeight,
    };
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  screenToWorld = (x, y) => {
    return {
      x: Math.floor(x / (this.scale * this.font.glyphWidth)),
      y: Math.floor(y / (this.scale * this.font.glyphHeight)),
    };
  }

  init() {}
  draw() {}
}

export class CanvasRenderer extends Renderer {
  /**
   * @param {RendererConfig} config
   */
  constructor(config) {
    super(config);
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.fontColorCache = [];
    this.font.image.addEventListener("load", this.handleFontLoad);
    this.resolution = window.devicePixelRatio || 1;
  }

  handleFontLoad = () => {
    this.ready = true;
    this.events.emit("ready");
    this.init();
  }

  init = () => {
    this.fontColorCache = this.createFontColorCache();

    let width = this.console.width * this.font.glyphWidth * this.scale;
    let height = this.console.height * this.font.glyphHeight * this.scale;

    // Retina display scaling
    this.canvas.width = width * this.resolution;
    this.canvas.height = height * this.resolution;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(this.resolution, this.resolution);

    // Allow for crisp upscaling
    this.ctx.imageSmoothingEnabled = false;
  }

  draw() {
    const DEBUG = settings.debug;

    let calls = 0;

    this.ctx.save();
    this.ctx.scale(this.scale, this.scale);

    for (let x = 0; x < this.console.width; x++) {
      for (let y = 0; y < this.console.height; y++) {
        let i = x + y * this.console.width;
        let glyph = this.console.glyphs[i];
        let color = this.console.colors[i];

        if (
          this.console.glyphs[i] === this.screen.glyphs[i] &&
          this.console.colors[i] === this.screen.colors[i]
        ) continue;

        let gx = glyph % this.font.columns;
        let gy = Math.floor(glyph / this.font.columns);
        let gw = this.font.glyphWidth;
        let gh = this.font.glyphHeight;

        this.ctx.clearRect(x * gw, y * gh, gw, gh);

        if (DEBUG) {
          calls += 1;
        }

        if (glyph === 0) {
          continue;
        }

        this.ctx.drawImage(
          this.fontColorCache[color],
          gx * gw,
          gy * gh,
          gw,
          gh,
          x * gw,
          y * gh,
          gw,
          gh,
        );
      }
    }

    this.ctx.restore();

    // Clear depths before next render
    this.console.depth.fill(0);

    // Swap the glyph/color buffers between the screen console and the memory
    // one. This allows us to check whether the contents of the memory buffer
    // have changed from the one on screen, next time we render.
    let glyphs = this.console.glyphs;
    let colors = this.console.colors;
    this.console.glyphs = this.screen.glyphs;
    this.console.colors = this.screen.colors;
    this.screen.glyphs = glyphs;
    this.screen.colors = colors;

    if (DEBUG && calls > 0) {
      this.events.emit("stats", { calls });
    }
  }

  createFontColorCache() {
    return Object.values(this.palette).map(color => {
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");

      canvas.width = this.font.image.width || 1;
      canvas.height = this.font.image.height || 1;

      ctx.drawImage(this.font.image, 0, 0);
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      return canvas;
    });
  }
}

export class Input {
  groups = [new Set(["default"])];
  commands = [];
  listeners = [];

  getCurrentGroup() {
    return this.groups[this.groups.length - 1];
  }

  push(id, exclusive=false) {
    let currentGroup = this.getCurrentGroup();

    if (exclusive) {
      this.groups.push(new Set([id]));
    } else {
      currentGroup.add(id);
    }
  }

  pop(id) {
    let group = this.getCurrentGroup();
    group.delete(id);

    if (group.size === 0) {
      this.groups.pop();
    }
  }

  listen(listener) {
    this.listeners.push(listener);
  }

  unlisten(listener) {
    this.listeners = this.listeners.filter(other => other !== listener);
  }

  bind(group, name, action) {
    for (let button of settings.controls[name]) {
      this.commands.push({ group, button, action });
    }
  }

  handleEvent = (event) => {
    if (event instanceof KeyboardEvent) {
      this.fire(event.key);
    } else if (event instanceof MouseEvent) {
      this.fire(`mouse-${event.button}`);

      switch (event.button) {
        case 0: return this.fire("left-click");
        case 1: return this.fire("middle-click");
        case 2: return this.fire("right-click");
      }
    }
  }

  fire(button) {
    let group = this.getCurrentGroup();

    // Take a copy of this group, so that it can't change whilst we
    // are processing this input event.
    group = new Set(group);

    for (let command of this.commands) {
      if (command.button === button && group.has(command.group)) {
        this.trigger(command.action);
      }
    }
  }

  trigger(action) {
    for (let listener of this.listeners) {
      listener(action);
    }
  }

  addEventListeners() {
    window.addEventListener("keydown", this.handleEvent);
    window.addEventListener("mousedown", this.handleEvent);
  }

  removeEventListeners() {
    window.removeEventListener("keydown", this.handleEvent);
    window.removeEventListener("mousedown", this.handleEvent);
  }
}

export class UI {
  commands = {};
  events = new Emitter();
  input = new Input();
  ready = false;

  renderer = new CanvasRenderer({
    width: settings.renderer.width,
    height: settings.renderer.height,
    scale: settings.renderer.scale,
    palette: settings.renderer.colors,
    font: new Font({
      url: settings.renderer.font.url,
      glyphWidth: settings.renderer.font.glyphWidth,
      glyphHeight: settings.renderer.font.glyphHeight,
    }),
  });

  constructor(world) {
    this.world = world;

    this.events.on("dispatch", cmd => {
      if (cmd.name in this.commands) {
        this.runCommand(cmd.name, cmd.args);
      } else {
        this.events.emit("console-message", "No such command");
      }
    });

    this.renderer.font.image.addEventListener("load", () => {
      this.ready = true;
      this.events.emit("ready");
    });
  }

  runCommand(name, args) {
    if (name in this.commands) {
      this.commands[name](...args);
      return true;
    }

    return false;
  }

  start() {
    this.input.addEventListeners();

    this.input.listen(event => {
      this.events.emit(event);
      this.runCommand(event, []);
    });

    document.body.style.background = settings.renderer.colors[0];
    document.body.style.color = settings.renderer.colors[1];
  }

  message(text) {
    this.events.emit("set-message", text);
  }

  refresh() {
    this.events.emit("refresh");
  }

  push(group, exclusive=false) {
    this.input.push(group, exclusive);
    this.events.emit("set-group");
  }

  pop(group) {
    this.input.pop(group);
    this.events.emit("set-group");
  }

  screenToWorld(screenX, screenY) {
    let { x, y } = this.renderer.screenToWorld(screenX, screenY);

    return {
      x: x + this.world.camera.x,
      y: y + this.world.camera.y,
    };
  }

  worldToScreen(worldX, worldY) {
    return this.renderer.worldToScreen(
      worldX - this.world.camera.x,
      worldY - this.world.camera.y,
    );
  }
}
