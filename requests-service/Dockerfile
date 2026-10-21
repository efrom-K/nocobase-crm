FROM node:22-alpine
WORKDIR /app
COPY rules.js server.js ./
USER node
EXPOSE 8097
CMD ["node", "server.js"]
