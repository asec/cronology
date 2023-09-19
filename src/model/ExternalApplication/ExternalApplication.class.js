"use strict";
const { Entity } = require("../Entity.class");
const ExternalApplicationModel = require("./ExternalApplication.model");
const mongoose = require("mongoose");

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

/**
 * @typedef {Object} ExternalApplicationBean
 * @property {string} name
 * @property {string} [uuid]
 * @property {string[]} [ip]
 */

class ExternalApplication extends Entity
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
    get name()
    {
        return this.entity.get("name");
    }

    /**
     * @param {string} value
     */
    set name(value)
    {
        this.entity.set("name", value);
    }

    /**
     * @returns {string}
     */
    get uuid()
    {
        return this.entity.get("uuid");
    }

    /**
     * @param {string} value
     */
    set uuid(value)
    {
        this.entity.set("uuid", value);
    }

    /**
     * @return {string[]}
     */
    get ip()
    {
        return this.entity.get("ip");
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
     * @param {ExternalApplicationBean|ExternalApplicationModel} [initial]
     */
    constructor(initial)
    {
        super(initial instanceof ExternalApplicationModel ? initial : new ExternalApplicationModel(initial));
        if (this.uuid === undefined)
        {
            this.generateUuid();
        }
    }

    /**
     * @returns {string}
     */
    generateUuid()
    {
        return this.entity.generateUuid();
    }

    /**
     * @param {string} ip
     * @returns {boolean}
     */
    addIp(ip)
    {
        return this.entity.addIp(ip);
    }

    /**
     * @param {string} ip
     * @returns {boolean}
     */
    hasIp(ip)
    {
        return this.entity.hasIp(ip);
    }

    /**
     * @param {string} ip
     * @returns {boolean}
     */
    removeIp(ip)
    {
        return this.entity.removeIp(ip);
    }


    /**
     * @returns {{private: string, public: string}}
     */
    getKeys()
    {
        return {
            private: path.resolve(process.env.CONF_CRYPTO_APPKEYS + this.name + "-private.pem"),
            public: path.resolve(process.env.CONF_CRYPTO_APPKEYS + this.name + "-public.pem"),
        };
    }

    async generateKeys()
    {
        await this.validate("name");

        let keyPath = path.resolve(process.env.CONF_CRYPTO_APPKEYS);
        let fileName = this.getKeys();
        if (!fs.existsSync(keyPath))
        {
            fs.mkdirSync(keyPath);
        }

        const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
            modulusLength: 2048
        });

        fs.writeFileSync(fileName.public, publicKey.export({
            type: "spki",
            format: "pem",
        }));

        fs.writeFileSync(fileName.private, privateKey.export({
            type: "pkcs8",
            format: "pem",
        }));

        return true;
    }

    /**
     * @return {Promise<boolean>}
     */
    async hasValidKeys()
    {
        await this.validate("name");

        let fileName = this.getKeys();

        return fs.existsSync(fileName.public) && fs.existsSync(fileName.private);
    }

    deleteKeys()
    {
        let fileName = this.getKeys();
        let dirName = path.resolve(process.env.CONF_CRYPTO_APPKEYS);
        if (fs.existsSync(fileName.private))
        {
            fs.unlinkSync(fileName.private);
        }
        if (fs.existsSync(fileName.public))
        {
            fs.unlinkSync(fileName.public);
        }

        if (!fs.readdirSync(dirName).length)
        {
            fs.rmdirSync(dirName);
        }
    }

    /**
     * @param {{}} object
     * @returns {Promise<string>}
     */
    async generateSignature(object)
    {
        if (!await this.hasValidKeys())
        {
            throw new Error("Can't generate signature because the app has no valid keys.");
        }

        let fileName = this.getKeys();
        let privateKey = fs.readFileSync(fileName.private);

        const now = new Date();
        let hash = this.#hashObject(object);
        if (Number(process.env.CONF_CRYPTO_SIGNATURE_TIME_THRESHOLD) > 0)
        {
            hash += ":" + String(Math.floor(now.getTime() / 1000));
        }
        const signer = crypto.createSign("rsa-sha256");
        signer.update(hash);

        return signer.sign(privateKey, "base64");
    }

    /**
     * @param {{}} object
     * @returns {string}
     */
    #hashObject(object)
    {
        let string = "";
        if (object.hasOwnProperty("toObject") && typeof object.toObject === "function")
        {
            string = JSON.stringify(object.toObject());
        }
        else
        {
            string = JSON.stringify(object);
        }

        const hash = crypto.createHash("sha256");
        hash.update(string);

        return hash.digest("hex");
    }

    /**
     * @param {string} signature
     * @param {{}} object
     * @returns {Promise<boolean>}
     */
    async validateSignature(signature, object)
    {
        if (!await this.hasValidKeys())
        {
            throw new Error("Can't validate signature because the app has no valid keys.");
        }

        let fileName = this.getKeys();
        let publicKey = fs.readFileSync(fileName.public, "utf8");

        let timeThreshold = Number(process.env.CONF_CRYPTO_SIGNATURE_TIME_THRESHOLD);
        const now = new Date();
        let timeIdentifier = Math.floor(now.getTime() / 1000);
        let isValid = false;
        if (timeThreshold <= 0)
        {
            const hash = this.#hashObject(object);
            const verifier = crypto.createVerify("rsa-sha256");
            verifier.update(hash);
            isValid = verifier.verify(publicKey, signature, "base64");
        }
        else
        {
            while (timeThreshold > 0)
            {
                const hash = this.#hashObject(object) + ":" + String(timeIdentifier);
                const verifier = crypto.createVerify("rsa-sha256");
                verifier.update(hash);
                isValid = verifier.verify(publicKey, signature, "base64");
                if (isValid)
                {
                    break;
                }

                timeThreshold--;
                timeIdentifier--;
            }
        }

        return isValid;
    }
}

module.exports = {
    ExternalApplication
};