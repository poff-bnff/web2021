BUILDOPTION[0]="poff.ee"
BUILDOPTION[1]="justfilm.ee"
BUILDOPTION[2]="kinoff.poff.ee"
BUILDOPTION[3]="industry.poff.ee"
BUILDOPTION[4]="shorts.poff.ee"
BUILDOPTION[5]="hoff.ee"

ask_what_to_build()
{
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
    elif [ $new_number -lt 6 ] && [ $new_number -gt 0 ]
    then
        let site_number=$new_number-1
        site_name=${BUILDOPTION[site_number]}
        printf "You selected to build $site_name\n\n----------\nNow choose options:\n"
        ask_if_fetch $site_name
    else
        echo "Incorrect option, try again!"
        ask_what_to_build
    fi
}

ask_if_fetch()
{
    printf 'Select: \n1 to fetch new data\n2 to not fetch new data\n0 to EXIT\n'
    read new_number

    if [ $new_number -eq 0 ]
    then
        runexit
    elif [ $new_number -lt 3 ] && [ $new_number -gt 0 ]
    then
        if [ $new_number -eq 2 ]
        then
            let fetch_number=$new_number
            # ask_if_download_img $site_name $fetch_number
            build $site_name $fetch_number
        elif [ $new_number -eq 1 ]
        then
            let fetch_number=$new_number
            ask_cassette_limit $site_name $fetch_number
        fi
    else
        echo "Incorrect option, try again!"
        ask_if_fetch $site_name
    fi

}

ask_cassette_limit()
{
    printf '\nEnter how many cassettes to fetch or enter 0 for all.\n'
    read new_number

    if [ $new_number -eq 0 ]
    then
        let limit_number=$new_number
        # ask_if_download_img $site_name $fetch_number $limit_number
        build $site_name $fetch_number $limit_number
    elif [ $new_number -gt 0 ]
    then
        let limit_number=$new_number
        # ask_if_download_img $site_name $fetch_number $limit_number
        build $site_name $fetch_number $limit_number
    else
        echo "Incorrect option, try again!"
        ask_if_fetch $site_name $fetch_number
    fi

}

# ask_if_download_img()
# {
#     printf '\n----------\nSelect: \n1 to download all images\n2 to not download all images\n0 to EXIT\n'
#     read new_number

#     if [ $new_number -eq 0 ]
#     then
#         runexit
#     elif [ $new_number -lt 3 ] && [ $new_number -gt 0 ]
#     then
#         let download_number=$new_number
#         build $site_name $fetch_number $limit_number $download_number
#     else
#         echo "Incorrect option, try again!"
#         ask_if_download_img $site_name $fetch_number $limit_number
#     fi
# }

build()
{
    SECONDS=0
    export DOMAIN=$site_name
    export CASSETTELIMIT=$limit_number

    node ./initialise_entu_ssg.js

    printf "\n----------\nBuilding $DOMAIN \n"
    if [ $fetch_number -eq 1 ]
    then
        printf "\nStarting to fetch new data:\n"
        fetch_data
    fi

    # if [ $download_number -eq 1 ]
    # then
    #     printf "\nStarting to download new images:\n"
    #     download_img
    # fi

    if [ $site_name ]
    then


        printf '\n----------                  Processing styles                ----------\n\n'
        node ./helpers/copy_styles_acc_to_domain.js
        printf '\n----------             Finished processing styles            ----------\n'

        printf "\nBuilding...\n"
        [ -d "build" ] && rm -r build/*
        [ ! -d "build" ] && mkdir -p build
        [ ! -d "build/assets" ] && mkdir -p build/assets


        cp -R assets/* build/assets/
        node ./node_modules/entu-ssg/src/build.js ./entu-ssg.yaml full

    fi

    duration=$SECONDS
    minutes=$((duration/60))
    seconds=$((duration%60))
    printf "\n\nBUILD FINISHED IN $minutes m $seconds s.\n\n"

    ask_what_to_build

}

runexit()
{
    echo '==== limited build ==== EXITING'
    exit
}

fetch_data()
{

    [ -d "source/_fetchdir" ] && rm -r source/_fetchdir/*
    [ ! -d "source/_fetchdir" ] && mkdir -p source/_fetchdir
    [ -d "assets/xml" ] && rm -r assets/xml/*


    echo '==== limited build ==== Fetch strapiData.yaml from Strapi'
    node ./helpers/a_fetch.js

    printf '\n\n---------- Creating separate YAML files from strapiData.yaml ----------\n\n'
    echo '==== limited build ==== fetch_articles_from_yaml'
    node ./helpers/fetch_articles_from_yaml.js

    echo '==== limited build ==== fetch_industry_person_from_yaml'
    node ./helpers/fetch_industry_person_from_yaml.js

    echo '==== limited build ==== fetch_article_types_from_yaml'
    node ./helpers/fetch_article_type_from_yaml.js

    echo '==== limited build ==== fetch_heroarticle_from_yaml'
    node ./helpers/fetch_heroarticle_from_yaml.js

    echo '==== limited build ==== fetch_trioblock_from_yaml'
    node ./helpers/fetch_trioblock_from_yaml.js

    echo '==== limited build ==== fetch_teams_from_yaml'
    node ./helpers/fetch_teams_from_yaml.js

    echo '==== limited build ==== fetch_supporter_page_from_yaml'
    node ./helpers/fetch_supporter_page_from_yaml.js

    # labels, footer and menu are fetched to global
    # labels uses static global (first to fetch)

    echo '==== limited build ==== fetch_labels_from_yaml'
    node ./helpers/fetch_labels_from_yaml.js

    echo '==== limited build ==== fetch_footer_from_yaml'
    node ./helpers/fetch_footer_from_yaml.js

    echo '==== limited build ==== fetch_menu_from_yaml'
    node ./helpers/fetch_menu_from_yaml.js

    echo '==== limited build ==== fetch_programmes_from_yaml'
    node ./helpers/fetch_programmes_from_yaml.js

    echo '==== limited build ==== fetch_cassettes_from_yaml'
    node ./helpers/fetch_cassettes_from_yaml.js

    echo '==== limited build ==== fetch_six_film_block_from_yaml'
    node ./helpers/fetch_six_film_block_from_yaml.js

    echo '==== limited build ==== fetch_screenings_from_yaml'
    node ./helpers/fetch_screenings_from_yaml.js

    echo '==== limited build ==== fetch_shops_from_yaml'
    node ./helpers/fetch_shops_from_yaml.js

    echo '==== limited build ==== assets/xml'
    node ./helpers/xml.js

    echo '==== limited build ==== fetch_industry_project_from_yaml'
    node ./helpers/fetch_industry_project_from_yaml.js

    echo '==== limited build ==== fetch_industry_channels_from_yaml'
    node ./helpers/fetch_channels_from_yaml.js

    echo '==== limited build ==== fetch_industry_event_from_yaml'
    node ./helpers/fetch_industry_event_from_yaml.js

    echo '==== limited build ==== fetch_eventival_persons_from_yaml.js'
    node ./helpers/fetch_eventival_persons_from_yaml.js

    printf '\n----------        FINISHED creating separate YAML files      ----------\n'

}

# download_img()
# {
#     [ -d "build/assets" ] && rm -r build/*
#     [ ! -d "build/assets" ] && mkdir -p build/assets
#     [ -d "assets/img/dynamic" ] && rm -r assets/img/dynamic/*

#     printf '\n----------         Downloading all img from Strapi         ----------\n\n'
#     node ./helpers/download_article_img.js
#     node ./helpers/download_footer_img.js
#     node ./helpers/download_teams_img.js
#     node ./helpers/download_cassette_films_credentials_img.js
#     node ./helpers/download_organisations_img.js
#     # node ./helpers/download_persons_img.js
#     node ./helpers/download_trioblock_img.js
#     node ./helpers/download_supporters_page_img.js
#     node ./helpers/download_programmes_img.js
#     node ./helpers/download_shops_img.js
#     node ./helpers/download_industry_person_img.js
#     node ./helpers/download_industry_project_img.js
#     # node ./helpers/download_casettes_and_films_img.js
#     printf '\n\n----------     Finished downloading all img from Strapi    ----------\n\n'
# }

ask_what_to_build
