"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const compression = require("compression");
const debugFactory = require("debug");
// import endpointFactory from './endpoint';
const cache = require("./cache");
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
});
//# sourceMappingURL=index.js.map