"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const https = require("https");
const Q = require("q");
class Endpoint {
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
    }
    setEndpoint(serverUrl) {
        this.serverUrl = serverUrl;
    }
    toObject() {
        return { serverUrl: this.serverUrl };
    }
    fromObject(data) {
        this.setEndpoint(data.serverUrl);
    }
    request(uriPath, value) {
        const deferred = Q.defer();
        const req = https.request(this.serverUrl + uriPath, (res) => {
            value.contentType = res.headers['content-type'];
            res.on('data', (chunk) => {
                value.data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode !== 200)
                    return deferred.reject(new Error(`No status 200. not caching the result`));
                deferred.resolve();
            });
        });
        req.on('error', (err) => {
            console.error(err);
            deferred.reject(err);
        });
        req.end();
        return deferred.promise;
    }
}
exports.Endpoint = Endpoint;
//# sourceMappingURL=endpoint.js.map