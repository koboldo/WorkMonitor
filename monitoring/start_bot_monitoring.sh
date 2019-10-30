#!/usr/bin/env bash

#Required for relevant permissions when mounting host folders as volumes
export UID
export GID=`id | cut -d "=" -f3 | cut -d "(" -f1`

docker-compose up