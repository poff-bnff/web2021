const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js');
const prioritizeImages = require(path.join(__dirname, 'image_prioritizer.js'))

const rootDir = path.join(__dirname, '..')
const sourceDir = path.join(rootDir, 'source');
const fetchDir = path.join(sourceDir, '_fetchdir');
const fetchDataDir = path.join(fetchDir, 'teamsandjuries');
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
const imageOrderTeam = DOMAIN_SPECIFICS.festivalTeamImagePriority
const imageOrderTeamDefaults = DOMAIN_SPECIFICS.festivalTeamImagePriorityDefaults
const imageOrderJuryAndGuest = DOMAIN_SPECIFICS.juryAndGuestImagePriority
const imageOrderJuryAndGuestDefaults = DOMAIN_SPECIFICS.juryAndGuestImagePriorityDefaults

const strapiDataTeamPath = path.join(strapiDataDirPath, 'Team.yaml')
const STRAPIDATA_TEAM = yaml.load(fs.readFileSync(strapiDataTeamPath, 'utf8'))
const strapiDataPersonPath = path.join(strapiDataDirPath, 'Person.yaml')
const STRAPIDATA_PERSONS = yaml.load(fs.readFileSync(strapiDataPersonPath, 'utf8'))
const DOMAIN = process.env['DOMAIN'] || 'kumu.poff.ee';

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
        } else if (DOMAIN === 'discoverycampus.poff.ee') {
            var templateDomainName = 'discamp';
        } else if (DOMAIN === 'kumu.poff.ee') {
            var templateDomainName = 'kumu';
        } else if (DOMAIN === 'tartuff.ee') {
            var templateDomainName = 'tartuff';
        } else if (DOMAIN === 'filmikool.poff.ee') {
            var templateDomainName = 'filmikool';
        } else if (DOMAIN === 'oyafond.ee') {
            var templateDomainName = 'bruno';
        } else {
            var templateDomainName = 'poff';
        }

        if (element.groupType) {
            var templateGroupName = element.groupType.toLowerCase();
        } else {
            console.log('ERROR!: Team templateGroupName missing for team with ID no ', element.id);
            continue;
        }

        // Fake a temporary media component out of available pictures, then prioritize and fill picture if any
        // Delete excess picture objects and arrays afterwards
        const teamVariableName = templateGroupName !== 'jury' ? 'teamMember' : 'juryMember'
        const imgVariableName = templateGroupName !== 'jury' ? 'pictureAtTeam' : 'pictureAtJury'
        const imageOrder = templateGroupName === 'festivalteam' ? imageOrderTeam : imageOrderJuryAndGuest
        const imageOrderDefaults = templateGroupName === 'festivalteam' ? imageOrderTeamDefaults : imageOrderJuryAndGuestDefaults

        element.subTeam.map(s => s[teamVariableName].map(t => {
            let mediaObj = {
                media: {}
            }
            if (t[imgVariableName]) {
                mediaObj.media[imgVariableName] = t[imgVariableName]
                delete t[imgVariableName]
            }
            if (t?.person?.picture) {
                mediaObj.media.personPicture = [t.person.picture]
                delete t.person.picture
            }
            if (mediaObj.media[imgVariableName] || mediaObj.media.personPicture) {
                t.picture = prioritizeImages(mediaObj, imageOrder, imageOrderDefaults);
            }
        }))


        if (templateGroupName === 'guest') {
            continue
        }

        for (const subTeamIx in element.subTeam) {
            let subTeam = element.subTeam[subTeamIx];
            for (const juryMemberIx in subTeam.juryMember) {
                let juryMember = subTeam.juryMember[juryMemberIx];
                let personFromYAML = STRAPIDATA_PERSONS.filter((a) => { return juryMember?.person?.id === a.id });
                juryMember.person = personFromYAML[0];
            }
        }
        // rueten func. is run for each element separately instead of whole data, that is
        // for the purpose of saving slug_en before it will be removed by rueten func.
        let dirSlug = element.slug_en || element.slug_et ? element.slug_en || element.slug_et : null;
        element = rueten(element, lang);
        if ('slug' in element) {
            element.path = element.slug;
        } else {
            continue
        }

        const oneYaml = yaml.dump(element, { 'noRefs': true, 'indent': '4' });

        if (dirSlug != null) {
            const yamlPath = path.join(fetchDataDir, dirSlug, `data.${lang}.yaml`);
            let saveDir = path.join(fetchDataDir, dirSlug);
            fs.mkdirSync(saveDir, { recursive: true });

            fs.writeFileSync(yamlPath, oneYaml, 'utf8');
            fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/${templateGroupName}_${templateDomainName}_index_template.pug`)
        }
        allData.push(element);
    }

    const allDataYAML = yaml.dump(allData, { 'noRefs': true, 'indent': '4' });
    const yamlPath = path.join(fetchDir, `teams.${lang}.yaml`);
    fs.writeFileSync(yamlPath, allDataYAML, 'utf8');
}
