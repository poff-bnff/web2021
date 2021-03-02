echo DOMAIN
echo $DOMAIN

node ./initialise_entu_ssg.js

printf '\n----------                Starting serve                    ----------\n\n'

node ./node_modules/entu-ssg/src/serve.js ./entu-ssg.yaml

printf '\n\n----------      Finished serving      ----------\n\n'



