echo DOMAIN
echo $DOMAIN

node ./initialise_entu_ssg.js

printf '\n----------                  Adding ignore paths                ----------\n\n'
nice -10 node ./helpers/add_config_ignorePaths.js
printf '\n----------               Finished adding ignore paths            ----------\n'

printf '\n----------                Starting serve                    ----------\n\n'

node ./node_modules/entu-ssg/src/serve.js ./entu-ssg.yaml

printf '\n\n----------      Finished serving      ----------\n\n'



