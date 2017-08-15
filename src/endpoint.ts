import * as https from 'https';
import * as path from 'path';
import * as Q from 'q';

export interface EndpointValue {
	contentType: string;
	data: string;
}

export class Endpoint {

	constructor(private serverUrl?:string) {
	}

	setEndpoint(serverUrl: string) {
		this.serverUrl = serverUrl;
	}

	toObject() {
		return {serverUrl: this.serverUrl};
	}

	fromObject (data) {
		this.setEndpoint(data.serverUrl);
	}

	public request(uriPath:string, value:EndpointValue): Promise<void>{
		const deferred = Q.defer();

		const req = https.request(this.serverUrl + uriPath, (res) => {
			value.contentType = <string>res.headers['content-type'];

			res.on('data', (chunk) => {
				value.data += chunk;
			});

			res.on('end', () => {
				if (res.statusCode !== 200)
					return deferred.reject(new Error(`No status 200. not caching the result`));
				deferred.resolve();
			});
		})

		req.on('error', (err) => {
			console.error(err);
			deferred.reject(err);
		});

		req.end();
		return deferred.promise;
	}
}