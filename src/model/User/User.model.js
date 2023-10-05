"use strict";
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

let passwordValidationErrorMsg = "The password must be at least 12 characters long, must contain lower- and uppercase letters, numbers and special characters.";
let cryptoSaltLength = process.env.APP_ENV === "test" ? 1 : 13;

function validatePassword()
{
    let value = this.plainPassword;
    if (typeof value === "undefined")
    {
        return true;
    }
    if (typeof value !== "string")
    {
        return false;
    }
    if (value.length < 12)
    {
        return false;
    }
    let valid = true;
    [
        /[a-z]/, /[A-Z]/, /\d/,/\W/,
    ].forEach(regex => {
        if (regex.exec(value) === null)
        {
            valid = false;
        }
    });

    return valid;
}

/**
 * @param {number} length
 * @returns {string}
 */
function generateRandomPassword(length = 20)
{
    if (!length || length < 20)
    {
        length = crypto.randomInt(20, 40);
    }

    let password = "";
    for (let i = 0; i < length; i++)
    {
        password += String.fromCharCode(crypto.randomInt(33, 125));
    }

    let replaceAtIndex = function (str, index, replacement)
    {
        return str.slice(0, index) + replacement + str.slice(index + replacement.length);
    };

    let randomPositions = [];
    do
    {
        let nextRandomPosition = crypto.randomInt(0, length - 1);
        if (randomPositions.indexOf(nextRandomPosition) !== -1)
        {
            continue;
        }
        randomPositions.push(nextRandomPosition);
        switch (randomPositions.length)
        {
            case 1:
                password = replaceAtIndex(password, nextRandomPosition, String.fromCharCode(crypto.randomInt(97, 122)));
                break;
            case 2:
                password = replaceAtIndex(password, nextRandomPosition, String.fromCharCode(crypto.randomInt(65, 90)));
                break;
            case 3:
                password = replaceAtIndex(password, nextRandomPosition, String.fromCharCode(crypto.randomInt(48, 57)));
                break;
            case 4:
                password = replaceAtIndex(password, nextRandomPosition, String.fromCharCode(crypto.randomInt(33, 47)));
                break;
        }
    }
    while (randomPositions.length !== 4);

    return password;
}

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true, validate: {
            validator: validatePassword,
            message: passwordValidationErrorMsg
        }},
    isAdmin: Boolean,
    accessToken: String,
    accessTokenValid: Date,
    loginDate: Date
}, {
    timestamps: {
        createdAt: "created",
        updatedAt: "updated"
    },
    statics: {
        hashPassword: function(rawPassword)
        {
            return bcrypt.hashSync(rawPassword, cryptoSaltLength);
        },
        /**
         * @memberOf UserModel
         * @function
         * @param {number} length
         * @returns {string}
         */
        generateRandomPassword,
        /**
         * @memberOf UserModel
         * @returns {string}
         */
        generateAccessToken: function ()
        {
            let length = crypto.randomInt(30, 60);
            let buffer = crypto.randomBytes(length);

            return buffer.toString("base64url");
        }
    },
    methods: {
        /**
         * @memberOf UserModel
         * @instance
         * @param {string} rawPassword
         * @returns {boolean}
         */
        checkPassword: function (rawPassword)
        {
            if (!this.password)
            {
                throw new Error("This user has no password, so it cannot be compared agains the argument.");
            }
            return bcrypt.compareSync(rawPassword, this.password);
        }
    },
    virtuals: {
        plainPassword: {
            type: String
        }
    }
});

userSchema.path("password").set(function (value){
    this.plainPassword = value;
    return userSchema.statics.hashPassword(value);
});

userSchema.post("save", function (res, next) {
    this.plainPassword = undefined;
    next();
});

userSchema.index({
    username: 1
}, {
    unique: true
});

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;