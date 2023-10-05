"use strict";
const { ApiRoute } = require("../ApiRoute.class");
const { UsersRouteCreateParameters } = require("../parameters/UsersRouteCreateParameters.class");
const { User, UserRepository } = require("../../model/User");
const { UsersCreateUserResult } = require("../responses");
const { DisplayableApiException } = require("../../exception");

class UsersRoute extends ApiRoute
{
    static getRoutesContent()
    {
        this.addRoute("put", "/user", this.createUser, UsersRouteCreateParameters);
    }

    /**
     * @param {UsersRouteCreateParameters} params
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
}

module.exports = {
    UsersRoute
};