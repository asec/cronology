module.exports = {

	resolve: function(schedule, now)
	{
		var date;
		now = now || new Date();

		if (schedule === "now")
		{
			date = now;
		}

		return date;
	}

};
