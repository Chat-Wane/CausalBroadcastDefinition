'use strict';

/**
 * Message containing data to broadcast
 */
class MBroadcast {
    /**
     * @param name the name of the protocol, default 'causal'
     * @param id the identifier of the broadcast message
     * @param isReady the identifier(s) that must exist to deliver this message
     * @param payload the broadcasted data
     */
    constructor (name, id, isReady, payload) {
        this.protocol = name;
        this.id = id;
        this.isReady = isReady;
        this.payload = payload;
    };
};

module.exports = MBroadcast;
