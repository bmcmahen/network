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

  this.emit('zoom', newScale);
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
  this.emit('zoom', newScale);
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
  this.animate();
  var translation = this.translation
  var scaleFrac = scale / this.scale;
  x = constants.CONTAINER_WIDTH / 2;
  y = constants.CONTAINER_HEIGHT / 2;
  var tx = (1 - scaleFrac) * x + translation.x * scaleFrac
  var ty = (1 - scaleFrac) * y + translation.y * scaleFrac;

  this.scale = scale;
  this.emit('zoom', scale);
  this.setTranslation(tx, ty);
};



