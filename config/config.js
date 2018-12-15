module.exports = {

	// API settings:
	api: {
		port: 7331,
		executionTimeout: 600000  // 10 mins
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
	// MySQL tables:
	dbt: {
		TRANSACTIONS: "transactions",
		STEPS: "transactions_steps",
		LOGS: "transactions_logs"
	}

};
