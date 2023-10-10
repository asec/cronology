"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { DefaultSignatureResult } = require("../../../src/api/responses");

test("constructor", () => {
    let result = new DefaultSignatureResult({});
    expect(result.toObject()).toStrictEqual({ success: false, result: "" });

    result = new DefaultSignatureResult({
        success: true,
        result: "test"
    });
    expect(result.toObject()).toStrictEqual({ success: true, result: "test" });

    expect(result.setAll({
        success: false,
        result: "tst"
    })).toBe(true);
    expect(result.toObject()).toStrictEqual({ success: false, result: "tst" });

    expect(result.set("success", true)).toBe(true);
    expect(result.toObject()).toStrictEqual({ success: true, result: "tst" });
});