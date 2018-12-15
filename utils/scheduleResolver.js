module.exports = {

	resolve: function(schedule, now)
	{
		var date;
		now = now || new Date();

		var exactDateFormat = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/;

		if (schedule === "now")
		{
			date = now;
		}
		else
		{
			date = schedule.match(exactDateFormat);
			if (date.length === 7)
			{
				date = new Date(Date.UTC(
					parseInt(date[1], 10), parseInt(date[2], 10) - 1, parseInt(date[3], 10),
					parseInt(date[4], 10), parseInt(date[5], 10), parseInt(date[6], 10)
				));
			}
		}

		return date;
	}

};
