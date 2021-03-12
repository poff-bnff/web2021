SECONDS=0
THISDIR=${PWD##*/}

export DOMAIN="$1"

TARGET=$2
TARGET_ID=$3

BASEDIR=$(dirname "$BASH_SOURCE")
cd "$BASEDIR"

FETCH_PATH=`pwd`/helpers
BUILD_PATH=`pwd`
echo "$FETCH_PATH" FETCH_PATH

node $FETCH_PATH/fetch_articles_from_yaml.js $TARGET $TARGET_ID
node "$FETCH_PATH"/fetch_article_type_from_yaml.js  $TARGET $TARGET_ID
node "$FETCH_PATH"/fetch_heroarticle_from_yaml.js $TARGET $TARGET_ID
node "$FETCH_PATH"/fetch_menu_from_yaml.js $TARGET $TARGET_ID
node "$FETCH_PATH"/fetch_trioblock_from_yaml.js $TARGET $TARGET_ID

# Below line console.logs all final path aliases:
node "$FETCH_PATH"/add_config_path_aliases.js display

node "$BUILD_PATH"/node_modules/entu-ssg/src/build.js "$BUILD_PATH"/entu-ssg.yaml full
printf '\n\n----------      Finished building      ----------\n\n'
node "$FETCH_PATH"/reset_config_path_aliases.js
