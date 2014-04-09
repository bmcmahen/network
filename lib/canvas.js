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
  ctx.translate(m.translation.x, m.translation.y);
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
