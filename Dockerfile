FROM library/node:8-alpine
MAINTAINER Ulf Seltmann <ulf.seltmann@uni-leipzig.de>
VOLUME ["/data"]
EXPOSE 3000
ENV npm_config_registry=https://docker.ub.intern.uni-leipzig.de/npm \
 data_dir=/data
RUN npm install -g dacap
CMD chown node:node -R ${data_dir} && su node -c dacap