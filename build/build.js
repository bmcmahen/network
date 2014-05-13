
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-raf/index.js", function(exports, require, module){
/**
 * Expose `requestAnimationFrame()`.
 */

exports = module.exports = window.requestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.mozRequestAnimationFrame
  || window.oRequestAnimationFrame
  || window.msRequestAnimationFrame
  || fallback;

/**
 * Fallback implementation.
 */

var prev = new Date().getTime();
function fallback(fn) {
  var curr = new Date().getTime();
  var ms = Math.max(0, 16 - (curr - prev));
  var req = setTimeout(fn, ms);
  prev = curr;
  return req;
}

/**
 * Cancel.
 */

var cancel = window.cancelAnimationFrame
  || window.webkitCancelAnimationFrame
  || window.mozCancelAnimationFrame
  || window.oCancelAnimationFrame
  || window.msCancelAnimationFrame
  || window.clearTimeout;

exports.cancel = function(id){
  cancel.call(window, id);
};

});
require.register("component-indexof/index.js", function(exports, require, module){
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("component-rounded-rect/index.js", function(exports, require, module){

module.exports = function(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
};
});
require.register("component-event/index.js", function(exports, require, module){
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
});
require.register("component-query/index.js", function(exports, require, module){
function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
  return exports;
};

});
require.register("component-matches-selector/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var query = require('query');

/**
 * Element prototype.
 */

var proto = Element.prototype;

/**
 * Vendor function.
 */

var vendor = proto.matches
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

/**
 * Expose `match()`.
 */

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = query.all(selector, el.parentNode);
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i] == el) return true;
  }
  return false;
}

});
require.register("discore-closest/index.js", function(exports, require, module){
var matches = require('matches-selector')

module.exports = function (element, selector, checkYoSelf, root) {
  element = checkYoSelf ? {parentNode: element} : element

  root = root || document

  // Make sure `element !== document` and `element != null`
  // otherwise we get an illegal invocation
  while ((element = element.parentNode) && element !== document) {
    if (matches(element, selector))
      return element
    // After `matches` on the edge case that
    // the selector matches the root
    // (when the root is not the document)
    if (element === root)
      return  
  }
}
});
require.register("component-delegate/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var closest = require('closest')
  , event = require('event');

/**
 * Delegate event `type` to `selector`
 * and invoke `fn(e)`. A callback function
 * is returned which may be passed to `.unbind()`.
 *
 * @param {Element} el
 * @param {String} selector
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, selector, type, fn, capture){
  return event.bind(el, type, function(e){
    var target = e.target || e.srcElement;
    e.delegateTarget = closest(target, selector, true, el);
    if (e.delegateTarget) fn.call(el, e);
  }, capture);
};

/**
 * Unbind event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  event.unbind(el, type, fn, capture);
};

});
require.register("component-events/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var events = require('event');
var delegate = require('delegate');

/**
 * Expose `Events`.
 */

module.exports = Events;

/**
 * Initialize an `Events` with the given
 * `el` object which events will be bound to,
 * and the `obj` which will receive method calls.
 *
 * @param {Object} el
 * @param {Object} obj
 * @api public
 */

function Events(el, obj) {
  if (!(this instanceof Events)) return new Events(el, obj);
  if (!el) throw new Error('element required');
  if (!obj) throw new Error('object required');
  this.el = el;
  this.obj = obj;
  this._events = {};
}

/**
 * Subscription helper.
 */

Events.prototype.sub = function(event, method, cb){
  this._events[event] = this._events[event] || {};
  this._events[event][method] = cb;
};

/**
 * Bind to `event` with optional `method` name.
 * When `method` is undefined it becomes `event`
 * with the "on" prefix.
 *
 * Examples:
 *
 *  Direct event handling:
 *
 *    events.bind('click') // implies "onclick"
 *    events.bind('click', 'remove')
 *    events.bind('click', 'sort', 'asc')
 *
 *  Delegated event handling:
 *
 *    events.bind('click li > a')
 *    events.bind('click li > a', 'remove')
 *    events.bind('click a.sort-ascending', 'sort', 'asc')
 *    events.bind('click a.sort-descending', 'sort', 'desc')
 *
 * @param {String} event
 * @param {String|function} [method]
 * @return {Function} callback
 * @api public
 */

Events.prototype.bind = function(event, method){
  var e = parse(event);
  var el = this.el;
  var obj = this.obj;
  var name = e.name;
  var method = method || 'on' + name;
  var args = [].slice.call(arguments, 2);

  // callback
  function cb(){
    var a = [].slice.call(arguments).concat(args);
    obj[method].apply(obj, a);
  }

  // bind
  if (e.selector) {
    cb = delegate.bind(el, e.selector, name, cb);
  } else {
    events.bind(el, name, cb);
  }

  // subscription for unbinding
  this.sub(name, method, cb);

  return cb;
};

/**
 * Unbind a single binding, all bindings for `event`,
 * or all bindings within the manager.
 *
 * Examples:
 *
 *  Unbind direct handlers:
 *
 *     events.unbind('click', 'remove')
 *     events.unbind('click')
 *     events.unbind()
 *
 * Unbind delegate handlers:
 *
 *     events.unbind('click', 'remove')
 *     events.unbind('click')
 *     events.unbind()
 *
 * @param {String|Function} [event]
 * @param {String|Function} [method]
 * @api public
 */

Events.prototype.unbind = function(event, method){
  if (0 == arguments.length) return this.unbindAll();
  if (1 == arguments.length) return this.unbindAllOf(event);

  // no bindings for this event
  var bindings = this._events[event];
  if (!bindings) return;

  // no bindings for this method
  var cb = bindings[method];
  if (!cb) return;

  events.unbind(this.el, event, cb);
};

/**
 * Unbind all events.
 *
 * @api private
 */

Events.prototype.unbindAll = function(){
  for (var event in this._events) {
    this.unbindAllOf(event);
  }
};

/**
 * Unbind all events for `event`.
 *
 * @param {String} event
 * @api private
 */

Events.prototype.unbindAllOf = function(event){
  var bindings = this._events[event];
  if (!bindings) return;

  for (var method in bindings) {
    this.unbind(event, method);
  }
};

/**
 * Parse `event`.
 *
 * @param {String} event
 * @return {Object}
 * @api private
 */

function parse(event) {
  var parts = event.split(/ +/);
  return {
    name: parts.shift(),
    selector: parts.join(' ')
  }
}

});
require.register("component-props/index.js", function(exports, require, module){
/**
 * Global Names
 */

var globals = /\b(this|Array|Date|Object|Math|JSON)\b/g;

/**
 * Return immediate identifiers parsed from `str`.
 *
 * @param {String} str
 * @param {String|Function} map function or prefix
 * @return {Array}
 * @api public
 */

module.exports = function(str, fn){
  var p = unique(props(str));
  if (fn && 'string' == typeof fn) fn = prefixed(fn);
  if (fn) return map(str, p, fn);
  return p;
};

/**
 * Return immediate identifiers in `str`.
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

function props(str) {
  return str
    .replace(/\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\//g, '')
    .replace(globals, '')
    .match(/[$a-zA-Z_]\w*/g)
    || [];
}

/**
 * Return `str` with `props` mapped with `fn`.
 *
 * @param {String} str
 * @param {Array} props
 * @param {Function} fn
 * @return {String}
 * @api private
 */

function map(str, props, fn) {
  var re = /\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\/|[a-zA-Z_]\w*/g;
  return str.replace(re, function(_){
    if ('(' == _[_.length - 1]) return fn(_);
    if (!~props.indexOf(_)) return _;
    return fn(_);
  });
}

/**
 * Return unique array.
 *
 * @param {Array} arr
 * @return {Array}
 * @api private
 */

function unique(arr) {
  var ret = [];

  for (var i = 0; i < arr.length; i++) {
    if (~ret.indexOf(arr[i])) continue;
    ret.push(arr[i]);
  }

  return ret;
}

/**
 * Map with prefix `str`.
 */

function prefixed(str) {
  return function(_){
    return str + _;
  };
}

});
require.register("component-to-function/index.js", function(exports, require, module){
/**
 * Module Dependencies
 */

var expr = require('props');

/**
 * Expose `toFunction()`.
 */

module.exports = toFunction;

/**
 * Convert `obj` to a `Function`.
 *
 * @param {Mixed} obj
 * @return {Function}
 * @api private
 */

function toFunction(obj) {
  switch ({}.toString.call(obj)) {
    case '[object Object]':
      return objectToFunction(obj);
    case '[object Function]':
      return obj;
    case '[object String]':
      return stringToFunction(obj);
    case '[object RegExp]':
      return regexpToFunction(obj);
    default:
      return defaultToFunction(obj);
  }
}

/**
 * Default to strict equality.
 *
 * @param {Mixed} val
 * @return {Function}
 * @api private
 */

function defaultToFunction(val) {
  return function(obj){
    return val === obj;
  }
}

/**
 * Convert `re` to a function.
 *
 * @param {RegExp} re
 * @return {Function}
 * @api private
 */

function regexpToFunction(re) {
  return function(obj){
    return re.test(obj);
  }
}

/**
 * Convert property `str` to a function.
 *
 * @param {String} str
 * @return {Function}
 * @api private
 */

function stringToFunction(str) {
  // immediate such as "> 20"
  if (/^ *\W+/.test(str)) return new Function('_', 'return _ ' + str);

  // properties such as "name.first" or "age > 18" or "age > 18 && age < 36"
  return new Function('_', 'return ' + get(str));
}

/**
 * Convert `object` to a function.
 *
 * @param {Object} object
 * @return {Function}
 * @api private
 */

function objectToFunction(obj) {
  var match = {}
  for (var key in obj) {
    match[key] = typeof obj[key] === 'string'
      ? defaultToFunction(obj[key])
      : toFunction(obj[key])
  }
  return function(val){
    if (typeof val !== 'object') return false;
    for (var key in match) {
      if (!(key in val)) return false;
      if (!match[key](val[key])) return false;
    }
    return true;
  }
}

/**
 * Built the getter function. Supports getter style functions
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function get(str) {
  var props = expr(str);
  if (!props.length) return '_.' + str;

  var val;
  for(var i = 0, prop; prop = props[i]; i++) {
    val = '_.' + prop;
    val = "('function' == typeof " + val + " ? " + val + "() : " + val + ")";
    str = str.replace(new RegExp(prop, 'g'), val);
  }

  return str;
}

});
require.register("component-each/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var type = require('type');
var toFunction = require('to-function');

/**
 * HOP reference.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Iterate the given `obj` and invoke `fn(val, i)`
 * in optional context `ctx`.
 *
 * @param {String|Array|Object} obj
 * @param {Function} fn
 * @param {Object} [ctx]
 * @api public
 */

module.exports = function(obj, fn, ctx){
  fn = toFunction(fn);
  ctx = ctx || this;
  switch (type(obj)) {
    case 'array':
      return array(obj, fn, ctx);
    case 'object':
      if ('number' == typeof obj.length) return array(obj, fn, ctx);
      return object(obj, fn, ctx);
    case 'string':
      return string(obj, fn, ctx);
  }
};

/**
 * Iterate string chars.
 *
 * @param {String} obj
 * @param {Function} fn
 * @param {Object} ctx
 * @api private
 */

function string(obj, fn, ctx) {
  for (var i = 0; i < obj.length; ++i) {
    fn.call(ctx, obj.charAt(i), i);
  }
}

/**
 * Iterate object keys.
 *
 * @param {Object} obj
 * @param {Function} fn
 * @param {Object} ctx
 * @api private
 */

function object(obj, fn, ctx) {
  for (var key in obj) {
    if (has.call(obj, key)) {
      fn.call(ctx, key, obj[key]);
    }
  }
}

/**
 * Iterate array-ish.
 *
 * @param {Array|Object} obj
 * @param {Function} fn
 * @param {Object} ctx
 * @api private
 */

function array(obj, fn, ctx) {
  for (var i = 0; i < obj.length; ++i) {
    fn.call(ctx, obj[i], i);
  }
}

});
require.register("component-type/index.js", function(exports, require, module){
/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object Error]': return 'error';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val !== val) return 'nan';
  if (val && val.nodeType === 1) return 'element';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val)

  return typeof val;
};

});
require.register("bmcmahen-linear-conversion/index.js", function(exports, require, module){
module.exports = function linearConversion(a, b){
  var o = a[1] - a[0]
    , n = b[1] - b[0];

  return function(x){
    return (((x - a[0]) * n) / o) + b[0];
  };
};
});
require.register("bmcmahen-canvas-string-ellipsis/index.js", function(exports, require, module){
module.exports = function(ctx, str, maxWidth) {
  var width = ctx.measureText(str).width
    , ellipsis = '...'
    , ellipsisWidth = ctx.measureText(ellipsis).width;

  if (width <= maxWidth || width <= ellipsisWidth){
    return str;
  } else {
    var len = str.length;
    while (width >= maxWidth - ellipsisWidth && len-- > 0){
      str = str.substring(0, len);
      width = ctx.measureText(str).width;
    }
    return str+ellipsis;
  }
};
});
require.register("component-ease/index.js", function(exports, require, module){

exports.linear = function(n){
  return n;
};

exports.inQuad = function(n){
  return n * n;
};

exports.outQuad = function(n){
  return n * (2 - n);
};

exports.inOutQuad = function(n){
  n *= 2;
  if (n < 1) return 0.5 * n * n;
  return - 0.5 * (--n * (n - 2) - 1);
};

exports.inCube = function(n){
  return n * n * n;
};

exports.outCube = function(n){
  return --n * n * n + 1;
};

exports.inOutCube = function(n){
  n *= 2;
  if (n < 1) return 0.5 * n * n * n;
  return 0.5 * ((n -= 2 ) * n * n + 2);
};

exports.inQuart = function(n){
  return n * n * n * n;
};

exports.outQuart = function(n){
  return 1 - (--n * n * n * n);
};

exports.inOutQuart = function(n){
  n *= 2;
  if (n < 1) return 0.5 * n * n * n * n;
  return -0.5 * ((n -= 2) * n * n * n - 2);
};

exports.inQuint = function(n){
  return n * n * n * n * n;
}

exports.outQuint = function(n){
  return --n * n * n * n * n + 1;
}

exports.inOutQuint = function(n){
  n *= 2;
  if (n < 1) return 0.5 * n * n * n * n * n;
  return 0.5 * ((n -= 2) * n * n * n * n + 2);
};

exports.inSine = function(n){
  return 1 - Math.cos(n * Math.PI / 2 );
};

exports.outSine = function(n){
  return Math.sin(n * Math.PI / 2);
};

exports.inOutSine = function(n){
  return .5 * (1 - Math.cos(Math.PI * n));
};

exports.inExpo = function(n){
  return 0 == n ? 0 : Math.pow(1024, n - 1);
};

exports.outExpo = function(n){
  return 1 == n ? n : 1 - Math.pow(2, -10 * n);
};

exports.inOutExpo = function(n){
  if (0 == n) return 0;
  if (1 == n) return 1;
  if ((n *= 2) < 1) return .5 * Math.pow(1024, n - 1);
  return .5 * (-Math.pow(2, -10 * (n - 1)) + 2);
};

exports.inCirc = function(n){
  return 1 - Math.sqrt(1 - n * n);
};

exports.outCirc = function(n){
  return Math.sqrt(1 - (--n * n));
};

exports.inOutCirc = function(n){
  n *= 2
  if (n < 1) return -0.5 * (Math.sqrt(1 - n * n) - 1);
  return 0.5 * (Math.sqrt(1 - (n -= 2) * n) + 1);
};

exports.inBack = function(n){
  var s = 1.70158;
  return n * n * (( s + 1 ) * n - s);
};

exports.outBack = function(n){
  var s = 1.70158;
  return --n * n * ((s + 1) * n + s) + 1;
};

exports.inOutBack = function(n){
  var s = 1.70158 * 1.525;
  if ( ( n *= 2 ) < 1 ) return 0.5 * ( n * n * ( ( s + 1 ) * n - s ) );
  return 0.5 * ( ( n -= 2 ) * n * ( ( s + 1 ) * n + s ) + 2 );
};

exports.inBounce = function(n){
  return 1 - exports.outBounce(1 - n);
};

exports.outBounce = function(n){
  if ( n < ( 1 / 2.75 ) ) {
    return 7.5625 * n * n;
  } else if ( n < ( 2 / 2.75 ) ) {
    return 7.5625 * ( n -= ( 1.5 / 2.75 ) ) * n + 0.75;
  } else if ( n < ( 2.5 / 2.75 ) ) {
    return 7.5625 * ( n -= ( 2.25 / 2.75 ) ) * n + 0.9375;
  } else {
    return 7.5625 * ( n -= ( 2.625 / 2.75 ) ) * n + 0.984375;
  }
};

exports.inOutBounce = function(n){
  if (n < .5) return exports.inBounce(n * 2) * .5;
  return exports.outBounce(n * 2 - 1) * .5 + .5;
};

// aliases

exports['in-quad'] = exports.inQuad;
exports['out-quad'] = exports.outQuad;
exports['in-out-quad'] = exports.inOutQuad;
exports['in-cube'] = exports.inCube;
exports['out-cube'] = exports.outCube;
exports['in-out-cube'] = exports.inOutCube;
exports['in-quart'] = exports.inQuart;
exports['out-quart'] = exports.outQuart;
exports['in-out-quart'] = exports.inOutQuart;
exports['in-quint'] = exports.inQuint;
exports['out-quint'] = exports.outQuint;
exports['in-out-quint'] = exports.inOutQuint;
exports['in-sine'] = exports.inSine;
exports['out-sine'] = exports.outSine;
exports['in-out-sine'] = exports.inOutSine;
exports['in-expo'] = exports.inExpo;
exports['out-expo'] = exports.outExpo;
exports['in-out-expo'] = exports.inOutExpo;
exports['in-circ'] = exports.inCirc;
exports['out-circ'] = exports.outCirc;
exports['in-out-circ'] = exports.inOutCirc;
exports['in-back'] = exports.inBack;
exports['out-back'] = exports.outBack;
exports['in-out-back'] = exports.inOutBack;
exports['in-bounce'] = exports.inBounce;
exports['out-bounce'] = exports.outBounce;
exports['in-out-bounce'] = exports.inOutBounce;

});
require.register("component-tween/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Emitter = require('emitter')
  , ease = require('ease');

/**
 * Expose `Tween`.
 */

module.exports = Tween;

/**
 * Initialize a new `Tween` with `obj`.
 *
 * @param {Object|Array} obj
 * @api public
 */

function Tween(obj) {
  if (!(this instanceof Tween)) return new Tween(obj);
  this._from = obj;
  this.ease('linear');
  this.duration(500);
}

/**
 * Mixin emitter.
 */

Emitter(Tween.prototype);

/**
 * Reset the tween.
 *
 * @api public
 */

Tween.prototype.reset = function(){
  this.isArray = Array.isArray(this._from);
  this._curr = clone(this._from);
  this._done = false;
  this._start = Date.now();
  return this;
};

/**
 * Tween to `obj` and reset internal state.
 *
 *    tween.to({ x: 50, y: 100 })
 *
 * @param {Object|Array} obj
 * @return {Tween} self
 * @api public
 */

Tween.prototype.to = function(obj){
  this.reset();
  this._to = obj;
  return this;
};

/**
 * Set duration to `ms` [500].
 *
 * @param {Number} ms
 * @return {Tween} self
 * @api public
 */

Tween.prototype.duration = function(ms){
  this._duration = ms;
  return this;
};

/**
 * Set easing function to `fn`.
 *
 *    tween.ease('in-out-sine')
 *
 * @param {String|Function} fn
 * @return {Tween}
 * @api public
 */

Tween.prototype.ease = function(fn){
  fn = 'function' == typeof fn ? fn : ease[fn];
  if (!fn) throw new TypeError('invalid easing function');
  this._ease = fn;
  return this;
};

/**
 * Stop the tween and immediately emit "stop" and "end".
 *
 * @return {Tween}
 * @api public
 */

Tween.prototype.stop = function(){
  this.stopped = true;
  this._done = true;
  this.emit('stop');
  this.emit('end');
  return this;
};

/**
 * Perform a step.
 *
 * @return {Tween} self
 * @api private
 */

Tween.prototype.step = function(){
  if (this._done) return;

  // duration
  var duration = this._duration;
  var now = Date.now();
  var delta = now - this._start;
  var done = delta >= duration;

  // complete
  if (done) {
    this._from = this._to;
    this._update(this._to);
    this._done = true;
    this.emit('end');
    return this;
  }

  // tween
  var from = this._from;
  var to = this._to;
  var curr = this._curr;
  var fn = this._ease;
  var p = (now - this._start) / duration;
  var n = fn(p);

  // array
  if (this.isArray) {
    for (var i = 0; i < from.length; ++i) {
      curr[i] = from[i] + (to[i] - from[i]) * n;
    }

    this._update(curr);
    return this;
  }

  // objech
  for (var k in from) {
    curr[k] = from[k] + (to[k] - from[k]) * n;
  }

  this._update(curr);
  return this;
};

/**
 * Set update function to `fn` or
 * when no argument is given this performs
 * a "step".
 *
 * @param {Function} fn
 * @return {Tween} self
 * @api public
 */

Tween.prototype.update = function(fn){
  if (0 == arguments.length) return this.step();
  this._update = fn;
  return this;
};

/**
 * Clone `obj`.
 *
 * @api private
 */

function clone(obj) {
  if (Array.isArray(obj)) return obj.slice();
  var ret = {};
  for (var key in obj) ret[key] = obj[key];
  return ret;
}

});
require.register("component-classes/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  if (!el) throw new Error('A DOM element reference is required');
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`, can force state via `force`.
 *
 * For browsers that support classList, but do not support `force` yet,
 * the mistake will be detected and corrected.
 *
 * @param {String} name
 * @param {Boolean} force
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name, force){
  // classList
  if (this.list) {
    if ("undefined" !== typeof force) {
      if (force !== this.list.toggle(name, force)) {
        this.list.toggle(name); // toggle again to correct
      }
    } else {
      this.list.toggle(name);
    }
    return this;
  }

  // fallback
  if ("undefined" !== typeof force) {
    if (!force) {
      this.remove(name);
    } else {
      this.add(name);
    }
  } else {
    if (this.has(name)) {
      this.remove(name);
    } else {
      this.add(name);
    }
  }

  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var str = this.el.className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

});
require.register("component-pinch/index.js", function(exports, require, module){
/*
 * Module dependencies
 */

var events = require('events');
var E = require('./e');

/**
 * Export `Pinch`
 */

module.exports = Pinch;

/**
 * Initialize `Pinch`
 *
 * @param {Element} el
 * @param {Function} fn
 * @return {Pinch}
 * @api public
 */

function Pinch(el, fn) {
  if (!(this instanceof Pinch)) return new Pinch(el, fn);
  this.el = el;
  this.parent = el.parentNode;
  this.fn = fn || function(){};
  this.midpoint = null;
  this.scale = 1;
  this.lastScale = 1;
  this.pinching = false;
  this.events = events(el, this);
  this.events.bind('touchstart');
  this.events.bind('touchmove');
  this.events.bind('touchend');
  this.fingers = {};
}

/**
 * Touch start
 *
 * @param {Event} e
 * @return {Pinch}
 * @api private
 */

Pinch.prototype.ontouchstart = function(e) {
  var touches = e.touches;
  if (!touches || 2 != touches.length) return this;
  e.preventDefault();

  var coords = [];
  for(var i = 0, finger; finger = touches[i]; i++) {
    coords.push(finger.pageX, finger.pageY);
  }

  this.pinching = true;
  this.distance = distance(coords);
  this.midpoint = midpoint(coords);
  return this;
};

/**
 * Touch move
 *
 * @param {Event} e
 * @return {Pinch}
 * @api private
 */

Pinch.prototype.ontouchmove = function(e) {
  var touches = e.touches;
  if (!touches || touches.length != 2 || !this.pinching) return this;

  var coords = [];
  for(var i = 0, finger; finger = touches[i]; i++) {
    coords.push(finger.pageX, finger.pageY);
  }

  var changed = e.changedTouches;

  var dist = distance(coords);
  var mid = midpoint(coords);

  // make event properties mutable
  e = E(e);

  // iphone does scale natively, just use that
  e.scale = dist / this.distance * this.scale;
  e.x = mid.x;
  e.y = mid.y;

  this.fn(e);

  this.lastScale = e.scale;
  return this;
};

/**
 * Touchend
 *
 * @param {Event} e
 * @return {Pinch}
 * @api private
 */

Pinch.prototype.ontouchend = function(e) {
  var touches = e.touches;
  if (!touches || touches.length == 2 || !this.pinching) return this;
  this.scale = this.lastScale;
  this.pinching = false;
  return this;
};

/**
 * Unbind
 *
 * @return {Pinch}
 * @api public
 */

Pinch.prototype.unbind = function() {
  this.events.unbind();
  return this;
};


/**
 * Get the distance between two points
 *
 * @param {Array} arr
 * @return {Number}
 * @api private
 */

function distance(arr) {
  var x = Math.pow(arr[0] - arr[2], 2);
  var y = Math.pow(arr[1] - arr[3], 2);
  return Math.sqrt(x + y);
}

/**
 * Get the midpoint
 *
 * @param {Array} arr
 * @return {Object} coords
 * @api private
 */

function midpoint(arr) {
  var coords = {};
  coords.x = (arr[0] + arr[2]) / 2;
  coords.y = (arr[1] + arr[3]) / 2;
  return coords;
}

});
require.register("component-pinch/e.js", function(exports, require, module){
/**
 * Expose `E`
 */

module.exports = function(e) {
  // any property it doesn't find on the object
  // itself, look up prototype for original `e`
  E.prototype = e;
  return new E();
};

/**
 * Initialize `E`
 */

function E() {}

});
require.register("stagas-within/index.js", function(exports, require, module){

/**
 * within
 */

module.exports = within

/**
 * Check if an event came from inside of a given element
 *
 * @param object the event object
 * @param Element the element in question
 * @param string the fallback property if relatedTarget is not defined
 * @return boolean
 */

function within (evt, elem, fallback) {
  var targ = evt.relatedTarget, ret;
  if (targ == null) {
    targ = evt[fallback] || null;
  }
  try {
    while (targ && targ !== elem) {
      targ = targ.parentNode;
    }
    ret = (targ === elem);
  } catch(e) {
    ret = false;
  }
  return ret;
}

});
require.register("stagas-mouseleave/index.js", function(exports, require, module){

/**
 * mouseleave
 */

var within = require('within')
var events = require('event')

module.exports = mouseleave

var listeners = []
var fns = []

function mouseleave (el, fn) {
  function listener (ev) {
    var inside = within(ev, ev.target, 'toElement')
    if (inside) return
    if (fn) fn.call(this, ev)
  }
  listeners.push(listener)
  fns.push(fn)
  events.bind(el, 'mouseout', listener)
}

mouseleave.bind = mouseleave

mouseleave.unbind = function (el, fn) {
  var idx = fns.indexOf(fn)
  if (!~idx) return
  fns.splice(idx, 1)
  events.unbind(el, 'mouseout', listeners.splice(idx, 1)[0])
}

});
require.register("yields-is-touch/index.js", function(exports, require, module){

/**
 * Whether or not touch is supported.
 * 
 * Example:
 * 
 *      var touchable = require('touch');
 *      touchable();
 *      // > true
 * 
 * @return {Boolean}
 */

module.exports = function(){
  return 'ontouchstart' in window
    || 'onmsgesturechange' in window;
};

});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  fn._off = on;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = index(callbacks, fn._off || fn);
  if (~i) callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("network/index.js", function(exports, require, module){
module.exports = require('./lib/app');
});
require.register("network/lib/app.js", function(exports, require, module){
// Modules
var raf = require('raf');
var Emitter = require('emitter');
var events = require('events');

// Imports
var constants = require('./constants');
var NodeCollection = require('./nodes');
var LinkCollection = require('./links');
var CanvasView = require('./canvas').CanvasView;


////////////////////////////////
// MindMap API and Controller //
////////////////////////////////

var MindMap = module.exports = function(container, nodes, links){
  if (!(this instanceof MindMap)) return new MindMap(container, nodes, links);
  if (!container) throw new TypeError('MindMap() requires a container element');

  this.container = container;

  // construct our Node Collection, adding data if it's
  // passed to the constructor.
  this.nodes = new NodeCollection(this);
  if (nodes) {
    this.nodes.data(nodes, function(attr){
      return attr._id;
    });
  }

  // construct our Link Collection, adding data if it's
  // passed to the constructor.
  this.links = new LinkCollection(this);
  if (links){
    this.links.data(links, function(attr){
      return attr._id;
    });
  }

  this.translation = { x : 0, y : 0 };
  this.scale = 1;
  this.animated = false;
  this.createView();
};

Emitter(MindMap.prototype);

MindMap.prototype.createView = function(){
  // XXX This should be modularized so that other view types
  // could be used. Eg., DOM, WebGL, SVG.
  this.view = new CanvasView(this.container, this);
  this.bind();
  return this;
};

MindMap.prototype.isLoading = function(state){
  this.loading = state;
  this.emit('loading', state);
};

MindMap.prototype.width = function(width){
  constants.CONTAINER_WIDTH = width;
  this.emit('containerwidth', width);
  return this;
};

MindMap.prototype.height = function(height){
  constants.CONTAINER_HEIGHT = height;
  this.emit('containerheight', height);
  return this;
};


/**
 * Bind our view events to provide a layer of abstraction.
 * Our view is responsible for emitting mouseDown, mouseMove
 * and mouseUp events, whether from the DOM, Canvas, or WebGL.
 */

MindMap.prototype.bind = function(){
  this.viewEvents = events(this.view, this);
  this.viewEvents.bind('mousedown');
  this.viewEvents.bind('mousemove');
  this.viewEvents.bind('mouseup');
  this.viewEvents.bind('mousewheel', 'onzoom');
  this.viewEvents.bind('pinch');
  this.viewEvents.bind('mouseleave');
};

MindMap.prototype.unbind = function(){
  this.viewEvents.unbind();
};

/**
 * Set Mindmap Width & Height
 * @return {Mindmap}
 *
 * xxx - these aren't constants anymore...
 */



MindMap.prototype.onmouseleave = function(){
  
  this.draggingCanvas = false;

  if (this.activeNode){
    this.activeNode.isActive = false;
    this.activeNode.xFixed = false;
    this.activeNode.yFixed = false;
    delete this.activeNode;
  }
  if (this.hoverNode){
    this.hoverNode.mouseOver = false;
    this.hoverNode.mouseOut = true;
    this.hoverNode.triggeredHover = false;
    this.emit('hoverOutNode', this.hoverNode);
    delete this.hoverNode;
  }
}

/**
 * Select nodes or begin dragging.
 * @param  {mousePosition} x
 * @param  {mousePosition} y
 */

MindMap.prototype.onmousedown = function(x, y){
  this.startMouseX = x;
  this.startMouseY = y;
  this.startTranslationX = this.translation.x;
  this.startTranslationY = this.translation.y;

  x = this.xToCanvas(x);
  y = this.yToCanvas(y);

  var clickedNode = this.nodes.getOverlappingNode(x, y);
  
  if (!this.animated) this.animate();
  
  if (clickedNode){
    this.activeNode = clickedNode;
    this.clickFlag = true;
    clickedNode.isActive = true;
    this.emit('nodeActive', this.activeNode);
    this.view.bindDragging();
    this.dragging = true;
  } else {
    this.emit('draggingCanvas');
    this.view.bindDragging();
    this.draggingCanvas = true;
  }
};

/**
 * Handle dragging and hover events
 * @param  {mouseposition} x
 * @param  {mouseposition} y
 */

MindMap.prototype.onmousemove = function(x, y){
  if (x && y){

    // dragging node
    if (this.activeNode && this.dragging){
      this.clickFlag = false;
      var node = this.activeNode;
      node.xFixed = true;
      node.yFixed = true;
      node.x = this.xToCanvas(x);
      node.y = this.yToCanvas(y);

    // dragging canvas
    } else if (this.draggingCanvas) {

      var diffX = this.startTranslationX + (x - this.startMouseX);
      var diffY = this.startTranslationY + (y - this.startMouseY);
      this.setTranslation(diffX, diffY);

    // watch for hovers
    } else {

      var hoverNode = this.nodes.getOverlappingNode(this.xToCanvas(x), this.yToCanvas(y));

      // Start hover-in animation
      if (hoverNode && !this.hoverNode) {
        this.animate();
        hoverNode.mouseOver = true;
        this.emit('hoverNode', hoverNode);
        this.hoverNode = hoverNode;

      // Start hover-out animation
      } else if (!hoverNode && this.hoverNode){
        this.animate();
        this.hoverNode.mouseOver = false;
        this.hoverNode.mouseOut = true;
        this.hoverNode.triggeredHover = false;
        this.emit('hoverOutNode', this.hoverNode);
        delete this.hoverNode;
      }
    }
  }
};

MindMap.prototype.onzoom = function(x, y, delta, pinch){
  this.animate();
  var zoom;
  if (pinch) {
    zoom = delta;
  } else {
    zoom = delta / 10;
    if (delta < 0) zoom = zoom / (1 - zoom);
  }

  var oldScale = this.scale;
  var newScale = oldScale * (1 + zoom);
  if (newScale < 0.3) newScale = 0.3;
  if (newScale > 3) newScale = 3;

  var translation = this.translation
    , scaleFrac = newScale / oldScale
    , tx = (1 - scaleFrac) * x + translation.x * scaleFrac
    , ty = (1 - scaleFrac) * y + translation.y * scaleFrac;

  this.scale = newScale;
  this.setTranslation(tx, ty);
};

// xxx redundancy with onZoom event handler
MindMap.prototype.onpinch = function(x, y, scale){
  this.animate();

  var scaleFrac = scale / this.scale;
  this.scale = scale;

  var tx = (1 - scaleFrac) * x + this.translation.x * scaleFrac;
  var ty = (1 - scaleFrac) * y + this.translation.y * scaleFrac;
  this.setTranslation(tx, ty);
};

/**
 * Select a node or stop dragging.
 */

MindMap.prototype.onmouseup = function(){
  if (this.activeNode) {
    this.activeNode.isActive = false;
  }
  if (this.draggingCanvas) {
    this.draggingCanvas = false;
  }
  if (this.clickFlag){
    if (this.selectedNode != this.activeNode){
      this.activeNode.select();
      this.emit('nodeSelected', this.activeNode);
      this.emit('nodeChanged', this.activeNode);
      this.selectedNode = this.activeNode;
    }
    this.dragging = false;
    this.clickFlag = false;
  } else {
    if (this.activeNode){
      this.activeNode.xFixed = false;
      this.activeNode.yFixed = false;
      delete this.activeNode;
    }
  }
};


/**
 * Primary animation loop using requestAnimationFrame.
 * @return {MindMap}
 */

MindMap.prototype.animate = function(){
  if (!this.animated){
    var lastExecution = Date.now()
      , _this = this;

    this.animated = true;

    // Run our animation using requestAnimationFrame (& fallback)
    // until our movement has stopped. When interacting with the
    // nodes, we tell our mindmap to start running animations again.
    var runAnimation = function(){
      var now = Date.now()
        , dt = now - lastExecution;

      if (dt && dt > 10){
        _this.calculatePosition(dt);
        _this.redraw();
        lastExecution = Date.now();
      }
      if (_this.isMoving){
        raf(runAnimation);
      } else {
        _this.animated = false;
      }
    };

    // Check every second to see if our nodes are still moving
    // and if they aren't (over a certain velocity) then stop
    // running our animation.
    var determineIfMoving = function(){
      if (!_this.nodes.areMoving() && !_this.nodes.areLoading() && !_this.loading){
        _this.isMoving = false;
        clearInterval(timeoutId);
      }
    };

    var timeoutId = setInterval(determineIfMoving, 1000);

    _this.isMoving = true;
    runAnimation();
  }
  return this;
};

MindMap.prototype.calculatePosition = function(dt){
  this.nodes.setForces();
  this.links.addLinkForce();
  this.nodes.discreteStepNodes(dt);
  this.links.discreteStepLinks(dt);
};

// XXX. redraw should be more generic, to make it pluggable with
// different views.
MindMap.prototype.redraw = function(){
  this.view.redraw();
};

MindMap.prototype.drawEntity = function(type, ctx){
  this[type].forEach(function(item){
    item.view.render(ctx);
  });
  return this;
};

MindMap.prototype.determineString = function(ctx){
  this.nodes.forEach(function(node){
    node.view.determineString(ctx);
  });
};

/**
 * Unselect a node by _id, and emits a 'nodeUnselected'
 * event unless silent argument is passed to the func.
 * @param  {String} nodeId
 * @param  {Boolean} silent
 */

MindMap.prototype.deselectNode = function(nodeId, silent){
  var node = this.nodes.get(nodeId);
  if (node){
    this.animate();
    node.unselect();
    delete this.selectedNode;
    if (!silent) this.emit('nodeUnselected', node);
  }
};


/**
 * Select a node by _id, and emits a 'nodeSelected' event unless
 * silent argument is passed to the function.
 * @param  {String} nodeId
 * @param  {Boolean} silent
 */

MindMap.prototype.selectNode = function(nodeId, silent){
  var node = this.nodes.get(nodeId);
  if (node){
    this.animate();
    node.select();
    this.selectedNode = node;
    if (!silent) this.emit('nodeSelected', this.selectedNode);
    this.emit('nodeChanged', this.selectedNode);
  }
};



/**
 * Change the x, y translation origin of our DOM node.
 * @param  {number} offsetX
 * @param  {number} offsetY
 */

MindMap.prototype.setTranslation = function(offsetX, offsetY){
  this.translation.x = offsetX;
  this.translation.y = offsetY;
};

MindMap.prototype.xToCanvas = function(x){
  return (x - this.translation.x) / this.scale;
};

MindMap.prototype.yToCanvas = function(y){
  return (y - this.translation.y) / this.scale;
};


MindMap.prototype.setZoom = function(scale){
  var translation = this.translation
  var scaleFrac = scale / this.scale;
  x = constants.CONTAINER_WIDTH / 2;
  y = constants.CONTAINER_HEIGHT / 2;
  var tx = (1 - scaleFrac) * x + translation.x * scaleFrac
  var ty = (1 - scaleFrac) * y + translation.y * scaleFrac;

  this.scale = scale;
  this.setTranslation(tx, ty);
};




});
require.register("network/lib/constants.js", function(exports, require, module){
module.exports = {
  'RADIUS' : 3,
  'MAX_RADIUS' : 95,
  'DISTANCE' : 180,
  'MIN_DISTANCE' : 140,
  'MIN_VELOCITY': 0.001,
  'MIN_LINK_LENGTH': 150,
  'MAX_LINK_LENGTH': 380,
  'MIN_FORCE': 0.001,
  'LINK_LENGTH' : 100,
  'CONTAINER_WIDTH': 800,
  'CONTAINER_HEIGHT': 600
};

});
require.register("network/lib/collection.js", function(exports, require, module){
// Our generic collection class maintains both an array
// and a key/value listing for quick lookup.
var Collection = module.exports = function(){};

Collection.prototype.remove = function(key){
  delete this.obj[key];

  var models = this.models
    , len = models.length;

  while (len--){
    if (models[len].attr._id === key) {
      models.splice(len, 1);
    }
  }

  return this;
};

Collection.prototype.at = function(i){
  return this.models[i];
};

Collection.prototype.get = function(key){
  return this.obj[key];
};

Collection.prototype.add = function(item, key){
  this.obj[key] = item;
  this.models.push(item);
  return this;
};

Collection.prototype.forEach = function(fn){
  var models = this.models
    , len = models.length;

  for (var i = 0; i < len; i++){
    fn(models[i], i);
  }
  return this;
};
});
require.register("network/lib/nodes.js", function(exports, require, module){
// Modules
var Emitter = require('emitter');
var indexOf = require('indexof');
var Tween = require('tween');

// Imports
var NodeView = require('./canvas').NodeView;
var Collection = require('./collection');
var constants = require('./constants');

/////////////////////
// NODE COLLECTION //
/////////////////////

var NodeCollection = module.exports = function(context){
  this.models = [];
  this.obj = {};
  this.context = context;
};

// Inherit from Ordered Dictionary class to give us
// quick lookups and simplified loops.
NodeCollection.prototype = new Collection();
Emitter(NodeCollection.prototype);


NodeCollection.prototype.data = function(json, fn){
  this.context.animate();
  var keys = [], len = this.models.length;
  for (var i = 0, l = json.length; i < l; i++){
    var key = (typeof fn == 'string') ? json[fn] : fn(json[i]);
    var model = this.get(key);
    keys.push(key);
    if (!model){
      var node = new NodeModel(json[i], this);
      node.setRandomPosition(i, json.length, this.context.scale);
      this.add(node, key);
    }
  }

  // Remove any that might be missing...
  if (len){
    var models = this.models;
    while (len--){
      var m = models[len];
      if (indexOf(keys, m.attr._id) === -1){
        // this.emit('nodeRemoved', m);
        m.fadeOut = true;
      }
    }
  }
  return this;
};


NodeCollection.prototype.setForces = function(){
  this
    .setGravitationalForce()
    .addRepulsingForce();
};

// XXX Since we are always applying gravitational force
// and Repulsing force, it would be more efficient
// to do it in the same loop.
// https://github.com/almende/vis/blob/master/src/graph/graphMixins/physics/PhysicsMixin.js

NodeCollection.prototype.setGravitationalForce = function(){
  var gravity = 0.005;
  var scale = this.context.scale;
  var gx = constants.CONTAINER_WIDTH / 2;
  var gy = constants.CONTAINER_HEIGHT / 2;

   this.forEach(function(node, i){
    var dx = gx - (node.x);
    var dy = gy - (node.y);
    var angle = Math.atan2(dy, dx);
    var fx = Math.cos(angle) * gravity;
    var fy = Math.sin(angle) * gravity;

    node.setForce(fx, fy);
   });

  return this;
};

// https://github.com/almende/vis/blob/master/src/graph/graphMixins/physics/Repulsion.js
NodeCollection.prototype.addRepulsingForce = function(){
  var minimumDistance = constants.MIN_DISTANCE;
  var steepness = 9;
  var nodes = this.models;

  for (var i = 0, len = nodes.length; i< len; i++) {
    for (var i2 = i + 1; i2 < len; i2++) {

      // Calculate normally distributed force.
      // this should take into account our width and height
      // such that we don't get overlapping elements.
      var node2 = nodes[i2];
      var node = nodes[i];
      var dx = node2.x - node.x;
      var dy = node2.y - node.y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      var angle = Math.atan2(dy, dx);
      var repulsingforceY = 1 / (1 + Math.exp((distance / minimumDistance - 1) * steepness));
      var repulsingforceX = 1 / (1 + Math.exp((distance / 130 - 1) * steepness));
      var fx = Math.cos(angle) * repulsingforceX;
      var fy = Math.sin(angle) * repulsingforceY;

      // For simplicity, perhaps alter the minimum distance based on
      // the width of the element.

      node.addForce(-fx, -fy);
      node2.addForce(fx, fy);
    }
  }
};

NodeCollection.prototype.getOverlappingNode = function(x, y){
  var overlappingNode = false;
  this.forEach(function(node){
    if (node.isOverlappingWith(x, y)){
      overlappingNode = node;
      return;
    }
  });
  return overlappingNode;
};

NodeCollection.prototype.discreteStepNodes = function(dt){
  this.forEach(function(node){
    if (node) node.discreteStep(dt);
  });
};

NodeCollection.prototype.areMoving = function(){
  var moving = false;
  this.forEach(function(node){
    if (node.isMoving()) {
      moving = true;
      return;
    }
  });
  return moving;
};

NodeCollection.prototype.areLoading = function(){
  var loading = false;
  this.forEach(function(node){
    if (node.loading) {
      loading = true;
      return;
    }
  });
  return loading;
};


////////////////
// NODE MODEL //
////////////////

var NodeModel = function(attr, context){
  context.emit('nodeCreated', this);
  this.collection = context;
  this.attr = attr;

  // Load our image if we have one
  if (attr.image) {
    this.loading = true;
    this.type = 'image';
    var _this = this;
    this.loadImage(attr.image.url, function(img){
      _this.loading = false;
      _this.image = img;
    });
  } else {
    this.type = 'text';
    this.loading = false;
  }

  this.isSelected = false;
  this.links = [];
  this.opacity = 0.001;
  this.radius = constants.RADIUS;
  this.mass = 50; // kg
  this.fx = 0.0; // external force x
  this.fy = 0.0; // external force y
  this.vx = 0.0; // velocity x
  this.vy = 0.0; // velocity y
  this.minForce = constants.MIN_FORCE;
  this.minVelocity = constants.MIN_VELOCITY;
  this.damping = 0.9;

  this.type === 'image'
    ? this.setDimensions(85, 85)
    : this.setDimensions(130, 40);

  this.width = 145; // XXX our which should be dependent on width of text?
  this.height = 40;
  this.view = new NodeView(this);
  this.fadeIn = true;
  this.fadeOut = false;
  this.scale = 1.05;
  this.createFadeInTween();
};

NodeModel.prototype.setDimensions = function(w, h){
  this.width = w;
  this.height = h;
};

NodeModel.prototype.select = function(){
  this.isSelected = true;
  if (this.fadeIn){
    this.createFadeInTween({
      scale: this.scale,
      opacity: this.opacity
    }, {
      scale: 1.3,
      opacity: 1
    });
  } else {
    this.scale = 1.3;
  }
};

NodeModel.prototype.unselect = function(){
  this.isSelected = false;
  this.mouseOut = true;
};

NodeModel.prototype.createFadeInTween = function(source, target){
  var _this = this;
  source = source || { scale: 0.3, opacity: 0.001 };
  target = target || { scale: 1.05, opacity: 1.0 };

  this.fadeInTween = new Tween(source)
    .ease('in-out-cube')
    .to(target)
    .duration(600);

  this.fadeInTween.update(function(o){
    _this.scale = o.scale;
    _this.opacity = o.opacity;
  });

  this.fadeInTween.on('end', function(){
    _this.fadeIn = false;
    _this.scale = target.scale;
  });
};

NodeModel.prototype.createFadeOutTween = function(){
  var _this = this;
  this.fadeOutTween = new Tween({ scale: this.scale, opacity: 1.0})
    .ease('in-out-cube')
    .to({ scale: 0.3, opacity: 0.001 })
    .duration(600);

  this.fadeOutTween.update(function(o){
    _this.opacity = o.opacity;
    _this.scale = o.scale;
  });

  this.fadeOutTween.on('end', function(){
    _this.collection.remove(_this.attr._id);
  });
};


NodeModel.prototype.createHoverTween = function(hoverIn){
  var _this = this
    , from = hoverIn ? 1.05 : this.scale
    , to = hoverIn ? 1.3 : 1.05;

  this.hoverTween = new Tween({ scale: from })
    .to({ scale: to })
    .duration(100);

  this.hoverTween.update(function(o){
    _this.scale = o.scale;
  });

  this.hoverTween.on('end', function(){
    if (!hoverIn){
      _this.mouseOut = false;
      _this.triggeredHoverOut = false;
      _this.scale = 1.05;
    }
  });
};

NodeModel.prototype.createScaleTween = function(from, to, duration, type){
  var _this = this
    , dur = (duration || 100);

  this.scaleTween = new Tween({ scale : from })
    .to({ scale : to })
    .duration(dur);

  this.scaleTween.update(function(o){
    _this.scale = o.scale;
  });

  this.scaleTween.on('end', function(){
    if (type === 'hoverOut') {
      _this.mouseOut = false;
      _this.triggeredHoverOut = false;
      _this.scale = 1.05;
    }
  });
};

NodeModel.prototype.setRandomPosition = function(i, total, scale){
  var radius = constants.LINK_LENGTH * 2;
  var cx = (constants.CONTAINER_WIDTH / 2);
  var cy = (constants.CONTAINER_HEIGHT / 2);
  var angle = 2 * Math.PI * (i / total);

  if (!this.xFixed) {
    this.x = cx + radius * Math.cos(angle);
  }

  if (!this.yFixed){
    this.y = cy + radius * Math.sin(angle);
  } 
};

NodeModel.prototype.addLink = function(link){
  this.links.push(link);
  this.updateMass();
};

NodeModel.prototype.removeLink = function(link){
  var i = indexOf(this.links, link);
  if (i) this.links.splice(i, 1);
  this.updateMass();
};

NodeModel.prototype.updateMass = function(){
  this.mass = 80 * this.links.length;
};

NodeModel.prototype.setForce = function(fx, fy){
  this.fx = fx;
  this.fy = fy;
};

NodeModel.prototype.addForce = function(fx, fy){
  this.fx += fx;
  this.fy += fy;
};

NodeModel.prototype.discreteStep = function(dt){
  var interval = dt / 1000.0;

  // Handle fade-in and fade-out of elements when adding
  // or removing them dynamically from our collection.
  if (this.fadeIn) this.fadeInTween.update();
  if (this.fadeOut){
    if (!this.fadeOutTween) this.createFadeOutTween();
    this.fadeOutTween.update();
  }

  // Handle hover instances.
  // For simplicity, maybe just have two dif tweens for hoverIn
  // and hoverOut, b/c this seems to have some issues.
  if (!this.isSelected){
    if (this.mouseOver) {
      if (!this.triggeredHover) {
        this.triggeredHover = true;
        this.createHoverTween(true);
      }
      this.hoverTween.update();
    }
    if (this.mouseOut) {
      if (!this.triggeredHoverOut) {
        this.triggeredHoverOut = true;
        this.createScaleTween(1.3, 1.05, 100, 'hoverOut');
      }
      this.scaleTween.update();
    }
  }

  // x
  if (!this.xFixed) {
    var dx = -this.damping * this.vx; // damping force
    var ax = (this.fx + dx) / this.mass;
    this.vx += ax / interval;
    this.x += this.vx / interval;
  }

  // y
  if (!this.yFixed) {
    var dy = -this.damping * this.vy;
    var ay = (this.fy + dy) / this.mass;
    this.vy += ay / interval;
    this.y += this.vy / interval;
  }
};

NodeModel.prototype.distanceFrom = function(x, y){
  var dx = this.x - x
    , dy = this.y - y;
  return Math.sqrt(dx * dx + dy * hy);
};

NodeModel.prototype.isOverlappingWith = function(x, y){
  if (this.type === 'image'){
    return ((Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2)) < Math.pow(42.5, 2));
  }

  var left = this.x - this.width / 2
    , top = this.y - this.height / 2;

  return (
    x > left &&
    x < left + this.width &&
    y > top &&
    y < top + this.height
  );
};

NodeModel.prototype.isFixed = function(){
  return (this.xFixed && this.yFixed);
};

// return true if the velocity is below the minimum
// velocity constant.
NodeModel.prototype.isMoving = function(){
  // XXX Use Kinetic Energy
  return (Math.abs(this.vx) > this.minVelocity || Math.abs(this.vy) > this.minVelocity ||
    (!this.xFixed && Math.abs(this.fx) > this.minForce) ||
    (!this.yFixed && Math.abs(this.fy) > this.minForce));
};

NodeModel.prototype.loadImage = function(url, fn){
  var img = new Image();
  img.onload = function(){ fn(img); };
  img.src = url;
};
});
require.register("network/lib/links.js", function(exports, require, module){
// Modules
var Emitter = require('emitter');
var indexOf = require('indexof');
var Tween = require('tween');
var each = require('each');
var linearConversion = require('linear-conversion');

// Imports
var LinkView = require('./canvas').LinkView;
var Collection = require('./collection');
var constants = require('./constants');


// LINK COLLECTION ->
// We maintain both an array and object (with the _id as key)
// in order to optimize quick lookup, and fast enumeration. There is
// maintenance, but adding/removing is not the most performance
// critical part of the app.

var LinkCollection = module.exports = function(context){
  this.models = [];
  this.obj = {};
  this.nodes = context.nodes;
  this.context = context;
};

LinkCollection.prototype = new Collection();

LinkCollection.prototype.discreteStepLinks = function(dt){
  this.forEach(function(link){
    if (link) link.discreteStep(dt);
  });
};

LinkCollection.prototype.data = function(json, fn){
  this.context.animate();
  var keys = [], len = this.models.length;
  for (var i = 0, l = json.length; i < l; i++){
    var key = (typeof fn == 'string') ? json[fn] : fn(json[i]);
    var model = this.get(key);
    keys.push(key);
    if (!model){
      this.addLink(json[i]);
    } else {
      var opacity = json[i].opacity || 1;
      model.setOpacity(opacity);
      model.attr = json[i];
    }
  }

  // Remove any that might be missing...
  if (len){
    var models = this.models;
    while (len--){
      var m = models[len];
      if (indexOf(keys, m.attr._id) === -1){
        m.fadeOut = true;
      }
    }
  }
  return this;
};


// Create our link model, and add it to the attached nodes.
LinkCollection.prototype.addLink = function(item){
  var nodes = this.nodes
    , from = nodes.get(item.from._id)
    , to = nodes.get(item.to._id);

  if (from && to){
      var linkModel = new LinkModel(item, from, to, this);
      from.addLink(linkModel);
      to.addLink(linkModel);
      this.add(linkModel, item._id);
    }

  return this;
};

// Remove our link model, and remove it from the attached nodes.
LinkCollection.prototype.removeLink = function(model, key){
  model.from.removeLink(model);
  model.to.removeLink(model);
  this.remove(key);
  return this;
};

LinkCollection.prototype.removeLinks = function(links){
  if (!links) return this;

  var _this = this;
  each(links, function(item, i){
    item.fadeOut = true;
  });

  return this;
};

// Each link has a spring force. The shorter the link -- and thus,
// the stronger the association -- the less spring, or more rigid
// the spring.
LinkCollection.prototype.addLinkForce = function(){
  this.forEach(function(link, i){
    var dx = (link.to.x - link.from.x)
      , dy = (link.to.y - link.from.y)
      , linkLength = link.len
      , length =  Math.sqrt(dx * dx + dy * dy)
      , angle = Math.atan2(dy, dx)
      , springforce = link.stiffness * (linkLength - length)
      , fx = Math.cos(angle) * springforce
      , fy = Math.sin(angle) * springforce;

    link.from.addForce(-fx, -fy);
    link.to.addForce(fx, fy);
    // If we wanted a bezier curve instead, calculate it here
    // link.calculateBezier();
  });
  return this;
};

// LINK MODEL
var LinkModel = function(attr, from, to, context){
  this._id = attr._id;
  this.strength = attr.strength;
  this.opacity = 0;
  this.targetOpacity = attr.opacity ? attr.opacity : 1;
  this.attr = attr;
  this.from = from;
  this.to = to;
  this.context = context;
  this.len = this.determineLength();
  this.stiffness = 0.05 / this.len;
  this.view = new LinkView(this);
  this.fadeIn = true;
  this.fadeOut = false;
  this.createFadeInTween();
};

LinkModel.prototype.setOpacity = function(opacity){
  this.targetOpacity = opacity;
  this.opacity = opacity;
};

LinkModel.prototype.discreteStep = function(dt){
  if (this.fadeIn) this.fadeInTween.update();
  if (this.fadeOut){
    if (!this.fadeOutTween) this.createFadeOutTween();
    this.fadeOutTween.update();
  }
};

LinkModel.prototype.createFadeInTween = function(){
  var _this = this;

  this.fadeInTween = new Tween({ opacity: 0.001 })
    .ease('in-out-cube')
    .to({ opacity: this.targetOpacity })
    .duration(1000);

  this.fadeInTween.update(function(o){
    _this.opacity = o.opacity;
  });

  this.fadeInTween.on('end', function(){ _this.fadeIn = false; });
};

LinkModel.prototype.createFadeOutTween = function(){
  var _this = this;
  this.fadeOutTween = new Tween({ opacity: this.targetOpacity})
    .ease('in-out-cube')
    .to({ opacity: 0.001 })
    .duration(200);

  this.fadeOutTween.update(function(o){
    _this.opacity = o.opacity;
  });

  this.fadeOutTween.on('end', function(){
    _this.context.removeLink(_this, _this.attr._id);
  });
};

LinkModel.prototype.determineLength = function(){
  var scale = linearConversion([0, 10], [constants.MAX_LINK_LENGTH, constants.MIN_LINK_LENGTH]);
  return scale(this.strength);
};


});
require.register("network/lib/canvas.js", function(exports, require, module){
// Modules
var events = require('events')
  , Emitter = require('emitter')
  , stringEllipsis = require('canvas-string-ellipsis')
  , roundedRect = require('rounded-rect')
  , classes = require('classes')
  , pinch = require('pinch')
  , mouseleave = require('mouseleave')
  , isTouch = require('is-touch');

// Imports
var constants = require('./constants');
var loading = require('./loading');


// XXX If performance ever becomes an issue, consider
// (1) drawing all the text, (2) drawing all the rectangles
// (3) drawing all the links
// NodeView.prototype.renderText = function(ctx){
//   ctx.fillText(this.string, model.x, model.y);
// };


/////////////////////////
// PRIMARY CANVAS VIEW //
/////////////////////////

var CanvasView = exports.CanvasView = function(wrapper, context){
  this.context = context;
  var canvas = this.canvas = document.createElement('canvas');
  var dr = this.devicePixelRatio = window.devicePixelRatio;
  canvas.width = constants.CONTAINER_WIDTH * dr;
  canvas.height = constants.CONTAINER_HEIGHT * dr;
  canvas.style.width = constants.CONTAINER_WIDTH + 'px';
  canvas.style.height = constants.CONTAINER_HEIGHT + 'px';
  wrapper.appendChild(canvas);

  // If Canvas isn't supported, let it be known...
  if (!this.canvas.getContext){
    var noCanvas = document.createElement('div');
    noCanvas.style.color = 'red';
    noCanvas.innerHTML = 'Your browser does not support this technology. Please upgrade.';
    wrapper.appendChild(noCanvas);
    return;
  }

  this.scale = window.devicePixelRatio || 1;
  this.originX = 0;
  this.originY = 0;

  // Canvas events
  this.events = events(canvas, this);
  this.events.bind('mousemove');
  this.events.bind('mousedown');
  this.events.bind('touchmove', 'onmousemove');
  this.events.bind('touchstart', 'onmousedown');
  this.events.bind('mousewheel');

  var self = this;
  window.onscroll = function(e){
    self.getOffset();
  }

  pinch(canvas, function(e){
    var x = e.x * self.devicePixelRatio;
    var y = e.y * self.devicePixelRatio;
    self.emit('pinch', x, y, e.scale);
  });

  mouseleave(canvas, function(e){
    self.emit('mouseleave');
  });

  // Controller events
  this.controllerEvents = events(this.context, this);
  this.controllerEvents.bind('hoverNode', 'onHover');
  this.controllerEvents.bind('hoverOutNode', 'onHover');
  this.controllerEvents.bind('containerwidth');
  this.controllerEvents.bind('loading');
  this.controllerEvents.bind('containerheight');
  this.setContextConstants();
};

Emitter(CanvasView.prototype);

CanvasView.prototype.oncontainerwidth = function(w){
  this.canvas.width = w * window.devicePixelRatio;
  this.canvas.style.width = w + 'px';
  this.setContextConstants();
};

CanvasView.prototype.onloading = function(state){
  this.loadingState = state;
};

CanvasView.prototype.oncontainerheight = function(h){
  this.canvas.height = h * window.devicePixelRatio;
  this.canvas.style.height = h + 'px';
  this.setContextConstants();
};

/**
 * On hover in / out, toggle 'hover-node' class.
 */

CanvasView.prototype.onHover = function(node){
  classes(this.canvas).toggle('hover-node');
};


/**
 * Set constant context attributes only once
 * for efficiency.
 */

CanvasView.prototype.setContextConstants = function(){
  var ctx = this.canvas.getContext('2d');
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#333';
  ctx.font = 'bold 13px Arial';
};

/**
 * Redraw our canvas by clearing it on each step and
 * drawing our links and nodes. Links go first, to appear
 * behind the nodes.
 */

CanvasView.prototype.redraw = function(){
  var canvas = this.canvas
    , ctx = canvas.getContext('2d')
    , w = constants.CONTAINER_WIDTH * this.devicePixelRatio
    , h = constants.CONTAINER_HEIGHT * this.devicePixelRatio

  var m = this.context;

  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(m.translation.x * this.devicePixelRatio, m.translation.y * this.devicePixelRatio);
  ctx.scale(m.scale * this.devicePixelRatio, m.scale * this.devicePixelRatio);

  if (this.loadingState){
    loading(ctx);
  } else {

  // ideally, our view shouldn't know about our collections.
  this.context
    .drawEntity('links', ctx)
    .drawEntity('nodes', ctx);
  }

  ctx.restore();
};

/**
 * Get the offset of our canvas within the window.
 * @return {[object]}
 */

CanvasView.prototype.getOffset = function(){
  var rect = this.canvas.getBoundingClientRect();
  this.top = rect.top;
  this.left = rect.left;
  return rect;
};

CanvasView.prototype.bindDragging = function(e){
  this.events.bind('mouseup');
  this.events.bind('touchend', 'onmouseup');
};

CanvasView.prototype.xPosition = function(x){
  if (!this.left) this.getOffset();
  return (x - this.left);
};

CanvasView.prototype.yPosition = function(y){
  if (!this.top) this.getOffset();
  return (y - this.top);
};

CanvasView.prototype.mousePoints = function(e){
  e.preventDefault();
  var touches = e.changedTouches;
  if (e.touches && e.touches.length > 1) {
    return false;
  }
  var point = touches ? touches[0] : e;
  return {
    x: this.xPosition(point.clientX),
    y: this.yPosition(point.clientY)
  };
}

CanvasView.prototype.onmousedown = function(e){
  var points = this.mousePoints(e);
  if (!points) return;
  this.emit('mousedown', points.x, points.y);
};

CanvasView.prototype.onmousemove = function(e){
  var points = this.mousePoints(e);
  this.emit('mousemove', points.x, points.y);
};

CanvasView.prototype.onmouseup = function(e){
  e.preventDefault();
  this.events.unbind('mouseup');
  this.events.unbind('touchend');
  this.emit('mouseup');
};

// also support pinch on mobile.
CanvasView.prototype.onmousewheel = function(e){
  e = event || window.event;
  e.preventDefault();
  var ctx = this.canvas.getContext('2d');
  if (!this.left) this.getOffset();

  var mouseX = this.xPosition(e.clientX);
  var mouseY = this.yPosition(e.clientY);

  var delta = 0;
  if (e.wheelDelta) delta = e.wheelDelta / 120;
  else if (e.detail) delta = -e.detail/3;

  this.emit('mousewheel', mouseX, mouseY, delta);
};




///////////////
// Link View //
///////////////

var LinkView = function(model){
  this.model = model;
};

exports.LinkView = LinkView;

/**
 * Render each link based on the model attributes.
 * @param  {canvas2dContext} ctx
 */

LinkView.prototype.render = function(ctx){
  var m = this.model;
  ctx.strokeStyle = 'rgba(34, 43, 156,'+ m.opacity +')';
  ctx.lineWidth = m.strength;
  ctx.beginPath();
  ctx.moveTo(m.from.x, m.from.y);
  ctx.lineTo(m.to.x, m.to.y);
  ctx.stroke();
};



///////////////
// Node View //
///////////////

var NodeView = function(model){
  this.model = model;
  if (model.type === 'text') this.determineString();
};

exports.NodeView = NodeView;

/**
 * Determine what our truncated string is only once per node,
 * so that we don't need to do this on each discrete step.
 */

NodeView.prototype.determineString = function(){
  var canvas = document.createElement('canvas')
    , tempCtx = canvas.getContext('2d')
    , maxWidth = 200;

  tempCtx.font = 'bold 13px Arial';
  var width = tempCtx.measureText(this.model.attr.title).width + 25;
  // if our width is over our maxWidth, then bring in the string ellipsis.

  if (width > maxWidth) {
    this.model.width = maxWidth;
    this.string = stringEllipsis(tempCtx, this.model.attr.title, maxWidth - 15);
  } else {
    this.model.width = width;
    this.string = this.model.attr.title;
  }
};

/**
 * Render our node based on the model attributes.
 * @param  {Canvas2dContext} ctx
 */

NodeView.prototype.render = function(ctx){
  var model = this.model
    , left =  -model.width / 2
    , top = -model.height / 2;

  if (model.type === 'image'){

    ctx.save();
    ctx.translate(model.x, model.y);
    ctx.scale(model.scale, model.scale);

    ctx.save();

    //draw a circle
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI*2, true);
    ctx.lineWidth = 5;
    ctx.globalAlpha = model.opacity || 0;
    if (model.isSelected){
      ctx.strokeStyle = '#00a10f';
    } else {
      ctx.strokeStyle = '#333';
    }
    ctx.stroke();
    if (model.loading) {
      ctx.fillStyle = '#ddd';
    }
    ctx.fill();
    ctx.closePath();
    ctx.clip();

    if (model.loading){
      this.loadingAnimation(ctx);
    }

    // Draw our image
    if (!model.loading){
      ctx.drawImage(model.image, -42.5, -42.5, 85, 85);
    }
    ctx.restore();

    // Show the title of the image on hover.
    // Should we just always show it if using touch?
    if (model.mouseOver && model.attr.title || isTouch()){
      ctx.fillStyle = '#333';
      ctx.font = 'bold 13px Helvetica, Arial';
      ctx.fillText(model.attr.title, 0, 55);

    }
    ctx.restore();

  } else {

  // Rectangle Line Style
  ctx.lineWidth = 3;
  var opacity = model.opacity || 0;
  if (model.isSelected) ctx.fillStyle = '#777';
  else if (model.isActive) ctx.fillStyle = '#ddd';
  else ctx.fillStyle = 'rgba(255, 255, 255,'+ opacity +')';
  ctx.strokeStyle = 'rgba(20, 20, 20,'+ opacity +')';

  ctx.save();
  ctx.translate(model.x, model.y);

  // Scale
  ctx.scale(model.scale, model.scale);

  // Rectangle
  roundedRect(ctx, left, top, model.width, model.height, model.radius);

  ctx.fill();

  // Our Rectangle Outline
  ctx.stroke();

  // Our Text
  if (model.attr.title){
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = model.isSelected
      ? 'rgba(255,255,255,'+model.opacity+')'
      : 'rgba(51,51,51,'+model.opacity+')';
    ctx.fillText(this.string, 0, 0);
  }

  ctx.restore();

}
};

// https://github.com/component/spinner/blob/master/index.js
// xxx use loading.js instead.
NodeView.prototype.loadingAnimation = function(ctx){
  this.speed = this.speed || 60;
  this.size = this.size || 30;
  this.percent = this.percent || 0;
  this.percent = (this.percent + this.speed / 36) % 100;
  ctx.save();
  ctx.translate(-15, -15);
  var percent = this.percent;
  var ratio = 1;
  var size = this.size / ratio;
  var half = size / 2;
  var x = half;
  var y = half;
  var rad = half - 1;
  var angle = Math.PI * 2 * (percent / 100);
  var grad = ctx.createLinearGradient(
    half + Math.sin(Math.PI * 1.5 - angle) * half,
    half + Math.cos(Math.PI * 1.5 - angle) * half,
    half + Math.sin(Math.PI * 0.5 - angle) * half,
    half + Math.cos(Math.PI * 0.5 - angle) * half
  );

  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 1)');

  ctx.strokeStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, rad, angle - Math.PI, angle, false);
  ctx.stroke();

  // inner circle
  ctx.strokeStyle = 'rgba(0, 0, 0, .4)';
  ctx.beginPath();
  ctx.arc(x, y, rad - 1, 0, Math.PI * 2, true);
  ctx.stroke();
  ctx.restore();
};

/**
 * Draw an Image to the canvas
 * @param  {2d context} ctx
 * @param  {image} img
 */

NodeView.prototype.drawImage = function(ctx, img){
  ctx.save();

  // Draw our circular clipping path
  ctx.beginPath();
  ctx.arc(75, 75, 10, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();

  // Draw our image
  ctx.drawImage(img, this.model.x, this.model.y, 75, 75);

  ctx.restore();
}

});
require.register("network/lib/loading.js", function(exports, require, module){
var constants = require('./constants');

module.exports = function(ctx, speed, size, small){
  this.speed = speed || 45;
  this.size = size || 45;
  this.percent = this.percent || 0;
  this.percent = (this.percent + this.speed / 36) % 100;
  ctx.save();
  var tx = small ? -22.5 : -22.5 + (constants.CONTAINER_WIDTH / 2);
  var ty = small ? -22.5 : -22.5 + (constants.CONTAINER_HEIGHT / 2);
  ctx.translate(tx, ty);
  var percent = this.percent;
  var ratio = 1;
  var size = this.size / ratio;
  var half = size / 2;
  var x = half;
  var y = half;
  var rad = half - 1;
  var angle = Math.PI * 2 * (percent / 100);
  var grad = ctx.createLinearGradient(
    half + Math.sin(Math.PI * 1.5 - angle) * half,
    half + Math.cos(Math.PI * 1.5 - angle) * half,
    half + Math.sin(Math.PI * 0.5 - angle) * half,
    half + Math.cos(Math.PI * 0.5 - angle) * half
  );

  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 1)');

  ctx.lineWidth = 7;

  ctx.strokeStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, rad, angle - Math.PI, angle, false);
  ctx.stroke();

  // inner circle
  ctx.strokeStyle = 'rgba(0, 0, 0, .4)';
  ctx.beginPath();
  ctx.arc(x, y, rad - 1, 0, Math.PI * 2, true);
  ctx.stroke();
  ctx.restore();
}
});






























require.alias("component-raf/index.js", "network/deps/raf/index.js");
require.alias("component-raf/index.js", "raf/index.js");

require.alias("component-indexof/index.js", "network/deps/indexof/index.js");
require.alias("component-indexof/index.js", "indexof/index.js");

require.alias("component-rounded-rect/index.js", "network/deps/rounded-rect/index.js");
require.alias("component-rounded-rect/index.js", "rounded-rect/index.js");

require.alias("component-events/index.js", "network/deps/events/index.js");
require.alias("component-events/index.js", "events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-delegate/index.js", "component-events/deps/delegate/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("component-matches-selector/index.js", "discore-closest/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("discore-closest/index.js", "discore-closest/index.js");
require.alias("component-event/index.js", "component-delegate/deps/event/index.js");

require.alias("component-each/index.js", "network/deps/each/index.js");
require.alias("component-each/index.js", "each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-type/index.js", "network/deps/type/index.js");
require.alias("component-type/index.js", "type/index.js");

require.alias("bmcmahen-linear-conversion/index.js", "network/deps/linear-conversion/index.js");
require.alias("bmcmahen-linear-conversion/index.js", "network/deps/linear-conversion/index.js");
require.alias("bmcmahen-linear-conversion/index.js", "linear-conversion/index.js");
require.alias("bmcmahen-linear-conversion/index.js", "bmcmahen-linear-conversion/index.js");
require.alias("bmcmahen-canvas-string-ellipsis/index.js", "network/deps/canvas-string-ellipsis/index.js");
require.alias("bmcmahen-canvas-string-ellipsis/index.js", "network/deps/canvas-string-ellipsis/index.js");
require.alias("bmcmahen-canvas-string-ellipsis/index.js", "canvas-string-ellipsis/index.js");
require.alias("bmcmahen-canvas-string-ellipsis/index.js", "bmcmahen-canvas-string-ellipsis/index.js");
require.alias("component-tween/index.js", "network/deps/tween/index.js");
require.alias("component-tween/index.js", "tween/index.js");
require.alias("component-emitter/index.js", "component-tween/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-ease/index.js", "component-tween/deps/ease/index.js");

require.alias("component-classes/index.js", "network/deps/classes/index.js");
require.alias("component-classes/index.js", "classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("component-pinch/index.js", "network/deps/pinch/index.js");
require.alias("component-pinch/e.js", "network/deps/pinch/e.js");
require.alias("component-pinch/index.js", "network/deps/pinch/index.js");
require.alias("component-pinch/index.js", "pinch/index.js");
require.alias("component-events/index.js", "component-pinch/deps/events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-delegate/index.js", "component-events/deps/delegate/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("component-matches-selector/index.js", "discore-closest/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("discore-closest/index.js", "discore-closest/index.js");
require.alias("component-event/index.js", "component-delegate/deps/event/index.js");

require.alias("component-pinch/index.js", "component-pinch/index.js");
require.alias("stagas-mouseleave/index.js", "network/deps/mouseleave/index.js");
require.alias("stagas-mouseleave/index.js", "mouseleave/index.js");
require.alias("stagas-within/index.js", "stagas-mouseleave/deps/within/index.js");

require.alias("component-event/index.js", "stagas-mouseleave/deps/event/index.js");

require.alias("yields-is-touch/index.js", "network/deps/is-touch/index.js");
require.alias("yields-is-touch/index.js", "is-touch/index.js");

require.alias("component-emitter/index.js", "network/deps/emitter/index.js");
require.alias("component-emitter/index.js", "emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("network/index.js", "network/index.js");