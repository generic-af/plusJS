
var plus = window.plus = window.plus || {};
var json = plus.json;
(function () {
    plus.treeselector = function (source, opt) {
        this.opt = opt || {};
        this.source = source;
        plus.api.avail('treeview');
        this.el = opt.el;
        //this.selector = $('<div class="tree border">').appendTo(this.el.parents('.page')).hide();
        this.selector = $('<div class="tree border">').appendTo(this.el.parents('body')).hide();

        var tree = this.treeview = new plus.treeview(source, $.extend($.extend({}, opt), { el: this.selector }));
        tree.el.bind("select", { self: this }, $.proxy(this.onSelectProxy, this));

        this.el.data("widget", this).prop('readonly', !opt.autocomplete)
            .addClass('widget').bind(
        {
            'click': $.proxy(function () {
                ////var offset = this.el.offset(), y = offset.top + this.el.height(),
                ////    css = { "top": y + "px" };

                ////css.left = offset.left + "px";

                ////// If the bottom is below the screen
                ////if (y + this.selector.height() > $(window).scrollTop() + $(window).height()) {
                ////    css.top = $(window).scrollTop();
                ////    this.selector.height($(window).height() - 10);
                ////}

                var offset = this.el.offset(), y = offset.top + this.el.height(),
                    css = { "top": (y ) + "px" };

                css.left = offset.left - (this.opt.dir === 'ltr' ?
                    0 : this.selector.width() - this.el.width() - 10) + "px";

                // If the bottom is below the screen
                if (y + this.selector.height() > $(window).scrollTop() + $(window).height()) {
                    css.top = $(window).scrollTop();
                    var sHeight = this.selector.height();
                    if (sHeight > $(window).height() - 10)
                        this.selector.height($(window).height() - 10);
                    else if ((y - sHeight - this.el.height()) > $(window).scrollTop())
                        css.top = y - sHeight - this.el.height();

                }
                var self = this;
                //$.resolveOrCreate($('#Cover', this.selector.parents('body')), function () { return $('<div id="Cover"></div>').appendTo(self.selector.parents('body')) }).fadeIn('slow');
                this.selector.css(css).show();

                // Close tree picker if clicked elsewhere.
                closeOnClickOutside(this.selector);

                function closeOnClickOutside(selector) {
                    selector.parents('body').one('mousedown', function (event) {
                        var target = $(event.target), targets = $.makeArray(target.parents().andSelf());
                        if (targets.indexOf(selector.get(0)) == -1)
                            selector.hide() && $('#Cover', selector.parents('body')).fadeOut('slow');
                        else
                            // Does not work in IE8 without the timeout
                            setTimeout(function () { closeOnClickOutside(selector); }, 20);
                    });
                }

            }, this),

            'keydown': $.proxy(function (e) {
                if (this.opt.autocomplete)
                    this.selector.hide() && $('#Cover', this.selector.parents('body')).fadeOut('slow');
                else {
                    switch (e.keyCode) {
                        case 27: // esc 
                        case 9: // tab
                            this.selector.hide();
                            //$('#Cover', this.selector.parents('body')).fadeOut('slow');
                            break;
                        case 8: case 46:  // backspace or del
                            this.onSelect(null);
                            return false;
                            break;
                        case 40:  // arrow down
                            this.el.click();
                            break;
                    }
                }
            }, this),

            'focus': $.proxy(function () { this.el.click(); }, this)
        });
    }

    plus.treeselector.prototype.val = function (v,t) {
        var result = this.treeview.val(v);
        //try {
            if (v !== undefined && !this.opt.autocomplete)
                this.el.val(this.treeview[this.opt.label == 'path' ? 'labelPath' : 'label'](this.treeview.selected)).trigger('change');
        //} catch (ex) {
        //    console.log(ex);
        //}

        //if (!result) {
        //    this.el.val(t);
        //    this.el.data('val', v);
        //    result = v;
        //}

        return result;
    };

    plus.treeselector.prototype.load = function () {
        this.treeview.load(true);
        this.onSelect(this.val());
    };

    plus.treeselector.prototype.onSelectProxy = function (event, path) {
        var self = event.data.self.onSelect(path);
        event.isImmediatePropagationStopped = event.isPropagationStopped = function () { return true; };
    }

    plus.treeselector.prototype.onSelect = function (v) {
        if (this.opt.leavesOnly && this.treeview.hasChildren(v)) return;
        //if (v != null) v = v - 0; 

        this.treeview.val(v);
        if (this.opt.autocomplete && this.opt.autocomplete.val)
            this.opt.autocomplete.val(v);
        else {
            //this.selected = v;

            var s = this.treeview[this.opt.label == 'path' ? 'labelPath' : 'label'](v);

            s = s || '';
            this.el.val(s).trigger('change')//.change();
        }
        this.selector.hide();
        //$('#Cover', this.selector.parents('body')).fadeOut('slow')
    }

    plus.treeselector.prototype.remove = function (id) {
        this.treeview.el.find('li[dataid=' + id + ']').remove();
    };

})();