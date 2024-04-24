BUILDOPTION[0]="poff.ee"
BUILDOPTION[1]="justfilm.ee"
BUILDOPTION[2]="kinoff.poff.ee"
BUILDOPTION[3]="industry.poff.ee"
BUILDOPTION[4]="shorts.poff.ee"
BUILDOPTION[5]="hoff.ee"
BUILDOPTION[6]="kumu.poff.ee"
BUILDOPTION[7]="tartuff.ee"
BUILDOPTION[8]="oyafond.ee"
BUILDOPTION[9]="filmikool.poff.ee"
BUILDOPTION[10]="discoverycampus.poff.ee"

FOLDER[0]="poff"
FOLDER[1]="justfilm"
FOLDER[2]="kinoff"
FOLDER[3]="industry"
FOLDER[4]="shorts"
FOLDER[5]="hoff"
FOLDER[6]="kumu"
FOLDER[7]="tartuff"
FOLDER[8]="bruno"
FOLDER[9]="filmikool"
FOLDER[10]="discamp"

ask_what_to_show()
{
    if [ ! -f './is_dev.flag' ]
    then
        printf 'Not in Dev environment \n'
        runexit
    fi

    printf '\n----------\nSelect: \n'
    for i in "${!BUILDOPTION[@]}"
    do
        let choosenumber=$i+1
        echo "$choosenumber for building ${BUILDOPTION[$i]}"
    done
    printf '0 to EXIT\n'
    read new_number

    if [ $new_number -eq 0 ]
    then
        runexit
    elif [ $new_number -lt 12 ] && [ $new_number -gt 0 ]
    then
        let site_number=$new_number-1
        site_name=${BUILDOPTION[site_number]}
        site_folder=${FOLDER[site_number]}
        printf "You selected to show $site_name\n\n"
        change_build $site_name $site_folder
    else
        echo "Incorrect option, try again!"
        ask_what_to_show
    fi
}

change_build()
{
    echo 'Changing site to show...'
    rm -rf ./build/web && ln -s ./"$site_folder" ./build/web
    printf "\n\nShowing site $site_name\n\n"

    ask_what_to_show
}

runexit()
{
    echo '==== Changing dev site ==== EXITING'
    exit
}


ask_what_to_show