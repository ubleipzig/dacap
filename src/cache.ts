import * as debugFactory from 'debug';
import * as express from 'express';
import * as NodeCache from 'node-cache';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as Q from 'q';

import { Endpoint, EndpointValue } from './endpoint';

const debug = debugFactory('decap:cache');

interface MiddlewareFunction {
	(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void>
}

export class Register {
	cacheRegister: { [key: string]: Cache } = {};

	constructor(private storage: string, public name: string) {
		fs.existsSync(storage) || fs.mkdirSync(storage);
	}

	get = (name: string): Cache => {
		if (!this.cacheRegister[name]) throw new Error(`no endpoint registered for "${name}"`);
		return this.cacheRegister[name];
	}

	add = (name: string, serverUrl) => {
		const endpoint: Endpoint = new Endpoint(serverUrl);
		const nodeCache: NodeCache = new NodeCache()
		this.cacheRegister[name] = new Cache();
		this.cacheRegister[name].setCache(nodeCache).setEndpoint(endpoint);
	}

	save = () => {
		const data = Object.keys(this.cacheRegister).map((name) => {
			return {
				name: name,
				data: this.cacheRegister[name].toObject()
			}
		});

		fs.writeFileSync(path.resolve(this.storage, this.name), JSON.stringify(data), {encoding: 'utf8', flag: 'w'});
		debug('register ${this.name} saved to ${this.storage}');
	}

	restore = async (): Promise<void> => {
		const data = JSON.parse(fs.readFileSync(path.resolve(this.storage, this.name), { encoding: 'utf8' }));

		data.map((cache) => {
			this.cacheRegister[cache.name] = new Cache();
			this.cacheRegister[cache.name].fromObject(cache.data);
		});
		debug('register ${this.name} restored from ${this.storage}');
	}
}

export class Cache {
	constructor(private endpoint?: Endpoint, private realCache?: NodeCache) {
	}

	setEndpoint(endpoint: Endpoint): this {
		this.endpoint = endpoint;
		return this;
	}

	setCache(realCache: NodeCache): this {
		this.realCache = realCache;
		return this;
	}

	async get(hash: string, path: string): Promise<EndpointValue> {
		let value: EndpointValue | undefined = this.realCache.get(hash);
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

	toObject() {
		const data = {
			endPoint: this.endpoint.toObject(),
			cache: []
		}

		this.realCache.keys().map((hash) => {
			data.cache.push({
				hash: hash,
				data: this.realCache.get(hash)
			});
		});

		return data;
	}

	fromObject(data) {
		const endpoint = new Endpoint();
		const realCache = new NodeCache()
		endpoint.fromObject(data.endPoint);

		this.setEndpoint(endpoint);

		data.cache.map((item) => {
			realCache.set(item.hash, item.data);
		});

		this.setCache(realCache);
	}
}

export function Middleware(register): MiddlewareFunction {

	return async function (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		const pattern = new RegExp('^/([^/]+)(.*)$');
		const match = req.url.match(pattern);

		try {
			const cache = register.get(match[1]);
			const uniQueryString = Object.keys(req.query).sort().map(function (key) { return `${key}=${req.query[key]}` }).join('&');
			const hash = crypto.createHash('sha1').update(req.path + uniQueryString).digest('base64');
			const value = await cache.get(hash, match[2]);
			res.setHeader('content-type', value.contentType)
			res.send(value.data);
		} catch (err) {
			next(err);
		}
	}
}
