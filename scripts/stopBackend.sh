#!/bin/bash


echo Shutting down nodejs...
ps -ef | grep node | grep -v grep | awk '{print $2}' | while read pid
do
	echo "Killing node: $pid"
	kill $pid
done

sleep 1

echo "Remaining nodes: "`ps -ef | grep node | grep -v grep | wc -l`


