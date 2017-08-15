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
app.use(cache.Middleware(register));

const server = app.listen(3000, () => {
	debug('server up and running');
});

app.get('/admin/add/:registerName', (req, res, next) => {

});

process.stdin.resume();

process.on('SIGTERM', () => {
	register.save();
	process.exit();
});