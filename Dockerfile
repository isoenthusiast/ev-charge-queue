FROM node:24.19.0-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:24.19.0-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/build ./
RUN npm ci --omit=dev && npm cache clean --force
USER node
EXPOSE 3333
CMD ["node", "bin/server.js"]
