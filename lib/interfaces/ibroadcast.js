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
        this.local = causality;
        
        // #1 replace the basic behavior of eventemitter.emit
        this._emit = this.emit;        
        /**
         * Send a message using the emit function.
         * @param {string} event The event name.
         * @param {object[]} [args] The arguments of the event.
         */
        this.emit = (event, ...args) => {
            const neighbors = parent.psp.getPeers(parent.options.fanout);
            // (TODO) return promise
            neighbors.forEach( (peerId) => {
                parent.psp.send(peerId,
                                new MBroadcast(parent.options.uid,
                                               protocolId, event, args),
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


    _start (delay = this.parent.options.delay) {
        this.antientropy = setInterval( () => {
            // (TODO)
        }, delay);
    };

    _stop () {
        clearInterval(this.antientropy);
    };
    
    /**
     * @private Destroy all listeners and remove the send capabilities
     */
    _destroy () {
        this.removeAllListener();
        this.emit = this._emit; // retrieve basic behavior
    };
    
    /**
     * @private Receiving a message that triggers an event
     * @param {MEvent} message The message received.
     */
    _receive (message) {
        // (TODO) add causality
        this._emit(message.event, ...(message.args));
    };

};

module.exports = IBroadcast;
