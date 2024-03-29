#! /bin/sh
echo
echo "Running script: "$0""
SECONDS=0
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR

# Script executes with:
#readlink /proc/$$/exe

DOMAIN=$1
echo "Domain to deploy: "$DOMAIN""
BUILDDIR=$(node /srv/ssg/helpers/name_build_directory.js $DOMAIN)

TIMESTAMP=`date +%Y-%m-%d_%H-%M-%S`
BACKUP_TEMP_DIR=temp_"${TIMESTAMP}"/

if [ $? != 0 ] #BUILDDIR error
then
	exit 80
fi
echo "Copying previous live site for backup."
cp -a "/srv/www/"$DOMAIN"/." "/srv/backup/"$DOMAIN"/"$BACKUP_TEMP_DIR
if [ $? != 0 ] #Backup error
then
	exit 81
fi
echo "Replacing site: "$DOMAIN""
rsync -ah --delete-after /srv/www/build."$DOMAIN"/ /srv/www/"$DOMAIN"/
if [ $? != 0 ] #Live replace error
then
	exit 82
fi
echo "New version is LIVE: "$DOMAIN""
bash /srv/ssg/create_bak.sh $DOMAIN $TIMESTAMP

echo "Delete backups older than 14 days"
find /srv/backup/$DOMAIN/* -mtime +14 -exec rm -rf {} \;
