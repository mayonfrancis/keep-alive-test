FROM node:20-alpine

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm i

COPY client.js test1.js test2.js ./

CMD node client.js