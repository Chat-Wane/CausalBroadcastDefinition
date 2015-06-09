var EventEmitter = require('events').EventEmitter;
var util = require('util');

var MBroadcast = require('./messages').MBroadcast;
var MAntiEntropyRequest = require('./messages.js').MAntiEntropyRequest;
var MAntiEntropyResponse = require('./messages.js').MAntiEntropyResponse;

var Unicast = require('unicast-definition');

util.inherits(CausalBroadcast, EventEmitter);

/*!
 * It takes a unique value for peer and a counter to distinguish a message. It
 * emits 'receive' event when the message is considered ready
 * \param source the protocol receiving the messages
 * \param causality the causality tracking structure
 */
function CausalBroadcast(source, causality, name) {
    EventEmitter.call(this);
    this.name = name || 'causal';
    this.source = source;
    this.causality = causality;
    this.unicast = new Unicast(this.source, this.name+'-unicast');
    
    this.buffer = [];
    
    var self = this;
    this.source.on(self.name+'-broadcast-receive', function(socket, message){
        self.receiveBroadcast(message);
    });
    this.unicast.on('receive', function(socket, message){
        self.receiveUnicast(socket, message);
    });
};

/*!
 * \brief broadcast the message to all participants
 * \param message the message to broadcast
 * \param id the id of the message
 * \param isReady the id(s) that must exist to deliver the message
 */
CausalBroadcast.prototype.send = function(message, id, isReady){
    // #1 get the neighborhood and create the message
    var links = this.source.getPeers(Number.MAX_VALUE);
    var mBroadcast = new MBroadcast(this.name, id, isReady, message);
    // #2 register the message in the structure
    this.causality.incrementFrom(id);
    // #3 send the message to the neighborhood
    for (var i = 0; i < links.length; ++i){
        if (links[i].connected){ links[i].send(mBroadcast); };
    };
};

/*!
 * \brief answers to an antientropy request message with the missing elements
 * \param socket the origin of the request
 * \param causalityAtReceipt the local causality structure when the message was
 * received
 * \param messages the missing messages
 */ 
CausalBroadcast.prototype.sendAntiEntropyResponse =
    function(socket, causalityAtReceipt, messages){
        socket.send(new MAntiEntropyResponse(causalityAtReceipt, messages));
    };

/*!
 * \brief receive a broadcast message
 * \param message the received message
 */
CausalBroadcast.prototype.receive = function(message){
    if (!this.stopPropagation(message)){        
        // #1 register the message
        this.index = (this.index+1)%this.max;
        this.cache[this.index] = id;
        // #2 emit the receive event with the contained message
        this.emit('receive', message.payload);
        // #3 rebroadcast
        var links = this.source.getPeers(Number.MAX_VALUE);
        for (var i = 0; i < links.length; ++i){
            if (links[i].connected){ links[i].send(message)};
        };
    };
};

/*!
 * \brief receive a unicast message, i.e., either an antientropy request or an
 * antientropy response
 * \brief socket the origin of the message
 * \brief message the message received 
 */
CausalBroadcast.prototype.receiveUnicast = function(socket, message){
    switch (message.type){
    case 'MAntiEntropyRequest':
        this.emit('antiEntropyRequest',
                  socket, message.causality, this.causality); // (TODO) clone
        break;
    case 'MAntiEntropyResponse':
        // (TODO)
        // #1 considere each message in the response independantly
        // #2 merge causality structures
        break;
    };
};

/*!
 * \brief gets called when a broadcast message reaches this node.  this
 * function evaluates if the node should propagate the message further or if it
 * should stop sending it.
 * \param message a broadcast message
 * \return true if the message is already known, false otherwise
 */
CausalBroadcast.prototype.stopPropagation = function (message) {
    var stop = false;
    
//    if (this.causality.isLower(message.id)) (TODO)
    var found = false, i = this.index;
    // #1 circle into the array until one turn has been done or the element
    // has been found
    while (!found &&
           (i>=0 && i<this.cache.length) &&
           (i!==((this.index+1)%this.max))){
        if (this.cache[i]===message.id){ found = true; };
        i = (i-1)%this.max;
    };
    // #2 if not found, register the message in order to drop it next time
    if (!found){
        this.index = (this.index+1)%this.max;
        this.cache[this.index] = message.id;
    };
    return found;
};

module.exports = CausalBroadcast;
