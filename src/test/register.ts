/// <reference types="mocha" />

import { Register } from '../lib/register';
import * as should from 'should';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import * as path from 'path';

const tmpPath = '.dacap-tmp';

describe('Register', () => {
	describe('instantiate', () => {
		describe('with valid folder', () => {
			afterEach(() => {
				rimraf.sync(tmpPath);
			});

			it('should perform successfully', () => {
				let register = new Register(`${tmpPath}/`, 'foo');
				should(register).instanceof(Register);
			});

			it('even without trailing slash', () => {
				let register = new Register(tmpPath, 'foo');
				should(register).instanceof(Register);
			});
		});

		describe('with invalid folder name', () => {
			it('should throw an exception', () => {
				should(() => {
					let register = new Register('', 'foo');
				}).throw(/NOENT/);
			});
		});

		describe('with insufficient permissions', () => {
			it('should throw an exception', () => {
				should(() => {
					let register = new Register('/root/.tmp', 'foo');
				}).throw(/EACCES/);
			});
		});
	});

	describe('has', () => {
		let register: Register;
		beforeEach(() => {
			register = new Register(tmpPath, 'foo');
			register.add('validCache', 'http://example.com/', {});
		});

		describe('existing cache', () => {
			it('should return true', () => {
				should(register.has('validCache')).eql(true);
			});
		});

		describe('existing cache', () => {
			it('should return false', () => {
				should(register.has('invalidCache')).eql(false);
			});
		});
	});

	describe('get', () => {
		let register: Register;
		beforeEach(() => {
			register = new Register(tmpPath, 'foo');
			register.add('validCache', 'http://example.com/', {});
		});

		afterEach(() => {
			rimraf.sync(tmpPath)
		});

		describe('existing cache', () => {
			it('should be an instance of Cache', () => {
				let validCache = register.get('validCache');
				should(validCache).not.undefined;
			});
		});

		describe('non-existing cache', () => {
			it('should throw an error', () => {
				should(() => {
					let validCache = register.get('invalidCache');
				}).throw('register not found: invalidCache');
			});
		});
	});

	describe('add', () => {
		let register: Register;
		beforeEach(() => {
			register = new Register(tmpPath, 'foo');
		});

		afterEach(() => {
			rimraf.sync(tmpPath)
		});

		describe('new cache', () => {
			beforeEach(() => {
				register.add('newCache', 'http://example.com/', {});
			});
			it('should have added a new cache', () => {
				should(register.get('newCache')).not.be.undefined;
			});
		});
	});

	describe('delete', () => {
		let register: Register;
		beforeEach(() => {
			register = new Register(tmpPath, 'foo');
			register.add('validCache', 'http://example.com/', {});
		});

		afterEach(() => {
			rimraf.sync(tmpPath)
		});

		describe('existing cache', () => {
			beforeEach(() => {
				register.delete('validCache');
			});
			it('should have removed existing cache', () => {
				should(register.cacheRegister['newCache']).eql(undefined);
			});
		});

		describe('non-existing cache', () => {
			it('should throw an error', () => {
				should(() => {
					register.delete('nonExistingCache');
				}).throw('register not found: nonExistingCache');
			});
		});
	});

	describe('getInfo', () => {
		let register: Register;
		beforeEach(() => {
			register = new Register(tmpPath, 'foo');
			register.add('newCache', 'http://example.com/', {});
		});

		describe('without passing cache name', () => {
			it('should return list of CacheInfo objects', () => {
				let cacheInfoList = register.getInfo();
				should(cacheInfoList).be.an.Array();
				should(cacheInfoList[0]).have.keys('name', 'apiEndPoint', 'cacheOptions', 'cacheStats', 'cache');
			});
		});

		describe('with passing cache name', () => {
			it('should return a CacheInfo object', () => {
				let cacheInfo = register.getInfo('newCache');
				should(cacheInfo).have.keys('name', 'apiEndPoint', 'cacheOptions', 'cacheStats', 'cache');
			});
		});
	});

	describe('toObject', () => {
		let register: Register;
		beforeEach(() => {
			register = new Register(tmpPath, 'foo');
			register.add('newCache', 'http://example.com/', {});
		});

		describe('existing register', () => {
			let serializedCache;
			beforeEach(() => {
				serializedCache = register.toObject();
			});

			it('should serialize the register', () => {
				should(serializedCache).be.an.Array();
				should(serializedCache[0]).containDeep({
					name: "newCache",
					data: {
						endPoint: 'http://example.com/',
						cache: []
					}
				});

			});
		});
	});
	describe('save', () => {
		let register: Register;

		afterEach(() => {
			rimraf.sync(tmpPath);
		});

		describe('with sufficient permissions', () => {
			beforeEach(() => {
				register = new Register(tmpPath, 'foo');
				register.add('newCache', 'http://example.com/', {});
			});

			describe('once', () => {
				it('should create a save file', () => {
					register.save();
					should(() => {
						fs.statSync(path.resolve(tmpPath, 'foo'))
					}).not.throw(Error);
				});
			});

			describe('with interval', () => {
				let filesize1, filesize2;

				it('should increase file size', (done) => {
					register.save(100);
					filesize1 = fs.statSync(path.resolve(tmpPath, 'foo')).size
					register.add('moreCache', 'https://api.example.com/', {});
					setTimeout(() => {
						should(() => {
							filesize2 = fs.statSync(path.resolve(tmpPath, 'foo')).size
						}).not.throw(Error)
						should(filesize2).above(filesize1);
						register.add('evenMoreCache', 'https://anotherapi.example.com/', {});
						filesize1 = filesize2;
					}, 150);
					setTimeout(() => {
						should(() => {
							filesize2 = fs.statSync(path.resolve(tmpPath, 'foo')).size
						}).not.throw(Error)
						should(filesize2).above(filesize1);
						done();
					}, 250);
				});
			});

			describe('remove interval', () => {
				let filesize1, filesize2;

				it('should stop saving file', () => {
					register.save(100);
					filesize1 = fs.statSync(path.resolve(tmpPath, 'foo')).size
					register.save();
					register.add('moreCache', 'https://api.example.com/', {});

					setTimeout(() => {
						should(() => {
							filesize2 = fs.statSync(path.resolve(tmpPath, 'foo')).size
						}).not.throw(Error)
						should(filesize2).equal(filesize1);
					}, 150);
				});
			});
		});

		describe('with insufficient permissions', () => {
			beforeEach(() => {
				register = new Register('/root', 'foo');
				register.add('newCache', 'http://example.com/', {});
			});

			describe('once', () => {
				it('should throw an error', () => {
					should(() => {
						register.save();
					}).throw(/EACCES/);
				});
			});
		});
	});

	describe('restore', () => {
		describe('existing file', () => {
			beforeEach(() => {
				let register = new Register(tmpPath, 'foo');
				register.add('newCache', 'http://example.com/', {});
				let Cache = register.get('newCache').getCache();
				Cache.set('validHash', {
					uriPath: '/foo/bar',
					contentType: 'x-mostly/garbage',
					data: 'validData'
				});
				register.save();
			});

			afterEach(() => {
				rimraf.sync(tmpPath);
			});

			it('should restore the register', (done) => {
				let register = new Register(tmpPath, 'foo');
				register.restore().then(() => {
					should(register.has('newCache')).be.true;
					should(register.getInfo('newCache').apiEndPoint).eql('http://example.com/');
					should(register.get('newCache').getCache().get('validHash')).containEql({
						uriPath: '/foo/bar',
						contentType: 'x-mostly/garbage',
						data: 'validData'
					});
					done();
				}).catch(done);
			});
		});
		describe('non-existing file', () => {
			it('should reject promise', (done) => {
				let register = new Register(tmpPath, 'foo');
				register.restore().then(() => {
					done('promise was resolved')
				}).catch(() => {
					done();
				})
			});
		});
	});
});