var plus = {
    config: {}
    , util: {}
    , widget: {

    }
}

// ["ID", 1, "Name", "Ahmad", "Class", 33]
// row = [1, "Ahmad", "Qasem", "12-12-1360", ...]
// columns = {ID:0, FirstName:1, FatherName:2, DOB:3,...}
//var rowobj = { ID: 1, FirstName: "Ahmad", FatherName: "Qasem", ...}
//rowobj.FirstName
// {ID: 1, Name: "Ahmad", Class: 33}

var format = "{Name} is a student of Class {Class}";
var indexes = { "Class": 1, Name: 0 };
var rows = [["Ahmad", "Class B"], ["Mahmood", "Class C"], ...];


var fn = function (a, b, c) {
    alert(a);
} 

plus.util.invoke(fn, ["Ahmad"]);



/**
 * rows: [ [1,"Ahmad",...] , []]
 * columns: []
 */


var s = { id: 1 };

//var s = { id: 1, name: "Ahmad" };
$.extend(s, { name: "Ahmad" });

$.extend(plus, {
    auto: function () {

    }
});

plus.form.prototype.dirty = function () {
    
}