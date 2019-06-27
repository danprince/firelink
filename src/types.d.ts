declare namespace Rogue {
  type Entity = import("./rogue.js").Entity;
  type Component = import("./rogue.js").Component;
  type Action = import("./rogue.js").Action;

  export namespace Registry {
    export type Components = typeof import("./components.js");
    export type Actions = typeof import("./actions.js");
    export type Systems = typeof import("./systems.js");
  }

  export type Event = {
    type: string,
    [key: string]: any,
  }

  export type Constructor<T> = {
    new(...args: any[]): T
  }

  export type ComponentClass<T extends Component=any> = {
    new(...args: any[]): T
  }

  export type Direction = "north" | "east" | "south" | "west";

  export type Tile = {
    type: number,
    glyph?: number,
    color?: number,
    light?: number,
  }

  export type EntityType = {
    id: string,
    extends?: string | string[],
    attributes?: {
      color?: number,
      glyph?: number,
      z?: number,
    },
    components?: {
      // Handy to have this typechecking here for now, but it will only
      [K in keyof Registry.Components]?:
        ConstructorParameters<Registry.Components[K]>[0];
    }
  }

  export type TileType = {
    id: number,
    name: string,
    glyph: number,
    color: number,
    walkable?: boolean,
    autotile?: boolean,
    variants?: number,
  }

  export namespace UI {
    export type FontConfig = {
      url: string,
      glyphWidth: number,
      glyphHeight: number,
    }

    export type RendererConfig = {
      width: number,
      height: number,
      font: import("./ui").Font,
      palette: { [key: number]: string },
      scale?: number,
    }

    export type Binding = {
      mode: string,
      on: string,
      trigger: string,
    };
  }

  export namespace Behaviour {
    export type State = (entity: Entity) => Action | void;
  }
}
