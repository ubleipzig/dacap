import * as debugFactory from 'debug';
import * as express from 'express';
import * as NodeCache from 'node-cache';
import * as crypto from 'crypto';
import { Endpoint, EndpointValue } from './endpoint';

const debug = debugFactory('decap:cache');

export namespace Register {
		const cacheRegister:{[key: string]: Cache} = {};

		export let getByName = (name: string): Cache => {
		if (!cacheRegister[name]) throw new Error(`no endpoint registered for "${name}"`);
		return cacheRegister[name];
	}

	export let register = (name: string, serverUrl) => {
		const endpoint:Endpoint = new Endpoint(serverUrl);
		const nodeCache:NodeCache = new NodeCache()
		cacheRegister[name] = new Cache(endpoint, nodeCache);
	}
}

export class Cache {
	constructor (private endpoint: Endpoint, private realCache: NodeCache) {
	}

	async get(hash: string, path: string): Promise<EndpointValue> {
		let value:EndpointValue|undefined = this.realCache.get(hash);
		if (value == undefined) {
			debug(`no cache hit. fetching ${path}`);
			value = {
				contentType: '',
				data: ''
			};
			try {
				await this.endpoint.request(path, value);
				this.realCache.set(hash, value);
			} catch (err) {
				console.error(err);
			}
		}
		return value;
	}
}

export async function Middleware(req: express.Request, res: express.Response, next: express.NextFunction) {
	const pattern = new RegExp('^/([^/]+)(.*)$');
	const match = req.url.match(pattern);

	try {
		const cache = Register.getByName(match[1]);
		const uniQueryString = Object.keys(req.query).sort().map(function (key) { return `${key}=${req.query[key]}` }).join('&');
		const hash = crypto.createHash('sha1').update(req.path + uniQueryString).digest('base64');
		const value = await cache.get(hash, match[2]);
		res.setHeader('content-type', value.contentType)
		res.send(value.data);
	} catch (err) {
		next(err);
	}
}

