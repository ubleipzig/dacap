import * as express from 'express';
import * as compression from 'compression';
import * as debugFactory from 'debug';
import * as path from 'path';
import * as cache from './cache';
import * as bodyparser from 'body-parser';

const debug = debugFactory('dacap:index');
const app = express();
const storagePath = process.env.data_dir || path.resolve(process.cwd(), 'data');
const proxyPath = process.env.proxy_path || '/ep/';
const proxyPort = process.env.proxy_port || 3000;
const proxyUrl = process.env.proxy_url || `http://localhost:${proxyPort}${proxyPath}`;
const defaultTtl = process.env.cache_ttl || 600;
const defaultCheckPeriod = process.env.default_check_period || 60;
const defaultArrayValueSize = process.env.array_value_size || 40;
const defaultObjectValueSize = process.env.object_value_size || 80;
const autosaveInterval = process.env.autosave_interval || 60;

const register = new cache.Register(storagePath, 'apis');

register.restore();

app.get(/favicon.ico/, (req, res, next) => {
	res.send();
});

app.use(compression());
app.use(bodyparser.json());

app.post('/api/add/cache/:name', (req, res, next) => {
	if (!req.body || !req.body.apiEndPoint) return res.status(400).send(`you need to specify at least an url`);
	if (register.has(req.body.name)) return res.send(`already registered endpoint "${req.params.name}"`);
	register.add(req.params.name, req.body.apiEndPoint, {
		stdTTL: req.body.cacheOptions.ttl || defaultTtl,
		checkperiod: req.body.cacheOptions.checkPeriod || defaultCheckPeriod,
		objectValueSize: req.body.cacheOptions.objectValueSize || defaultObjectValueSize,
		arrayValueSize: req.body.cacheOptions.arrayValueSize || defaultArrayValueSize
	});
	res.json(register.getInfo(proxyUrl, req.params.name));
});

app.get('/api/list/cache', async (req, res, next) => {
	try {
		res.json(register.getInfo(proxyUrl));
	} catch(err) {
		next(err);
	}
});

app.get('/api/delete/cache/:name', (req, res, next) => {
	try {
		register.delete(req.params.name);
		res.json({});
	} catch (err) {
		next(err);
	}
})

app.get('/api/flush/cache/:name', (req, res, next) => {
	try {
		const cache = register.get(req.params.name)
		cache.flush();
		res.json(register.getInfo(proxyUrl, req.params.name));
	} catch(err) {
		next(err);
	}
});

app.get('/api/delete/cache/:name/key/:hash', (req, res, next) => {
	try {
		const cache = register.get(req.params.name)
		cache.del(req.params.hash);
		res.json({});
	} catch(err) {
		next(err);
	}
})

app.get('/api/refresh/cache/:name/key/:hash', async (req, res, next) => {
	try {
		const cache = register.get(req.params.name);
		const value = cache.getCache().get(req.params.hash);
		await cache.refresh(req.params.hash, value);
		res.json(cache.getDetails(req.params.hash));
	} catch(err) {
		next(err);
	}
});

app.use('/admin/', express.static(path.resolve(__dirname,'..', 'public')));

app.use(proxyPath, cache.Middleware(register));

const server = app.listen(proxyPort, () => {
	debug('server up and running');
});
process.stdin.resume();

setTimeout(register.save, autosaveInterval);

process.on('SIGTERM', () => {
	register.save();
	process.exit();
});