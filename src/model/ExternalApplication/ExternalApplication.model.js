"use strict";
const mongoose = require("mongoose");
const validator = require("validator");
const crypto = require("crypto");

const externalApplicationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        validate: {
            validator: value => validator.matches(value, /^[a-zA-Z][a-zA-Z0-9\-_]+$/),
            message: "The app name must start with a letter, must only contain letters, numbers and the following" +
                " characters: '-', '_'."
        }
    },
    uuid: { type: String, required: true },
    ip: {
        type: [String],
        validate: {
            validator: value => {

                let valid = true;
                for (let i = 0; i < value.length; i++)
                {
                    /**
                     * @type {string}
                     */
                    let v = value[i];
                    if (typeof v !== "string")
                    {
                        valid = false;
                        break;
                    }
                    if (!validator.isIP(v))
                    {
                        valid = false;
                        break;
                    }
                }

                return valid;
            }
        }
    }
}, {
    timestamps: {
        createdAt: "created",
        updatedAt: "updated"
    },
    methods: {
        /**
         * @memberOf ExternalApplicationModel#
         * @returns {string}
         */
        generateUuid: function ()
        {
            this.uuid = crypto.randomUUID();

            return this.uuid;
        },

        /**
         * @memberOf ExternalApplicationModel#
         * @param {string} ip
         * @returns {boolean}
         */
        addIp(ip)
        {
            if (this.hasIp(ip))
            {
                return false;
            }
            if (typeof ip !== "string")
            {
                return false;
            }
            if (!validator.isIP(ip))
            {
                return false;
            }

            this.ip.push(ip);
            return true;
        },

        /**
         * @memberOf ExternalApplicationModel#
         * @param {string} ip
         * @returns {boolean}
         */
        hasIp(ip)
        {
            return this.ip.indexOf(ip) > -1;
        },

        /**
         * @memberOf ExternalApplicationModel#
         * @param {string} ip
         * @returns {boolean}
         */
        removeIp(ip)
        {
            if (!this.hasIp(ip))
            {
                return false;
            }

            this.ip = this.ip.filter(value => value !== ip);
            return true;
        }
    }
});

externalApplicationSchema.index({
    name: 1
}, {
    unique: true
});

externalApplicationSchema.index({
    uuid: 1
}, {
    unique: true
});

const ExternalApplicationModel = mongoose.model("Application", externalApplicationSchema);

module.exports = ExternalApplicationModel;