"use strict";
const mongoose = require("mongoose");
const { User } = require("../User/User.class");

const projectSchema = new mongoose.Schema({
	name: { type: String, required: true },
	color: { type: String, required: true },
	participants: {
		type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		required: true,
		validate: {
			validator: function(value)
			{
				return Array.isArray(value) && value.length;
			},
			message: "You need to add at least one participant to the project."
		}
	},
}, {
	timestamps: {
		createdAt: "created",
		updatedAt: "updated"
	},
	methods: {
		addParticipant: function (users)
		{
			if (!Array.isArray(users))
			{
				users = [users];
			}
			users.forEach(user => {
				if (user instanceof User)
				{
					if (this.participants.indexOf(user.id) === -1)
					{
						if (typeof user.__v === "undefined")
						{
							throw new Error("You can only add Users to this Project that were already saved beforehand");
						}
						this.participants.push(user.id);
					}
				}
				else if (user instanceof mongoose.Types.ObjectId)
				{
					if (this.participants.indexOf(user) === -1)
					{
						this.participants.push(user);
					}
				}
				else
				{
					throw new Error("You can only add User objects as participants.");
				}
			});

			return this.participants;
		},
		
		clearParticipants: function ()
		{
			this.participants = [];
		}
	}
});

const ProjectModel = mongoose.model("Project", projectSchema);

module.exports = ProjectModel;