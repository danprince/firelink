// @ts-ignore (typescript can't find external modules)
import * as Preact from "https://unpkg.com/@danprince/preact-app";
import * as Utils from "./utils.js";
import * as Rogue from "./rogue.js";
import { Hitpoints, Stamina } from "./components.js";
import { Font, CanvasRenderer } from "./ui.js";
import settings from "./settings.js";

let {
  html,
  useState,
  useCallback,
  useContext,
  useEffect,
  useRef,
} = Preact;

let Context = Preact.createContext(null);

/**
 * @param {string[]} classNames
 */
let classes = (...classNames) => classNames.filter(x => x).join(" ");

/**
 * @param {number} index
 */
let getColor = index => settings["colors"][index];

/**
 * @param {number} x
 */
let scaleX = x => {
  return x * settings["font.glyphWidth"] * settings["renderer.scale"];
};

/**
 * @param {number} y
 */
let scaleY = y => {
  return y * settings["font.glyphHeight"] * settings["renderer.scale"];
};

/**
 * Returns a function which can be used to trigger the current
 * component to re-render.
 */
let useRefresh = () => {
  let [state, setState] = useState(false);
  return () => setState(!state);
};

/**
 * Manages an event emitter subscription.
 *
 * @param {Utils.Emitter} emitter
 * @param {string} name
 * @param {(data?: any) => void} callback
 */
let useGenericEventListener = (emitter, name, callback) => {
  useEffect(() => {
    emitter.on(name, callback);
    return () => emitter.off(name, callback);
  }, [name, callback]);
};

/**
 * Manages an event listener on the `ui.events` emitter.
 *
 * @param {string} name
 * @param {(data?: any) => void} callback
 */
let useWorldEventListener = (name, callback) => {
  let { ui } = useContext(Context);
  useGenericEventListener(ui.world.events, name, callback);
};

/**
 * Manages an event listener on the `ui.renderer.events` emitter.
 *
 * @param {string} name
 * @param {(data?: any) => void} callback
 */
let useRendererEventListener = (name, callback) => {
  let { ui } = useContext(Context);
  useGenericEventListener(ui.renderer.events, name, callback);
};

/**
 * Manages an event listener on the `ui.events` emitter.
 *
 * @param {string} name
 * @param {(data?: any) => void} callback
 */
let useEventListener = (name, callback) => {
  let { ui } = useContext(Context);
  useGenericEventListener(ui.events, name, callback);
};

/**
 * Utilities for rendering glyphs to base64 so that they can be used
 * within the UI.
 */
let Glyphs = {
  cache: {},

  renderer: new CanvasRenderer({
    width: 1,
    height: 1,
    scale: 1,
    palette: settings["colors"],
    font: new Font({
      url: settings["font.url"],
      glyphWidth: settings["font.glyphWidth"],
      glyphHeight: settings["font.glyphHeight"],
    }),
  }),

  /**
   * @param {number} glyph
   * @param {number} color
   * @param {number} scale
   */
  toBase64(glyph, color, scale) {
    let key = `${glyph}-${color}-${scale}`;

    if (this.cache[key] == null) {
      this.renderer.scale = scale;
      this.renderer.init();
      this.renderer.console.put(glyph, color, 0, 0, 0);
      this.renderer.draw();
      this.cache[key] = this.renderer.canvas.toDataURL();
    }

    return this.cache[key];
  },
}

let Glyph = ({ id, color, scale=settings["renderer.scale"] }) => {
  let src = Glyphs.toBase64(id, color, scale);

  let style = {
    width:  Glyphs.renderer.font.glyphWidth * scale,
    height: Glyphs.renderer.font.glyphHeight * scale,
  };

  return html`<img src=${src} style=${style} />`;
};

let Text = ({ children }) => {
  let parts = Utils.parseFormattedText(children);

  return html`
    <span class="text">
      ${parts.map(part => {
        if (part.glyph) {
          return html`<${Glyph} id=${part.glyph} color=${part.color} />`;
        }

        if (part.text) {
          let style = {
            lineHeight: `${4 + scaleY(1)}px`,
            height: scaleY(1),
            color: getColor(part.color),
          };

          return html`<span style=${style}>${part.text}</span>`;
        }
      })}
    </span>
  `;
};

let Box = ({
  as="div",
  width,
  height,
  direction,
  justify,
  align,
  wrap,
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
  if (wrap) style.flexWrap = wrap;

  let className = classes(rest.class, `box`);

  return html`<${as} ...${rest} class=${className} style=${style} />`;
};

let Console = () => {
  let { dispatch } = useContext(Context);
  let input = useRef();
  let [value, setValue] = useState("");
  let [message, setMessage] = useState("");

  useEventListener("focus-console", () => setTimeout(() => {
    input.current.focus();
    setValue("");
  }));

  useEventListener("console-message", message => {
    setMessage(message);
    setTimeout(() => setMessage(null), 2000);
  });

  let execute = () => {
    setValue("");
    input.current.blur();

    if (value) {
      let [name, ...args] = value.split(" ");
      dispatch(name, ...args);
    }
  };

  let autocomplete = () => {
    let request = { value, completion: null };

    dispatch("console-get-completions", request);

    if (request.completion) {
      setValue(request.completion);
    }
  };

  let handleKeyDown = (event) => {
    event.stopPropagation();

    switch (event.key) {
      case "Enter":
        return execute();

      case "Tab":
        event.preventDefault();
        return autocomplete();
    }
  };

  return html`
    <${Box} class="console" height=${1}>
      <input
        ref=${input}
        type="text"
        disabled=${message}
        value=${message || value}
        onKeyDown=${handleKeyDown}
        onInput=${event => setValue(event.target.value)}
      />
    </${Box}>
  `;
}

let Palette = () => {
  let colors = settings["colors"];

  return html`
    <${Box} class="palette" width=${8} wrap="wrap">
      ${Object.keys(colors).map(index => html`
        <${Box}
          class="swatch"
          justify="center"
          width=${2}
          height=${1}
          style=${{ background: colors[index] }}
          children=${index}
        />
      `)}
    </${Box}>
  `;
}

let Debug = () => {
  let { ui } = useContext(Context);
  let [modes, setModes] = useState([...ui.input.getActiveModes()]);
  let [cursor, setCursor] = useState(null);
  let [entity, setEntity] = useState(null);
  let [rendererStats, setRendererStats] = useState(null);
  let [worldStats, setWorldStats] = useState(null);
  let [turns, setTurns] = useState(0);

  useEventListener("set-cursor", cursor => {
    let entity = cursor && ui.world.getEntityAt(cursor.x, cursor.y);
    setCursor(cursor);
    setEntity(entity);
  });

  useEventListener("update-mode", setModes);
  useRendererEventListener("stats", setRendererStats);
  useWorldEventListener("turn", setTurns);
  useWorldEventListener("stats", setWorldStats);

  return html`
    <${Box} class="debug" direction="column">
      <div>mode=${modes.join(" | ")}</div>
      <div class="debug-divider"></div>
      <${DebugDivider} />
      <div>x=${cursor && cursor.x} y=${cursor && cursor.y}</div>
      <div>entity=${entity && entity.id}</div>
      <div>turns=${turns}</div>
      <div>draws=${rendererStats && rendererStats.calls}</div>
      <${DebugDivider} />
      <div>entities=${worldStats && worldStats.entities}</div>
      <div>actions=${worldStats && worldStats.actions}</div>
    </${Box}>
  `;
};

let DebugDivider = ({ length=15 }) => html`
  <div style=${{ color: getColor(9) }}>
   ${"-".repeat(length)}
  </div>
`;

let Popup = ({ x, y, width, height, children, onRequestClose }) => {
  let { ui } = useContext(Context);
  let translated = ui.worldToScreen(x, y);

  let style = {
    left: `${translated.x}px`,
    top: `${translated.y}px`,
  };

  return html`
    <${Box}
      class="popup"
      justify="center"
      width=${width}
      height=${height}
      style=${style}
      children=${children}
    />
  `;
};

let PopupManager = () => {
  let [popups, setPopups] = useState([]);

  useEventListener("popup", popup => {
    setPopups([...popups, popup]);
  });

  let removePopup = (popup) => {
    setPopups(
      popups.filter(other => other !== popup)
    );
  };

  return html`
    <div class="popup-manager">
      ${popups.map(popup => html`
        <${Popup} ...${popup} onRequestClose=${() => removePopup(popup)}>
          <${Text}>${popup.body}</${Text}>
        </${Popup}>
      `)}
    </div>
  `;
};

let Editor = () => {
  let [visible, setVisibility] = useState(false);

  useEventListener("editor-open", () => setVisibility(true));
  useEventListener("editor-close", () => setVisibility(false));

  return visible && html`
    <${Box} class="editor" justify="space-between">
      <${Palette} />
    </${Box}>
  `;
};

let LogPreview = () => {
  let [message, setMessage] = useState("");

  useEventListener("set-message", setMessage);

  return html`
    <${Box} class="log-preview" height=${1}>
      ${message}
    </${Box}>
  `;
};

let Viewport = ({ children }) => {
  let container = useRef();
  let animationFrame = useRef();
  let { ui } = useContext(Context);

  let draw = () => {
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

        let type = Rogue.TileMap.registry[tile.type];
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

    renderer.draw();
  };

  let start = () => {
    container.current.appendChild(ui.renderer.canvas);
    loop();
  };

  let stop = () => {
    container.current.removeChild(ui.renderer.canvas);
    cancelAnimationFrame(animationFrame.current);
  };

  let loop = () => {
    animationFrame.current = requestAnimationFrame(loop);
    draw();
  };

  let handleCursorMove = useCallback(event => {
    let { top, left } = container.current.getBoundingClientRect();

    let screenX = event.clientX - left;
    let screenY = event.clientY - top;

    let { x, y } = ui.screenToWorld(screenX, screenY);

    ui.events.emit("set-cursor", { x, y });
    ui.world.cursor = { x, y };
  });

  let handleCursorLeave = useCallback(() => {
    ui.events.emit("set-cursor", null);
    ui.world.cursor = null;
  });

  useEffect(() => {
    if (ui.ready) {
      start();
    } else {
      ui.events.on("ready", start);
    }

    return () => {
      stop();
      ui.events.off("ready", start);
    };
  }, []);

  return html`
    <div
      class="viewport"
      ref=${container}
      onMouseMove=${handleCursorMove}
      onMouseLeave=${handleCursorLeave}
      children=${children}
    />
  `;
};

let Bar = ({ length, value, color }) => html`
  <${Box} class=bar height=${1} width=${length}>
    ${Utils.range(length).map(i => {
      let filled = i < value;
      let glyph;

      if (i === 0) glyph = 64;
      else if (i === length - 1) glyph = 66;
      else glyph = 65;

      return html`<${Glyph} id=${glyph} color=${filled ? color : 9} />`;
    })}
  </${Box}>
`;

let Status = () => {
  let refresh = useRefresh();

  useWorldEventListener("turn", refresh);
  useEventListener("refresh", refresh);

  let { ui } = useContext(Context);
  let { player } = ui.world;

  let hitpoints = player.get(Hitpoints);
  let stamina = player.get(Stamina);

  return html`
    <${Box} class=status justify=space-between>
      <${Bar} length=${hitpoints.max} value=${hitpoints.value} color=${2} />
      <${Box} height={1}>${player.souls}</${Box}>
      <${Bar} length=${stamina.max} value=${stamina.value} color=${3} />
    </${Box}>
  `;
};

let App = ({ ui }) => {
  const DEBUG = settings["debug"];

  let app = {
    ui: ui,
    dispatch(name, ...args) {
      ui.events.emit("dispatch", { name, args });
    }
  };

  return html`
    <${Context.Provider} value=${app}>
      <div class="ui">
        ${DEBUG && html`<${Debug} />`}
        <${Status} />
        <${Viewport} ...${app}>
          <${PopupManager} />
        <//>
        <${LogPreview} />
        <${Console} />
        <${Editor} />
      </div>
    </${Context.Provider}>
  `;
};

export async function mount(selector, ui) {
  if (Glyphs.renderer.ready == false) {
    await new Promise(resolve => {
      Glyphs.renderer.events.on("ready", resolve);
    });
  }

  Preact.render(
    html`<${App} ui=${ui} />`,
    document.querySelector(selector),
  );
}
