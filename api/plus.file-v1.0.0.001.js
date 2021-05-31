/*
* plus.upload plugin 
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
    /*
    How it works:
        -> create a box [DIV] for upload file
        -> 
    Usage: 
    <photo 
        enableCropping="true"
        dir="AppSettingName" 
        form="dvHCM_rec_Person" 
        url = 'handler/upload.ashx'
        maxsize="2097152"
    >
    <fileList
        readonly="false";
        dir="AppSettingName" 
        form="dvHCM_rec_Person" 
        maxsize="2097152"
        ></fileList>
    */
    plus.file = function (opt) {
        this.opt = opt = opt || {};
        this.opt.path = opt.conn || "Default"; //this.opt.path || [opt.parent.path[0], ["dbo"], ["vDocuments"]];
        this.id = (new Date()).getTime();
        this.el = opt.el || $('body');
        this.opt.dir = this.opt.dir || "/";
        this.display = opt.display || 'grid'; // ['grid', 'image', 'link'];
        this.readonly = !!opt.readonly;
        this.maxsize = opt.maxsize || 2097152;
        var _app = opt.parent.el.attr('id').substring(2).split('_')[0];
        this.url = opt.url || (plus.config.url[_app] || plus.config.baseUrl) + 'handler/upload.ashx';
        this.opt.conn = opt.conn || opt.parent.path[0];
        this.init();
        //this.show.addClass('widget').data('widget', this);
	}
	
    plus.file.prototype = {
        browse: function (id) {
            if (!this.opt.parent.record || !this.opt.parent.record[0]) {
                plus.widget.error('Please save main form record before uploading any document(s)/image(s).');
                return false;
            }
            this.form.find('input:file').click();
            //this.input.click(); // browse
        },
	    init: function () {
	        var self = this;
	        var _label = ["Attachment", "ضمیمه سند", "د سند ضمیمه"];
	        this.form = $('<div id="uxFileList_"' + this.id + '></div>');
	        this.form.append('<div class="div-row"><label>' + _label[plus.config.current || 0] + '</label>');
	        $('<input type="text" id="uxFileName_' + this.id + '" />');
	        $('<input type="file" ' + (this.display == 'image' ? 'accept="image/*"' : '') + ' id="uxFile_' + this.id + '" name="uxFile_' + this.id + '" maxfileSize="' + this.maxsize + '" >').appendTo(this.form);
	        $('<input type="image" src="' + plus.config.baseUrl + 'skin/icon/plus.png" class="browse" >').appendTo(this.form); // [...] button
	        _label = ["Replace if exist", "جایگزین در صورت موجودیت", "که موجود ځای"];
	        //this.form.append('<label for="replace_' + this.id + '"><input type="checkbox" name="replace_' + this.id + '" id="uxReplaceIfExist_' + this.id + '" />');
	        $('<input type="button" value="Upload" action="upload"></div>').appendTo(this.form);

	        this.el.after(this.form.hide());

	        //////////////////////TODO::: Bind grid///////////////////////////////
	        if (this.type == 'grid') {
                var grid = $('<div class="div-grid grid widget"></div>');
	            grid = $('<table></table>').appendTo(grid);
	            grid = $('<tbody></tbody>').appendTo(grid);
	            function buildQuery(list) {
	                var query = {};
	                query.limit = list.limit;
	                query.offset = list.offset;
	                query.path = self.opt.path;
	                query.fetchColumns = !list.ready
	                var filter = function (query, _self) {
	                    query.filter = [{ObjectSchema: _self.opt.parent.path[1] }, { ObjectName: _self.opt.parent.path[2] }];
	                    var _new = {RecordID: -1};
	                    if (_self.opt.parent.record) _new.RecordID = _self.opt.parent.record[0];
	                    query.filter.push(_new);
	                }
                
	                filter(query, self);
	                return { queries: [query] };
	            }
	            // construct grid
	            var templ = '<tr class="grid-row"><td>{FileName}</td><td><img src="' + config.baseUrl + 'skin/icon/del1.png" /></td></tr>';
	            //TODO: delete file...
	            var opt = {
	                path: self.opt.path,
	                el: grid, templ: templ, limit: 10, service: 'json/pull.asmx/Fetch',
	                buildQuery: buildQuery, scroller: grid.parents('div:first')
	            }

	            var _grid = plus.api.construct("list", opt);
	            this.form.show();
	        }
	        
	        this.defaultSrc = (plus.config.url[_app] || plus.config.baseUrl) + 'handler/Download.ashx?path=' + this.opt.parent.path.join(".") + '&&type='+this.display;

	        if (this.display == 'image') {
	            var pPath = this.opt.parent.path;
	            var _app = self.opt.parent.el.attr('id').substring(2).split('_')[0];
	            
	            self.opt.parent.observers.add('after bind', function () {
	                self.show.find('#uxPhoto').attr('src', self.defaultSrc + '&&RecordID=' + (self.opt.parent.record ? self.opt.parent.record[0] : -1) + '&&ts=' + ((new Date).getTime()));
	                //_grid.clear();
	            });
	        }
	        //////////////////////|||TODO|||///////////////////////////////

	        
	        this.browser = this.form.find('.browse');
	        if (this.display == "image") {
                // build a box for display
	            this.show = $('<div></div>');
	            this.el.after(this.show);
	            this.show.append('<img id="uxPhoto" /><div class="upload">Upload Photo</div>');
	            this.browser = this.show.find('.upload');

	            self.show.find('#uxPhoto').unbind('click').bind('click', function () {
	                $('#uxStage').remove();
	                var stage = $('<div id="uxStage" style="display:block; z-index:888; position:fixed; background-color:#000; opacity: 0.9; top:0; left:0; right:0; bottom:0;"></div>')
                    .appendTo('body');

	                stage.css({ 'margin': 'auto;', 'text-align': 'center', 'padding': '10px' });

	                var image = $('<img style=""  src="' + $(this).attr('src') + '">').appendTo(stage);
	                var h = image.height(), wh = $(window).height(),
                        w = image.width(), ww = $(window).width();

	                if (h > (wh - 20)) {
	                    h = wh - 20;
	                    image.css('height', h + 'px');
	                } else {
	                    image.css('margin-top', (((wh - h) - 20) / 2) + 'px');
	                }


	                stage.bind('click', function (event) {
	                    $(this).remove();
	                });

	            });
	        }

	        //this.el.after(this.input);

	        this.browser.click(function () {
	            self.browse();
	        });
	        
	        this.form.find(':file').change(function () {
	            // file changed
	            var file = $(this).get(0).files[0];
	            if (file.size > self.maxsize)
	            {
	                plus.widget.error('File large. Please select smaller file.');
	                this.input.val('');
	                return false;
	            }
	            if (self.opt.label) self.opt.label.text(file.name);
	            if (self.display == 'image')
	                self.upload(true);

	        });
	    },
	    
	    
	    upload: function (replace) {
	        var self = this;
	        if (replace && !confirm('Are you sure you want to upload and replace with the existing file, if any?')) return;
	        var file = this.form.find(':file').get(0).files[0];
			if (file.size > self.maxsize) {
	            plus.widget.error('File large. Please select smaller file.');
	            this.input.val('');
	            return false;
	        }
            
	        var data = new window.FormData();
	        data.append('file', file);

	        var pPath = this.opt.parent.path;
	        data.append('type', this.display);
	        data.append('schema', pPath[1]);
	        data.append('object', pPath[2]);
	        data.append('conn', this.opt.conn );
	        data.append('recordid', this.opt.parent.record[0]);
	        data.append('dir', this.opt.dir);

	        plus.data.post({
	            url: self.url,
	            data: data,
	            cache: false,
	            contentType: false,
	            processData: false,
	            success: function (result) {
	                
	                if (self.display == 'image') {
	                    var src = self.defaultSrc + '&&RecordID=' + result.val + '&&ts=' + ((new Date).getTime());
	                    self.show.find('#uxPhoto').attr('src', src);
	                    plus.widget.success(result.message);
	                }
	            }
	        });
	    }
	}
})();