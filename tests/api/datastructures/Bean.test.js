"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { Bean } = require("../../../src/api/datastructures/Bean.class");

test("constructor", () => {
    let entity = new Bean({});
    expect(entity.toObject()).toStrictEqual({});

    entity = new Bean({
        foo: "bar",
        baz: 12
    });
    expect(entity.toObject()).toStrictEqual({});
});