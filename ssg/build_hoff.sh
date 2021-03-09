#! /bin/bash

SECONDS=0

# cd "/srv/ssg"
# DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
# cd $DIR

# DOMAIN=$1
# echo $DOMAIN
# MODEL=$2
# echo $MODEL
# TYPE=$3
# echo $TYPE
# MODEL_ID=$4
# echo $MODEL_ID

# echo PWD
# echo $PWD
# echo DIR
# echo $DIR

# export DOMAIN='hoff.ee'
# echo DOMAIN
# echo $DOMAIN

# se asendus tehakse initialise_entu.js skriptiga
# sed -i 's/build: \.\/build.*$/build: \.\/build\/'$DOMAIN'/g' entu-ssg.yaml

# . ./build.sh

. $PWD/../../ssg/buildtest.sh $1 $2 $3 $4
printf '\n\n----------      Finished building, press ENTER to exit      ----------\n\n'

read varname
echo $varname

