"use strict";
require("../../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { SyntaxValidator } = require("../../../../src/utils/ScheduleResolver/CronScheduler/SyntaxValidator.class");
const { fcProvider, getTableFromProvider } = require("./providers");

/**
 * @param {SyntaxValidatorPartData} minute
 * @param {SyntaxValidatorPartData} hour
 * @param {SyntaxValidatorPartData} dayOfMonth
 * @param {SyntaxValidatorPartData} month
 * @param {SyntaxValidatorPartData} dayOfWeek
 * @return {Object.<string, SyntaxValidatorPartData>}
 */
function buildExpected(minute, hour, dayOfMonth, month, dayOfWeek)
{
    return {
        minute,
        hour,
        dayOfMonth,
        month,
        dayOfWeek
    };
}

/**
 * @param {number} value
 * @param {'exact', 'step', ''} [type = 'exact']
 * @param {boolean} valid
 * @return {SyntaxValidatorPartData}
 */
let expectedPartGenerator = function (value, type = "exact", valid = true)
{
    return {
        type,
        valid,
        value
    };
}

/**
 * @param {Object.<string, SyntaxValidatorPart>} parts
 * @param {Object.<string, SyntaxValidatorPartData>} expected
 */
function validateExpectedParts(parts, expected)
{
    for (let i in expected)
    {
        for (let j in expected[i])
        {
            expect(parts[i][j]).toBe(expected[i][j]);
        }
    }
}

test.each(getTableFromProvider(fcProvider))(
    "construct: '%s' %s",
    /**
     * @param {string} cronTiming
     * @param {boolean} expected
     */
    (cronTiming, expected) => {

        const validator = new SyntaxValidator(cronTiming);
        expect(validator.isValid()).toBe(expected);
    }
);

test("parts", () => {
    let cronTiming = "*****";
    let validator = new SyntaxValidator(cronTiming);

    /**
     * @type {SyntaxValidatorPartData}
     */
    let expectedPart = {
        type: "step",
        valid: true,
        value: 1
    };
    let expected = buildExpected(expectedPart, expectedPart, expectedPart, expectedPart, expectedPart);
    validateExpectedParts(validator.parts, expected);

    cronTiming = "1 2 3 4 5";
    validator = new SyntaxValidator(cronTiming);

    expected = buildExpected(
        expectedPartGenerator(1),
        expectedPartGenerator(2),
        expectedPartGenerator(3),
        expectedPartGenerator(4),
        expectedPartGenerator(5)
    );
    validateExpectedParts(validator.parts, expected);

    cronTiming = "*/2*/3*/4*/5*/6";
    validator = new SyntaxValidator(cronTiming);
    expected = buildExpected(
        expectedPartGenerator(2, "step"),
        expectedPartGenerator(3, "step"),
        expectedPartGenerator(4, "step"),
        expectedPartGenerator(5, "step"),
        expectedPartGenerator(6, "step")
    );
    validateExpectedParts(validator.parts, expected);

    cronTiming = "* * * *";
    validator = new SyntaxValidator(cronTiming);
    expected = buildExpected(
        expectedPartGenerator(0, '', false),
        expectedPartGenerator(0, '', false),
        expectedPartGenerator(0, '', false),
        expectedPartGenerator(0, '', false),
        expectedPartGenerator(0, '', false)
    );
    validateExpectedParts(validator.parts, expected);

    cronTiming = "*/0 99 */99 */32 7";
    validator = new SyntaxValidator(cronTiming);
    expected = buildExpected(
        expectedPartGenerator(0, '', false),
        expectedPartGenerator(0, '', false),
        expectedPartGenerator(0, '', false),
        expectedPartGenerator(0, '', false),
        expectedPartGenerator(0, '', false)
    );
    validateExpectedParts(validator.parts, expected);

    cronTiming = "*/0 * * 5 *";
    validator = new SyntaxValidator(cronTiming);
    expected = buildExpected(
        expectedPartGenerator(0, '', false),
        expectedPartGenerator(1, 'step'),
        expectedPartGenerator(1, 'step'),
        expectedPartGenerator(5),
        expectedPartGenerator(1, 'step'),
    );
    validateExpectedParts(validator.parts, expected);

    cronTiming = "* 99 * 5 *";
    validator = new SyntaxValidator(cronTiming);
    expected = buildExpected(
        expectedPartGenerator(1, 'step'),
        expectedPartGenerator(0, '', false),
        expectedPartGenerator(1, 'step'),
        expectedPartGenerator(5),
        expectedPartGenerator(1, 'step'),
    );
    validateExpectedParts(validator.parts, expected);

    cronTiming = "* 2 */99 5 *";
    validator = new SyntaxValidator(cronTiming);
    expected = buildExpected(
        expectedPartGenerator(1, 'step'),
        expectedPartGenerator(2),
        expectedPartGenerator(0, '', false),
        expectedPartGenerator(5),
        expectedPartGenerator(1, 'step'),
    );
    validateExpectedParts(validator.parts, expected);

    cronTiming = "* 2 * */32 *";
    validator = new SyntaxValidator(cronTiming);
    expected = buildExpected(
        expectedPartGenerator(1, 'step'),
        expectedPartGenerator(2),
        expectedPartGenerator(1, 'step'),
        expectedPartGenerator(0, '', false),
        expectedPartGenerator(1, 'step'),
    );
    validateExpectedParts(validator.parts, expected);

    cronTiming = "* 2 * */5 7";
    validator = new SyntaxValidator(cronTiming);
    expected = buildExpected(
        expectedPartGenerator(1, 'step'),
        expectedPartGenerator(2),
        expectedPartGenerator(1, 'step'),
        expectedPartGenerator(5, 'step'),
        expectedPartGenerator(0, '', false),
    );
    validateExpectedParts(validator.parts, expected);
});

test("expression", () => {
    let goodOnes = [
        "* * * * *",
        "1 2 3 4 5",
        "*/1 */2 */3 */4 */5",
        "* 2 */3 * 5"
    ];
    goodOnes.forEach(cronTiming => {
        let validator = new SyntaxValidator(cronTiming);
        expect(validator.expression).toBe(cronTiming);
    });

    let cronTiming = "* * * * * ";
    let validator = new SyntaxValidator(cronTiming);
    expect(validator.expression).not.toBe(cronTiming);
    expect(validator.expression).toBe(cronTiming.trim());

    cronTiming = "*/1*/22*/3*/4*/5";
    validator = new SyntaxValidator(cronTiming);
    expect(validator.expression).toBe("*/1 */22 */3 */4 */5");

    cronTiming = "*/1*/66*/3*/4*/5";
    validator = new SyntaxValidator(cronTiming);
    expect(validator.expression).toBe("*/1 {X} */3 */4 */5");

    cronTiming = "* * * ";
    validator = new SyntaxValidator(cronTiming);
    expect(validator.expression).toBe("{X} {X} {X} {X} {X}");

    cronTiming = "1 60 3 0 7";
    validator = new SyntaxValidator(cronTiming);
    expect(validator.expression).toBe("1 {X} 3 {X} {X}");

    cronTiming = "*****";
    validator = new SyntaxValidator(cronTiming);
    expect(validator.expression).toBe("* * * * *");
});