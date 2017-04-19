'use strict';

/**
 * Message that requests an anti-entropy round, i.e., it asks for its missing
 * messages.
 */
class MRequestAntiEntropy {
    /**
     * @param {object} causality The causality tracking structure at given time.
     */
    constructor (causality) {    
        this.causality = causality;
        this.type = 'MRequestAntiEntropy';
    };
};

module.exports = MRequestAntiEntropy;
