#! /bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

pushd $SCRIPT_DIR

git pull
node ./node_modules/entu-ssg/src/build.js ./entu-ssg-devs.yaml full
rsync -rav ./ssg/build/poff/. ./ssg/build/web/

popd
