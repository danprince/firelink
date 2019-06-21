import { Component, Random, Entity, Actor } from "./rogue.js";
import * as Actions from "./actions.js";

/**
 * @extend {Component<Actor>}
 */
export class Vitals extends Component {
  static target = Actor;

  onEvent(event) {
    switch (event.type) {
      case "set-hp":
        return this.entity.setHp(event.value);

      case "change-hp":
        return this.entity.changeHp(event.value);

      case "death":
        return this.entity.world.despawn(this.entity);
    }
  }
}

export class Corpse extends Component {
  onEvent(event) {
    switch (event.type) {
      case "death":
        return this.spawn();
    }
  }

  spawn = () => {
    let corpse = new Entity({ glyph: 81, color: 4 });
    corpse.x = this.entity.x;
    corpse.y = this.entity.y;
    this.entity.world.spawn(corpse);
  }
}

export class Bleeding extends Component {
  onEvent(event) {
    switch (event.type) {
      case "after-turn":
        // Render blood on the floor
        let tile = this.entity.world.map.get(this.entity.x, this.entity.y);
        tile.color = 5;

        return this.entity.send({ type: "change-hp", value: -1 });
    }
  }
}

export class Wandering extends Component {
  onEvent(event) {
    switch (event.type) {
      case "request-action":
        event.action = Random.pick(
          Actions.MoveBy(-1, 0),
          Actions.MoveBy(1, 0),
          Actions.MoveBy(0, -1),
          Actions.MoveBy(0, 1),
        );

        break;
    }
  }
}
