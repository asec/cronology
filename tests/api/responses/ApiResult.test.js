"use strict";
require('../../../config/dotenv').environment("test");
const { test, expect } = require("@jest/globals");
const { ApiResult } = require("../../../src/api/responses/ApiResult.class");

test("constructor", () => {
    let result = new ApiResult({});
    expect(result.toObject()).toStrictEqual({ success: false, result: null });

    result = new ApiResult({
        success: true
    });
    expect(result.toObject()).toStrictEqual({ success: true, result: null });

    result = new ApiResult({
        success: true,
        result: "aa"
    });
    expect(result.toObject()).toStrictEqual({ success: true, result: "aa" });

    let now = new Date();
    result = new ApiResult({
        success: true,
        result: now
    });
    expect(result.toObject()).toStrictEqual({ success: true, result: now });

    let object = {
        username: "aaa",
        password: "bbb"
    };
    result = new ApiResult({
        success: true,
        result: object
    });
    expect(result.toObject()).toStrictEqual({ success: true, result: object });

    object = {
        _id: "10",
        username: "aaa",
        password: "bbb",
        __v: 20
    };
    result = new ApiResult({
        success: true,
        result: object
    });
    expect(result.toObject()).toStrictEqual({ success: true, result: { username: "aaa", id: "10" } });
});