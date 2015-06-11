# CausalBroadcastDefinition

Broadcasting component on top of a communication overlay. It includes a
causality tracking mechanism before delivering messages to the application.

## Installation (NOT Released yet)

```
$ npm install causal-broadcast-definition
```
or
```
$ bower install causal-broadcast-definition
```

## Usage

The module has been [browserified](http://browserify.org) and
[uglified](https://github.com/mishoo/UglifyJS). To include it within your
browser, put the following line in your html:
```html
  <script src='./build/causal-broadcast-definition.bundle.js'></script>
  <script src='./build/random-peer-sampling-example.bundle.js'></script>
  <script src='./build/causal-struct-example.bundle.js'><script>
```

In any case:
```javascript
  var CausalBroadcast = require('causal-broadcast-definition');
  var RandomPeerSampling = require('random-peer-sampling-example');
  var CausalStruct = require('causal-struct-example');
  
  // #1 initialize the protocols
  var rps = new RandomPeerSampling(args1);
  var cs = new CausalStruct(args2);
  broadcast = new CausalBroadcast(rps, cs, myProtocolName);

  // #2 define the receive event of broadcast causally ready
  broadcast.on('receive', function(receivedBroadcastMessage){
    console.log('I received the message: ' + receiveBroadcastMessage);
  });

  // #3 send a message to the whole network with causality metadata
  broadcast.send(toBroadcastMessage, messageUidCausality, messageUidDepending);
```
