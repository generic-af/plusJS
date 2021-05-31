/*
* plus.find plugin 
* http://generic.af
* 
* requires jQuery.js v2.1.3 or higher http://jquery.com/
* tested with jQuery v2.1.3
*
* Copyright 2015 Generic.af 
* Released under the Generic.af Co API license
*
* Date: 2015-06-16 10:07:26 GMT+0430 (Afghanistan Standard Time)
* 
* @author: mushfiqullah.akhundzada@gmail.com
* 
**/
var plus = window.plus = window.plus || {};
(function () {
    plus.find = function (opt) {
        this.opt = opt = opt || {};
        this.el = opt.el;
        this.path = opt.path || this.el.attr('path');
        this.caption = opt.caption || this.el.prevAll('label:first').text();
        this.url = opt.url || plus.config.baseUrl + 'json/pull.asmx/Find';
        this.valueElement = this;

        this.init();

        this.el.addClass('widget').data('widget', this);
        
        //var self = this;
        //$(document).bind('mouseup', function (event) {
        //    if (!self || !self.el) return;
        //    var target = $(event.target), targets = $.makeArray(target.parents().andSelf());
        //    if (targets.indexOf(self.el.get(0)) == -1)
        //        self.check(true);
        //});
    }
    plus.find.prototype = {
        init: function () {
            var self = this;
            this.el.change(function () {
                self.check();
            });
        },
        check: function(key) {
            key = key || this.el.val();
            var self = this;
            var data = this.opt.setArgument ? this.opt.setArgument(key) : {
                key: key
            };
            data.searchCol = self.opt.searchCol || "Name";
            data.path = self.path;
            plus.data.post({
                async: false, data: plus.json.write({ query: data }),
                url: self.url, noLoading: true,
                success: function (msg) {
                    var output = plus.json.read(msg);
                    if (!output.val) {
                        self.el.removeData('dataid');
                        self.el.addClass('invalid');
                        plus.widget.error(self.caption + ' with "' + self.el.val() + "' Code could not be found");
                    } else self.el.data('dataid', output.val);
                }
            });
        },
        val: function (v,t) {
            if (v === null || v == "") this.el.removeData('dataid');
            v = v === undefined ? this.el.data('dataid') : v;
            this.el.data('dataid', v);
            if (t) this.el.val(t);
            return this.el.data('dataid');
        }
    }
})();