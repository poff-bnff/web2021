#! /bin/bash

SECONDS=0

THISDIR=${PWD##*/}

# if [ "$THISDIR" != "ssg" ]; then
#     cd "/srv/ssg"
# fi

echo $PWD

export DOMAIN="$1"


TARGET="$2"
echo TARGET
echo "$TARGET"
PARAMS="$3"
echo PARAMS
echo "$PARAMS"


LOCAL=/home/liis/Documents/web2021/ssg

node $LOCAL/helpers/fetch_articles_from_yaml.js $TARGET $PARAMS 
node $LOCAL/helpers/fetch_article_type_from_yaml.js  $TARGET $PARAMS
node $LOCAL/helpers/fetch_heroarticle_from_yaml.js $TARGET $PARAMS
node $LOCAL/helpers/fetch_menu_from_yaml.js $TARGET $PARAMS
node $LOCAL/helpers/fetch_trioblock_from_yaml.js $TARGET $PARAMS

node ./node_modules/entu-ssg/src/build.js ./entu-ssg.yaml full
printf '\n\n----------      Finished building      ----------\n\n'

node $LOCAL/helpers/reset_config_path_aliases.js 


