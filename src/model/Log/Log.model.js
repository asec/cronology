const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

/*const logSchema = new mongoose.Schema({
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
});*/

const logSchema = new mongoose.Schema({
	type: { type: String, required: true },
	label: { type: String, required: true },
	data: Object
}, {
	timestamps: {
		createdAt: "created"
	},
	statics: {
		logFile: "",
		/**
		 * @memberOf LogModel
		 * @return {string}
		 */
		getLogFile: function ()
		{
			const defaultLogFile = (new Date()).toISOString().split("T")[0];
			return (typeof this.logFile === "string" && this.logFile) ? this.logFile : defaultLogFile;
		},
		/**
		 * @memberOf LogModel
		 * @param {string} fileName
		 */
		setLogFile: function (fileName)
		{
			this.logFile = fileName;
		},

		/**
		 * @memberOf LogModel
		 * @async
		 * @param {string} type
		 * @param {string} label
		 * @param {Object} [data = {}]
		 * @return {Promise<false|LogBean>}
		 */
		log: async function(type, label, data = {})
		{
			if (process.env.CONF_LOG_DISABLED === "true")
			{
				return false;
			}
			let entity = new LogModel({
				type,
				label,
				data
			});

			if (mongoose.connection.readyState !== 1)
			{
				await entity.validate();
				const now = new Date();
				const logDir = path.resolve(process.env.CONF_LOG_DIR || "./");
				const fileName = this.getLogFile();
				if (!fs.existsSync(logDir))
				{
					fs.mkdirSync(logDir);
				}
				fs.appendFileSync(logDir + "/" + fileName, [
					now.toISOString(),
					JSON.stringify(entity.toJSON())
				].join("\t") + "\n");
			}
			else
			{
				await entity.save();
			}

			if (process.env.APP_ENV === "test" && process.env.CONF_LOG_SILENT !== "true")
			{
				const message = entity.data.message ? entity.data.message : entity.data;
				switch (entity.type)
				{
					case "error":
						console.error(entity.type, entity.label, message);
						break;
					case "warning":
						console.warn(entity.type, entity.label, message);
						break;
					default:
						console.log(entity.type, entity.label, message);
				}
			}

			return entity;
		},

		/**
		 * @memberOf LogModel
		 * @return {boolean}
		 */
		deleteFiles: function ()
		{
			if (process.env.APP_ENV !== "test")
			{
				throw new Error("This function is only available on the test environment!");
			}

			const logDir = path.resolve(process.env.CONF_LOG_DIR || "./");
			const logFile = this.getLogFile();

			if (!fs.existsSync(logDir))
			{
				return true;
			}

			let files = fs.readdirSync(logDir);

			let index = files.indexOf(logFile);
			if (index > -1)
			{
				fs.rmSync(logDir + "/" + logFile);
				files = files.filter(item => {
					return item !== logFile;
				});
			}

			if (!files.length)
			{
				fs.rmSync(logDir, {
					recursive: true,
					force: true
				});
			}

			return true;
		}
	}
});


const LogModel = mongoose.model("Log", logSchema);

module.exports = LogModel;
