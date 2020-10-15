// This wierd configuration is there to allow import of this function 
// both on NodeJs server code and Browser client code.

(function(exports) { 
   
    // Function to be exposed 
    function getNgrokURI() { 
        var uri = "7207d407dee7.ngrok.io";

	    return uri;

    } 

	function getProjectListAddress() {
		var address = '0xef900E83976C931391C19C6689E0b04bf2a867F9';

		return address;
	}
   
    // Export the function to exports 
    // In node.js this will be exports  
    // the module.exports 
    // In browser this will be function in 
    // the global object sharedModule 
    exports.getNgrokURI = getNgrokURI;
	exports.getProjectListAddress = getProjectListAddress;
       
})(typeof exports === 'undefined'?  
	this['constants']={}: exports);

