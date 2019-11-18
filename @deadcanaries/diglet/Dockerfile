FROM debian:buster
LABEL maintainer "emery@deadcanaries.org"
RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get -yq upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-get -yq install wget apt-transport-https gnupg curl libssl-dev git python build-essential
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
RUN git clone https://gitlab.com/deadcanaries/diglet /root/diglet; \
    cd /root/diglet; \
    git fetch --tags; \
    git checkout $(git describe --tags `git rev-list --tags --max-count=1`); \
    cd /root/diglet && npm install --unsafe-perm --production
EXPOSE 443
EXPOSE 80
EXPOSE 8443
ENTRYPOINT ["/root/diglet/bin/diglet.js"]
CMD []
