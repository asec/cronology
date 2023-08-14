const mongoose = require("mongoose");
const {Log} = require("../model");

const mongoUri = process.env.CONF_DB_URI;
const db = mongoose.connection;

if (!mongoUri)
{
	throw new Error("Missing configuration: CONF_DB_URI");
}

db.on("connecting", () => {
	//console.log("Connecting to: " + mongoUri);
	Log.log("info", "mongodb", {message: "Connecting to: " + mongoUri});
});

db.on("connected", () => {
	//console.log("Connected to database");
	Log.log("info", "mongodb", {message: "Connected to database"});
});

db.once("open", () => {
	//console.log("Connection is now open");
	Log.log("info", "mongodb", {message: "Connection is now open"});
});

db.on("error", async (err) => {
	//console.error(err.message);
	Log.log("error", "mongodb", err);
	if (!err.code)
	{
		await mongoose.disconnect();
		await mongoose.connect(mongoUri);
	}
});

module.exports = (async () => {
	await mongoose.connect(mongoUri, {
		useUnifiedTopology: true,
		useNewUrlParser: true
	});

	return db;
})();
