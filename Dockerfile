FROM node:10-alpine

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

USER node
RUN mkdir -p /home/node/login
WORKDIR /home/node/login

COPY package.json /home/node/login
COPY yarn.lock /home/node/login

RUN yarn

COPY . /home/node/login
RUN mkdir -p /home/node/login/keys

ENTRYPOINT ["yarn"]
CMD ["start"]
