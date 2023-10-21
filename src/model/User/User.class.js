"use strict";
const { Model } = require("../Model.class");
const UserModel = require("./User.model");

/**
 * @typedef {{}} UserBean
 * @property {string} username
 * @property {string} [password]
 * @property {boolean} [isAdmin]
 * @property {string} [accessToken]
 * @property {Date} [accessTokenValid]
 * @property {Date} [loginDate]
 */

class User extends Model
{
	/**
	 * @returns {mongoose.ObjectId}
	 */
	get id()
	{
		return this.model._id;
	}

	/**
	 * @returns {string}
	 */
	get username()
	{
		return this.model.get("username");
	}

	/**
	 * @param {string} value
	 */
	set username(value)
	{
		this.model.set("username", value);
	}

	/**
	 * @returns {string}
	 */
	get password()
	{
		return this.model.get("password");
	}

	/**
	 * @param {string} value
	 */
	set password(value)
	{
		this.model.set("password", value);
	}

	/**
	 * @returns {string}
	 */
	get plainPassword()
	{
		return this.model.get("plainPassword");
	}

	/**
	 * @param {string} value
	 */
	set plainPassword(value)
	{
		this.model.set("plainPassword", value);
	}

	/**
	 * @returns {boolean}
	 */
	get isAdmin()
	{
		return this.model.get("isAdmin");
	}

	/**
	 * @param {boolean} value
	 */
	set isAdmin(value)
	{
		this.model.set("isAdmin", value);
	}

	/**
	 * @returns {string}
	 */
	get accessToken()
	{
		return this.model.get("accessToken");
	}

	/**
	 * @param {string} value
	 */
	set accessToken(value)
	{
		this.model.set("accessToken", value);
	}

	/**
	 * @returns {Date}
	 */
	get accessTokenValid()
	{
		return this.model.get("accessTokenValid");
	}

	/**
	 * @param {Date} value
	 */
	set accessTokenValid(value)
	{
		this.model.set("accessTokenValid", value);
	}

	/**
	 * @returns {Date}
	 */
	get loginDate()
	{
		return this.model.get("loginDate");
	}

	/**
	 * @param {Date} value
	 */
	set loginDate(value)
	{
		this.model.set("loginDate", value);
	}

	/**
	 * @returns {Date}
	 */
	get created()
	{
		return this.model.get("created");
	}

	/**
	 * @returns {Date}
	 */
	get updated()
	{
		return this.model.get("updated");
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
		return this.model.checkPassword(rawPassword);
	}

	createNewAccessToken()
	{
		return this.model.createNewAccessToken();
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

	/**
	 * @returns {string}
	 */
	static generateAccessToken()
	{
		return UserModel.generateAccessToken();
	}
}

module.exports = {
	User
};