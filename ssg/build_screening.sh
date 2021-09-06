#! /bin/bash

SECONDS=0
THISDIR=${PWD##*/}

export DOMAIN="$1"

TARGET="$2"
TARGET_ID="$3"

BASEDIR=$(dirname "$BASH_SOURCE")
cd "$BASEDIR"

# Tekitame array käsureaparameetritest
IFS=' ' read -r -a PARAMS_ARRAY <<< "$@"
# Parameetrid alatest kohast 3 kuni lõpuni
ADDITIONAL_TARGET_IDS="${PARAMS_ARRAY[@]:3:${#PARAMS_ARRAY[@]}}"
echo "Build $DOMAIN, TYPE: $TARGET, ID: $TARGET_ID, ADDITIONAL_IDS: $ADDITIONAL_TARGET_IDS"


FETCH_PATH=`pwd`/helpers
BUILD_PATH=`pwd`

BUILDDIR=$(node $FETCH_PATH/name_build_directory.js)
echo "Build directory: $BUILDDIR"

echo 'Processing all Strapidata by Domain'
node "$FETCH_PATH"/d_fetch.js

echo "Initialized entu_ssg.yaml"
node "$BUILD_PATH"/initialise_entu_ssg.js

node "$FETCH_PATH"/fetch_cassettes_from_yaml.js "$TARGET" "$ADDITIONAL_TARGET_IDS"
node "$FETCH_PATH"/fetch_screenings_from_yaml.js "$TARGET"
node "$FETCH_PATH"/fetch_PL_screenings.js
node "$FETCH_PATH"/fetch_footer_from_yaml.js "$TARGET"

node "$BUILD_PATH"/node_modules/entu-ssg/src/build.js "$BUILD_PATH"/entu-ssg.yaml full

echo "RSYNC $BUILD_PATH/build/$BUILDDIR/. $BUILD_PATH/../www/build.$DOMAIN"/
rsync -ra "$BUILD_PATH"/build/"$BUILDDIR"/. "$BUILD_PATH"/../www/build."$DOMAIN"/

printf '\n\n----------      Finished building      ----------\n\n'



