var db = require("../utils/db.js"),
	config = require("../config/config.js"),
	log = require("./log.js");

class TransactionStep
{

	constructor(item)
	{
		for (var i in item)
		{
			this[i] = item[i];
		}
	}

	start()
	{
		// TODO: Bejegyezni futónak, majd implementálni a GET requestet az url-re
		console.log("Starting step: ", this.id);
	}

}

module.exports = TransactionStep;
