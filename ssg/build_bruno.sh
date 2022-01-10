#! /bin/bash

SECONDS=0

THISDIR=${PWD##*/}

if [ "$THISDIR" != "ssg" ]; then
    cd "/srv/ssg"
fi

echo $PWD

export DOMAIN='oyafond.ee'
echo DOMAIN
echo $DOMAIN

echo 'Processing all Strapidata by Domain'
nice -10 node ./helpers/d_fetch.js

. ./build.sh
printf '\n\n----------      Finished building      ----------\n\n'




