import { TileMap, Entity, Action, Directions } from "./rogue.js";
import { Stats, Souls, Disposition, Equipment } from "./components.js";

let { succeed, fail, alternate } = Action.Result;

export class Rest extends Action {
  requires = Stats;

  /**
   * @param {Entity} entity
   */
  perform(entity) {
    let stats = entity.get(Stats);

    if (stats.stamina < stats.maxStamina) {
      stats.changeStamina(1);
      return succeed("You regain some stamina by resting");
    }

    return succeed();
  }
}

export class MoveTo extends Action {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }

  /**
   * @param {Entity} entity
   */
  perform(entity) {
    let tile = entity.world.map.get(this.x, this.y);

    if (tile == null) {
      return fail("There's nothing here!");
    }

    let type = TileMap.registry[tile.type];

    if (type.walkable) {
      entity.x = this.x;
      entity.y = this.y;
      return succeed();
    } else {
      return fail("You can't move there")
    }
  }
}

export class MoveBy extends Action {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }

  /**
   * @param {Entity} entity
   */
  perform(entity) {
    return alternate(
      new MoveTo(entity.x + this.x, entity.y + this.y)
    );
  }
}

export class Walk extends Action {
  /**
   * @param {Rogue.Direction} dir
   */
  constructor(dir) {
    super();
    this.dir = dir;
  }

  /**
   * @param {Entity} entity
   */
  perform(entity) {
    let steps = Directions.steps(this.dir, 1);
    let x = entity.x + steps.x;
    let y = entity.y + steps.y;
    let entities = entity.world.getEntitiesAt(x, y);

    // If there is a hostile entity here, then automatically attack

    let target = entities.find(entity => {
      let disposition = entity.get(Disposition);
      return disposition && disposition.isHostileTo(entity.id);
    });

    if (target) {
      return alternate(
        new Attack(target)
      );
    }

    // TODO: If there is a destructible entity here, destroy it
    // TODO: If there is an activatable entity here, activate it

    return alternate(
      new MoveTo(x, y)
    );
  }
}

export class Attack extends Action {
  requires = [Equipment];

  /**
   * @param {Entity} target
   */
  constructor(target) {
    super();
    this.target = target;
  }

  /**
   * @param {Entity} attacker
   */
  perform(attacker) {
    let target = this.target;

    let equipment = attacker.get(Equipment);

    if (equipment == null) {
      return fail(`Can't attack without equipment`);
    }

    let weapon = equipment.getSelectedItem();

    if (weapon == null) {
      return fail(`Can't attack without a weapon`);
    }

    // TODO:
    // - Stamina damage scaling
    // - Calculate damage from weapon
    // - Calculate effects from weapon
    // - Calculate resistances from target
    // - Deal stamina damage
    // - Stance prevention (block/parry)

    let attackerStats = attacker.get(Stats);
    let targetStats = target.get(Stats);
    let damage = 1;

    attacker.send({ type: "before-attack", target });
    target.send({ type: "before-attacked", attacker });

    attackerStats.changeStamina(-1);
    targetStats.changeHitpoints(-damage);

    attacker.send({ type: "after-attack", target });
    target.send({ type: "after-attacked", attacker });

    let isTargetDead = targetStats.hitpoints === 0;

    if (isTargetDead === false) {
      return succeed(`You hit the ${this.target.type.id} for ${damage} damage`);
    }

    attacker.send({ type: "killed", target });

    // Transfer souls
    let attackerSouls = attacker.get(Souls);
    let targetSouls = target.get(Souls);

    if (targetSouls && attackerSouls) {
      let value = targetSouls.value;
      targetSouls.set(0);
      attackerSouls.add(value);
    }

    return succeed(`You killed the ${this.target.type.id}`);
  }
}

export class Dodge extends Action {
  /**
   * @param {Rogue.Direction} dir
   */
  constructor(dir) {
    super();
    this.dir = dir;
  }

  /**
   * @param {Entity} entity
   */
  perform(entity) {
    let steps = Directions.steps(this.dir, 2);
    let x = entity.x + steps.x;
    let y = entity.y + steps.y;

    // TODO: Prevent entities from being able to dodge through solid
    // objects such as walls or other entities.

    return alternate(
      new MoveTo(x, y)
    );
  }
}
