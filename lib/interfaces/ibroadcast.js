'use strict';

const EventEmitter = require('events');

const MBroadcast = require('../messages/mbroadcast.js');

/**
 * An interface providing easy-to-use event-like functions on top of a
 * peer-sampling protocol. As soon as protocols register, they get an
 * interface. They can broadcast messages using broadcast.emit('eventName',
 * args) and neighbors catch them using broadcast.on('eventName', args).
 */
class IBroadcast extends EventEmitter {
    /**
     * @param {string} protocolId The identifier of the protocol that request
     * the interface.
     * @param {object} causality The causality tracking structure.
     * @param {Unicast} parent The instanciator.
     */
    constructor (protocolId, causality, parent) {
        super();
        
        this.parent = parent;
        // #0 initialize causality tracking and buffering of pending messages
        this.causality = causality;
        this.buffer = new Map();
        this.bufferAntiEntropy = null;
        
        // #1 replace the basic behavior of eventemitter.emit
        this._emit = this.emit;        
        /**
         * Send a message using the emit function.
         * @param {string} event The event name.
         * @param {object[]} [args] The arguments of the event.
         */
        this.emit = (event, ...args) => {
            const neighbors = parent.psp.getPeers(parent.options.fanout);
            // (TODO) return promise (resolve if at least one message sent)
            let logicalTimeStamp = this.causality.increment();
            neighbors.forEach( (peerId) => {
                parent.psp.send(peerId,
                                new MBroadcast(parent.options.uid,
                                               protocolId,
                                               event,
                                               logicalTimeStamp,
                                               args),
                                parent.options.retry);
            });
        };
        
        // #2 set anti-entropy rounds and behavior
        this.on('anti-entropy', (peerId, causality) => {
            // (TODO)
            // throw new ExUnImplemented('anti-entropy', peerId, causality);
        });

        this.antientropy = null;
        this._start();
    };

    /**
     * @private Start periodic rounds of anti-entropy.
     * @param {number} delay The time (in milliseconds) between two rounds of
     * anti-entropy.
     */
    _start (delay = this.parent.options.delay) {
        this.antientropy = setInterval( () => {
            // (TODO)
        }, delay);
    };

    /**
     * @private Stop the anti-entropy.
     */ 
    _stop () {
        clearInterval(this.antientropy);
    };
    
    /**
     * @private Destroy all listeners and remove the send capabilities
     */
    _destroy () {
        this.removeAllListener();
        this._stop();
        this.emit = this._emit; // retrieve basic behavior
    };
    
    /**
     * @private Receiving a message that triggers an event
     * @param {MEvent} message The message received.
     */
    _receive (message) {
        if (!this._stopPropagation(message)) {
            this.buffer.set(message.causality, message);
            this._reviewBuffer();
            const peers = this.parent.psp.getPeers(this.parent.options.fanout);
            peers.forEach( (peerId) => {
                // (TODO) then+catch
                this.parent.psp.send(peerId,message,this.parent.options.retry);
            });
            
        };
    };

    /**
     * @private Check if whether or not the message should be propagated to
     * our neighborhood.
     * @param {MBroadcast} message The received broadcast message.
     */
    _stopPropagation (message) {
        return this.causality.isLower(message) ||
            this.buffer.has(message.causality);
    };

    /**
     * @private Go through the buffer of messages and delivers all messages that
     * are ready.
     */
    _reviewBuffer () {
        let restart = false;
        this.buffer.forEach( (message, causality) => {
            if (this.causality.isLower(causality)){
                this.buffer.delete(causality);
            } else {
                if (this.causality.isReady(causality)){
                    restart = true;
                    this.causality.incrementFrom(causality);
                    this.buffer.delete(causality);
                    this._emit(message.event, ...(message.args));
                };
            };
        });
        restart && this._reviewBuffer();
    };
        
        
    
    /**
     * @private Receiving an anti-entropy request
     * @param {string} peerId The identifier of the peer that sent the request.
     * @param {MRequestAntiEntropy} message The message sent.
     */
    _request (peerId, message) {
        
    };

    /**
     * @private Receiving an anti-entropy response
     * @param {MResponseAntiEntropy} message The message received.
     */
    _response (message) {

    };

};

module.exports = IBroadcast;
