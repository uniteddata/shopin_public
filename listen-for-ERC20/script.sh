#!/bin/bash

hostname -i > ip.txt
. ~/.nvm/nvm.sh
. ~/.profile
. ~/.bashrc
nvm use 8.16.0
pm2 start /home/ubuntu/shopin-dht/listen-for-ERC20/index.js