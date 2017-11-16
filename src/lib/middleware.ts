import * as express from 'express';
import * as crypto from 'crypto';
import { Register } from './register';
import * as debugFactory from 'debug';

const debug = debugFactory('dacap:middleware');

export interface MiddlewareFunction {
	(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void>
}

export function Middleware(register: Register): MiddlewareFunction {

	return async function (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		const pattern = new RegExp('^/([^/]+)/?(.*)$');
		const match = req.url.match(pattern);
		try {
			const cache = register.get(match[1]);
			const uniQueryString = Object.keys(req.query).sort().map(function (key) { return `${key}=${req.query[key]}` }).join('&');
			const hash = crypto.createHash('sha1').update(req.path + uniQueryString).digest('hex');
			debug(`finding cache-entry for ${hash}`);
			const value = await cache.get(hash, match[2]);
			res.setHeader('content-type', value.contentType)
			res.send(value.data);
		} catch (err) {
			res.status(404).send(err.message);
		}
	}
}
