#! /bin/sh

SECONDS=0
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR
printf "$PWD"

export DOMAIN=$1

BUILDDIR=$(node ./../../ssg/helpers/name_build_directory.js)
printf "Deploy directory: $BUILDDIR"

printf '\n Making backup \n'
printf "/srv/www/$DOMAIN/. /srv/www-backup/$DOMAIN/"`date +"%Y-%m-%d_%H-%M-%S"`'/'

printf "\nReplace live site $DOMAIN\n"
printf "/srv/ssg/build/$BUILDDIR/. /srv/www/$DOMAIN/"

