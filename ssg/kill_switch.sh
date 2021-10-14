SECONDS=0
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR

QUEUEFILE="$PWD"/helpers/build_queue.yaml

if [ -f "$QUEUEFILE" ]; then
    rm "$QUEUEFILE"
    echo "Build_queue kustutatud."
else
    echo "Järjekorda ei eksisteeri."
fi

if [ -n "$1" ]; then
    if [ -d "/proc/$1" ]
    then
        kill "$1"
        echo "PID $1 tapetud."
    else
        echo "PID $1 ei eksisteeri."
    fi
fi
