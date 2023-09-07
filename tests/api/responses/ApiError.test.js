"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { ApiError } = require("../../../src/api/responses/ApiError.class");

test("constructor", () => {
    let response = new ApiError();
    expect(response.toObject()).toStrictEqual({ success: false, error: "" });

    response = new ApiError({ success: true });
    expect(response.toObject()).toStrictEqual({ success: true, error: "" });

    response = new ApiError({ error: "teszt" });
    expect(response.toObject()).toStrictEqual({ success: false, error: "teszt" });

    response = new ApiError({ error: "a", success: true });
    expect(response.toObject()).toStrictEqual({ success: true, error: "a" });
});

test("set", () => {
    let response = new ApiError();

    expect(response.set("error", "test")).toBe(true);
    expect(response.toObject()).toStrictEqual({ success: false, error: "test" });

    expect(response.set("success", true)).toBe(true);
    expect(response.toObject()).toStrictEqual({ error: "test", success: true });

    response = new ApiError({
        success: true,
        error: "a"
    });
    expect(response.set({ success: false, error: "random error" })).toBe(true);
    expect(response.toObject()).toStrictEqual({ success: false, error: "random error" });

    expect(response.set({ success: false, error: "b", valami: 12 })).toBe(false);
    expect(response.toObject()).toStrictEqual({ success: false, error: "b" });
});