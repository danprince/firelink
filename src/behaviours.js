import { Behaviour, Action, Random } from "./rogue.js";
import { Rest, MoveTo } from "./actions.js";

export class Resting extends Behaviour {
  getNextAction() {
    return new Rest();
  }
}

export class Guarding extends Behaviour {
  getNextAction() {
    return new Rest();
  }
}

export class Wandering extends Behaviour {
  getNextAction() {
    let moveBy = (dx, dy) => new MoveTo(
      this.entity.x + dx,
      this.entity.y + dy,
    );

    return Random.pick(
      moveBy(0, 0),
      moveBy(0, 0),
      moveBy(0, 0),
      moveBy(0, 0),
      moveBy(0, 1),
      moveBy(0, -1),
      moveBy(1, 0),
      moveBy(-1, 0),
    );
  }
}

export class Fleeing extends Behaviour {
  getNextAction() {
    return new Rest();
  }
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
