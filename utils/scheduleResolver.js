module.exports = {

	isRepeatable: false,

	resolve: function(schedule, now)
	{
		this.isRepeatable = false;
		var date = null;
		now = now || new Date();

		var exactDateFormat = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
		var cronFormat = /([0-9]{1,2})|(\*(\/([0-9]{1,2}))?)/g;

		if (schedule === "now")
		{
			// The date should be this exact moment
			date = now;
		}
		else
		{
			var dateMatch = schedule.match(exactDateFormat);
			if (dateMatch && dateMatch.length === 7)
			{
				// We have a date specified to the seconds
				date = new Date(Date.UTC(
					parseInt(dateMatch[1], 10), parseInt(dateMatch[2], 10) - 1, parseInt(dateMatch[3], 10),
					parseInt(dateMatch[4], 10), parseInt(dateMatch[5], 10), parseInt(dateMatch[6], 10)
				));
			}
			else
			{
				// We might have a cron format for repeated execution. If even this fails we return null to let the caller know that it gave us an invalid input.
				var cron = schedule.split(" ");
				if (cron.length === 5)
				{
					var success = true;
					var isRepeatable = false;
					for (var i = 0; i < cron.length; i++)
					{
						var part = cron[i].match(cronFormat);
						if (part.length > 1 || part[0] !== cron[i])
						{
							success = false;
							break;
						}
						cron[i] = part[0];
					}
					if (success)
					{
						var cronStepFormat = /^(\*(\/([0-9]{1,2}))?)$/;
						var crontExactFormat = /^([0-9]{1,2})$/;
						var translate = [
							"min", "hour", "dayMonth", "month", "dayWeek"
						];
						var validValues = {
							min: [],
							hour: [],
							dayMonth: [],
							month: [],
							dayWeek: []
						};
						for (var i = 0; i <= 59; i++)
						{
							validValues.min.push(i);
						}
						for (var i = 0; i <= 23; i++)
						{
							validValues.hour.push(i);
						}
						for (var i = 1; i <= 31; i++)
						{
							validValues.dayMonth.push(i);
						}
						for (var i = 1; i <= 12; i++)
						{
							validValues.month.push(i);
						}
						for (var i = 0; i <= 6; i++)
						{
							validValues.dayWeek.push(i);
						}

						for (var i = 0; i < cron.length; i++)
						{
							var part = cron[i];
							var type = translate[i];
							if (part === "*")
							{
								continue;
							}
							if (part === "*/0")
							{
								success = false;
								break;
							}
							var step = cronStepFormat.exec(part);
							if (step && step.length === 4)
							{
								step = parseInt(step[3], 10);
								if (!step || isNaN(step) || validValues[type].indexOf(step) === -1)
								{
									success = false;
									break;
								}
								validValues[type] = validValues[type].filter((currentValue) => {
									return (currentValue % step === 0);
								});
							}
							else
							{
								var exact = crontExactFormat.exec(part);
								if (exact && exact.length === 2)
								{
									exact = parseInt(exact[1], 10);
									if (isNaN(exact) || validValues[type].indexOf(exact) === -1)
									{
										success = false;
										break;
									}
									validValues[type] = validValues[type].filter((currentValue) => {
										return (currentValue === exact);
									});
								}
							}
							if (validValues[type].length === 0)
							{
								success = false;
								break;
							}
						}

						if (success)
						{
							isRepeatable = true;
							// After we established a set of valid values for each component we are beginning to look for a suitable date.
							var currentTime = new Date(now).getTime();
							var finishTime = currentTime + 1000 * 60 * 60 * 24 * 365 * 5;
							var resolution = 1000 * 60;
							while (currentTime < finishTime)
							{
								var current = new Date(currentTime);
								if (
									validValues.min.indexOf(current.getUTCMinutes()) > -1 &&
									validValues.hour.indexOf(current.getUTCHours()) > -1 &&
									validValues.dayMonth.indexOf(current.getUTCDate()) > -1 &&
									validValues.month.indexOf(current.getUTCMonth() + 1) > -1 &&
									validValues.dayWeek.indexOf(current.getUTCDay()) > -1
								)
								{
									this.isRepeatable = isRepeatable;
									date = current;
									break;
								}
								currentTime += resolution;
							}
						}
					}
				}
			}
		}

		return date;
	}

};
