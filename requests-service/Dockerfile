FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY rules.js routes.js pyrus-payments.js server.js portal.html object-map.html knowledge.js ./
RUN install -d -m 0700 -o node -g node /app/knowledge && touch /app/knowledge/.keep
USER node
EXPOSE 8097
CMD ["node", "server.js"]
