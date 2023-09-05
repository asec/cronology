"use strict";
require("../../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { SyntaxValidatorPart } = require("../../../../src/utils/ScheduleResolver/CronScheduler/SyntaxValidatorPart.class");

test("construct", () => {
    let part = new SyntaxValidatorPart();
    expect(part.raw).toBe("");
    expect(part.type).toBe("");
    expect(part.valid).toBe(false);
    expect(part.value).toBe(0);
    expect(part.range).toStrictEqual([]);

    part = new SyntaxValidatorPart({
        type: "step",
        raw: "teszt",
        range: [0, 1],
        valid: true,
        value: 5
    });
    expect(part.raw).toBe("teszt");
    expect(part.type).toBe("step");
    expect(part.valid).toBe(true);
    expect(part.value).toBe(5);
    expect(part.range).toStrictEqual([0, 1]);
});

test("update", () => {
    let part = new SyntaxValidatorPart();
    part.update({
        raw: "*",
        type: "exact",
        valid: true,
        value: 10,
        range: [0, 100]
    });
    expect(part.raw).toBe("*");
    expect(part.type).toBe("exact");
    expect(part.valid).toBe(true);
    expect(part.value).toBe(10);
    expect(part.range).toStrictEqual([0, 100]);

    part.update({
        raw: "*/2"
    });
    expect(part.raw).toBe("*/2");
    expect(part.type).toBe("exact");
    expect(part.valid).toBe(true);
    expect(part.value).toBe(10);
    expect(part.range).toStrictEqual([0, 100]);

    part.update({
        type: "step"
    });
    expect(part.raw).toBe("*/2");
    expect(part.type).toBe("step");
    expect(part.valid).toBe(true);
    expect(part.value).toBe(10);
    expect(part.range).toStrictEqual([0, 100]);

    part.update({
        valid: false
    });
    expect(part.raw).toBe("*/2");
    expect(part.type).toBe("step");
    expect(part.valid).toBe(false);
    expect(part.value).toBe(10);
    expect(part.range).toStrictEqual([0, 100]);

    part.update({
        value: 20
    });
    expect(part.raw).toBe("*/2");
    expect(part.type).toBe("step");
    expect(part.valid).toBe(false);
    expect(part.value).toBe(20);
    expect(part.range).toStrictEqual([0, 100]);

    part.update({
        range: [0, 1]
    });
    expect(part.raw).toBe("*/2");
    expect(part.type).toBe("step");
    expect(part.valid).toBe(false);
    expect(part.value).toBe(20);
    expect(part.range).toStrictEqual([0, 1]);
});