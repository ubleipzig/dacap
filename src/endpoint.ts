import * as path from 'path';
import * as Q from 'q';
import * as Url from 'url';
import * as request from 'request';

export interface EndpointValue {
	uriPath: string;
	contentType: string;
	data: string;
}

export class Endpoint {
	private serverUrl:Url.Url;

	constructor(serverUrl?:string|Url.Url) {
		this.serverUrl = (typeof serverUrl === 'string') ? Url.parse(serverUrl) : serverUrl;
	}

	toObject() {
		return Url.format(this.serverUrl);
	}

	request(value:EndpointValue): Promise<void>{
		const deferred = Q.defer();

		const req = request(Url.format(this.serverUrl) + value.uriPath, (err, res, body) => {
			if (err) return deferred.reject(err);
			value.contentType = <string>res.headers['content-type'];
			value.data = body;

			if (res.statusCode !== 200)
				return deferred.reject(new Error(`No status 200. not caching the result`));
			return deferred.resolve();
		});

		return deferred.promise;
	}
}