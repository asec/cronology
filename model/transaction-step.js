const mongoose = require("mongoose");

const stepSchema = new mongoose.Schema({
	transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
	url: { type: String, default: "" },
	isRunning: { type: Boolean, default: false },
	started: { type: Date, default: null },
	duration: { type: Number, default: null },
	result: { type: String, default: "none" }
}, {
	timestamps: {
		createdAt: "created",
		updatedAt: "updated"
	}
});

module.exports = mongoose.model("TransactionStep", stepSchema);
