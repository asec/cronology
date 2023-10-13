"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { ScheduleRouteScheduleResult } = require("../../../src/api/responses");
const { ApiException } = require("../../../src/exception");

test("constructor / set / setAll", () => {
    let result = new ScheduleRouteScheduleResult({});
    let now = new Date();
    expect(result.toObject()).toStrictEqual({
        success: false,
        now: null,
        next: []
    });

    result = new ScheduleRouteScheduleResult({
        success: true,
        now,
        next: [
            now,
            now
        ]
    });
    expect(result.toObject()).toStrictEqual({
        success: true,
        now,
        next: [
            now,
            now
        ]
    });

    let now2 = new Date("2023-10-04T12:13:11.812Z");
    result.next.push(now2);
    expect(result.toObject()).toStrictEqual({
        success: true,
        now,
        next: [
            now,
            now,
            now2
        ]
    });

    result = new ScheduleRouteScheduleResult({
        foo: "bar",
        baz: 12
    });
    expect(result.toObject()).toStrictEqual({
        success: false,
        now: null,
        next: []
    });

    expect(result.set("success", true)).toBe(true);
    expect(result.toObject()).toStrictEqual({
        success: true,
        now: null,
        next: []
    });

    expect(result.set("now", now2)).toBe(true);
    expect(result.toObject()).toStrictEqual({
        success: true,
        now: now2,
        next: []
    });

    expect(() => result.set("next", now)).toThrow(ApiException);
    expect(() => result.set("next", [now, 10])).toThrow(ApiException);
    expect(result.set("next", [now])).toBe(true);
    expect(result.toObject()).toStrictEqual({
        success: true,
        now: now2,
        next: [
            now
        ]
    });

    expect(result.set("foo", now)).toBe(false);
    expect(result.toObject()).toStrictEqual({
        success: true,
        now: now2,
        next: [
            now
        ]
    });

    expect(result.set("setAll", now)).toBe(false);

    expect(result.setAll({
        success: false
    })).toBe(true);
    expect(result.toObject()).toStrictEqual({
        success: false,
        now: now2,
        next: [
            now
        ]
    });

    expect(result.setAll({
        now
    })).toBe(true);
    expect(result.toObject()).toStrictEqual({
        success: false,
        now,
        next: [
            now
        ]
    });

    expect(() => result.setAll({
        next: now2
    })).toThrow(ApiException);

    expect(() => result.setAll({
        next: [now2, now, "2023-10-04T12:17:14.791Z"]
    })).toThrow(ApiException);

    expect(result.setAll({
        next: [now2, now]
    })).toBe(true);
    expect(result.toObject()).toStrictEqual({
        success: false,
        now,
        next: [
            now2,
            now
        ]
    });

    expect(result.setAll({
        foo: "bar",
        bar: 12,
        baz: new Date()
    })).toBe(false);
    expect(result.toObject()).toStrictEqual({
        success: false,
        now,
        next: [
            now2,
            now
        ]
    });
});