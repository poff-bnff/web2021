SECONDS=0
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR
echo $PWD

# 1
# ls -lRm assets/img/dynamic/img_films/* > uusfail.txt
# nice -10 node ./helpers/compile_film_pictures.js
# nice -10 node ./helpers/compile_article_pictures.js

BUILDDIR=$(nice -10 node ./helpers/name_build_directory.js)
echo "Build directory: $BUILDDIR"

echo "STARTING BUILD.SH"
[ ! -d "./build" ] && mkdir -p "./build"
[ -d "./build/$BUILDDIR" ] && rm -r "./build/$BUILDDIR/"*
[ ! -d "./build/$BUILDDIR" ] && mkdir -p "./build/$BUILDDIR"
[ ! -d "./build/$BUILDDIR/assets/" ] && mkdir -p "./build/$BUILDDIR/assets/"
[ -d "./source/_fetchdir" ] && rm -r "./source/_fetchdir/"
[ ! -d "./source/_fetchdir" ] && mkdir -p "./source/_fetchdir"
[ -d "./source/_fetchdirRestricted" ] && rm -r "./source/_fetchdirRestricted/"
[ ! -d "./source/_fetchdirRestricted" ] && mkdir -p "./source/_fetchdirRestricted"
[ -d "./assets/img/dynamic" ] && rm -r "./assets/img/dynamic/"
[ -d "./assets/xml" ] && rm -r "./assets/xml/"

echo initialise entu_ssg.yaml
nice -10 node ./helpers/initialise_entu_ssg.js
status=$?;[ $status -eq 0 ] && echo 'initialise entu_ssg.yaml succeeded' || echo 'initialise entu_ssg.yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'Fetch strapiData.yaml from Strapi'
nice -10 node ./helpers/a_fetch.js
status=$?;[ $status -eq 0 ] && echo 'Fetch strapiData.yaml succeeded' || echo 'Fetch strapiData.yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'Processing all Strapidata by Domain'
nice -10 node ./helpers/d_fetch.js
status=$?;[ $status -eq 0 ] && echo 'Processing all Strapidata by Domain succeeded' || echo 'Processing all Strapidata by Domain failed. Exit'
[ $status -ne 0 ] && exit $status

printf '\n\n---------- Creating separate YAML files from strapiData.yaml ----------\n\n'
echo 'fetch_articles_from_yaml'
nice -10 node ./helpers/fetch_articles_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_articles_from_yaml succeeded' || echo 'fetch_articles_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'fetch_article_type_from_yaml'
nice -10 node ./helpers/fetch_article_type_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_article_type_from_yaml succeeded' || echo 'fetch_article_type_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'fetch_heroarticle_from_yaml'
nice -10 node ./helpers/fetch_heroarticle_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_heroarticle_from_yaml succeeded' || echo 'fetch_heroarticle_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'fetch_trioblock_from_yaml'
nice -10 node ./helpers/fetch_trioblock_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_trioblock_from_yaml succeeded' || echo 'fetch_trioblock_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'fetch_teams_from_yaml'
nice -10 node ./helpers/fetch_teams_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_teams_from_yaml succeeded' || echo 'fetch_teams_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'fetch_supporter_page_from_yaml'
nice -10 node ./helpers/fetch_supporter_page_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_supporter_page_from_yaml succeeded' || echo 'fetch_supporter_page_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

# labels, footer and menu are fetched to global
# labels uses static global (first to fetch)

echo 'fetch_labels_from_yaml'
nice -10 node ./helpers/fetch_labels_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_labels_from_yaml succeeded' || echo 'fetch_labels_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'fetch_footer_from_yaml'
nice -10 node ./helpers/fetch_footer_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_footer_from_yaml succeeded' || echo 'fetch_footer_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'fetch_menu_from_yaml'
nice -10 node ./helpers/fetch_menu_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_menu_from_yaml succeeded' || echo 'fetch_menu_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'fetch_menu2_from_yaml'
nice -10 node ./helpers/fetch_menu2_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_menu2_from_yaml succeeded' || echo 'fetch_menu2_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'fetch_programmes_from_yaml'
nice -10 node ./helpers/fetch_programmes_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_programmes_from_yaml succeeded' || echo 'fetch_programmes_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'fetch_cassettes_from_yaml'
nice -10 node ./helpers/fetch_cassettes_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_cassettes_from_yaml succeeded' || echo 'fetch_cassettes_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'fetch_six_film_block_from_yaml'
nice -10 node ./helpers/fetch_six_film_block_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_six_film_block_from_yaml succeeded' || echo 'fetch_six_film_block_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'fetch_screenings_from_yaml'
nice -10 node ./helpers/fetch_screenings_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_screenings_from_yaml succeeded' || echo 'fetch_screenings_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'fetch_shops_from_yaml'
nice -10 node ./helpers/fetch_shops_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_shops_from_yaml succeeded' || echo 'fetch_shops_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'assets/xml'
nice -10 node ./helpers/xml.js
status=$?;[ $status -eq 0 ] && echo 'assets/xml succeeded' || echo 'assets/xml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'fetch_industry_project_from_yaml'
nice -10 node ./helpers/fetch_industry_project_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_industry_project_from_yaml succeeded' || echo 'fetch_industry_project_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

# echo 'fetch_industry_channels_from_yaml'
# nice -10 node ./helpers/fetch_channels_from_yaml.js

# echo 'fetch_industry_event_from_yaml'
# nice -10 node ./helpers/fetch_industry_event_from_yaml.js

echo 'fetch_eventival_persons_from_yaml.js'
nice -10 node ./helpers/fetch_eventival_persons_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_eventival_persons_from_yaml succeeded' || echo 'fetch_eventival_persons_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'fetch_course_event_from_yaml'
nice -10 node ./helpers/fetch_course_event_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_course_event_from_yaml succeeded' || echo 'fetch_course_event_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

# echo 'fetch_courses_from_yaml.js'
# nice -10 node ./helpers/fetch_courses_from_yaml.js

echo 'fetch_frontpagecourse_block_from_yaml.js'
nice -10 node ./helpers/fetch_frontpagecourse_block_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_frontpagecourse_block_from_yaml succeeded' || echo 'fetch_frontpagecourse_block_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

echo 'fetch_locations_from_yaml'
nice -10 node ./helpers/fetch_locations_from_yaml.js
status=$?;[ $status -eq 0 ] && echo 'fetch_locations_from_yaml succeeded' || echo 'fetch_locations_from_yaml failed. Exit'
[ $status -ne 0 ] && exit $status

printf '\n----------        FINISHED creating separate YAML files      ----------\n'

printf '\n----------         Downloading all img from Strapi         ----------\n\n'
# nice -10 node ./helpers/download_article_img.js
# nice -10 node ./helpers/download_footer_img.js
# nice -10 node ./helpers/download_teams_img.js
# nice -10 node ./helpers/download_cassette_films_credentials_img.js
# nice -10 node ./helpers/download_organisations_img.js
# # nice -10 node ./helpers/download_persons_img.js
# nice -10 node ./helpers/download_trioblock_img.js
# nice -10 node ./helpers/download_supporters_page_img.js
# nice -10 node ./helpers/download_programmes_img.js
# nice -10 node ./helpers/download_shops_img.js
# nice -10 node ./helpers/download_industry_person_img.js
# nice -10 node ./helpers/download_industry_project_img.js
# # nice -10 node ./helpers/download_casettes_and_films_img.js
printf '\n\n----------     Finished downloading all img from Strapi    ----------\n\n'


printf '\n----------                  Processing styles                ----------\n\n'
nice -10 node ./helpers/copy_styles_acc_to_domain.js
status=$?;[ $status -eq 0 ] && echo 'copy_styles_acc_to_domain succeeded' || echo 'copy_styles_acc_to_domain failed. Exit'
[ $status -ne 0 ] && exit $status
printf '\n----------             Finished processing styles            ----------\n'

cp -R "assets/"* "build/$BUILDDIR/assets"
status=$?;[ $status -eq 0 ] && echo 'copy assets succeeded' || echo 'copy assets failed. Exit'
[ $status -ne 0 ] && exit $status

if [ "$DOMAIN" == "poff.ee" ]
then
    printf '\n----------             Extract POFF 2020 to build dir           ----------\n\n'
    # cp -R "source/_archives/2020_poff/"* "build/$BUILDDIR"
    tar -xzf "source/_archives/2020_BNFF.tar.gz" -C "build/$BUILDDIR" --strip-components=1
    printf '\n----------               Finished Extracting POFF 2020              ----------\n'
fi

printf '\n----------                  Adding ignore paths                ----------\n\n'
nice -10 node ./helpers/add_config_ignorePaths.js
printf '\n----------               Finished adding ignore paths            ----------\n'

nice -10 node ./node_modules/entu-ssg/src/build.js ./entu-ssg.yaml full

[ -d "../www/build.$DOMAIN" ] && rm -r "../www/build.$DOMAIN/"*
[ ! -d "../www/build.$DOMAIN" ] && mkdir -p "../www/build.$DOMAIN"

echo "RSYNC ./build/$BUILDDIR/. ../www/build.$DOMAIN"/
rsync -ra ./build/"$BUILDDIR"/. ../www/build."$DOMAIN"/
status=$?;[ $status -eq 0 ] && echo 'rsync succeeded' || echo 'rsync failed. Exit'
[ $status -ne 0 ] && exit $status

echo build.sh finished
