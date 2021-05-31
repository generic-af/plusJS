var plus = window.plus = window.plus || {};

(function () {

    //$.extend($.fn, {
    //    modal: function () {
    //        $(this).each(function () {
    //            new plus.modal({el: $(this)});
    //        });
    //    }
    //});

    plus.modal = function (opt) {
        // this.opt = opt = opt || {};
        this.el = opt.el || $('.modal-dialog');
        
        this.init();
    },

    plus.modal.prototype = {
        init: function () {
            var self = this;
            $('.modal-show-button').unbind('click').click(function () {
                var target = $(this).attr('modal');
                var name = $(this).attr('for');
                self.show($('#' + target));
              
            });
            this.el.find('.modal-close').unbind('click').bind('click',function () {
                self.hide();
            });
        },

        show: function (t, n) {
            this.el.find('#uxModalForm').append(t.clone().show().attr('id', n));
            this.el.find('.modal-title').html(t.attr('title'));

            $('.subform:visible').each(function () {
                var widget = $(this).data('widget');
                if (!widget)
                    plus.api.construct('form', {
                        el: $(this)
                    });
            });

            //plus.api.construct('form', {
            //    el: $('#' + n)
            //});

            this.el.show();

            //plus.api.construct("autocomplete", { path: ["Default", "look", "Course"], selector: $('#uxCourse'), searchCol: 'Path_Dari', fn: 'like' });
        },

        hide: function () {
            var modal = this.el;
            this.el.find('#uxModalForm').html('');
            this.el.find('.modal-title').html('');

            modal.hide();
        }

    }

    
})();