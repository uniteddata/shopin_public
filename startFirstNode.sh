#!/bin/bash

hostname -i > ip.txt
. ~/.nvm/nvm.sh
. ~/.profile
. ~/.bashrc
nvm use 8.16.0
pm2 kill
pm2 start /home/ubuntu/shopin-node-repo/index.js -- 4001 true 8501 10 true