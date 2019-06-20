import { h, Component, render } from "https://cdn.pika.dev/preact/v8";
import { Font, CanvasRenderer } from "./ui.js";
import { Utils } from "./rogue.js";
import settings from "./settings.js";
import data from "./data.js";

let classes = (...classNames) => classNames.filter(x => x).join(" ");
let color = (index) => settings.renderer.colors[index];

let scaleX = (x) => {
  return x * settings.renderer.font.glyphWidth * settings.renderer.scale;
};

let scaleY = (y) => {
  return y * settings.renderer.font.glyphHeight * settings.renderer.scale;
};

class Glyph extends Component {
  static cache = {};

  static renderer = new CanvasRenderer({
    width: 1,
    height: 1,
    scale: 1,
    palette: settings.renderer.colors,
    font: new Font({
      url: settings.renderer.font.url,
      glyphWidth: settings.renderer.font.glyphWidth,
      glyphHeight: settings.renderer.font.glyphHeight,
    }),
  });

  static toBase64(glyph, color, scale) {
    this.renderer.scale = scale;
    this.renderer.init();
    this.renderer.console.put(glyph, color, 0, 0, 0);
    this.renderer.draw();
    return this.renderer.canvas.toDataURL();
  }

  componentDidMount() {
    // If a glyph tries to render before the font has loaded,
    // then force a re-render once it has loaded.
    if (Glyph.renderer.ready === false) {
      Glyph.renderer.events.on("ready", () => this.forceUpdate());
    }
  }

  render() {
    if (!Glyph.renderer.ready) {
      return null;
    }

    let { id, color, scale=settings.renderer.scale } = this.props;
    let key = `${id}-${color}-${scale}`;

    if (Glyph.cache[key] == null) {
      Glyph.cache[key] = Glyph.toBase64(id, color, scale);
    }

    let style = {
      width: Glyph.renderer.font.glyphWidth * scale,
      height: Glyph.renderer.font.glyphHeight * scale,
    };

    let src = Glyph.cache[key];

    return h("img", { src, style });
  }
}

function parse(string) {
  let color = 1;
  let parts = [];

  while (string.length) {
    let colorMatch = string.match(/^\[(\d+?)\]/);
    let glyphMatch = string.match(/^\((\d+?)\)/);
    let textMatch = string.match(/^[^\(\[]+/);

    if (colorMatch) {
      string = string.slice(colorMatch[0].length);
      color = Number(colorMatch[1]);
      continue;
    }

    else if (glyphMatch) {
      string = string.slice(glyphMatch[0].length);
      let glyph = Number(glyphMatch[1]);
      parts.push({ glyph, color });
      continue;
    }

    else if (textMatch) {
      string = string.slice(textMatch[0].length);
      let text = textMatch[0];
      parts.push({ text, color });
      continue;
    }

    else {
      break;
    }
  }

  return parts;
}

let Text = ({ children }) => {
  let parts = parse(children[0]);

  return h("span", { class: "text" }, parts.map(part => {
    if (part.glyph) {
      return h(Glyph, { id: part.glyph, color: part.color });
    }

    if (part.text) {
      let style = {
        lineHeight: `${4 + scaleY(1)}px`,
        height: scaleY(1),
        color: color(part.color),
      };

      return h("span", { style }, part.text);
    }
  }));
};

let Box = ({
  as="div",
  width,
  height,
  direction,
  justify,
  align,
  ...rest
}) => {
  let style = { ...rest.style };

  let fontOffsetPx = 4;
  style.lineHeight = `${fontOffsetPx + scaleY(1)}px`;
  style.minWidth = `${scaleX(1)}px`;
  style.minHeight = `${scaleY(1)}px`;

  if (width) style.width = scaleX(width);
  if (height) style.height = scaleY(height);
  if (align) style.alignItems = align;
  if (justify) style.justifyContent = justify;
  if (direction) style.flexDirection = direction;

  let className = classes(`box`, rest.class);

  return h(as, { ...rest, class: className, style });
};

class AnimatedNumber extends Component {
  state = { value: this.props.value }

  componentDidUpdate(prevProps) {
    if (this.props.value !== prevProps.value) {
      this.adjust();
    }
  }

  adjust = () => {
    if (this.props.value === this.state.value) return;

    this.setState(state => {
      let delta = this.props.value - state.value;
      let step = Math.abs(delta) / 2;
      let change = Math.ceil(step) * Math.sign(delta);
      return { value: state.value + change };
    });

    requestAnimationFrame(this.adjust);
  }

  render() {
    return String(this.state.value);
  }
}

class Console extends Component {
  input = null;

  componentWillMount() {
    let { ui } = this.props;
    ui.events.on("focus-console", this.focus);
    ui.events.on("console-message", this.flashMessage);
  }

  componentWillUnmount() {
    let { ui } = this.props;
    ui.events.off("focus-console", this.focus);
    ui.events.off("console-message", this.flashMessage);
  }

  execute() {
    let value = this.input.value.trim();

    this.input.value = "";
    this.input.blur();

    if (value) {
      let [name, ...args] = value.split(" ");
      this.props.dispatch(name, ...args);
    }
  }

  autocomplete() {
    let request = {
      value: this.input.value,
      completion: null,
    };

    this.props.dispatch("console-get-completions", request);

    if (request.completion) {
      this.input.value = request.completion;
    }
  }

  flashMessage = (message) => {
    let currentValue = this.input.value;

    this.input.value = message;
    this.input.setAttribute("disabled", "");

    setTimeout(() => {
      this.input.removeAttribute("disabled");
      this.input.value = currentValue;
    }, 2000);
  }

  handleKeyDown = (event) => {
    event.stopPropagation();

    switch (event.key) {
      case "Enter":
        return this.execute();

      case "Tab":
        event.preventDefault();
        return this.autocomplete();
    }
  }

  focus = () => {
    // Prevent the console from capturing keys from the command
    // that focused it.
    setTimeout(() => {
      this.input.focus();
      this.input.value = "";
    });
  }

  render() {
    return (
      h(Box, { class: "console", height: 1 },
        h("input", {
          type: "text",
          onKeyDown: this.handleKeyDown,
          ref: el => this.input = el
        })
      )
    );
  }
}

let Palette = () => {
  let colors = settings.renderer.colors;

  return (
    h(Box, { class: "palette", height: 1 },
      Object.keys(colors).map(index => (
        h(Box, {
          class: "swatch",
          justify: "center",
          width: 1,
          height: 1,
          style: { background: colors[index] }
        }, index)
      ))
    )
  );
}

class Debug extends Component {
  state = {
    group: new Set(),
    cursor: null,
    entity: null,
    rendererStats: null,
    turns: 0,
  }

  componentDidMount() {
    let { ui } = this.props;
    ui.events.on("set-cursor", this.setCursor);
    ui.events.on("set-group", this.setGroup);
    ui.world.events.on("turn", this.refresh);
    ui.renderer.events.on("stats", this.setRendererStats);

    let group = ui.input.getCurrentGroup();
    this.setState({ group });
  }

  componentWillUnmount() {
    let { ui } = this.props;
    ui.events.off("set-cursor", this.setCursor);
    ui.events.off("set-group", this.setGroup);
    ui.world.events.off("turn", this.refresh);
    ui.renderer.events.off("stats", this.setRendererStats);
  }

  refresh = () => this.forceUpdate();

  setRendererStats = (stats) => {
    this.setState({ rendererStats: stats });
  }

  setCursor = cursor => {
    let { ui } = this.props;
    let entity = ui.world.getEntityAtCursor();
    this.setState({ cursor, entity });
  }

  setGroup = () => {
    let { ui } = this.props;
    let group = ui.input.getCurrentGroup();
    this.setState({ group });
  }

  render() {
    let { ui } = this.props;
    let { cursor, group, entity, rendererStats } = this.state;

    return (
      h(Box, { class: "debug", direction: "column" },
        h(Box, { justify: "space-between" },
          h("div", {}, `X=${cursor && cursor.x} Y=${cursor && cursor.y}`),
          entity && h("div", {}, `Entity=${entity.id}`),
          h("div", {}, Array.from(group).join(" | ")),
        ),
        h(Box, { justify: "space-between" },
          rendererStats && h("div", {}, `turns=${ui.world.turns} draws=${rendererStats.calls}`),
        ),
      )
    )
  }
}

export class Popup extends Component {
  static defaultProps = {
    duration: 2000
  }

  componentDidMount() {
    this.timeout = setTimeout(this.close, this.props.duration);
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  close = () => {
    this.props.onRequestClose();
  }

  render() {
    let { ui, x, y, width, height, children } = this.props;

    let translate = ui.worldToScreen(x, y);

    let style = {
      left: `${translate.x}px`,
      top: `${translate.y}px`,
    };

    return (
      h(Box, {
        class: "popup",
        justify: "center",
        width,
        height,
        style,
        children,
      })
    );
  }
}

export class PopupManager extends Component {
  state = { popups: [] }

  componentDidMount() {
    let { ui } = this.props;
    ui.events.on("popup", this.addPopup)
    ui.world.events.on("turn", this.refresh)
  }

  componentWillUnmount() {
    let { ui } = this.props;
    ui.events.off("popup", this.addPopup)
    ui.world.events.off("turn", this.refresh)
  }

  refresh = () => this.forceUpdate();

  addPopup = popup => {
    this.setState(state => {
      return { popups: [...state.popups, popup] };
    });
  }

  removePopup = popup => {
    this.setState(state => {
      let popups = state.popups.filter(other => other !== popup);
      return { popups };
    })
  }

  render() {
    let { ui } = this.props;

    return (
      h("div", { class: "popup-manager" },
        this.state.popups.map(popup => (
          h(Popup, {
            ui,
            x: popup.x,
            y: popup.y,
            width: popup.width,
            height: popup.height,
            children: h(Text, {}, popup.body),
            onRequestClose: () => this.removePopup(popup),
          })
        ))
      )
    );
  }
}

class Editor extends Component {
  state = { open: false };

  componentDidMount() {
    let { ui } = this.props;
    ui.events.on("editor-open", this.openEditor);
    ui.events.on("editor-close", this.closeEditor);
  }

  componentWillUnmount() {
    let { ui } = this.props;
    ui.events.off("editor-open", this.openEditor);
    ui.events.off("editor-close", this.closeEditor);
  }

  openEditor = () => this.setState({ open: true });
  closeEditor = () => this.setState({ open: false });

  render() {
    if (this.state.open === false) {
      return null;
    }

    return (
      h(Box, { class: "editor" },
        h(Palette),
      )
    );
  }
}

class Log extends Component {
  state = { history: [] }

  componentWillMount() {
    let { ui } = this.props;
    ui.events.on("set-message", this.setMessage);
  }

  componentWillUnmount() {
    let { ui } = this.props;
    ui.events.off("set-message", this.setMessage);
  }

  setMessage = (message) => {
    let history = [...this.state.history, message];
    this.setState({ history });
  }

  render() {
    return (
      h(Box, { class: "log", height: 3 },
        this.state.history.map(message => (
          h(Box, { height: 1, class: "message" }, message)
        ))
       )
    );
  }
}

class LogPreview extends Component {
  state = { message: "" }

  componentWillMount() {
    let { ui } = this.props;
    ui.events.on("set-message", this.setMessage);
  }

  componentWillUnmount() {
    let { ui } = this.props;
    ui.events.off("set-message", this.setMessage);
  }

  setMessage = (message) => {
    this.setState({ message });
  }

  render() {
    return (
      h(Box, { height: 1, class: "log-preview" }, this.state.message)
    );
  }
}

class Modal extends Component {
  render() {
    let style = {
      borderColor: color(4)
    };

    return (
      h("div", { class: "modal", style },
        this.props.children,
      )
    );
  }
}

class Viewport extends Component {
  container = null;
  frame = null

  componentDidMount() {
    let { ui } = this.props;
    this.container.appendChild(ui.renderer.canvas);

    if (ui.ready) {
      this.start();
    } else {
      ui.events.on("ready", this.start);
    }
  }

  componentWillUnmount() {
    let { ui } = this.props;
    this.container.removeChild(ui.renderer.canvas);
  }

  start = () => {
    let { ui } = this.props;
    ui.events.off("ready", this.start);
    this.loop();
  }

  stop = () => {
    cancelAnimationFrame(this.frame);
  }

  handleCursorMove = event => {
    let { ui } = this.props;
    let { top, left } = this.container.getBoundingClientRect();

    let screenX = event.clientX - left;
    let screenY = event.clientY - top;

    let { x, y } = ui.screenToWorld(screenX, screenY);

    ui.events.emit("set-cursor", { x, y });
    ui.world.cursor = { x, y };
  }

  handleCursorLeave = event => {
    let { ui } = this.props;
    ui.events.emit("set-cursor", null);
    ui.world.cursor = null;
  }

  loop = () => {
    this.frame = requestAnimationFrame(this.loop);
    this.draw();
  }

  draw() {
    let { ui } = this.props;
    let { renderer, world } = ui;
    let { camera } = world;
    let { console } = renderer;

    let target = world.getEntityById(camera.target);

    if (target) {
      let minCameraX = 0;
      let minCameraY = 0;
      let maxCameraX = world.map.width - renderer.console.width;
      let maxCameraY = world.map.height - renderer.console.height;
      let cameraX = target.x - Math.floor(renderer.console.width / 2);
      let cameraY = target.y - Math.floor(renderer.console.height / 2);

      camera.x = Utils.clamp(minCameraX, cameraX, maxCameraX);
      camera.y = Utils.clamp(minCameraY, cameraY, maxCameraY);
    }

    for (let x = 0; x < console.width; x++) {
      for (let y = 0; y < console.height; y++) {
        let tile = world.map.get(camera.x + x, camera.y + y);

        if (tile == null) {
          continue;
        }

        let def = data.tiles[tile.type];
        let glyph = tile.glyph || def.glyph;
        let color = tile.color || def.color;

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

    renderer.draw();
  }

  render() {
    return (
      h("div", {
        class: "viewport",
        ref: el => this.container = el,
        onMouseMove: this.handleCursorMove,
        onMouseLeave: this.handleCursorLeave,
        children: this.props.children,
      })
    )
  }
}

export let Button = (props) => (
  h("button", {
    ...props,
    class: classes("button", props.class),
  })
);

export let Bar = ({ length, value, color }) => (
  h(Box, { class: "bar", height: 1, width: length },
    ...Utils.range(length).map(i => {
      let filled = i < value;
      let glyph;

      if (i === 0) glyph = 48;
      else if (i === length - 1) glyph = 50;
      else glyph = 49;

      return h(Glyph, { id: glyph, color: filled ? color : 2 });
    }),
  )
);

class Status extends Component {
  componentDidMount() {
    let { ui } = this.props;
    ui.world.events.on("turn", this.refresh);
    ui.events.on("refresh", this.refresh);
  }

  componentWillUnmount() {
    let { ui } = this.props;
    ui.world.events.off("turn", this.refresh);
    ui.events.off("refresh", this.refresh);
  }

  refresh = () => this.forceUpdate();

  render() {
    let { ui } = this.props;
    let { player } = ui.world;

    return (
      h(Box, { class: "status", justify: "space-between" },
        h(Bar, { length: player.maxHp, value: player.hp, color: 5 }),
        h(Box, { height: 1 },
          h(AnimatedNumber, { value: player.souls }),
        ),
        h(Bar, { length: player.maxStamina, value: player.stamina, color: 6 }),
      )
    );
  }
}

export function mount(selector, ui) {
  // TODO: Make this available via context
  let app = {
    ui: ui,
    dispatch(name, ...args) {
      ui.events.emit("dispatch", { name, args });
    }
  };

  let root = (
    h("div", { class: "ui" },
      settings.debug
        ? h(Debug, { ...app })
        : null,

      h(Status, { ...app }),

      h(Viewport, { ...app },
        h(PopupManager, { ...app })
      ),

      h(LogPreview, { ...app }),
      h(Console, { ...app }),
      h(Editor, { ...app }),
      h(Text, {}, "[6](64)[1] Hello"),
      //h(Modal, {},
      //  h("div", null, `Hello world, welcome to my great modal.`),
      //  h(Button, null, "Ok"),
      //  h(Button, null, "Cancel"),
      //),
    )
  );

  render(
    root,
    document.querySelector(selector),
  );
}
