"use strict";
/**
 * @memberOf Function
 * @param {function} otherClass
 * @returns {boolean}
 */
Function.prototype.isClassExtendedFrom = function (otherClass)
{
    if (typeof this !== "function" || typeof otherClass !== "function")
    {
        return false;
    }

    let result = false;
    let currentClass = this;
    do
    {
        if (currentClass === otherClass)
        {
            result = true;
            break;
        }
        currentClass = Object.getPrototypeOf(currentClass);
    }
    while (currentClass !== null);

    return result;
}