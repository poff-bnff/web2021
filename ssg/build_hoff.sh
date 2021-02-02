SECONDS=0
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR
echo $PWD

export DOMAIN='hoff.ee'
echo DOMAIN
echo $DOMAIN
. ./build.sh
printf '\n\n----------      Finished building, press ENTER to exit      ----------\n\n'

read varname
echo $varname
