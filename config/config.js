module.exports = {

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
