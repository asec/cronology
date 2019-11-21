const config = require("../config/config.js"),
	mongoose = require("mongoose");

const db = mongoose.connection;
db.on("connecting", () => {
	console.log("Connecting to: " + config.mongodb.uri);
});

db.on("connected", () => {
	console.log("Connected to database");
});

db.once("open", () => {
	console.log("Connection is now open");
});

db.on("error", (err) => {
	console.error(err.message);
	if (!err.code)
	{
		mongoose.disconnect();
		mongoose.connect(config.mongodb.uri);
	}
});

mongoose.set("useNewUrlParser", true);
mongoose.set('useCreateIndex', true);
mongoose.connect(config.mongodb.uri, {
	useUnifiedTopology: true
});

module.exports = db;
