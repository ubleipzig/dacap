import * as debugFactory from 'debug';
import * as express from 'express';
import * as NodeCache from 'node-cache';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as Q from 'q';

import { Endpoint, EndpointValue } from './endpoint';

const debug = debugFactory('dacap:cache');

export interface MiddlewareFunction {
	(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void>
}

export interface RegisterObject {
	name: string
	data: CacheObject
}
export interface CacheObject {
	endPoint: string,
	cacheOptions: NodeCache.Options,
	cache: [
		{
			hash: string,
			value: any
		}
	]
}

export interface CacheDetails {
	hash: string,
	uriPath: string,
	contentType: string,
	ttl: number,
	size: number
}

export interface CacheInfo {
	name: string,
	apiEndPoint: string,
	proxyEndPoint: string,
	cacheOptions: NodeCache.Options,
	cacheStats: NodeCache.Stats,
	cache: CacheDetails[],
}

export function Middleware(register: Register): MiddlewareFunction {

	return async function (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		const pattern = new RegExp('^/([^/]+)/?(.*)$');
		const match = req.url.match(pattern);
		try {
			const cache = register.get(match[1]);
			const uniQueryString = Object.keys(req.query).sort().map(function (key) { return `${key}=${req.query[key]}` }).join('&');
			const hash = crypto.createHash('sha1').update(req.path + uniQueryString).digest('hex');
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
	add = (name: string, serverUrl: string, cacheOptions: NodeCache.Options) => {
		const endpoint: Endpoint = new Endpoint(serverUrl);
		const nodeCache: NodeCache = new NodeCache(cacheOptions)
		this.cacheRegister[name] = new Cache(endpoint, nodeCache);
	}

	delete(name: string) {
		if (!this.has(name)) throw new Error(`register not found: ${name}`);
		delete this.cacheRegister[name];
	}

	getInfo = (proxyUrl: string, name?: string): CacheInfo|CacheInfo[] => {
		return (name) ? this._getInfo(proxyUrl, name) : Object.keys(this.cacheRegister).map((key): CacheInfo => {
			return this._getInfo(proxyUrl, key);
		});
	}

	private _getInfo(proxyUrl: string, name: string): CacheInfo {
		return {
			name: name,
			apiEndPoint: this.cacheRegister[name].getEndpoint().toString(),
			proxyEndPoint: proxyUrl + name + '/',
			cacheOptions: this.cacheRegister[name].getCache().options,
			cacheStats: this.cacheRegister[name].getCache().getStats(),
			cache: <CacheDetails[]>this.cacheRegister[name].getDetails()
		}
	}

	toObject = (): RegisterObject[] => {
		return Object.keys(this.cacheRegister).map((name) => {
			return {
				name: name,
				data: this.cacheRegister[name].toObject()
			}
		});
	}

	save = (): void => {
		fs.writeFileSync(path.resolve(this.storage, this.name), JSON.stringify(this.toObject()), { encoding: 'utf8', flag: 'w' });
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

	getEndpoint(): Endpoint {
		return this.endpoint;
	}

	setCache(realCache: NodeCache): this {
		this.realCache = realCache;
		this.realCache.on('expired', (key, value) => {
			debug(`hash "${key}" has expired`);
			this.refresh(key, value);
		})
		return this;
	}

	getCache(): NodeCache {
		return this.realCache;
	}

	flush() {
		return this.realCache.flushAll();
	}

	del(hash) {
		return this.realCache.del(hash);
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

	async refresh(key, value) {
		const newValue = {
			uriPath: value.uriPath,
			contentType: '',
			data: ''
		}
		await this.endpoint.request(newValue);
		value.data = newValue.data;
		value.contentType = newValue.contentType;
		this.realCache.set(key, value);
		debug(`successfully refreshed "${key}"`);
	}

	keys = (): string[] => {
		return this.realCache.keys();
	}

	getDetails<T>(hash?:string): CacheDetails|CacheDetails[] {
		return (hash) ? this._getDetails(hash) : this.realCache.keys().map(this._getDetails.bind(this));
	}

	private _getDetails(hash: string): CacheDetails {
		return {
			hash: hash,
			ttl: this.realCache.getTtl(hash),
			uriPath: this.realCache.get<EndpointValue>(hash).uriPath,
			contentType: this.realCache.get<EndpointValue>(hash).contentType,
			size: this.realCache.get<EndpointValue>(hash).data.length
		};
	}

	toObject(): CacheObject {
		const data = {
			endPoint: this.endpoint.toString(),
			cacheOptions: this.realCache.options,
			cache: []
		}

		this.realCache.keys().map((hash) => {
			data.cache.push({
				hash: hash,
				value: this.realCache.get<EndpointValue>(hash)
			});
		});

		return <CacheObject>data;
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