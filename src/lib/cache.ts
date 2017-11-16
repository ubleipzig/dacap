import * as debugFactory from 'debug';
import * as NodeCache from 'node-cache';

import { Endpoint, EndpointValue } from './endpoint';

const debug = debugFactory('dacap:cache');

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
	cacheOptions: NodeCache.Options,
	cacheStats: NodeCache.Stats,
	cache: CacheDetails[],
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

	keys(): string[] {
		return this.realCache.keys();
	}

	getDetails(): CacheDetails[];
	getDetails(hash: string): CacheDetails;
	getDetails(hash?): any {
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