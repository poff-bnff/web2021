#! /bin/bash

SECONDS=0

THISDIR=${PWD##*/}

if [ "$THISDIR" != "ssg" ]; then
    cd "/srv/ssg"
fi

echo $PWD

export DOMAIN='justfilm.ee'
echo DOMAIN
echo $DOMAIN

echo 'Processing all Strapidata by Domain'
node ./helpers/d_fetch.js

. ./build.sh

printf '\n\n----------      Finished building      ----------\n\n'



