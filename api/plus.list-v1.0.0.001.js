/*
* plus.list plugin
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
    /*
    * TODO: Implementation of Observer Pattern to notify observers of master on state change of each item...
    *
    **/
    plus.list = function (/*source,*/ opt) {
        this.opt = opt = opt || {};
        this.el = opt.el || $('body');
        //this.source = source;
        this.limit = opt.limit || 10; // {0: unlimited}
        this.offset = opt.offset || 0; // incase user specifies offset...
        this.loader = opt.loader || $(''); // a loading bar or something specified by user...
        this.indexes = opt.indexes || {id:0};
        this.state = 'idle';
        this.id = 'list_' + (new Date()).getTime(); // list_############# e.g. list_1441872805426 (unique id)
        // template of a single item in list
        this.callbacks = opt.callbacks || {}; /* { "init": [], initiated: [], loading:[], load: [], itemCreating:[], itemCreated:[]} */
        // get template
        this.templ = plus.templ.get(opt.templ);
        /* Prepare template for use
        *  - wrap it inside an empty div to get full html with tag
        *  - add required attributes
        **/
        if (this.templ instanceof jQuery === false) this.templ = $(this.templ);
        this.templ.attr('rowid', '{id}'); // to be set on item rendering
        this.templ.attr('owner', this.id); // we may use this on item click, a single item may have nested grids/widgets all of which have rowid attribute in their items...
        this.templ = this.templ.wrap($('<div></div>')).parent().html(); // get full html with tags.
        this.rowsbuffer = {};
        this.selctedIndex = -1;
        // implement observers unless user does not want dependencies
        this.observers = opt.noObserver ? null : plus.api.construct("Observers");
        //////////////////////////////////////////////////////////////////////////////
        this.shiftDown = false;

        this.init();
        if (!opt.noFetch)
            this.fetch();
    }
    plus.list.prototype = {
        constructor: plus.list,
        init: function () {
            var self = this;
            this.runCallback('init', self);
            this.buildQuery = this.opt.buildQuery || function () {
                var query = {};
                query.limit = self.limit;
                query.screen = this.opt.screen || plus.page.prototype.deserialize().path;
                query.offset = self.offset;
                query.sort = self.opt.sorter || 'Sorter';
                //query.source = self.source.path || self.source;
                var filter = self.opt.filter;
                if (filter) {
                    if (filter instanceof Function)
                        filter(query, self)
                    else query.filter = filter;
                }
                return { queries: [query] };//{query: query};
            }
            
            // bind click
            // we do not unbind 
            this.el.addClass('widget').data('widget', this).bind('click', function (event) {
                event.bubbles = false;
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation()
                self.shiftDown = event.altKey;
                var target = $(event.target), item = target, owner = target.attr('owner');
                if (owner === undefined) {
                    item = target.parents('[owner]:first');
                    owner = item.attr('owner');
                }
                if (owner === undefined || owner !== self.id) return;
                
                var collect = {id: item.attr('rowid')}; // an object used to collect user input on condition... User may exit item click on condition
                self.runCallback('itemClicking', target, collect);
                if (collect.exit) return false;
                //self.selectedValue = target.attr('rowid');
                //self.selectedIndex = target.index();
                self.runCallback('itemClicked', target, item.attr('rowid'));
                self.select(item.attr('rowid'));
                //self.observers.notify("indexchanged");
                event.preventDefault();
            });

            this.runCallback('initiated', self);
            if (this.observers) this.observers.notify("after init");
            // bind scroll
            if (self.opt.limit === 0) return;
            
            if (self.opt.scrollOnPage) {
                // mostly when list container is the page itself
                $(window).scroll(function () {
                    if ($(window).scrollTop() + $(window).height() == $(document).height()) {
                        self.fetch();
                    }
                });
            } else {
                var scroller = self.opt.scroller || self.el;
                //scroller.scrollTop(0); alert(1);
                scroller.unbind('scroll').bind('scroll', function () {
                    //console.log(' {$(this).scrollTop: ' + $(this).scrollTop() + ' , $(this).innerHeight(): ' + $(this).outerHeight() + ', $(this)[0].scrollHeight: ' + $(this)[0].scrollHeight);
                    
                    if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight -1) {
                        self.fetch();
                    }
                });
            }
        },
        find:function(id) {
            return this.el.find('[owner=' + this.id + '][rowid=' + id + ']');
        },
        rowOf: function(id) {
            return this.rowsbuffer[id];
        },
        update: function (row) {
            var _urlDeserialized = plus.page.prototype.deserialize();
            var screen = _urlDeserialized.subpath ? _urlDeserialized.subpath : _urlDeserialized.path;

            if (!isNaN(row)) return this.fetch(function (self) { return { queries: [{ path: self.opt.path, filter: [{ ID: row }], screen: screen }] } }, true);
            this.rowsbuffer[row[0]] = row;
            var item = this.el.find('[owner=' + this.id + '][rowid=' + row[0] + ']').addClass('selected');
            item.after(plus.util.format(this.templ, row, this.indexes));
            item.next().addClass('selected');
            item.remove();
        },
        select: function (id, silent) {
            this.el.find('.selected').removeClass('selected');
            var item = this.el.find('[owner=' + this.id + '][rowid="' + id + '"]').addClass('selected');
            this.selectedIndex = item.index();
            this.selectedValue = id;
            if (!silent)
                this.observers.notify("indexchanged");
            // scroll to position
        },
        add: function (row, select) {
            if (this.rowsbuffer[row[0]]) // update if row exists
                return this.update(row, select);
            var sb = [];
            this.runCallback('itemCreating', row, sb);
            sb.push(plus.util.format(this.templ, row, this.indexes));
            this.runCallback('itemCreated', row, sb, this.indexes);
            this.el.append(sb.join(""));
            this.rowsbuffer[row[0]] = row;
            if (select) this.select(row[0]);
            if (this.opt.filter) this.opt.filter.push({ fn: "!=", expr: {ID: row[0]}});
        },
        remove: function (id) {
            this.el.find('[owner=' + this.id + '][rowid=' + id + ']').remove();
            delete this.rowsbuffer[id];

        },
        clear: function () {
            this.el.find('[owner=' + this.id + ']').remove();
            this.rowsbuffer = {};
        },
        /*
        * load records
        **/
        fetch: function (fn, single, loading) {
            fn = fn || this.buildQuery;
            // exit function if records are fetched to end
            if (!single && this.finalized || this.state == 'loading') return;
            this.runCallback('loading', self);
            var self = this;
            this.state = single ? this.state : 'loading';
            plus.data.post({
                async: false, noLoading: !loading,
                data: json.write(fn(self)),
                service: this.opt.service,
                success: function (msg) {
                    var result = json.read(msg)
                    if ($.isArray(result) && result.length && result[0].rows) result = result[0];
                    var rows = $.isArray(result) ? result : result.rows,
                        templ = self.templ,
                        sb = [];
                    if (result.columns && !self.ready) {
                        self.columns = result.columns;
                        if (JSON.stringify({ id: 0 }) == JSON.stringify(self.indexes))
                        {
                            // build indexes
                            for (var j=0; j<result.columns.length; j++)
                            {
                                var col = result.columns[j], colName = typeof col === "string" ? col : col.name;
                                self.indexes[colName] = j;
                            }
                        }
                        self.ready = true;
                    }
                    if (single) return self.add(rows[0], single);
                    //templ = self.opt.templ instanceof jQuery ? self.opt.templ.html() : self.opt.templ;
                    // TODO:... Decide whether use stringbuilder or jQuery item...
                    for (var i = 0; i < rows.length; i++) {
                        var row = rows[i];
                        // ***user can modify row on itemCreating, we can get a clone copy of row to eliminate this... (not done).
                        self.runCallback('itemCreating', row, sb);
                        sb.push(plus.util.format(templ, row, self.indexes));
                        // user may modify sb after item is created
                        self.runCallback('itemCreated', row, sb);
                        self.rowsbuffer[row[0]] = row;
                    }
                    self.el.append(sb.join(""));
                    
                    // we could have used an [] as stringbuilder and push all at once... el.append(sb.join(""));
                    //for (var i=0; i<rows.length; i++)
                    //{
                    //    var row = rows[i];
                    //    self.runCallback('itemCreating', row);
                    //    var item = plus.util.format(templ, row, self.indexes);

                    //    // always make a jQuery object item to eliminate error when user specifies jQuery object of the template
                    //    if (self.templ instanceof jQuery) item = self.templ.clone().html(item);
                    //    item.attr('rowid', row[0]).attr('owner', self.id);
                    //    //var item = plus.util.format(self.templ, row, self.indexes);
                        
                    //    self.el.append(item);
                    //    self.runCallback('itemCreated', item, row);
                    //}
                    if (self.offset == 0) (self.opt.scroller || self.el).scrollTop(-1);
                    if (rows.length < self.limit && self.limit != 0) (self.loader.remove() && (self.finalized = true));
                    self.offset += rows.length;
                }
            });
            this.state = 'idle';
            this.runCallback('load', self);
            if (this.observers) this.observers.notify("after fetch");
        },
        /*
        * registers callback to list e.g.
        * var UserList = new plus.list([{ID:1, Name:'Ahmad', ...}, ...], {...});
        * UserList.callback('after', 'ItemCreated', 
        *        function(row, sb) { sb.append('<span> End of Item</span>');}
        *
        **/
        callback: function (event, fn) {
            if (!this.callbacks[event]) this.callbacks[event] = [];
            this.callbacks[event].push(fn);
        },
        runCallback: function (event, arg1, arg2, arg3) {
            var callbacks = this.callbacks[event];
            if (!callbacks) return;
            for (var i = 0; i < callbacks.length; i++) {
                if (callbacks[i].inactive) continue;
                plus.util.invoke(callbacks[i], null, arg1, arg2); //arguments.slice(1));//[].splice.call(arguments, 1));
            }
        },
        dispose: function () {
            // remove observers from other elements
        }
    }
})();