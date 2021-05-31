/*
* plus.form plugin 
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
    /**
     * 
     * @param {any} opt
     */
    plus.form = function (opt) {
        this.opt = opt = opt || {};
        this.el = opt.el;
        this.id = "form_" + (new Date()).getTime();
        this.opt.requery = opt.requery !== undefined ? opt.requery : (!this.el.attr('no-requery') ? true : undefined)
        this.path = opt.path || this.el.attr('id').substring(2).split("_");
        opt.save = this.el.attr('save') || this.path.join(".");
        this.record = opt.record;
        this.master = opt.master;
        this.columns = opt.columns;
        //if (!this.columns && this.master) this.columns = this.master.opt.indexes;
        this.fields = this.el.find(':text, :radio, :checkbox, input:hidden, select, textarea, label.field').not(":button, :submit");

        var _urlDeserialized = plus.page.prototype.deserialize();
        this.screen = _urlDeserialized.subpath && this.el.hasClass('subform') ? _urlDeserialized.subpath : _urlDeserialized.path;
        if (this.master) this.master.opt.screen = this.screen;
        // readonly fields (labels) should contain class as field
        this.actions = this.el.find('.div-form-control [action]');

        this.validated = false;

        this.observers = opt.noObserver ? null : plus.api.construct("Observers");
        var beforeInit = opt.beforInit || window[this.el.attr('beforeInit')] || $.noop;
        beforeInit(this);
        this.init();
        this.el.addClass('widget').data('widget', this);
        if (window[this.el.attr('afterbind')]) this.observers.add('after bind', window[this.el.attr('afterbind')]);
        if (window[this.el.attr('afterCreate')]) this.observers.add('after create', window[this.el.attr('afterCreate')]);
        var onInit = opt.onInit || window[this.el.attr('onInit')] || $.noop;
        //if (window[this.el.attr('onInit')]) window[this.el.attr('onInit')]();
        onInit(this);
		// set * for required fields
		this.fields.each(function (ind,itm) {
            if ($(itm).attr('rule') != undefined) {
                if ($(itm).attr('rule') == "{fn:'required'}") {
                    $(itm).prev('label:first').
                        html($(itm).prev('label:first').
                        html() + '<span style="color:#9b0436;margin-right:-5px">*</span>');
                }

            }
        });

    }

    plus.form.prototype = {
        init: function () {
            this.el.find('.date:not(".conv-date")').each(function () {
                var fn = window[$(this).attr('fn')] || $.noop;
                $(this).calendarsPicker({ onSelect: fn });
            });

            this.el.find('.conv-date').each(function () {
                var origin = $(this);
                origin.attr('placeholder', 'تاریخ شمسی');
                origin.wrap('<div class="col-split"></div>');
                var alt = $(' <input type="text" placeholder="تاریخ میلادی" class="date ' + origin.attr('class').replace('conv-date', '') + '" id="' + origin.attr('id') + '_alt"/>');

                origin.after(alt).after('<label> ' + ($('body').hasClass('en') ? 'Equivalent' : 'معادل') + '</label> ');

                var shamsi = $.calendars.instance('shamsi', 'da');
                var _opt = {};
                if (origin.attr('min')) _opt["minDate"] = origin.attr('min') - 0;
                if (origin.attr('max')) _opt["maxDate"] = origin.attr('max') - 0;
                var fn = window[origin.attr('fn')] || $.noop;
                origin.calendarsPicker($.extend({
                    calendar: shamsi, onSelect: function (v) {
                        fn(v);
                        var v2 = convert('shamsi', '', v)
                        alt.val(v2);
                    }
                }, _opt));

                var calendar = $.calendars.instance('');
                alt.calendarsPicker($.extend({
                    calendar: calendar, onSelect: function (v) {
                        var v2 = convert('', 'shamsi', v)
                        origin.val(v2);
                    }
                }, _opt));

                function convert(name, name2, v) {

                    if (!v) return;
                    v = v + "";
                    var year = parseInt(v.substr(0, 4))
                        , month = parseInt(v.substr(5, 2))
                        , day = parseInt(v.substr(8, 2));

                    var jd = $.calendars.instance(name).newDate(
                        parseInt(year, 10),
                        parseInt(month, 10),
                        parseInt(day, 10)
                    ).toJD();
                    var date = $.calendars.instance(name2).fromJD(jd);

                    var year2 = date.formatYear(),
                        month2 = date.month() + '',
                        day2 = date.day() + '';

                    return '' + year2 + '-' + (month2.length == 1 ? '0' + month2 : month2) +
                        '-' + (day2.length == 1 ? '0' + day2 : day2);
                }
            });

            plus.api.avail('validator');
            var self = this;
            var queries = [];
            var pathQueries = []; // for tree values
            this.el.find(':file').each(function () {
                var _this = $(this);
                $(this).next('input:image').click(function () {
                    _this.click();
                });
                _this.change(function () {
                    var _img = $(this).next().next('img');
                    if (!_img.size()) $(this).next().after($('<img src="../../skin/icon/spacer.gif" style="width:25px; padding:0px 4px 8px;" >'));
                    _img = $(this).next().next('img');
                    _img.attr('src', ($(this).val() != "" ? '../../skin/icon/tick.png' : '../../skin/icon/cross.png'));
                });
            });
			
			this.el.find('[toWords]').on('input', function () {
                var amount = $(this).val(), target = $('#' + $(this).attr('toWords'));
                target.val(plus.util.toWords(amount));
            });
			
            // populate controls
            this.el.find('select[path], input[path].alt-radio').each(function () {
                var $combo = $(this), path = $combo.attr('path');
                var query = { path: path, screen: self.screen, columns: ["ID", $combo.attr('text') || "Name"] };
                query.screen = plus.page.prototype.deserialize().path;
                if ($combo.attr('idFilter')) query.columns = ["ID", "Name", "ParentID"];
                if ($combo.attr('group')) query.columns = ($combo.attr("cols") || "ID,Name,ParentID,ChildNodes").split(",");
                if ($combo.attr('additional')) query.columns.push($combo.attr('additional'));
                if ($combo.attr('filter')) eval('query.filter = [{' + $combo.attr('filter') + '}]'); // ***careful...
                if ($combo.attr('sort')) eval('query.sort = ' + $combo.attr('sort') ); // ***careful...
                if ($combo.attr('commandType') == 'sp') {
                    query.commandType = 'sp';
                    if ($combo.attr('param')) eval('query.param=' + $combo.attr('param') + '');
                    if (query.param["ScreenObjectName"]) query.param["ScreenObjectName"] = query.screen;
                }
                queries.push(query);
            });

            /*
            * Bind Keydown to English-only inputs
            **/
            $(function () {
                var EngKeyCodes = {
                    222: '\'', 65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 71: 'G', 72: 'H', 73: 'I',
                    74: 'J', 75: 'K', 76: 'L', 77: 'M', 78: 'N', 79: 'O', 80: 'P', 81: 'Q', 82: 'R', 83: 'S', 84: 'T', 85: 'U', 86: 'V', 87: 'W', 89: 'Y', 88: 'X', 90: 'Z'
                };
                self.el.find('input.eng-only').bind('keydown', function (e) {
                    var carCode = e.keyCode || e.charCode;
                    if (EngKeyCodes[carCode]) {
                        $(this).val($(this).val() + EngKeyCodes[carCode]);
                        return false;
                    }
                });
            });

            // file
            this.el.find('photo').each(function () {
                var $photo = $(this);
                var _opt = { el: $photo, parent: self, dir: $photo.attr('dir'), maxsize: $photo.attr('maxsize') };
                plus.api.construct('photo', _opt);
            });

            this.el.find('input.tree').each(function () {
                var path = $(this).attr('path'), q = { path: path, limit: 10 }
                //, q2 = { path: path, pk: $(this).val() - 0, elementID: $(this).attr('id') }
                found = false, sorter = $(this).attr('sorter') || "ID", columns = plus.util.replaceAll(($(this).attr("columns") || plus.config.defaultCols.join(",")), " ", "").split(",");
                q["sorter"] = plus.util.replaceAll(sorter, " ", "").split(",");
                q.screen = self.screen;
                //TODO: NEW CHANGE
                if ($(this).attr('filter')) {

                    try {
                        eval('q.filter = [{' + $(this).attr('filter') + '}]');
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
                q["columns"] = columns;
                q.fetchColumns = true;
                //q2["columns"] = columns;
                for (var i = 0; i < queries.length; i++)
                    if (queries[i].path == path) {
                        var old = queries[i];
                        for (var j = 0; j < columns.length; j++) {
                            var _col = columns[j], _colFound = false;
                            for (var k = 0; k < old.columns.length; k++)
                                if (old.columns[k] == _col) _colFound = true;
                            if (!_colFound) queries[i].columns.push(_col);
                        }
                        found = true;
                    }


                if (!found)
                    queries.push(q);
                found = false;

                // for valu path
                //for (var i = 0; i < pathQueries.length; i++) {
                //    if (pathQueries[i].path == path) {
                //        if (!q2.pk && !pathQueries[i].pk)
                //            found = true;
                //    }
                //}
                //if (!found)
                //    pathQueries.push(q2);

            });

            if (this.el.find('.rich').size()) {
                if (!window["Quill"]) $.getScript(plus.api.baseUrl + "../../external/quill/quill.min.js",
                    function () { onSuccess(self) });
                else onSuccess(self);

                function onSuccess(_self) {
                    _self.el.find('.rich').each(function () {
                        new plus.widget.rich({ el: $(this) });
                    });
                }
            }


            this.el.find('.auto').each(function () {
                var opt = { path: $(this).attr('path').split("."), selector: $(this), searchCol: ($(this).attr('searchCol') || "Name") };
                if ($(this).attr('fn') == 'like') opt.like = true;
                if ($(this).attr('onSelect')) opt.onSelect = window[$(this).attr('onSelect')] || $.noop;
                //$(this).autocomplete(opt);
                plus.api.construct("autocomplete", opt);
            });

            this.el.find('.find').each(function () {
                var opt = { el: $(this), searchCol: ($(this).attr('searchCol') || "Name") };
                plus.api.construct("find", opt);
            });

            this.el.find('input.alt-tazkira:text').each(function () {
                var $input = $(this);
                new plus.widget.oldTazkira({ el: $input });
            });

            this.el.find('select.child-select').each(function () {
                var $select = $(this);
                var $parent = $('#' + $(this).attr('parent'));
                new plus.widget.extlist({ el: $select, parent: $parent, screen: self.screen });
            });

            if (queries.length)
                plus.data.ajax({
                    type: 'post',
                    url: plus.config.baseUrl + "json/pull.asmx/Fetch", noLoading: this.el.attr('async') ? this.el.attr('async') : false , async: this.el.attr('async') ? this.el.attr('async') : false, data: plus.json.write({ queries: queries }), success: function (msg) {
                        var response = plus.json.read(msg);
                        for (var i = 0; i < response.length; i++) {
                            var table = response[i], $combo = self.el.find('select[path="' + table.path + '"]').find('option').remove().end()
                                , $tree = self.el.find('input[path="' + table.path + '"].tree'), $radio = self.el.find('input[path="' + table.path + '"].alt-radio');
                            if ($tree.size()) {
                                $tree.each(function () {
                                    // TODO:  NEW CHANGE
                                    var _tree = $(this);
                                    var opt = {
                                        async: !_tree.attr('static'),
                                        url: plus.config.baseUrl + "json/pull.asmx/Fetch",
                                        columns: plus.util.replaceAll((_tree.attr("columns") || plus.config.defaultCols.join(",")), " ", "").split(","),
                                        label: _tree.attr('label') || 'path',
                                        el: _tree, leavesOnly: _tree.attr('leavesOnly'),
                                        path: table.path,
                                        sorter: [_tree.attr('sorter') || "ID"]
                                    };
                                    if (_tree.attr('filter'))
                                        opt.filter = eval("[{" + _tree.attr('filter') + "}]");
                                    plus.api.construct('treeselector', table, opt);
                                    //var treeSelect = new TreeSelector(table.rows, {
                                    //    label: _tree.attr('label'), el: _tree, leavesOnly: _tree.attr('leavesOnly'),
                                    //    sorter: [_tree.attr('sorter') || "ID"]
                                    //});
                                })
                            }
                            // radio buttons
                            if ($radio.size()) {
                                var $rVals = {};
                                for (var f = 0; f < table.rows.length; f++) {
                                    var $rRow = table.rows[f];
                                    $rVals[$rRow[1]] = $rRow[0];
                                }
                                new plus.widget.radio({ el: $radio, values: $rVals });
                                continue;
                            }
                            if (!$combo.size()) continue;
                            // TODO: idFilter...***
                            //var idFilter = !$combo.attr('idFilter') ? function () { return true; } : function (row) {  }
                            if (!$combo.attr('noempty'))
                                $combo.append('<option value="">' + ($combo.attr('emptyText') || "&nbsp;&nbsp;---") + '</option>');
                            if ($combo.attr('group'))
                                for (var j = 0; j < table.rows.length; j++) {
                                    var row = table.rows[j], $el = $combo;
                                    if (row[2] != null) $el = $combo.find('optgroup[value=' + row[2] + ']');
                                    if (row[2] == null && row[3] > 0)
                                        $el.append('<optgroup value="' + row[0] + '" label="' + row[1] + '"></optgroup>');
                                    else
                                        $el.append('<option ext-value="' + row[row.length - 1] + '" value="' + row[0] + '">' + row[1] + '</option>');
                                }
                            else
                                for (var j = 0; j < table.rows.length; j++) {
                                    var row = table.rows[j];
                                    //if (!idFilter(row[0])) continue;
                                    $combo.append('<option ext-value="' + row[row.length - 1] + '" value="' + row[0] + '">' + row[1] + '</option>');
                                }
                        }
                    }
                });

            this.el.find('input.alt-radio:not("[path]")').each(function () {
                var $input = $(this);
                new plus.widget.radio({ el: $input });
            });

            this.el.find('.addable').each(function () {
                var $el = $(this);
                new plus.widget.addable({ el: $el });
            });

            if (!this.opt.keepAction) // in order to keep previous actions you need to set this to true when constructing object
                this.actions.unbind('click');
            if (this.el.attr('parent')) {
                var parent = $('#' + this.el.attr('parent')), pWidget = parent.data('widget');
                this.fkCol = this.el.attr('fkCol') || this.el.attr('parent').split("_")[2] + "ID";
                this.parent = pWidget;
            }

            this.el.validator();

            this.actions.bind('click', function () {
                var act = $(this).attr('action'), vgroup = $(this).attr('vgroup');

                self.validated = self.validate(vgroup);

                // TODO: check if form is dirty...                
                if (self[act]) self[act]();
                return false;
            });

            this.bind(this.record);

            if (this.master) {
                if (!this.el.attr('noBinding'))
                    this.master.observers.add('indexchanged', this.id, function () {
                        var row = self.master.rowOf(self.master.selectedValue);
                        self.bind(row);
                        self.master.el.parents('.grid')[self.master.el.find('tr').size() == 1 && !self.parent ? 'hide' : 'show']();
                    });
                this.master.observers.add('after fetch', this.id, function () {
                    self.master.el.parents('.grid')[self.master.el.find('tr').size() == 1 ? 'hide' : 'show']();
                });
                if (this.parent && this.parent.record)
                    this.search(true);
                if (!this.parent && this.master.el.find('tr').size() < 2)
                    this.master.el.parents('.grid').hide();
                //this.master.observers.add('after init', this.id, function () {
                //    self.master.el.parents('.grid')[self.master.el.find('tr').size() == 1 ? 'hide' : 'show']();
                //});
                //this.master.observers.add('after fetch', this.id, function () {
                //    var row = self.master.rowOf(self.master.selectedValue);
                //    self.bind(row);
                //});
            }

            if (this.parent) {
                this.parent.observers.add('after bind', this.id, function () {
                    self.create(); // clear form
                    self.search(true); // reset list
                });
            }

            // control enter to search a form

            var self = this;
            this.el.find('input.search').bind('keydown', function (e) {
                var code = e.keyCode;
                if (code == 13) {
                    self.search();
                }
            });

        },
        print: function () {
            if (!this.record)
                return plus.widget.error("فورمه خالی است.");
            var path = this.master ? this.master.opt.path.join('_') : this.el.attr('id').substring(2);
            var url = this.actions.parent().find('[action="print"]').attr('postUrl') || 'slip/default';
            //window.open(plus.config.baseUrl + "page/printout/?url=" + url + "&&recordid=" + this.record[0]);
            window.open(plus.config.baseUrl + "page/printout/?url=" + url + '&&recordid=' + this.record[0] + '&&path=' + path + '&&ts=' + (new Date().getTime()), 'Slips', 'toolbar=no,scrollbars=yes,resizable=no,top:200,left=200,width:1200px,height=800px');
        },
        excel: function () {
            if (!this.record)
                return plus.widget.error("فورمه خالی است.");
            var path = this.master ? this.master.opt.path.join('_') : this.el.attr('id').substring(2);
            var act = this.actions.parent().find('[action="excel"]');

            var url = this.actions.parent().find('[action="excel"]').attr('postUrl') || 'slip/default';

            window.open(plus.config.baseUrl + "page/export/?url=" + url + '&&recordid=' + this.record[0] + '&&path=' + path + '&&altPath=' + (act.attr('path') || path) + (act.attr('commandType') ? '&&commandType=sp' : '') + '&&ts=' + (new Date().getTime()),
                'Slips', 'toolbar=no,scrollbars=yes,resizable=no,top:200,left=200,width:1200px,height=800px');
        },
        upload: function () {

            var self = this;
            var _file = this.el.find(':file');
            _file.trigger('change');
            this.validated = this.validated && _file.val() != "";
            if (!this.validated) return;
            if (this.fkCol && this.parent.record == null) {
                plus.widget.error('معلومات فورم اصلی ثبت نگردیده است.');
                return false;
            }

            var file = _file.get(0).files[0];
			if (file.name.split('.').pop() == 'exe') {
				plus.widget.error('File format not supported. Please select a valid file.');
				this.input.val('');
				return false;
			}
			if (file.size > _file.attr('2097152')) {
                plus.widget.error('Size of file is large. Please select smaller file.');
                this.input.val('');
                return false;
            }

            var data = new window.FormData();
            data.append('file', file);
            var values = this.values();
            var pPath = this.parent.path;
            data.append('type', 'file');
            data.append('schema', pPath[1]);
            data.append('object', pPath[2]);
            data.append('selfPath', this.path.join("."));
            data.append('conn', this.parent.path[0]);
            data.append("overwrite", this.record ? 1 : 0);
            //data.append('RecordID', this.record ? values["RecordID"] : this.parent.record[0]);
            data.append('dir', _file.attr('dir'));
            data.append("requery", "1");

            for (_val in values) {

                data.append(_val, values[_val]);
            }

            var _app = this.path[0];
            plus.data.post({
                url: (plus.config.url[_app] || plus.config.baseUrl) + 'handler/upload.ashx',
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                success: function (response) {
                    if (response.val) {//ue) {
                        self.master.update(response.val - 0, true);
                        //self.master.update(response.value - 0, true);
                        //plus.widget.success(response.response);
                    } else {
                        self.record = response.rows[response.rows.length - 1];
                        self.columns = response.columns || self.columns;
                        if (self.master) // bind master grid
                            self.master.add(response.rows[0], true);

                        self.bind(self.record);
                    }
                    if (!self.opt.silent)
                        plus.widget.success(response.message || 'معلومات موفقانه ثبت شد.');

                    plus.widget.success(response.message);
                }
            });

        },
        isDirty: function () {
            if (!this.record) return true;
            var ov = plus.util.arrayToObject(this.record, this.columns), nv = this.values();
            var _dirty = false;

            for (key in nv) {
                _dirty = _dirty && (nv[key] != ov[key])
            }
            return _dirty;
        },
        save: function () {
            if (!this.validated) return;
            if (this.fkCol && this.parent.record == null) {
                plus.widget.error('معلومات فورم اصلی ثبت نگردیده است.');
                return false;
            }
            var query = {}, self = this;
            query.values = this.values();
            query.screen = plus.page.prototype.deserialize().path;
            query.path = this.opt.save || this.opt.path;
            query.type = this.el.attr('post'); // proc || undefined;
            query.requery = this.opt.requery;
            query.fetch = this.opt.fetch ? this.opt.fetch : (this.opt.master ? this.opt.master.opt.path.join(".") : this.path.join("."));
            plus.data.post({
                async: false, url: plus.config.baseUrl + 'json/push.asmx/save', data: plus.json.write({ query: query }),
                success: function (msg) {
                    var response = plus.json.read(msg);
                    if ($.isArray(response)) response = response[0];
                    if (response.error || response.ResponseType != "SUCCESS") {
                        plus.widget.error(response.error || response.response);
                        return false;
                    }
                    if (response.val) {//ue) {
                        self.master.update(response.val - 0, true);
                        //self.master.update(response.value - 0, true);
                        //plus.widget.success(response.response);
                    }
                    else if (!self.opt.requery) {
                        // here bind record by id
                        self.search(true, response.value);
                    } else {
                        self.record = response.rows[response.rows.length - 1];
                        self.columns = response.columns || self.columns;
                        if (self.master) // bind master grid
                            self.master.add(response.rows[0], true);

                        self.bind(self.record);
                        if (self.opt.afterSave) self.opt.afterSave(self);
                    }
                    if (!self.opt.silent)
                        plus.widget.success(response.response || 'معلومات موفقانه ثبت شد.');
                }
            });
        },
        create: function () {
            // reset
            this.record = null;
            //if (this.el.find(':file').size())
            //    this.el.find(':file').val('').trigger('change');
            this.fields.each(function () {
                var fld = $(this), widget = fld.data('widget'), v = "";
                fld.removeClass('invalid');
                // Set value
                if (widget) widget.val(v);
                else if (fld.is(':checkbox')) fld.prop('checked', (v));
                else if (fld.is("input[type=hidden]") && fld.attr("keep")) fld.val(fld.attr("default"));
                else if (fld.is('input, textarea, select')) fld.val(v);
                else fld.html(v);
                if (fld.is('.addable')) {
                    fld.data('ext-widget').clear();
                }
            });
            if (this.observers) {
                this.observers.notify('after create');
                this.observers.notify('after bind');
            }
        },
        fixQuery: function (query) {
            if (this.fkCol && query) {
                var expr = {}, precord = this.parent.record || [-2]; expr[this.fkCol] = precord[0];
                query.filter.push(expr);
            }
        },
        find: function (query) {
            this.fixQuery(query);
            if (this.master) {
                this.master.opt.filter = query.filter;
                this.master.offset = 0;
                this.master.finalized = false;
                this.master.clear();
                this.master.fetch(/*query*/);
                if (this.master.el.find('tr').size() < 2) plus.widget.error('معلومات دریافت نگردید.');
                else this.el.find('.toggler').addClass('expanded');
            } else this.fetch(query);
        },
        search: function (silent, pk) {
            if (this.el.attr('validateSearch') && !this.validated)
                return;
            this.el.find('.invalid').removeClass('invalid');
            var query = { filter: [], param: {} }, isSP = this.el.attr('commandType') == "sp", self = this, prefix = self.el.attr('prefix') || "ux";
            query.screen = plus.page.prototype.deserialize().path;
            if (this.fkCol && this.parent.record == null && !silent) {
                plus.widget.error('معلومات فورم اصلی ثبت نگردیده است.');
                return false;
            }
            if (isSP) query.commandType = "sp";
            if (isSP && this.parent) query.param[this.fkCol] = this.parent.record[0];
            this.el.find('input.search, textarea.search, select.search').each(function () {
                var fld = $(this), w = fld.data('widget'), col = fld.attr('id').substring(prefix.length)
                    , v = w ? w.val() : fld.val(), ew = fld.data('ext-widget');
                if (!v) return;
                var expr = {};
                if (fld.hasClass('alt-tazkira'))
                    expr = w.getExpr(col);
                if (fld.hasClass('addable') && ew && !isSP) {
                    expr.fn = "in";
                    expr.expr = {};
                    expr.expr[col] = ew.val();
                }
                else if (fld.is(':checkbox')) {
                    expr[col] = fld.is(':checked');
                }
                else if (fld.hasClass("date")) {
                    v = plus.date.read(v);
                    expr[col] = v;
                }
                else if (!fld.hasClass('date') && isNaN(v)) {
                    expr.fn = "like";
                    expr.expr = {};
                    expr.expr[col] = v;
                }
                else
                    expr[col] = v;
                query.filter.push(expr);
                if (isSP) query.param[col] = v;
            });
            if (pk)
                query.param["ID"] = pk;
            self.fixQuery(query);
            if (this.master) {
                this.master.opt.filter = query.filter;
                if (isSP) this.master.opt.param = query.param;
                this.master.offset = 0;
                this.master.finalized = false;
                this.master.clear();
                this.master.fetch(/*query*/);
                if (this.master.el.find('tr').size() < 2 && !silent) plus.widget.error('No record found.');
                else this.el.find('.toggler').addClass('expanded');
            } else self.fetch(query);
        },
        values: function () {
            var values = {}, self = this, prefix = self.el.attr('prefix') || 'ux';
            if (this.record) values.ID = this.record[0];
            $.each(this.columns, function () {
                var col = this, fld = self.el.find('#' + prefix + col);
                if (!fld.size()) return;
                var widget = fld.data('widget'), v = null;
                v = widget ? widget.val() :
                    fld.is(':checkbox, :radio') ? !!fld.prop('checked') :
                        fld.is('input, textarea, select') ? fld.val().trim() :
                            fld.html();
                if (v === "") v = null;
                if (fld.hasClass("date")) v = plus.date.read(v);
                values[col] = v;
            });
            if (this.fkCol) values[this.fkCol] = this.parent.record[0];
            if (this.addToValues) this.addToValues(values);
            return values;
        },
        bind: function (record) {
            this.record = record;
            if (record && typeof record == "number") this.fetch({ filter: [{ ID: record }] });
            if (this.opt.beforeBind) this.opt.beforeBind(this.record);
            record = this.record;
            if (!record) return this.create();
            var self = this, prefix = self.el.attr('prefix') || "ux";
            this.fields.each(function () {
                try {
                    var fld = $(this), widget = fld.data('widget'),
                        col = fld.attr('id').substring(prefix.length),
                        index = Array.indexOf(self.columns, col), v = record[index];
                }
                catch (e) {
                    console.log($(this));
                    console.log(e);
                    return;
                }
                if (!v && v !== 0) v = "";
                if (fld.hasClass('date')) v = plus.date.write(v);  //{ if (v.length == 9) v = v.substring(0, 8) + '0' + v.substring(8); v = v.replace(RegExp('/', 'g'), '-'); }
                var t = "";
                if (fld.hasClass('auto')) { fld.val(''); t = record[fld.attr('text') ? Array.indexOf(self.columns, fld.attr('text')) : Array.indexOf(self.columns, col.substring(0, col.length - 2))]; }
                if (fld.hasClass('find')) { var i = fld.attr('t'); t = record[Array.indexOf(self.columns, i)] }
                // Set value
                if (widget) widget.val(v, t);
                else if (fld.is(':checkbox')) fld.prop('checked', (v));
                else if (fld.is('input, textarea, select')) fld.val(v);
                else fld.html(v);
                fld.removeClass('invalid');
                if (fld.is('select')) fld.trigger('change'); // useful for cascading
                //TODO: string formatting...
                if (fld.hasClass('conv-date')) fld.data('calendarsPicker').settings.onSelect(fld.val())
            });

            if (this.observers) this.observers.notify('after bind');
        },
        fetch: function (query, single) {
            query.path = query.path || this.path.join(".");
            query.screen = plus.page.prototype.deserialize().path;
            if (!this.columns) query.fetchColumns = true;
            var self = this;
            plus.data.post({
                async: false, url: plus.config.baseUrl + 'json/pull.asmx/Fetch', data: plus.json.write({ queries: [query] }),
                success: function (msg) {
                    var response = plus.json.read(msg);
                    if ($.isArray(response)) response = response[0];
                    if (!response.rows.length) {
                        plus.widget.error('Record not found.');
                        return false;
                    }
                    self.record = response.rows[response.rows.length - 1];
                    self.columns = response.columns || self.columns;
                    if (self.master) // bind master grid
                        for (var i = 0; i < response.rows.length; i++)
                            self.master.add(response.rows[i]);
                    //self.master.bind(response.rows, true);

                    self.bind(self.record);
                }
            });
        },
        validate: function (group) {
            if (this.el.data('validate')) return this.el.data('validate')(group);
            var self = this, validated = !this.el.find('.invalid').size();

            //this.fields.each(function () {
            //    var field = $(this), _group = field.attr('vgroup'), fn = field.data('validator');
            //    if (group == _group) {
            //        if (fn) validated = validated && fn();
            //    }
            //});
            this.validated = validated;
            return validated;
        },
        dispose: function () {
            this.observers.notify('dispose');
            if (this.master) this.master.observers.removeByOwner(this.id);
            if (this.parent) this.parent.observers.removeByOwner(this.id);
        },
        remove: function () {
            var Confr = confirm('Do you want to delete the following record');
            if (Confr) {

            }
        }
    };


    /**
     * cascading drop down list
     * 
     */
    plus.widget.extlist = function (opt) {
        this.el = opt.el;
        this.parent = opt.parent || $('#' + this.el.attr('parent'));
        var path = this.el.attr("path");
        var _query = { path: path, columns: ["ID", this.el.attr('text') || "Name"], filter: [] };
        var self = this;
        this.target = (self.el.attr('TargetProp') || ""); 
        var event = this.el.attr('event') && this.el.attr('event') == 'yes' ? 'yes' : 'no';

        if (this.el.attr('filter')) eval('_query.filter = [{' + this.el.attr('filter') + '}]');
        _query.filter = _query.filter || [];
        _query.filter.push({});

      
        if (this.el.attr('group')) _query.columns = (this.el.attr("cols") || "ID,Name,ParentID,ChildNodes").split(",");
        if (this.el.attr('additional')) _query.columns.push(this.el.attr('additional'));

        _query.screen = opt.screen;
        _query.filter[_query.filter.length - 1][this.el.attr('fk')] = -1;

        this.parent.change(function () {
            _query.filter[_query.filter.length - 1][self.el.attr('fk')] = //$(this).val();
                self.target == "additional" ? $(this).find('option:selected').attr('ext-value') : $(this).val();

            var _queries = [_query];
            plus.data.ajax({
                type: 'post',
                
                url: plus.config.baseUrl + "json/pull.asmx/Fetch", async: false,
                data: plus.json.write({ queries: _queries }), success: function (msg) {
                    var response = plus.json.read(msg);
                    for (var i = 0; i < response.length; i++) {
                        var table = response[i];
                        var $combo = self.el.find('option').remove().end();
                        if (!$combo.size()) continue;
                        if (!$combo.attr('noempty'))
                            $combo.append('<option value="">' + ($combo.attr('emptyText') || "&nbsp;&nbsp;---") + '</option>');
                        for (var j = 0; j < table.rows.length; j++) {
                            var row = table.rows[j];
                            $combo.append('<option ext-value="' + row[row.length - 1] + '" value="' + row[0] + '">' + row[1] + '</option>');
                        }
                    }
                }
            });
        });

        this.el.change(function () {
            if (event == 'yes') {
                if ($(this).attr('dynamic-form')) {
                    var $form = $('#' + $(this).attr('dynamic-form'));
                    var _fom = $form.data('widget') || new plus.widget.dxform({ el: $form, fk: $(this).val() });
                    //var _fom = new plus.widget.dxform({ el: $form, fk: $(this).val() });

                }
            }
        });
    }
    plus.widget.dxform = function (opt) {
      //  this.el = opt.el;
      //  this.parent = opt.parent || $('#' + this.el.attr("parent"));
      ////  this.prefix = el.attr('prefix');
      //  this.seq = [];
      //  this.id = ("dxform_" + (new Date()).getTime());
        //  this.el.addClass('widget').data('widget', this);

        var el = this.el = opt.el;
        this.fk = opt.fk;
        this.prefix = el.attr('prefix');
        this.seq = [];
        this.id = ("dxform_" + (new Date()).getTime());
        this.el.addClass('widget').data('widget', this);

        var self = this;


        var $datapath = el.attr('data-path');
        var $display = $('#' + el.attr('display-control'));
        var keyupcontrol = el.attr('key-up-control') && el.attr('key-up-control') == 'yes' ? 'yes' : 'no';
        var items = [];
        this.parent = $('#' + el.attr('parent'));
        this.parentform = this.parent.data('widget');

        this.searchcolumn = el.attr('search-column');
        this.dataid = el.attr('data-id');
        this.datavalue = el.attr('data-value');
        this.path = el.attr('path');
        this.prefix = el.attr('prefix');
        this.additional = el.attr('additional');

        this.parentform.observers.add("after save", this.id, function () {
            self.save();
        });
        this.parentform.observers.add("after bind", this.id, function () { self.bind(); });

        el.empty();

        var _q = { path: $datapath, columns: ["ID", "Name", el.attr('additional')], filter: [] };
        if (el.attr('filter')) eval('_q.filter = [{' + el.attr('filter') + '}]');
        _q.filter = _q.filter || [];
        _q.filter.push({});
        _q.filter[_q.filter.length - 1][el.attr('fk')] = this.fk;
        _q.fetchColumns = true;

        var _queries = [_q];

        plus.data.ajax({
            type: 'post',
            url: plus.config.baseUrl + "json/pull.asmx/Fetch", async: false, data: plus.json.write({ queries: _queries }), success: function (msg) {
                var response = plus.json.read(msg);

                var vColIndex = Array.indexOf(response[0].columns, self.datavalue);

                var iColIndex = Array.indexOf(response[0].columns, "ID");

                var aColIndex = Array.indexOf(response[0].columns, self.additional);

                for (var i = 0; i < response.length; i++) {
                    var table = response[i];
                    var row_count = table.rows.length % 2 == 0 ? table.rows.length / 2 : (table.rows.length + 1) / 2;
                    var $start = 0;
                    var $div = [];
                    var rowc = 1;

                    while (rowc <= row_count) {
                        var counter = 1;
                        $div.push('<div class="div-row">');
                        for (var r = $start; r < table.rows.length && counter <= 2; r++) {
                            var row = table.rows[r];
                            items[r] = row;

                            $div.push('<label>' + row[1] + ' </label><input id="' + self.prefix + row[iColIndex] + '" index = "' + r + '" attribute ="' + row[iColIndex] + '"  additional= "' + row[aColIndex] + '" class="form-input" type="text"/>');

                            $start++;
                            counter++
                        }
                        $div.push('</div>');

                        rowc++;
                    }

                    el.append($div.join(" "));
                }
            }
        });

        if (keyupcontrol == 'yes') {
            el.find('input:text').each(function () {
                $(this).keyup(function () {
                    if ($(this).attr('additional') == 'true') {
                        var index = $(this).attr('index') - 0;
                        self.seq[index] = $(this).val().length > 0 ? $(this).val() : null;
                        if ($display) {
                            $display.val(self.seq.filter(function (i) {
                                if (i != null || i != "" || i != " ")
                                    return i != null;
                            }).join("|"));
                        }
                    }
                });
            });
        }



    }

    plus.widget.dxform.prototype = {
        val: function (v) {

        }
    }

    plus.widget.radio = function (opt) {
        this.el = opt.el;
        var rVals = opt.values;
        if (!rVals) {
            rVals = [];
            eval("rVals=" + (this.el.attr('opt') || " ['No','Yes'] "));
        }
        if ($.isArray(rVals)) {
            var clone = {};
            for (var i = 0; i < rVals.length; i++)
                clone[rVals[i]] = i;
            rVals = clone
        }
        //this.values = rVals;
        this.group = $('<div class="radio-group ' + (this.el.attr('class') || '') + '" style="' + (this.el.attr('style') || '') + '" name="' + this.el.attr('id') + '"></div>');
        this.el.hide().after(this.group);
        var onChange = window[this.el.attr("fn")] || $.noop;
        for (key in rVals) {
            var node = $('<input type="radio" name="' + this.el.attr('id') + '" id="' + this.el.attr('id') + '_' + rVals[key] + '" value="' + rVals[key] + '" class="radio-inline" />');
            //this.group.append('<span class="radio-label">' + key + '</span>');
            this.group.append('<label class="radio-label" for="' + this.el.attr('id') + '_' + rVals[key] + '">' + key + '</label>');
            this.group.append(node);
            node.change(onChange);
        }
        //for (var i = this.values.length-1; i >= 0; i--) {
        //    var node = $('<input type="radio" name="' + this.el.attr('id') + '" value="' + i + '" class="radio-inline" />');
        //    this.group.append('<span class="radio-label">' + this.values[i] + '</span>');
        //    this.group.append(node);
        //}

        this.el.data('widget', this);
    };
    plus.widget.radio.prototype = {
        val: function (v) {
            if (v !== undefined) {
                v = v + "";
                v = v == "false" || !v ? 0 : v == "true" ? 1 : v;
                this.group.find('input[value="' + v + '"]').prop('checked', true);
                return v;
            }
            v = 0;
            this.group.find('input').each(function () {
                if ($(this).prop('checked') == true) v = $(this).val();
            });
            return v;
        }
    }
    plus.widget.oldTazkira = function (opt) {
        this.el = opt.el;
        var group = $('<div class="control-group"></div>');
        this.el.hide().after(group);
        group.append('<label  style="min-width:60px">شماره صکوک / دصکوک شمیره</label>');
        this.serial = $('<input type="text" rule="{fn:\'required\'}" vgroup="' + this.el.attr('vgroup') + '" class="w100" />').appendTo(group);
        group.append('<label  style="min-width:60px">جلد / ټوک</label>');
        this.juld = $('<input type="text" rule="{fn:\'required\'}" vgroup="' + this.el.attr('vgroup') + '" class="w100" />').appendTo(group);
        group.append('<label  style="min-width:60px">صفحه / پاڼه</label>');
        this.page = $('<input type="text" rule="{fn:\'required\'}" vgroup="' + this.el.attr('vgroup') + '" class="w100" />').appendTo(group);
        group.append('<label style="min-width:60px">شماره ثبت/د ثبت شمېره</label>');
        this.No = $('<input type="text" rule="{fn:\'integer\'},{fn:\'required\'}" vgroup="' + this.el.attr('vgroup') + '" class="w100" />').appendTo(group);

        this.el.data('widget', this);
    };
    plus.widget.oldTazkira.prototype = {
        getExpr: function (col) {

            var v = "{S:'%" + (this.serial.val().trim() != "" ? this.serial.val().trim() : "") + "'," +
                "J:'%" + (this.juld.val().trim() != "" ? this.juld.val().trim() : "") + "'," +
                "P:'%" + (this.page.val().trim() != "" ? this.page.val().trim() : "") + "'," +
                "N:'%" + (this.No.val().trim() != "" ? this.No.val().trim() : "") + "'}";
            var expr = {};
            expr.fn = "endswith";
            expr.expr = {};
            expr.expr[col] = v;
            return expr;
        },
        val: function (v) {
            if (v !== undefined) {
                v = v + "";
                // clear
                this.serial.val('');
                this.juld.val('');
                this.page.val('');
                this.No.val('');
                var v2;
                try {
                    eval('v2 = ' + v);
                    this.serial.val(v2.J.replace(',', ''));
                    this.juld.val(v2.J.replace(',', ''));
                    this.page.val(v2.P.replace(',', ''));
                    this.No.val(v2.N.replace(',', ''));
                }
                catch (e) {
                    v2 = v.split(" ");
                }

                // set
                return v;
            }

            var vals = [this.serial.val(), this.juld.val(), this.page.val(), this.No.val()];
            if (!this.juld.val().trim() && !this.page.val().trim() && !this.No.val().trim()) return '';
            // get
            v = plus.util.format("{S:'{SerialID}',J:'{JuldID}',P:'{PageID}',N:'{NoID}'}", vals, { SerialID: 0, JuldID: 1, PageID: 2, NoID: 3 });
            return v;
        }
    }

    plus.widget.rich = function (opt) {
        this.el = opt.el;
        var wrapper = $('<div class="div-rich-wrapper"></div>');
        this.el.hide().after(wrapper);
        this.editor = $('<div class="editor"></div>').appendTo(wrapper);

        var toolbarOptions = [
            ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
            //['blockquote', 'code-block'],
            //[{ 'header': 1 }, { 'header': 2 }],               // custom button values
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
            [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
            [{ 'direction': 'rtl' }],                         // text direction
            //[{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['clean']                                         // remove formatting button
        ];

        this.quill = new Quill(this.editor.get(0), {
            modules: {
                toolbar: toolbarOptions
            }
            , placeholder: this.el.attr('placeholder')
            , theme: 'snow'
        });

        this.el.data('widget', this);
    }
    plus.widget.rich.prototype = {
        val: function (v) {
            v = v !== undefined ? v : this.quill.root.innerHTML;
            this.quill.root.innerHTML = v;
            return v;
        }
    }

    plus.widget.addable = function (opt) {
        this.opt = opt = opt || {};
        this.el = opt.el;
        this.isText = !!opt.isText;

        this.values = [];

        this.widget = this.el.data('widget');

        this.el.data('ext-widget', this);
        this.init();
    };
    plus.widget.addable.prototype = {
        init: function () {
            var display = $('#' + this.el.attr('display'));
            if (!display.size()) {
                display = $('<label class="noempty"></label>');
                el.before(display);
            }
            this.display = display;

            var iconPlus = $('<img class="plus" src="' + plus.config.baseUrl + 'skin/icon/plus-32.png" />');
            this.el.after(iconPlus);

            var self = this;
            iconPlus.click(function () {
                self.add();
            });
        },
        add: function () {
            var self = this;
            var v = (this.widget || this.el)["val"]();
            if (v == "") {
                plus.widget.error("لطفاٌ یکی از گزینه ها را انتخاب نمایید.");
                return;
            }
            var t = this.widget ? this.el.val() : this.el.find('option:selected').text();
            if (Array.indexOf(self.values, v) > -1) {
                plus.widget.error("در لست از قبل موجود است.");
                return;
            }

            if (this.values.length == 0) {
                var l = this.el.prev('label:first').text();

                this.display.append("<h1 style='font-size: 12px;border-bottom: 1px solid; margin-bottom: 10px; padding-bottom: 0px;'>" + l + "</h1>");
            }

            this.values.push(v);

            var node = $('<span class="closable" val="' + v + '">' + t + '<img src="' + plus.config.baseUrl + 'skin/icon/close4.png" class="remove"></span>');
            node.find('.remove').click(function () {
                self.remove(node);
            });
            this.display.append(node);
        },
        remove: function (item) {
            var v = item.attr('val');
            this.values.splice(Array.indexOf(this.values, v), 1);
            if (this.values.length == 0) {
                item.siblings().remove();
            }
            item.remove();
        },
        val: function (v) {
            return this.values;
        },
        clear: function () {
            this.values = [];
            this.display.html('');
        }
    }
})();