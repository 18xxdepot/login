FROM node:10-alpine

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

RUN mkdir -p /usr/app
WORKDIR /usr/app

COPY package.json /usr/app
COPY yarn.lock /usr/app

RUN yarn

COPY . /usr/app
RUN mkdir -p /usr/app/keys

ENTRYPOINT ["yarn"]
CMD ["start"]
