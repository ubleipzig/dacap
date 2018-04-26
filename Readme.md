# dacap

*Dynamic And Compressing Api Proxy* is a service which lets you proxy arbitrary API-Endpoints which are by themself to slow to be used in production environments. All cached Responses are held in memory, so be sure to provide enough.

[![pipeline status](https://git.sc.uni-leipzig.de/ubl/bdd_dev/dacap/badges/master/pipeline.svg)](https://git.sc.uni-leipzig.de/ubl/bdd_dev/dacap/commits/master)
[![coverage report](https://git.sc.uni-leipzig.de/ubl/bdd_dev/dacap/badges/master/coverage.svg)](https://git.sc.uni-leipzig.de/ubl/bdd_dev/dacap/commits/master)

## Requirements

* node >= v8.2.1
* npm >= v5.3.0

## local Execution

### Installation

```bash
$# npm install -g dacap
```
### Execution

``` bash
$# dacap
```

## as Container

```bash
$# docker run -p 3000:3000 -v /my/hosts/data/folder:/data ubleipzig/dacap
```

You can customize multiple values, see [Advanced Configuration](#Advanced Configuration)

## Usage

After Start the Admin-Interface is available under `http://localhost:3000/admin`.

First of all one has to define a *Cache* where the requests to an API-Endpoint are stored. This is done from within the Admin Interface.

One has to define the URL to the desired *API-Endpoint* (e.g. `http://foo.example.com/`) and a *Cache-Name* for this API-Endpoint (e.g. `foo`).

All API-Requests which normally would go to

`http://foo.example.com/?query=foo&offset=0&limit=10`

now you can request by accessing

`http://localhost:3000/ep/foo/?query=foo&offset=0&limit=10`

* *Be sure to append the Slash after the Cache-Name, otherwise the Endpoint cannot be resolved.*
* *Everything after the Cache-Name and Slash will be passed to the API-Endpoint.*

## Advanced Configuration

The service can be configured by environment variables. The following are available:

* `data_dir`: Specifies the folder where the cache is stored in intervals. This is only used to
 make it more easy to restart the service without adding all Endpoints again. After restart the
 service reads the saved cache-file and keeps it in memory.
 By default this points to the `data`-folder where the process was invoked. Make sure it can be created if not existing and written if already existing.
* `proxy_path`: Specifies the path where the Endpoints will be accessable after registering. By default this is `/ep/`.
* `proxy_port`: Specifies the port number where the service is listening. Defaults to `3000`.
* `proxy_url`: Specifies the absolute url of the service with protocol and port if differing from the defaults
(e.g. `https://api.example.com:8443/dacap`). Defaults to `http://localhost:${proxy_port}`.
* `cache_ttl`: Specifies the time-to-live in seconds of a cached request. after this time the cache will be refreshed. Defaults to `600`
* `default_check_period`: Specifies the interval in seconds the cache is checked for expiry. Defaults to `60`
* `array_value_size`: Unkown configuration. Defaults to `40`
* `object_value_size`: Unkown configuration. Defaults to `80`
* `autosave_interval`: Specifies the interval the cache is stored to harddisk. Defaults to `60`.
* `register_name`: Specifies the name of the register where the cache is stored. Defaults to `api-cache`.
* `strip_path`: Specifies whether the path should be stripped when processing requests. Defaults to `true`.
* `user`: Specifies the user for simple basic authentication. Defaults to `undefined`.
* `password`: Specifies the password for simple basic authentication. Defaults to `undefined`.

**Only when both `user` and `password` are specified basic-auth is enabled**