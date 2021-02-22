#! /bin/sh

SECONDS=0
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR
echo $PWD

export DOMAIN=$1

BUILDDIR=$(node ./helpers/name_build_directory.js)
echo "Deploy directory: $BUILDDIR"

echo '\n Making backup \n'
echo "/srv/www/$DOMAIN/. /srv/www-backup/$DOMAIN/"`date +"%Y-%m-%d_%H-%M-%S"`'/'

echo '\nReplace live site'
echo "/srv/ssg/build/$BUILDDIR/. /srv/www/$DOMAIN/"

