FROM library/node:8-alpine
VOLUME ["/data"]
EXPOSE 3000
ENV npm_config_registry=https://services.ub.uni-leipzig.de/npm \
 data_dir=/data \
 NODE_ENV=production \
 APP_VERSION=1.0.10
COPY dacap-${APP_VERSION}.tgz /tmp/
RUN npm install -g /tmp/dacap-${APP_VERSION}.tgz
CMD chown node:node -R ${data_dir} && su node -c dacap