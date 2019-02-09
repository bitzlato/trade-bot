FROM node:10

WORKDIR /app

COPY package.json package-lock.json /app/
RUN npm install

COPY . /app
