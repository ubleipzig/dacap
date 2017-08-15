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

app.use(compression());

app.get('/admin/add/:registerName', (req, res, next) => {
	if (!req.query.url) return res.status(400).send(`you need to specify an url (e.g. ${req.url}?url=http://example.com)`);
	register.add(req.params.registerName, req.query.url);
	res.send(`added ${req.params.registerName} with URL "${req.query.url}"`)
});

app.get('/admin/list/register/:registerName', (req, res, next) => {

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