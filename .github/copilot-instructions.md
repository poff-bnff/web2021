# AI Coding Assistant Instructions for PÖFF Web2021 SSG

## Architecture Overview
This is a static site generator (SSG) for multiple film festival websites (poff.ee, industry.poff.ee, justfilm.ee, etc.). It fetches data from Strapi CMS and YAML files, processes it by domain, and generates static HTML/JS/CSS sites.

**Key Components:**
- `strapi/`: CMS backend
- `ssg/`: Main build system with helpers, build scripts, and templates
- `build/`: Generated static output
- `source/`: Fetched and processed data

## Critical Workflows
- **Local Development**: Use `./acty_run_local.sh <command>` (e.g., `./acty_run_local.sh serve_local_poff`)
- **Build Process**: Run `build_<domain>.sh` (e.g., `./build_poff.sh`) or `./build.sh` for full build
- **Data Flow**: `a_fetch.js` (Strapi) → `d_fetch.js` (domain processing) → `fetch_*.js` scripts → YAML output → entu-ssg generation

## Project Conventions
- **Domains**: Configured in `domain_specifics.yaml` with edition IDs, enabled features, locales
- **Profiles**: Only `industry.poff.ee` has actor/person profiles; `isActor()` checks `ACTOR_ROLES` in `role_at_films` and `orderedRaF`
- **Localization**: Use `rueten()` for translating objects; supports `et`, `en`, `ru`
- **Data Processing**: `orderedRaF` (source array) → `role_at_films` (sorted processed array)
- **Task Management**: Create `task_XXX_brief_description.md` in `ai-docs/` for any issue/feature work

## Common Patterns
- **Error Handling**: Check `status=$?; [ $status -ne 0 ] && exit $status` in build scripts
- **File Paths**: Use `path.join(__dirname, '..')` for root-relative paths
- **YAML Processing**: Load with `js-yaml`, dump with `noRefs: true, indent: '4'`
- **Domain Checks**: `if (DOMAIN !== 'industry.poff.ee')` for profile-specific logic

## Integration Points
- **Strapi**: REST API data in `source/_allStrapidata/`
- **External Data**: YAML from Entu CMS, Google Sheets via `connect_spreadsheet.js`
- **CI/CD**: AWS CodeBuild with badges in README.md
- **Hosting**: CloudFront distributions per domain

## Development Guidelines
- Always create task files first for issues/features
- Test builds with `./build_<domain>.sh` after changes
- Preserve existing data structures when modifying fetch scripts
- Use `console.log` for debugging in helpers (remove before commit)