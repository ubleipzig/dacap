"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const compression = require("compression");
const debugFactory = require("debug");
const path = require("path");
// import endpointFactory from './endpoint';
const cache = require("./cache");
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
//# sourceMappingURL=index.js.map