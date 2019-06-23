declare namespace Rogue {
  type Entity = import("./rogue.js").Entity;
  type Component<T=Entity> = import("./rogue.js").Component<T>;
  type Action = import("./rogue.js").Action;

  export type Event = {
    type: string,
    [key: string]: any,
  }

  export type Constructor<T> = {
    new(...args: any[]): T
  }

  export type ComponentClass<T extends Component> = {
    new(...args: any[]): T
  }

  export type Direction = "north" | "east" | "south" | "west";

  export type Tile = {
    type: number,
    glyph?: number,
    color?: number,
    light?: number,
  }

  export type ActionResult = {
    ok: boolean,
    message?: string,
    alt?: Action,
  };

  export type EntityType = {
    id: string,
    extends?: string[],
    attributes?: {
      color?: number,
      glyph?: number,
    },
    components?: {
      [componentName: string]: any,
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
}
