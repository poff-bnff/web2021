#! /bin/bash

SECONDS=0

cd "/srv/ssg"

# DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
# cd $DIR
echo $PWD

printenv StrapiUserName

export DOMAIN='hoff.ee'
echo DOMAIN
echo $DOMAIN

# se asendus tehakse initialise_entu.js skriptiga
# sed -i 's/build: \.\/build.*$/build: \.\/build\/'$DOMAIN'/g' entu-ssg.yaml

. /srv/ssg/build.sh
printf '\n\n----------      Finished building, press ENTER to exit      ----------\n\n'

read varname
echo $varname

