class Profiler
{
	sequences = [];

	start()
	{
		const now = (new Date()).getTime();
		this.reset();
		this.sequences.push(now);
	}

	reset()
	{
		this.sequences = [];
	}

	now()
	{
		return (new Date()).getTime();
	}

	mark()
	{
		if (!this.sequences.length)
		{
			this.start();
			return -1;
		}

		const timeDiff = this.#getTimeSince();

		this.sequences.push(this.now());

		return timeDiff;
	}

	#getTimeSince(first = false)
	{
		const now = this.now();
		const prev = this.sequences[first ? 0 : this.sequences.length - 1];

		return now - prev;
	}

	get(total = false)
	{
		if (!this.sequences.length)
		{
			return -1;
		}

		return this.#getTimeSince(total);
	}

	async wait(ms = 200)
	{
		await new Promise(resolve => setTimeout(resolve, ms));

		return true;
	}
}

module.exports = new Profiler();
