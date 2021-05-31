/// <reference path="../../external/jquery/cropit/jquery.cropit.js" />
/*
* plus.upload plugin 
* http://plus.af
* 
* requires jQuery.js v2.1.3 or higher http://jquery.com/
* tested with jQuery v2.1.3
*
* Copyright 2015 Khawarsoft 
* Released under the Khawarsoft Co API license
* http://api.plus.af/license
*
* Date: 2015-06-16 10:07:26 GMT+0430 (Afghanistan Standard Time)
* 
* @author: mushfiqullah.akhundzada@gmail.com, reza.khawar@gmail.com
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
    */
    plus.photo = function (opt) {
        this.opt = opt = opt || {};
        this.el = opt.el || $('body');
        this.croppable = !!this.el.attr('enableCropping');
        this.opt.dir = this.opt.dir || "~/";
        this.readonly = !!opt.readonly;
        this.maxsize = opt.maxsize || 2097152;
        var _app = opt.parent.el.attr('id').substring(2).split('_')[0];
        this.url = opt.url || (plus.config.url[_app] || plus.config.baseUrl) + (this.croppable ? 'handler/uploadData.ashx' : 'handler/upload.ashx');
        this.opt.conn = opt.conn || opt.parent.path[0];
        this.init();
    }

    plus.photo.prototype = {
        init: function () {
            var self = this;
            var _id = (new Date()).getTime();
            this._file = $('<input type="file" accept="image/*" id="uxFile_' + _id + '" name="uxFile_' + _id + '" maxfileSize="' + this.maxsize + '" class="cropit-image-input" >');
            this.el.after(this._file.hide());
            var pPath = this.opt.parent.path;
            var _app = self.opt.parent.el.attr('id').substring(2).split('_')[0];

            var defaultSrc = this.defaultSrc = (plus.config.url[_app] || plus.config.baseUrl) + 'handler/Download.ashx?path=' + this.opt.parent.path.join(".") + '&&type=image';
            if (this.el.attr('path')) defaultSrc += "&&selfPath=" + this.el.attr('path');
            this.defaultSrc = defaultSrc;
            // build a box for display
            var frame = $('<div><img id="uxPhoto" /><div class="upload">Upload Photo</div></div>');
            this.el.after(frame);
            var photo = this.photo = frame.find('#uxPhoto');
            var browser = frame.find('.upload');

            this.opt.parent.observers.add('after bind', function () {
                photo.attr('src', defaultSrc + '&&RecordID=' + (self.opt.parent.record ? self.opt.parent.record[0] : -1) + '&&ts=' + ((new Date).getTime()));
            });
            // preview
            photo.unbind('click').bind('click', function () {
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
                } else
                    image.css('margin-top', (((wh - h) - 20) / 2) + 'px');

                stage.bind('click', function (event) {
                    $(this).remove();
                });

                function bindKeyPress() {
                    $(document).one('keypress', function (e) {
                        var carCode = e.keyCode || e.charCode;
                        if (carCode != 27) bindKeyPress();
                        else stage.remove();
                    });
                }
                bindKeyPress();

            });

            if (this.croppable) {
                // add style first
                var _style = ".cropit-preview {background-color: #f8f8f8;background-size: cover;border: 5px solid #ccc;border-radius: 3px;margin-top: 7px;width: 200px;height: 240px; margin-left:auto; margin-right:auto} ";
                _style += ".cropit-preview-image-container {cursor: move;} .cropit-preview-background {opacity: .2;cursor: auto;}";
                _style += ".editor-stage {text-align:center; display: block;z-index: 888;position: fixed;background-color: rgb(0, 0, 0);opacity: 0.96;top: 0px;left: 0px;right: 0px;bottom: 0px;padding: 10px;height: 100%;}";
                _style += ".editor-wrapper {margin: 0 auto;max-width: 220px;height: 100%;}"
                _style += " @media (min-height:600px) {.editor-wrapper {margin-top: 200px; }}";

                $('body').prepend("<style>" + _style + "</style>");
                // wrap it
                var stage = this.stage = $('<div class="editor-stage"></div>').appendTo('body').hide();

                var wrapper = $('<div class="editor-wrapper" style="text-align:left;"></div>').appendTo(stage);


                $('<input type="image" style="margin:1px 10px; width:24px; cursor:pointer;" title="Close" src="' + (plus.config.baseUrl) + '/skin/icon/close.png" />').appendTo(wrapper).bind('click', function () {
                    self.stage.hide();
                });

                var editor = $('<div class="image-editor"></div>').appendTo(wrapper);
                editor.append(this._file);

                this.cropPreview = $('<div class="cropit-preview"></div>').appendTo(editor);
                editor.append('<div style="color:transparent;">' + "Resize Image" + '</div>');
                var control = $('<div style="z-index:9999; position:fixed;" class="crop-control"></div>').appendTo(editor);
                control.append('<input type="range" class="cropit-image-zoom-input">');
                var cropper = $('<input type="image" text="Crop" class="cropper-export" title="upload" src="' + (plus.config.baseUrl) + '/skin/icon/crop-24-white.png" />').appendTo(control);
                control.append('<br />');
                $('<input type="image" style="margin:1px 10px; width:24px; cursor:pointer;" title="browse image" src="' + (plus.config.baseUrl) + '/skin/icon/browse-white-30-bold.png" />').appendTo(control).bind('click', function () {
                    browser.click();
                });

                $('<input type="image" style="margin:4px 10px; width:18px; cursor:pointer;" title="rotate left" src="' + (plus.config.baseUrl) + '/skin/icon/rotate-left-white.png" class="rotate-right" />').appendTo(control).bind('click', function () {
                    editor.cropit('rotateCCW');
                });

                $('<input type="image" style="margin:4px 10px; width:18px; cursor:pointer;" title="rotate right" src="' + (plus.config.baseUrl) + '/skin/icon/rotate-right-white.png" class="rotate-right" />').appendTo(control).bind('click', function () {
                    editor.cropit('rotateCW');
                });


                cropper.unbind('click').bind('click', function () {
                    self.crop();
                });
            }
            browser.click(function () {
                if (!self.opt.parent.record || !self.opt.parent.record[0]) {
                    plus.widget.error('Please save main form record before uploading any document(s)/image(s).');
                    return false;
                }
                if (self.croppable && !$.fn.cropit) {
                    plus.widget.loading(true, 'loading image cropping plugin. Please wait...');
                    $.getScript(plus.api.repository + 'js/external/jquery/cropit/jquery.cropit.js', function () {
                        plus.widget.loading(false);
                        // completed
                        self.browse();
                        //self._file.click();
                    });
                } else
                    self.browse();//self._file.click();
            });

            this._file.change(function () {
                // file changed
                var file = $(this).get(0).files[0];
                if (file && file.size > self.maxsize) {
                    plus.widget.error('File large. Please select smaller file.');
                    self._file.val('');
                    return false;
                }
                if (!self.croppable)
                    self.upload();
            });
        },
        browse: function () {
            var self = this;
            if (this.croppable) {
                this.stage.show();
                function bindKeyPress2() {
                    $(document).one('keypress', function (e) {
                        var carCode = e.keyCode || e.charCode;
                        if (carCode != 27) bindKeyPress2();
                        else self.stage.hide();
                    });
                }
                bindKeyPress2();

                if (!this.isCropInitiated) {
                    this.stage.find('.image-editor').cropit({
                        //exportZoom: 1.25,
                        imageBackground: true,
                        //imageBackgroundBorderWidth: 20,
                        imageState: {
                            src: '',
                        },
                    });

                    this.isCropInitiated = true;
                }
            }
            this._file.click();
        },
        crop: function () {
            this.upload();
        },
        upload: function (replace) {
            var self = this;
            if (replace && !confirm('Are you sure you want to upload and replace with the existing file, if any?')) return;
            var file = this._file.get(0).files[0];
            if (!this.croppable && file.size > self.maxsize) {
                plus.widget.error('File large. Please select smaller file.');
                this.input.val('');
                return false;
            }
            var data = new window.FormData();
            if (self.croppable) {
                var imageData = self.stage.find('.image-editor').cropit('export', { quality: 1 });
                if (imageData.length > self.maxsize) {
                    plus.widget.error('File large. Please select smaller file.');
                    return false;
                }
                data.append("photo", imageData);
                data.append("fileName", this._file.val());
                data.append("contenttype", "image/*");
            }
            else
                data.append('file', file);

            var pPath = this.opt.parent.path;
            data.append('type', 'image');
            data.append('schema', pPath[1]);
            data.append('object', pPath[2]);
            data.append('conn', this.opt.conn);
            data.append("overwrite", 1);
            data.append('recordid', this.opt.parent.record[0]);
            data.append('dir', this.opt.dir);
            if (this.el.attr('path')) data.append("selfPath", this.el.attr('path'));
            plus.data.post({
                url: self.url,
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                success: function (result) {
                    var src = self.defaultSrc + '&&RecordID=' + result.val + '&&ts=' + ((new Date).getTime());
                    self.photo.attr('src', src);
                    plus.widget.success(result.message);
                    if (self.croppable) {
                        self.stage.hide();

                    }

                }
            });
        }
    }
})();