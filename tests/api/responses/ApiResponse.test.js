"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { ApiResponse } = require("../../../src/api/responses/ApiResponse.class");

test("constructor", () => {
    let response = new ApiResponse();
    expect(response.toObject()).toStrictEqual({ success: false });

    response = new ApiResponse({
        success: true
    });
    expect(response.toObject()).toStrictEqual({ success: true });

    response = new ApiResponse({
        success: true,
        invalid: "noop"
    });
    expect(response.toObject()).toStrictEqual({ success: true });
});

test("set", () => {
    let response = new ApiResponse();
    expect(response.set("success", true)).toBe(true);
    expect(response.toObject()).toStrictEqual({ success: true });

    expect(response.set("invalid", "teszt")).toBe(false);
    expect(response.toObject()).toStrictEqual({ success: true });

    expect(response.set({ success: false })).toBe(true);
    expect(response.toObject()).toStrictEqual({ success: false });

    expect(response.set({ success: true, invalid: "aaaa" })).toBe(false);
    expect(response.toObject()).toStrictEqual({ success: true });
});