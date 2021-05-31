/*
* plus.organogram plugin
* http://plus.af
* 
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
    plus.organogram = function (opt) {
        this.opt = opt = opt || {};
        this.rows = opt.rows || [];
        if (!opt.rows) opt.preInit = true;
        this.canvas = opt.canvas;
        var self = this;
        this.buildQuery = opt.buildQuery || function (_id) {
            var _query = {};
            _query.path = self.path
            _query.filter = [{ParentID: _id}];
            return _query;
        }
        
        this.tree = opt.tree || undefined;
        //this.templ = opt.templ || plus.util.replaceAll('<table class="organogram" cellpadding="0" cellspacing="0"><tr><td class="mainItem-row"><div class="Org-node" dataid="{id}"><div class="node-header"><img class="pick" src="skin/ui/organogram/slideDown.png"><label>{OrgUnit}</label></div><div class="node-content"><img class="node-photo" src="{photo}"><span class="node-name">{Person}</span> <span class="node-position">{Position},</span> <span class="node-location">{Location}</span></div><div class="node-footer"><div class="tashkeel-info"><label class="tashkeel-vacant">{vacant}</label><label class="tashkeel-filled">{filled}</label><label class="tashkeel-planned">{planned}</label></div><div class="toggler-div"><img src="skin/ui/organogram/reddown.png"><label class="node-dependent">+{dependent}</label></div></div></div></td></tr></table>', 'skin/', plus.config.baseUrl + 'skin/');
        this.templ = opt.templ || plus.util.replaceAll('<table class="organogram" cellpadding="0" cellspacing="0"><tr><td class="mainItem-row"><div class="Org-node" dataid="{id}"><div class="node-header"><img class="pick" src="skin/ui/organogram/slideDown.png"><label>{OrgUnit}</label></div><div class="node-content"><span class="node-name">{Person}</span> <span class="node-position">{Position},</span> <span class="node-location">{Location}</span></div><div class="node-footer"><div class="tashkeel-info"><label class="tashkeel-vacant">{vacant}</label><label class="tashkeel-filled">{filled}</label><label class="tashkeel-planned">{planned}</label></div><div class="toggler-div"><img src="skin/ui/organogram/reddown.png"><label class="node-dependent">+{dependent}</label></div></div></div></td></tr></table>', 'skin/', plus.config.baseUrl + 'skin/');
        this.indexes = opt.indexes || {
            id: 0, Position: 1, parentid: 2, OrgUnit: 3, Person: 4
            , planned: 5, filled: 6, vacant: 7, dependent: 8, Location: 9, photo: 10
        }

        this.canvas.data('widget', this);

        if (this.opt.preInit)
            this.fetch(null, function () {
                self.load();
            });
        else {
            this.init();
            if (!opt.noLoad)
                this.load();
        }
            
    }
    plus.organogram.prototype = {
        init: function (_rows) {
            /* 
            * 1- Generate a tree of ids e.g. this.tree = {"" : [1], "1": [2,3,4], "2": [4,5,6], "3": [7,8,9], ...}
            * - Functionality:
            *      - you can get children of an id by calling its tree e.g. this.tree[1] returns [2,3,4];
            * 2- Generate rowsObject for easy finding column values e.g. 
            *       this.rowsobj = { "1": {ID: 1, Name: "Executive Director", ParentID: null, ChildCount:3}, ... }
            *       Note: this is only done if columns are passed as an array while constructing the organogram otherwise it will return an array of column values
            * - Functionality:
            *      - Facilitates retrieval of column value of a record e.g. this.rowsobj[1]["Name"] or this.rowsobj[1].Name returns "Executive Director"
            ***/
            if (!this.tree) {
                this.tree = {};
                this.rowsobj = [];
            }
            var rows = _rows || this.rows;
            for (var i = 0, len = rows.length; i < len; i++) {
                
                var r = rows[i], parentID = r[this.indexes.parentid] || '';
                if (!this.tree[parentID])
                    this.tree[parentID] = [];
                this.tree[parentID].push(r[0]);
                this.rowsobj[r[0]] = this.opt.columns ? getRecordObject(r, this.opt.columns) : r;
                if (_rows) this.rows.push(r);
            };

            /*
            * Creates object from row array e.g. 
            *   [1,"Executive Director",null,3] 
            *           ==> {ID:1, Name: "Executive Director", ParentID: null, ChildCount:3 }
            **/
            function getRecordObject(record, columns) {
                var o = {};
                if (record != undefined)
                    for (var i = 0; i < columns.length; i++) {
                        var col = columns[i];
                        o[col.name] = record[col.index];
                    }
                return o;
            }
        },

        center: function () {
            var firstEl = this.canvas.find('.Org-node:first:visible');
            if (firstEl.size() && this.canvas.get(0).scrollWidth) {
                this.canvas.scrollLeft(0)
                var x = firstEl.offset().left + ((firstEl.width()) + ((-1) * (this.canvas.width() / 2)));
                this.canvas.scrollLeft(x);
            }
        },
        shrink: function (id) {
            this.canvas.find('tr:first:not(:has(.Org-node[dataid=' + id + ']))').hide()
            this.canvas.find('.Org-node[dataid=' + id + ']')
            .parents('table:first').parents('td:first').siblings().hide()
            .parents('tr:first').prevAll().hide();
            this.opt.start = id;
        },
        /*
        * clears the canvas and loads/reloads an organogram from the given data starting from the given index...
        * @id int: starting id of tree object. default is ""
        ***/
        load: function (id) {
            id = this.opt.start = id || this.opt.start || null;
            var self = this, canvas = this.canvas;
            if (!this.tree[id] && this.tree['']) id = this.opt.start = '';
            if (!this.tree[id] && this.tree[this.opt.pk]) id = this.opt.pk;
            if (!this.tree[id]) return;

            // clear canvas
            canvas.html('');

            createNodes(this.tree[id], sb = []);
            canvas.append(sb.join(''));

            bindClicks();
            if (this.canvas.find('.Org-node:visible').size() == 1)
                this.canvas.find('.toggler-div:visible').click();

            function createNodes(ids, sb) {
                if (!ids || !ids.length) return;
                var len = ids.length, isFirst = !self.canvas.find('.Org-node').size(),
                    rtl = false;
                // item is child
                if (!isFirst) {
                    // add verticle line from parent
                    sb.push('<tr><td class="subItem-row"><table class="organogram" cellpadding="0" cellspacing="0"><tr>',
                    '<td colspan="', len == 1 ? len : len + 2, '" class="organogram-verticle-splitter"> <div class="verticleArrow"></div></td></tr>');
                    if (len > 1) {
                        sb.push(
                        // horizontal line up all children leaving two empty cells at both sides
                        '<tr><td></td><td colspan="', len, '" class="organogram-horizontal-splitter"></td><td></td></tr>');
                        // verticl line up each child
                        sb.push('<tr>');
                        for (var i = 0; i < len; i++) {
                            sb.push('<td colspan="', i == 0 || i == (len - 1) ? 2 : 1, '" class="organogram-verticle-splitter"><div class="verticleArrow"></div></td>')
                        }
                        sb.push('</tr>');
                    }
                    sb.push('<tr>');
                }

                for (var i = 0; i < len; i++) {
                    var id = ids[i], isTree = self.tree[id];
                    if (!isFirst)
                        sb.push('<td class="subItem-row" colspan="', i == 0 || i == (len - 1) ? 2 : 1, '">');
                    var obj = self.rowsobj[id]; if (self.indexes.dependent && self.tree[id] && !obj[self.indexes.dependent]) obj[self.indexes.dependent] = self.tree[id].length;
                    sb.push(self.format(obj));
                    //sb.push(self.format(self.rowsobj[id]));

                    if (!isFirst)
                        sb.push('</td>');
                }

                if (!isFirst)
                    sb.push('</tr></table></td></tr>');
            }

            this.center();

            function bindClicks() {
                canvas.find('.toggler-div').unbind('click').bind('click', function () {
                    var $this = $(this), did = $this.closest(".Org-node").attr('dataid'),
                        tr = $this.closest('tr'), create = !tr.next('tr').size();
                    if (create) {
                        if (!self.rowsobj[did][self.indexes.dependent]) return;
                        if (!self.tree[did])
                            self.fetch(did, function () {
                                createNodes(self.tree[did], sb1 = []);
                                tr.after(sb1.join(''));
                                bindClicks();
                            });
                        else {
                            createNodes(self.tree[did], sb1 = []);
                            tr.after(sb1.join(''));
                            bindClicks();
                        }
                        
                    } else tr.next('tr').toggle()
                    $this.toggleClass('expanded');
                    $this.toggleClass('collapsed');
                });
                canvas.find('.pick').unbind('click').bind('click', function () {
                    var $this = $(this), did = $this.closest(".Org-node").attr('dataid'),
                        tr = $this.closest('tr'), create = !tr.next('tr').size();
                    self.shrink(did);
                })
            }

        }
        /**
         * Replaces parameters denoted in the given string s as {0}, {1}, etc. 
         * with the values from the rest of the function arguments.
         * @param {Object} s
         */
        , format: function(row ) {
            var s = this.templ;
            // get each key of indexes and replace with coresponding row value
            if (row instanceof Array)
                for (key in this.indexes) {
                    var val = row[this.indexes[key]]; val = val == null ? "" : val;
                    s = s.replace(new RegExp("{" + key + "}", 'g'), val) // replace all
                }
            else
                for (key in this.indexes) {
                    var val = row[key]; val = val == null ? "" : val;
                    s = s.replace(new RegExp("{" + key + "}", 'g'), row[key]) // replace all
                }
            return s;
        }
        /**
         * Fetch data for each item 
         * @param {Object} s
         */
        , fetch: function (id, success) {
            
            var self = this;
            var query = this.buildQuery(id);
            success = success || $.noop;
            plus.data.post(
                {
                    async: false,
                    url: plus.config.baseUrl + 'json/pull.asmx/Fetch',
                    data: plus.json.write({queries:[ query]}),
                    success: function (msg) {
                        var response = plus.json.read(msg);
                        if ($.isArray(response)) response = response[0];
                        self.init(response.rows);
                        success(response.rows);
                    }
                });
        }
    }
})();