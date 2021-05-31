
var plus = window.plus = window.plus || {};
var json = plus.json;
(function () {
    /**
    * TreeView/Organogram Class 
    * status: INCOMPLETE
    * @param {Object} source table 
    * @param {Object} el
    */
    plus.treeview = function(source, opt) {
        this.opt = opt = opt || {};
        opt.more = opt.more || '<img src="' + plus.config.baseUrl + 'skin/icon/more-tree.png" />';
        /**
         * TODO: discuss this change
         * */
        var ObjFilter = opt.filter instanceof Function ? undefined :
            opt.filter ? opt.filter : undefined; 
        opt.filter = (opt.filter instanceof Function) ? opt.filter : function (query, _self) {
            if (query.filter) delete query.filter;

            query.filter = ObjFilter ? $.extend([],ObjFilter) : [];
            query.filter.push({});
            
            query.filter[query.filter.length - 1][_self.columns[_self.pColIndex]] = _self.opt.start || null;
            //if (_self.opt.start) {
            //    query.filter = [{}];
            //    query.filter[0][_self.columns[_self.pColIndex]] = _self.opt.start;
            //} 
        }
        this.columns = this.opt.columns || ["ID", "Name", "ParentID", "ChildNodes"];
        this.table = source;
        this.opt.exclude = opt.exclude || [];
        this.callbacks = {};
        this.el = opt.el;
        this.canvas = opt.canvas;
        this.mode = opt.mode || 'tree';
        this.opt.limit = 10;
        opt.nameIndex = opt.nameIndex || 1;
        this.pColIndex = opt.pColIndex || 2;
        this.hasChildren = opt.hasChildren || this.hasChildren;
        var self = this;
        this.buildQuery = this.opt.buildQuery || function (_offset) {
            var query = {};
            query.columns = self.columns;
            query.limit = self.opt.limit;
            var _urlDeserialized = plus.page.prototype.deserialize();
            query.screen = _urlDeserialized.subpath && this.el.hasClass('subform') ? _urlDeserialized.subpath : _urlDeserialized.path;

            if (_offset)
                query.offset = _offset;
            query.sort = self.opt.sorter || ['ID'];
            query.path = self.opt.path || self.table.name;
            var filter = self.opt.filter;

            if (filter) {
                if (filter instanceof Function)
                    filter(query, self)
                else query.filter = filter;
            }
            return { queries: [query] };
        }

        if (!opt.noLoad)
            this.load();
        return false;
    };

    plus.treeview.prototype = {
        load: function () {
            var self = this;

            var table = this.table;
            var rows = this.table.rows || this.table;
            this.addRows(rows);
            //// build rows object
            //this.rowsobj = {};
            //for (var i = 0, len = rows.length; i < len; i++) {
            //    var r = rows[i];
            //    this.rowsobj[r[0]] = r;
            //}

            //if (!this.tree) {
            //    this.tree = {};
            //    for (var i = 0, len = rows.length; i < len; i++) {
            //        var r = rows[i], parentID = r[this.pColIndex] || '';
            //        if (!this.tree[parentID])
            //            this.tree[parentID] = [];
            //        this.tree[parentID].push(r[0]);
            //    };
            //}

            if (this.el != null) {
                this.addChildren(this.el.html(''), (this.mode == 'org' ? false : undefined));
                this.el.data('widget', this).treeview({
                    unique: false,
                    collapsed: true,
                    animated: "fast",
                    prerendered: true,
                    addChildren: function (node) {
                        self.addChildren(node);
                    }
                }).addClass(this.opt.cssClass || "");
            }
        },
        addRows: function(_rows) {
            var rows = this.table.rows || this.table;
            // build rows object
            this.table.rowsobj = this.table.rowsobj || {};
            this.rowsobj = this.rowsobj || {};
            if (!this.tree)
                this.tree = {};
            for (var i = 0, len = _rows.length; i < len; i++) {
                var r = _rows[i], parentID = r[this.pColIndex] || '';
                var _isNew = this.rowsobj[r[0]] === undefined;
                this.rowsobj[r[0]] = this.table.rowsobj[r[0]] = r; // update
                if (!this.tree[parentID])
                    this.tree[parentID] = [];
                if (_isNew) {
                    this.tree[parentID].push(r[0]);
                    (this.table.rows || this.table).push(r);
                }
            }
        },
        /**
        * Expand creates the children nodes
        * @param {int} id
        */
        addChildren: function (node) {
            // Quit if already expanded
            if (node.find('ul:first').length) return;

            var id = node.attr('dataid') || '', self = this;
            id = this.opt.start = id || this.opt.start || '';
            if (!this.tree[id] && this.opt.async) {
                var fetch = self.opt.fetch || plus.data.post;
                fetch({
                    async: false,
                    url: self.opt.url,
                    data: json.write(self.buildQuery()),
                    success: function (msg) {
                        var response = json.read(msg);
                        if ($.isArray(response)) response = response[0];
                        var _rows = $.isArray(response) ? response : response.rows;
                        self.addRows(_rows);
                    }
                });
            }

            if (!this.tree[id]) return;

            createNodes(this.tree[id], sb = []);
            node.append(sb.join(''));

            if (this.mode == 'edit') {
                if (arguments.length == 1) node.find('ul:first').hide();
                node.find('ul [action]').bind('click', buttonClick);
            }

            function buttonClick() {
                var v = $(this).closest('li').attr('dataid'),
                    action = $(this).attr('action');
                if (v == -1)
                    v = $(this).closest('li').parents('li:first').attr('dataid');
                var r = self._runCallbacks('before', action, v, action);
                if (r !== undefined && !r) return;
                self.val(v);
                self._runCallbacks('after', action, v, action);
            }

            //if (this.mode == 'tree' || this.mode == 'edit') {
                if (node.attr('dataid')) node.find('ul:first').hide();
                // Click handler
                node.find('ul .label').click(function () {
                    var v = $(this).closest('li').attr('dataid');
                    if (v != "-8")
                        self.el.trigger('select', v);
                    else
                        self.val(v, $(this).closest('li'));
                    return false;
                });
            //}

            // Hover handler
            node.find('ul .label').hover(
                function () { $(this).addClass("hover"); },
                function () { $(this).removeClass("hover"); }
            );

            this._runCallbacks('after', 'bind', node);

            function createNodes(ids, sb) {
                if (!ids || !ids.length) return;

                var ul = sb.push('<ul class="',
                        ids.length ? ' expandable' : '',
                        ' rtl">');

                ids.sort(function (a, b) {
                    var va = self.sortlabel(a).toLowerCase(), vb = self.sortlabel(b).toLowerCase();
                    return va > vb ? 1 : va < vb ? -1 : 0;
                });

                for (var i = 0, len = ids.length; i < len; i++) {
                    var id = ids[i], isEx = Array.indexOf(self.opt.exclude, id) > -1;
                    if (self.opt.idFilter && !self.opt.idFilter(id)) continue;

                    sb.push('<li dataid="', id,
                        '" class="'/*, i == len - 1 ? 'last' : ''*/, ' rtl', isEx ? " exclude" : "", '">');

                    if (self.hasChildren(id))//self.tree[id])
                        sb.push('<div class="hitarea expandable-hitarea rtl', '"></div>');

                    sb.push('<div class="label rtl ' + self.label(id, 'CSSClass') + '">');

                    self._runCallbacks('on', 'treeitemcreating', id, sb);

                    sb.push(self.label(id), '</div></li>');
                };
                // add more
                if (self.opt.async)
                    sb.push('<li dataid="-8" class="last rtl"><div class="label rtl">' + self.opt.more + '</div></li>');
                sb.push('</ul>');
            }
        },
        ancestors: function (id) {
            var ancestors = [], self = this;
            find(ancestors, id);
            return ancestors;
            function find(ids, id) {
                ids.push(id - 0);
                if (self.table.rowsobj[id][2])
                    find(ids, self.table.rowsobj[id][2]);
            }
        },
        show: function (id) {
            // Expand all parents first
            if ($.isArray(id)) id = id[0];
            var ancestors = [], node = this.el, tree = this.tree;
            find(tree[ /*this.opt.start ||*/''], id, ancestors);
            for (var i = 0; i < ancestors.length; i++) {
                node = node.find('li[dataid=' + ancestors[i] + ']');
                this.addChildren(node);
            }

            function find(ids, id, path) {
                if (!ids) return false;
                for (var i = 0, len = ids.length; i < len; i++) {
                    path.push(ids[i]);
                    if (ids[i] == id)
                        return true;

                    if (find(tree[ids[i]], id, path)) {
                        return true;
                    }
                    else {
                        path.pop();
                    }
                }
            }
        },

        /**
        * Get node by the path of indexes of items at subsequent levels
        * @param {Object} path
        */
        node: function (v) {
            if (!v) return;
            return this.el.find('[dataid=' + v + ']'); //:not(:has(ul))');
        },

        val: function (v, node, t, noLoop) {
            //if (t !== undefined) {
            //    this.el.val(t);
            //    return v;
            //}
            // Get value
            if (v === undefined) return this.selected;
            var self = this;
            // Set value        
            if (plus.util.isNumeric(v)) v = v - 0;
            if (v && v>0 && !this.rowsobj[v]) {
                // fetch
                var query = {};
                query.columns = self.columns;
                query.sort = self.opt.sorter || ['ID'];
                query.path = self.opt.path || self.table.name;
                query.pk = v;
                
                plus.data.post({
                    async:true, noLoading:true,
                    url: self.opt.urlAncestor || plus.config.baseUrl + "json/pull.asmx/FetchTreeAncestor",
                    data: json.write({ queries: [query] }),
                    success: function (msg) {
                        var response = json.read(msg);
                        if ($.isArray(response)) response = response[0];
                        var _rows = $.isArray(response) ? response : response.rows;
                        self.addRows(_rows);

                        // reverse loop
                        if (noLoop == undefined && _rows.length > 0) {
                            self.val(v, null, null, true);
                            self.el.trigger('select', v);
                        }
                            
                    }
                });
                return v;
            }
            if (v == -8 && node) {
                var ul = node.parent();
                
                var more = node.remove();
                self.opt.start = ul.parent().is("LI") ? ul.parent().attr('dataid') : null;
                
                var fetch = self.opt.fetch || plus.data.post;
                fetch({
                    async:false,
                    url: self.opt.url,
                    data: json.write(self.buildQuery(ul.find('>li:not(".exclude")').size())),
                    success: function (msg) {
                        var response = json.read(msg);
                        if ($.isArray(response)) response = response[0];
                        var _rows = $.isArray(response) ? response : response.rows;
                        self.addRows(_rows);
                        var _fk = self.opt.start;
                        var sb = [];
                        var isLast = _rows.length;
                        for (var i = 0; i < _rows.length; i++) {
                            var row = _rows[i], count = self.hasChildren(row[0])/*row[3] - 0*/, id = row[0];
                            if (_fk && row[2] != _fk) continue;
                            if (!_fk && row[2] != null) continue;
                            sb.push('<li dataid="', id,
                                '" class="', i == _rows.length - 1 && isLast ? 'last' : '', ' rtl">');

                            if (count)
                                sb.push('<div class="hitarea expandable-hitarea rtl', '"></div>');

                            sb.push('<div class="label rtl ' + self.label(id, 'CSSClass') + '">');

                            self._runCallbacks('on', 'treeitemcreating', id, sb);

                            sb.push(self.label(id), '</div></li>');
                        };
                        if (sb.length) ul.append(sb.join(""));
                        if (_rows.length >= 10 && sb.length) ul.append(more);

                        ul.find('.label').unbind('click').click(function () {
                            var v = $(this).closest('li').attr('dataid');
                            //self.el.trigger('select', v);
                            //self.val(v);
                            if (v != "-8")
                                self.el.trigger('select', v);
                            else
                                self.val(v, $(this).closest('li'));
                            return false;
                        });

                        ul.find('.label').hover(
                            function () { $(this).addClass("hover"); },
                            function () { $(this).removeClass("hover"); }
                        );

                        ul.find("div.hitarea").unbind('click').bind('click', self.el.data('toggler'));

                        if (self.mode == 'edit') {
                            ul.find('[action]').unbind('click').bind('click', function () {
                                var v = $(this).closest('li').attr('dataid'),
                                    action = $(this).attr('action');
                                if (v == -1)
                                    v = $(this).closest('li').parents('li:first').attr('dataid');
                                var r = self._runCallbacks('before', action, v, action);
                                if (r !== undefined && !r) return;
                                self.val(v);
                                self._runCallbacks('after', action, v, action);
                            });
                        }

                    }
                });

                return v;
            }
            if (this.selected) this.selectedNode.removeClass('selected');
            node = node || this.node(v);
            if (!node)
                this.show(v);

            node = node || this.node(v);
            if (node && node.length) {
                node.addClass('selected');
                // Toggle expanded state
                var toggler = this.el.data('toggler');
                node.parents('.treeview li').each(function () {
                    toggler.apply($('>.expandable-hitarea', this));
                });
            }

            this.selected = v;
            this.selectedNode = node;

            if (v && this.opt.val === 'subtree') {
                this.selected = [v];
                this._walk(this.tree[v], function (id) {
                    this.selected.push(id);
                });
            }
            return this.el;
        },

        hasChildren: function (v) {
            return !!this.tree[v] ||
                (this.opt.async && /*this.table.columns[3].name == "ChildCount" &&*/ this.rowsobj[v][3]);
        },
        subtree: function (id, list) {
            list = list || [];
            if (id && id.length) {
                for (var i = 0, len = id.length; i < len; i++) {
                    this.subtree(id[i], list);
                }
            }
            else {
                list.push(id);
                if (this.tree) {
                    if (this.tree[id])
                        for (var i = 0, len = this.tree[id].length; i < len; i++) {
                            Array.append(list, this.subtree(this.tree[id][i]));
                        }
                }
                else {
                    Array.append(list, Array.map(
                        this.find({ filter: this.column.ParentID.is(id) }),
                        function (r) { return r[0]; }));
                }
            }
            return list;
        },

        sortlabel: function (v) {
            if (!v) return '';
            var i = this.opt.sortColIndex || 1;
            var r = this.rowsobj[v];
            return "" + (r[i] || "");
        },
        label: function (v, i, f) {
            if (!v) return '';
            if (i === undefined) i = this.opt.nameIndex;
            var index = i;
            if (typeof i === "string") {
                if (window["Table"] && this.table instanceof Table) {
                    if (!this.table.columns[i]) return "";
                    index = this.table.columns[i].index;
                }
                else
                    for (var j = 0; j < this.table.columns.length; j++) {
                        if (this.table.columns[j][0] == i) {
                            index = j;
                            break;
                        }
                    }
            }
            var r;
            r = this.rowsobj[v];
            if (!r) return '';
            if (r[index] == 0) return r[index];
            if (typeof i !== "string")
                f = f || r[0];
            return "" + (r[index] || f);
        },

        labelPath: function (v) {
            var name = this.opt.nameIndex, parent = this.pColIndex,
                s = '';
            while (v) {
                var item = this.rowsobj[v] || {};
                s = item[name] + (s ? ' | ' + s : '');
                v = item[parent];
            };
            return s;
        },
        /**
        * Recursively walks the tree running a function on each node.
        * When the function return true, the procedure stops.
        * 
        * @param {Object} items
        * @param {Object} fn
        */
        _walk: function (items, fn) {
            if (!items) return;
            for (var i = 0, len = items.length; i < len; i++) {
                if (fn.call(this, items[i])) return true;
                if (this._walk(this.tree[items[i]], fn))
                    return true;
            };
        },
        callback: function (when, fn) {
            if (!this.callbacks[when]) this.callbacks[when] = [];
            this.callbacks[when].push(fn);
        },

        _runCallbacks: function (when, action, ov, nv) {
            if (action != 'remove')
                _runCallbacks(this, when + ' save', ov, nv);
            var rv = _runCallbacks(this, when + ' ' + action, ov, nv);
            if (rv != undefined) return rv;
            function _runCallbacks(self, event, ov, nv) {
                var callbacks = self.callbacks[event];
                if (!callbacks) return;
                for (var i = 0; i < callbacks.length; i++) {
                    if (callbacks[i].inactive) continue;
                    var r = plus.util.invoke(callbacks[i], null, ov, nv);
                    if (r !== undefined && !r) return r;
                }
            }
        }
    };

})();
