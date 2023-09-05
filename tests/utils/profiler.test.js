"use strict";
require("../../config/dotenv").environment("test");
const { test, expect, beforeEach } = require("@jest/globals");
const profiler = require("../../src/utils/profiler");

beforeEach(() => {
    profiler.reset();
});

test("start", () => {
    expect(profiler.sequences).toHaveLength(0);

    profiler.start();

    expect(profiler.sequences).toHaveLength(1);

    profiler.start();

    expect(profiler.sequences).toHaveLength(1);
});

test("reset", () => {
    expect(profiler.sequences).toHaveLength(0);

    profiler.start();

    expect(profiler.sequences).toHaveLength(1);

    profiler.reset();

    expect(profiler.sequences).toHaveLength(0);
});

test("now", () => {
    let testSize = 10000;
    let i = 0;
    let now = profiler.now();
    let second = 0;
    let first = now;

    do
    {
        second = profiler.now();

        expect(typeof now).toBe("number");
        expect(now).toBeGreaterThan(0);

        expect(typeof second).toBe("number");
        expect(second).toBeGreaterThan(0);
        expect(second).toBeGreaterThanOrEqual(now);

        now = second;
    }
    while (++i < testSize);

    expect(now - first).toBeGreaterThan(0);
});

test("mark", () => {
    expect(profiler.sequences).toHaveLength(0);

    let elapsed = profiler.mark();
    expect(elapsed).toBe(-1);
    expect(profiler.sequences).toHaveLength(1);

    let testSize = 10000;
    let first = elapsed;
    for (let i = 1; i <= testSize; i++)
    {
        elapsed = profiler.mark();
        expect(elapsed).toBeGreaterThan(-1);
        expect(profiler.sequences).toHaveLength(1 + i);
    }

    expect(elapsed - first).toBeGreaterThan(0);
});

test("get", () => {
    expect(profiler.sequences).toHaveLength(0);

    let elapsed = profiler.get(false);

    expect(elapsed).toBe(-1);
    expect(profiler.sequences).toHaveLength(0);

    profiler.start();

    expect(profiler.sequences).toHaveLength(1);

    elapsed = profiler.get();
    expect(elapsed).toBeGreaterThan(-1);
    expect(profiler.sequences).toHaveLength(1);

    let testSize = 10000;
    for (let i = 0; i < testSize; i++)
    {
        if (i % 2 === 0)
        {
            elapsed = profiler.get();
        }
        else
        {
            elapsed = profiler.mark();
        }

        expect(elapsed).toBeGreaterThan(-1);
        expect(profiler.sequences).toHaveLength(1 + Math.ceil(i / 2));
    }

    expect(profiler.get(true)).toBeGreaterThan(0);
});

test("wait", async () => {
    let checks = [
        200, // This is the default value of the call, won't run it twice
        5,
        80,
        750,
        1300
    ];
    let maxDistance = 20;

    expect(profiler.sequences).toHaveLength(0);

    profiler.start();

    expect(profiler.sequences).toHaveLength(1);

    await profiler.wait(); // Default: 200, it is compensated for in the `checks` array
    let elapsed = profiler.mark();

    expect(elapsed).toBeGreaterThanOrEqual(200);
    expect(elapsed - 200).toBeLessThanOrEqual(maxDistance);

    for (let i = 1; i < checks.length; i++) // Deliberately skipping first element
    {
        let currentWaitPeriod = checks[i];
        await profiler.wait(currentWaitPeriod);
        elapsed = profiler.mark();

        expect(elapsed).toBeGreaterThanOrEqual(currentWaitPeriod);
        expect(elapsed - currentWaitPeriod).toBeLessThanOrEqual(maxDistance);
    }

    elapsed = profiler.get(true);
    let waitingPeriodsSum = checks.reduce((sum, current) => sum + current, 0);
    expect(elapsed).toBeGreaterThanOrEqual(waitingPeriodsSum);
    expect(elapsed - waitingPeriodsSum).toBeLessThanOrEqual(maxDistance * checks.length);
});