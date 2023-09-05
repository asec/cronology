"use strict";
const { CronScheduler } = require("./CronScheduler/CronScheduler.class");
class ScheduleResolver
{
	isRepeatable = false;
	/**
	 * @type {Date}
	 */
	#result = null;
	/**
	 * @type {CronScheduler}
	 */
	#cronSchedule = null;

	get #exactDateFormat()
	{
		return /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
	}

	/**
	 * @param {string} schedule
	 * @param {Date} [now = null]
	 */
	constructor(schedule, now = null)
	{
		if (typeof schedule !== "string")
		{
			throw new Error("The `schedule` parameter must be a string.");
		}
		this.#resolve(schedule, now);
	}

	/**
	 * @param {string} schedule
	 * @param {Date} [now = null]
	 */
	#resolve(schedule, now = null)
	{
		this.isRepeatable = false;
		if (now === null)
		{
			now = new Date();
		}
		let result = null;
		schedule = schedule.trim();

		if (schedule === "now")
		{
			this.#result = now;
			return;
		}

		result = this.#resolveFromDateFormat(schedule);
		if (result !== null)
		{
			this.#result = result;
			return;
		}

		this.#resolveFromCronFormat(schedule, now);
	}

	/**
	 * @param {string} schedule
	 * @returns {Date|null}
	 */
	#resolveFromDateFormat(schedule)
	{
		const dateMatch = schedule.match(this.#exactDateFormat);
		let result = null;

		if (!dateMatch || !Array.isArray(dateMatch) || dateMatch.length !== 7)
		{
			return result;
		}

		result = new Date(Date.UTC(
			parseInt(dateMatch[1], 10), parseInt(dateMatch[2], 10) - 1, parseInt(dateMatch[3], 10),
			parseInt(dateMatch[4], 10), parseInt(dateMatch[5], 10), parseInt(dateMatch[6], 10)
		));

		return result;
	}

	/**
	 * @param {string} schedule
	 * @param {Date} [now = null]
	 */
	#resolveFromCronFormat(schedule, now = null)
	{
		let cronSchedule = new CronScheduler(schedule, now);
		if (cronSchedule.isFormatValid())
		{
			this.isRepeatable = true;
			this.#cronSchedule = cronSchedule;
		}
	}

	/**
	 * @returns {Date}
	 */
	next()
	{
		return this.isRepeatable && this.#cronSchedule ? this.#cronSchedule.next() : this.#result;
	}
}

module.exports = {
	ScheduleResolver
};
