/*
* plus.Observers plugin
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
(function () {
    plus.Observers = function () {
        this._observers = {}; // collection of observers {"after load": [], ...}
    }
    plus.Observers.prototype = {
        add: function (event, owner, fn) {
            // Initialize observers for the given event
            var observers = this._observers[event];
            if (!observers) {
                observers = this._observers[event] = [];
            }

            // Support a two argument call: add(event, fn)
            if (arguments.length === 2) {
                fn = owner;
                owner = undefined;
            }
            fn.owner = owner;
            observers.push(fn);
            return fn;
        },
        remove: function (event, fn) {
            if (typeof event === "function") {
                fn = event;
                for (var key in this._observers) {
                    Array.remove(this._observers[key], fn);
                }
            }
            else {
                var observers = this._observers[event];
                if (!observers) return;
                if (fn) {
                    Array.remove(observers, fn);
                }
                else {
                    this._observers[event] = [];
                }
            }
        },
        removeByOwner: function (owner) {
            for (var key in this._observers) {
                Array.removeIf(this._observers[key], function (fn) {
                    return fn.owner === owner;
                });
            }
        },
        notify: function (event /*, args */) {
            var observers = this._observers[event];
            if (!observers) return;
            var args = $.makeArray(arguments).slice(1);
            for (var i = 0, len = observers.length; i < len; i++) {
                if (observers[i].apply(null, args) === false) return false;
            }
        }
    }
})();