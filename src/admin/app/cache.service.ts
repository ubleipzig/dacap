import { Component, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Cache } from './cache';
import { CacheDetails } from './cache';

@Injectable()
export class CacheService {

	constructor(private http: HttpClient) { }

	getCaches(): Promise<Cache[]> {
		return new Promise<Cache[]>((resolve, reject) => {
			this.http.get('/api/list/cache').subscribe(resolve.bind(this));
		});
	}

	addCache(name: string, params: { apiEndPoint: string, cacheOptions: { [key: string]: string } }): Promise<Cache> {
		return new Promise<Cache>((resolve, reject) => {
			this.http.post(`/api/add/cache/${name}`, params).subscribe(resolve.bind(this));
		})
	}

	deleteCache(name: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			this.http.get(`/api/delete/cache/${name}`).subscribe(resolve.bind(this));
		});
	}

	flushCache(name: string): Promise<Cache> {
		return new Promise<Cache>((resolve, reject) => {
			this.http.get(`/api/flush/cache/${name}`).subscribe(resolve.bind(this));
		});
	}

	deleteValue(name: string, hash: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			this.http.get(`/api/delete/cache/${name}/key/${hash}`).subscribe(resolve.bind(this));
		});
	}

	refreshValue(name: string, hash: string): Promise<CacheDetails> {
		return new Promise<CacheDetails>((resolve, reject) => {
			this.http.get(`/api/refresh/cache/${name}/key/${hash}`).subscribe(resolve.bind(this));
		});
	}
}