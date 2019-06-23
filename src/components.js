import { Component, Random, Entity } from "./rogue.js";
import * as Actions from "./actions.js";

export class Hitpoints extends Component {
  constructor(value) {
    super();
    this.value = value;
    this.max = value;
  }
}

export class Stamina extends Component {
  constructor(value) {
    super();
    this.value = value;
    this.max = value;
  }
}

export class Wandering extends Component {
  onEvent(event) {
    switch (event.type) {
      case "request-action":
        // TODO: Should exclude blocked directions to prevent too
        // many failing actions.
        event.action = Random.pick(
          new Actions.MoveBy(-1, 0),
          new Actions.MoveBy(1, 0),
          new Actions.MoveBy(0, -1),
          new Actions.MoveBy(0, 1),
        );

        break;
    }
  }
}
