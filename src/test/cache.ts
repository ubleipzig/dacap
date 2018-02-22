/// <reference types="mocha" />

import { Cache } from '../lib/cache';
import { Endpoint } from '../lib/endpoint';
import * as NodeCache from 'node-cache';
import * as should from 'should';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import * as path from 'path';
import * as nock from 'nock';

const tmpPath = '.dacap-tmp';

describe('Cache', () => {
	describe('instantiate empty', () => {
		it('should be an instance of Cache', () => {
			let cache = new Cache();
			should(cache).be.instanceof(Cache);
		});
	});

	describe('instantiate with endpoint and node-cache', () => {
		it('should be an instance of Cache', () => {
			let endpoint = new Endpoint();
			let nodeCache = new NodeCache();
			let cache = new Cache(endpoint, nodeCache);
			should(cache).be.instanceof(Cache);
		});
	});

	describe('setEndpoint', () => {
		it('should set endpoint', () => {
			let endpoint = new Endpoint()
			let cache = new Cache();
			should(cache.setEndpoint(endpoint)).be.instanceof(Cache);
		});
	});

	describe('getEndpoint', () => {
		let cache;
		beforeEach(() => {
			cache = new Cache(new Endpoint());
		});

		it('should get endpoint', () => {
			should(cache.getEndpoint()).be.instanceof(Endpoint);
		});
	});

	describe('setCache', () => {
		let cache;
		beforeEach(() => {
			cache = new Cache();
		});

		it('should set cache', () => {
			should(cache.setCache(new NodeCache())).be.instanceof(Cache);
		})
	});

	describe('getCache', () => {
		let cache;
		beforeEach(() => {
			cache = new Cache(null, new NodeCache());
		});

		it('should get cache', () => {
			should(cache.getCache()).be.instanceof(NodeCache);
		});
	});

	describe('flush', () => {
		let cache, nodeCache = new NodeCache();
		beforeEach(() => {
			cache = new Cache(null, nodeCache);
			nodeCache.set('validHash', 'validData');
			nodeCache.set('anotherValidHash', 'anotherValidData');
		});

		it('should remove all values', () => {
			cache.flush();
			should(nodeCache.get('validHash')).be.undefined;
			should(nodeCache.get('anotherValidHash')).be.undefined;
		});
	});

	describe('delete', () => {
		let cache, nodeCache = new NodeCache();
		beforeEach(() => {
			cache = new Cache(null, nodeCache);
			nodeCache.set('validHash', 'validData');
			nodeCache.set('anotherValidHash', 'anotherValidData');
		});

		it('should remove onnly one value', () => {
			cache.del('validHash');
			should(nodeCache.get('validHash')).be.undefined;
			should(nodeCache.get('anotherValidHash')).eql('anotherValidData');
		});
	});

	describe('get', () => {
		describe('root element', () => {
			let cache;
			beforeEach(() => {
				nock('https://api.example.com').get('/').reply(200, {
					"validKey": "validData"
				});

				cache = new Cache(new Endpoint('https://api.example.com'), new NodeCache);
			});

			it('should return the json', (done) => {
				cache.get('newHash', '').then((value) => {
					should(value).eql({
						uriPath: '',
						contentType: 'application/json',
						data: JSON.stringify({ "validKey": "validData" }),
					});
					done();
				}).catch(done);
			});
			it('should return 404', (done) => {
				cache.get('newHash', 'foo').then((value) => {
					should(value).eql({
						uriPath: 'foo',
						contentType: '',
						data: '',
					});
					done();
				}).catch(done);
			});
		});
		describe('root element with params', () => {
			let cache;
			beforeEach(() => {
				nock('https://api.example.com').get('/?foo=bar').reply(200, {
					"validKey": "validData"
				});

				cache = new Cache(new Endpoint('https://api.example.com'), new NodeCache);
			});

			it('should return the json', (done) => {
				cache.get('newHash', '?foo=bar').then((value) => {
					should(value).eql({
						uriPath: '?foo=bar',
						contentType: 'application/json',
						data: JSON.stringify({ "validKey": "validData" }),
					});
					done();
				}).catch(done);
			});
			it('should return 404', (done) => {
				cache.get('newHash', 'foo').then((value) => {
					should(value).eql({
						uriPath: 'foo',
						contentType: '',
						data: '',
					});
					done();
				}).catch(done);
			});
		});

		describe('relative path', () => {
			let cache;
			beforeEach(() => {
				nock('https://api.example.com').get('/foo').reply(200, {
					"validKey": "validData"
				});

				cache = new Cache(new Endpoint('https://api.example.com/foo'), new NodeCache);
			});

			it('should return the json', (done) => {
				cache.get('newHash', '').then((value) => {
					should(value).eql({
						uriPath: '',
						contentType: 'application/json',
						data: JSON.stringify({ "validKey": "validData" }),
					});
					done();
				}).catch(done);
			});
			it('should return 404', (done) => {
				cache.get('newHash', '?foo=bar').then((value) => {
					should(value).eql({
						uriPath: '?foo=bar',
						contentType: '',
						data: '',
					});
					done();
				}).catch(done);
			});
		});

		describe('relative path with params', () => {
			let cache;
			beforeEach(() => {
				nock('https://api.example.com').get('/foo?bar=baz').reply(200, {
					"validKey": "validData"
				});

				cache = new Cache(new Endpoint('https://api.example.com/foo'), new NodeCache);
			});

			it('should return the json', (done) => {
				cache.get('newHash', '?bar=baz').then((value) => {
					should(value).eql({
						uriPath: '?bar=baz',
						contentType: 'application/json',
						data: JSON.stringify({ "validKey": "validData" }),
					});
					done();
				}).catch(done);
			});
			it('should return 404', (done) => {
				cache.get('newHash', 'bar/baz').then((value) => {
					should(value).eql({
						uriPath: 'bar/baz',
						contentType: '',
						data: '',
					});
					done();
				}).catch(done);
			});
		});

		describe('relative path with subpath', () => {
			let cache;
			beforeEach(() => {
				nock('https://api.example.com').get('/foo/bar/baz').reply(200, {
					"validKey": "validData"
				});

				cache = new Cache(new Endpoint('https://api.example.com/foo'), new NodeCache);
			});

			it('should return the json', (done) => {
				cache.get('newHash', '/bar/baz').then((value) => {
					should(value).eql({
						uriPath: '/bar/baz',
						contentType: 'application/json',
						data: JSON.stringify({ "validKey": "validData" }),
					});
					done();
				}).catch(done);
			});
			it('should return 404', (done) => {
				cache.get('newHash', '/bar=baz').then((value) => {
					should(value).eql({
						uriPath: '/bar=baz',
						contentType: '',
						data: '',
					});
					done();
				}).catch(done);
			});
		});

	});
});