"use strict";
const mongoose = require("mongoose");
const { User } = require("../User/User.class");

const labelSchema = new mongoose.Schema({
	name: { type: String, required: true },
	color: { type: String, required: true },
	owners: {
		type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		required: true,
		validate: {
			validator: function(value)
			{
				return Array.isArray(value) && value.length;
			},
			message: "You need to add at least one owner to the label."
		}
	},
}, {
	timestamps: {
		createdAt: "created",
		updatedAt: "updated"
	},
	methods: {
		addOwners: function (users)
		{
			if (!Array.isArray(users))
			{
				users = [users];
			}
			users.forEach(user => {
				if (user instanceof User)
				{
					if (this.owners.indexOf(user.id) === -1)
					{
						if (typeof user.__v === "undefined")
						{
							throw new Error("You can only add Users to this Label that were already saved beforehand");
						}
						this.owners.push(user.id);
					}
				}
				else if (user instanceof mongoose.Types.ObjectId)
				{
					if (this.owners.indexOf(user) === -1)
					{
						this.owners.push(user);
					}
				}
				else
				{
					throw new Error("You can only add User objects as owners.");
				}
			});

			return this.owners;
		},
		
		clearOwners: function ()
		{
			this.owners = [];
		}
	}
});

const LabelModel = mongoose.model("Label", labelSchema);

module.exports = LabelModel;