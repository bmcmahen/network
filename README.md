network
========

A (mostly re-write) fork of the excellent [chap-links-library](https://github.com/almende/chap-links-library/tree/master/js/src/network) for visualizing data connections. 


## API

### new Network(el);

Instantiates a new mindmap inside the given DOM element.

### network.nodes.data([docs], fn | String);

Add nodes to the mindmap. `fn` allows the user to supply the unique `id` that the mindmap uses internally to manage nodes. To add or remove nodes, reuse `.data()` with your altered data-set.

```javascript
var docs = [{_id: 1, name: 'Ben'}, {_id: 2, name: 'Joe'}];
network.nodes.data(docs, '_id');
```

Currently the mindmap requires the text attribute to be called `name`, but this should change in the future.

### network.links.data([links], fn | String);

Add links to the mindmap. Links must have a from and to field, each containing the `id` of the node to which it's connected. The example below provides one link between `Ben` and `Joe`.

```javascript
var links = [{ _id: 1, from: { _id: 1}, to: { _id:  2} , strength: 10 }];
network.links.data(links, '_id');
```

### network.width(pixels);

Set the canvas width to the given pixels.

### network.height(pixels);

Set the canvas height to the given pixels.

### network.animate();

Starts animating the map. The map checks every second to determine if nodes are still moving, and if they aren't, animation is stopped.

### network.selectNode(id);

Select the node given the specified unique identifier, by default the _id.

### network.deselectNode(id);

Deselect the node.

### network.isLoading(state);

### network.imageAttribute(string)

```javascript
network.imageAttribute('image.url');
```

This displays a loading icon in the middle of the canvas. Useful during the initial loading process. Pass `true` to start the loading animation, and pass `false` to remove the animation.

## Events

### network.on('nodeCreated', function(node){ });
### network.on('nodeSelected', function(node){ });
