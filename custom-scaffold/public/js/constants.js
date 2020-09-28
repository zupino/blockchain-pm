// This wierd configuration is there to allow import of this function 
// both on NodeJs server code and Browser client code.

(function(exports) { 
   
    // Function to be exposed 
    function getNgrokURI() { 
        var uri = "7207d407dee7.ngrok.io";

	    return uri;

    } 

	function getProjectListAddress() {
		var address = '0xA498730423825C107497E491b6C8Bca67BF65e0B';

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

