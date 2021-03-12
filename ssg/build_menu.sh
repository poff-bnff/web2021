#! /bin/bash

SECONDS=0

THISDIR=${PWD##*/}

# if [ "$THISDIR" != "ssg" ]; then
#     cd "/srv/ssg"
# fi

echo $PWD

export DOMAIN="$1"
echo "$DOMAIN"

TARGET="$2"
echo TARGET
echo "$TARGET"
PARAMS="$3"
echo PARAMS
echo "$PARAMS"


LOCAL=/home/liis/Documents/web2021/ssg
SERVER=/srv/ssg

node $LOCAL/helpers/fetch_menu_from_yaml.js $TARGET $PARAMS 

node ./node_modules/entu-ssg/src/build.js ./entu-ssg.yaml full
printf '\n\n----------      Finished building      ----------\n\n'

node $LOCAL/helpers/reset_config_path_aliases.js 

