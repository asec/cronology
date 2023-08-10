const mongoose = require("mongoose");

const mongoUri = process.env.CONF_DB_URI;
const db = mongoose.connection;

if (!mongoUri)
{
	throw new Error("Missing configuration: CONF_DB_URI");
}

db.on("connecting", () => {
	console.log("Connecting to: " + mongoUri);
});

db.on("connected", () => {
	console.log("Connected to database");
});

db.once("open", () => {
	console.log("Connection is now open");
});

db.on("error", async (err) => {
	console.error(err.message);
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
