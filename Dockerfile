FROM node:18-slim

WORKDIR /app

COPY backend/package.json .
RUN npm install

COPY . .

CMD ["node", "index.js"]