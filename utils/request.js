const EventEmitter = require("events"),
	config = require("../config/config.js"),
	https = require("https"),
	http = require("http");

class Request extends EventEmitter
{

	/**
	 * Events:
	 * error, request.error, request.complete
	 */

	constructor(url, json)
	{
		super();
		this.url = url;
		this.json = !!json;
		this.req = null;
	}

	execute()
	{
		console.log(this.url);
		var url = this.url.split("//");
		var connector;
		if (url[0] === "https:")
		{
			connector = https;
		}
		else
		{
			connector = http;
		}
		var request = {};
		var response = {
			status: 0,
			headers: {},
			body: ""
		};

		try
		{
			url = new URL(this.url);
			url.method = "GET";
			this.req = connector.request(url, (res) => {
				response.status = res.statusCode;
				response.headers = res.headers;
				res.on("data", (data) => {
					response.body += data;
				});
				res.on("end", () => {
					try
					{
						var data;
						if (this.json)
						{
							data = JSON.parse(response.body);
						}
						else
						{
							data = response.body;
						}
						this.handleRequestFinished(request, response, data);
					}
					catch (e)
					{
						this.handleRequestError(request, e);
					}
				});
			});
			this.req.on("socket", (socket) => {
				socket.setTimeout(config.api.executionTimeout);
				socket.on("timeout", () => {
					this.req.abort();
				});
			});
			this.req.on("error", (err) => {
				this.handleRequestError(request, err);
			});
			this.req.end();
			request = this.req.output;
		}
		catch (e)
		{
			this.emit("error", e);
		}
	}

	handleRequestError(request, err)
	{
		this.emit("request.error", request, err);
	}

	handleRequestFinished(request, response, data)
	{
		this.emit("request.complete", request, response, data);
	}

	isFinished()
	{
		return this.req.finished;
	}

	abort()
	{
		return this.req.abort();
	}
}

module.exports = Request;
