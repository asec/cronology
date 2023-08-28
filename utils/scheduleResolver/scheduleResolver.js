"use strict";
class ScheduleResolver
{

	isRepeatable = false;
	get #exactDateFormat()
	{
		return /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
	}

	resolve(schedule, now = null)
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
			return now;
		}

		result = this.#resolveFromDateFormat(schedule);
		if (result !== null)
		{
			return result;
		}

		result = this.#resolveFromCronFormat(schedule, now);

		return result;
	}

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

	#resolveFromCronFormat(schedule, now)
	{
		let result = null;

		let cron = schedule.match(this.#cronFormat.validator);
		if (!cron || !Array.isArray(cron) || cron.length !== 1)
		{
			return result;
		}

		cron = schedule.match(this.#cronFormat.splitter);
		if (!cron || !Array.isArray(cron) || cron.length !== 5)
		{
			return result;
		}

		let translate = [
			"min", "hour", "dayMonth", "month", "dayWeek"
		];

		console.log(now, cron);
		let valid = true;
		result = now;
		for (let i = 0; i < cron.length; i++)
		{
			let part = cron[i];
			let exact = part.match(this.#cronFormat.cronExact);
			let nextValidValue = -1;
			if (exact && Array.isArray(exact) && exact.length === 1)
			{
				nextValidValue = exact.pop();
			}
			else if (part === "*")
			{
				switch (translate[i])
				{
					case "min":
						nextValidValue = now.getUTCMinutes();
						break;
					case "hour":
						nextValidValue = now.getUTCHours();
						break;
					case "dayMonth":
						nextValidValue = now.getUTCDay();
						break;
					case "month":
						nextValidValue = now.getUTCMonth();
						break;
					case "dayWeek":
						nextValidValue = now.getUTCDay();
						break;
				}
			}

			valid = this.#resolveFromCronFormat_validateConcreteValue(translate[i], nextValidValue);
			if (!valid)
			{
				break;
			}

			switch (translate[i])
			{
				case "min":
					result.setUTCMinutes(nextValidValue);
					break;
				case "hour":
					result.setUTCHours(nextValidValue);
					break;
				case "month":
					result.setUTCMonth(nextValidValue);
					break;
			}
		}

		if (!valid)
		{
			return null;
		}

		console.log(result, now < result);

		return result;
	}

}

module.exports = new ScheduleResolver();
