const mongoose = require("mongoose");

const db = mongoose.connection;
db.on("connecting", () => {
	console.log("Connecting to: " + process.env.CONF_DB_URI);
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
		mongoose.connect(process.env.CONF_DB_URI);
	}
});

mongoose.set("useNewUrlParser", true);
mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.CONF_DB_URI, {
	useUnifiedTopology: true
});

module.exports = db;
