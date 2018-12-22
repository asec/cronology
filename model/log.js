const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
	transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", sparse: true },
	step: { type: mongoose.Schema.Types.ObjectId, ref: "TransactionStep", sparse: true },
	action: { type: String, default: "default log action" },
	data: { type: mongoose.Schema.Types.Mixed, default: {} },
	status: { type: String, default: "" },
	duration: { type: Number, default: 0 }
}, {
	timestamps: {
		createdAt: "created"
	}
});

module.exports = mongoose.model("Log", logSchema);
