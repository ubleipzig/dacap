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
	constructor(private endpoint?: Endpoint, private nodeCache?: NodeCache) {
		if (endpoint) this.setEndpoint(endpoint);
		if (nodeCache) this.setCache(nodeCache);
	}

	setEndpoint(endpoint: Endpoint): this {
		this.endpoint = endpoint;
		return this;
	}

	getEndpoint(): Endpoint {
		return this.endpoint;
	}

	setCache(nodeCache: NodeCache): this {
		this.nodeCache = nodeCache;
		this.nodeCache.on('expired', (key, value) => {
			debug(`hash "${key}" has expired`);
			this.refresh(key, value);
		})
		return this;
	}

	getCache(): NodeCache {
		return this.nodeCache;
	}

	flush() {
		return this.nodeCache.flushAll();
	}

	del(hash) {
		return this.nodeCache.del(hash);
	}

	async get(hash: string, path: string): Promise<EndpointValue> {
		let value: EndpointValue | undefined = this.nodeCache.get(hash);
		if (value == undefined) {
			debug(`no cache hit. fetching ${path}`);
			value = {
				uriPath: path,
				contentType: '',
				data: ''
			};
			try {
				await this.endpoint.request(value);
				this.nodeCache.set(hash, value);
			} catch (err) {
				console.error(err);
			}
		} else {
			debug(`cache hit. ttl is ${this.nodeCache.getTtl(hash)}`);
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
		this.nodeCache.set(key, value);
		debug(`successfully refreshed "${key}"`);
	}

	keys(): string[] {
		return this.nodeCache.keys();
	}

	getDetails(): CacheDetails[];
	getDetails(hash: string): CacheDetails;
	getDetails(hash?): any {
		return (hash) ? this._getDetails(hash) : this.nodeCache.keys().map(this._getDetails.bind(this));
	}

	private _getDetails(hash: string): CacheDetails {
		const nodeCache = this.nodeCache.get<EndpointValue>(hash);
		return {
			hash: hash,
			ttl: this.nodeCache.getTtl(hash),
			uriPath: nodeCache.uriPath,
			contentType: nodeCache.contentType,
			size: nodeCache.data.length
		};
	}

	toObject(): CacheObject {
		const data = {
			endPoint: this.endpoint.toString(),
			cacheOptions: this.nodeCache.options,
			cache: []
		}

		this.nodeCache.keys().map((hash) => {
			data.cache.push({
				hash: hash,
				value: this.nodeCache.get<EndpointValue>(hash)
			});
		});

		return <CacheObject>data;
	}

	fromObject(data) {
		const endpoint = new Endpoint(data.endPoint);
		const nodeCache = new NodeCache(data.cacheOptions);
		this.setEndpoint(endpoint);

		data.cache.map((item) => {
			nodeCache.set(item.hash, item.value);
		});

		this.setCache(nodeCache);
	}
}