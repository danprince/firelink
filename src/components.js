import { Component, Random } from "./rogue.js";
import * as Actions from "./actions.js";

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
