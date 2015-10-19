var EventEmitter = require('events').EventEmitter;
var util = require('util');
var GUID = require('./guid.js');

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
    this.deltaAntiEntropy = 1000*60*1/6; // (TODO) configurable 10s is too often
    this.unicast = new Unicast(this.source, this.name+'-unicast');

    // buffer of operations
    this.buffer = []; 
    // buffer of anti-entropy messages (chunkified because of large size)
    this.bufferAntiEntropy = new MAntiEntropyResponse('init');
    
    var self = this;
    this.source.on(self.name+'-broadcast-receive', function(socket, message){
        self.receiveBroadcast(message);
    });
    this.unicast.on('receive', function(socket, message){
        self.receiveUnicast(socket, message);
    });
    setInterval(function(){
        self.unicast.send(new MAntiEntropyRequest(self.causality));
    }, this.deltaAntiEntropy);
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
    var mBroadcast = new MBroadcast(this.name, id || GUID(), isReady, message);
    // #2 register the message in the structure
    this.causality.incrementFrom(id);
    // #3 send the message to the neighborhood
    for (var i = 0; i < links.length; ++i){
        if (links[i].connected &&
            links[i]._channel && links[i]._channel.readyState==='open'){
            links[i].send(mBroadcast);
        };
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
        var id = GUID();
        // #1 metadata of the antientropy response       
        this.unicast.send(new MAntiEntropyResponse(id,
                                                   causalityAtReceipt,
                                                   messages.length));
        
        for (var i = 0; i < messages.length; ++i){
            this.unicast.send(
                new MAntiEntropyResponse(id, null, messages.length, messages[i]),
                socket);
        };
    };

/*!
 * \brief receive a broadcast message
 * \param message the received message
 */
CausalBroadcast.prototype.receiveBroadcast = function(message){
    var id = message.id,
        isReady = message.isReady;

    if (!this.stopPropagation(message)){
        // #1 register the operation
        this.buffer.push(message);
        // #2 deliver
        this.reviewBuffer();
        // #3 rebroadcast
        var links = this.source.getPeers(Number.MAX_VALUE);
        for (var i = 0; i < links.length; ++i){
            if (links[i].connected &&
                links[i]._channel && links[i]._channel.readyState==='open'){
                links[i].send(message);
            };
        };
    };
};

/*!
 * \brief go through the buffer of messages and delivers all
 * ready operations
 */
CausalBroadcast.prototype.reviewBuffer = function(){
    var found = false,
        i = this.buffer.length - 1;
    while(i>=0){
        var message = this.buffer[i];
        if (this.causality.isLower(message.id)){
            this.buffer.splice(i, 1);
        } else {
            if (this.causality.isReady(message.isReady)){
                found = true;
                this.causality.incrementFrom(message.id);
                this.buffer.splice(i, 1);
                this.emit('receive', message.payload);
            };
        };
        --i;
    };
    if (found){ this.reviewBuffer();  };
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
        this.emit('antiEntropy',
                  socket, message.causality, this.causality.clone());
        break;
    case 'MAntiEntropyResponse':
        // #A replace the buffered message
        if (this.bufferAntiEntropy.id !== message.id){
            this.bufferAntiEntropy = message;
        };
        // #B add the new element to the buffer        
        if (message.element){
            this.bufferAntiEntropy.elements.push(message.element);
        };
        // #C add causality metadata
        if (message.causality){
            this.bufferAntiEntropy.causality = message.causality;
        };
        // #D the buffered message is fully arrived, deliver
        if (this.bufferAntiEntropy.elements.length ===
            this.bufferAntiEntropy.nbElements){
            // #1 considere each message in the response independantly
            for (var i = 0; i<this.bufferAntiEntropy.elements.length; ++i){
                var element = this.bufferAntiEntropy.elements[i];
                // #2 only check if the message has not been received yet
                if (!this.stopPropagation(element)){
                    this.causality.incrementFrom(element.id);
                    this.emit('receive', element.payload);
                };
            };
            // #3 merge causality structures
            this.causality.merge(this.bufferAntiEntropy.causality);
        };
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
    return this.causality.isLower(message.id) ||
        this.bufferIndexOf(message.id)>=0;
};

/*!
 * \brief get the index in the buffer of the message identified by id
 * \param id the identifier to search
 * \return the index of the message in the buffer, -1 if not found
 */
CausalBroadcast.prototype.bufferIndexOf = function(id){
    var found = false,
        index = -1,
        i = 0;
    while (!found && i<this.buffer.length){
        // (TODO) fix uglyness
        if (JSON.stringify(this.buffer[i].id) === JSON.stringify(id)){ 
            found = true; index = i;
        };
        ++i
    };
    return index;
};

module.exports = CausalBroadcast;
