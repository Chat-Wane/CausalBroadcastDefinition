
/*!
 * \brief message containing data to broadcast
 * \param name the name of the protocol, default 'causal'
 * \param id the identifier of the broadcast message
 * \param isReady the identifier(s) that must exist to deliver this message
 * \param payload the broadcasted data
 */
function MBroadcast(name, id, isReady, payload){
    this.protocol = name;
    this.id = id;
    this.isReady = isReady;
    this.payload = payload;
};
module.exports.MBroadcast = MBroadcast;

/*!
 * \brief message that request an AntiEntropy 
 * \param causality the causality structure
 */
function MAntiEntropyRequest(name, causality){
    this.type = 'MAntiEntropyRequest';
    this.protocol = name;
    this.causality = causality;
};
module.exports.MAntiEntropyRequest = MAntiEntropyRequest;

/*!
 * \brief message responding to the AntiEntropy request
 * \param id the identifier of the response message
 * \param causality the causality structure
 * \param nbElements the number of element to send
 * \param element each element to send 
 */
function MAntiEntropyResponse(name, id, causality, nbElements, element){
    this.type = 'MAntiEntropyResponse';
    this.id = id;
    this.causality = causality;
    this.protocol = name;
    this.nbElements = nbElements;
    this.element = element;
    this.elements = [];
};
module.exports.MAntiEntropyResponse = MAntiEntropyResponse;

