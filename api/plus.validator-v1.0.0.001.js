
/*
* plus.api.rule
**/
plus = window.plus = window.plus || {};
(function () {
    var ui = plus.widget;
    jQuery.fn.extend({
        validator: function (opt) {
            var els = $(this);
            for (var i = 0; i < els.length; i++) {
                var el = $(els[i]);
                new plus.validator(el, opt);
            }
        }
    });

    if (String.format === undefined)
        String.format = function (s /* var args */) {
            if (s === undefined) return s;
            if (arguments.length > 1)
                for (var i = 1; i < arguments.length; i++)
                    s = s.replace(new RegExp('\\{' + (i - 1) + '\\}', 'g'), arguments[i]);
            return s;
        };

    plus.validator = function (el, opt) {
        this.opt = opt = opt || {};
        this.el = el;
        if (!el) return;
        this.fields = this.el.find('[rule]');
        var self = this;

        this.rules = {};

        this.fields.each(function () {

            var origin = $(this)
                , field = origin.data('alt') || origin
                , widget = field.data('widget')
                , group = origin.attr('vgroup') || "default";

            var vRules;
            if (!origin.attr('rule')) return;
            eval("vRules=[" + origin.attr('rule') + "]");
            if (vRules)
                for (var i = 0; i < vRules.length; i++) {
                    var vRule = vRules[i];
                    //vRule.extend(setting);
                    vRule.origin = origin;
                    vRule.widget = widget;
                    vRule.field = field;
                    vRule.group = vRule.group || group;
                    vRule.form = self.el;
                    self.rules[origin.attr('id') + "_" + vRule.fn] = new plus.Rule(vRule);
                }
        });

        //{}
        // append validator
        this.el.find(':button, :submit, :image').each(function () {
            var action = $(this), group = action.attr('vgroup') || "default"; // validation Group
            action.bind('click', function () {
                var result = new Result();
                //self.el.find('error-indicator').hide();
                for (ruleKey in self.rules) {
                    var rule = self.rules[ruleKey];
                    if (rule.opt.group !== group) continue;
                    rule.validate(result);
                }
                return result.response();
            });

            function Result() {
                this.valid = true;
                this.message = "";
                this.response = function () {
                    if (!this.valid) ui.error(this.message);
                    return this.valid;
                }
            }

        });
    }

    plus.validator.message = {
        required: "* {0}",
        email: "incorrect email address",
        phone: "incorrect phone number",
        invalidSelection: "The value selected from '{0}' does not exist in the system.",
        url: "incorrect url address.",
        number: "incorrect number",
        digit: "only digits are accepted {0}",
        integer: "only integer value is accepted {0}",
        equalTo: "{0} should be equal to {1}",
        eq: "{0} should be equal to {1}",
        maxlength: "{0} value should not be greater than",
        minlength: "value should not be less than {0} ",
        rangelength: "value length should be between {0} and {1}.",
        range: "value should be between {0} and {1}.",
        st: "{0} should be smaller than {1}",
        gt: "{0} should be greater than {1}",
        steq: "{0} should be smaller than or equal to {1}",
        gteq: "{0} should be greater than or equal to {1}",
        oneOf: "One of {0} and {1} should be provided",
        sec: "{0} should not have space and minimum length should be {1}"
    }

    /**
    * plus.api.Rule for validators
    *
    *****/
    plus.Rule = function (opt) {
        this.opt = opt || {};
        var self = this;
        if (opt.fn == "sec" && !opt.child1) opt.child1 = 6;
        this.fn = opt.fn;
        this.form = opt.form;
        this.field = opt.field;
        if (!opt.child0) opt.child0 = opt.origin;
        if (!opt.child1) (opt.child1 = opt.child0) && (opt.child0 = opt.origin);
        this.child0 = typeof this.opt.child0 === "string" ? (function () { var child = self.form.find('#' + self.opt.child0); return child.length ? child : self.opt.child0 })() : this.opt.child0;
        this.child1 = typeof this.opt.child1 === "string" ? (function () { var child = self.form.find('#' + self.opt.child1); return child.length ? child : self.opt.child1 })() : this.opt.child1;

        //if (!this.field.hasClass('date'))
        this.field.bind({
            'change': function () {
                self.validate({ valid: true, message: "" }, true);
            }
        });
        if (this.fn == "number" || this.fn == "digit" || this.fn == "phone" || this.fn == "integer") {
            this.field.bind('keypress', function (e) {
                var carCode = e.keyCode || e.charCode, v = $(this).val();
                if (Array.indexOf([37, 38, 39, 40], carCode) > -1) return true;
                if (self.fn != 'number' && self.fn != 'digit' && self.fn != 'integer' && self.fn != 'phone') return true;
                if (carCode == 8 || carCode == 113 || carCode == 9 || carCode == 27) return true;
                var maxLength = $(this).attr('maxlength');
                if (maxLength && $(this).val().length >= maxLength) {
                    return false;
                }
                if ((v != "" && carCode == 45) || (carCode == 46 && (self.fn == 'digit' || self.fn == 'phone' || self.fn == 'integer'))) return false;
                if ((v == "" && carCode == 48 && self.fn != 'digit' && self.fn != 'phone')) return false;
                // number
                if (((carCode == 46) && ($(this).val().indexOf(".") >= 0)) || ((carCode == 45) && ($(this).val().indexOf("-") >= 0)))
                    return false;
                if (((carCode < 48) || (carCode > 57)) && ((carCode != 46) && (carCode != 45)))
                    return false;
                return true;

            });
        }
    }

    plus.Rule.prototype.validate = function (result, isBlur) {
        var self = this;
        var child0 = this.getValue(this.child0);
        var child1 = this.getValue(this.child1);
        var child0Text = this.getText(this.child0);
        var child1Text = this.getText(this.child1);

        if (this.fn == "required" && this.child0.is(":visible") == false && !this.child0.hasClass("alt-tree") && !this.child0.hasClass("alt-date")) return true;
        if (this.fn == "required" && this.child0.hasClass("alt-date") && this.child0.data('alt').is(":visible") == false) return true;
        var valid = this.fn == "oneOf" ? validateOneOf(this.child1) : validate(this.fn, child0, child1);
        if (valid && this.fn == 'required' && this.child0.is('input') && this.child0.data('widget') && this.child0.data('widget').valueElement) {
            if (!this.child0.data('widget').valueElement.val()) {//if (!this.child0.data('dataid')) {
                valid = false;
                child0Text = this.field.prevAll('label:first').text();
                result.message += String.format(plus.validator.message.invalidSelection, child0Text, child1Text);
            }
        }
        if (!valid && this.fn == "oneOf") {
            result.message += messageOf(this.child1, result.message);
        }
        //var label = this.field.nextAll('label[for="' + this.field.attr('id') + '"]');
        if (!valid) {
            if (this.fn == "required" || this.fn == "age") child0Text = this.field.prevAll('label:visible:first').text();
            if (Array.indexOf(["gt", "st", "gteq", "steq"], this.fn) > -1) child1Text = this.field.prevAll('label:visible:first').text();
            result.message += "-" + String.format(plus.validator.message[this.fn], child0Text, child1Text);
            this.field.addClass('invalid');
            //label.attr('alt', result.message);
            //label.removeClass('valid').show();
        } else if (isBlur) {
            this.field.removeClass('invalid');
            //this.field.next('label[for="' + this.field.attr('id') + '"]').addClass('valid');
            //setTimeout(function () { label.hide(); }, 1300);
        }
        result.valid = result.valid && valid;
        if (result.valid) this.field.removeClass('invalid');
        function validateOneOf(child1) {
            valid = false;
            for (var i = 0; i < child1.length; i++) {
                var child = self.form.find('#' + child1[i]);
                if (child.length) {
                    child.removeClass('invalid');
                    var v = self.getValue(child);
                    if (v != undefined && ("" + v).length > 0) return true;
                }
            }
            return valid;
        }
        function messageOf(child1, already) {
            var msg = "<br>-At least one of the following fields should contain data: <br>";
            for (var i = 0; i < child1.length; i++) {
                var child = self.form.find('#' + child1[i]);
                if (child.length) {
                    child.addClass('invalid');
                    msg += '- * ' + child.prevAll('label:first').text();
                }
            }
            if (already.indexOf(msg) > -1) return "";
            return msg;
        }


        function validate(fn, child0, child1) {
            if (fn != "required" && child0 == "") return true;
            child1 = child1 || "";
            if (fn != "required" && !isNaN(child0)) child0 = child0 - 0;
            if (fn != "required" && !isNaN(child1)) child1 = child1 - 0;
            switch (fn) {
                case "email": return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(child0);
                case "phone": return /^\d+$/.test(child0);//return /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(child0);
                case "url": return /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(child0);
                case "number": return /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(child0);
                case "integer": return /^\d+$/.test(child0);
                case "digit": return /^\d+$/.test(child0);
                case "sec": return !(/\s/g.test(child0)) && (child0.length > (child1 || 6));
                case "required": return child0 != undefined && ("" + child0).length > 0;
                case "oneOf": return child0 != undefined && ("" + child0).length > 0;
                case "eq": return child0 == child1;
                case "noteq": return child0 != child1;
                case "gt": return child1 === "" ? true : child0 > child1;
                case "st": return child1 === "" ? true : child0 < child1;
                case "gteq": return child1 === "" ? true : child0 >= child1;
                case "steq": return child1 === "" ? true : child0 <= child1;
                case "?": return child0 == null;
                case "!?": return child0 != null;
                case "age": return child0 <= (function () { var d = util.date(); d.setDate(d.getDate() - (18 * 365)); return d; })();
                case "like": return child0 && child0.toLowerCase().indexOf(
                                ("" + child1).toLowerCase()) > -1;
                case "endswith":
                    return child1.toLowerCase() == child0.substr(child0.length - child1.length, child1.length).toLowerCase();
                case "startswith":
                    return child1.toLowerCase() == child0.substr(0, child1.length).toLowerCase();
                case "in": return child1.indexOf(child0) >= 0;
                case "not": return !child0;
            }

            return false;
        }

    }

    plus.Rule.prototype.getValue = function (origin) {
        if (!origin) return origin;
        if (origin instanceof Function) return origin('v');
        if (!(origin instanceof jQuery)) return origin;
        if ($.isArray(origin)) return origin;
        var field = origin.data('alt') || origin
         , widget = field.data('widget');
        return widget && widget.val ? widget.val() :
            field && field.hasClass('date') ? field.val() == "" ? null : new Date(field.val()) :
            field.is("select") && field.val() == 0 ? null : field.val();
    }

    plus.Rule.prototype.getText = function (origin) {
        if (!origin) return origin;
        if (origin instanceof Function) return origin('t');
        if (!(origin instanceof jQuery)) return origin;
        var field = origin.data('alt') || origin
         , widget = field.data('widget');
        return widget && widget.val ? widget.val() :
            field.val();//field && field.hasClass('date') ? field.val() :
        //field.val();
    }

})();