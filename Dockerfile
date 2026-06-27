FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules (like bcrypt, better-sqlite3)
RUN apk add --no-cache python3 make g++ 

COPY package*.json ./
RUN npm install

COPY . .

# Build Next.js
RUN npm run build

EXPOSE 3000

CMD ["node", "server.js"]
