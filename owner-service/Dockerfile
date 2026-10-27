FROM node:22-alpine
WORKDIR /app
COPY package.json demo.js server.js portal.html ./
COPY reports ./reports
USER node
EXPOSE 8098
CMD ["node", "server.js"]
