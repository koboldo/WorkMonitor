#!/bin/bash

#full path to db file
SOURCE_FILE=/home/botconsole/env_specific/work-monitor.db
#path to folder with backups
TARGET_DIR=/home/botconsole/db_backup
#how many days backup should be kept
RETENTION_PERIOD=15

[[ ! -f $SOURCE_FILE ]] && {
	echo Source file not found !!! Aborting ...
	exit 1
}

[[ ! -d $TARGET_DIR ]] && {
	echo Target dir not found !!! Aborting ...
	exit 2
}

echo ""
echo "Backup started at $(date '+%Y-%m-%d %H:%M:%S')"

TSTAMP=$(date +"%Y-%m-%d")
BASE_FILE="$(basename $SOURCE_FILE)"
TARGET_ARCHIVE="${BASE_FILE%.*}_$TSTAMP.tar.bz2"
LASTEST_ARCHIVE=$(ls -t -1 $TARGET_DIR | head -n1)

echo "Copying source to tmp and calulating hash"
cp $SOURCE_FILE /tmp/$BASE_FILE

HASH_IN=$(md5sum /tmp/$BASE_FILE)
SIZE_IN=$(stat --printf="%s" /tmp/$BASE_FILE)

echo "Creating archive"
tar -cjf $TARGET_DIR/$TARGET_ARCHIVE -C /tmp $BASE_FILE

rm -f /tmp/$BASE_FILE

echo "Checking archive"
tar -xjf $TARGET_DIR/$TARGET_ARCHIVE -C /tmp $BASE_FILE
HASH_OUT=$(md5sum /tmp/$BASE_FILE)
rm -f /tmp/$BASE_FILE

[[ "$HASH_IN" != "$HASH_OUT" ]] && {
	echo "Corrupted archive !!! Aborting ... "
	rm -f $TARGET_DIR/$TARGET_ARCHIVE
	exit 3
}

[[ "$LASTEST_ARCHIVE" != "" ]] && {
	tar -xjf $TARGET_DIR/$LASTEST_ARCHIVE -C /tmp $BASE_FILE
	SIZE_OUT=$(stat --printf="%s" /tmp/$BASE_FILE)

	(( SIZE_OUT > SIZE_IN )) && {
		echo "Current source file smaller then previous one! Aborting ..."
		exit 4
	}
}

echo "Creating static link for remote copy"
ln -sf $TARGET_DIR/$TARGET_ARCHIVE $TARGET_DIR/work-monitor.latest.tar.bz

echo "Removing old backups:"
find $TARGET_DIR -mtime +$RETENTION_PERIOD -exec basename {} \; -exec rm {} \;

echo "Done"
echo ""
