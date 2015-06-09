# BoundedBroadcastDefinition

Broadcasting component on top of a communication overlay. It uses a bounded
growing cache to collect the unique identifier of each message. Therefore, if
the cache size is large enough, the messages are broadcast only once per peer in
the network.

## Installation

```
$ npm install bounded-broadcast-definition
```
or
```
$ bower install bounded-broadcast-definition
```

## Usage

The module has been [browserified](http://browserify.org) and
[uglified](https://github.com/mishoo/UglifyJS). To include it within your
browser, put the following line in your html:
```html
  <script src='./build/bounded-broadcast-definition.bundle.js'></script>
  <script src='./build/random-peer-sampling-example.bundle.js'></script>
```

In any case:
```javascript
  var BoundedBroadcast = require('bounded-broadcast-definition');
  var RandomPeerSampling = require('random-peer-sampling-example');

  // #1 initialize the protocols
  rps = new RandomPeerSampling(args1);
  broadcast = new BoundedBroadcast(rps, size);

  // #2 define the receive event of broadcast
  broadcast.on('receive', function(receivedBroadcastMessage){
    console.log('I received the message: ' + receiveBroadcastMessage);
  });

  // #3 send a message to the whole network
  broadcast.send(toBroadcastMessage);
```
