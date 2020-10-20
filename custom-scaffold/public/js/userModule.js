// This wierd configuration is there to allow import of this function 
// both on NodeJs server code and Browser client code.

(function(exports) { 
   
    // Function to be exposed 
    function getUserAddress(userId) { 
        var userAddr = [];

    	// AnaMaria
	    userAddr['557058:7eff0acd-2d33-46d5-9b87-cbead45f3309'] = '0x13936ebf7f8e6420c79764532434a3f7cbdc36eb';
	    // Marco
    	userAddr['557058:d26095ad-03ff-4c8b-886a-0662adc8dbdc'] = '0x2b64e6ff555d41fde621b3062df2aa81a081b33d';

	    return userAddr[userId];

    } 

	// TODO	The hash table should be in the general scope and 
	//		used for both `getUserId()` and `getUserAddress()`
	//		methods, I am currently working on something else 
	//		that requires this, so quickly adding it
	
	function getUserId(address) {
        var userIds = [];
		// debug 
		console.log("[getUserId()] Address being looked up: " + address.toUpperCase());

		// 	Looks weird because also the `x` in `0x` is capitalize, but this simplify the implementation
		//	and address the fact that in different places Ether address have different capitalization

        // AnaMaria
        userIds['0X13936EBF7F8E6420C79764532434A3F7CBDC36EB'] = '557058:7eff0acd-2d33-46d5-9b87-cbead45f3309';
        // Marco
        userIds['0X2B64E6FF555D41FDE621B3062DF2AA81A081B33D'] = '557058:d26095ad-03ff-4c8b-886a-0662adc8dbdc';

        console.log("[getUserId()] returned userId: " + userIds[address.toUpperCase()]);
		console.log("Entire hash table: ");
		console.log(userIds);
		console.log("Type of received parameter `address`: " + typeof(address) );

        return userIds[address.toUpperCase()];

    }

   
    // Export the function to exports 
    // In node.js this will be exports  
    // the module.exports 
    // In browser this will be function in 
    // the global object sharedModule 
    exports.getUserAddress = getUserAddress; 
    exports.getUserId = getUserId;
   
})(typeof exports === 'undefined'?  
	this['userModule']={}: exports); 

