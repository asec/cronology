const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
	originator: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", sparse: true },
	owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	name: { type: String, default: "" },
	schedule: { type: String, default: "" },
	isRecurring: { type: Boolean, default: false },
	isRunning: { type: Boolean, default: false },
	isFinished: { type: Boolean, default: false },
	isCanceled: { type: Boolean, default: false },
	stepsGetterUrl: { type: String, default: "" },
	numSteps: { type: Number, default: 0 },
	completedSteps: { type: Number, default: 0 },
	waitAfterStep: { type: Number, default: 0 },
	steps: [{ type: mongoose.Schema.Types.ObjectId, ref: "TransactionStep" }]
}, {
	timestamps: {
		createdAt: "created",
		updatedAt: "updated"
	}
});

module.exports = mongoose.model("Transaction", transactionSchema);
