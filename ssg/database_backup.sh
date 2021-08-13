#!/bin/bash

DATABASE="strapi"
BACKUPPREFIX="db_$DATABASE"
BACKUPDIR="/srv/backup/database/"
echo "Backing up database $DATABASE"

TIMESTAMP=`date "+%Y%m%d_%H%M%S_%3N"`
pg_dump "$DATABASE" > "$BACKUPDIR""$BACKUPPREFIX"_"$TIMESTAMP".sql

