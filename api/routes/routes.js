module.exports = {

	put: {
		transaction: require("./put/transaction.js")
	},

	get: {
		transaction: require("./get/transaction.js"),
		transactionId: require("./get/transactionId.js")
	},

	post: {
		transactionIdCancel: require("./post/transactionIdCancel.js")
	}

};
