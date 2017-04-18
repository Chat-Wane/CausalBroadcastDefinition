'use strict';

/**
 * Exception that rises when protocols do not behave!
 */
class ExProtocol {
    /**
     * @param {string} source The name of the function that threw this
     * exception.
     * @param {string} protocolId The identifier of the protocol that already
     * exists.
     * @param {string} reason The reason of this exception.
     */
    constructor (source, protocolId, reason) {
        this.source = source;
        this.pid = protocolId;
        this.reason = reason;
    };
};

module.exports = ExProtocol;
