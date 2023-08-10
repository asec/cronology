"use strict";
const {User} = require("../../model");

class UserRepository
{

    usernames = ["admin", "test", "test2", "admin2", "admintest", "testadmin"];

    async createAll()
    {
        let users = this.usernames.map(username => {
            return {
                username,
                password: User.generateRandomPassword()
            };
        });

        await User.insertMany(users);

        return true;
    }

    async truncate()
    {
        await User.deleteMany();
    }

    async get(username = null)
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
            return User.find({
                username: {
                    $in: query
                }
            });
        }

        return User.findOne(query);
    }

    mock(username, withPassword = false)
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

    mockRandom(withPassword = false)
    {
        let username = "";
        let length = Math.floor(Math.random() * 100 % 21) + 5;
        for (let i = 0; i < length; i++)
        {
            username += String.fromCharCode(Math.floor(Math.random() * 100 % 26) + 97);
        }

        return this.mock(username, withPassword);
    }

    async create(username, password = true)
    {
        if (!password)
        {
            password = true;
        }
        let user = this.mock(username, password);

        await user.save();

        return user;
    }

    async createRandom(password = true)
    {
        if (!password)
        {
            password = true;
        }
        let user = this.mockRandom(password);

        await user.save();

        return user;
    }

}

module.exports = new UserRepository();