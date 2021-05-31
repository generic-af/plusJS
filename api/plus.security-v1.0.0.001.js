/*
* plus.security plugin
* http://Generic.af
* 
* requires jQuery.js v2.1.3 or higher http://jquery.com/
* tested with jQuery v2.1.3
*
* Copyright 2015 Generic.af 
* Released under the Generic.af Co API license
*
* Date: 2015-06-02 23:31:16 GMT+0430 (Afghanistan Standard Time)
* 
* @author: mushfiqullah.akhundzada@gmail.com
* 
**/
var plus = window.plus = window.plus || {};
var json = plus.json;
(function () {
    var securityUrl = function () { return plus.config.baseUrl + "security/service/"; }
	plus.security = {
	    authenticate: function (opt) {
	        var f = opt.success || $.noop;
	        return authenticate(opt.username, opt.password, opt.securitycode);
			function authenticate(username, password, secondary) {
			    plus.data.post({
			        url: securityUrl() + 'Authentication.asmx/Authenticate',
			        data: plus.json.write({ username: username, password: password, securityCode: secondary }),
			        success: function (msg) {
			            var output = plus.json.read(msg);
			            if (output.error) plus.widget.error(output.error);
			            else f(output);
			            if (output != "Authorized") window.location.href = output + window.location.hash;
			        }
			    });
			}
	    },
	    innerlogin: function () {

	    },
		Authorize: function (silent, callback) {
		    plus.data.post({
		        url: securityUrl() + 'Authorization.asmx/Authorize',
		        success: function (msg) {
		            var output = plus.json.read(msg);
		            if (output != "Authorized" && !silent) window.location.href = output + window.location.hash;
		            if (callback) plus.util.invoke(callback, null, output);
		        }
		    });
		},
		AuthorizeScreen: function (path) {
		    var data = plus.json.write({ path: path });
		    plus.data.post({
		        url: securityUrl() + 'Authorization.asmx/AuthorizeScreen', data: data,
		        success: function (msg) {
		            var output = plus.json.read(msg);
		            
		            if (output != "Authorized") window.location.href = output + window.location.hash;
		        }
		    });
		}, getScreen: function (name, success) {
		    plus.data.post({
		        url: securityUrl() + 'Authorization.asmx/GetScreen', data: plus.json.write({ name: name }),
		        success: function (msg) {
		            output = plus.json.read(msg);
		            success(output.path);
		        }
		    });
		},
		getSubScreen: function (path) {
            var output = [];
            var data = plus.json.write({ path : path});
		    plus.data.post({ async:false,
		        url: securityUrl() + 'Authorization.asmx/GetSubScreen', data: data,
		        success: function (msg) {
		            output = plus.json.read(msg);
                    if (typeof output == "string" && output.contains("http"))
                        window.location.href = output + window.location.hash;
		        }
		    });
		    return output;
		}
        , getDetail: function (key) {
            var output = "";
            var data = plus.json.write({ opt:key });
		    plus.data.post({ async:false,
		        url: securityUrl() + 'Authentication.asmx/GetDetail', data: data,
		        success: function (msg) {
		            output = plus.json.read(msg);
		            if (typeof output == "string" && output.contains("http"))
		                window.location.href = output + window.location.hash;
		        }
		    });
		    return output;
        }
	}
})();