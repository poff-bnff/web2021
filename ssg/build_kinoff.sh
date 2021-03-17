#! /bin/bash

SECONDS=0

THISDIR=${PWD##*/}

if [ "$THISDIR" != "ssg" ]; then
    cd "/srv/ssg"
fi

# DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
# cd $DIR
echo $PWD

export DOMAIN='kinoff.poff.ee'
echo DOMAIN
echo $DOMAIN

. ./build.sh
printf '\n\n----------      Finished building      ----------\n\n'



