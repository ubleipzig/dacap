import * as debugFactory from 'debug';
import * as NodeCache from 'node-cache';
import * as fs from 'fs';
import * as path from 'path';
import * as Q from 'q';

import { CacheObject, Cache, CacheInfo } from './cache';
import { Endpoint } from './endpoint';

const debug = debugFactory('dacap:register');

export interface RegisterObject {
	name: string
	data: CacheObject
}

/**
 * the cache register
 *
 * @export
 * @class Register
 */
export class Register {
	cacheRegister: { [key: string]: Cache } = {};
	saveTimer: NodeJS.Timer;

	constructor(private storage: string, public name: string) {
		fs.existsSync(storage) || fs.mkdirSync(storage);
	}

	has(name: string): boolean {
		return !!this.cacheRegister[name];
	}
	/**
	 * gets register by its name
	 *
	 * @memberof Register
	 */
	get(name: string): Cache {
		if (!this.has(name)) throw new Error(`register not found: ${name}`);
		return this.cacheRegister[name];
	}

	/**
	 * adds API-Endpoint to cache-register
	 *
	 * @memberof Register
	 */
	add(name: string, serverUrl: string, cacheOptions: NodeCache.Options) {
		const endpoint: Endpoint = new Endpoint(serverUrl);
		const nodeCache: NodeCache = new NodeCache(cacheOptions)
		this.cacheRegister[name] = new Cache(endpoint, nodeCache);
	}

	delete(name: string) {
		if (!this.has(name)) throw new Error(`register not found: ${name}`);
		delete this.cacheRegister[name];
	}

	getInfo(): CacheInfo[];
	getInfo(name: string): CacheInfo;
	getInfo(name?): any {
		return (name) ? this._getInfo(name) : Object.keys(this.cacheRegister).map((key): CacheInfo => {
			return this._getInfo(key);
		});
	}

	private _getInfo(name: string): CacheInfo {
		return {
			name: name,
			apiEndPoint: this.cacheRegister[name].getEndpoint().toString(),
			cacheOptions: this.cacheRegister[name].getCache().options,
			cacheStats: this.cacheRegister[name].getCache().getStats(),
			cache: this.cacheRegister[name].getDetails()
		}
	}

	toObject(): RegisterObject[] {
		return Object.keys(this.cacheRegister).map((name) => {
			return {
				name: name,
				data: this.cacheRegister[name].toObject()
			}
		});
	}

	save(interval?: number): void {
		let success = this._save();

		if (this.saveTimer) {
			clearTimeout(this.saveTimer);
			this.saveTimer = undefined;
		}

		if (interval && success) {
			this.saveTimer = setTimeout(() => {
				this.save(interval);
			}, interval);
		}
	}

	_save(): Boolean {
		fs.writeFileSync(path.resolve(this.storage, this.name), JSON.stringify(this.toObject()), { encoding: 'utf8', flag: 'w' });
		debug(`register "${this.name}" saved to "${this.storage}"`);
		return true;
	}

	async restore(): Promise<boolean> {
		try {
			const data = JSON.parse(fs.readFileSync(path.resolve(this.storage, this.name), { encoding: 'utf8' }));

			data.map((cache) => {
				this.cacheRegister[cache.name] = new Cache();
				this.cacheRegister[cache.name].fromObject(cache.data);
			});
			debug(`register "${this.name}" restored from "${this.storage}"`);
			return true;
		} catch (e) {
			debug(`register "${this.name}" could not be restored: ${e}`);
			return false;
		}
	}
}