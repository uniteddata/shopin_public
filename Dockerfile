# FROM node:8

# # working directory
#  WORKDIR /app

# # copy package.json
# COPY ./package.json ./

# # install packages
# RUN yarn install

# # In util.js, we have created one method getContactInfo. Earlier that was method getContactURL
# # which was giving contact's URL. but we need whole contact object.
# COPY ./src/libraryFiles/utils.js ./node_modules/@kadenceproject/kadence/lib

# # We called getContactInfo method from util.js inside this file
# # getBootstrapCandidates was giving us url of contact but we have needed whole contact object.
# COPY ./src/libraryFiles/plugin-rolodex.js ./node_modules/@kadenceproject/kadence/lib

# # In bucket.js, we have created one method which will return all buckets of node's routing table
# COPY ./src/libraryFiles/bucket.js ./node_modules/@kadenceproject/kadence/lib




# ENV API_PORT=4001
# ENV PORT=4002
# ENV PORT_OF_PRIMARY_NODE=4002
# ENV FROM_LOCAL=false
# ENV HOSTNAME_OF_PRIMARY_NODE=18.216.96.3
# ENV IDENTITY_OF_PRIMARY_NODE=2b4d287c85c80019babd70f664b1be987c55e25c

# # ip of docker container
# RUN wget http://ipecho.net/plain -O - -q > ip.txt

# # Here, we have that method. We are getting list of contacts in array now.
# COPY ./src/libraryFiles/routing-table.js ./node_modules/@kadenceproject/kadence/lib

# # copy source code to current directory
# COPY . ./

# # expose public port
# # EXPOSE 4002:4002/udp
# # EXPOSE 4001:4001

# # run nodemon
# CMD ["npm", "start"]


FROM node:8

# working directory
 WORKDIR /app

# copy package.json
COPY ./package.json ./

# install packages
RUN yarn install

# In util.js, we have created one method getContactInfo. Earlier that was method getContactURL
# which was giving contact's URL. but we need whole contact object.
COPY ./src/libraryFiles/utils.js ./node_modules/@kadenceproject/kadence/lib

# We called getContactInfo method from util.js inside this file
# getBootstrapCandidates was giving us url of contact but we have needed whole contact object.
COPY ./src/libraryFiles/plugin-rolodex.js ./node_modules/@kadenceproject/kadence/lib

# In bucket.js, we have created one method which will return all buckets of node's routing table
COPY ./src/libraryFiles/bucket.js ./node_modules/@kadenceproject/kadence/lib




ENV API_PORT=4001
ENV PORT=4002
ENV PORT_OF_PRIMARY_NODE=4002
ENV FROM_LOCAL=true
ENV HOSTNAME_OF_PRIMARY_NODE=127.0.1.1
ENV IDENTITY_OF_PRIMARY_NODE=2b4d287c85c80019babd70f664b1be987c55e25c
# COPY envWrapper .

# RUN chmod 755 ./envwrapper
# CMD ./envwrapper IP
# RUN wget http://ipecho.net/plain -O - -q > ip.txt
RUN wget hostname -i > ip.txt

# Here, we have that method. We are getting list of contacts in array now.
COPY ./src/libraryFiles/routing-table.js ./node_modules/@kadenceproject/kadence/lib

# copy source code to current directory
COPY . ./

# Expose public port
EXPOSE 4002:4002/udp
EXPOSE 4001:4001

# run nodemon
CMD ["npm", "start"]