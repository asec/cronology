"use strict";

const { User, UserRepository } = require("../../../src/model/User");

class UserRepositoryForTests extends UserRepository
{

    static usernames = ["admin", "test", "test2", "admin2", "admintest", "testadmin"];

    static async createAll()
    {
        let users = this.usernames.map(username => {
            return {
                username,
                password: User.generateRandomPassword()
            };
        });

        await super.insertMany(users);

        return true;
    }

    /**
     * @async
     * @param {null|string|string[]|UserBean|UserBean[]} username
     * @returns {Promise<User|User[]>}
     */
    static async get(username = null)
    {
        let query = null;
        if (Array.isArray(username))
        {
            query = [];
            username.forEach(item => {
                if (typeof item === "object" && item !== null && typeof item.username === "string")
                {
                    query.push(item.username);
                }
                else if (typeof item === "string")
                {
                    query.push(item);
                }
                else
                {
                    console.warn("Skipped element from input: ", item);
                    throw new Error("Skipped element from input: " + item);
                }
            });
            if (!query.length)
            {
                query = null;
            }
        }
        else if (typeof username === "object" && username !== null && typeof username.username === "string")
        {
            query = {
                username: username.username
            };
        }
        else if (typeof username === "string")
        {
            query = {
                username
            };
        }
        else if (username !== null)
        {
            console.warn("Invalid input: ", username);
            throw new Error("Invalid input: " + username);
        }

        if (Array.isArray(query))
        {
            let documents = await UserRepository.model.find({
                username: {
                    $in: query
                }
            });
            /**
             * @type {User[]}
             */
            let result = [];
            documents.forEach(doc => result.push(new User(doc)));
            return result;
        }

        return UserRepository.findOne(query);
    }

    /**
     * @param {string} username
     * @param {boolean|string} withPassword
     * @returns {User}
     */
    static mock(username, withPassword = false)
    {
        let user = new User({ username });
        if (typeof withPassword === "string")
        {
            user.password = withPassword;
        }
        else if (withPassword)
        {
            user.password = User.generateRandomPassword();
        }

        return user;
    }

    /**
     * @param {boolean|string} withPassword
     * @returns {User}
     */
    static mockRandom(withPassword = false)
    {
        let username = "";
        let length = Math.floor(Math.random() * 100 % 21) + 5;
        for (let i = 0; i < length; i++)
        {
            username += String.fromCharCode(Math.floor(Math.random() * 100 % 26) + 97);
        }

        return this.mock(username, withPassword);
    }

    /**
     * @param {string} username
     * @param {boolean|string} password
     * @returns {Promise<User>}
     */
    static async create(username, password = true)
    {
        let user = this.mock(username, password);

        await user.save();

        return user;
    }

    /**
     * @param {boolean|string} password
     * @returns {Promise<User>}
     */
    static async createRandom(password = true)
    {
        let user = this.mockRandom(password);

        await user.save();

        return user;
    }

}

module.exports = {
    UserRepository: UserRepositoryForTests
};