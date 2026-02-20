# Archive Build Documentation

## Overview

The **Archive Build** is a specialized static site generation process that creates a separate website build containing historical/archived content from past festival editions. This allows the project to maintain access to previous years' content while keeping the main site focused on current/active content.

⚠️ **Important Limitations**:
- Archive builds generate **sub-pages only** (no root index.html)
- You must access via search pages or direct links to specific items
- When triggered from Strapi admin, may encounter SSL certificate errors

## Purpose

The archive build serves to:
- Preserve historical content from past festival editions
- Display archived films, cassettes, and screenings from previous years
- Show industry projects from inactive editions
- Create searchable archives with appropriate filters
- Generate compressed archives for backup/distribution

## Entry Point

```bash
./build_archive.sh <DOMAIN> [TARGET] [TARGET_ID] [ADDITIONAL_IDS...]
```

**Example:**
```bash
./build_archive.sh poff.ee
./build_archive.sh industry.poff.ee
```

## Key Differences from Regular Build

| Aspect | Regular Build | Archive Build |
|--------|---------------|---------------|
| **Output Directory** | `./build/{domain}` | `./archive/{domain}` |
| **Content Filter** | Current/active festival editions | Past/archived festival editions |
| **Templates** | Standard templates | Archive-specific templates (`*_archive_*.pug`) |
| **Festival Editions** | Active editions only | Inactive/historical editions only |
| **Search Paths** | `/search`, `/films` | `/search_archive`, `/films_archive` |
| **Final Output** | Build directory only | Build directory + compressed tar archive |

## Build Process Flow

### 1. Environment Setup
```bash
export DOMAIN="$1"
TARGET="$2"
TARGET_ID="$3"
ADDITIONAL_TARGET_IDS="${PARAMS_ARRAY[@]:3}"
```

### 2. Directory Initialization
```bash
# Creates archive directories
./archive/
./archive/{BUILDDIR}/
```

The build directory name is determined by `helpers/name_build_directory.js` based on the domain.

### 3. Data Processing
```bash
# Process all Strapi data by domain
node helpers/d_fetch.js

# Initialize entu-ssg with 'archive' mode
node helpers/initialise_entu_ssg.js archive
```

**What `initialise_entu_ssg.js archive` does:**
- Reads `entu-ssg-template.yaml`
- Sets `build` output to `./archive/{domain}` (instead of `./build/{domain}`)
- Configures locales and defaultLocale based on domain
- Writes configuration to `entu-ssg.yaml`

### 4. Domain-Specific Archive Fetching

#### For Industry Domain (`industry.poff.ee`):
```bash
node helpers/fetch_industry_project_from_yaml.js archive
```

**Logic:**
- Filters projects where editions are NOT in the `active_editions` list
- Creates `industryprojects_archive` data files
- Generates `search_projects_archive` and `filters_projects_archive` YAML files
- Uses `industry_archive` template domain name
- Adds path alias: `/industry_projects_archive_search`

#### For Other Domains (Films/Cassettes):
```bash
node helpers/fetch_cassettes_archive_from_yaml.js "$DOMAIN"
```

**Logic:**
- Filters cassettes based on festival editions NOT in the `cassettes_festival_editions[DOMAIN]` list
- Processes both single-film and multi-film cassettes
- Generates `search_films_archive` and `filters_films_archive` YAML files
- Creates searchable data with filters for:
  - Programmes
  - Festivals
  - Years
  - Languages
  - Countries
  - Subtitles
  - Premiere types
  - Film types
  - Genres
  - Keywords
  - Towns
  - Cinemas
- Adds path alias: `/search_archive`

### 5. Footer Processing
```bash
node helpers/fetch_footer_from_yaml.js
```

### 6. Path Configuration
```bash
# Display all paths to be built
node helpers/add_config_path_aliases.js display
```

### 7. Static Site Generation
```bash
node node_modules/entu-ssg/src/build.js entu-ssg.yaml full
```

Builds all pages using the archive-specific configuration.

### 8. File Sync
```bash
rsync -ra ./archive/{BUILDDIR}/. ../www/build.{DOMAIN}/
```

Syncs the generated archive to the www build directory.

### 9. Compression
```bash
tar -cf ./archive/{BUILDDIR}.tar -C ./archive/{BUILDDIR} .
```

Creates a compressed tar archive of the entire build.

## Key Files and Their Roles

### Main Script
- **`build_archive.sh`** - Orchestrates the entire archive build process

### Helper Scripts
- **`helpers/initialise_entu_ssg.js`** (with `archive` parameter)
  - Configures build output directory to `./archive/{domain}`
  
- **`helpers/fetch_cassettes_archive_from_yaml.js`**
  - Fetches and processes archived film/cassette data
  - Creates search and filter data for archives
  - Handles both single and multiple film cassettes
  
- **`helpers/fetch_industry_project_from_yaml.js`** (with `archive` parameter)
  - Filters industry projects to archived editions
  - Creates archive-specific project data
  
- **`helpers/name_build_directory.js`**
  - Determines the build directory name from domain configuration
  
- **`helpers/d_fetch.js`**
  - Processes all Strapi data for the domain

### Configuration Files
- **`domain_specifics.yaml`**
  - Contains `archive` in type-items list (line 156)
  - Defines `cassettes_festival_editions[DOMAIN]` for filtering
  - Maps domain names to build directories
  
- **`ignore_paths.yaml`**
  - Contains ignore rules for archive search paths
  - Prevents archive paths from being built on non-archive builds

### Templates
Archive-specific Pug templates:
- **`source/_templates/cassette_templates/cassette_poff_archive_index_template.pug`**
- **`source/_templates/cassette_templates/cassette_poff_archive_single_film_template.pug`**
- **`source/_templates/cassette_templates/cassette_poff_archive_multiple_films_template.pug`**
- **`source/_templates/industryproject_industry_archive_index_template.pug`**
- **`source/_templates/industryperson_industry_archive_index_template.pug`**

## Content Filtering Logic

### For Cassettes/Films
```javascript
// Exclude festival editions specified in domain_specifics.yaml
const festival_editions_to_exclude = DOMAIN_SPECIFICS.cassettes_festival_editions[DOMAIN] || []
const festival_editions = STRAPIDATA_FESTIVAL_EDITIONS
    .map(fe => fe.id)
    .filter(fe => !festival_editions_to_exclude.includes(fe))
```

### For Industry Projects
```javascript
// Archive: Projects with editions NOT in active_editions
let archiveProjects = STRAPIDATA_IND_PROJECT.filter(proj => 
    proj.editions && 
    proj.editions.map(ed => ed.id).some(id => !active_editions.includes(id))
)

// Regular: Projects with editions IN active_editions
let activeProjects = STRAPIDATA_IND_PROJECT.filter(proj => 
    proj.editions && 
    proj.editions.map(ed => ed.id).some(id => active_editions.includes(id))
)
```

## Search Functionality

Archive builds create separate search indices:
- **Films/Cassettes**: `search_films_archive.{lang}.yaml`, `filters_films_archive.{lang}.yaml`
- **Industry Projects**: `search_projects_archive.{lang}.yaml`, `filters_projects_archive.{lang}.yaml`

These are accessible via:
- `/search_archive` (cassettes/films)
- `/industry_projects_archive_search` (industry projects)
- `/industry_persons_archive_search` (industry persons)

## Output Structure

```
ssg/
├── archive/
│   ├── {domain}/              # Generated static site
│   │   ├── build.json         # Build metadata (NOT browsable HTML)
│   │   ├── project/           # Individual project HTML pages
│   │   │   ├── {project-slug-1}/
│   │   │   │   └── index.html
│   │   │   ├── {project-slug-2}/
│   │   │   │   └── index.html
│   │   │   └── ...
│   │   └── search-projects-archive/  # Search page
│   │       └── index.html
│   │   # NOTE: NO root index.html is generated!
│   └── {domain}.tar           # Compressed archive
└── www/
    └── build.{domain}/        # Synced copy for deployment
```

### What Gets Generated

**For industry.poff.ee archive**:
- ✅ `build.json` - metadata file
- ✅ `/project/{slug}/index.html` - Individual project pages
- ✅ `/search-projects-archive/index.html` - Archive search page
- ❌ `/index.html` - Root homepage (NOT generated)
- ❌ CSS/JS assets in root (unless linked from sub-pages)

**For film/cassette archives (poff.ee, hoff.ee, etc.)**:
- ✅ `build.json` - metadata file  
- ✅ `/film/{slug}/index.html` - Individual film/cassette pages
- ✅ `/search_archive/index.html` - Archive search page
- ❌ `/index.html` - Root homepage (NOT generated)
- ❌ CSS/JS assets in root (unless linked from sub-pages)

**What this means**:
- Archive builds generate browsable HTML for individual content items and search pages
- There is NO landing page at the root level
- You must navigate directly to sub-pages or use the search page as entry point
- Assets (CSS, JS, images) are embedded in sub-pages via templates

## Usage Examples

### Build archive for POFF main site
```bash
./build_archive.sh poff.ee
```

### Build archive for Industry site
```bash
./build_archive.sh industry.poff.ee
```

### Build archive for HOFF
```bash
./build_archive.sh hoff.ee
```

## How to Access/Browse Archive Build

Since archive builds don't generate a root `index.html`, you have several options:

### Option 1: Start from search page (Recommended)
```bash
cd ssg/archive/industry
python3 -m http.server 8080

# Then open in browser:
# http://localhost:8080/search-projects-archive/
```

### Option 2: Create a redirect index.html
```bash
cd ssg/archive/industry
cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=/search-projects-archive/">
  <title>Redirecting to Archive...</title>
</head>
<body>
  <p>Redirecting to <a href="/search-projects-archive/">archive search</a>...</p>
</body>
</html>
EOF

# Now you can open http://localhost:8080/
```

### Option 3: Access individual items directly
If you know the slug of a specific project/film:
```
http://localhost:8080/project/{project-slug}/
http://localhost:8080/film/{film-slug}/
```

### Option 4: Extract and browse the tar archive
```bash
cd ssg/archive
mkdir -p extracted
tar -xf industry.tar -C extracted/
cd extracted
python3 -m http.server 8080
# Access via: http://localhost:8080/search-projects-archive/
```

## Environment Variables

- **`DOMAIN`** - The domain to build (e.g., `poff.ee`, `industry.poff.ee`)
- **`CASSETTELIMIT`** - (Optional) Limit number of cassettes to build (default: 0 = no limit)

## Integration with Main Build

Archive builds are **separate** from regular builds. The regular build scripts (e.g., `build_poff.sh`, `build_industry.sh`) do NOT trigger archive builds. Archive builds must be run explicitly when needed.

## When to Run Archive Build

- After a festival edition is completed and needs to be moved to archives
- When updating historical content
- To create backup archives of past editions
- For generating distribution packages of historical content

## Performance Considerations

- Archive builds can be large depending on the number of historical editions
- The tar compression step may take time for large builds
- Consider disk space for both the uncompressed build and tar archive

## Known Issues and Limitations

### Issue 1: Missing Root index.html

**Problem**: The archive build generates only `build.json` and subdirectory pages (like `/project/*`, `/search-projects-archive/`) but does NOT create a root `index.html` file.

**Impact**:
- You cannot browse the archive site by opening the root directory in a browser
- The archive lacks a homepage/landing page
- Only direct links to sub-pages work (e.g., `/search-projects-archive/index.html`)

**Cause**: The archive build process:
1. Generates data YAML files for archived content
2. Creates individual page templates for projects/cassettes
3. Creates search pages (`/search_archive`, `/industry_projects_archive_search`)
4. BUT does not include `/home` or root index page generation

**Evidence**:
```bash
$ ls -la ssg/archive/industry/
# Output shows:
- build.json
- project/ (directory with HTML files)
- search-projects-archive/ (directory with HTML)
# BUT NO index.html at root
```

**Workarounds**:
1. **Access via search page**: Navigate directly to `/search-projects-archive/` or `/search_archive/`
2. **Create redirect**: Manually create a root `index.html` that redirects to search page:
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <meta http-equiv="refresh" content="0; url=/search-projects-archive/">
   </head>
   <body>Redirecting to archive search...</body>
   </html>
   ```
3. **Fix the source**: Add a `home_archive` page in `source/` for archive builds

**Long-term Solution**: 
- Create archive-specific home page templates
- Modify `ignore_paths.yaml` to NOT ignore `/home` for archive builds
- OR add specific archive landing pages to `source/` directory

### Issue 2: Certificate Expiration Error (When Triggered from Strapi)

**Problem**: When archive build is triggered from Strapi admin panel, it fails with:

```
Error: certificate has expired
at TLSSocket.onConnectSecure (_tls_wrap.js:1497:34)
```

**Cause**: 
The build process makes HTTPS requests from Strapi back to itself (or to external APIs) using Node.js `https` module. The SSL/TLS certificate being used has expired.

**Location in code**:
- `strapi/strapi-development/helpers/lifecycle_manager.js` - calls build_manager.js
- `ssg/helpers/build_manager.js` line 15: `let https = require(process.env['StrapiProtocol'])`
- `ssg/helpers/build_manager.js` line 385: Makes HTTPS requests to Strapi API

**Solutions**:

#### Quick Fix (Development/Testing): Disable SSL verification
Add to `ssg/helpers/build_manager.js` before the request (around line 365):

```javascript
var options = {
    hostname: strapiAddress,
    path: `/publisher/${mapper[type]}/${id}`,
    method: type,
    headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    },
    rejectUnauthorized: false  // ADD THIS LINE (WARNING: Use only in dev)
};
```

⚠️ **WARNING**: `rejectUnauthorized: false` disables certificate validation and should ONLY be used in development/testing environments!

#### Proper Fix (Production):
1. **Renew SSL certificate**: Update the SSL/TLS certificate on your Strapi server
2. **Use environment variable**: Switch to HTTP for internal communication:
   ```bash
   # In your environment configuration
   StrapiProtocol=http  # Instead of https for internal calls
   ```
3. **Update certificate chain**: Ensure Node.js has access to updated CA certificates:
   ```bash
   npm install -g ssl-root-cas
   ```

#### Verification:
After applying fix, test by:
```bash
# From Strapi admin panel, trigger archive build
# Or from terminal:
cd ssg
DOMAIN=industry.poff.ee node helpers/build_manager.js
```

## Troubleshooting

### No content in archive build
- Check `domain_specifics.yaml` for `cassettes_festival_editions[DOMAIN]` configuration
- Verify that festival editions are properly marked as inactive/archived in Strapi
- Ensure `active_editions` list in relevant helper scripts is up to date

### Build completes but no HTML pages generated
- Check `ignore_paths.yaml` - the paths you need might be in the ignore list
- Verify archive templates exist: `source/_templates/*_archive_*.pug`
- Look for errors in build.json
- Check console output during build for template errors

### Build fails with path errors
- Verify archive directory exists and is writable: `mkdir -p ssg/archive`
- Check permissions: `chmod -R 755 ssg/archive`
- Check that `name_build_directory.js` returns a valid directory name for the domain

### Missing templates
- Ensure archive-specific templates exist in `source/_templates/`
- Check that template names match the expected pattern (`*_archive_*.pug`)
- For industry: `industryproject_industry_archive_index_template.pug`
- For films/cassettes: `cassette_poff_archive_*.pug`

### Archive search pages have no filters
- Verify `search_films_archive.{lang}.yaml` or `search_projects_archive.{lang}.yaml` were generated
- Check `filters_films_archive.{lang}.yaml` or `filters_projects_archive.{lang}.yaml` files exist
- Look in `ssg/source/_fetchdir/` for these files

### Permission errors (exit code 126)
```bash
chmod +x ./ssg/build_archive.sh
# Or run with bash explicitly:
bash ./ssg/build_archive.sh industry.poff.ee
```

## Related Documentation

- See `entu-ssg-template.yaml` for base configuration
- See `domain_specifics.yaml` for domain-specific settings
- See `WORKFLOW_GUIDE.md` for general build workflow information
- See `build_manager.js` for build queue and execution logic
- See `lifecycle_manager.js` in Strapi for build triggering mechanism
