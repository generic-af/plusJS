/*
* plus javascript library v0.1.0
* http://asanwazifa.com
* 
* requires jQuery.js v2.1.3 or higher http://jquery.com/
* tested with jQuery v2.1.3
*
* Copyright 2015 Khawarsoft business and trade limited liability corporation
* Released under the Khawarsoft Co API license
* http://api.asanwazifa.com/license
*
* Date: 2015-06-02 23:31:16 GMT+0430 (Afghanistan Standard Time)
* 
* @author: mushfiqullah.akhundzada@gmail.com
* 
**/
//(function (global, factory) {
//}(typeof window !== "undefined" ? window : this, function (window, noGlobal) { }));

// global namespace for plus
var plus = window.plus = {};
(function () {
    var _version = '1.0.0.001';
    plus = {
        /*
        * Prepares jQuery and JavaScript objects for plus apis and plugins
        * extends jQuery.fn and jQuery with required functions
        **/
        init: function (opt) {
            // reset oldjQuery browser
            (function () {
                function uaMatch(ua) {
                    ua = ua.toLowerCase();

                    var match = /(webkit)[ \/]([\w.]+)/.exec(ua) || /(opera)(?:.*version)?[ \/]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || !/compatible/.test(ua) && /(mozilla)(?:.*? rv:([\w.]+))?/.exec(ua) || [];

                    return {
                        browser: match[1] || "",
                        version: match[2] || "0"
                    };
                };
                jQuery.browser = {};

                var browserMatch = uaMatch(navigator.userAgent);
                if (browserMatch.browser) {
                    jQuery.browser[browserMatch.browser] = true;
                    jQuery.browser.version = browserMatch.version;
                }
                // Deprecated, use jQuery.browser.webkit instead
                if (jQuery.browser.webkit) {
                    jQuery.browser.safari = true;
                }
            })();

            opt = opt || {};
            // Extend jQuery and Array
            (function () {
                jQuery.fn.extend({
                    // Coalesce
                    or: function () {
                        if (this.length)
                            return this;
                        return $.or.apply(null, arguments);
                    },
                    // Action callbacks
                    visible: function (flag, duration, callback) {
                        if (flag === undefined)
                            return this.is(':visible');
                        return this.each(function () {
                            $(this)[flag ? 'show' : 'hide'](duration, callback);
                        });
                    },
                    autocomplete: function (opt) {
                        var els = $(this);
                        for (var i = 0; i < els.length; i++) {
                            var el = $(els[i]);
                            plus.api.construct('autocomplete', $.extend(opt, {
                                selector: el
                            }));
                        }
                    }
                });

                jQuery.extend({
                    or: function () {
                        for (var i = 0; i < arguments.length; i++) {
                            var v = arguments[i];
                            if (!v)
                                continue;
                            if (v instanceof Function)
                                return v();
                            if (!(v instanceof jQuery))
                                v = $(v);
                            if (v.length > 0)
                                return v;
                        }
                        return new jQuery([]);
                    },
                    exist: function ($el) {
                        return $el && $el.length > 0;
                    }
                });

                Array.remove = function (a, from, to) {
                    if (typeof from != "number") from = Array.indexOf(a, from);
                    var rest = a.slice((to || from) + 1 || a.length);
                    a.length = from < 0 ? a.length + from : from;
                    return a.push.apply(a, rest);
                }

                Array.removeIf = function (a, fn) {
                    for (var i = 0, len = a.length; i < len; i++) {
                        if (fn(a[i])) {
                            Array.remove(a, i);
                            i = i - 1; len = len - 1;
                        }
                    }
                }
                Array.indexOf = function (a, item, i) {
                    i || (i = 0);
                    var length = a.length;
                    if (i >= 0)
                        for (; i < length; i++)
                            if (a[i] === item) return i;
                    return -1;
                }
                if (!Array.prototype.indexOf)
                    Array.prototype.indexOf = function (item, i) {
                        return Array.indexOf(this, item, i);
                    };
            })();
            if (opt.url) plus.config.baseUrl = opt.url;
            plus.json.init();
        },

        config: {
            baseUrl: 'http://localhost/apis',
            url: {},
            current: 1,
            defaultCols: ["ID", "Name", "ParentID", "ChildNodes"],
            lang: [
                { title: "English", symbol: 'en', dateFormat: "yyyy-mm-dd" },
                { title: "Dari", symbol: 'da', alt: 3, calendar: 'shamsi', dateFormat: "yyyy-mm-dd", separator: " ," },
                { title: "Pashto", symbol: 'pa', alt: 3, calendar: 'shamsi', dateFormat: "yyyy-mm-dd", separator: " ," }
            ],
            setCalendar: function (i) {
                var l = plus.config.lang[i];
                var cal = $.calendars.instance(l.calendar, l.symbol);
                $.calendars.picker.setDefaults({ calendar: cal, dateFormat: l.dateFormat });
                $.calendars.picker.setDefaults($.calendars.picker.regional[l.symbol === 'en' ? '' : l.symbol]);
                plus.config.current = i;
                plus.config.defaultCols = "ID,Name,ParentID,ChildNodes".replace("Name", l.title).split(",");
            },
            translate: false
        },
        /*
        * User this object for pages... with hash 
        **/
        templ: {
            // plus.templ.get('http://abcs.html', false)
            get: function (url, nocache, silent) {
                if (url instanceof jQuery) return url;
                if (url instanceof Object === false && url[0] == "<") return url;
                url = url + (nocache ? ("?ts=" + (new Date()).getTime()) : "");
                var response;//= $.get(url);
                plus.data.get({ url: url, async: false, contentType: null, dataType: null, noLoading: !!silent, success: function (msg) { response = msg; } });
                return typeof response === "string" ? response : response.responseText;
            }
        },
        meta: {

        },
        /*
        * common factory functions for all plus javascript APIs
        **/
        api: {
            baseUrl: 'http://localhost/apis/',
            repository: 'http://localhost/apis/', // useful for older versions
            getVersion: function () { return _version; },
            path: function () { return plus; }, // useful if all plugins / apis are inside another object of Plus for example plus.api.organogram
            /*
            * Makes document available for an script
            * - Checks availability of an Plus javascript API/plugin and includes to page if API was not found in memory
            **/
            avail: function (plugin, version, success) {
                if (version instanceof Function) {
                    success = version;
                    version = null;
                }
                success = success || $.noop;
                version = version || _version;
                if (!plus[plugin])
                    $.ajax({
                        async: false,
                        url: plus.api.baseUrl + 'plus.' + plugin + '-v' + version + '.js',
                        dataType: "script", success: success
                    });

                //while (!plus[plugin] && !loaded && plugin == 'form')
                //    if (plus[plugin]) load = true;
                ////if (!plus[plugin]) widget.error('saman');
            },
            /*
            * global constructor for all Plus plugins
            **/
            construct: function (plugin, /*version,*/ opt, callback) {
                plus.api.avail(plugin/*, version*/);
                var api = plus.api.path();
                //if (!opt) source = opt;
                return new api[plugin](opt, callback);
            }
        },
        widget: {
            cover: function (flag) { $.or('#cover', function () { return $('<div id="cover"></div>').appendTo('body') })[flag ? 'show' : 'hide'](); },
            loading: function (flag, msg) { msg = msg || "loading..."; plus.widget.cover(flag); $.or('.loading, #loading', function () { return $('<div class="loading"></div>').appendTo('body'); }).html(msg)[flag ? 'show' : 'hide'](); },//'fadeIn' : 'fadeOut'](); },
            message: function (type, msg, body) {
                if (!msg) return;

                if ($('#left-bar').size()) {
                    $('#left-bar').animate({
                        'left': '0px'
                    }, 150, function () {
                        $('#left-bar').trigger('mouseout');
                    });
                    var cTime = (function () {
                        var cDate = new Date(), h = cDate.getHours(), m = ' AM';
                        if (h >= 12) (h = h > 12 ? h - 12 : 12) && (m = ' PM');
                        return ('0' + h).slice(-2) + ":" + ('0' + cDate.getMinutes()).slice(-2) + m
                    })();

                    var li = $('<li></li>').hide();
                    $('#left-bar > ul').prepend(li);
                    var p = $('<p></p>').appendTo(li).addClass(type);
                    msg = "<span class='time'>" + cTime + "</span><bdi>" + msg +"</bdi>";
                    p.html(msg);
                    li.css({ 'position': 'absolute', 'bottom': '0' }).show().animate({ "bottom": $(window).height() - 140/*"+=200"*/ }, 500, function () {
                        li.css({ 'position': '' });
                    })
                    return;
                }

                body = body || $('body');
                var el = $.or('.message', function () { return $('<div class="message"></div>').appendTo('body'); });
                el.addClass(type).html(msg).fadeIn().delay(5000).fadeOut('slow');
            },
            warn: function (msg, body) { plus.widget.message('warn', msg, body) },
            error: function (msg, body) { plus.widget.message('error', msg, body) },
            success: function (msg, body) { plus.widget.message('success', msg, body) },
            confirm: function (msg, body, fn) {
                plus.widget.cover(true);
                if (!fn) {
                    fn = body;
                    body = $('body');
                }
                var _confirm = $('<div class="div-form dialog message"></div>').appendTo(body);
                _confirm.append("<h2>" + msg + "</h2>");
                _confirm.append('<div class="div-form-control"><input action="OK" value="بلی" type="submit">&nbsp;<input action="close" value="فسخ" type="submit"></div>');
                _confirm.find('[action="close"]').click(function () {
                    plus.widget.cover(false);
                    _confirm.remove();
                });
                _confirm.find('[action="OK"]').click(function () {
                    plus.util.invoke(fn);
                    plus.widget.cover(false);
                    _confirm.remove();
                });
            }
        },
        json: {
            /**
             * Initialize the JSON support.
             */
            init: function () {
                if (!window.JSON2) return;
                // In case JSON is supported natively by the browser
                if (!window.JSON) {
                    window.JSON = JSON2;
                    window.JSON.parse = function (data) { return (new Function("return " + data))(); };
                }
                // Native JSON in firefox converts dates using timezones, so we use a custom formatter
                window.JSON.stringify = JSON2.stringify;
            },

            /**
             * Read JSON data from the given string by by parsing it returning a javascript value.
             * @param {string} s
             */
            read: function (s) { return JSON.parse(s.d); },

            /**
             * Converts the given value into string containing data in JSON format.
             * @param {Object} v
             */
            write: function (v) { return JSON.stringify(v); }
        },
        date: {
            calendar: function () {
                //return $.calendars.instance('');//$.calendars.instance('shamsi', 'da');
                return plus.config.current ? $.calendars.instance('shamsi', 'da') : $.calendars.instance('');
            },
            read: function (v, format) {
                if (!v) return v;
                var j = v ? v instanceof Date ? v :
                    plus.date.calendar().parseDate(format || "yyyy-mm-dd", v.substring(0, 10)).toJSDate() : null;
                return j.getFullYear() + '-' + (('0' + (j.getMonth() + 1)).slice(-2)) + '-' + (('0' + (j.getDate())).slice(-2));
            },
            readAsDate: function (v, format) {
                return v ? v instanceof Date ? v :
                    plus.date.calendar().parseDate(format || "yyyy-mm-dd", v.substring(0, 10)).toJSDate() : null;
            },
            write: function (v) {
                if (!v) return "";
                v = new Date(v);
                return plus.date.calendar().fromJSDate(v).formatDate("yyyy-mm-dd");
            }
        },
        /*
        * Utility functions that are commonly used in most of Plus APIs.
        * TODO: move these functions to jQuery object to be centralized
        **/
        util: {
            Translate: function (t) {
                var d = [];
                (t instanceof Array) ? d = t : d.push(t);
                try {
                    plus.data.post({
                        service: "json/pull.asmx/Translate",
                        noLoading: true,
                        async: false,
                        data: plus.json.write({ phrases: d,screen:plus.page.prototype.deserialize().path }),
                        success: function (msg) {
                            d = plus.json.read(msg);
                        }
                    });
                } catch (e) {
                    console.log(e);
                    plus.widget.error("Error In Translation!");
                }
                return (t instanceof Array) ? d : d[0];
            }
            ,isNumeric: function (s) {
                return typeof s == "number" || ((s - 0) == s && s.length > 0);
            },
            /**
             * Replaces parameters denoted in the given string s as {0}, {1}, etc. 
             * with the values from the rest of the function arguments.
             * @param "String" s
             * @param {Object} or [Array] row
             * @param {Object} indexes
             */
            format: function (s, row, indexes) {
                if (!indexes) return s;
                // get each key of indexes and replace with coresponding row value
                if (row instanceof Array) // row: [1, "Ahmad", "CEO", "21", ...]
                    for (key in indexes) {
                        var index = indexes[key];
                        //if (typeof index == "number") index = {index:index};
                        if (!isNaN(index)) index = { index: index };
                        var val = row[index.index]; val = val == null ? "" : this.accounting(val, key);
                        if (index.fn) val = val[0];
                        s = s.replace(new RegExp("{" + key + "}", 'g'), val) // replace all
                    }
                else // row: {ID:1, Name:"Ahmad", "Position":"CEO", "Age": 21, ...}
                    for (key in indexes) {
                        var val = row[key]; val = val == null ? "" : this.accounting(val, key) /*val*/;
                        if (typeof indexes[key] !== "number" && key.fn == "first") { val = val[0]; key = key.index };
                        s = s.replace(new RegExp("{" + key + "}", 'g'), row[key]) // replace all
                    }
                return s;
            },
            pascalToSpace: function (s) {
                var s2 = "";
                for (var i = 0; i < s.length; i++) {
                    var c = s.charAt(i), c2 = s.charAt(i + 1);
                    if (i > 0 && c == c.toUpperCase() && i < s.length - 1 && c2 == c2.toLowerCase())
                        s2 += " ";
                    s2 += c;
                }
                return s2;
            },
            /**
            * Add thousand separator
            **/
            accounting: function (n, key) {
                if (key && key.length >= 2 && (key.substr(key.length - 2, 2).toLowerCase() == "id" || key.substr(key.length - 4, 4).toLowerCase() == "code" || key.substr("mobile") > -1 || key.substr("phone") > -1) || key.toLowerCase().indexOf("year") > -1) return n;
                if (!$.isNumeric(n)) return n;
                if ((n + "").length > 3 && (n + "").substr(0, 1) == "0")
                    return n;

                return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }, toDari: function (s) {
                s = s + "";
                return s
                    .replace(/1/g, "۱")
                    .replace(/2/g, "۲")
                    .replace(/3/g, "۳")
                    .replace(/4/g, "۴")
                    .replace(/5/g, "۵")
                    .replace(/6/g, "۶")
                    .replace(/7/g, "۷")
                    .replace(/8/g, "۸")
                    .replace(/9/g, "۹")
                    .replace(/0/g, "۰")
            },
            toEnglish: function (s) {
                s = s + "";
                return s
                    .replace(/۱/g, "1")
                    .replace(/۲/g, "2")
                    .replace(/۳/g, "3")
                    .replace(/۴/g, "4")
                    .replace(/۵/g, "5")
                    .replace(/۶/g, "6")
                    .replace(/۷/g, "7")
                    .replace(/۸/g, "8")
                    .replace(/۹/g, "9")
                    .replace(/۰/g, "0")
            },
			toWords: function (s) {
                var th = ['', 'هزار , ', ' میلیون , ', 'بیلیون , ', 'تریلیون  , '];
                var dg = ['صفر', ' و یک', ' و دو', ' و سه', ' و چهار', ' و پنج', ' و شش', ' و هفت', ' و هشت', ' و نه'];
                var tn = [' و ده', ' و یازده', ' و دوازده', ' و سیزده', ' و چهارده', ' و پنزده', ' و شنزده', ' و هفده', ' و هشده', ' و نزده'];
                var tw = [' و بیست', ' و سی', ' و چهل', ' و پنجاه', ' و شصت', ' و هفتاد', ' و هشتاد', ' و نود'];
                s = plus.util.toNumber(s);
                if (isNaN(s))
                    return '';
                s = s.toString();
                s = s.replace(/[\, ]/g, '');
                if (s != String(parseFloat(s)))
                    return '';// 'نمبر نیست';
                var x = s.indexOf('.');
                if (x == -1)
                    x = s.length;
                if (x > 15)
                    return 'نمبر کلان است';
                var n = s.split('');
                var str = '';
                var sk = 0;
                for (var i = 0; i < x; i++) {
                    if ((x - i) % 3 == 2) {
                        if (n[i] == '1') {
                            str += tn[Number(n[i + 1])] + ' ';
                            i++;
                            sk = 1;
                        }
                        else
                            if (n[i] != 0) {
                                str += tw[n[i] - 2] + ' ';
                                sk = 1;
                            }
                    }
                    else
                        if (n[i] != 0) {
                            str += dg[n[i]] + ' ';
                            if ((x - i) % 3 == 0)
                                str += 'صد  ';
                            sk = 1;
                        }
                    if ((x - i) % 3 == 1) {
                        if (sk)
                            str += th[(x - i - 1) / 3] + ' ';
                        sk = 0;
                    }
                }
                if (x != s.length) {
                    var y = s.length;
                    str += 'اعشاریه ';
                    for (var i = x + 1; i < y; i++)
                        str += dg[n[i]] + ' ';
                }
                str = str.substring(3, str.length);

                return str.replace(/\s+/g, ' ');
            },
			toNumber: function (v) {
                if (!v) return v;
                v = v.toString();
                return plus.util.round2(Number(v.replace(/,/g, '')));
            },

            round2: function (v) {
                return Math.round(v * Math.pow(10, 2)) / Math.pow(10, 2);
            },
            /**
             * Invokes a given function on a given object, passing additional arguments.
             * It is comfortable when there is no certainty that the function is defined.
             * @param {Object} f
             */
            invoke: function (fn, o) {
                // Resolve the function
                if (!$.isFunction(fn)) {
                    // Try to take get the function using fn as a key for o property
                    if (o != null) {
                        fn = o[fn];
                    }
                    if (!$.isFunction(fn)) return;
                }

                // Create array of arguments to pass to function fn
                var a = [];
                for (var i = 2; i < arguments.length; i++) {
                    a[i - 2] = arguments[i];
                }

                // Invoke
                return fn.apply(o, a);
            }
            , replaceAll: function (s, find, rep) {
                s = s + '';
                return s.replace(new RegExp(find, 'g'), rep);
            }
        },
        /*
        * The single object used for interaction with data/services
        * 
        **/
        data: {
            get: function (opt) {
                $.extend(opt, { type: 'get' });
                return plus.data.ajax(opt);
            },
            post: function (opt) {
                $.extend(opt, { type: 'post' });
                return plus.data.ajax(opt);
            },
            ajax: function (opt) {
                var url = opt.url || (plus.config.baseUrl) + opt.service;
                if (!opt.url) $.extend(opt, { url: url });
                var complete1 = opt.complete, success1 = opt.success, ui = plus.widget;
                opt.contentType = opt.contentType === undefined ? 'application/json; charset=utf-8' : opt.contentType;
                opt.dataType = opt.dataType === undefined ? 'json' : opt.dataType; // we may require to get list
                if (!opt.noLoading)
                    ui.loading(true);
                return $.ajax($.extend(opt, {
                    timeout: 300000,
                    complete: function (xhr, status) {
                        if (status === 'timeout')
                            return;
                        if (xhr.status === 400 || xhr.status === 404)
                            ui.error("Invalid request: " + opt.url);
                        if (complete1)
                            complete1(xhr);
                    },
                    success: function (msg, status) {
                        if (msg == null) {
                            ui.error("Web service returned nothing. That maybe caused by caling it from a different domain.");
                        } else {
                            if (!opt.noLoading)
                                ui.loading(false, opt.element);
                            ui.message("");
                            if (opt.contentType == 'application/json; charset=utf-8') {
                                var rv = plus.json.read(msg);
                                rv = $.isArray(rv) ? rv[0] : rv;
                                if (rv == plus.config.baseUrl + "security/unauthorized/") window.location.href = rv;// console.log(rv); //window.location.href = rv;
                                if (rv.error) return plus.widget.error(rv.error);
                            }
                            if (success1)
                                success1(msg, status, opt);
                        }
                    },
                    error: function (xhr, status, e) {
                        if (!opt.noLoading)
                            ui.loading(false, opt.element);
                        if (status == null) {
                            ui.error("Web service not accessible");
                        } else if (status === 'timeout') {
                            ui.error('timeout');
                        } else if (status == "parseerror") {
                            ui.error("The url {0} did not respond.".replace('{0}', opt.url));
                        } else if (status.toLowerCase() == "abort") {
                            ui.error('', '');
                        } else if (xhr.getResponseHeader("jsonerror")) {
                            // This runs when the web service method throws an exception
                            var msg = json.read(xhr.responseText);
                            ui.error(msg.Message);
                        } else {
                            ui.error((status ? status + " " : "") + (e || "") || xhr.responseText);
                        }
                    }
                }));
            }
        }
    }
    // for insider
    var ui = plus.widget;
})();

