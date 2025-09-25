const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const rueten = require('./rueten.js')
const { fetchModel } = require('./b_fetch.js')

const rootDir = path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')

const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir = path.join(rootDir, 'source')
const fetchDir = path.join(sourceDir, '_fetchdir')
const strapiDataPathBanner = path.join(sourceDir, '_allStrapidata', 'BannerGroup.yaml')

const DOMAIN = process.env['DOMAIN'] || 'justfilm.ee'


const STRAPIDATA_BANNERS = yaml.load(fs.readFileSync(strapiDataPathBanner, 'utf8'))

const minimodel = {
    'domains': {
        model_name: 'Domain'
    },
    'banners': {
        model_name: 'Banner'
    },
}
console.log(`Fetching ${DOMAIN} banner data`)
const STRAPIDATA_ALL_BANNERS = fetchModel(STRAPIDATA_BANNERS, minimodel)
console.log(`Fetched ${STRAPIDATA_ALL_BANNERS.length} ${DOMAIN} banner data`)

const bannersPath = path.join(fetchDir, 'banners')
fs.mkdirSync(bannersPath, { recursive: true })

for (const originalElement of STRAPIDATA_ALL_BANNERS) {
    const bannerGroup = JSON.parse(JSON.stringify(originalElement))

    if (!bannerGroup.domains || !bannerGroup.domains.find(d => d.url === DOMAIN)) {
        console.log(`Skipping banner group ${bannerGroup.position} as it does not belong to domain ${DOMAIN}`)
        continue
    }

    const now = new Date();

    bannerGroup.banners = bannerGroup.banners.filter(banner => {
        const publishFrom = new Date(banner.publishFrom);
        const publishUntil = new Date(banner.publishUntil);
        return now >= publishFrom && now <= publishUntil;
    });

    if (bannerGroup.banners.length === 0) {
        console.log(`Skipping banner group ${bannerGroup.position} as no banners are currently active`);
        continue;
    }

    let slug = bannerGroup.position.toLowerCase().replace(/_/g, '-')

    bannerGroup.directory = path.join(bannersPath, slug)
    bannerGroup.path = path.join('banners', slug)

    fs.mkdirSync(bannerGroup.directory, { recursive: true })

    const languages = DOMAIN_SPECIFICS.locales[DOMAIN]

    for (lang of languages) {
        for (const banner of bannerGroup.banners) {
            banner.image = {
                name: banner[`image_${lang}`]?.name || banner.imageDefault?.name,
                url: `https://assets.poff.ee/img/${banner[`image_${lang}`]?.hash || banner.imageDefault?.hash}${banner[`image_${lang}`]?.ext || banner.imageDefault?.ext}`
            };
            banner.target = banner[`target_${lang}`] || banner.targetDefault;
        }

        // Clean up excessive banner data
        const cleanedBannerGroup = {
            position: bannerGroup.position,
            interval: bannerGroup.interval,
            width: bannerGroup.width,
            height: bannerGroup.height,
            banners: bannerGroup.banners.map(banner => ({
                id: banner.id,
                name: banner.name,
                image: banner.image,
                order: banner.order,
                target: banner.target
            })),
            directory: bannerGroup.directory,
            path: bannerGroup.path
        };

        generateYaml(cleanedBannerGroup, lang)
    }
}

function generateYaml(element, lang) {
    let yamlStr = yaml.dump(element, { 'noRefs': true, 'indent': '4' })

    fs.writeFileSync(`${element.directory}/data.${lang}.yaml`, yamlStr, 'utf8')

    fs.writeFileSync(`${element.directory}/index.pug`, `include /_templates/banner_group_index_template.pug`)
}
