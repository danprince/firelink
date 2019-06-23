import { Component, Random, Actor } from "./rogue.js";
import * as Actions from "./actions.js";

/**
 * @extends {Component<Actor>}
 */
export class Hitpoints extends Component {
  target = Actor

  /**
   * @param {number} value
   */
  constructor(value) {
    super();
    this.value = value;
    this.max = value;
  }
}

/**
 * @extends {Component<Actor>}
 */
export class Stamina extends Component {
  target = Actor

  /**
   * @param {number} value
   */
  constructor(value) {
    super();
    this.value = value;
    this.max = value;
  }
}

/**
 * @extends {Component<Actor>}
 */
export class Wandering extends Component {
  target = Actor

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
