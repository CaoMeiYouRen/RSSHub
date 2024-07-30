#!/bin/bash

MAX_RETRIES=12
# Try running the docker and get the output
# then try getting homepage in 1 minute

# Run the Docker container in the background
docker run -d -p 1200:1200 --name rsshub rsshub:latest

if [[ $? -ne 0 ]];
then
    echo "Failed to run Docker container"
    exit 1
fi

# Tail the Docker logs in the background
docker logs -f rsshub &
LOGS_PID=$!

RETRY=1
curl -m 10 localhost:1200
while [[ $? -ne 0 ]] && [[ $RETRY -lt $MAX_RETRIES ]];
do
    sleep 5
    ((RETRY++))
    echo "RETRY: ${RETRY}"
    curl -m 10 localhost:1200
done

if [[ $RETRY -ge $MAX_RETRIES ]];
then
    echo "Unable to run, aborted"
    kill $LOGS_PID
    exit 1
else
    echo "Successfully acquired homepage, passing"
    kill $LOGS_PID
    exit 0
fi
