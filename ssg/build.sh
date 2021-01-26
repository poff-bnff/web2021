
# ls -lRm assets/img/dynamic/img_films/* > uusfail.txt
# node ./helpers/compile_film_pictures.js
# node ./helpers/compile_article_pictures.js

echo 'STARTING BUILD'
[ -d "build" ] && rm -r build/*
[ ! -d "build" ] && mkdir -p build
[ ! -d "build/assets" ] && mkdir -p build/assets
[ -d "source/_fetchdir" ] && rm -r source/_fetchdir/*
[ ! -d "source/_fetchdir" ] && mkdir -p source/_fetchdir
[ -d "assets/img/dynamic" ] && rm -r assets/img/dynamic/*
[ -d "assets/xml" ] && rm -r assets/xml/*

echo initialise entu_ssg.yaml
node ./initialise_entu_ssg.js

echo 'Fetch strapiData.yaml from Strapi'
node ./helpers/a_fetch.js

printf '\n\n---------- Creating separate YAML files from strapiData.yaml ----------\n\n'
echo 'fetch_articles_from_yaml'
node ./helpers/fetch_articles_from_yaml.js

echo 'fetch_industry_person_from_yaml'
node ./helpers/fetch_industry_person_from_yaml.js

echo 'fetch_article_type_from_yaml'
node ./helpers/fetch_article_type_from_yaml.js

echo 'fetch_heroarticle_from_yaml'
node ./helpers/fetch_heroarticle_from_yaml.js

echo 'fetch_trioblock_from_yaml'
node ./helpers/fetch_trioblock_from_yaml.js

echo 'fetch_teams_from_yaml'
node ./helpers/fetch_teams_from_yaml.js

echo 'fetch_supporter_page_from_yaml'
node ./helpers/fetch_supporter_page_from_yaml.js

# labels, footer and menu are fetched to global
# labels uses static global (first to fetch)

echo 'fetch_labels_from_yaml'
node ./helpers/fetch_labels_from_yaml.js

echo 'fetch_footer_from_yaml'
node ./helpers/fetch_footer_from_yaml.js

echo 'fetch_menu_from_yaml'
node ./helpers/fetch_menu_from_yaml.js

echo 'fetch_programmes_from_yaml'
node ./helpers/fetch_programmes_from_yaml.js

echo 'fetch_cassettes_from_yaml'
node ./helpers/fetch_cassettes_from_yaml.js

echo 'fetch_six_film_block_from_yaml'
node ./helpers/fetch_six_film_block_from_yaml.js

echo 'fetch_screenings_from_yaml'
node ./helpers/fetch_screenings_from_yaml.js

echo 'fetch_shops_from_yaml'
node ./helpers/fetch_shops_from_yaml.js

echo 'assets/xml'
node ./helpers/xml.js

echo 'fetch_industry_person_from_yaml'
node ./helpers/fetch_industry_person_from_yaml.js

echo 'fetch_industry_project_from_yaml'
node ./helpers/fetch_industry_project_from_yaml.js

echo 'fetch_industry_channels_from_yaml'
node ./helpers/fetch_channels_from_yaml.js

echo 'fetch_industry_event_from_yaml'
node ./helpers/fetch_industry_event_from_yaml.js

echo 'fetch_eventival_persons_from_yaml.js'
node ./helpers/fetch_eventival_persons_from_yaml.js

printf '\n----------        FINISHED creating separate YAML files      ----------\n'

printf '\n----------         Downloading all img from Strapi         ----------\n\n'
# node ./helpers/download_article_img.js
# node ./helpers/download_footer_img.js
# node ./helpers/download_teams_img.js
# node ./helpers/download_cassette_films_credentials_img.js
# node ./helpers/download_organisations_img.js
# # node ./helpers/download_persons_img.js
# node ./helpers/download_trioblock_img.js
# node ./helpers/download_supporters_page_img.js
# node ./helpers/download_programmes_img.js
# node ./helpers/download_shops_img.js
# node ./helpers/download_industry_person_img.js
# node ./helpers/download_industry_project_img.js
# # node ./helpers/download_casettes_and_films_img.js
printf '\n\n----------     Finished downloading all img from Strapi    ----------\n\n'


printf '\n----------                  Processing styles                ----------\n\n'
node ./helpers/copy_styles_acc_to_domain.js
printf '\n----------             Finished processing styles            ----------\n'

cp -R assets/* build/assets/
node ./node_modules/entu-ssg/src/build.js ./entu-ssg.yaml full

