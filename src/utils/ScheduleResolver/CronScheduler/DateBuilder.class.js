"use strict";
const { ValueSet } = require("./ValueSet.class");
const { SyntaxValidatorPart } = require("./SyntaxValidatorPart.class");

class DateBuilder
{
    /**
     * @type {ValueSet}
     */
    #minute = null;
    /**
     * @type {ValueSet}
     */
    #hour = null;
    /**
     * @type {ValueSet}
     */
    #day = null;
    /**
     * @type {ValueSet}
     */
    #month = null;

    /**
     * @type {Date}
     */
    #date = null;
    #isInitialized = false;
    #isPreflightValidationOkay = false;

    /**
     * @param {Date} now
     * @param {Object.<string, SyntaxValidatorPart>} parts
     */
    constructor(now, parts)
    {
        this.#date = new Date(now);
        this.#setUpProps(parts);
    }

    /**
     * @param {Object.<string, SyntaxValidatorPart>} parts
     * @return boolean
     */
    #setUpProps(parts)
    {
        for (let key in parts)
        {
            this.#createFilters(key, parts[key]);
        }

        if (!this.isValid(true))
        {
            return false;
        }

        if (
            this.#day.getFilterParam(0, "unrestricted") === false &&
            this.#day.getFilterParam(1, "unrestricted") === false
        )
        {
            this.#day.setDefaultFilterAggregate("union");
        }

        this.#regenerateDaysInMonth(this.#date.getUTCFullYear(), this.#date.getUTCMonth() + 1, this.#day);

        for (let key in parts)
        {
            let prop = this.#getProp(this.#translatePartKeyToPropKey(key));
            prop.filter();
        }

        if (this.checkMonthDayValidity())
        {
            this.#isPreflightValidationOkay = true;
        }

        return this.isValid();
    }

    /**
     * @param {string} key
     * @param {SyntaxValidatorPart} part
     */
    #createFilters(key, part)
    {
        const translatedKey = this.#translatePartKeyToPropKey(key);
        let prop = this.#getProp(translatedKey);

        if (!(prop instanceof ValueSet))
        {
            prop = new ValueSet(part.range[0], part.range[1]);
        }

        if (part.type === "exact")
        {
            if (key === "dayOfWeek")
            {
                prop.addFilter(
                    (params, value) => (value + params.offset) % 7 === part.value,
                    { type: "exact", offset: 0, unrestricted: false }
                );
                this.#actualizeDayOfWeekFilterOffsetForCurrentData();
            }
            else
            {
                prop.addFilterExact(part.value);
            }
        }
        else if (part.type === "step")
        {
            if (key === "dayOfWeek")
            {
                prop.addFilter(
                    (params, value) => (value + params.offset) % 7 % part.value === 0,
                    { type: "step", offset: 0, unrestricted: part.value === 1 }
                );
                this.#actualizeDayOfWeekFilterOffsetForCurrentData();
            }
            else
            {
                prop.addFilterStep(part.value);
            }
        }

        this.#setProp(translatedKey, prop);
    }

    /**
     * @param {string} key
     * @return {string}
     */
    #translatePartKeyToPropKey(key)
    {
        const translate = {
            minute: "minute",
            hour: "hour",
            dayOfMonth: "day",
            month: "month",
            dayOfWeek: "day"
        };

        if (!translate[key])
        {
            throw new Error("This key cannot be translated: '" + key + "'");
        }

        return translate[key];
    }

    /**
     * @param {string} key
     * @return {ValueSet|null}
     */
    #getProp(key)
    {
        let prop;
        switch (key)
        {
            case "minute":
                prop = this.#minute;
                break;
            case "hour":
                prop = this.#hour;
                break;
            case "day":
                prop = this.#day;
                break;
            case "month":
                prop = this.#month;
                break;
        }

        return prop;
    }

    /**
     * @param {string} key
     * @param {ValueSet} value
     */
    #setProp(key, value)
    {
        switch (key)
        {
            case "minute":
                this.#minute = value;
                break;
            case "hour":
                this.#hour = value;
                break;
            case "day":
                this.#day = value;
                break;
            case "month":
                this.#month = value;
                break;
        }
    }

    checkMonthDayValidity()
    {
        if (this.#day.empty())
        {
            let isValid = false;
            const validationProps = {
                month: ValueSet.copy(this.#month),
                day: ValueSet.copy(this.#day)
            };
            let startDate = new Date(this.#date);
            validationProps.month.first();
            startDate.setUTCMonth(validationProps.month.current() - 1);
            startDate.setUTCDate(1);
            startDate.setUTCHours(0, 0, 0, 0);
            let maxDate = new Date(startDate);
            maxDate.setUTCFullYear(maxDate.getUTCFullYear() + 5);

            validationProps.month.on("overflow", () => {
                startDate.setUTCFullYear(startDate.getUTCFullYear() + 1);
            });

            while (startDate <= maxDate)
            {
                this.#regenerateDaysInMonth(
                    startDate.getUTCFullYear(),
                    validationProps.month.current(),
                    validationProps.day
                );

                if (!validationProps.day.empty()) {
                    isValid = true;
                    break;
                }

                validationProps.month.next();
                startDate.setUTCMonth(validationProps.month.current() - 1);
            }

            return isValid;
        }

        return true;
    }

    /**
     * @param {boolean} [syntaxOnly = false]
     * @return boolean
     */
    isValid(syntaxOnly = false)
    {
        let valid = true;
        let keys = [
            "minute",
            "hour",
            "day",
            "month"
        ];

        for (let i = 0; i < keys.length; i++)
        {
            const key = keys[i];
            const prop = this.#getProp(key);
            if (prop === null)
            {
                valid = false;
                break;
            }
            if (typeof prop.getFilterParam(0, "type") === "undefined")
            {
                valid = false;
                break;
            }
            if (key === "day" && typeof prop.getFilterParam(1, "type") === "undefined")
            {
                valid = false;
                break;
            }
            if (syntaxOnly && prop.empty())
            {
                valid = false;
                break;
            }
            if (!syntaxOnly && key !== "day" && prop.empty())
            {
                valid = false;
                break;
            }
        }

        if (syntaxOnly)
        {
            return valid;
        }

        return valid && this.#isPreflightValidationOkay;
    }

    generateInitialValue()
    {
        if (!this.isValid())
        {
            throw new Error("Can't generate initial date if the DateBuilder setup is invalid.");
        }

        if (this.#isInitialized)
        {
            throw new Error("Can't reinitialize DateBuilder because it was already fully set up.");
        }

        const now = new Date(this.#date);

        // Setting up and generating: month
        this.#createEventsForMonth();
        let overflown = this.#getNextMonthRelativeToNow();
        if (!overflown)
        {
            this.#regenerateDaysInMonthForCurrentData();
            let isSelectedMonthInTheFuture = (
                this.#date.getUTCFullYear() !== now.getUTCFullYear() ||
                this.#month.current() !== now.getUTCMonth() + 1
            );
            if (isSelectedMonthInTheFuture)
            {
                this.#day.first();
                this.#hour.first();
                this.#minute.first();
            }
        }

        // Setting up and generating: day
        this.#createEventsForDay();
        overflown = this.#getNextDayRelativeToNow();
        let isSelectedDayInTheFuture = this.#day.current() !== now.getUTCDate();
        if (!overflown && isSelectedDayInTheFuture)
        {
            this.#hour.first();
            this.#minute.first();
        }

        // Setting up and generating: hour
        this.#createEventsForHour();
        overflown = this.#getNextHourRelativeToNow();
        let isSelectedHourInTheFuture = this.#hour.current() !== now.getUTCHours();
        if (!overflown && isSelectedHourInTheFuture)
        {
            this.#minute.first();
        }

        // Setting up and generating: minute
        this.#createEventsForMinute();
        this.#getNextMinuteRelativeToNow();

        this.#actualizeDate();
        if (this.#date <= now)
        {
            this.next();
        }

        this.prev();

        this.#isInitialized = true;
    }

    #createEventsForMonth()
    {
        this.#month.on("overflow", () => {
            this.#date.setUTCFullYear(this.#date.getUTCFullYear() + 1);
            this.#month.first();
            this.#regenerateDaysInMonthForCurrentData();
            while (this.#day.empty())
            {
                this.#month.next();
                this.#regenerateDaysInMonthForCurrentData();
            }
            this.#day.first();
            this.#hour.first();
            this.#minute.first();
        });

        this.#month.on("underflow", () => {
            this.#date.setUTCFullYear(this.#date.getUTCFullYear() - 1);
            this.#month.last();
            this.#regenerateDaysInMonthForCurrentData();
            while (this.#day.empty())
            {
                this.#month.prev();
                this.#regenerateDaysInMonthForCurrentData();
            }
            this.#day.last();
            this.#hour.last();
            this.#minute.last();
        });
    }

    #createEventsForDay()
    {
        this.#day.on("overflow", () => {
            let overflown = !this.#month.next();
            // If there was an overflow, the month overflow event already set these, no need to do it twice
            if (!overflown) {
                this.#regenerateDaysInMonthForCurrentData();
                while (this.#day.empty())
                {
                    this.#month.next();
                    this.#regenerateDaysInMonthForCurrentData();
                }
                this.#day.first();
                this.#hour.first();
                this.#minute.first();
            }
        });

        this.#day.on("underflow", () => {
            let underflown = !this.#month.prev();
            // Same as with overflow
            if (!underflown) {
                this.#regenerateDaysInMonthForCurrentData();
                while (this.#day.empty())
                {
                    this.#month.prev();
                    this.#regenerateDaysInMonthForCurrentData();
                }
                this.#day.last();
                this.#hour.last();
                this.#minute.last();
            }
        });
    }

    #createEventsForHour()
    {
        this.#hour.on("overflow", () => {
            let overflown = !this.#day.next();
            if (!overflown) {
                this.#hour.first();
                this.#minute.first();
            }
        });

        this.#hour.on("underflow", () => {
            let underflown = !this.#day.prev();
            if (!underflown) {
                this.#hour.last();
                this.#minute.last();
            }
        });
    }

    #createEventsForMinute()
    {
        this.#minute.on("overflow", () => {
            this.#hour.next();
            this.#minute.first();
        });

        this.#minute.on("underflow", () => {
            this.#hour.prev();
            this.#minute.last();
        });
    }

    /**
     * @param {number} year
     * @param {number} month - Number of the month of the year. Can be a number 1 - 12.
     * @returns {number}
     */
    #getDaysInMonth(year, month)
    {
        /*return (new Date(Date.UTC(
            !year ? this.#date.getUTCFullYear() : year,
            month < 1 ? this.#month.current() : month,
            0
        ))).getUTCDate();*/
        return (new Date(Date.UTC(
            year,
            month,
            0
        ))).getUTCDate();
    }

    /**
     * This deletes the currently selected day, because it re-filters the #days ValueSet.
     * @param {number} year
     * @param {number} month - Number of the month of the year. Can be a number 1 - 12.
     * @param {ValueSet} dayValueSet
     */
    #regenerateDaysInMonth(year, month, dayValueSet)
    {
        // useProps = true
        /*dayValueSet.generate(
            1,
            this.#getDaysInMonth(
                0,
                useProps
                    ? this.#month.current()
                    : (monthToCheck < 1 ? this.#date.getUTCMonth() + 1 : monthToCheck)
            )
        );
        this.#actualizeDayOfWeekFilterOffset(useProps);
        dayValueSet.filter();*/
        dayValueSet.generate(
            1,
            this.#getDaysInMonth(year, month)
        );
        this.#actualizeDayOfWeekFilterOffset(year, month, dayValueSet);
        dayValueSet.filter();
    }

    #regenerateDaysInMonthForCurrentData()
    {
        this.#regenerateDaysInMonth(
            this.#date.getUTCFullYear(),
            this.#month.current(),
            this.#day
        );
    }

    /**
     * @param {number} year
     * @param {number} month - Number of the month of the year. Can be a number 1 - 12.
     * @param {ValueSet} dayValueSet
     */
    #actualizeDayOfWeekFilterOffset(year, month, dayValueSet)
    {
        /*let firstOfCurrentMonth = new Date(Date.UTC(
            this.#date.getUTCFullYear(),
            useProps ? this.#month.current() - 1 : this.#date.getUTCMonth(),
            1
        ));
        this.#day.setFilterParam(1, "offset", firstOfCurrentMonth.getUTCDay() - 1);*/
        let firstOfCurrentMonth = new Date(Date.UTC(
            year,
            month - 1,
            1
        ));
        dayValueSet.setFilterParam(1, "offset", firstOfCurrentMonth.getUTCDay() - 1);
    }

    #actualizeDayOfWeekFilterOffsetForCurrentData()
    {
        this.#actualizeDayOfWeekFilterOffset(
            this.#date.getUTCFullYear(),
            this.#date.getUTCMonth() + 1,
            this.#day
        );
    }

    #actualizeDate()
    {
        this.#date.setUTCMinutes(this.#minute.current(), 0, 0);
        this.#date.setUTCHours(this.#hour.current());
        this.#date.setUTCDate(1);
        this.#date.setUTCMonth(this.#month.current() - 1);
        this.#date.setUTCDate(this.#day.current());
    }

    /**
     * @return {boolean}
     */
    #getNextMonthRelativeToNow()
    {
        let overflown = false;
        try
        {
            this.#month.current();
        }
        catch (e)
        {
            let cValue = this.#date.getUTCMonth() + 1;
            overflown = !this.#month.searchNext(cValue);
        }

        return overflown;
    }

    /**
     * @return {boolean}
     */
    #getNextDayRelativeToNow()
    {
        let overflown = false;
        try
        {
            this.#day.current();
        }
        catch (e)
        {
            let cValue = this.#date.getUTCDate();
            overflown = !this.#day.searchNext(cValue);
        }

        return overflown;
    }

    /**
     * @return {boolean}
     */
    #getNextHourRelativeToNow()
    {
        let overflown = false;
        try
        {
            this.#hour.current();
        }
        catch (e)
        {
            let cValue = this.#date.getUTCHours();
            overflown = !this.#hour.searchNext(cValue);
        }

        return overflown;
    }

    #getNextMinuteRelativeToNow()
    {
        try
        {
            this.#minute.current();
        }
        catch (e)
        {
            let cValue = this.#date.getUTCMinutes();
            this.#minute.searchNext(cValue);
        }
    }

    /**
     * @return {Date}
     */
    next()
    {
        if (!this.isValid())
        {
            throw new Error("Can't generate next date if the DateBuilder setup is invalid.");
        }

        this.#minute.next();
        this.#actualizeDate();

        return this.#date;
    }

    /**
     * @return {Date}
     */
    prev()
    {
        if (!this.isValid())
        {
            throw new Error("Can't generate previous date if the DateBuilder setup is invalid.");
        }

        this.#minute.prev();
        this.#actualizeDate();

        return this.#date;
    }
}

module.exports = {
    DateBuilder
};