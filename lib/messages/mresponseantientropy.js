'use strict';


/**
 * Message responding to the AntiEntropy request
 */
class MResponseAntiEntropy {
    /**
     * @param {string} id the identifier of the response message
     * @param {object} causality the causality structure
     * @param {number} nbElements the number of element to send
     * @param {number} element each element to send 
     */
    constructor (id, causality, nbElements = 0, element) {
        this.id = id;
        this.causality = causality;
        this.nbElements = nbElements;
        this.element = element;
        this.elements = [];
        this.type = 'MResponseAntiEntropy';
    };
};

module.exports = MResponseAntiEntropy;
