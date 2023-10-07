"use strict";
const { ApiRoute } = require("../ApiRoute.class");
const { UsersRouteCreateParameters } = require("../parameters/UsersRouteCreateParameters.class");
const { UsersRouteCreateAccessTokenParameters } = require("../parameters/UsersRouteCreateAccessTokenParameters.class");
const { User, UserRepository } = require("../../model/User");
const { UsersCreateUserResult, UsersCreateAccessTokenResult } = require("../responses");
const { DisplayableApiException } = require("../../exception");

class UsersRoute extends ApiRoute
{
    static getRoutesContent()
    {
        this.addRoute("put", "/user", this.createUser, UsersRouteCreateParameters);
        this.addRoute(
            "post",
            "/user/accessToken",
            this.createAccessToken,
            UsersRouteCreateAccessTokenParameters
        );
    }

    /**
     * @param {UsersRouteCreateParameters} params
     * @returns {Promise<UsersCreateUserResult>}
     * @throws {Error}
     */
    static async createUser(params)
    {
        let exists = await UserRepository.countDocuments({
            username: params.username
        });
        if (exists > 0)
        {
            throw new DisplayableApiException("This user already exists.");
        }

        let user = new User({
            username: params.username,
            password: params.password,
            isAdmin: false
        });
        user.createNewAccessToken();

        await user.save();

        return new UsersCreateUserResult({
            success: true,
            result: user.toObject()
        });
    }

    /**
     * @param {UsersRouteCreateAccessTokenParameters} params
     * @returns {Promise<UsersCreateAccessTokenResult>}
     * @throws {DisplayableApiException}
     */
    static async createAccessToken(params)
    {
        let user = await UserRepository.findOne({
            _id: params.user_id
        });
        if (!user)
        {
            throw new DisplayableApiException("Could not find the following user: '" + params.user_id + "'.");
        }

        user.createNewAccessToken();

        await user.save();

        return new UsersCreateAccessTokenResult({
            success: true,
            result: {
                username: user.username,
                accessToken: user.accessToken,
                accessTokenValid: user.accessTokenValid
            }
        });
    }
}

module.exports = {
    UsersRoute
};