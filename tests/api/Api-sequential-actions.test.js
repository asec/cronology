"use strict";
const env = require("../../config/dotenv").environment("test");
const { test, expect, beforeAll, afterAll } = require("@jest/globals");
const { ExternalApplication } = require("../../src/model/ExternalApplication");
const { Log } = require("../../src/model/Log");
const { Api } = require("../../src/api/Api.class");
const { UsersRouteCreateAccessTokenParameters, UsersRouteCreateParameters, DefaultRouteSignatureParameters } = require("../../src/api/parameters");
const { AppAuthentication, AppValidation} = require("../../src/api/authentication");

const db = require("../db");

/**
 * @type {ExternalApplication}
 */
let app;

beforeAll(async () => {
    env.enableSilentLogging();
    Log.setLogFile("Api-sequential-actions.test");
    await db.connect();

    app = new ExternalApplication({
        name: "Api-sequential-actions-test"
    });
    await app.generateKeys();
    await app.save();

    await Api.init();
});

afterAll(async () => {
    app.deleteKeys();
    await db.tearDown();
});

test("process", async () => {
    let paramsBean = {
        username: "testuser"
    };
    let params = new DefaultRouteSignatureParameters({
        data: {...paramsBean, ip: "::1"}
    });
    let authenticator = new AppValidation({
        uuid: app.uuid,
        ip: "::1"
    });
    params.populateAuthenticator(0, authenticator);
    expect(await params.validate()).toBe(true);

    let result = await Api.execute("post", "/signature", params);
    expect(result.success).toBe(true);
    expect(typeof result.result).toBe("string");
    expect(result.result.length).toBeGreaterThan(10);

    params = new UsersRouteCreateParameters(paramsBean);
    authenticator = new AppAuthentication({
        ip: "::1",
        uuid: app.uuid,
        signature: result.result
    });
    params.populateAuthenticator(0, authenticator);
    expect(await params.validate()).toBe(true);

    result = await Api.execute("put", "/user", params);
    expect(result.success).toBe(true);

    let prevAccessToken = result.toObject().result.accessToken;
    let user_id = result.toObject().result.id;
    expect(typeof prevAccessToken).toBe("string");
    expect(prevAccessToken.length).toBeGreaterThan(10);
    expect(typeof user_id).toBe("string");
    expect(user_id.length).toBeGreaterThan(10);

    paramsBean = {
        user_id
    };
    params = new DefaultRouteSignatureParameters({
        data: {...paramsBean, ip: "::1"}
    });
    authenticator = new AppValidation({
        uuid: app.uuid,
        ip: "::1"
    });
    params.populateAuthenticator(0, authenticator);
    expect(await params.validate()).toBe(true);
    result = await Api.execute("post", "/signature", params);
    expect(result.success).toBe(true);
    expect(typeof result.result).toBe("string");
    expect(result.result.length).toBeGreaterThan(10);

    params = new UsersRouteCreateAccessTokenParameters(paramsBean);
    params.populateAuthenticator(0, new AppAuthentication({
        uuid: app.uuid,
        ip: "::1",
        signature: result.result
    }));
    expect(await params.validate()).toBe(true);
    result = await Api.execute("post", "/user/accessToken", params);
    expect(result.success).toBe(true);
    expect(result.toObject().result.username).toBe("testuser");
    expect(typeof result.toObject().result.accessToken).toBe("string");
    expect(result.toObject().result.accessToken.length).toBeGreaterThan(10);
    expect(result.toObject().result.accessToken).not.toBe(prevAccessToken);
});