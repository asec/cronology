"use strict";
const CronologyDb = require("../../utils/db/class");
const Log = require("../../model/log");
const User = require("../../model/user");
const Transaction = require("../../model/transaction");

class CronologyDbTest extends CronologyDb
{

    async prepare()
    {
        this.mongoUri += "_" + String(Math.round(Math.random() * 10000));
        await super.prepare();
    }

    async tearDown()
    {
        await this.waitForBackgroundProcesses();
        //await this.db.dropDatabase();
        for (let collection in this.db.collections)
        {
            await this.db.dropCollection(collection);
        }
        await this.disconnect();
        Log.tearDown();

        return true;
    }

}

module.exports = CronologyDbTest;