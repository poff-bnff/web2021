#!/bin/bash
echo 
echo "Running script: "$0""

DOMAIN=$1
FULL_TIMESTAMP=$2
TIMESTAMP=${FULL_TIMESTAMP%.*}

BACKUP_DIR="/srv/backup/"$DOMAIN"/"
PREV_BACKUP_DIR="$BACKUP_DIR""$(cd /srv/backup/$DOMAIN && ls -1t | grep "^b.*[0-9]$" | head -1)/"
NEW_BACKUP_DIR=""$BACKUP_DIR"backup_""$TIMESTAMP/"
START_DIR="/srv/backup/"$DOMAIN"/temp_"$FULL_TIMESTAMP"/"

NEW_FILES_COPIED=0
HARDLINKS_COPIED=0
CHANGED_FILES_COPIED=0

echo
echo Comparing last live site to previous backup: "$PREV_BACKUP_DIR"
exec &> "$BACKUP_DIR"backup_"$TIMESTAMP".log
mkdir "$NEW_BACKUP_DIR"



cd "$START_DIR"

loop_dir()
{
    echo
    if [ "$CURRENT_DIR" != "$START_DIR" ]
    then
        cd "$CURRENT_DIR"
    fi
    for fileAtOrigin in "$CURRENT_DIR"*; do
        if [ -d "$fileAtOrigin" ] 
        then
            newdir=${fileAtOrigin/"$START_DIR"/"$NEW_BACKUP_DIR"}
            echo makingnewdir "$newdir"
            mkdir "$newdir"
            CURRENT_DIR="$fileAtOrigin/"
            loop_dir "$CURRENT_DIR"
        else
            stringtoarray=(${fileAtOrigin##/*/})
            if [ "${stringtoarray[-1]}" != "*" ] 
            then
                fileAtNewBackup=${fileAtOrigin/"$START_DIR"/"$NEW_BACKUP_DIR"}
                # echo "- File: $fileAtOrigin"
                fileAtLastBackup=${fileAtOrigin/"$START_DIR"/"$PREV_BACKUP_DIR"}
                originhash=$(sha256sum "$fileAtOrigin" | cut -d " " -f 1 )

                if [ -f "$fileAtLastBackup" ]
                then
                    fileAtLastBackupHash=$(sha256sum "$fileAtLastBackup" | cut -d " " -f 1 )
                    if [ "$originhash" = "$fileAtLastBackupHash" ]
                    then
                        # File hasn't changed at origin, copy hardlink from old backup.
                        cp -l "$fileAtLastBackup" "$fileAtNewBackup"
                        echo copied existing hardlink from $fileAtLastBackup to $fileAtNewBackup  
                        ((HARDLINKS_COPIED++))
                    else
                        # File has changed in origin, cp file from origin to new backup
                        cp -l "$fileAtOrigin" "$fileAtNewBackup"  
                        echo copied changed file from $fileAtOrigin to $fileAtNewBackup  
                        ((CHANGED_FILES_COPIED++))
                    fi   
                else
                    # New file in origin, cp file from origin to new backup
                    cp -l "$fileAtOrigin" "$fileAtNewBackup"  
                    echo copied new file from $fileAtOrigin to $fileAtNewBackup  
                    ((NEW_FILES_COPIED++))
                fi
            else
                echo "- [No files or folders in $CURRENT_DIR]"
            fi
        fi
    done
}

CURRENT_DIR="$START_DIR"
loop_dir "$CURRENT_DIR"

echo 
echo 
echo backup "$TIMESTAMP" finished `date +%Y-%m-%d_%H-%M-%S`:
echo "$NEW_FILES_COPIED" - new files copied
echo "$CHANGED_FILES_COPIED" - changed files copied
echo "$HARDLINKS_COPIED" - existing hardlinks copied
echo
echo $(find $START_DIR -type f | wc -l) - total files in $START_DIR
echo $(($HARDLINKS_COPIED+$CHANGED_FILES_COPIED+$NEW_FILES_COPIED)) - total backup entries created

rm -r "$START_DIR"

exec &>/dev/tty
echo "Backup completed, for details check logfile: "$BACKUP_DIR"backup_"$TIMESTAMP".log"
exit
