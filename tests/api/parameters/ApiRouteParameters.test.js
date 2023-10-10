"use strict";
require("../../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { ApiRouteParameters } = require("../../../src/api/parameters/ApiRouteParameters.class");
const { ApiAuthenticationBase } = require("../../../src/api/authentication/ApiAuthenticationBase.class");

class TestAuthentication extends ApiAuthenticationBase
{

    async validate(params)
    {
        return false;
    }
}

class TestTmp extends ApiRouteParameters
{
    foo;
    aaa;
    password;

    constructor(params)
    {
        super(params);
        this.setAll(params);
    }

    async validate()
    {
        return typeof this.foo === "string" && typeof this.aaa === "number" && this.password === "test";
    }

    async validateOwn()
    {
        return true;
    }
}

class AnotherTestTmp extends ApiRouteParameters
{
    foo;
    aaa;

    static authentication = [
        ...super.authentication,
        TestAuthentication
    ];

    constructor(params)
    {
        super(params);
        this.setAll(params);
    }

    async validateOwn()
    {
        return true;
    }
}

test("constructor, set, setAll", () => {
    let bean = {
        foo: "bar",
        aaa: 12
    };
    let params = new ApiRouteParameters(bean)
    expect(params.toObject()).toStrictEqual({});
    expect(params.set("test", "aaa")).toBe(false);
    params.setAll(bean);
    expect(params.toObject()).toStrictEqual({});

    params = new TestTmp(bean);
    expect(params.toObject()).not.toStrictEqual(bean);
    expect(params.toObject()).toStrictEqual({...bean, password: undefined});

    bean = {
        foo: "a",
        aaa: "b",
        password: "c"
    };
    params.setAll(bean);
    expect(params).not.toStrictEqual(bean);
    expect(params.toObject()).toStrictEqual(bean);
    params.setAll({});
    expect(params.toObject()).toStrictEqual(bean);
    params.setAll({
        foo: "a"
    });
    expect(params.toObject()).toStrictEqual(bean);
    params.setAll({
        password: "test"
    });
    expect(params.toObject()).not.toStrictEqual(bean);

    expect(params.set("foo", "bar")).toBe(true);
    expect(params.set("aaa", 12)).toBe(true);
    expect(params.set("password", "test")).toBe(true);
    expect(params.set("tmp", "a")).toBe(false);
});

test("sanitize", () => {
    let params = new TestTmp({
        foo: "a",
        aaa: 1
    });
    params.sanitize();
    expect(params.toObject()).toStrictEqual({ foo: "a", aaa: 1, password: "********" });

    params = new AnotherTestTmp({
        foo: "a",
        aaa: 1
    });
    params.sanitize();
    expect(params.toObject()).toStrictEqual({ foo: "a", aaa: 1 });

    params = new AnotherTestTmp({
        foo: "a",
        aaa: 1,
        password: "test"
    });
    params.sanitize();
    expect(params.toObject()).toStrictEqual({ foo: "a", aaa: 1 });
});

test("validate", async () => {
    let params = new ApiRouteParameters({});
    expect(await params.validate()).toBe(undefined);

    params = new TestTmp({
        foo: "aa"
    });
    expect(await params.validate()).toBe(false);

    params.set("aaa", 12);
    expect(await params.validate()).toBe(false);

    params.set("password", "none");
    expect(await params.validate()).toBe(false);

    params.set("password", "test");
    expect(await params.validate()).toBe(true);

    params = new AnotherTestTmp();
    let authenticator = new TestAuthentication();
    params.populateAuthenticator(0, authenticator);
    expect(await params.validate()).toBe(false);

    expect(authenticator.toObject()).toStrictEqual({});
});