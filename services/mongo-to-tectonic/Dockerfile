FROM node:20.14-alpine

ARG NODE_ENV=production

# Update & install required packages
RUN apk add --update bash curl;

# Install app dependencies
COPY package.json /service/package.json
COPY yarn.lock /service/yarn.lock

RUN cd /service; yarn install --frozen-lockfile;

# Copy app source
COPY . /service/

# Set work directory to /api
WORKDIR /service/

CMD ["./scripts/entrypoint.sh"]
