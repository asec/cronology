var pt = require("./put/transaction.js"),
	gt = require("./get/transaction.js"),
	gti = require("./get/transactionId.js");

module.exports = {

	putTransaction: pt.putTransaction,
	getTransaction: gt.getTransaction,
	getTransactionId: gti.getTransactionId

};
