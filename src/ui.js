import settings from "./settings.js";
import { World, TileMap } from "./rogue.js";
import { Emitter, clamp } from "./utils.js";

export class Font {
  /**
   * @param {Rogue.UI.FontConfig} config
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
   * @param {Rogue.UI.RendererConfig} config
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

  /**
   * @type {HTMLElement}
   */
  get element() {
    return null;
  }

  init() {}
  draw() {}
  flush() {}
  tick() {}

  start() {
    this.loop();
  }

  stop() {
    cancelAnimationFrame(this.animationFrame);
  }

  loop = () => {
    this.draw();
    this.flush();
    this.tick();
    this.animationFrame = requestAnimationFrame(this.loop);
  }
}

export class CanvasRenderer extends Renderer {
  /**
   * @param {Rogue.UI.RendererConfig} config
   */
  constructor(config) {
    super(config);
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.font.image.addEventListener("load", this.handleFontLoad);
    this.resolution = window.devicePixelRatio || 1;
    this.ready = this.font.image.complete;

    /** @type {HTMLCanvasElement[]} */
    this.fontColorCache = [];
  }

  get element() {
    return this.canvas;
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

  flush() {
    const DEBUG = settings["debug"];

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
  /** @type {Set<string>[]} */
  stack = [new Set()];

  /** @type {Rogue.UI.Binding[]} */
  bindings = [];

  /** @type {((action: string) => void)[]} */
  listeners = [];

  /** @type {Set<string>} */
  pressed = new Set();

  getActiveModes() {
    return this.stack[this.stack.length - 1];
  }

  /**
   * @param {string} mode
   */
  push(mode, exclusive=false) {
    let modes = this.getActiveModes();

    if (exclusive) {
      this.stack.push(new Set([mode]));
    } else {
      modes.add(mode);
    }
  }

  /**
   * @param {string} mode
   */
  pop(mode) {
    let modes = this.getActiveModes();

    modes.delete(mode);

    if (modes.size === 0 && this.stack.length > 0) {
      this.stack.pop();
    }
  }

  /**
   * @param {(action: string) => void} listener
   */
  listen(listener) {
    this.listeners.push(listener);
  }

  /**
   * @param {(action: string) => void} listener
   */
  unlisten(listener) {
    this.listeners = this.listeners.filter(other => other !== listener);
  }

  /**
   * @param {string} mode
   * @param {string} on
   * @param {string} trigger
   */
  bind(mode, on, trigger) {
    this.bindings.push({ mode, on, trigger });
  }

  /**
   * @param {string} action
   */
  trigger(action) {
    for (let listener of this.listeners) {
      listener(action);
    }
  }

  /**
   * @param {string} key
   */
  press(key) {
    this.pressed.add(key);

    // Take a copy of the modes, so that they can't change whilst we
    // are triggering commands from this input event.
    let modes = new Set(this.getActiveModes());

    for (let command of this.bindings) {
      // Check that we're in the correct mode for this command
      if (modes.has(command.mode) === false) {
        continue;
      }

      /** @type {(string | string[])[]} */
      let groups = settings["controls"][command.on];

      let pressed = groups.some(group => {
        let keys = typeof group === "string" ? [group] : group;

        return (
          keys.length === this.pressed.size &&
          keys.every(key => this.pressed.has(key))
        );
      });

      // Trigger the action for this command
      if (pressed) {
        this.trigger(command.trigger);
      }
    }
  }

  /**
   * @param {string} key
   */
  release(key) {
    this.pressed.delete(key);
  }

  handlePageBlur = () => {
    this.pressed.clear();
  }

  /**
   * @param {KeyboardEvent} event
   */
  handleKeyDown = event => {
    let key = event.key.toLowerCase();
    this.press(key);
  }

  /**
   * @param {KeyboardEvent} event
   */
  handleKeyUp = event => {
    let key = event.key.toLowerCase();
    this.release(key);
  }

  /**
   * @param {MouseEvent} event
   */
  handleMouseDown = event => {

    switch (event.button) {
      case 0: return this.press("left-click");
      case 1: return this.press("middle-click");
      case 2: return this.press("right-click");
      default: return this.press(`mouse-${event.button}`);
    }
  }

  /**
   * @param {MouseEvent} event
   */
  handleMouseUp = event => {
    switch (event.button) {
      case 0: return this.release("left-click");
      case 1: return this.release("middle-click");
      case 2: return this.release("right-click");
      default: return this.release(`mouse-${event.button}`);
    }
  }

  addEventListeners() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("blur", this.handlePageBlur);
  }

  removeEventListeners() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("blur", this.handlePageBlur);
  }
}

export class UI {
  commands = {};
  events = new Emitter();
  input = new Input();
  ready = false;

  /**
   * @param {World} world
   * @param {Renderer} renderer
   */
  constructor(world, renderer) {
    this.world = world;
    this.renderer = renderer;

    this.renderer.font.image.addEventListener("load", () => {
      this.ready = true;
      this.events.emit("ready");
    });
  }

  start() {
    this.input.addEventListeners();

    this.input.listen(event => {
      this.events.emit(event);
      this.run(event, []);
    });

    this.events.on("dispatch", cmd => {
      if (cmd.name in this.commands) {
        this.run(cmd.name, cmd.args);
      } else {
        this.events.emit("console-message", "No such command");
      }
    });

    this.world.events.on("message", this.message);

    let colors = settings["colors"];
    document.body.style.background = colors[0];
    document.body.style.color = colors[1];

    this.world.start();
  }

  update = () => {
    this.world.update();
    this.updateCameraPosition();
  }

  updateCameraPosition() {
    let { camera } = this.world;
    let { console } = this.renderer;

    let target = this.world.getEntityById(camera.target);

    if (target) {
      let minCameraX = 0;
      let minCameraY = 0;
      let maxCameraX = this.world.map.width - console.width;
      let maxCameraY = this.world.map.height - console.height;
      let cameraX = target.x - Math.floor(console.width / 2);
      let cameraY = target.y - Math.floor(console.height / 2);

      camera.x = clamp(minCameraX, cameraX, maxCameraX);
      camera.y = clamp(minCameraY, cameraY, maxCameraY);
    }
  }

  /**
   * @param {string} name
   * @param {any[]} args
   */
  run(name, args) {
    if (name in this.commands) {
      this.commands[name](...args);
      return true;
    }

    return false;
  }

  /**
   * @param {number} screenX
   * @param {number} screenY
   */
  screenToWorld(screenX, screenY) {
    let { x, y } = this.renderer.screenToWorld(screenX, screenY);

    return {
      x: x + this.world.camera.x,
      y: y + this.world.camera.y,
    };
  }

  /**
   * @param {number} worldX
   * @param {number} worldY
   */
  worldToScreen(worldX, worldY) {
    return this.renderer.worldToScreen(
      worldX - this.world.camera.x,
      worldY - this.world.camera.y,
    );
  }

  /**
   * @param {string} mode
   */
  push(mode, exclusive=false) {
    this.input.push(mode, exclusive);

    let modes = Array.from(this.input.getActiveModes());
    this.events.emit("update-mode", modes);
  }

  /**
   * @param {string} mode
   */
  pop(mode) {
    this.input.pop(mode);

    let modes = Array.from(this.input.getActiveModes());
    this.events.emit("update-mode", modes);
  }

  refresh = () => {
    this.events.emit("refresh");
  }

  /**
   * @param {string} text
   */
  message = (text) => {
    this.events.emit("set-message", text);
  }

  /**
   * @param {{ x: number, y: number, body: string }} popup
   */
  popup = (popup) => {
    this.events.emit("popup", popup);
  }

  /**
   * @param {string} name
   * @param {any[]} args
   */
  dispatch = (name, ...args) => {
    this.events.emit("dispatch", { name, args });
  }

  startRenderer() {
    this.renderer.draw = this.draw;
    this.renderer.tick = this.update;
    this.renderer.start();
  }

  stopRenderer() {
    this.renderer.stop();
  }

  draw = () => {
    let { world, renderer } = this;
    let { camera } = world;
    let { console } = renderer;

    for (let x = 0; x < console.width; x++) {
      for (let y = 0; y < console.height; y++) {
        let tile = world.map.get(camera.x + x, camera.y + y);

        if (tile == null) {
          continue;
        }

        let type = TileMap.registry[tile.type];
        let glyph = tile.glyph || type.glyph;
        let color = tile.color || type.color;

        if (tile) {
          console.put(glyph, color, x, y, 0);
        } else {
          console.put(0, 0, x, y, 0);
        }
      }
    }

    for (let [_, entity] of world.entities) {
      let x = entity.x - camera.x;
      let y = entity.y - camera.y;
      let z = entity.z;

      if (x < 0 || y < 0 || x >= console.width || y >= console.height) {
        continue;
      }

      console.put(entity.glyph, entity.color, x, y, z);
    }
  }
}
