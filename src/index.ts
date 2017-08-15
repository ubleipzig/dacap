import * as express from 'express';
import * as compression from 'compression';
import * as debugFactory from 'debug';
import * as https from 'https';
import * as NodeCache from 'node-cache';
import * as Url from 'url';
import * as crypto from 'crypto';
import * as stream from 'stream';
import * as Q from 'q';
// import endpointFactory from './endpoint';
import * as cache from './cache';

const debug = debugFactory('decap:index');


// import cacheInterface from './cache';
// import adminInterface from './admin';

const app = express();

app.use(compression());

// restore from persistent memory after startup
// app.get('/admin', adminInterface);
// app.get('*', apicacheInterface)

cache.Register.register('amsl', 'https://live.amsl.technology/inhouseservices/');

app.use(cache.Middleware);

const server = app.listen(3000, () => {
	debug('server up and running');
});

server.on('close', () => {
	debug('closing');
})