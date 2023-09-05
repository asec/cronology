"use strict";
const { Entity } = require("../Entity.class");
const UserModel = require("./User.model");

/**
 * @typedef {Object} UserBean
 * @property {string} username
 * @property {string} [password]
 * @property {boolean} [isAdmin]
 * @property {string} [accessToken]
 * @property {Date} [accessTokenValid]
 * @property {Date} [loginDate]
 */

class User extends Entity
{
	/**
	 * @returns {mongoose.ObjectId}
	 */
	get id()
	{
		return this.entity._id;
	}

	/**
	 * @returns {string}
	 */
	get username()
	{
		return this.entity.get("username");
	}

	/**
	 * @param {string} value
	 */
	set username(value)
	{
		this.entity.set("username", value);
	}

	/**
	 * @returns {string}
	 */
	get password()
	{
		return this.entity.get("password");
	}

	/**
	 * @param {string} value
	 */
	set password(value)
	{
		this.entity.set("password", value);
	}

	/**
	 * @returns {string}
	 */
	get plainPassword()
	{
		return this.entity.get("plainPassword");
	}

	/**
	 * @param {string} value
	 */
	set plainPassword(value)
	{
		this.entity.set("plainPassword", value);
	}

	/**
	 * @returns {boolean}
	 */
	get isAdmin()
	{
		return this.entity.get("isAdmin");
	}

	/**
	 * @param {boolean} value
	 */
	set isAdmin(value)
	{
		this.entity.set("isAdmin", value);
	}

	/**
	 * @returns {string}
	 */
	get accessToken()
	{
		return this.entity.get("accessToken");
	}

	/**
	 * @param {string} value
	 */
	set accessToken(value)
	{
		this.entity.set("accessToken", value);
	}

	/**
	 * @returns {Date}
	 */
	get accessTokenValid()
	{
		return this.entity.get("accessTokenValid");
	}

	/**
	 * @param {Date} value
	 */
	set accessTokenValid(value)
	{
		this.entity.set("accessTokenValid", value);
	}

	/**
	 * @returns {Date}
	 */
	get loginDate()
	{
		return this.entity.get("loginDate");
	}

	/**
	 * @param {Date} value
	 */
	set loginDate(value)
	{
		this.entity.set("loginDate", value);
	}

	/**
	 * @returns {Date}
	 */
	get created()
	{
		return this.entity.get("created");
	}

	/**
	 * @returns {Date}
	 */
	get updated()
	{
		return this.entity.get("updated");
	}

	/**
	 * @param {UserBean|UserModel} [initial]
	 */
	constructor(initial)
	{
		super(initial instanceof UserModel ? initial : new UserModel(initial));
	}

	/**
	 * @param {string} rawPassword
	 * @returns {boolean}
	 */
	checkPassword(rawPassword)
	{
		return this.entity.checkPassword(rawPassword);
	}

	/**
	 * @param {number} [length = 20] - Must be at least 20, if it is smaller than that the length will be randomly
	 * generated between 20 and 40.
	 * @returns {string}
	 */
	static generateRandomPassword(length)
	{
		return UserModel.generateRandomPassword(length);
	}
}

module.exports = {
	User
};