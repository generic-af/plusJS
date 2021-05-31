/*
* @param {}
* requires jQuery.js v2.1.3 or higher http://jquery.com/
* tested with jQuery v2.1.3
*
* Copyright 2015 Khawarsoft 
* Released under the Khawarsoft Co API license
* http://api.plus.af/license
*
* Date: 2015-06-02 23:31:16 GMT+0430 (Afghanistan Standard Time)
* 
* @author: mushfiqullah.akhundzada@gmail.com, reza.khawar@gmail.com
* 
**/

var plus = window.plus = window.plus || {};
(function () {
    var _keyCodes = plus.widget.keyCodes = {
        BACKSPACE: 8,
        COMMA: 188,
        DELETE: 46,
        DOWN: 40,
        END: 35,
        ENTER: 13,
        ESCAPE: 27,
        HOME: 36,
        LEFT: 37,
        PAGE_DOWN: 34,
        PAGE_UP: 33,
        PERIOD: 190,
        RIGHT: 39,
        SPACE: 32,
        TAB: 9,
        UP: 38
    };

    plus.autocomplete = function (opt) {
        this.opt = opt = opt || {};
        this.limit = opt.limit = opt.limit || 10;
        this.selector = opt.selector;
        this.path = opt.path || this.selector.attr('path');
        this.url = opt.url || plus.config.baseUrl + 'json/pull.asmx/Autocomplete';
        this.valueElement = this;
        this.indexes = opt.indexes || {
            id: 0,
            name: 1
        };

        if (!String.prototype["splice"])
            String.prototype.splice = function (i, rem, s) {
                return (this.slice(0, i) + s + this.slice(i + Math.abs(rem)));
            };

        this.templ = opt.templ || '<li dataid="{id}">{name}</li>';
        this.templ = this.templ.splice(this.templ.indexOf('>'), 0, ' sKey="{sValue}"');

        this.el = $('<div class="autocomplete-result-container" id="autocomplete_' + opt.selector.attr('id') + '"></div>').hide();
        this.selector.parents('body').append(this.el);

        this.onSelect = opt.onSelect || $.noop;

        this.ul = $('<ul class="autocomplete-result"></ul>');
        this.ul.appendTo(this.el);
        this.loading = opt.loading || $('<div class="autocomplete-loading"></div>');
        this.loading.appendTo(this.el);
        this.offset = 0;

        // template for li only
        this.init();

        this.selector.addClass('widget').data('widget', this);

        var self = this;
        $(document).bind('mouseup', function (event) {
            if (!self || !self.el) return;
            var target = $(event.target), targets = $.makeArray(target.parents().andSelf());
            if (targets.indexOf(self.el.get(0)) == -1)
                self.clear(true);
        });
    }
    plus.autocomplete.prototype = {
        position: function () {
            var offset = this.selector.offset(), y = offset.top + this.selector.outerHeight(),
                    css = { width: this.selector.innerWidth() };
            css.top = y + 'px';
            
            css.left = (offset.left);

            this.el.css(css);
        },
        val: function (v, t) {
            if (v===null || v=="")this.selector.val('');
            v = v === undefined ? this.selector.data('dataid') : v;
            this.selector.data('dataid', v);
            if (t) this.selector.val(t);
            return v;
        },
        clear: function (hide) {
            this.el.find('li').remove();
            //this.selector.removeData('dataid');
            if (hide) this.el.hide();
            this.offset = 0;
        },
        init: function () {
            var self = this, cookie = {};
            this.el.hide();
            this.el.bind('click', function (event) {
                var target = $(event.target);
                if (!target.is('li') && target.parents('li').size())
                    target = target.parents('li:last');
                if (!target.is('li'))
                    return;
                self.selector.val(target.text()).removeClass('invalid');
                self.selector.data('dataid', target.attr('dataid'))
                self.el.hide();
                self.onSelect();
            });
            this.selector.bind({
                'focus': function () {
                    self.prevVal = self.selector.val();
                    self.el.removeData("cookies");
                    self.offset = 0;
                    self.el.hide();
                },
                // navigations
                'keydown': function (e) {
                    var carCode = e.keyCode || e.charCode;
                    if (carCode == _keyCodes.ENTER ) {
                        if (!self.opt.appendable)
                            $((self.el.find('li.focus').get(0) || self.el.find('li:first').get(0))).trigger('click');
                        self.onSelect();
                        return false;
                    }
                    if (carCode == 113 || carCode == _keyCodes.TAB) {
                        if (!self.opt.appendable)
                            self.clear(true);
                        self.el.hide();
                        return true;
                    }
                    if (carCode == _keyCodes.BACKSPACE) {
                        // clear data
                        self.selector.removeData('dataid');
                    }
                    if (carCode == _keyCodes.DOWN && self.el.css('display') == 'block') {
                        if (!self.el.find('li:first').size()) return true;
                        var fEl = $.or(self.el.find('li.focus').nextAll(':visible:first'), self.el.find('li:first'));
                        self.el.find('li.focus').removeClass('focus');
                        fEl.addClass('focus');
                    }
                    if (carCode == _keyCodes.UP && self.el.css('display') == 'block') {
                        if (!self.el.find('li:first').size())
                            return true;
                        
                        var fEl = $.or(self.el.find('li.focus').prevAll(':visible:first'), self.el.find('li:first'));
                        self.el.find('li.focus').removeClass('focus');
                        fEl.addClass('focus');
                    }
                },
                // filter
                'keyup': function (e) {
                    self.position();
                    self.el.show();

                    var carCode = e.keyCode || e.charCode;
                    if (carCode == _keyCodes.ESCAPE) {
                        self.selector.val(self.prevVal);
                        return true;
                    }
                    if (Array.indexOf([113, _keyCodes.TAB, _keyCodes.UP, _keyCodes.DOWN, _keyCodes.LEFT, _keyCodes.RIGHT], carCode) > -1)
                        return true;
                    if (carCode == _keyCodes.ENTER && !self.el.find('li').size() && !self.opt.appendable)
                        return $(this).val('');
                    if (carCode == _keyCodes.ENTER && !self.opt.appendable) {
                        var fEl = self.el.find('li.focus');
                        if (fEl.size())
                            fEl.click();
                        self.clear(true);
                        //self.el.hide();
                        return true;
                    }
                    function doOnWait(v) {
                        setTimeout(function () {
                            if (v == self.selector.val())
                                self.filter((carCode == _keyCodes.BACKSPACE));
                        }, 1000)
                    }
                    doOnWait($(this).val());
                },
                'past': function () {
                    self.position();
                    self.el.show();
                    self.filter();
                }
            });
        },
        filter: function (clear, append) {
            var self = this, key = self.selector.val();
            if (key === "")
                this.clear(true);
            if (!append)
                this.ul.find('li:not([sKey' + (self.opt.like ? '*' : self.opt.reverse ? '$' : '^') + '="' + key + '"])').hide();
            if (clear)
                this.ul.find('li[sKey' + (self.opt.like ? '*' : self.opt.reverse ? '$' : '^') + '="' + key + '"]').show();
            //show hidden li
            var count = this.ul.find('> :visible').length;
            // exit if user presses backspace
            if (clear && count > this.opt.limit)
                return;

            var cookie = this.el.data('cookie') || {};

            this.loading.show();
            // get data
            if (this.url instanceof Function) {
                this.url(self, key)
            } else {
                var data = this.opt.setArgument ? this.opt.setArgument(key) : {
                    key: key
                };
                data.searchCol = self.opt.searchCol || "Name";
                // add limit and Offset
                data.offset = count + 1;
                data.limit = self.limit;
                data.fn = self.opt.like ? "like" : self.opt.reverse ? "endswith" : "startswith";
                data.path = self.path;
                self.ts = (new Date()).getTime();
                var queries = { queries: [data] };
                if (self.proc && self.proc.abort) self.proc.abort();
                self.proc = plus.data.post({
                    async: true, data: plus.json.write(queries),
                    url: self.url, noLoading:true,
                    success: function (msg) {
                        var output = plus.json.read(msg);
                        if (output instanceof Array && output.length === 1 && output[0].rows) output = output[0];
                        if (output instanceof Array)
                            cookie[key] = output;
                        else
                            cookie[key] = output.rows;

                        cookie[key] = cookie[key] || [];
                        if (cookie && cookie[key]) {
                            createNodes(cookie[key], key, sb = []);
                            self.loading.hide();
                            self.ul.append(sb.join(''));
                            self.ul.show();
                        } else
                            self.el.hide();
                    }
                });
                this.el.data('cookie', cookie);
            }
            //cookie = this.el.data('cookie') || {};
            //cookie[key] = cookie[key] || [];
            //if (cookie && cookie[key]) {
            //    createNodes(cookie[key], key, sb = []);
            //    this.loading.hide();
            //    this.ul.append(sb.join(''));
            //    this.ul.show();
            //} else
            //    this.el.hide();

            return true;
            /*
             * function
             **/
            //var createNodes = self.opt.createNode ||
            function createNodes(rows, key, sb) {
                if (!$.isArray(rows[0]))
                    rows = [rows];
                for (var i = 0/*self.ul.find('> *').length*/; i < rows.length; i++) {
                    var row = rows[i], item = self.templ;
                    if (!row[0]) continue;

                    item = plus.util.format(item, row, self.indexes);
                    sb.push(item)
                };
            }

        }
    }
})();