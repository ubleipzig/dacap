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
const fs = require("fs");
const path = require("path");
const endpoint_1 = require("./endpoint");
const debug = debugFactory('decap:cache');
class Register {
    constructor(storage, name) {
        this.storage = storage;
        this.name = name;
        this.cacheRegister = {};
        this.get = (name) => {
            if (!this.cacheRegister[name])
                throw new Error(`no endpoint registered for "${name}"`);
            return this.cacheRegister[name];
        };
        this.add = (name, serverUrl) => {
            const endpoint = new endpoint_1.Endpoint(serverUrl);
            const nodeCache = new NodeCache();
            this.cacheRegister[name] = new Cache();
            this.cacheRegister[name].setCache(nodeCache).setEndpoint(endpoint);
        };
        this.save = () => {
            const data = Object.keys(this.cacheRegister).map((name) => {
                return {
                    name: name,
                    data: this.cacheRegister[name].toObject()
                };
            });
            fs.writeFileSync(path.resolve(this.storage, this.name), JSON.stringify(data), { encoding: 'utf8', flag: 'w' });
            debug(`register "${this.name}" saved to "${this.storage}"`);
        };
        this.restore = () => __awaiter(this, void 0, void 0, function* () {
            const data = JSON.parse(fs.readFileSync(path.resolve(this.storage, this.name), { encoding: 'utf8' }));
            data.map((cache) => {
                this.cacheRegister[cache.name] = new Cache();
                this.cacheRegister[cache.name].fromObject(cache.data);
            });
            debug(`register "${this.name}" restored from "${this.storage}"`);
        });
        fs.existsSync(storage) || fs.mkdirSync(storage);
    }
}
exports.Register = Register;
class Cache {
    constructor(endpoint, realCache) {
        this.endpoint = endpoint;
        this.realCache = realCache;
    }
    setEndpoint(endpoint) {
        this.endpoint = endpoint;
        return this;
    }
    setCache(realCache) {
        this.realCache = realCache;
        return this;
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
    toObject() {
        const data = {
            endPoint: this.endpoint.toObject(),
            cache: []
        };
        this.realCache.keys().map((hash) => {
            data.cache.push({
                hash: hash,
                data: this.realCache.get(hash)
            });
        });
        return data;
    }
    fromObject(data) {
        const endpoint = new endpoint_1.Endpoint();
        const realCache = new NodeCache();
        endpoint.fromObject(data.endPoint);
        this.setEndpoint(endpoint);
        data.cache.map((item) => {
            realCache.set(item.hash, item.data);
        });
        this.setCache(realCache);
    }
}
exports.Cache = Cache;
function Middleware(register) {
    return function (req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const pattern = new RegExp('^/([^/]+)(.*)$');
            const match = req.url.match(pattern);
            try {
                const cache = register.get(match[1]);
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
    };
}
exports.Middleware = Middleware;
//# sourceMappingURL=cache.js.map