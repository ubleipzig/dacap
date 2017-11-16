import * as express from 'express';
import * as compression from 'compression';
import * as debugFactory from 'debug';
import * as path from 'path';
import * as bodyparser from 'body-parser';
import * as cors from 'cors';
import * as url from 'url';
import * as PrettyPrint from 'js-object-pretty-print';

import { Register } from './register';
import { Middleware } from './middleware';

const debug = debugFactory('dacap:server');

export class Server {
	private register: Register;
	private expressApp: express.Application;
	private corsOptions: cors.CorsOptions;
	private prePath: string = '';

	constructor(private config: {
		storagePath: string,
		proxyPath: string,
		proxyUrl: string,
		defaultTtl: number,
		defaultCheckPeriod: number,
		defaultArrayValueSize: number,
		defaultObjectValueSize: number,
		autosaveInterval: number,
		registerName: string,
		stripPath: boolean
	}) {

		debug(`starting up with this config: ` + PrettyPrint.pretty(this.config));

		if (this.config.stripPath === false) {
			this.prePath = url.parse(this.config.proxyUrl).path;
		}
		this.expressApp = express();

		this.initRegister();
		this.initMiddlewares();
		this.initRoutes();
	}

	private initRegister() {
		this.register = new Register(this.config.storagePath, this.config.registerName);
		this.register.restore();
		this.register.save(this.config.autosaveInterval * 1000);
	}

	private initMiddlewares() {
		this.corsOptions = {
			origin: (origin, callback) => {
				callback(null, true);
			},
			optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
		}
		// globally allow all origins
		this.expressApp.use(cors(this.corsOptions))

		this.expressApp.use(compression());
		this.expressApp.use(bodyparser.json());
	}

	private initRoutes() {
		this.expressApp.get(/favicon.ico/, (req, res, next) => {
			res.send();
		});

		this.expressApp.get(this.prePath + '/admin/api/config', (req, res, next) => {
			return res.json(this.config);
		});

		this.expressApp.post(this.prePath + '/admin/api/add/cache/:name', (req, res, next) => {
			if (!req.body || !req.body.apiEndPoint) return res.status(400).send(`you need to specify at least an url`);
			if (this.register.has(req.body.name)) return res.send(`already registered endpoint "${req.params.name}"`);
			this.register.add(req.params.name, req.body.apiEndPoint, {
				stdTTL: req.body.cacheOptions.ttl || this.config.defaultTtl,
				checkperiod: req.body.cacheOptions.checkPeriod || this.config.defaultCheckPeriod,
				objectValueSize: req.body.cacheOptions.objectValueSize || this.config.defaultObjectValueSize,
				arrayValueSize: req.body.cacheOptions.arrayValueSize || this.config.defaultArrayValueSize
			});
			res.json(this.register.getInfo(req.params.name));
		});

		this.expressApp.get(this.prePath + '/admin/api/list/cache', async (req, res, next) => {
			try {
				res.json(this.register.getInfo());
			} catch (err) {
				next(err);
			}
		});

		this.expressApp.get(this.prePath + '/admin/api/delete/cache/:name', (req, res, next) => {
			try {
				this.register.delete(req.params.name);
				res.json({});
			} catch (err) {
				next(err);
			}
		})

		this.expressApp.get(this.prePath + '/admin/api/flush/cache/:name', (req, res, next) => {
			try {
				const cache = this.register.get(req.params.name)
				cache.flush();
				res.json(this.register.getInfo(req.params.name));
			} catch (err) {
				next(err);
			}
		});

		this.expressApp.get(this.prePath + '/admin/api/delete/cache/:name/key/:hash', (req, res, next) => {
			try {
				const cache = this.register.get(req.params.name)
				cache.del(req.params.hash);
				res.json({});
			} catch (err) {
				next(err);
			}
		})

		this.expressApp.get(this.prePath + '/admin/api/refresh/cache/:name/key/:hash', async (req, res, next) => {
			try {
				const cache = this.register.get(req.params.name);
				const value = cache.getCache().get(req.params.hash);
				await cache.refresh(req.params.hash, value);
				res.json(cache.getDetails(req.params.hash));
			} catch (err) {
				next(err);
			}
		});

		if (process.env.NODE_ENV === 'development') {
			let webpack = require('webpack');
			let WebpackDevMiddleware = require('webpack-dev-middleware');
			let webpackConfig = require('../webpack.dev');
			this.expressApp.use(WebpackDevMiddleware(webpack(webpackConfig), {
				publicPath: `${this.prePath}/admin/`
			}));
		} else {
			this.expressApp.use(`${this.prePath}/admin/`, express.static(path.resolve(__dirname, '..', 'public')));
		}

		this.expressApp.use(this.prePath + this.config.proxyPath, Middleware(this.register));
	}

	listen(port: number, cb) {
		this.expressApp.listen(port, cb);
	}
}