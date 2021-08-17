#! /bin/bash
SECONDS=0
THISDIR=${PWD##*/}

export DOMAIN="poff.ee"

echo "Build $DOMAIN, LOGINPAGES"

BASEDIR=$(dirname "$BASH_SOURCE")
cd "$BASEDIR"

FETCH_PATH=`pwd`/helpers
BUILD_PATH=`pwd`

BUILDDIR=$(node $FETCH_PATH/name_build_directory.js)
echo "Build directory: $BUILDDIR"

echo 'Processing all Strapidata by Domain'
node "$FETCH_PATH"/d_fetch.js

echo "Initialized entu_ssg.yaml"
node "$BUILD_PATH"/initialise_entu_ssg.js

# Lisa kõik login lehed:
node "$FETCH_PATH"/add_config_path_aliases.js login

node "$BUILD_PATH"/node_modules/entu-ssg/src/build.js "$BUILD_PATH"/entu-ssg.yaml full

echo "RSYNC $BUILD_PATH/build/$BUILDDIR/. $BUILD_PATH/../www/build.$DOMAIN"/
rsync -ra "$BUILD_PATH"/build/"$BUILDDIR"/. "$BUILD_PATH"/../www/build."$DOMAIN"/

printf '\n\n----------      Finished building      ----------\n\n'
