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

export function Middleware(register: Register): MiddlewareFunction {

		return async function (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
			const pattern = new RegExp('^/([^/]+)/?(.*)$');
			const match = req.url.match(pattern);
			try {
				const cache = register.get(match[1]);
				const uniQueryString = Object.keys(req.query).sort().map(function (key) { return `${key}=${req.query[key]}` }).join('&');
				const hash = crypto.createHash('sha1').update(req.path + uniQueryString).digest('base64');
				debug(`finding cache-entry for ${hash}`);
				const value = await cache.get(hash, match[2]);
				res.setHeader('content-type', value.contentType)
				res.send(value.data);
			} catch (err) {
				res.status(404).send(err.message);
			}
		}
	}

/**
 * the cache register
 *
 * @export
 * @class Register
 */
export class Register {
	cacheRegister: { [key: string]: Cache } = {};

	constructor(private storage: string, public name: string) {
		fs.existsSync(storage) || fs.mkdirSync(storage);
	}

	has = (name: string): boolean => {
		return !!this.cacheRegister[name];
	}
	/**
	 * gets register by its name
	 *
	 * @memberof Register
	 */
	get = (name: string): Cache => {
		if (!this.has(name)) throw new Error(`register not found: ${name}`);
		return this.cacheRegister[name];
	}

	/**
	 * adds API-Endpoint to cache-register
	 *
	 * @memberof Register
	 */
	add = (name: string, serverUrl:string, ttl) => {
		const endpoint: Endpoint = new Endpoint(serverUrl);
		const nodeCache: NodeCache = new NodeCache({ useClones: false, stdTTL: ttl, checkperiod: 10, deleteOnExpire: false })
		this.cacheRegister[name] = new Cache(endpoint, nodeCache);
	}

	save = () => {
		const data = Object.keys(this.cacheRegister).map((name) => {
			return {
				name: name,
				data: this.cacheRegister[name].toObject()
			}
		});

		fs.writeFileSync(path.resolve(this.storage, this.name), JSON.stringify(data), {encoding: 'utf8', flag: 'w'});
		debug(`register "${this.name}" saved to "${this.storage}"`);
	}

	restore = async (): Promise<void> => {
		const data = JSON.parse(fs.readFileSync(path.resolve(this.storage, this.name), { encoding: 'utf8' }));

		data.map((cache) => {
			this.cacheRegister[cache.name] = new Cache();
			this.cacheRegister[cache.name].fromObject(cache.data);
		});
		debug(`register "${this.name}" restored from "${this.storage}"`);
	}
}

export class Cache {
	constructor(private endpoint?: Endpoint, private realCache?: NodeCache) {
		if (endpoint) this.setEndpoint(endpoint);
		if (realCache) this.setCache(realCache);
	}

	setEndpoint(endpoint: Endpoint): this {
		this.endpoint = endpoint;
		return this;
	}

	setCache(realCache: NodeCache): this {
		this.realCache = realCache;
		this.realCache.on('expired', this.refresh.bind(this));
		return this;
	}

	async get(hash: string, path: string): Promise<EndpointValue> {
		let value: EndpointValue | undefined = this.realCache.get(hash);
		if (value == undefined) {
			debug(`no cache hit. fetching ${path}`);
			value = {
				uriPath: path,
				contentType: '',
				data: ''
			};
			try {
				await this.endpoint.request(value);
				this.realCache.set(hash, value);
			} catch (err) {
				console.error(err);
			}
		} else {
			debug(`cache hit. ttl is ${this.realCache.getTtl(hash)}`);

		}

		return value;
	}

	async refresh (key, value) {
		debug(`hash "${key}" has expired`);
		const newValue = {
			uriPath: value.uriPath,
			contentType: '',
			data: ''
		}
		await this.endpoint.request(newValue);
		value.data = newValue.data;
		this.realCache.set(key, value);
		debug(`successfully refreshed "${key}"`);
	}

	toObject() {
		const data = {
			endPoint: this.endpoint.toObject(),
			cacheOptions: this.realCache.options,
			cache: []
		}

		this.realCache.keys().map((hash) => {
			data.cache.push({
				hash: hash,
				value: this.realCache.get(hash)
			});
		});

		return data;
	}

	fromObject(data) {
		const endpoint = new Endpoint(data.endPoint);
		const realCache = new NodeCache(data.cacheOptions);
		this.setEndpoint(endpoint);

		data.cache.map((item) => {
			realCache.set(item.hash, item.value);
		});

		this.setCache(realCache);
	}
}