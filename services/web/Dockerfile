FROM node:20.14-alpine

# Yarn will not install any package listed in devDependencies if the NODE_ENV environment variable is set to production. Use this flag to instruct Yarn to ignore NODE_ENV and take its production-or-not status from this flag instead.
ARG NODE_ENV=production

COPY package.json /service/package.json
COPY yarn.lock /service/yarn.lock

# Update & install required packages
RUN apk add --update bash curl;
RUN cd /service; yarn install --frozen-lockfile;

# Copy web source
COPY . /service

# Set work directory to /web
WORKDIR /service

RUN yarn build

EXPOSE 3200

CMD ["yarn", "run", "static"]