#! /bin/bash

SECONDS=0

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

THISDIR=${PWD##*/}

# if [ "$THISDIR" != "ssg" ]; then
#     cd "/srv/ssg"
# fi

echo $PWD

export DOMAIN="$1"

TARGET=$2
TARGET_ID=$3
echo "Minibuild $DOMAIN Article - TYPE: $TARGET, ID: $TARGET_ID"



# LOCAL=/home/liis/Documents/web2021/ssg

node ./helpers/fetch_articles_from_yaml.js $TARGET $TARGET_ID
node ./helpers/fetch_article_type_from_yaml.js  $TARGET $TARGET_ID
node ./helpers/fetch_heroarticle_from_yaml.js $TARGET $TARGET_ID
node ./helpers/fetch_menu_from_yaml.js $TARGET $TARGET_ID
node ./helpers/fetch_trioblock_from_yaml.js $TARGET $TARGET_ID

node ./helpers/add_config_path_aliases.js display

node ./node_modules/entu-ssg/src/build.js ./entu-ssg.yaml full
printf '\n\n----------      Finished building      ----------\n\n'

node ./helpers/reset_config_path_aliases.js


