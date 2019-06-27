import { Behaviour, Action } from "./rogue.js";
import * as Actions from "./actions.js";

export class Enemy extends Behaviour {
  idle = entity => {
    if (entity.y === 0) {
      this.transition(this.moveNorth);
    } else {
      this.transition(this.moveSouth);
    }
  }

  moveNorth = entity => {
    if (entity.y <= 1) {
      this.transition(this.moveSouth);
    } else {
      return new Actions.MoveBy(0, -1);
    }
  }

  moveSouth = entity => {
    if (entity.y >= 10) {
      this.transition(this.moveNorth);
    } else {
      return new Actions.MoveBy(0, 1);
    }
  }

  currentState = this.idle;
}

export class Async extends Behaviour {
  /**
   * @type {Action | null}
   */
  nextAction = null;

  /**
   * @param {Action} action
   */
  setNextAction(action) {
    this.nextAction = action;
  }

  getNextAction() {
    let action = this.nextAction;
    this.nextAction = null;
    return action;
  }
}
