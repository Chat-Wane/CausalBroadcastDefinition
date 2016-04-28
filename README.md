# CausalBroadcastDefinition

Broadcasting component on top of a communication overlay. It includes a
causality tracking mechanism before delivering messages to the application.

## Installation

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
  var delta = 3*60*1000; // interval between the anti-entropy rounds
  broadcast = new CausalBroadcast(rps, cs, myProtocolName, delta);

  // #2 define the receive event of broadcast causally ready
  broadcast.on('receive', function(message){
    console.log('I received the message: ' + message);
  });

  // #3 send a message to the whole network with causality metadata
  broadcast.send(toBroadcastMessage, messageUidCausality, messageUidDepending);

  // #4 it is the responsability of the application to retrieve old missed
  // request by the anti-entropy
  broadcast.on('antiEntropy', function(id,
                                       remoteCausalStruct,
                                       localCausalStruct){
    // #A retrieve the elements between remoteCausalStruct and localCausalStruct
    // #B send it back the causal broadcast
    broadcast.sendAntiEntropyResponse(id, localCausalStruct, elements);
  });
```
