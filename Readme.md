# dacap

[![pipeline status](https://git.sc.uni-leipzig.de/ubl/bdd_dev/dacap/badges/master/pipeline.svg)](https://git.sc.uni-leipzig.de/ubl/bdd_dev/dacap/commits/master)
[![coverage report](https://git.sc.uni-leipzig.de/ubl/bdd_dev/dacap/badges/master/coverage.svg)](https://git.sc.uni-leipzig.de/ubl/bdd_dev/dacap/commits/master)

The service *Dynamic And Compressing Api Proxy* can be used to handle as proxy for self-defined API-Endpoints. All cached responses will be kept in memory. Please calculate to provide enough memory therefor.

Use of service can be worth if you deal with slow api-endpoints in production environment.

## Requirements

* node >= v8.2.1
* npm >= v5.3.0

## local Execution

### Installation

```bash
$# npm install -g @ubleipzig/dacap
```
### Execution

``` bash
$# dacap
```

## as Container

```bash
$# docker run -p 3000:3000 -v /my/hosts/data/folder:/data ubleipzig/dacap
```

You can customize multiple values, see [Advanced Configuration]

## Usage

After starting the Admin-Interface the application is available at `http://localhost:3000/admin`.

First of all a *Cache* has to be defined where all requests of an API-Endpoint are stored. This is done at the Admin-Interface.

Fill in the *url* of the *API-Endpoint* (e.g. `http://foo.example.com/`) and a *Cache-Name* (e.g. `foo`).

All API-Requests which will usually go to:

`http://foo.example.com/?query=foo&offset=0&limit=10`

you can call by:

`http://localhost:3000/ep/foo/?query=foo&offset=0&limit=10`

* *Be sure to append the slash after the Cache-Name, otherwise the Endpoint cannot be resolved.*
* *Everything after the Cache-Name and Slash will be passed to the API-Endpoint.*

## Advanced Configuration

The service can be configured by environment variables. Following options are available:

* `data_dir`: Specifies the folder where the cache is stored in intervals. This is only used to make it more easy to restart the service without adding all Endpoints again. After restart the service reads the saved cache-file and keeps it in memory. By default this points to the `data`-folder where the process was invoked. Make sure it can be created if not existing and written if already existing.
* `proxy_path`: Specifies a path where endpoints will be accessable after registering. By default this is `/ep/`.
* `proxy_port`: Specifies a port number where the service is listening. Defaults to `3000`.
* `proxy_url`: Specifies an absolute url of the service with protocol and port if it differs from defaults (e.g. `https://api.example.com:8443/dacap`). Defaults to `http://localhost:${proxy_port}`.
* `cache_ttl`: Specifies a time-to-live in seconds of a cached request. After this the cache will be refreshed. Defaults to `600`
* `default_check_period`: Specifies the interval in seconds the cache is checked for expiry. Defaults to `60`
* `array_value_size`: Unknown configuration. Defaults to `40`
* `object_value_size`: Unknown configuration. Defaults to `80`
* `autosave_interval`: Specifies the interval the cache is stored to disk. Defaults to `60`.
* `register_name`: Specifies the name of register where the cache is stored. Defaults to `api-cache`.
* `strip_path`: Specifies if the path should be stripped processing requests. Defaults to `true`.
* `user`: Specifies an user for simple basic authentication. Defaults to `undefined`.
* `password`: Specifies a password for simple basic authentication. Defaults to `undefined`.

**Only if both `user` and `password` are specified basic-auth is enabled**

## Documentation

Docs was created with [mkdocs] and published to [Github Pages]

[Advanced Configuration]: #advanced-configuration
[mkdocs]: https://www.mkdocs.org/
[Github Pages]: https://ubleipzig.github.io/dacap/