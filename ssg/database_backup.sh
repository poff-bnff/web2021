#!/bin/bash
. /srv/strapi/strapi-development/.env
BACKUPPREFIX="db_$StrapiDatabaseName"
BACKUPDIR="/srv/backup/database/"
TIMESTAMP=`date "+%Y%m%d_%H%M%S_%3N"`

# pg_dump "$DATABASE" > "$BACKUPDIR""$BACKUPPREFIX"_"$TIMESTAMP".sql

MYDB="postgresql://$StrapiDatabaseUsername:$StrapiDatabasePassword@$StrapiDatabaseHost:$StrapiDatabasePort/$StrapiDatabaseName"
FULLFILEPATH="$BACKUPDIR""$BACKUPPREFIX"_"$TIMESTAMP"".sql"

echo "Backing up database $StrapiDatabaseName to $FULLFILEPATH"

# Using postgres 13 pg_dump as otherwise server and pg_dump version mismatch occurs
/usr/lib/postgresql/13/bin/pg_dump --dbname=$MYDB -f $FULLFILEPATH
