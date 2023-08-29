"use strict";

/**
 * @typedef {Object} FilterParams
 * @property {'exact', 'step'} type
 * @property {number} [offset]
 * @property {boolean} unrestricted
 * @property {...*} [anything-else]
 */

class ValueSet
{
    #current = -1;
    /**
     * @type {number[]}
     * @see #values
     */
    #_values = [];
    set #values(values)
    {
        this.#_values = values;
        // If the #_values array is changed there is no guarantee that the item that `#current` points to will
        // be the same or will even exist, therefore the pointer should be reset when it happens.
        this.#current = -1;
    }
    get #values()
    {
        return this.#_values;
    }
    /**
     * @type {function()|null}
     */
    #onOverflow = null;
    /**
     * @type {function()|null}
     */
    #onUnderflow = null;
    /**
     * @type {(function(params: FilterParams, value: number): boolean)[]}
     */
    #filters = [];
    /**
     * @type {FilterParams[]}
     */
    #filterParams = [];
    /**
     * @type {'sequence'|'union'}
     */
    #defaultFilterAggregate = "sequence";

    get values()
    {
        if (process.env.APP_ENV !== "test")
        {
            throw new Error("This property should only be accessed in test mode.");
        }
        return this.#values;
    }

    /**
     * @param {number} min
     * @param {number} max
     */
    constructor(min, max)
    {
        this.generate(min, max);
    }

    /**
     * @param {number} min
     * @param {number} max
     */
    generate(min, max)
    {
        this.#current = -1;
        this.#values = [];
        for (let i = min; i <= max; i++)
        {
            this.#values.push(i);
        }
    }

    empty()
    {
        return this.#values.length === 0;
    }

    first()
    {
        this.#current = 0;
    }

    last()
    {
        this.#current = this.#values.length - 1;
    }

    /**
     * @return {boolean}
     */
    next()
    {
        if (this.#current === -1)
        {
            throw new Error("The `current` pointer is not set.");
        }

        this.#current++;
        let finished = false;

        if (this.#current >= this.#values.length)
        {
            this.first();
            finished = true;
            if (typeof this.#onOverflow === "function")
            {
                this.#onOverflow();
            }
        }

        return !finished;
    }

    /**
     * @return {boolean}
     */
    prev()
    {
        if (this.#current === -1)
        {
            throw new Error("The `current` pointer is not set.");
        }

        this.#current--;
        let finished = false;

        if (this.#current < 0)
        {
            this.last();
            finished = true;
            if (typeof this.#onUnderflow === "function")
            {
                this.#onUnderflow();
            }
        }

        return !finished;
    }

    current()
    {
        if (this.#current === -1)
        {
            throw new Error("The `current` pointer is not set.");
        }

        return this.#values[this.#current];
    }

    /**
     * @param {function(params: FilterParams, value: number): boolean} filterFunction
     * @param {FilterParams} params
     */
    addFilter(filterFunction, params = {})
    {
        if (typeof filterFunction === "function")
        {
            this.#filters.push(filterFunction);
            this.#filterParams.push(params);
        }
    }

    resetFilters()
    {
        this.#filters = [];
        this.#filterParams = [];
    }

    /**
     * @param {'sequence'|'union'} aggregate - Sets the default filter aggregate value for `filter()` method. Can be 'sequence' or
     * 'union'. Defaults to 'sequence'.
     */
    setDefaultFilterAggregate(aggregate)
    {
        this.#defaultFilterAggregate = aggregate;
    }

    /**
     * @param {'sequence'|'union'|null} [aggregate = null] - If it's a `null`, the default filter aggregate value will be used,
     * which can be set by `setDefaultFilterAggregate(aggregate: 'sequence' | 'union')` and defaults to `'sequence'`.
     */
    filter(aggregate = null)
    {
        if (!this.#filters.length)
        {
            return;
        }

        if (aggregate === null)
        {
            aggregate = this.#defaultFilterAggregate;
        }

        if (aggregate === "sequence")
        {
            for (let i = 0; i < this.#filters.length; i++)
            {
                let params = this.#filterParams[i];
                this.#values = this.#values.filter(this.#filters[i].bind(this, params));
            }
        }
        else if (aggregate === "union")
        {
            let result = [];
            for (let i = 0; i < this.#filters.length; i++)
            {
                let params = this.#filterParams[i];
                let values = this.#values.filter(this.#filters[i].bind(this, params));
                for (let i = 0; i < values.length; i++)
                {
                    if (result.indexOf(values[i]) === -1)
                    {
                        result.push(values[i]);
                    }
                }
            }
            result.sort((a, b) => a - b);
            this.#values = result;
        }
    }

    /**
     * @param {number} index
     * @param {string} paramName
     * @return {undefined|string|number}
     */
    getFilterParam(index, paramName)
    {
        if (!this.#filterParams[index])
        {
            return undefined;
        }

        let keys = Object.keys(this.#filterParams[index]);
        if (keys.indexOf(paramName) === -1)
        {
            return undefined;
        }

        return this.#filterParams[index][paramName];
    }

    /**
     * @param {number} index
     * @param {string} paramName
     * @param {string, number} value
     * @return {boolean}
     */
    setFilterParam(index, paramName, value)
    {
        if (!this.#filterParams[index])
        {
            return false;
        }

        this.#filterParams[index][paramName] = value;

        return true;
    }

    /**
     * @param {number} number
     */
    addFilterExact(number)
    {
        this.addFilter(
            (params, value) => value === number,
            {type: "exact", unrestricted: false}
        );
    }

    /**
     * @param {number} number
     */
    filterExact(number)
    {
        this.resetFilters();
        this.addFilterExact(number);
        this.filter();
    }

    /**
     * @param {number} step
     * @param {number|null} [min = null] - The minimal value the filter should check for (inclusive). If it is `null`
     * the value will be the first item from `#values`.
     * @param {number|null} [max = null] - The maximal value the filter should check for (inclusive). If it is `null`
     * the value will be the last item from `#values`.
     */
    addFilterStep(step, min = null, max = null)
    {
        this.addFilter(
            (params, value) => {
                let cMin = min, cMax = max;
                if (cMin === null)
                {
                    cMin = this.#values[0];
                }
                if (cMax === null)
                {
                    cMax = this.#values[this.#values.length - 1];
                }

                return (value >= cMin && value <= cMax && value % step === 0);
            },
            {type: "step", unrestricted: step === 1}
        );
    }

    /**
     * @param {number} step
     * @param {number|null} [min = null] - The minimal value the filter should check for (inclusive). If it is `null`
     * the value will be the first item from `#values`.
     * @param {number|null} [max = null] - The maximal value the filter should check for (inclusive). If it is `null`
     * the value will be the last item from `#values`.
     */
    filterStep(step, min = null, max = null)
    {
        this.resetFilters();
        if (!this.#values.length)
        {
            return;
        }

        this.addFilterStep(step, min, max);
        this.filter();
    }

    /**
     * Sets the `#current` pointer to the closest value that is bigger than or equal to `v`. If such a value can't be
     * found it overflows.
     * @param {number} v
     * @return {boolean} - Returns `true` if a suitable value could be found, `false` otherwise. If it returns a `false`
     * that means the ValueSet has overflown, which in turn has fired the `overflow` event.
     */
    searchNext(v)
    {
        let found = -1;
        for (let i = 0; i < this.#values.length; i++)
        {
            const value = this.#values[i];
            if (value >= v)
            {
                found = i;
                break;
            }
        }

        this.#current = found;
        let overflown = (this.#current === -1);
        if (overflown && typeof this.#onOverflow === "function")
        {
            this.#onOverflow();
        }

        return !overflown;
    }

    /**
     * @param {'underflow'|'overflow'} event
     * @param {function()} callback
     * @return {boolean, null}
     */
    on(event, callback)
    {
        if (event === "overflow")
        {
            if (this.#onOverflow === null && typeof callback === "function")
            {
                this.#onOverflow = callback;
                return true;
            }
            return false;
        }

        if (event === "underflow")
        {
            if (this.#onUnderflow === null && typeof callback === "function")
            {
                this.#onUnderflow = callback;
                return true;
            }

            return false;
        }

        return null;
    }
}

module.exports = {
    ValueSet
}