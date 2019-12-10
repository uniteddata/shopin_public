#!/bin/bash

git pull
hostname -i > ip.txt
. ~/.nvm/nvm.sh
. ~/.profile
. ~/.bashrc
nvm use 8.16.0
pm2 kill
pm2 start /home/ubuntu/shopin-dht/shopin-node -- 4004 false 8501 10 false