"use strict";
const mongoose = require("mongoose");
const {Log} = require("../../model");

class CronologyDb
{

    mongoUri = process.env.CONF_DB_URI;
    db = mongoose.connection;
    prepared = false;
    indicesLeftToCreate = 0;
    models = {};

    async prepare()
    {
        this.db.on("connecting", this.onConnecting.bind(this));
        this.db.on("connected", this.onConnected.bind(this));
        this.db.on("open", this.onOpen.bind(this));
        this.db.on("error", this.onError.bind(this));

        this.models = require("../../model");
        this.indicesLeftToCreate = Object.keys(this.models).length;
        for (let i in this.models)
        {
            let model = this.models[i];
            model.on("index", () => {
                this.indicesLeftToCreate--;
            });
        }

        this.prepared = true;
    }

    async connect()
    {
        if (!this.mongoUri)
        {
            throw new Error("Missing configuration: CONF_DB_URI");
        }
        if (!this.prepared)
        {
            await this.prepare();
        }

        this.indicesLeftToCreate = Object.keys(this.models).length;

        await mongoose.connect(this.mongoUri, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        });

        return true;
    }

    async waitForBackgroundProcesses()
    {
        while (this.indicesLeftToCreate > 0)
        {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return true;
    }

    async disconnect()
    {
        await mongoose.disconnect();

        return true;
    }

    getReadyState()
    {
        return this.db.readyState;
    }

    async onConnecting()
    {
        await Log.log("info", "mongodb", {message: "Connecting to: " + this.mongoUri});
    }

    async onConnected()
    {
        await Log.log("info", "mongodb", {message: "Connected to database"});
    }

    async onOpen()
    {
        await Log.log("info", "mongodb", {message: "Connection is now open"});
    }

    async onError(err)
    {
        await Log.log("error", "mongodb", err);
        if (!err.code)
        {
            await this.disconnect();
            await this.connect();
        }
    }

}

module.exports = CronologyDb;