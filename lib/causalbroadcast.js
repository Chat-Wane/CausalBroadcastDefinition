'use strict';

const debug = require('debug')('causal-broadcast-definition');
let uuid = require('uuid/v4');
const _ = require('lodash');

const IBroadcast = require('./interfaces/ibroadcast.js');

const ExProtocol = require('./exceptions/exprotocol.js');
const ExMessage = require('./exceptions/exmessage.js');

/**
 * Broadcasting component relying on a peer-sampling protocol. It includes a
 * causality tracking mechanism before delivering messages to the
 * application. This module provides an event-like API to send and receive
 * messages.
 */
class CausalBroadcast {
    /**
     * @param {object} [options = {}] Options to broadcast messages.
     * @param {number} [options.fanout = Infinity] The number of neighbors to
     * broadcast the message.
     * @param {number} [options.delta = Infinity] Time between rounds of
     * anti-entropy.
     * @param {number} [options.retry = 0] Number of attempts to send messages.
     */
    constructor (psp, options = {}) {
        this.options = _.merge( { uid: 'default-causal-broadcast',
                                  fanout: Infinity,
                                  retry: 0,
                                  delta: Infinity}, options);
        // #1 create the table of registered protocols
        this.psp = psp;
        this.protocols = new Map();
        // #2 overload the receipt of messages from the peer-sampling protocol
        // (TODO) maybe a cleaner way ? 
        let __receive = psp._receive;
        psp._receive = (peerId, message) => {
            try {
                __receive.call(psp, peerId, message);
            } catch (e) {
                if (message.type && (message.type === 'MBroadcast' ||
                                     message.type === 'MRequestAntiEntropy' ||
                                     message.type === 'MResponseAntiEntropy') &&
                    message.uid === this.options.uid) {
                    if (this.protocols.has(message.pid)){
                        if (message.type === 'MBroadcast') {
                            this.protocols.get(message.pid)._receive(message);
                        } else if (message.type === 'MRequestAntiEntropy') {
                            this.protocols.get(message.pid)._request(peerId,
                                                                     message);
                        } else if (message.type === 'MResponseAntiEntropy') {
                            this.protocols.get(message.pid)._response(message);
                        };
                    } else {
                        throw new ExProtocol('_receive', message.pid,
                                             'does not exist');
                    };                    
                } else {
                    throw new ExMessage('_receive', message, 'unhandled');
                };
            };
        };
        
        debug('just initialized on top of %s@%s.', this.psp.PID, this.psp.PEER);
    };

    /**
     * Registers the protocol that wishes to use this module.
     * @param {string} protocolId The identifier of the protocol that registers.
     * @param {object} causality The causality tracking structure initialized.
     * @returns {IBroadcast} An interface providing easy-to-use event-like
     * functions to send and receive messages.
     */
    register(protocolId, causality) {
        if (!this.protocols.has(protocolId)) {
            this.protocols.set(protocolId, new IBroadcast(protocolId,
                                                          causality,
                                                          this));
            debug('Protocol %s just registered.', protocolId);
            return this.protocols.get(protocolId);
        } else {
            throw new ExProtocol('register', protocolId, 'already exists');
        };
    };
    
    /**
     * Unregisters the protocol.
     * @param {string} protocolId The identifier of the protocol that
     * unregisters.
     */
    unregister(protocolId) {
        if (this.protocols.has(protocolId)){
            this.protocols.get(protocolId).destroy();
            this.protocols.delete(protocolId);
            debug('Protocol %s just unregistered.', protocolId);
        } else {
            throw new ExProtocol('unregister', protocolId, 'does not exist');
        };
    };
    
};

module.exports = CausalBroadcast;
