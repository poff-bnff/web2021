SECONDS=0
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR
echo $PWD

[ -d "./source/_fetchdir" ] && rm -r "./source/_fetchdir/"
[ ! -d "./source/_fetchdir" ] && mkdir -p "./source/_fetchdir"
[ -d "./source/_fetchdirRestricted" ] && rm -r "./source/_fetchdirRestricted/"
[ ! -d "./source/_fetchdirRestricted" ] && mkdir -p "./source/_fetchdirRestricted"
