#! /bin/bash

SECONDS=0
THISDIR=${PWD##*/}

export DOMAIN="$1"

TARGET="$2"
TARGET_ID="$3"

# Tekitame array käsureaparameetritest
IFS=' ' read -r -a PARAMS_ARRAY <<< "$@"
# Parameetrid alatest kohast 3 kuni lõpuni
ADDITIONAL_TARGET_IDS="${PARAMS_ARRAY[@]:3:${#PARAMS_ARRAY[@]}}"
echo "Build $DOMAIN, TYPE: $TARGET, ID: $TARGET_ID, ADDITIONAL_IDS: $ADDITIONAL_TARGET_IDS"


BASEDIR=$(dirname "$BASH_SOURCE")
cd "$BASEDIR"

FETCH_PATH=`pwd`/helpers
BUILD_PATH=`pwd`

BUILDDIR=$(node $FETCH_PATH/name_build_directory.js)
echo "Build directory: archive/$BUILDDIR"

echo "Creating archive directories if not existent"
[ ! -d "./archive" ] && mkdir -p "./archive"
[ -d "./archive/$BUILDDIR" ] && rm -rf "./archive/$BUILDDIR/"*
[ ! -d "./archive/$BUILDDIR" ] && mkdir -p "./archive/$BUILDDIR"

echo 'Processing all Strapidata by Domain'
nice -10 node "$FETCH_PATH"/d_fetch.js

echo "$FETCH_PATH" FETCH_PATH
nice -10 node "$BUILD_PATH"/initialise_entu_ssg.js archive

if [ "$DOMAIN" == "industry.poff.ee" ]; then
    echo "fetch_industry_project_from_yaml.js"
    nice -10 node "$FETCH_PATH"/fetch_industry_project_from_yaml.js archive

    echo "fetch_industry_person_from_yaml.js"
    nice -10 node "$FETCH_PATH"/fetch_industry_person_from_yaml.js archive
else
    echo "fetch_cassettes_archive_from_yaml.js"
    nice -10 node "$FETCH_PATH"/fetch_cassettes_archive_from_yaml.js "$DOMAIN"
fi

echo "fetch_footer_from_yaml.js"
nice -10 node "$FETCH_PATH"/fetch_footer_from_yaml.js

# Logi konsooli kõik ehitatavad pathid:
nice -10 node "$FETCH_PATH"/add_config_path_aliases.js display

nice -10 node "$BUILD_PATH"/node_modules/entu-ssg/src/build.js "$BUILD_PATH"/entu-ssg.yaml full

echo "RSYNC $BUILD_PATH/archive/$BUILDDIR/. $BUILD_PATH/../www/build.$DOMAIN"/
rsync -ra "$BUILD_PATH"/archive/"$BUILDDIR"/. "$BUILD_PATH"/../www/build."$DOMAIN"/

echo "Compressing ..."
# tar -cvf "$BUILD_PATH"/archive/"$DOMAIN".tar -C "$BUILD_PATH"/archive/"$BUILDDIR"/
tar -cf "$BUILD_PATH"/archive/"$BUILDDIR".tar -C "$BUILD_PATH"/archive/"$BUILDDIR" .
# tar -cvf /srv/ssg/archive/kinoff.tar -C /srv/ssg/archive/kinoff .
echo "Compressed"

printf '\n\n----------      Finished building      ----------\n\n'



