'use strict';

/**
 * Message containing data to broadcast.
 */
class MBroadcast {
    /**
     * @param {string} broadcastId The unique identifier of the broadcast
     * mecanism.
     * @param {string} protocolId The identifier of the protocol that broadcast
     * a message.
     * @param {string} eventName The name of the event that will trigger by
     * those who receive the message. It triggers only once per message -- even
     * if it is received multiple times. It triggers if the causality metadata
     * are ready, otherwise the message is buffered until it is ready.
     * @param {object} causality The causality tracking metadata that must be
     * ready for the message to be delivered.
     * @param {object[]} args The arguments of the event.
     */
    constructor (broadcastId, protocolId, eventName, causality, args) {
        this.uid = broadcastId;
        this.pid = protocolId;
        this.event = eventName;
        this.causality = causality;
        this.args = args;
        this.type = 'MBroadcast';
    };
};

module.exports = MBroadcast;
