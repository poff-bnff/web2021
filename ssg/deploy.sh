#! /bin/sh

SECONDS=0
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR
echo $PWD

export DOMAIN=$1

# BUILDDIR=$(node ./../../ssg/helpers/name_build_directory.js) #local 
BUILDDIR=$(node /srv/ssg/helpers/name_build_directory.js)
printf "Deploy directory: $BUILDDIR"

printf '\n Making backup of $DOMAIN site\n'
cp -a "/srv/www/$DOMAIN/. /srv/www-backup/$DOMAIN/"`date +"%Y-%m-%d_%H-%M-%S"`'/'

printf '\nReplace live site $DOMAIN'
rsync -avh "/srv/ssg/build/$BUILDDIR/. /srv/www/$DOMAIN/"  --delete-after

