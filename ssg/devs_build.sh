#! /bin/bash

pushd "dirname ${BASH_SOURCE[0]}"

git pull
node ./node_modules/entu-ssg/src/build.js ./entu-ssg-devs.yaml full
rsync -rav ./ssg/build/poff/. ./ssg/build/web/

popd
