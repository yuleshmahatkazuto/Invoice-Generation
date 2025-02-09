FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN apk update && \
    apk add --no-cache chromium
ENV PORT 3000
CMD ["node", "index.js"]