SECONDS=0
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR

QUEUEFILE="$PWD"/helpers/build_queue.yaml

if [ -f "$QUEUEFILE" ]; then
    rm "$QUEUEFILE"
    echo "Build_queue kustutatud."
else
    echo "Järjekorda ei eksisteeri. "
fi

if [ -n "$1" ]; then
    if [ -d "/proc/$1" ]
    then
        kill "$1"
        echo "Viimane build (PID $1) tapetud."
    fi

    BUILPROCESSES=$(ps ax | grep '/srv/ssg/helpers/' | grep -v grep | awk '{print $1}' | xargs)

    if [ -z "$BUILPROCESSES" ]
    then
        :
    else
        echo -n "Tapan SSG PID'd "
        ARRAY=($BUILPROCESSES)

        for (( n=0; n < ${#ARRAY[*]}; n++ ))
        do
            if [ $(($n+1)) = ${#ARRAY[*]} ]
            then
                echo -n "${ARRAY[n]}."
            else
                echo -n "${ARRAY[n]}, "
            fi
        done
        kill $BUILPROCESSES
    fi
fi
