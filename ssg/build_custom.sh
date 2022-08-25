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
    elif [ $new_number -lt 12 ] && [ $new_number -gt 0 ]
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
        let fetch_number=$new_number
        ask_if_simplify_build $site_name $fetch_number
        # build $site_name $fetch_number
    else
        echo "Incorrect option, try again!"
        ask_if_fetch $site_name
    fi
}

ask_if_simplify_build()
{
    ANYDIRECTORIES=$(ls -ld ./source/_fetchdir/*/ 2> /dev/null)

    if [ -z "$ANYDIRECTORIES" ] && [ $fetch_number -eq 2 ]; then
        printf '\n----------\nPrevious build has already been simplified, continuing with simplified build\n'
        printf 'For non-simplified full build you need to re-fetch data\n'
        let simplify_build_number=1
        build $site_name $fetch_number $simplify_build_number
    else
        :
    fi

    printf '\n----------\nSelect: \n1 To simplify build (skip building subpages [separate articles, cassettes, events etc]) \n2 To not simplify build\n0 to EXIT\n'
    read new_number

    if [ $new_number -eq 0 ]
    then
        runexit
    elif [ $new_number -lt 3 ] && [ $new_number -gt 0 ]
    then
        let simplify_build_number=$new_number
        build $site_name $fetch_number $simplify_build_number
    else
        echo "Incorrect option, try again!"
        ask_if_simplify_build $site_name $fetch_number
    fi
}

build()
{
    SECONDS=0
    export DOMAIN=$site_name

    node ./initialise_entu_ssg.js

    printf "\n----------\nBuilding $DOMAIN \n"
    if [ $fetch_number -eq 1 ]
    then
        printf "\nStarting to fetch new data:\n"
        fetch_data
    fi

    if [ $site_name ]
    then

        BUILDDIR=$(node ./helpers/name_build_directory.js)
        echo "Build directory: $BUILDDIR"

        printf '\n----------                  Processing styles                ----------\n\n'
        node ./helpers/copy_styles_acc_to_domain.js
        printf '\n----------             Finished processing styles            ----------\n'

        printf "\nBuilding...\n"
        [ -d "./build/$BUILDDIR" ] && rm -r "./build/$BUILDDIR"
        [ ! -d "./build/$BUILDDIR" ] && mkdir -p "./build/$BUILDDIR"
        [ ! -d "./build/$BUILDDIR/assets" ] && mkdir -p "./build/$BUILDDIR/assets"

        cp -R "assets/"* "build/$BUILDDIR/assets"

        # if [ "$DOMAIN" == "poff.ee" ]
        # then
        #     printf '\n----------             Extract POFF 2020 to build dir           ----------\n\n'
        #     # cp -R "source/_archives/2020_poff/"* "build/$BUILDDIR"
        #     tar -xzf "source/_archives/2020_BNFF.tar.gz" -C "build/$BUILDDIR" --strip-components=1
        #     printf '\n----------               Finished Extracting POFF 2020              ----------\n'
        # fi

        printf '\n----------                  Adding ignore paths                ----------\n\n'
        node ./helpers/add_config_ignorePaths.js
        printf '\n----------               Finished adding ignore paths            ----------\n'


        if [ $simplify_build_number -eq 1 ]
        then
            printf "\nSimplifying build:\n"
            simplify_build
        fi

        node ./node_modules/entu-ssg/src/build.js ./entu-ssg.yaml full

    fi

    duration=$SECONDS
    minutes=$((duration/60))
    seconds=$((duration%60))
    printf "\n\n$site_name\nBUILD FINISHED IN $minutes m $seconds s.\n\n"

    ask_what_to_build

}

runexit()
{
    echo '==== custom build ==== EXITING'
    exit
}

fetch_data()
{

    [ -d "source/_fetchdir" ] && rm -r source/_fetchdir/
    [ -d "source/_fetchdirRestricted" ] && rm -r source/_fetchdirRestricted/
    [ ! -d "source/_fetchdir" ] && mkdir -p source/_fetchdir
    [ ! -d "source/_fetchdirRestricted" ] && mkdir -p source/_fetchdirRestricted
    [ -d "assets/xml" ] && rm -r assets/xml/


    echo '==== custom build ==== Fetch strapiData.yaml from Strapi'
    node ./helpers/a_fetch.js

    printf '\n\n==== custom build ==== process all Strapidata by Domain\n'
    node ./helpers/d_fetch.js

    printf '\n---------- Creating separate YAML files from strapiData.yaml ----------\n\n'
    echo '==== custom build ==== fetch_articles_from_yaml'
    node ./helpers/fetch_articles_from_yaml.js

    echo '==== custom build ==== fetch_industry_person_from_yaml'
    node ./helpers/fetch_industry_person_from_yaml.js

    echo '==== custom build ==== fetch_article_types_from_yaml'
    node ./helpers/fetch_article_type_from_yaml.js

    echo '==== custom build ==== fetch_heroarticle_from_yaml'
    node ./helpers/fetch_heroarticle_from_yaml.js

    echo '==== custom build ==== fetch_trioblock_from_yaml'
    node ./helpers/fetch_trioblock_from_yaml.js

    echo '==== custom build ==== fetch_teams_from_yaml'
    node ./helpers/fetch_teams_from_yaml.js

    echo '==== custom build ==== fetch_supporter_page_from_yaml'
    node ./helpers/fetch_supporter_page_from_yaml.js

    # labels, footer and menu are fetched to global
    # labels uses static global (first to fetch)

    echo '==== custom build ==== fetch_labels_from_yaml'
    node ./helpers/fetch_labels_from_yaml.js

    echo '==== custom build ==== fetch_footer_from_yaml'
    node ./helpers/fetch_footer_from_yaml.js

    echo '==== custom build ==== fetch_menu_from_yaml'
    node ./helpers/fetch_menu_from_yaml.js

    echo '==== custom build ==== fetch_programmes_from_yaml'
    node ./helpers/fetch_programmes_from_yaml.js

    echo '==== custom build ==== fetch_cassettes_from_yaml'
    node ./helpers/fetch_cassettes_from_yaml.js

    # echo '==== custom build ==== fetch_cassettes_archive_from_yaml'
    # node ./helpers/fetch_cassettes_archive_from_yaml.js

    echo '==== custom build ==== fetch_six_film_block_from_yaml'
    node ./helpers/fetch_six_film_block_from_yaml.js

    echo '==== custom build ==== fetch_screenings_from_yaml'
    node ./helpers/fetch_screenings_from_yaml.js

    echo '==== custom build ==== assets/xml'
    node ./helpers/xml.js

    echo '==== custom build ==== fetch_shops_from_yaml'
    node ./helpers/fetch_shops_from_yaml.js

    # echo '==== custom build ==== fetch_industry_person_from_yaml'
    # node ./helpers/fetch_industry_person_from_yaml.js

    echo '==== custom build ==== fetch_industry_project_from_yaml'
    node ./helpers/fetch_industry_project_from_yaml.js

    echo '==== custom build ==== fetch_discamp_project_from_yaml'
    node ./helpers/fetch_industry_project_from_yaml.js

    # echo '==== custom build ==== fetch_industry_channels_from_yaml'
    # node ./helpers/fetch_channels_from_yaml.js

    # echo '==== custom build ==== fetch_industry_event_from_yaml'
    # node ./helpers/fetch_industry_event_from_yaml.js

    echo '==== custom build ==== fetch_discamp_event_from_yaml'
    node ./helpers/fetch_industry_event_from_yaml.js

    echo '==== custom build ==== fetch_eventival_persons_from_yaml.js'
    node ./helpers/fetch_eventival_persons_from_yaml.js

    # echo '==== custom build ==== fetch_courses_from_yaml.js'
    # node ./helpers/fetch_courses_from_yaml.js

    echo '==== custom build ==== fetch_course_event_from_yaml'
    node ./helpers/fetch_course_event_from_yaml.js

    echo '==== custom build ==== fetch_frontpagecourse_block_from_yaml.js'
    node ./helpers/fetch_frontpagecourse_block_from_yaml.js

    echo '==== custom build ==== fetch_person_from_yaml.js'
    node ./helpers/fetch_person_from_yaml.js

    printf '\n----------        FINISHED creating separate YAML files      ----------\n'

}

simplify_build()
{
    echo 'Simplified build...'
    rm -rf ./source/_fetchdir/*/
}

ask_what_to_build
