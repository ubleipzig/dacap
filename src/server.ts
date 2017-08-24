import * as express from 'express';
import * as compression from 'compression';
import * as debugFactory from 'debug';
import * as path from 'path';
import * as cache from './cache';
import * as bodyparser from 'body-parser';

const debug = debugFactory('dacap:server');

export class Server {
	private register: cache.Register;
	private expressApp: express.Application;

	constructor(private storagePath: string,
		private proxyPath: string,
		private proxyUrl: string,
		private defaultTtl: number,
		private defaultCheckPeriod: number,
		private defaultArrayValueSize: number,
		private defaultObjectValueSize: number,
		private autosaveInterval: number,
		private registerName: string) {

		this._init();
	}

	private _init() {
		this.register = new cache.Register(this.storagePath, this.registerName);
		this.register.restore();
		setTimeout(this.register.save, this.autosaveInterval * 1000);

		this.expressApp = express();
		this.expressApp.get(/favicon.ico/, (req, res, next) => {
			res.send();
		});

		this.expressApp.use(compression());
		this.expressApp.use(bodyparser.json());

		this.expressApp.post('/api/add/cache/:name', (req, res, next) => {
			if (!req.body || !req.body.apiEndPoint) return res.status(400).send(`you need to specify at least an url`);
			if (this.register.has(req.body.name)) return res.send(`already registered endpoint "${req.params.name}"`);
			this.register.add(req.params.name, req.body.apiEndPoint, {
				stdTTL: req.body.cacheOptions.ttl || this.defaultTtl,
				checkperiod: req.body.cacheOptions.checkPeriod || this.defaultCheckPeriod,
				objectValueSize: req.body.cacheOptions.objectValueSize || this.defaultObjectValueSize,
				arrayValueSize: req.body.cacheOptions.arrayValueSize || this.defaultArrayValueSize
			});
			res.json(this.register.getInfo(this.proxyUrl + this.proxyPath, req.params.name));
		});

		this.expressApp.get('/api/list/cache', async (req, res, next) => {
			try {
				res.json(this.register.getInfo(this.proxyUrl + this.proxyPath));
			} catch (err) {
				next(err);
			}
		});

		this.expressApp.get('/api/delete/cache/:name', (req, res, next) => {
			try {
				this.register.delete(req.params.name);
				res.json({});
			} catch (err) {
				next(err);
			}
		})

		this.expressApp.get('/api/flush/cache/:name', (req, res, next) => {
			try {
				const cache = this.register.get(req.params.name)
				cache.flush();
				res.json(this.register.getInfo(this.proxyUrl + this.proxyPath, req.params.name));
			} catch (err) {
				next(err);
			}
		});

		this.expressApp.get('/api/delete/cache/:name/key/:hash', (req, res, next) => {
			try {
				const cache = this.register.get(req.params.name)
				cache.del(req.params.hash);
				res.json({});
			} catch (err) {
				next(err);
			}
		})

		this.expressApp.get('/api/refresh/cache/:name/key/:hash', async (req, res, next) => {
			try {
				const cache = this.register.get(req.params.name);
				const value = cache.getCache().get(req.params.hash);
				await cache.refresh(req.params.hash, value);
				res.json(cache.getDetails(req.params.hash));
			} catch (err) {
				next(err);
			}
		});

		this.expressApp.use('/admin/', express.static(path.resolve(__dirname, '..', 'public')));

		this.expressApp.use(this.proxyPath, cache.Middleware(this.register));
	}

	listen(port: number, cb) {
		return this.expressApp.listen(port, cb);
	}
}