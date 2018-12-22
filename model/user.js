const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	username: String,
	isAdmin: Boolean
}, {
	timestamps: {
		createdAt: "created",
		updatedAt: "updated"
	}
});

userSchema.index({
	username: 1
}, {
	unique: true
});

module.exports = mongoose.model("User", userSchema);
