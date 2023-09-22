"use strict";
const env = require("../../../config/dotenv").environment("test");
const { test, expect, beforeAll } = require("@jest/globals");
const { ApiError } = require("../../../src/api/responses/ApiError.class");
const {Api} = require("../../../src/api/Api.class");

/**
 * @type {string}
 */
let displayMessage;
const defaultEnv = process.env.APP_ENV;

beforeAll(() => {
    let error = new ApiError({
        success: false
    });
    displayMessage = error.toObject().displayMessage;
});

/**
 * @param {"test"|"dev"|"prod"} newEnv
 */
function setEnv(newEnv)
{
    process.env.APP_ENV = newEnv;
}

test("constructor", () => {
    let response = new ApiError();
    expect(response.toObject()).toStrictEqual({ success: false, error: "", displayMessage });

    response = new ApiError({ success: true });
    expect(response.toObject()).toStrictEqual({ success: true, error: "", displayMessage });

    response = new ApiError({ error: "teszt" });
    expect(response.toObject()).toStrictEqual({ success: false, error: "teszt", displayMessage });

    response = new ApiError({ error: "a", success: true });
    expect(response.toObject()).toStrictEqual({ success: true, error: "a", displayMessage });

    response = new ApiError({
        error: "teszt-error",
        displayMessage: "aaa"
    });
    expect(response.toObject()).toStrictEqual({ success: false, error: "teszt-error", displayMessage: "aaa" });
    setEnv("dev");
    expect(response.toObject()).toStrictEqual({ success: false, error: "aaa" });
    setEnv(defaultEnv);

    response = new ApiError({
        error: "test",
        displayable: true
    });
    expect(response.toObject()).toStrictEqual({ success: false, error: "test" });
    setEnv("dev");
    expect(response.toObject()).toStrictEqual({ success: false, error: "test" });
    setEnv(defaultEnv);
});

test("set", () => {
    let response = new ApiError();

    expect(response.set("error", "test")).toBe(true);
    expect(response.toObject()).toStrictEqual({ success: false, error: "test", displayMessage });

    expect(response.set("success", true)).toBe(true);
    expect(response.toObject()).toStrictEqual({ error: "test", success: true, displayMessage });

    response = new ApiError({
        success: true,
        error: "a"
    });
    expect(response.set({ success: false, error: "random error" })).toBe(true);
    expect(response.toObject()).toStrictEqual({ success: false, error: "random error", displayMessage });

    expect(response.set({ success: false, error: "b", valami: 12 })).toBe(false);
    expect(response.toObject()).toStrictEqual({ success: false, error: "b", displayMessage });

    expect(response.set("displayMessage", "")).toBe(true);
    expect(response.toObject()).toStrictEqual({ success: false, error: "b", displayMessage: "" });

    setEnv("dev");
    expect(response.toObject()).toStrictEqual({ success: false, error: "" });
    setEnv(defaultEnv);

    expect(response.set("displayable", true)).toBe(true);
    expect(response.toObject()).toStrictEqual({ success: false, error: "b" });
    setEnv("dev");
    expect(response.toObject()).toStrictEqual({ success: false, error: "b" });
    setEnv(defaultEnv);
});