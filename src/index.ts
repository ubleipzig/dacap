import * as express from 'express';
import * as compression from 'compression';
import * as debugFactory from 'debug';
import * as path from 'path';
// import endpointFactory from './endpoint';
import * as cache from './cache';

const debug = debugFactory('decap:index');
const app = express();
const storagePath = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');

const register = new cache.Register(storagePath, 'apis');

register.restore();

app.get(/favicon.ico/, (req, res, next) => {
	res.send();
});

app.use(compression());

app.get('/admin/register/add/:registerName/:ttl?', (req, res, next) => {
	if (!req.query.url) return res.status(400).send(`you need to specify an url (e.g. ${req.url}?url=http://example.com)`);
	if (register.has(req.params.registerName)) return res.send(`already registered endpoint "${req.params.registerName}"`);
	register.add(req.params.registerName, req.query.url, req.params.ttl || 10);
	res.send(`added ${req.params.registerName} with URL "${req.query.url}"`)
});

app.get('/admin/register/list/:registerName', (req, res, next) => {

})

app.use(cache.Middleware(register));

const server = app.listen(3000, () => {
	debug('server up and running');
});
process.stdin.resume();

process.on('SIGTERM', () => {
	register.save();
	process.exit();
});