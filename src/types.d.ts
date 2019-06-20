declare namespace Rogue {
  export type Event = {
    type: string,
    [key: string]: any,
  }

  export type Constructor<T> = {
    new(...args: any[]): T
  }

  export type EntityDef = {
    glyph: number,
    color: number,
  }

  export type ItemDef = EntityDef & {

  }

  export type ActorDef = EntityDef & {
    hp: number,
    stamina: number,
    souls: number,
  }

  export type Tile = {
    type: number,
    glyph?: number,
    color?: number,
    light?: number,
  }
}

declare namespace RogueUI {
  export type FontConfig = {
    url: string,
    glyphWidth: number,
    glyphHeight: number,
  }

  export type RendererConfig<Font> = {
    width: number,
    height: number,
    font: Font,
    palette: { [key: number]: string },
    scale?: number,
  }

  export type CommandDef = {
    group: string,
    button: string,
    action: string,
  }
}
