#! /bin/sh
SECONDS=0
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR
echo $PWD
DOMAIN=$1
echo 'Domain' $DOMAIN
BUILDDIR=$(node /srv/ssg/helpers/name_build_directory.js $DOMAIN)
echo "Deploy directory: $BUILDDIR"
if [ $? != 0 ] #BUILDDIR error
then
	exit 80
fi
echo '\n Making backup \n'
cp -a "/srv/www/"$DOMAIN"/." "/srv/backup/"$DOMAIN"/temp/"
if [ $? != 0 ] #Backup error
then
	exit 81
fi
echo '\nReplace live site'
rsync -ah /srv/ssg/build/$BUILDDIR/* /srv/www/$DOMAIN/  --delete-after
if [ $? != 0 ] #Live replace error
then
	exit 82
fi
bash /srv/ssg/create_bak.sh $DOMAIN