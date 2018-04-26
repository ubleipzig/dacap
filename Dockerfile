FROM services.ub.uni-leipzig.de:10443/library/node:8-alpine
VOLUME ["/data"]
EXPOSE 3000
ENV data_dir=/data \
 NODE_ENV=production
RUN npm install -g dacap
CMD chown node:node -R ${data_dir} && su node -c dacap