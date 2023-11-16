"use strict";
const { ApiRoute } = require("../ApiRoute.class");
const {
    UsersRouteCreateParameters,
    UsersRouteCreateAccessTokenParameters,
    UsersRouteGetParameters
} = require("../parameters");
const { User, UserRepository } = require("../../model/User");
const { UsersCreateUserResult, UsersCreateAccessTokenResult, ApiResult } = require("../responses");
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
        this.addRoute("get", "/user", this.getUserData, UsersRouteGetParameters);
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
            result: user.toObject()
        });
    }

    /**
     * @param {UsersRouteGetParameters} params
     * @returns {Promise<UsersCreateUserResult>}
     */
    static async getUserData(params)
    {
        /**
         * @type {User|null}
         */
        let user = null;
        if (params.username !== null)
        {
            user = await UserRepository.findOne({
                username: params.username
            });
            if (!user)
            {
                throw new DisplayableApiException("Invalid parameter: 'username'. The user could not be found.");
            }
        }
        else
        {
            user = params.user;
        }

        return new UsersCreateUserResult({
            success: true,
            result: user.toObject()
        });
    }
}

module.exports = {
    UsersRoute
};