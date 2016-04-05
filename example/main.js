
var Spray = require("spray-wrtc");
var CausalBroadcast = require("causal-broadcast-definition");
var VVwE = require("version-vector-with-exceptions");

var opts = {deltatime: 1000*60*1,
            webrtc: {trickle:true}};

var rps1 = new Spray(opts);
var rps2 = new Spray(opts);
var rps3 = new Spray(opts);
var vvwe1 = new VVwE(1);
var vvwe2 = new VVwE(2);
var vvwe3 = new VVwE(3);
var broadcast1 = new CausalBroadcast(rps1,vvwe1);
var broadcast2 = new CausalBroadcast(rps2,vvwe2);
var broadcast3 = new CausalBroadcast(rps3,vvwe3);

// #A establish connection between the peers
var callbacks = function(src, dest){
    return {
        onInitiate: function(offer){
            dest.connection(callbacks(dest, src), offer);
        },
        onAccept: function(offer){
            dest.connection(offer);
        },
        onReady: function(){
            console.log("Connection established");
        }
    };
};

// #1 s1 joins s2 and creates a 2-peers networks
rps1.connection(callbacks(rps1, rps2));
// #2 after a bit, s3 joins the network through s1
setTimeout(function(){
    rps3.connection(callbacks(rps3, rps1));
}, 5000);

// #B receive event log the message
broadcast1.on("receive", function(message){
    console.log('@b1 :' + message);
});

broadcast2.on("receive", function(message){
    console.log('@b2 :' + message);
});

broadcast3.on("receive", function(message){
    console.log('@b3 :' + message);
});

// #C send a message from peer 1 to all other connected peers
setTimeout(function(){
    broadcast1.send("Hi from b1", {_e:1, _c:1})
}, 10000);
