#! /bin/bash
SECONDS=0
THISDIR=${PWD##*/}

export DOMAIN="$1"

TARGET=$2
TARGET_ID=$3
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
echo "Build directory: $BUILDDIR"

echo "Initialized entu_ssg.yaml"
nice -10 node "$FETCH_PATH"/initialise_entu_ssg.js

nice -10 node "$FETCH_PATH"/fetch_person_from_yaml.js  "$TARGET" "$TARGET_ID"

nice -10 node "$FETCH_PATH"/fetch_profile_data_from_yaml.js

nice -10 node "$FETCH_PATH"/add_config_path_aliases.js add /profile_search

# Logi konsooli kõik ehitatavad pathid:
BUILD_DIRS=$(nice -10 node "$FETCH_PATH"/add_config_path_aliases.js display)
echo "$BUILD_DIRS"

PROFILE_SLUG=$(echo "$BUILD_DIRS" | grep '/_fetchdir/persons/' | awk -F/ '{print $NF}')
echo "PROFILE_SLUG: $PROFILE_SLUG"


printf '\n----------                  Adding ignore paths                ----------\n\n'
nice -10 node ./helpers/add_config_ignorePaths.js
printf '\n----------               Finished adding ignore paths            ----------\n'

nice -10 node "$BUILD_PATH"/node_modules/entu-ssg/src/build.js "$BUILD_PATH"/entu-ssg.yaml full

echo "RSYNC $PROFILE_SLUG to build.$DOMAIN and $DOMAIN"
rsync -ra "$BUILD_PATH"/build/"$BUILDDIR"/"$PROFILE_SLUG" "$BUILD_PATH"/../www/build."$DOMAIN"/"$PROFILE_SLUG"
rsync -ra "$BUILD_PATH"/build/"$BUILDDIR"/"$PROFILE_SLUG" "$BUILD_PATH"/../www/"$DOMAIN"/"$PROFILE_SLUG"

rsync -ra "$BUILD_PATH"/build/"$BUILDDIR"/persons-search "$BUILD_PATH"/../www/build."$DOMAIN"/persons-search
rsync -ra "$BUILD_PATH"/build/"$BUILDDIR"/persons-search "$BUILD_PATH"/../www/"$DOMAIN"/persons-search

printf '\n\n----------      Finished building      ----------\n\n'
