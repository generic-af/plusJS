/*
* plus.chart plugin 
* http://generic.af
* 
* requires jQuery.js v2.1.3 or higher http://jquery.com/
* tested with jQuery v2.1.3
*
* Copyright 2015 Generic.af business and trade limited liability corporation
* Released under the Generic.af Co API license
*
* Date: 2015-06-16 10:07:26 GMT+0430 (Afghanistan Standard Time)
* 
* @author: mushfiqullah.akhundzada@gmail.com
* 
* stacking: { endlable:true, showvalue:true}
*
*
**/
var plus = window.plus = window.plus || {};
(function () {
    plus.chart = function (opt) {
        this.opt = opt = opt || {};
        this.el = opt.el || $('body');
        if (!this.el.is('body')) this.el.parent().find('div:not(:first-of-type)').remove();
        this.nameIndex = opt.nameIndex || 0;
        if (!this.init(true)) {
            var self = this;
            var query = opt.query || { path: opt.path, commandType: "sp", param: opt.param, fetchColumns:true };  

            // fetch
            plus.data.post({
                url: opt.url || plus.config.baseUrl + "json/pull.asmx/Fetch"
                , async: false
                , data: plus.json.write({ queries: [query] })
                , success: function (msg) {
                    var response = plus.json.read(msg);
                    if ($.isArray(response)) response = response[0];
                    self.opt.data = response;

                    self.init();
                }
            });
        } 
    }

    plus.chart.prototype = {
        init: function (check) {
            // if data is not given by default, fetch data
            if (check && !this.opt.data) return false;
            Highcharts.setOptions({
                lang: {
                    decimalPoint: '.',
                    thousandsSep: ','
                }
            });
            var self = this;
            var opt = this.opt;
            // Step 1: Build common chart object
            var common = {
                chart: { type: opt.type }
                ,   title: { text: opt.title }
                ,   subtitle: { text: opt.subtitle }
                ,   tooltip: { valueSuffix: ' ' }
                ,   xAxis: {
                        categories: []
                    }
                ,   yAxis: {
                        min:0, 
                        title: {
                            text: opt.yTitle
                        }
                },
                legend: {
                    reversed:true
                }
            }
            // create grid
            this.buildtable();
            // Step 2: build data
            this.buildData();
            
            // Step 3: modify data for pie
            if (this.opt.type == 'pie') {

                // Step 3.2: Modify chart object
                common.chart = {plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    type: 'pie'
                };

                // Step 3.3: Modify plotOption
                common.plotOptions = {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: true,
                                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                                style: {
                                    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                }
                            }
                        }
                }
            } 

            common.series = [this.data];
            
            // Step4: build stacking
            if (opt.stacking) {

                common.plotOptions = {
                    column: {
                        stacking: 'normal'
                    }, series: {
                        stacking: 'normal'
                    }
                }

                if (opt.stacking.endlabel)
                    $.extend(common.yAxis, {
                        stackLabels: {
                        enabled: true,
                        style: {
                                    fontWeight: 'bold',
                                    color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                            }
                        }
                    });

                if (opt.stacking.showvalue && opt.type=='column') {
                    common.plotOptions.column.dataLabels= {
                        enabled: true,
                        color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
                        style: {
                            textShadow: '0 0 3px black'
                        }
                    }
                }
            }

            // Step 5: Build categories
            common.xAxis.categories = self.categories;

            // Step 6: Build tooltip
            var tooltip = {};
            
            if (!opt.default) {
                if (opt.shared) {
                    $.extend(tooltip, {
                        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                        pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                            '<td style="padding:0"><b><bdi>{point.y:.1f} mm</bdi></b></td></tr>',
                        footerFormat: '</table>',
                        shared: true,
                        useHTML: true
                    });
                } else tootltip = {
                    headerFormat: '<b>{point.x}</b><br/>',
                    pointFormat: '{series.name}: {point.y}' + ( opt.showTotal ? '<br/>Total: {point.stackTotal}' : '' )
                }
            } else tooltip.suffix = ' ' + opt.suffix;

            common.tooltip = tooltip;

            // Step 7: Plot option 
            common.plotOptions = common.plotOptions || {};
            if (opt.type == 'bar') common.plotOptions.bar = {
                    dataLabels: {
                        enabled: true
                    }
                }
            if (opt.type == 'column') common.plotOptions.column = {
                    pointPadding: 0.2,
                    borderWidth: 0
                }


            this.chart = common;
            
            this.load();
            
            return true;
        },
        load: function () {
            this.chart.series = this.data;
            if (this.opt.type == 'pie') this.chart.series = [this.data];
            this.el.highcharts(this.chart);
        },
        buildData: function (_data) {
            _data = _data || this.opt.data;
            var self = this;
            this.categories = this.opt.categories || [];
            var _categories2 = [], open = '';
            var rows = _data.rows || _data;
            var data = [], sb = [];
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i], obj = {name: '', data: [], y:0};
                obj.name = row[self.nameIndex];
                sb.push('<tr><td>', obj.name, '</td>');
                //if (obj.name != open) { _categories2.push(obj.name); open = obj.name;}
                _categories2.push( row[self.nameIndex] + '' );
                if (self.opt.type == "pie") obj.y = row[self.opt.valIndex || 1];
                else {
                    row.splice(self.nameIndex, 1);
                    obj.data = row;
                }

                sb.push('<td>',
                    self.opt.type == 'pie' ?
                        obj.y + "</td>" :
                        obj.data.join("</td><td>"),
                    self.opt.type == 'pie' ? '' : '</td>',
                    '</tr>');
                if (!obj.name.startsWith('مجموع'))
                    data.push(obj);
            }

            if (this.opt.type == 'pie') {
                data = { name: self.opt.name, colorByPoint: true, data: data };
            }
            var sbH = [];
            sbH.push('<tr>');
            
            
            if (!this.categories.length && _data.columns) {
                sbH.push('<th>', _data.columns[self.nameIndex], '</th>');
                for (var j = self.nameIndex; j < _data.columns.length; j++) {
                    this.categories.push(_data.columns[j]);
                    sbH.push('<th>', _data.columns[j], '</th>');
                }
            } else {
                for (var j = 0; j < this.categories.length; j++)
                    sbH.push('<th>', this.categories[j], '</th>');
                if (this.categories.length == 1) sbH.push('<th>تعداد / ارقام</th>');
            }
            sbH.push('</tr>');
            this.grid.find('*').remove();
            this.grid.append(sbH.join(""));
            this.grid.append(sb.join(""));
            //if (this.categories.length == 2 && rows.length > 2) {
            //    this.categories = _categories2;

            //}

            this.data = data;
        },
        buildtable: function () {
            
            
            var control = $('<div class="div-form-control"><div class="toggler"></div></div>');
            this.el.after(control);

            var grid = $('<div class="div-grid grid"></div>');
            control.after(grid.hide());
            grid = $('<table></table>').appendTo(grid);
            grid = $('<tbody></tbody>').appendTo(grid);
            this.grid = grid;

            control.find('.toggler').unbind('click').bind('click', function () {
                $(this).toggleClass('expanded');
                $(this).parent().next('.grid').toggle();
            });
        }
    }
})();

/*
bar
column
stacked bar
pie
line



(pie-monochrome [one color expanded])... 

gauge-activity
heatmap
scatter
spline-inverted
synchronized-charts

*/
//# sourceURL=http://localhost/plus.chart.js
