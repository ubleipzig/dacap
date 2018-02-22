import { Component, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CacheDetails, Cache, Config } from './cache';

@Injectable()
export class CacheService {

	constructor(private http: HttpClient) { }

	logout(): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			this.http.get('api/logout').subscribe(resolve.bind(this), reject.bind(this));
		});
	}

	getConfig(): Promise<Config> {
		return new Promise<Config>((resolve, reject) => {
			this.http.get('api/config').subscribe(resolve.bind(this), reject.bind(this));
		});
	}

	getCaches(): Promise<Cache[]> {
		return new Promise<Cache[]>((resolve, reject) => {
			this.http.get('api/list/cache').subscribe(resolve.bind(this), reject.bind(this));
		});
	}

	addCache(name: string, params: { apiEndPoint: string, cacheOptions: { [key: string]: string } }): Promise<Cache> {
		return new Promise<Cache>((resolve, reject) => {
			this.http.post(`api/add/cache/${name}`, params).subscribe(resolve.bind(this), reject.bind(this));
		})
	}

	deleteCache(name: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			this.http.get(`api/delete/cache/${name}`).subscribe(resolve.bind(this), reject.bind(this));
		});
	}

	flushCache(name: string): Promise<Cache> {
		return new Promise<Cache>((resolve, reject) => {
			this.http.get(`api/flush/cache/${name}`).subscribe(resolve.bind(this), reject.bind(this));
		});
	}

	deleteValue(name: string, hash: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			this.http.get(`api/delete/cache/${name}/key/${hash}`).subscribe(resolve.bind(this), reject.bind(this));
		});
	}

	refreshValue(name: string, hash: string): Promise<CacheDetails> {
		return new Promise<CacheDetails>((resolve, reject) => {
			this.http.get(`api/refresh/cache/${name}/key/${hash}`).subscribe(resolve.bind(this), reject.bind(this));
		});
	}
}