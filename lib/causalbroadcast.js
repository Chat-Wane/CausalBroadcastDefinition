'use strict';

const debug = require('debug')('causal-broadcast-definition');
const _ = require('lodash');
const Unicast = require('unicast-definition');

const IBroadcast = require('./interfaces/ibroadcast.js');

const ExProtocol = require('./exceptions/exprotocol.js');

/**
 * Broadcasting component relying on a peer-sampling protocol. It includes a
 * causality tracking mechanism before delivering messages to the
 * application. This module provides an event-like API to send and receive
 * messages.
 */
class CausalBroadcast extends Unicast {
    /**
     * @param {object} [options = {}] Options to broadcast messages.
     * @param {number} [options.fanout = Infinity] The number of neighbors to
     * broadcast the message.
     * @param {number} []
     */
    constructor (options = {}){
        let opts = _.merge( { fanout: Infinity,
                              retry: 0 }, options);            
        super(opts);
    };

    /**
     * Registers the protocol that wishes to use this module.
     * @param {string} protocolId The identifier of the protocol that registers.
     * @returns {IBroadcast} An interface providing easy-to-use event-like
     * functions to send and receive messages.
     */
    register(protocolId) {
        if (!this.protocols.has(protocolId)) {
            this.protocols.set(protocolId, new IBroadcast(protocolId, this));
            debug('Protocol %s just registered.', protocolId);
            return this.protocols.get(protocolId);
        } else {
            throw new ExProtocol('register', protocolId, 'already exists');
        };
    };
    
    
};

module.exports = CausalBroadcast;
