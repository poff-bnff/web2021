#! /bin/bash

SECONDS=0

THISDIR=${PWD##*/}

# if [ "$THISDIR" != "ssg" ]; then
#     cd "/srv/ssg"
# fi

export DOMAIN="$1"

TARGET=$2
# echo TARGET
# echo $TARGET
id=$3
# echo id
# echo $id
echo `node -v` node
BASEDIR=$(dirname "$0")
cd "$BASEDIR"
FETCH_PATH=`pwd`/helpers
BUILD_PATH=`pwd`
echo "$FETCH_PATH" FETCH_PATH

node $FETCH_PATH/fetch_articles_from_yaml.js $TARGET $id 
node "$FETCH_PATH"/fetch_article_type_from_yaml.js  $TARGET $id
node "$FETCH_PATH"/fetch_heroarticle_from_yaml.js $TARGET $id
node "$FETCH_PATH"/fetch_menu_from_yaml.js $TARGET $id
# node "$SCRIPT_PATH"/fetch_trioblock_from_yaml.js $TARGET $id
node "$BUILD_PATH"/node_modules/entu-ssg/src/build.js "$BUILD_PATH"/entu-ssg.yaml full
printf '\n\n----------      Finished building      ----------\n\n'

node "$FETCH_PATH"/reset_config_path_aliases.js 


