"use strict";
require("../../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { ValueSet } = require("../../../../utils/scheduleResolver/CronScheduler/ValueSet.class");

function generateTestArray(range)
{
    let array = [];
    for (let i = range[0]; i <= range[1]; i++)
    {
        array.push(i);
    }

    return array;
}

test("construct", () => {
    let range = [0, 100];
    let array = generateTestArray(range);
    let valueSet = new ValueSet(range[0], range[1]);

    expect(valueSet.values).toStrictEqual(array);

    let testSize = 1000;
    for (let i = 0; i < testSize; i++)
    {
        range[0] = Math.floor(Math.random() * testSize);
        range[1] = range[0] + Math.floor(Math.random() * testSize);
        array = generateTestArray(range);
        valueSet.generate(range[0], range[1]);

        expect(valueSet.values).toStrictEqual(array);
    }

    valueSet.generate(0, 0);
    expect(valueSet.values).not.toStrictEqual([]);

    expect(() => valueSet.generate()).not.toThrow();
    expect(valueSet.values).toStrictEqual([]);
});

test("empty", () => {
    let valueSet = new ValueSet();
    expect(valueSet.empty()).toBe(true);

    valueSet.generate(0, 1);
    expect(valueSet.empty()).toBe(false);

    valueSet.generate(0, 0);
    expect(valueSet.empty()).toBe(false);

    expect(() => valueSet.generate()).not.toThrow();
    expect(valueSet.empty()).toBe(true);
});

test("filterExact", () => {
    let range = [0, 100];
    let valueSet = new ValueSet(range[0], range[1]);
    valueSet.filterExact(5);

    expect(valueSet.values).toStrictEqual([5]);

    valueSet.generate(range[0], range[1]);
    valueSet.filterExact(105);

    expect(valueSet.values).toStrictEqual([]);

    let badValues = [
        null,
        "aa",
        "",
        undefined,
        -500
    ];
    badValues.forEach(value => {
        valueSet.generate(range[0], range[1]);
        valueSet.filterExact(value);
        expect(valueSet.values).toStrictEqual([]);
    });

    let staticValue = 46;
    valueSet.generate(range[0], range[1]);
    valueSet.filterExact(staticValue);

    expect(valueSet.values).toStrictEqual([staticValue]);
});

test("filterStep", () => {
    let range = [0, 19];
    let mod = {
        "1": generateTestArray(range),
        "2": [0, 2, 4, 6, 8, 10, 12, 14, 16, 18],
        "3": [0, 3, 6, 9, 12, 15, 18],
        "4": [0, 4, 8, 12, 16],
        "5": [0, 5, 10, 15],
        "6": [0, 6, 12, 18],
        "7": [0, 7, 14],
        "8": [0, 8, 16],
        "9": [0, 9, 18],
        "10": [0, 10],
        "25": [0],
    };

    const valueSet = new ValueSet(range[0], range[1]);
    valueSet.filterStep(1);
    expect(valueSet.values).toStrictEqual(mod["1"]);

    valueSet.generate(range[0], range[1]);
    valueSet.filterStep(1, 5, 7);
    expect(valueSet.values).toStrictEqual([5, 6, 7]);

    valueSet.generate(range[0], range[1]);
    valueSet.filterStep(1, 5, 8);
    expect(valueSet.values).not.toStrictEqual([5, 6, 7]);

    valueSet.filterStep(2);
    expect(valueSet.values).toStrictEqual([6, 8]);

    for (let i in mod)
    {
        valueSet.generate(range[0], range[1]);
        valueSet.filterStep(Number(i));

        expect(valueSet.values).toStrictEqual(mod[i]);
    }

    range =  [1, 19];
    valueSet.generate(range[0], range[1]);
    valueSet.filterStep(25);
    expect(valueSet.values).toStrictEqual([]);
});

test("current", () => {
    let valueSet = new ValueSet(1, 10);

    expect(() => valueSet.current()).toThrow();
    expect(() => valueSet.current()).toThrow();

    valueSet.first();
    expect(valueSet.current()).toBe(1);
    expect(valueSet.current()).toBe(1);

    valueSet.generate(5, 15);
    expect(() => valueSet.current()).toThrow();
    expect(() => valueSet.current()).toThrow();

    valueSet.first();
    expect(valueSet.current()).toBe(5);
    expect(valueSet.current()).toBe(5);

    // If we filter after the `#current` pointer is already set, there is no guarantee that the item it points to will
    // be the same or will even exist, therefore it should be reset when the `#values` array is modified.
    valueSet.searchNext(10);
    expect(valueSet.current()).toBe(10);
    valueSet.addFilterExact(6);
    valueSet.filter();
    expect(() => valueSet.current()).toThrow();
});

test("next", () => {
    let range = [1, 10];
    let valueSet = new ValueSet(range[0], range[1]);

    expect(() => valueSet.next()).toThrow();
    expect(() => valueSet.next()).toThrow();

    valueSet.first();
    for (let i = range[0]; i < range[1]; i++)
    {
        let result = valueSet.next();
        expect(valueSet.current()).toBe(i + 1);
        expect(result).toBe(true);
    }

    let result = valueSet.next();
    expect(valueSet.current()).toBe(range[0]);
    expect(result).toBe(false);

    let i = 1;
    do
    {
        expect(valueSet.current()).toBe(i++);
    }
    while (valueSet.next());

    expect(valueSet.current()).toBe(range[0]);
});

test("prev", () => {
    let range = [0, 10];
    let valueSet = new ValueSet(range[0], range[1]);

    expect(() => valueSet.prev()).toThrow();
    expect(() => valueSet.prev()).toThrow();

    valueSet.last();
    for (let i = range[1]; i > range[0]; i--)
    {
        let result = valueSet.prev();
        expect(valueSet.current()).toBe(i - 1);
        expect(result).toBe(true);
    }

    let result = valueSet.prev();
    expect(valueSet.current()).toBe(range[1]);
    expect(result).toBe(false);

    let i = range[1];
    do
    {
        expect(valueSet.current()).toBe(i--);
    }
    while (valueSet.prev());

    expect(valueSet.current()).toBe(range[1]);
});

test("searchNext", () => {
    let valueSet = new ValueSet(1, 10);

    expect(valueSet.searchNext(1)).toBe(true);
    expect(() => valueSet.current()).not.toThrow();
    expect(valueSet.current()).toBe(1);

    expect(valueSet.searchNext(3)).toBe(true);
    expect(() => valueSet.current()).not.toThrow();
    expect(valueSet.current()).toBe(3);

    expect(valueSet.searchNext(10)).toBe(true);
    expect(() => valueSet.current()).not.toThrow();
    expect(valueSet.current()).toBe(10);

    expect(valueSet.searchNext(3.5)).toBe(true);
    expect(() => valueSet.current()).not.toThrow();
    expect(valueSet.current()).toBe(4);

    expect(valueSet.searchNext(11)).toBe(false);
    expect(() => valueSet.current()).toThrow();

    expect(valueSet.searchNext(10.33)).toBe(false);
    expect(() => valueSet.current()).toThrow();

    expect(valueSet.searchNext(9.99)).toBe(true);
    expect(() => valueSet.current()).not.toThrow();
    expect(valueSet.current()).toBe(10);
});

test("on: overflow", () => {
    let range = [1, 10];
    let valueSet = new ValueSet(range[0], range[1]);

    class OverflowError1 extends Error {
    }

    class OverflowError2 extends Error {
    }

    valueSet.on("overflow", () => {
        throw new OverflowError1();
    });
    expect(() => valueSet.searchNext(11)).toThrow(OverflowError1);
    expect(() => valueSet.next()).toThrow();
    expect(() => valueSet.current()).toThrow();

    valueSet.on("overflow", () => {
        throw new OverflowError2();
    });
    expect(() => valueSet.searchNext(11)).toThrow(OverflowError1);
    expect(() => valueSet.next()).toThrow();
    expect(() => valueSet.current()).toThrow();

    valueSet.first();
    for (let i = range[0]; i <= range[1]; i++) {
        if (i < 10) {
            expect(() => valueSet.next()).not.toThrow();
            expect(valueSet.current()).toBe(i + 1);
        } else {
            expect(() => valueSet.next()).toThrow(OverflowError1);
            expect(valueSet.current()).toBe(range[0]);
        }
    }

    valueSet = new ValueSet(range[0], range[1]);
    valueSet.on("overflow", () => {
        valueSet.first();
    });
    expect(() => valueSet.searchNext(11)).not.toThrow();
    expect(() => valueSet.current()).not.toThrow();
    expect(valueSet.current()).toBe(1);

    let i = 1;
    while (valueSet.next())
    {
        expect(valueSet.current()).toBe(++i);
    }
    expect(valueSet.current()).toBe(1);

    valueSet = new ValueSet(range[0], range[1]);
    valueSet.on("overflow", () => {
        try
        {
            valueSet.current();
        }
        catch (e)
        {
            valueSet.first();
        }
        valueSet.next();
    });
    expect(() => valueSet.next()).toThrow();
    valueSet.searchNext(11);
    expect(valueSet.current()).toBe(2);
    i = valueSet.current();
    while (valueSet.next())
    {
        expect(valueSet.current()).toBe(++i);
    }
    expect(valueSet.current()).toBe(2);

    valueSet = new ValueSet(5, 5);
    valueSet.on("overflow", () => {
        throw new OverflowError1();
    });
    valueSet.first();
    expect(valueSet.current()).toBe(5);
    for (let i = 0; i < 10; i++)
    {
        expect(() => valueSet.next()).toThrow(OverflowError1);
    }
});

test("on: underflow", () => {
    let range = [0, 10];
    let valueSet = new ValueSet(range[0], range[1]);

    class OverflowError extends Error{
    }

    class UnderflowError1 extends Error {
    }

    class UnderflowError2 extends Error {
    }

    valueSet.on("overflow", () => {
        throw new OverflowError();
    });
    valueSet.on("underflow", () => {
        throw new UnderflowError1();
    });
    expect(() => valueSet.searchNext(11)).toThrow(OverflowError);
    expect(() => valueSet.prev()).toThrow();
    expect(() => valueSet.current()).toThrow();

    valueSet.first();
    expect(() => valueSet.prev()).toThrow(UnderflowError1);

    valueSet.on("underflow", () => {
        throw new UnderflowError2();
    });
    valueSet.first();
    expect(() => valueSet.prev()).toThrow(UnderflowError1);

    valueSet.last();
    for (let i = range[1]; i >= range[0]; i--) {
        if (i > 0) {
            expect(() => valueSet.prev()).not.toThrow();
            expect(valueSet.current()).toBe(i - 1);
        } else {
            expect(() => valueSet.prev()).toThrow(UnderflowError1);
            expect(valueSet.current()).toBe(range[1]);
        }
    }

    valueSet = new ValueSet(range[0], range[1]);
    valueSet.on("underflow", () => {
        valueSet.last();
    });
    valueSet.first();
    expect(() => valueSet.prev()).not.toThrow();
    expect(() => valueSet.current()).not.toThrow();
    expect(valueSet.current()).toBe(range[1]);

    let i = range[1];
    while (valueSet.prev())
    {
        expect(valueSet.current()).toBe(--i);
    }
    expect(valueSet.current()).toBe(range[1]);

    valueSet = new ValueSet(range[0], range[1]);
    valueSet.on("underflow", () => {
        try
        {
            valueSet.current();
        }
        catch (e)
        {
            valueSet.last();
        }
        valueSet.prev();
    });
    expect(() => valueSet.prev()).toThrow();
    valueSet.first();
    expect(() => valueSet.prev()).not.toThrow();
    expect(valueSet.current()).toBe(range[1] - 1);
    i = valueSet.current();
    while (valueSet.prev())
    {
        expect(valueSet.current()).toBe(--i);
    }
    expect(valueSet.current()).toBe(range[1] - 1);

    valueSet = new ValueSet(5, 5);
    valueSet.on("overflow", () => {
        throw new OverflowError();
    })
    valueSet.on("underflow", () => {
        throw new UnderflowError1();
    });
    valueSet.first();
    expect(valueSet.current()).toBe(5);
    for (let i = 0; i < 10; i++)
    {
        expect(() => valueSet.prev()).toThrow(UnderflowError1);
    }
});

test("addFilterExact", () => {
    let valueSet = new ValueSet(0, 10);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual(generateTestArray([0, 10]));

    valueSet.addFilterExact(5);
    expect(valueSet.values).toStrictEqual(generateTestArray([0, 10]));
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([5]);

    valueSet.addFilterExact(6);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([]);

    valueSet.generate(0, 10);
    valueSet.filter("union");
    expect(valueSet.values).toStrictEqual([5, 6]);

    valueSet.filter("union");
    expect(valueSet.values).toStrictEqual([5, 6]);

    valueSet.filter();
    expect(valueSet.values).toStrictEqual([]);

    valueSet.filter("union");
    expect(valueSet.values).toStrictEqual([]);

    valueSet.addFilterExact(5);
    valueSet.generate(2, 9);
    valueSet.filter("union");
    expect(valueSet.values).toStrictEqual([5, 6]);

    valueSet.generate(6, 10);
    valueSet.filter("union");
    expect(valueSet.values).toStrictEqual([6]);
});

test("addFilterStep", () => {
    let valueSet = new ValueSet(1, 10);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual(generateTestArray([1, 10]));

    valueSet.addFilterStep(1);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual(generateTestArray([1, 10]));

    valueSet.addFilterStep(2);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([2, 4, 6, 8, 10]);

    valueSet.addFilterStep(3);
    expect(valueSet.values).toStrictEqual([2, 4, 6, 8, 10]);

    valueSet.filter();
    expect(valueSet.values).toStrictEqual([6]);

    valueSet.generate(1, 10);
    expect(valueSet.values).toStrictEqual(generateTestArray([1, 10]));
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([6]);

    valueSet.generate(1, 10);
    valueSet.resetFilters();
    expect(valueSet.values).toStrictEqual(generateTestArray([1, 10]));
    valueSet.filter();
    expect(valueSet.values).toStrictEqual(generateTestArray([1, 10]));

    valueSet.addFilterStep(3, 4);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([6, 9]);

    valueSet.addFilterStep(3, null, 4);
    valueSet.filter("union");
    expect(valueSet.values).toStrictEqual([6, 9]);

    valueSet.filter();
    expect(valueSet.values).toStrictEqual([]);

    valueSet.generate(1, 10);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([]);

    valueSet.generate(0, 13);
    valueSet.filter("union");
    expect(valueSet.values).toStrictEqual([0, 3, 6, 9, 12]);

    valueSet.filter("union");
    expect(valueSet.values).toStrictEqual([0, 3, 6, 9, 12]);

    valueSet.filter("sequence");
    expect(valueSet.values).toStrictEqual([]);

    valueSet.generate(20, 30);
    valueSet.filter("union");
    expect(valueSet.values).toStrictEqual([21, 24, 27, 30]);

    valueSet.filter();
    expect(valueSet.values).toStrictEqual([]);

    valueSet.generate(20, 30);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([]);

    valueSet.resetFilters();
    valueSet.addFilterStep(1, 2, 5);
    valueSet.generate(0, 100);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([2, 3, 4, 5]);

    valueSet.addFilterStep(2, 4, 9);
    valueSet.generate(0, 100);
    valueSet.filter("union");
    expect(valueSet.values).toStrictEqual([2, 3, 4, 5, 6, 8]);
});

test("filter", () => {
    let valueSet = new ValueSet(0, 10);
    valueSet.addFilterStep(5);
    valueSet.addFilterExact(5);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([5]);

    valueSet.resetFilters();
    valueSet.addFilterExact(1);
    valueSet.addFilterStep(2, null, 9);
    valueSet.generate(1, 10);
    valueSet.filter("union");
    expect(valueSet.values).toStrictEqual([1, 2, 4, 6, 8]);

    valueSet.filter();
    expect(valueSet.values).toStrictEqual([]);
});

test("setDefaultFilterAggregate", () => {
    let valueSet = new ValueSet(0, 10);
    valueSet.addFilterStep(3);
    valueSet.addFilterExact(5);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([]);

    valueSet.setDefaultFilterAggregate("union");
    valueSet.generate(1, 10);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([3, 5, 6, 9]);
});

test("filter params", () => {
    let valueSet = new ValueSet(0, 10);
    expect(valueSet.getFilterParam(0, "teszt")).toBeUndefined();
    expect(valueSet.getFilterParam(10, "nothing")).toBeUndefined();

    valueSet.addFilterExact(5);
    expect(valueSet.getFilterParam(0, "type")).toBe("exact");
    expect(valueSet.getFilterParam(1, "type")).toBeUndefined();

    valueSet.addFilterStep(2);
    expect(valueSet.getFilterParam(0, "type")).toBe("exact");
    expect(valueSet.getFilterParam(1, "type")).toBe("step");

    expect(valueSet.setFilterParam(10, "type", "new")).toBe(false);
    expect(valueSet.setFilterParam(0, "type", "new")).toBe(true);
    expect(valueSet.getFilterParam(0, "type")).toBe("new");

    valueSet.addFilter(
        (params, value) => {
            let set = params.values || [];
            return set.indexOf(value) > -1;
        },
        { type: "set" }
    );
    expect(valueSet.getFilterParam(2, "type")).toBe("set");

    valueSet.filter("union");
    expect(valueSet.values).toStrictEqual([0, 2, 4, 5, 6, 8, 10]);

    valueSet.filter();
    expect(valueSet.values).toStrictEqual([]);

    valueSet.generate(1, 9);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([]);

    valueSet.setDefaultFilterAggregate("union");

    valueSet.generate(1, 9);
    valueSet.setFilterParam(2, "values", [1]);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([1, 2, 4, 5, 6, 8]);

    valueSet.setFilterParam(2, "values", [2, 9]);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([2, 4, 5, 6, 8]);

    valueSet.generate(1, 9);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([2, 4, 5, 6, 8, 9]);

    let filterGt = function (params, value)
    {
        let min = (params.min !== null && typeof params.min !== "undefined") ? params.min : this.values[0];

        return value > min;
    }

    valueSet.resetFilters();
    valueSet.addFilter(
        filterGt,
        {
            type: "test-unique",
            min: null
        }
    );
    valueSet.addFilterStep(5);
    valueSet.addFilterExact(5);

    valueSet.generate(0, 10);
    valueSet.filter("sequence");
    expect(valueSet.values).toStrictEqual([5]);

    valueSet.resetFilters();
    valueSet.addFilterStep(5);
    valueSet.addFilterExact(5);
    valueSet.addFilter(
        filterGt,
        {
            type: "test-unique",
            min: null
        }
    );
    valueSet.generate(0, 10);
    valueSet.filter("sequence");
    expect(valueSet.values).toStrictEqual([]);

    expect(valueSet.setFilterParam(2, "min", 1)).toBe(true);
    expect(valueSet.getFilterParam(2, "min")).toBe(1);
    valueSet.generate(0, 10);
    valueSet.filter("sequence");
    expect(valueSet.values).toStrictEqual([5]);

    expect(valueSet.getFilterParam(3, "type")).toBeUndefined();

    valueSet.resetFilters();
    valueSet.addFilter(
        filterGt,
        {
            type: "test",
            min: 5,
            test: false
        }
    );
    valueSet.generate(0, 6);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([6]);

    valueSet.setFilterParam(0, "min", 1);
    expect(valueSet.values).toStrictEqual([6]);

    valueSet.generate(0, 6);
    valueSet.filter();
    expect(valueSet.values).toStrictEqual([2, 3, 4, 5, 6]);

    expect(valueSet.getFilterParam(0, "test")).toBe(false);
});