FROM node:8-alpine
VOLUME ["/data"]
EXPOSE 3000
ENV data_dir=/data \
 NODE_ENV=production

COPY *.tgz /tmp

RUN npm i -g /tmp/*.tgz \
	&& rm -rf /tmp/*.tgz

CMD chown node:node -R ${data_dir} && su node -c dacap