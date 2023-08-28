"use strict";
String.prototype.toLazyUTCString = function ()
{
    return this.replace(/ /, "T") + ".000Z";
};

String.prototype.toUpperCaseFirst = function ()
{
    return this.charAt(0).toUpperCase() + this.slice(1);
};