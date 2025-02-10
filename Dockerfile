FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN apk add --no-cache chromium harfbuzz gconf-2 nss libstdc++
ENV CHROMIUM_BIN="/usr/bin/chromium-browser"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

ENV PORT 3000SS
CMD ["node", "index.js"]