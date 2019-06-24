let counter = 0;

export function uid() {
  return counter++;
}

/**
 * @param {number} min
 * @param {number} val
 * @param {number} max
 */
export function clamp(min, val, max) {
  if (val < min) return min;
  if (val > max) return max;
  return val;
}

/**
 * @param {number} ms
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @template T
 * @param {T[]} list
 * @param {T} item
 */
export function removeFromList(list, item) {
  for (let i = 0; i < list.length; i++) {
    if (list[i] === item) {
      list.splice(i, 1);
      return true;
    }
  }

  return false;
}

/**
 * @param {number} n
 */
export function range(n) {
  let nums = [];

  for (let i = 0; i < n; i++) {
    nums.push(i);
  }

  return nums;
}

/**
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 */
export function distance(x0, y0, x1, y1) {
  let x = x1 - x0;
  let y = y1 - y0;
  return Math.sqrt(x * x + y * y);
}

export class Emitter {
  handlers = {};

  /**
   * @param {string | Symbol} type
   * @param {any} [data]
   */
  emit(type, data) {
    let handlers = this.handlers[type];

    if (handlers) {
      for (let handler of handlers) {
        handler(data);
      }
    }
  }

  /**
   * @param {string | Symbol} type
   * @param {(data?: any) => void} handler
   */
  on(type, handler) {
    this.handlers[type] = this.handlers[type] || [];
    this.handlers[type].push(handler);
  }

  /**
   * @param {string | Symbol} type
   * @param {(data?: any) => void} handler
   */
  off(type, handler) {
    if (type in this.handlers) {
      removeFromList(this.handlers[type], handler);
    }
  }
}

/**
 * @param {string} string
 */
export function parseFormattedText(string) {
  let color = 1;
  let parts = [];

  while (string.length) {
    let colorMatch = string.match(/^\[(\d+?)\]/);
    let glyphMatch = string.match(/^\((\d+?)\)/);
    let textMatch = string.match(/^[^\(\[]+/);

    if (colorMatch) {
      string = string.slice(colorMatch[0].length);
      color = Number(colorMatch[1]);
      continue;
    }

    else if (glyphMatch) {
      string = string.slice(glyphMatch[0].length);
      let glyph = Number(glyphMatch[1]);
      parts.push({ glyph, color });
      continue;
    }

    else if (textMatch) {
      string = string.slice(textMatch[0].length);
      let text = textMatch[0];
      parts.push({ text, color });
      continue;
    }

    else {
      break;
    }
  }

  return parts;
}

/**
 * @param {boolean} condition
 * @param {string} message
 */
export function assert(condition, message) {
  if (condition === false || condition == null) {
    throw new Error(message);
  }
}

/**
 * @template T
 * @param {T | T[]} items
 * @return {T[]}
 */
export function asList(items) {
  if (items instanceof Array) {
    return items;
  } else {
    return [items];
  }
}
