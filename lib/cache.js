"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const debugFactory = require("debug");
const NodeCache = require("node-cache");
const crypto = require("crypto");
const endpoint_1 = require("./endpoint");
const debug = debugFactory('decap:cache');
var Register;
(function (Register) {
    const cacheRegister = {};
    Register.getByName = (name) => {
        if (!cacheRegister[name])
            throw new Error(`no endpoint registered for "${name}"`);
        return cacheRegister[name];
    };
    Register.register = (name, serverUrl) => {
        const endpoint = new endpoint_1.Endpoint(serverUrl);
        const nodeCache = new NodeCache();
        cacheRegister[name] = new Cache(endpoint, nodeCache);
    };
})(Register = exports.Register || (exports.Register = {}));
class Cache {
    constructor(endpoint, realCache) {
        this.endpoint = endpoint;
        this.realCache = realCache;
    }
    get(hash, path) {
        return __awaiter(this, void 0, void 0, function* () {
            let value = this.realCache.get(hash);
            if (value == undefined) {
                debug(`no cache hit. fetching ${path}`);
                value = {
                    contentType: '',
                    data: ''
                };
                try {
                    yield this.endpoint.request(path, value);
                    this.realCache.set(hash, value);
                }
                catch (err) {
                    console.error(err);
                }
            }
            return value;
        });
    }
}
exports.Cache = Cache;
function Middleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const pattern = new RegExp('^/([^/]+)(.*)$');
        const match = req.url.match(pattern);
        try {
            const cache = Register.getByName(match[1]);
            const uniQueryString = Object.keys(req.query).sort().map(function (key) { return `${key}=${req.query[key]}`; }).join('&');
            const hash = crypto.createHash('sha1').update(req.path + uniQueryString).digest('base64');
            const value = yield cache.get(hash, match[2]);
            res.setHeader('content-type', value.contentType);
            res.send(value.data);
        }
        catch (err) {
            next(err);
        }
    });
}
exports.Middleware = Middleware;
//# sourceMappingURL=cache.js.map