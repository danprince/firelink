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
        /**
         * @type {Action[]}
         */
        let tried = [];

        // Loop until the actor has an action to perform
        while (true) {
          let action = actor.getNextAction();

          if (action == null) {
            yield;
            continue;
          }

          let result = Action.Result.fail();

          while (tried.length < MAX_ACTION_TRIES) {
            tried.push(action);

            actor.onBeforeAction(action);
            result = action.perform(entity);
            actor.onAfterAction(action, result);

            if (result.alt) {
              result.alt.parent = action;
              action = result.alt;
            } else {
              break;
            }
          }

          // Abort if this entity seems stuck
          if (tried.length >= MAX_ACTION_TRIES) {
            console.warn(`Actor might be stuck`, entity, tried);
            break;
          }

          // If the action succeeded then move onto the next entity
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
