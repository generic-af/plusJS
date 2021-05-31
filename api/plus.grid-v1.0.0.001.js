/*
* plus.grid plugin (extended from plus.list)
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
    /**
    * Grid plugin
    * @opt : {el: $(''), ... } 
    * opt.el
    *
        <div id="ux?..."></div>
    * OR
        <grid id="ux?..." [pk="ID"] [noHeader=true] [sort="ID"] [load="false"] [onItemCreating="function_name"] [onItemCreated="function_name"]>
            [
                <header>
                </header>
            ]
            <columns>
                <command name="select" [url="../select.png"] [fn="fnItemSelecting"] [post="fnItemSelected"] [title="Select record"] />
                ...
                <column name="Name" [size="10px"] [caption="Name of Employee"] [source="plus.meta.look.Names"] [source-element="uxName"] />
                ...
            </columns>
        </grid>
    * OR (active)
        <grid id="ux?..." [pk="ID"]>
            [   
                <header>
                </header>
            ]
            <template>
                <tr id="{id}">
                    <td class="command ..." [style=""]>
                        <img src="img/select.png" action="select">
                        ...
                    </td>

                    <td class="cell " [style=""]>
                        <div>{Name}</div>
                    </td>
                    ...
                </tr>
            <template>
        </grid>
    * @rendering
    * 
        <div class="grid">
            <div class="grid-header">
                <table>
                    <tr>
                        <td class="cmd"> <img src="../skin/img/icons/select.png" action="select" /> </td>


                    </tr>
                </table>
            </div>
        </div>
    *
    *
    **/
    plus.grid = function (/*source,*/ opt) {
        /*opt = opt || source;*/
        this.opt = opt = opt || {};
        
        opt.callbacks = opt.callbacks || { "init": [] }; 
        opt.callbacks["init"] = $.makeArray(opt.callbacks["init"]);

        opt.callbacks["init"].push(function (self) {
            // replace grid.el to table inside
            if (self.el.is('body'))
                self.el = $('<div class="grid"></div>').appendTo(self.el);

            // construct header
            self.header = $('');
        });

        plus.api.avail('list');
        // inherit plus.list  :plus.list
        plus.list.call(this, /*source,*/ opt);
        
        this.command = $.makeArray(opt.command);
        
        // we could also have inherited plus.prototype = new plus.list();...
        this.tableWidth = this.command.length * (this.opt.commandWidth || 33);
        this.columns = fixColumns(opt.columns, this);
        
        /*
        * private function to get settings from grid
        * 
        **/
        function getSettings(grid) {
            var settings = {columns:[]};
            grid.find('col').each(function () {
                var col = { name: $(this).attr('name'), caption: ($(this).attr('caption') || $(this).attr('name')), width: $(this).width() };
                // source
                if ($(this).attr('source')) col.source = $(this).attr('source');

                settings.columns.push(col);
            });
        }

        /*
        * private function to fix column definition
        **/
        function fixColumns(cols, self) {
            var columns = [];
            for (var i = 0; i < cols.length; i++) {
                var col = cols[i], column = col /*default*/;
                if (typeof col != "string") column = { caption: col, name: col };
                /* 
                * Check if column is ForeignKey
                * We can use this to get text from form data when grid has associated form, e.g.
                *  StatusID is a column in our grid while the grid has associated form which has a <select> DOM element 
                *  for StatusID which is already populated with all StatusIDs, we can get value from select element.
                *  we may also find this if user passes source of data for dropdowns while constructing 
                *  his grid. new plus.grid([], {..., sources: [{path: "StatusID", rows: [[1, "Name"], ...] }, ...]});
                *  
                **/
                if (column.name.substr("2") == "ID") column.isForeignKey = true;
                if (self.opt.sources && self.opt.sources[column.name]) {
                    var cSource = self.opt.sources[column.name];
                    
                    if (typeof cSource === "string") cSource = $('#' + cSource);
                    if (cSource instanceof jQuery) 
                    {
                        // build object Array
                        var obj = [];
                        cSource.find('>option').each(function () {
                            var option = $(this), text = option.text(), val = option.val();
                            obj.push({ ID: val, Name: text} );
                        });
                        cSource = obj ;
                    } 

                    column.source = cSource instanceof Array ? cSource : cSource.rows;
                }
                if (column.name.substr(4).toLowerCase() == "date") column.width = 80; // all date columns should have 80 width
                // calculate total width of grid
                if (!column.width) {
                    //if (column.name.substr(4).toLowerCase() == "date") column.width = 80;
                    column.width = 200; // default
                }
                self.tableWidth += column.width;
                columns.push(column);
            }
            return columns;
        }
    }
    // inherit prototype from plus.list
    plus.grid.prototype = Object.create(plus.list.prototype);

    /*
    * extend functions for Grid
    **/

    // make sure plus.grid.prototype is of instance of plus.grid, not plus.list
    plus.grid.prototype.constructor = plus.grid;

    /*
    *
    **/
    plus.grid.prototype.render = function (container) {
        //this.createHeader();

    }

    /*
    * Construct footer
    **/
    plus.grid.prototype.createFooter = function () {
        
    };

    plus.grid.prototype.createHeader = function () {
        var sb = [], sb2 = [];
        sb.push('<div style="width: 100%; height: 34px; overflow: hidden; position: relative;" class="grid-header">',
            '<table cellspacing="0" cellpadding="0" style="table-layout: fixed; top: 0px; left: 0px; width: ' + this.tableWidth + 'px" class="hdr">',
            '<tbody><tr style="height: auto; ">', Array(this.command.length + 1).join('<th style="height: 0px; width: 33px;"></th>')
        );
    };
    plus.grid.prototype.addRow = function (index) {

    }

})();