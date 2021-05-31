/*
* plus.addable plugin 
* http://asanwazifa.com
* 
* requires jQuery.js v2.1.3 or higher http://jquery.com/
* tested with jQuery v2.1.3
*
* Copyright 2015 Khawarsoft business and trade limited liability corporation
* Released under the Khawarsoft Co API license
* http://api.asanwazifa.com/license
*
* Date: 2015-06-16 10:07:26 GMT+0430 (Afghanistan Standard Time)
* 
* @author: mushfiqullah.akhundzada@gmail.com, reza.khawar@gmail.com
* 
**/
var plus = window.plus = window.plus || {};
(function () {
    plus.addable = function (opt) {
        this.opt = opt = opt || {};
        this.el = opt.el;
        this.id = "addable_" + (new Date()).getTime();

    }

    plus.addable.prototype = {
        init: function () {
            if (!this.el) {

            }

            function prepare() {

            }
        }
    }

})();