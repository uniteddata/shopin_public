
#!/bin/bash
PORT=4001

MAX_NODES=10
COUNTER=0
while [ $COUNTER -lt $MAX_NODES ]; do
  lsof -n -i4TCP:$PORT | grep LISTEN | awk '{ print $2 }' | xargs kill
  let COUNTER=COUNTER+1
  let PORT=PORT+1
done