const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const readLine = require("readline");
const crypto = require("crypto");

/**
 * @typedef {{}} SectionBean
 * @property {string} id
 * @property {string} name
 */

const logSchema = new mongoose.Schema({
	section: { type: String },
	type: { type: String, required: true },
	label: { type: String, required: true },
	data: Object
}, {
	timestamps: {
		createdAt: "created",
		updatedAt: false
	},
	statics: {
		logFile: "",
		/**
		 * @type {(SectionBean | {})}
		 */
		section: {},
		/**
		 * @memberOf LogModel
		 * @return {string}
		 */
		getLogFile: function () {
			const defaultLogFile = (new Date()).toISOString().split("T")[0];
			return (typeof this.logFile === "string" && this.logFile) ? this.logFile : defaultLogFile;
		},
		/**
		 * @memberOf LogModel
		 * @param {string} fileName
		 */
		setLogFile: function (fileName) {
			this.logFile = fileName;
		},

		/**
		 * @memberOf LogModel
		 * @async
		 * @param {string} type
		 * @param {string} label
		 * @param {Object} [data = {}]
		 * @return {Promise<false|LogModel>}
		 */
		log: async function (type, label, data = {}) {
			if (process.env.CONF_LOG_DISABLED === "true") {
				return false;
			}
			let entity = this._createObject(type, label, data);

			if (mongoose.connection.readyState !== 1) {
				this._persistFile(entity);
			} else {
				await this._persistDb(entity);
			}

			this._showOnConsole(entity);

			return entity;
		},

		/**
		 * @memberOf LogModel
		 * @async
		 * @param {string} type
		 * @param {string} label
		 * @param {Object} [data = {}]
		 * @return {false|LogModel}
		 */
		logToFile: function (type, label, data = {}) {
			if (process.env.CONF_LOG_DISABLED === "true") {
				return false;
			}
			let entity = this._createObject(type, label, data);

			this._persistFile(entity);

			this._showOnConsole(entity);

			return entity;
		},

		/**
		 * @param {string} type
		 * @param {string} label
		 * @param {Object} data
		 * @private
		 */
		_createObject: function (type, label, data = {}) {
			return new LogModel({
				section: this.section.id || "",
				type,
				label,
				data
			});
		},

		/**
		 * @param {mongoose.types.Document} entity
		 * @private
		 */
		_persistFile: function (entity) {
			entity.validateSync();
			const now = new Date();
			const logDir = path.resolve(process.env.CONF_LOG_DIR || "./");
			const fileName = this.getLogFile();
			if (!fs.existsSync(logDir)) {
				fs.mkdirSync(logDir);
			}
			fs.appendFileSync(logDir + "/" + fileName, [
				now.toISOString(),
				JSON.stringify(entity.toJSON())
			].join("\t") + "\n");
		},

		/**
		 * @param {mongoose.types.Document} entity
		 * @private
		 */
		_persistDb: async function (entity) {
			return await entity.save();
		},

		/**
		 * @param {mongoose.types.Document} entity
		 * @private
		 */
		_showOnConsole: function (entity) {
			if (process.env.APP_ENV === "test" && process.env.CONF_LOG_SILENT !== "true") {
				const message = entity.data.message ? entity.data.message : entity.data;
				switch (entity.type) {
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
		},

		/**
		 * @memberOf LogModel
		 * @return {boolean}
		 */
		deleteFiles: function () {
			if (process.env.APP_ENV !== "test") {
				throw new Error("This function is only available on the test environment!");
			}

			const logDir = path.resolve(process.env.CONF_LOG_DIR || "./");
			const logFile = this.getLogFile();

			if (!fs.existsSync(logDir)) {
				return true;
			}

			let files = fs.readdirSync(logDir);

			let index = files.indexOf(logFile);
			if (index > -1) {
				fs.rmSync(logDir + "/" + logFile);
				files = files.filter(item => {
					return item !== logFile;
				});
			}

			if (!files.length) {
				fs.rmSync(logDir, {
					recursive: true,
					force: true
				});
			}

			return true;
		},

		/**
		 * Start a new log section. This call also opens up a db connection.
		 * @memberOf LogModel
		 * @param {string} name
		 * @returns {Promise<false|LogModel>}
		 */
		startSection: async function (name) {
			this.section = {
				id: crypto.randomUUID(),
				name
			};

			const db = require("../../utils/db");
			await db.connect();

			return await this.log("section", name);
		},

		/**
		 * @memberOf LogModel
		 */
		endSection: function () {
			this.section = {};
		},

		/**
		 * @memberOf LogModel
		 * @param {string} [file]
		 * @returns {Promise<number>}
		 */
		pullFromFile: async function (file = "") {
			const logDir = path.resolve(process.env.CONF_LOG_DIR || "./");
			const fileName = file || this.getLogFile();

			const lineReader = readLine.createInterface(
				fs.createReadStream(logDir + "/" + fileName)
			);

			let pulledCount = 0;
			for await (const line of lineReader) {
				const [rawDate, rawJson] = line.split("\t");
				const date = new Date(rawDate);
				const modelData = JSON.parse(rawJson);
				let found = await this.countDocuments({
					_id: modelData._id
				});
				if (found === 0) {
					modelData.created = rawDate;
					let entity = new this(modelData);
					await this._persistDb(entity);
					pulledCount++;
				}
			}

			return pulledCount;
		}
	}
});


const LogModel = mongoose.model("Log", logSchema);

module.exports = LogModel;
