module.exports = {

	put: {
		transaction: require("./put/transaction.js"),
		admin: require("./put/admin.js"),
		users: require("./put/user.js")
	},

	get: {
		transaction: require("./get/transaction.js"),
		transactionId: require("./get/transactionId.js"),
		settings: require("./get/settings.js"),
		users: require("./get/users.js"),
		userId: require("./get/userId.js")
	},

	post: {
		transactionIdCancel: require("./post/transactionIdCancel.js"),
		login: require("./post/login.js")
	},

	delete: {
		users: require("./delete/users.js")
	}

};
