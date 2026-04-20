FROM node:20-alpine

WORKDIR /app

# Install build deps for better-sqlite3
RUN apk add --no-cache python3 make g++ sqlite-dev

COPY package.json ./
RUN npm install --omit=dev

COPY . .

# Create data directory
RUN mkdir -p data

EXPOSE 3000 8080 2222 2121

CMD ["node", "server.js"]
