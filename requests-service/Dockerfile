FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY rules.js routes.js server.js portal.html object-map.html ./
USER node
EXPOSE 8097
CMD ["node", "server.js"]
