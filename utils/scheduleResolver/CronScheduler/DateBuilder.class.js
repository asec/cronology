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

    /**
     * @param {Date} now
     * @param {Object.<string, SyntaxValidatorPart>} parts
     */
    constructor(now, parts)
    {
        this.#date = now;
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

        if (!this.isValid())
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

        for (let key in parts)
        {
            let prop = this.#getProp(this.#translatePartKeyToPropKey(key));
            prop.filter();
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
        if (!translatedKey)
        {
            throw new Error("Invalid key: '" + key + "'");
        }

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
                this.#actualizeDayOfWeekFilterOffset()
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
                this.#actualizeDayOfWeekFilterOffset();
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

    /**
     * @return boolean
     */
    isValid()
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
            let key = keys[i];
            let prop = this.#getProp(key);
            if (prop === null)
            {
                valid = false;
                break;
            }
            if (prop.getFilterParam(0, "type") === "undefined")
            {
                valid = false;
                break;
            }
            if (key === "day" && prop.getFilterParam(1, "type") === "undefined")
            {
                valid = false;
                break;
            }
            if (prop.empty())
            {
                valid = false;
                break;
            }
        }

        return valid;
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
            this.#regenerateDaysInMonth();
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
            this.#regenerateDaysInMonth();
            this.#day.first();
            this.#hour.first();
            this.#minute.first();
        });

        this.#month.on("underflow", () => {
            this.#date.setUTCFullYear(this.#date.getUTCFullYear() - 1);
            this.#month.last();
            this.#regenerateDaysInMonth();
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
                this.#regenerateDaysInMonth();
                this.#day.first();
                this.#hour.first();
                this.#minute.first();
            }
        });
        this.#day.on("underflow", () => {
            let underflown = !this.#month.prev();
            // Same as with overflow
            if (!underflown) {
                this.#regenerateDaysInMonth();
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

    #getDaysInCurrentMonth()
    {
        return (new Date(Date.UTC(
            this.#date.getUTCFullYear(),
            this.#month.current(),
            0
        ))).getUTCDate();
    }

    #regenerateDaysInMonth()
    {
        this.#day.generate(
            1,
            this.#getDaysInCurrentMonth()
        );
        this.#actualizeDayOfWeekFilterOffset(true);
        this.#day.filter();
    }

    /**
     * @param {boolean} [useProps = false]
     */
    #actualizeDayOfWeekFilterOffset(useProps = false)
    {
        let firstOfCurrentMonth = new Date(Date.UTC(
            this.#date.getUTCFullYear(),
            useProps ? this.#month.current() - 1 : this.#date.getUTCMonth(),
            1
        ));
        this.#day.setFilterParam(1, "offset", firstOfCurrentMonth.getUTCDay() - 1);
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