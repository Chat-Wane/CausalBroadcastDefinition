'use strict';


/**
 * Message responding to the AntiEntropy request
 */
class MResponseAntiEntropy {
    /**
     * @param id the identifier of the response message
     * @param causality the causality structure
     * @param nbElements the number of element to send
     * @param element each element to send 
     */
    constructor (id, causality, nbElements, element) {
        this.type = 'MResponseAntiEntropy';
        this.id = id;
        this.causality = causality;
        this.nbElements = nbElements;
        this.element = element;
        this.elements = [];
    };
};

module.exports = MResponseAntiEntropy;
