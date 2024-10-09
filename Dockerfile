FROM node:20.18.0

ENV NODE_ENV=production
ENV NPM_TOKEN=

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY .npmrc /usr/src/app/

RUN npm install --production --omit=dev

COPY . /usr/src/app

EXPOSE 8080

CMD ["npm", "start"]
