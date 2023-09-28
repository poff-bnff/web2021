#! /bin/bash

cd /srv/ssg/
git pull
node ./node_modules/entu-ssg/src/build.js ./entu-ssg-devs.yaml full
rsync -rav /srv/ssg/build/poff/. /srv/ssg/build/web/
