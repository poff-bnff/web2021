BUILDOPTION[0]="poff.ee"
BUILDOPTION[1]="justfilm.ee"
BUILDOPTION[2]="kinoff.poff.ee"
BUILDOPTION[3]="industry.poff.ee"
BUILDOPTION[4]="shorts.poff.ee"

ask_what_to_serve()
{
    printf '\nCUSTOM SERVE:\n----------\nSelect: \n'
    for i in "${!BUILDOPTION[@]}"
    do
        let choosenumber=$i+1
        echo "$choosenumber for serving ${BUILDOPTION[$i]}"
    done
    printf '0 to EXIT\n'
    read new_number

    if [ $new_number -eq 0 ]
    then
        runexit
    elif [ $new_number -lt 6 ] && [ $new_number -gt 0 ]
    then
        let site_number=$new_number-1
        site_name=${BUILDOPTION[site_number]}
        printf "\n----------\nStarting to serve $site_name\nPress CTRL+C to exit serve process and return to menu\n"
        serve $site_name
    else
        echo "Incorrect option, try again!"
        ask_what_to_serve
    fi
}



serve()
{
    SECONDS=0

    export DOMAIN=$site_name


    if [ $site_name ]
    then
        printf "\nServing...\n"
        . ./ssg_serve.sh

    fi

    duration=$SECONDS
    minutes=$((duration/60))
    seconds=$((duration%60))
    printf "SERVE WAS CANCELLED AFTER $minutes m $seconds s.\n\n"
    ask_what_to_serve
}

runexit()
{
    echo 'EXITING'
    exit
}

ask_what_to_serve
