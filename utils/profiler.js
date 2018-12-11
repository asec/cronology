module.exports = {

	sequences: [],

	start: function()
	{
		var now = (new Date()).getTime();
		this.sequences = [];
		this.sequences.push(now);
	},

	mark: function()
	{
		if (!this.sequences.length)
		{
			this.start();
			return -1;
		}

		var now = (new Date()).getTime();
		var prev = this.sequences[this.sequences.length - 1];
		var timeDiff = now - prev;
		this.sequences.push(now);

		return timeDiff;
	},

	get: function(total)
	{
		total = !!total;

		if (!this.sequences.length)
		{
			return -1;
		}

		var now = (new Date()).getTime();
		var prev = this.sequences[total ? 0 : (this.sequences.length - 1)];
		var timeDiff = now - prev;

		return timeDiff;
	}

};
