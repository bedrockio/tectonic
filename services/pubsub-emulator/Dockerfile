FROM google/cloud-sdk:alpine

RUN apk --update add openjdk8-jre netcat-openbsd
RUN gcloud components install beta pubsub-emulator

EXPOSE 8200

CMD gcloud beta emulators pubsub start --host-port=0.0.0.0:8200