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

After starting the Admin-Interface the application is available at `http://localhost:3000/admin/`.

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
* `proxy_path`: Specifies a path where endpoints will be accessable after registering. By default this is `ep/`. **Because it is relative to the `proxy_url` you must not start with a slash.**
* `proxy_port`: Specifies a port number where the service is listening. Defaults to `3000`.
* `proxy_url`: Specifies an absolute url of the service with protocol and port if it differs from defaults (e.g. `https://api.example.com:8443/dacap/`). Defaults to `http://localhost:${proxy_port}/`. **Remember to always add a trailing slash.**
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

## CI / CD

The CI/CD process is accomplished by gitlab at https://git.sc.uni-leipzig.de/. To build, test, publish and deploy the application the following stages are performed:

### prepare

this stage prepares the application by installing all dependencies and building all js-files from typescript.

#### npm_install
This job is performed on an official node-image, by time of writing [node:10-alpine]. This job is done on all git references.

### test

#### npm_ci
This job performes all automated tests that exist for the application. This job is performed on an official node-image, by time of writing [node]:10-alpine. This job is done on all git references.

### bundle_npm

This stage build the npm-package which is going to be published later.

#### npm_pack

This job performes the packaging of the npm-package and provides an `artifact.zip` containing the package as `tgz`-file.
This job is performed on an official node-image, by time of writing [node]:10-alpine. This job is done on all git references.

### build_image

This stage builds the docker image.

#### build_image

This job builds the Image and is providing an `artifact.zip` containing the saved image as file `image.tar.gz`. This job is performed with the official docker-image [docker]:latest and a service-image [docker]:dind.

This Job depends on *npm_pack* and the resulting artifact containing the npm-package.

### publish

This stage takes care of all publishing jobs

#### npm_publish

This job publishes the npm-package created by *npm_pack* and is therefore depending on it. This job is performed on an official node-image, by time of writing [node]:10-alpine.

This job is done only on tags named beginning with `release/`.

#### docker_publish_production:

This job publishes the image created by *build_image* and tags the versions according to the released package version.

This job is performed with the official docker-image [docker]:latest and a service-image [docker]:dind.

This Job depends on *build_image* and the resulting artifact containing the docker-image.

This job is done only on tags named beginning with `release/`.

#### docker_publish_alpha:

This job publishes the image created by *build_image* and tags it as *alpha-<issue>*, overwriting a possibly existing one.

This job is performed with the official docker-image [docker]:latest and a service-image [docker]:dind.

This Job depends on *build_image* and the resulting artifact containing the docker-image.

This Job is done only on branches named beginning with `<issue>-`.

#### docker_publish_staging:

This job publishes the image created by *build_image* and tags it as *staging*,overwriting a possibly existing one.

This job is performed with the official docker-image [docker]:latest and a service-image [docker]:dind.

This Job depends on *build_image* and the resulting artifact containing the docker-image.

This Job is done only on master.

### deploy

This stage takes care of all deploy-jobs

#### deploy_alpha:

This job deploys the the published alpha-image created by *docker_publish_alpha* to the k8s-kluster into the namespace *dacap-alpha*

This job is performed with the helm docker-image [dtzar/helm-kubectl]:2.9.1.

This Job depends on *docker_publish_alpha*.

This Job is done only on banches named beginning with `<issue>-`.

### docs

This stage takes care of publishing the documentation

#### gh_pages

This job clones the repository and performs `mkdocs gh-deploy`, which creates the documentation and puts it into a special branch `gh-pages`. This branch is parsed by github.com and publishes the documentation under [Github Pages].

This job is performed with the docker-image [squidfunk/mkdocs-material]:2.7.2.

This job is done only on tags named beginning with `release/`.

### mirror

This stage takes care of mirroring the repo to remote servers

#### github_mirror

This job clones the repository and adds the remote `github`-repository. Then it performs a `git push --mirror github`.

This job is performed with the docker-image [alpine/git].

[Advanced Configuration]: #advanced-configuration
[mkdocs]: https://www.mkdocs.org/
[Github Pages]: https://ubleipzig.github.io/dacap/

[node]: https://hub.docker.com/_/node/
[docker]: https://hub.docker.com/_/docker/
[dtzar/helm-kubectl]: https://hub.docker.com/r/dtzar/helm-kubectl/
[squidfunk/mkdocs-material]: https://hub.docker.com/r/squidfunk/mkdocs-material/
[alpine/git]: https://hub.docker.com/r/alpine/git/
