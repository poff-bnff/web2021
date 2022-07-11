SECONDS=0
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR

QUEUEFILE="$PWD"/helpers/build_queue.yaml

LASTBUILDINFO=''

if [ -f "$QUEUEFILE" ]; then
    rm "$QUEUEFILE"
    echo "Build_queue kustutatud."
    echo ""

else
    echo "Järjekorda ei eksisteeri. "
    echo ""

fi

if [ -n "$1" ]; then
    if [ -d "/proc/$1" ]
    then
        LASTBUILDINFO=$(ps -Flww -p $1)
        kill "$1"
        echo "Viimane build (PID $1) tapetud."
        echo ""
    else
        echo "Viimane build (PID $1) ei ole aktiivne."
        echo ""
    fi
fi

BUILPROCESSESHELPERS=$(ps ax | grep './helpers/' | grep -v grep | awk '{print $1}' | xargs)
BUILPROCESSESHELPERSFULLINFO=$(ps ax | grep './helpers/' | grep -v grep)

BUILPROCESSESENTUSSG=$(ps ax | grep '/node_modules/entu-ssg/src/build.js' | grep -v grep | awk '{print $1}' | xargs)
BUILPROCESSESENTUSSGFULLINFO=$(ps ax | grep '/node_modules/entu-ssg/src/build.js' | grep -v grep)

if [ -z "$BUILPROCESSESHELPERS" ]
then
    :
else
    echo -n "Tapan helpersite PID'd "
    ARRAYHELPERS=($BUILPROCESSESHELPERS)

    for (( n=0; n < ${#ARRAYHELPERS[*]}; n++ ))
    do
        if [ $(($n+1)) = ${#ARRAYHELPERS[*]} ]
        then
            echo "${ARRAYHELPERS[n]}."
        else
            echo -n "${ARRAYHELPERS[n]}, "
        fi
    done
    kill $BUILPROCESSESHELPERS
fi

if [ -z "$BUILPROCESSESENTUSSG" ]
then
    :
else
    echo ""
    echo -n "Tapan SSG PID'd "
    ARRAYSSG=($BUILPROCESSESENTUSSG)

    for (( n=0; n < ${#ARRAYSSG[*]}; n++ ))
    do
        if [ $(($n+1)) = ${#ARRAYSSG[*]} ]
        then
            echo "${ARRAYSSG[n]}."
        else
            echo -n "${ARRAYSSG[n]}, "
        fi
    done
    echo ""
    kill $BUILPROCESSESENTUSSG
fi

echo "SEPARATORSTRING"

if [ -z "$LASTBUILDINFO" ]; then
    :
else
    echo "Last build (PID $1) details:"
    echo "$LASTBUILDINFO"
    echo ""
fi

if [ -z "$BUILPROCESSESHELPERS" ]
then
    :
else
    echo "Killed helpers detailed:"
    echo "$BUILPROCESSESHELPERSFULLINFO"
    echo ""
fi

if [ -z "$BUILPROCESSESENTUSSG" ]
then
    :
else
    echo "Killed SSG PID'd detailed"
    echo "$BUILPROCESSESENTUSSGFULLINFO"
fi
