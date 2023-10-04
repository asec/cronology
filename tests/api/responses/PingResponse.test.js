"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { PingResponse } = require("../../../src/api/responses");

test("constructor", () => {
    let response = new PingResponse({});
    let responseData = response.toObject();
    expect(responseData).toStrictEqual({ success: false, version: "" });

    response = new PingResponse({
        success: true
    });
    expect(response.toObject()).toStrictEqual({ success: true, version: "" });

    response = new PingResponse({
        success: true,
        version: "v1"
    });
    expect(response.toObject()).toStrictEqual({ success: true, version: "v1" });

    response.set("success", false);
    expect(response.toObject()).toStrictEqual({ success: false, version: "v1" });

    response.set("version", "aaa");
    expect(response.toObject()).toStrictEqual({ success: false, version: "aaa" });
});