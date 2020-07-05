// This wierd configuration is there to allow import of this function 
// both on NodeJs server code and Browser client code.

(function(exports) { 
   
    // Function to be exposed 
    function getUserAddress(userId) { 
        var userAddr = [];

    	// AnaMaria
	    userAddr['557058:7eff0acd-2d33-46d5-9b87-cbead45f3309'] = '0x4976f1939730eb963c81972811cd57320a064e7c';
	    // Marco
    	userAddr['557058:d26095ad-03ff-4c8b-886a-0662adc8dbdc'] = '0x2b64e6ff555d41fde621b3062df2aa81a081b33d';

	    return userAddr[userId];

    } 
   
    // Export the function to exports 
    // In node.js this will be exports  
    // the module.exports 
    // In browser this will be function in 
    // the global object sharedModule 
    exports.getUserAddress = getUserAddress; 
       
})(typeof exports === 'undefined'?  
	this['userModule']={}: exports); 

