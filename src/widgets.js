// @ts-ignore (typescript can't find external modules)
import * as Preact from "https://unpkg.com/@danprince/preact-app";
import * as Utils from "./utils.js";
import { Stats, Souls } from "./components.js";
import { UI, Font, CanvasRenderer } from "./ui.js";
import settings from "./settings.js";

let {
  html,
  useState,
  useReducer,
  useCallback,
  useContext,
  useEffect,
  useRef,
} = Preact;

let UIContext = Preact.createContext(null);

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
 * @return {UI}
 */
let useUI = () => {
  return useContext(UIContext);
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
  let ui = useUI();
  useGenericEventListener(ui.world.events, name, callback);
};

/**
 * Manages an event listener on the `ui.renderer.events` emitter.
 *
 * @param {string} name
 * @param {(data?: any) => void} callback
 */
let useRendererEventListener = (name, callback) => {
  let ui = useUI();
  useGenericEventListener(ui.renderer.events, name, callback);
};

/**
 * Manages an event listener on the `ui.events` emitter.
 *
 * @param {string} name
 * @param {(data?: any) => void} callback
 */
let useEventListener = (name, callback) => {
  let ui = useUI();
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
  console.log("console");

  let { dispatch } = useUI();
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
  console.log("debug");
  let ui = useUI();
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
      <${DebugDivider} title="Modes"/>
      <div>${modes.join(" | ")}</div>
      <div class="debug-divider"></div>
      <${DebugDivider} title="Game"/>
      <div>x=${cursor && cursor.x} y=${cursor && cursor.y}</div>
      <div>entity=${entity && entity.id}</div>
      <div>turns=${turns}</div>
      <${DebugDivider} title="Stats" />
      <div>cells_drawn=${rendererStats && rendererStats.calls}</div>
      <div>entity_count=${worldStats && worldStats.entities}</div>
      <div>action_count=${worldStats && worldStats.actions}</div>
    </${Box}>
  `;
};

let DebugDivider = ({ length=15, title }) => {
  let padding = Math.floor((length - title.length) / 2);

  return html`
    <${Text}>
     ${`[9]${"-".repeat(padding)}[10]${title}[9]${"-".repeat(padding)}`}
    </${Text}>
  `;
};

let Popup = ({ x, y, width, height, children, onRequestClose }) => {
  let ui = useUI();
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
  console.log("popupmanager");
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
  console.log("editor");
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
  console.log("log-preview");
  let [message, setMessage] = useState("");

  useEventListener("set-message", setMessage);

  return html`
    <${Box} class="log-preview" height=${1}>
      ${message}
    </${Box}>
  `;
};

let Viewport = ({ children }) => {
  console.log("viewport");
  let ui = useUI();
  let container = useRef();

  useEffect(() => {
    ui.startRenderer();
    container.current.appendChild(ui.renderer.element);

    return () => {
      ui.stopRenderer();
    };
  }, []);

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

  return html`
    <div
      class="viewport"
      ref=${container}
      onMouseMove=${handleCursorMove}
      onMouseLeave=${handleCursorLeave}
      children=${children}
    />
  `;
}

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

  let ui = useUI();
  let { player } = ui.world;

  let stats = player.get(Stats);
  let souls = player.get(Souls);

  return html`
    <${Box} class=status justify=space-between>
      <${Bar} length=${stats.maxHitpoints} value=${stats.hitpoints} color=${2} />
      <${Box} height={1}>${souls.value}</${Box}>
      <${Bar} length=${stats.maxStamina} value=${stats.stamina} color=${3} />
    </${Box}>
  `;
};

let App = ({ ui }) => {
  const DEBUG = settings["debug"];

  return html`
    <${UIContext.Provider} value=${ui}>
      <div class="ui">
        ${DEBUG && html`<${Debug} />`}
        <${Status} />
        <${Viewport} ui=${ui}>
          <${PopupManager} />
        <//>
        <${LogPreview} />
        <${Console} />
        <${Editor} />
      </div>
    </${UIContext.Provider}>
  `;
};

/**
 * @param {string} selector
 * @param {UI} ui
 */
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
