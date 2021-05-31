/*
* plus.grid plugin (extended from plus.list)
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

    plus.page = function (opt) {
        opt = opt || {};
        this.body = opt.body = opt.body || $('body');
        this.init();
    };

    plus.page.prototype = {
        init: function () {

            plus.api.avail('security');
            //var hash = window.location.hash.replace('#', '');
            //this.opt = this.deserialize(hash);
            //plus.security.AuthorizeScreen(this.opt.app, this.opt.screen);
            plus.config.setCalendar(plus.config.current);
            $('#left-bar').unbind('mouseover').mouseover(function () {
                $(this).data('status', 'hover');
            })
            $('#left-bar').unbind('mouseout').mouseout(function () {
                $(this).data('status', 'out');
                setTimeout(function () { if ($('#left-bar').data('status') === 'out') $('#left-bar').animate({ 'left': '-226px' }, 250) }, 15000)
            });

            $('#ribbon').click(function () {
                var l = $('#left-bar').css('left') == '0px' ? '-226px' : '0';
                $('#left-bar').animate({ 'left': l }, 100);
            });

            var self = this;
            window.onhashchange = function () {
                self.hashChanged();
            };

            self.hashChanged();
            var detail = plus.security.getDetail("detail");
            $('[id="user.detail"]').append(detail.FullName + "<br /><span style='font-size:0.9em; color:#415560; position:relative; top:-10px;'> " + (detail.Institution || "") + "</span>");


            //TODO: window.resize...
        },
        prepare: function (opt) {
            opt = opt || this.opt;
            var self = this;
            var screen = opt.append && opt.subpath ? opt.subpath : opt.path;
            $('.subscreen .widget').each(function () { var widget = $(this).data('widget'); if (widget && widget.dispose) widget.dispose(); });
            $('.subscreen').remove();
            //var reserver = opt.subscreen;
            //opt.reserve = null;
            //if (opt.subscreen && !$('.div-form').size()) (opt.reserve = opt.subscreen) && (opt.subscreen = undefined)
            if (!opt.append)
                $('#header').siblings().not('#left-bar, .div-footer, .loading, #cover, .head-spacer').remove();

            //var url = plus.config.baseUrl + "page/templ/" + opt.app + "/" + (opt.append && opt.subpath && opt.path ? opt.path : "") + screen + ".html";
            var url = plus.config.baseUrl + "security/service/ScreenProvider.ashx?path=" + screen;
            var _cuList = $('#uxSidebarUL li.selected');
            var html = opt.append && _cuList.data('html') ? _cuList.data('html') : plus.templ.get(url);
            //html = plus.templ.get(url);
            if (_cuList.size()) _cuList.data('html', html)

            var footer = $('#div-footer').remove()
            if (opt.append)
                html = $('<div class="subscreen"></div>').append(html);
            //$('body')
            this.body.append(html).append(footer);

            plus.config.setCalendar($('.div-form:first').hasClass('gregorian') ? 0 : plus.config.current);
            plus.config.defaultCols = "ID,Dari,ParentID,ChildNodes".split(",");

            if (!opt.append && $('#sidebar, .sidebar').size() && !$('#sidebar-css').size())
                $('#page-css').parent().append('<link href="' + plus.config.baseUrl + 'skin/style/sidebar.css" rel="stylesheet" id="sidebar-css" />');

            var subscreens = opt.append ? { rows: [] } : plus.security.getSubScreen(this.opt.path);
            var templ = '<li class="list" id="{id}" subpath="{Subpath}" ><a title="{Description}"><span class="embed">{Name}</span></a></li>';
            var indexes = { id: 0, Name: 1, Description: 2, Subpath: 15, Icon: 7 }

            for (var i = 0; i < subscreens.rows.length; i++) {
                var row = subscreens.rows[i];
                if (i > 0 && row[3] != subscreens.rows[i - 1][3]) {
                    $('#uxSidebarUL li:last').addClass('before-sep');
                    $('#uxSidebarUL').append('<li class="li-separator"><div></div></li>');
                }
                if(plus.config.translate)
                    row[indexes.Name] = plus.util.Translate(row[indexes.Name]);
                $('#uxSidebarUL').append(plus.util.format(templ, row, indexes));
            }
            if (subscreens.rows.length) {
                $('#uxSidebarUL li.list').bind('click', function () {
                    var $list = $(this);

                    if ($list.hasClass('selected')) return;

                    $list.parents().find('.list.selected').removeClass('selected');
                    $list.addClass('selected');
                    var _hash = self.deserialize();
                    _hash["subpath"] = $list.attr('Subpath');
                    //if ($list.attr('path') != "") _hash["path"] = $list.attr('path');
                    _hash["append"] = true;
                    window.location.hash = self.serialize(_hash);
                    $('.div-form:first .collapsable').attr('src', "../../skin/icon/add121.png");
                    $('.div-form:first .div-detail').hide();
                });
                if (opt.subscreen && !opt.append) $('#uxSidebarUL li[name="' + opt.subscreen + '"]').trigger('click');
                //if (opt.reserve) $('#uxSidebarUL li[name="' + opt.reserve + '"]').trigger('click');
                if (!$('.div-form').size()) $('#uxSidebarUL li.list:first').trigger('click');
            }

            $('.div-form:not(.widget)').each(function () {
                // find grid first...
                var master = constructGrid($(this)/*, columns=[]*/);

                plus.api.construct('form', { el: $(this), record: self.opt.recordid, master: master, columns: master ? master.columns : undefined });
                /*master.callback('itemClicked', function (target, id) {
                    master.select(id);
                });*/
                //if (master && master.opt.load ) {
                //    $(this).find('[action="search"]').trigger('click');
                //}
                var _self = $(this)
                _self.find('.collapsable').click(function () {
                    _self.find('.div-detail').toggle();
                    var src = $(this).attr('src') == "../../skin/icon/minus65.png" ? "../../skin/icon/add121.png" : "../../skin/icon/minus65.png";
                    $(this).attr('src', src);
                });
                $(this).find('.toggler').unbind('click').bind('click', function () {
                    $(this).toggleClass('expanded');
                    $(this).parent().next('.grid').toggle();
                });
                //master.el.find('tr:nth(2) td:first').trigger('click');
            });
            if ($('.div-form').size() && $('.search-bar').size()) {
                
                $('.search-bar #uxCriteria').unbind('keypress').bind('keypress', function (e) {
                    
                    var code = e.keyCode, form = $('.div-form:first').data('widget'), v = $(this).val(),
                        searchCol = $(this).attr('searchcol');

                    if (code == 13) {
                        if (v == "") return plus.widget.error('Please enter a value to search');
                        var query = { filter: [{ fn: 'like', expr: {} }] };
                        query.filter[0].expr[searchCol] = v;
                        form.find(query);
                        return false;
                    } return true;
                });
            }

            function constructGrid(el/*, columns*/) {
                if (!el.find('grid').size()) return null; //{ observers: { add: function () { }}, el: null};
                var grid = $('<div class="div-grid grid"></div>'),
                    origin = el.find('grid').after(grid).remove(),
                    load = origin.attr('noload') === "false",
                    fn = window[origin.attr('onItemClick')],
                    path = origin.attr('path') ? origin.attr('path').split(".") : origin.attr('id').substring(2).split("_"),
                    noHeader = !!origin.attr('noHeader'),
                    isSP = el.attr('commandType') == "sp";
                if (origin.attr('style'))
                    grid.attr('style', origin.attr('style'));
                grid.addClass('widget').attr('id', origin.attr('id'));
                grid = $('<table></table>').appendTo(grid);
                grid = $('<tbody></tbody>').appendTo(grid);
                // construct header
                var header = $('<tr></tr>').appendTo(grid);
                var indexes = { id: 0 }, templ = '<tr class="grid-row">'
                origin.find('column').each(function () {
                    var col = $(this).attr('id'), caption = $(this).attr('caption') || plus.util.pascalToSpace(col), index = $(this).attr('index');
                    indexes[col] = index - 0;
                    //columns[index - 0] = col;
                    //if ($(this).hasClass('checkable')) templ += '<td><input type="checkbox" class="checkable {' + col + '}"/></td>';
                    if ($(this).hasClass('checkable')) templ += '<td><img style="width:20px; float:none;" class="checkable" src="'+plus.config.baseUrl+'skin/icon/checked_{' + col + '}-32.png" /></td>';
                    else if ($(this).hasClass('strength'))
                        templ += '<td><span class="PROGRESS_{' + col + '}">{' + col + '}</span></td>'
                    else if ($(this).hasClass('checkBox'))
                        templ += '<td><img style="width:20px; float:none;" src="' + plus.config.baseUrl + 'skin/icon/checked_{' + col + '}-32.png" /></td>';
                    else templ += '<td>{' + col + '}</td>';
                    $('<th>' + caption + '</th>').appendTo(header);
                });
                
                if (origin.find('command').length) header.append('<th>&nbsp;</th>') && (templ += "<td>");
                origin.find('command').each(function () {
                    var command = $(this);
                    templ += '<img src="' + command.attr('src') + '" action="' + command.attr('action') + '"/>';
                });
                if (origin.find('command').length) templ += '</td>';
                templ += '</tr>';
                function buildQuery(list) {
                    var query = {};
                    query.limit = list.limit;
                    query.offset = list.offset;
                    query.screen = screen;
                    query.path = path;
                    if (list.opt.sort)
                        query.sort = list.opt.sort;
                    query.fetchColumns = !list.ready;
                    if (list.opt.paging) query.paging = list.paging;
                    var filter = list.opt.filter;
                    if (list.opt.param) query.param = list.opt.param;
                    if (filter) {
                        if (filter instanceof Function)
                            filter(query, self)
                        else query.filter = filter;
                    }
                    if (isSP) query.commandType = "sp";
                    return { queries: [query] };
                }
                if (noHeader) header.remove();
                var opt = {
                    path: path, noFetch: origin.attr('noFetch'), callbacks: {
                        load: [function (__self) {
                            //alert(__self.id);
                            __self.el.find('tr.grid-row:first').trigger('click');
                        }]
                    },
                    el: grid, templ: templ, limit: origin.attr('limit') || 10 , service: 'json/pull.asmx/Fetch', paging: !!origin.attr('paging'),
                    /*indexes: indexes,*/ buildQuery: buildQuery, scroller: grid.parents('div:first')
                }
                if (origin.attr('sort')) {
                    var objSort = {};
                    eval("objSort = " + origin.attr('sort'));
                    opt.sort = objSort;
                }

                if (!origin.attr('load'))
                    opt.filter = [{ "ID": 0 }];
                //if (origin.attr('noLomit')) { opt.limit = null; }

                var _grid = plus.api.construct("list", opt);
                _grid.callback('itemClicking', function (cmd, collect) {
                    if (!(cmd instanceof jQuery)) cmd = $(cmd);
                    if (!cmd.is("IMG")) return;
                    if (cmd.attr('action') == 'remove')
                        collect.exit = !confirm("آیا مطمئن هستید تا معلومات حذف شود.");

                });
                if (fn) _grid.callback('itemClicked', fn);
                _grid.callback('itemClicked', function (cmd, collect) {
                    if (!(cmd instanceof jQuery)) cmd = $(cmd);
                    if (!cmd.is("IMG")) return;

                    var _recordID = cmd.parents('tr').attr('rowid')
                    if (cmd.attr('action') == 'remove') {
                        plus.data.post({
                            service: 'json/push.asmx/remove',
                            data: plus.json.write({
                                query: {
                                    path: path[2][0] == 'v' ? [path[0], path[1], path[2].substring(1)] : path,
                                    RecordID: _recordID
                                }
                            }),
                            success: function (msg) {
                                //_grid.observers.notify('removed');
                                plus.widget.success(msg.d);
                                cmd.parents('tr').remove();
                            }
                        });
                    }
                });
                opt.el.data('widget').observers.add('indexchanged', function () {
                    var $this = opt.el.data('widget'), $grid = $this.el.parents('.grid:first');
                    var toScroll = $grid.find('tr:nth(' + $this.selectedIndex + ')').offset().top - ($grid.height() + $grid.offset().top + 5) + $grid.find('tr:first').height();
                    if (toScroll > 0)
                        $grid.scrollTop(toScroll);
                    //var current = $this.opt.scroller.scrollTop();
                    //var visible = -$this.el.find('tr:first').height() + $grid.offset().top + $grid.height() + $grid.scrollTop()
                    //if (current > visible)
                    //$grid.scrollTop(current - (visible + 4))
                });

                delete origin;
                return grid.data('widget');

            }
            // do it in form
            //$('.date').Zebra_DatePicker();

        },
        /**
        * On hash change:
        * - Check authorization
        * - prepare form....
        ****/
        hashChanged: function () {
            this.prevOpt = this.opt;
            this.opt = this.deserialize();
            if (this.opt.append && this.prevOpt == null) delete this.opt.append;
            //this.setCookie("hashValue‍", window.location.hash);
            if (this.prevOpt == null || (this.prevOpt.path != this.opt.path || (this.opt.append && this.opt.subpath))) {
                // recheck security
                plus.security.AuthorizeScreen(this.opt.path);
                this.prepare(this.opt);
            }
        },
        deserialize: function (hash, delimiter) {
            delimiter = delimiter || '&&';
            hash = hash || window.location.hash.replace('#', '');
            var hashArray = hash.split(delimiter);

            var opt = {};
            for (var i = 0; i < hashArray.length; i++) {
                var optArray = hashArray[i].split(':=::');
                opt[optArray[0].toLowerCase()] = optArray[1] /*+ (optArray.length > 2 ? "=" : "")*/;
            }

            return opt;
        },
        serialize: function (hash, delimiter) {
            delimiter = delimiter || '&&'
            var _serialized = "ts:=::" + (new Date()).getTime();
            for (key in hash)
                if (key != "ts")
                    _serialized += "&&" + key + ":=::" + hash[key];
            return _serialized;
        },
        setCookie: function (name, value) {
            var d = new Date();
            d.setTime(d.getTime() + (24 * 60 * 60 * 1000)); // one day
            var expires = "expires=" + d.toUTCString();
            document.cookie = name + "=" + value + "; " + expires;
        },
        getCookie: function (name) {
            name = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1);
                if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
            }
            return "";
        }
    };

})();