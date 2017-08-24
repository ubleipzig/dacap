import {Register, Cache, Middleware} from '../src/cache';
import * as path from 'path';
import 'should';

describe('register', () => {
	it('should create an instance', (done) => {
		new Register(path.resolve(__dirname, '..', '.tmp'), 'foobar');
		done();
	})
});
describe('cache', () => {
	it('should create an instance', (done) => {
		new Cache();
		done();
	});
})