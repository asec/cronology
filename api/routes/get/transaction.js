module.exports.getTransaction = (req, res, next, db, config) => {

	var message = {
		success: true
	};
	var limitStart = 0;
	var limit = 20;

	var q = "SELECT * FROM ?? ORDER BY `created` DESC LIMIT ?, ?";
	db.query(q, [config.dbt.TRANSACTIONS, limitStart, limit], (err, results, fields) => {
		if (err)
		{
			return res.json({
				success: false,
				error: "MySQL query transactions error: " + (err.sqlMessage || err.message)
			});
		}

		message.items = results.map((item, key) => {
			return {
				trid: item.id,
				name: item.name,
				schedule: new Date(), // TODO: Az ütemezés alapján legközelebb eső futás idejét visszaadni itt
				isRecurring: !!item.isRecurring,
				isRunning: !!item.isRunning,
				isCanceled: !!item.isCanceled,
				completedSteps: item.completedSteps,
				numSteps: item.numSteps,
				waitAfterStep: item.waitAfterStep,
				created: item.created
			};
		});
		return res.json(message);
	});

};
