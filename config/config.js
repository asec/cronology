module.exports = {

	// API settings:
	api: {
		port: 7331,
		executionTimeout: 600000,  // 10 mins
		userSessionLength: 5 // 5 mins
	},
	scheduler: {
		tickrate: 300
	},
	// MySQL settings:
	mysql: {
		host: "localhost",
		user: "root",
		password: "",
		database: "asec_cronology"
	},
	mongodb: {
		uri: "mongodb://localhost:27017/cronology"
	},
	// MySQL tables:
	dbt: {
		TRANSACTIONS: "transactions",
		STEPS: "transactions_steps",
		LOGS: "transactions_logs"
	}

};
