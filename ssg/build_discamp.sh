#! /bin/bash

SECONDS=0

THISDIR=${PWD##*/}

if [ "$THISDIR" != "ssg" ]; then
    cd "/srv/ssg"
fi

echo $PWD

export DOMAIN='discoverycampus.poff.ee'
echo DOMAIN
echo $DOMAIN

. ./build.sh
printf '\n\n----------      Finished building      ----------\n\n'



