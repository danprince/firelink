import { System, World, Action } from "./rogue.js";
import { Actor } from "./components.js";
import settings from "./settings.js";

export class TurnSystem extends System {
  /**
   * @param {World} world
   */
  *update(world) {
    const MAX_ACTION_TRIES = settings["rules.maxActionTries"];

    for (let entity of world.entities.values()) {
      entity.onBeforeTurn();

      let actor = entity.get(Actor);

      if (actor) {
        let triedActions = [];

        while (true) {
          let action = actor.takeTurn();
          let result = Action.Result.fail();

          if (action == null) {
            yield;
            continue;
          }

          while (true) {
            triedActions.push(action);

            actor.onBeforeAction(action);
            result = action.perform(entity);
            actor.onAfterAction(action, result);

            if (triedActions.length >= MAX_ACTION_TRIES) {
              break;
            }

            if (result.alt) {
              action = result.alt;
            } else {
              break;
            }
          }

          // Abort if this entity seems stuck
          if (triedActions.length >= MAX_ACTION_TRIES) {
            console.warn(`Actor might be stuck`, entity, triedActions);
            break;
          }

          // If the action succeeded
          if (result.ok) {
            break;
          }
        }
      }

      entity.onAfterTurn();
    }

    world.events.emit("turn");
  }
}
