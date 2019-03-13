const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
	name: String,
	color: String,
	participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", sparse: true }]
}, {
	timestamps: {
		createdAt: "created",
		updatedAt: "updated"
	}
});

projectSchema.index({
	name: 1
}, { 
	unique: true
});

module.exports = mongoose.model("Project", projectSchema);