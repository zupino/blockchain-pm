// This wierd configuration is there to allow import of this function 
// both on NodeJs server code and Browser client code.

(function(exports) { 
   
    // Function to be exposed 
    function getNgrokURI() { 
        var uri = "https://80be20213764.ngrok.io";

	    return uri;

    } 
   
    // Export the function to exports 
    // In node.js this will be exports  
    // the module.exports 
    // In browser this will be function in 
    // the global object sharedModule 
    exports.getNgrokURI = getNgrokURI; 
       
})(typeof exports === 'undefined'?  
	this['constants']={}: exports); 


