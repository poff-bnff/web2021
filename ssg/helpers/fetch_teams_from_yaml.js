const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js');
const util = require("util")

const sourceDir =  path.join(__dirname, '..', 'source');
const fetchDir =  path.join(sourceDir, '_fetchdir');
const fetchDataDir =  path.join(fetchDir, 'teamsandjuries');
const strapiDataDirPath = path.join(sourceDir, 'strapidata')

const strapiDataTeamPath = path.join(strapiDataDirPath, 'Team.yaml')
const STRAPIDATA_TEAM = yaml.safeLoad(fs.readFileSync(strapiDataTeamPath, 'utf8'))
const strapiDataPersonPath = path.join(strapiDataDirPath, 'Person.yaml')
const STRAPIDATA_PERSONS = yaml.safeLoad(fs.readFileSync(strapiDataPersonPath, 'utf8'))
const DOMAIN = process.env['DOMAIN'] || 'poff.ee';

const languages = ['en', 'et', 'ru']
for (const ix in languages) {
    const lang = languages[ix];
    console.log(`Fetching ${DOMAIN} teams and juries ${lang} data`);

    allData = []
    for (const ix in STRAPIDATA_TEAM) {
        let element = JSON.parse(JSON.stringify(STRAPIDATA_TEAM[ix]));

        if (DOMAIN === 'justfilm.ee') {
            var templateDomainName = 'justfilm';
        } else if (DOMAIN === 'shorts.poff.ee') {
            var templateDomainName = 'shorts';
        } else if (DOMAIN === 'kinoff.poff.ee') {
            var templateDomainName = 'kinoff';
        } else if (DOMAIN === 'industry.poff.ee') {
            var templateDomainName = 'industry';
        } else {
            var templateDomainName = 'poff';
        }

        if (element.groupType) {
            var templateGroupName = element.groupType.toLowerCase();
        } else {
            console.log('ERROR!: Team templateGroupName missing for team with ID no ', element.id);
            continue;
        }

        for (const subTeamIx in element.subTeam) {
            let subTeam = element.subTeam[subTeamIx];
            for (const juryMemberIx in subTeam.juryMember) {
                let juryMember = subTeam.juryMember[juryMemberIx];
                let personFromYAML = STRAPIDATA_PERSONS.filter( (a) => { return juryMember.person.id === a.id });
                juryMember.person = personFromYAML[0];
            }
        }
        // rueten func. is run for each element separately instead of whole data, that is
        // for the purpose of saving slug_en before it will be removed by rueten func.
        let dirSlug = element.slug_en || element.slug_et ? element.slug_en || element.slug_et : null ;
        element = rueten(element, lang);
        element.data = {'articles': '/_fetchdir/articles.' + lang + '.yaml'};
        if ('slug' in element) {
            element.path = element.slug;
        } else {
            continue
        }

        //console.log(util.inspect(element, false, 10))
        const oneYaml = yaml.safeDump(element, { 'noRefs': true, 'indent': '4' });

        if (dirSlug != null) {
            const yamlPath = path.join(fetchDataDir, dirSlug, `data.${lang}.yaml`);
            let saveDir = path.join(fetchDataDir, dirSlug);
            fs.mkdirSync(saveDir, { recursive: true });

            fs.writeFileSync(yamlPath, oneYaml, 'utf8');
            fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/${templateGroupName}_${templateDomainName}_index_template.pug`)
        }
        allData.push(element);
    }

    //console.log(util.inspect(allData, false, 10))
    const allDataYAML = yaml.safeDump(allData, { 'noRefs': true, 'indent': '4' });
    const yamlPath = path.join(fetchDir, `teams.${lang}.yaml`);
    fs.writeFileSync(yamlPath, allDataYAML, 'utf8');
}
