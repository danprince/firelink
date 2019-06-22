declare namespace Rogue {
  export type Event = {
    type: string,
    [key: string]: any,
  }

  export type Constructor<T> = {
    new(...args: any[]): T
  }

  export type Tile = {
    type: number,
    glyph?: number,
    color?: number,
    light?: number,
  }

  export type Action = (
    actor: import("./rogue").Actor
  ) => ActionResult;

  export type ActionResult = {
    ok: boolean,
    message?: string,
    alt?: Action,
  };
}

declare namespace Defs {
  export type Entity = {
    glyph: number,
    color: number,
  }

  export type Item = Entity & {

  }

  export type Actor = Entity & {
    hp: number,
    stamina: number,
    souls: number,
  }

  export type Tile = {
    id: number,
    name: string,
    glyph: number,
    color: number,
    walkable?: boolean,
    autotile?: boolean,
    variants?: number,
  }

  export type Dict<T> = {
    [key: string]: T
  }
}

declare namespace RogueUI {
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

  export type CommandDef = {
    group: string,
    button: string,
    action: string,
  }
}
