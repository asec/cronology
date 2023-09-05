module.exports = {

	put: {
		transaction: require("./put/transaction.js"),
		admin: require("./put/admin.js"),
		users: require("./put/user.js"),
		usersId: require("./put/userId.js"),
		project: require("./put/project.js"),
		projectId: require("./put/projectId.js")
	},

	get: {
		transaction: require("./get/transaction.js"),
		transactionId: require("./get/transactionId.js"),
		transactionIdList: require("./get/transactionIdList.js"),
		settings: require("./get/settings.js"),
		users: require("./get/users.js"),
		userId: require("./get/userId.js"),
		project: require("./get/project.js"),
		projectId: require("./get/projectId.js")
	},

	post: {
		transactionIdCancel: require("./post/transactionIdCancel.js"),
		login: require("./post/login.js")
	},

	delete: {
		users: require("./delete/users.js"),
		project: require("./delete/project.js")
	}

};
