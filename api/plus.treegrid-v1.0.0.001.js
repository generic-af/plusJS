/*
* plus.treegrid plugin
* http://Khawarsoft.com
* 
* requires jQuery.js v2.1.3 or higher http://jquery.com/
* tested with jQuery v2.1.3
*
* Copyright 2015 Khawarsoft 
* Released under the Khawarsoft Co API license
* http://api.Khawarsoft.com/license
*
* Date: 2015-06-02 23:31:16 GMT+0430 (Afghanistan Standard Time)
* 
* @author: mushfiqullah.akhundzada@gmail.com, reza.khawar@gmail.com
* 

    <treegrid async="true" id="dvFMS_dbo_spGetBudgetDetail" commandType="sp" >
        <header>
            
        </header>
        <columns>
            <column id="Name" caption="اسم" type="fixed"></column>
            <column id="Name" caption="اسم"></column>
        </columns>
    </treegrid>

    
* 
**/
var plus = window.plus = window.plus || {};
var json = plus.json;
(function () {
    plus.treegrid = function (opt) {
        this.opt = opt;
        this.el = opt.el;
        //opt.path = opt.path || opt.el.substring(2).split("_");
        this.opt.commandType = this.opt.commandType || (this.el.attr('commandType') || "Table");
        // template of a single item in list
        this.callbacks = opt.callbacks || {}; /* { "init": [], initiated: [], loading:[], load: [], itemCreating:[], itemCreated:[]} */
        this.post = this.el.attr('commandtype');
        this.id = 'treegrid_' + (new Date()).getTime(); // treegrid_############# e.g. treegrid_1441872805426 (unique id)

        this.opt.url = this.opt.url || (plus.config.baseUrl + "json/pull.asmx/Fetch");
        var self = this;
        this.buildQuery = this.opt.buildQuery || function (_offset, parentID) {
            var query = {};
            query.commandType = self.opt.commandType;
            query.fetchColumns = !self.ready;
            query.columns = self.columns;
            query.screen = plus.page.prototype.deserialize().path;
            query.sort = self.opt.sorter || ['ID'];
            query.path = self.opt.path;

            if (self.opt.async) {
                query.limit = self.opt.limit;
                query.offset = _offset;
                parentID = parentID || null;
                query.filter = [{ ParentID: parentID }];
                if (self.opt.commandType == "sp") {
                    query.param = { ParentID: parentID };
                }
            }
            return { queries: [query] };
        }

        this.pColIndex = opt.pColIndex || 2; /*[ID, Name, ParentID, ...]*/
        this.colCountIndex = opt.colCountIndex || -1;
        this.table = this.opt.table || { path: this.opt.path, rows: [], columns: [] };
        this.tree = {};
        if (opt.data)
            this.addRows(opt.data);

        this.observers = opt.noObserver ? null : plus.api.construct("Observers");

        this.load();
    }

    plus.treegrid.prototype = {
        load: function () {
            var self = this;
            var grid = $('<div class="grid treegrid" ownerid="' + self.id + '"></div>'), origin = this.el.after(grid).remove(), load = origin.attr('noload') === "false", fn = window[origin.attr('onItemClick')],
                path = origin.attr('path') ? origin.attr('path').split(".") : origin.attr('id').substring(2).split("_");

            if (origin.attr('style')) grid.attr('style', origin.attr('style'));
            grid.addClass('widget').attr('id', origin.attr('id'));
            grid = $('<table></table>').appendTo(grid);
            if (origin.attr('table-style')) grid.attr('style', origin.attr('table-style'));
            grid = $('<tbody></tbody>').appendTo(grid);
            // construct header
            var header = $('<tr><th></th></tr>').appendTo(grid);
            // TODO: implement column indexes from user
            var indexes = { id: 0 }, templ = '<tr owner="' + this.id + '" class="grid-row level{tree-level} {expand-collapse}" level="{tree-level}" rowid="{id}" tree="{tree-path}" parentid="{ParentID}" ><td class="tree-command"><img action="tree" src="http://localhost/skin/icon/spacer.gif" /></td>';

            var _columns = ["ID", "ParentID"];
            if (origin.find('command').length) header.append('<th>&nbsp;</th>') && (templ += "<td>");

            origin.find('command').each(function () {
                var command = $(this);
                templ += '<img src="' + command.attr('src') + '" action="' + command.attr('action') + '" title="' + (command.attr('title') || command.attr('action')) + '" class="' + (command.attr('class')) + '" />';
            });
            if (origin.find('command').length) templ += '</td>';
            origin.find('column').each(function () {
                var col = $(this).attr('id'), caption = $(this).attr('caption') || plus.util.pascalToSpace(col), index = $(this).attr('index');
                indexes[col] = index - 0;
                _columns.push(col);
                //columns[index - 0] = col;
                templ += '<td column="' + col +'"';
                // check user-defined classes and styles
                if ($(this).attr('style')) templ += ' style="' + $(this).attr('style') + '"';
                if ($(this).attr('class')) templ += ' class="' + $(this).attr('class') + '"';
                if ($(this).hasClass('editable')) {
                    var _rule = $(this).attr('rule') ? ('rule="' + $(this).attr('rule') + '" vgroup="' + $(this).attr('vgroup') + '"') : '';
                    templ += '><input type="text" ov="{' + col + '}" data="' + col + '" ' + _rule + ' value="{' + col + '}" class="' + $(this).attr('item-class') + '" />';
                }
                else templ += '>{' + col + '}';

                templ += '</td>';
                $('<th>' + caption + '</th>').appendTo(header);
            });
            //this.indexes = indexes;
            this.indexes = this.opt.indexes || { id: 0 };

            templ += '</tr>';

            // if header specified by user
            if (origin.find('header').size()) {
                header.remove();
                grid.append(origin.find('header tbody').html());
            }
            this.templ = templ;
            this.grid = grid;
            origin.remove();

            this.el = this.grid;

            this.grid.addClass('widget').data('widget', this).bind('click', function (event) {
                var target = $(event.target), item = target, owner = target.attr('owner');
                if (owner === undefined) {
                    item = target.parents('[owner]:first');
                    owner = item.attr('owner');
                }
                if (owner === undefined || owner !== self.id) return;

                var collect = { id: item.attr('rowid') }; // an object used to collect user input on condition... User may exit item click on condition
                self.runCallback('itemClicking', target, collect);
                if (collect.exit) return false;
                self.runCallback('itemClicked', target, item.attr('rowid'));
                self.select(item.attr('rowid'));
            });

            this.callback('itemClicking', function (cmd, collect) {
                if (!(cmd instanceof jQuery)) cmd = $(cmd);
                if (!cmd.is("IMG")) return;

                var _recordID = cmd.parents('tr').attr('rowid')
                if (cmd.attr('action') == 'tree') {
                    var tr = cmd.parents('tr'), treePath = tr.attr('tree') + '-' + tr.attr('rowid');
                    var rowid = tr.attr('rowid');
                    collect.exit = true;
                    if (tr.hasClass('item')) return;
                    if (!tr.hasClass('loaded')) {
                        self.fetch(0, rowid);
                        return;
                    }
                    if (tr.hasClass('expanded')) {
                        tr.parent().find('tr[tree=' + treePath + ']:visible, tr[tree^=' + treePath + '-]:visible').addClass("hno_" + rowid).hide();
                        tr.removeClass('expanded').addClass('collapsed');
                    }
                    else {
                        tr.parent().find('tr.hno_' + rowid).show().removeClass('hno_' + rowid);
                        tr.removeClass('collapsed').addClass('expanded');
                    }
                    cmd.parents('tbody').find()
                } 

            });
            this.runCallback('load', this);

            if (!this.opt.prefetch) this.fetch(0, 0);


        }, select: function (id, silent) {
            this.grid.find('.selected').removeClass('selected');
            var item = this.el.find('[owner=' + this.id + '][rowid=' + id + ']').addClass('selected');
            this.selectedIndex = item.index();
            this.selectedValue = id;
            if (!silent)
                this.observers.notify("indexchanged");
            // scroll to position
        },
        addRows: function (_rows) {
            var rows = this.table.rows || this.table;
            // build rows object
            this.table.rowsobj = this.table.rowsobj || {};
            // build tree
            for (var i = 0, len = _rows.length; i < len; i++) {
                var r = _rows[i], parentID = r[this.pColIndex] || '';
                var _isNew = this.table.rowsobj[r[0]] === undefined;
                this.table.rowsobj[r[0]] = r; // update
                if (!this.tree[parentID])
                    this.tree[parentID] = [];
                if (_isNew) {
                    this.tree[parentID].push(r[0]);
                    (this.table.rows || this.table).push(r);
                }
            }

            for (var i = 0, len = _rows.length; i < len; i++) {
                var r = _rows[i], parentID = r[this.pColIndex] || '';
                this.table.rowsobj[r[0]] = r; // update

                parentID = r[this.pColIndex] || "";
                var hasChild = !this.opt.async ? this.tree[r[0]] : r[this.colCountIndex];

                // add to element
                // find location where to append
                var pRow = this.grid.find('tr[rowid="' + parentID + '"]'),
                    lSibling = this.grid.find('tr[parentid="' + parentID + '"]:last'),
                    lSiblingLChild = this.grid.find('tr[tree^="' + lSibling.attr('tree') + '-' + lSibling.attr('rowid') + '"]:last');

                var treePath = parentID ? (pRow.attr('tree') + '-' + parentID) : '';

                var _loc = lSibling.size() ? lSiblingLChild.size() ? lSiblingLChild : lSibling : pRow.size() ? pRow : this.grid.find('tr:not(.grid-row):last');

                var sb = [plus.util.replaceAll(this.templ, '{tree-path}', treePath)];

                this.runCallback('itemCreating', r, sb);

                sb = sb.join("");
                sb = plus.util.format(sb, r, this.indexes);
                var _level = ((this.grid.find('tr[rowid="' + parentID + '"]:last').attr('level')) || -1) - 0 + 1;
                sb = plus.util.replaceAll(sb, "{tree-level}", _level);

                var excol = hasChild ? 'collapsed' : 'item';
                if (!_loc.hasClass('grid-row')) excol = excol + ' first';
                if (pRow.size() && pRow.hasClass('collapsed')) pRow.removeClass('collapsed').addClass('expanded').addClass('loaded');
                sb = plus.util.replaceAll(sb, "{expand-collapse}", excol);
                _loc.after(sb);
                _loc.next().validator();
                _loc.next().find('input').bind('focus', function () {
                    $(this).attr('olv', $(this).val());
                    $(this).parent().addClass('focused');
                    $(this).one('blur', function () { $(this).parent().removeClass('focused') });
                }).bind('change', function () {
                    var $td = $(this).parent(), $tr = $td.parent();
                    if ($td.hasClass('sum') && $tr.attr('parentid') ) {
                        // calculate
                        var ov = plus.util.replaceAll( ($(this).attr('olv') === undefined ? $(this).attr('ov') : $(this).attr('olv')), ",", "") -0,
                            nv = plus.util.replaceAll($(this).val(), ",", "") -0;
                            var $ptr = $tr.parent().find('tr[rowid=' + $tr.attr('parentid') + ']'),
                                $pinput = $ptr.size() ? $ptr.find('td[column="' + $td.attr('column') + '"] input:first') : null
                                , pv = $pinput.size() ? (plus.util.replaceAll($pinput.val(), ",", "") - 0) : null;
                            if ($pinput.size()) {
                                $pinput.val(plus.util.accounting((pv + nv - ov)));
                                $pinput.trigger('change'); // apply ancestors
                                $pinput.attr('olv', $pinput.val());
                            }
                    }
                    
                });
                this.runCallback('rowBound', r, _loc.next());
            }
        },
        /*
        * Sums up Grid
        **/
        sumUp: function (td, sumSelf) {
            var $tr = td.parent(), index = td.index(), column = td.attr('column'), rowid = $tr.attr('rowid')
                , parentID = $tr.attr('parentid'), $ptr = this.grid.find('tr[rowid="' + parentID + '"]');
            // sum parent
            if (sumSelf && rowid) {
                var sum = 0;
                this.grid.find('tr[parentid="' + rowid + '"] td[column="' + column + '"]').each(function () {
                    var v = $(this).find('input').size() ? $(this).find('input').val() : $(this).text();
                    v = (plus.util.replaceAll(v, ",", "")) - 0;
                    sum = sum + ((isNaN(v) ? 0 : v));
                });
                if (td.find('input').size()) td.find('input').val(plus.util.accounting(sum)); else td.text(plus.util.accounting(sum));
            }
            if ($ptr.size()) this.sumUp($ptr.find('td[column="' + column + '"]'), true);
            
        },
        fetch: function (offset, parentID) {

            var self = this;
            var fetch = this.opt.fetch || plus.data.post;
            fetch({
                async: false,
                url: self.opt.url,
                data: json.write(self.buildQuery(offset, parentID)),
                success: function (msg) {
                    var response = json.read(msg);
                    if ($.isArray(response)) response = response[0];
                    var _rows = $.isArray(response) ? response : response.rows;
                    if (response.columns) self.columns = response.columns;
                    if (response.columns) {
                        for (var j = 0; j < response.columns.length; j++) {
                            var col = response.columns[j], colName = typeof col === "string" ? col : col.name;
                            self.indexes[colName] = j;
                            if (colName.toLowerCase() == "childcount" && self.colCountIndex == -1) self.colCountIndex = j;
                        }
                    }
                    self.addRows(_rows);
                    self.ready = true;
                    self.runCallback('fetch', self);
                    self.observers.notify("after fetch");
                }
            });
        }, callback: function (event, fn) {
            if (!this.callbacks[event]) this.callbacks[event] = [];
            this.callbacks[event].push(fn);
        },
        collapse: function (level) {
            level = level || 0;
            this.grid.find('tr.level' + level + '.expanded [action="tree"]').click();
        },
        expand: function (level) {
            level = level || 0;
            this.grid.find('tr.level' + level + '.collapsed [action="tree"]').click();
        },
        runCallback: function (event, arg1, arg2) {
            var callbacks = this.callbacks[event];
            if (!callbacks) return;
            for (var i = 0; i < callbacks.length; i++) {
                if (callbacks[i].inactive) continue;
                plus.util.invoke(callbacks[i], null, arg1, arg2); //arguments.slice(1));//[].splice.call(arguments, 1));
            }
        },
        clear: function () {
            this.tree = {};
            this.rowsobj = {};
            this.table.rows = [];
            this.grid.find('tr[rowid]').remove();
        },
        dispose: function () {
            // remove observers from other elements
        },
        /*
        *  treeGrid.values(true); // changedOnly
        *  treeGrid.values(false); // allvalues
        **/
        values: function (changesOnly, onRowAdded, leavesOnly) {
            var values = [], self = this;
            this.grid.find('tr.grid-row').each(function () {
                var $tr = $(this), row = { ID: $tr.attr('rowid') }, isChanged = !changesOnly;
                if (leavesOnly && self.grid.find('tr[parentid="' + row.ID + '"]').size()) return;
                $tr.find('input').each(function () {
                    var col = $(this).attr('data'), ov = $(this).attr('ov'), rule = $(this).attr('rule') +"", nv = $(this).val();
                    if (rule.indexOf("'number'") > -1) {
                        ov = plus.util.replaceAll(ov, ",", "");
                        nv = plus.util.replaceAll(nv, ",", "")
                    }
                    row[col] = nv;
                    isChanged = isChanged || (ov != nv);
                });
                if (isChanged) values.push(row) && plus.util.invoke(onRowAdded, null, row);
            });
            return values;
        },
        save: function (changesOnly, onComplete, leavesOnly) {
            if (this.fkCol && this.parent.record == null) {
                plus.widget.error('معلومات فورم اصلی ثبت نگردیده است.');
                return false;
            }
            var queries = [], self = this;
            this.values(changesOnly, function (_row) {
                var query = {};
                query.path = self.opt.save || this.opt.path;
                query.type = self.post; // proc || undefined;
                query.screen = plus.page.prototype.deserialize().path;
                plus.util.invoke(self.opt.appendToQuery, null, _row);
                query.values = _row;
                query.requery = self.opt.requery;
                queries.push(query);
            }, leavesOnly);

            if (!queries.length) {
                plus.widget.error('معلومات فورم اصلی ثبت نگردیده است.');
                return false;
            }
            
            //query.fetch = this.opt.fetch ? this.opt.fetch : (this.opt.master ? this.opt.master.opt.path.join(".") : this.path.join("."));
            plus.data.post({
                async: false, url: plus.config.baseUrl + 'json/push.asmx/saveAll'
                , data: plus.json.write({ queries: queries }),
                success: function (msg) {
                    var response = plus.json.read(msg), errors = [];
                    for (var i = 0; i < response.length; i++) {
                        if (!response[i].value) response[i].value = queries[i].values.ID;
                        var row = response[i], tr = self.grid.find('tr[rowid=' + row.value + ']');

                        if (row.ResponseType != "SUCCESS") {
                            tr.addClass('invalid');
                            errors.push(row.error || row.response || row.message);
                        } else tr.find('input').each(function () {
                            $(this).attr('ov', $(this).val());
                        });
                    }
                    onComplete(response, errors);
                    if (!errors.length)
                        plus.widget.success("معلومات موفقانه ثبت گردید.");
                }
            });
        }
    }
})();