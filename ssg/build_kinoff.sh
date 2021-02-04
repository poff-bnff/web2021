#! /bin/bash

SECONDS=0

cd "/srv/ssg"

# DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
# cd $DIR
echo $PWD

export DOMAIN='kinoff.poff.ee'
echo DOMAIN
echo $DOMAIN

. ./build.sh
printf '\n\n----------      Finished building, press ENTER to exit      ----------\n\n'

read varname
echo $varname
