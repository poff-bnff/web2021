#! /bin/sh

SECONDS=0
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR
echo $PWD

DOMAIN=$1
echo 'Domain' $DOMAIN

BUILDDIR=$(node ./helpers/name_build_directory.js $DOMAIN)
echo "Deploy directory: $BUILDDIR"

echo '\n Making backup \n'
cp -a "/srv/www/"$DOMAIN"/." "/srv/backup/"$DOMAIN"/temp/"

echo '\nReplace live site'
rsync -ah /srv/ssg/build/$BUILDDIR/* /srv/www/$DOMAIN/  --delete-after

bash /srv/ssg/create_bak.sh $DOMAIN