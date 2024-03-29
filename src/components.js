import { Component, Entity, Action, Behaviour } from "./rogue.js";
import * as Actions from "./actions.js";
import * as Utils from "./utils.js";

export class Actor extends Component {
  /**
   * @type {Behaviour}
   */
  behaviour = null;

  /**
   * @param {string} behaviourId
   */
  constructor(behaviourId) {
    super();
    this.behaviour = Behaviour.create(behaviourId);
  }

  getNextAction() {
    return this.behaviour.getNextAction(this.entity);
  }

  /**
   * @param {Action} action
   */
  onBeforeAction(action) {}

  /**
   * @param {Action} action
   * @param {Action.Result} result
   */
  onAfterAction(action, result) {}
}


export class Stats extends Component {
  static requires = Actor;

  /**
   * @param {{ hitpoints: number, stamina: number }} params
   */
  constructor({ hitpoints, stamina }) {
    super();

    this.hitpoints = hitpoints;
    this.maxHitpoints = hitpoints;

    this.stamina = stamina;
    this.maxStamina = stamina;
  }

  /**
   * @param {number} value
   */
  setHitpoints(value) {
    this.hitpoints = Utils.clamp(0, value, this.maxHitpoints);

    if (this.hitpoints === 0) {
      this.entity.send({ type: "death" });

      // TODO: Don't despawn immediately, other actors might need
      // to access these components during their turns. Instead
      // flag as dead and remove at the end of the turn.
      this.entity.world.despawn(this.entity);
    }
  }

  /**
   * @param {number} value
   */
  setStamina(value) {
    this.stamina = Utils.clamp(0, value, this.maxStamina);
  }

  /**
   * @param {number} amount
   */
  changeHitpoints(amount) {
    this.setHitpoints(this.hitpoints + amount);
  }

  /**
   * @param {number} amount
   */
  changeStamina(amount) {
    this.setStamina(this.stamina + amount);
  }
}

export class Equipment extends Component {
  static requires = Actor;

  /**
   * @type {{
   *   leftHand: Entity,
   *   rightHand: Entity,
   *   consumable: Entity,
   *   castable: Entity,
   * }}
   */
  slots = {
    leftHand: null,
    rightHand: null,
    consumable: null,
    castable: null,
  };

  /**
   * @type {keyof Equipment["slots"]}
   */
  selectedSlot = "leftHand";

  /**
   * @param {{ [K in keyof Equipment["slots"]]?: string }} slots
   */
  constructor(slots) {
    super();

    if (slots.leftHand) {
      this.slots.leftHand = new Entity(slots.leftHand);
    }

    if (slots.rightHand) {
      this.slots.rightHand = new Entity(slots.rightHand);
    }

    if (slots.consumable) {
      this.slots.consumable = new Entity(slots.consumable);
    }

    if (slots.castable) {
      this.slots.castable = new Entity(slots.castable);
    }
  }

  /**
   * @param {keyof Equipment["slots"]} slot
   */
  selectSlot(slot) {
    this.selectedSlot = slot;
  }

  getSelectedItem() {
    return this.slots[this.selectedSlot];
  }

  /**
   * @param {Entity} item
   */
  equip(item) {
    let isEquipable = (
      item.has(Holdable) &&
      item.has(Equipable)
    );

    if (!isEquipable) {
      return false;
    }

    let slot = this.getSlotForItem(item);

    if (this.slots[slot] != null) {
      if (this.unequip(slot) === false) {
        return false;
      }
    }

    this.slots[slot] = item;

    return true;
  }

  /**
   * @param {keyof Equipment["slots"]} slot
   * @return {boolean}
   */
  unequip(slot) {
    if (this.slots[slot] == null) {
      return true;
    }

    this.slots[slot] = null;

    return true;
  }

  /**
   * Work out which slot an item should be equipped to by default.
   *
   * @param {Entity} item
   * @return {keyof Equipment["slots"]}
   */
  getSlotForItem(item) {
    let equipable = item.get(Equipable);

    switch (equipable.type) {
      case "consume": return "consumable";
      case "cast": return "castable";
      case "wield": return (
        this.slots.leftHand == null ? "leftHand" : "rightHand"
      );
    }
  }
}

export class Holdable extends Component {
  /**
   * @param {{ weight: number }} params
   */
  constructor({ weight }) {
    super();
    this.weight = weight;
  }
}

export class Equipable extends Component {
  static requires = Holdable;

  /**
   * @param {"consume" | "cast" | "wield"} type
   */
  constructor(type) {
    super();
    this.type = type;
  }
}

export class Consumable extends Equipable {
  static requires = Holdable;

  /**
   * @param {{ uses: number }} params
   */
  constructor({ uses }) {
    super("consume");
    this.uses = uses;
    this.maxUses = uses;
  }
}

export class Souls extends Component {
  static requires = Actor;

  /**
   * @param {number} value
   */
  constructor(value) {
    super();
    this.value = value;
  }

  /**
   * @param {number} amount
   */
  add(amount) {
    this.set(this.value + amount);
  }

  /**
   * @param {number} value
   */
  set(value) {
    this.value = value;
  }
}

export class Describe extends Component {
  /**
   * @param {{ name: string, description?: string }} value
   */
  constructor({ name, description }) {
    super();
    this.name = name;
    this.description = description;
  }
}
