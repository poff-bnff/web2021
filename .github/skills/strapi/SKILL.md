---
name: strapi
description: Working with Strapi CMS - content types, API queries, authentication, data models, CRUD operations, collections, single types, components, relations, filters, and SSG integration.
---

# Strapi CMS Skills

## Overview

This project uses **Strapi v3.x** as a headless CMS for managing content across multiple festival domains (POFF, Industry, HOFF, Shorts, etc.). Strapi provides REST API endpoints for content management and serves as the data source for static site generation (SSG).

## Project Structure

- **Strapi Instance**: `/strapi/strapi-development/`
- **API Models**: `/strapi/strapi-development/api/*/models/*.settings.json`
- **Components**: `/strapi/strapi-development/components/`
- **Data Model Reference**: `/ssg/docs/datamodel.yaml`
- **Query Helper**: `/ssg/helpers/strapiQuery.js`
- **Auth Helper**: `/ssg/helpers/strapiAuth.js`

## Environment Configuration

Strapi configuration uses environment variables:

```javascript
StrapiProtocol  // 'http' or 'https'
StrapiHost      // Hostname (e.g., 'admin.poff.ee')
StrapiPort      // Port number
StrapiDatabaseHost
StrapiDatabasePort
StrapiDatabaseName
StrapiDatabaseUsername
StrapiDatabasePassword
StrapiUserName  // For API authentication
StrapiPassword  // For API authentication
```

### Configuration Files

- **Server**: `/strapi/strapi-development/config/server.js`
- **Database**: `/strapi/strapi-development/config/database.js`

## Content Types

Strapi has 100+ content types organized as:

### Main Content Types

- **Articles**: `article`, `pof-fi-article`, `bruno-article`, `dis-camp-article`, etc.
- **Events**: `event`, `course-event`, `industry-event`, `screening`
- **Media**: `film`, `cassette`, `media`
- **People & Organizations**: `person`, `organisation`, `team`
- **Locations**: `cinema`, `hall`, `location`, `address`
- **Frontend Structure**: `menu`, `footer`, `banner`, `hero-article-*`
- **Taxonomies**: `tag-*`, `label`, `language`, `country`
- **User Management**: `user`, `user-profile`, `business-profile`

### Content Type Discovery

Use the data model file for reference:

```bash
cat /home/aivar/dev/acty/e-ari-docker-containers/www/poff/web2021/ssg/docs/datamodel.yaml
```

Each content type has a `_path` property defining its API endpoint.

## Authentication

### Getting Bearer Token

```javascript
const { strapiAuth } = require('./helpers/strapiAuth.js')
const TOKEN = await strapiAuth()
```

The auth function:
- Sends credentials to `/auth/local`
- Returns JWT token
- Automatically retries on failure

### Using Token

```javascript
headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
}
```

## API Queries

### Using strapiQuery Helper

The `strapiQuery.js` helper provides standardized API access:

#### Get All Records

```javascript
const { getModel } = require('./helpers/strapiQuery.js')
const allFilms = await getModel('Film')
```

#### Get Filtered Records

```javascript
const { getModel } = require('./helpers/strapiQuery.js')

// Filter by field
const films = await getModel('Film', { 
    festival_edition: 123 
})

// Multiple filters
const events = await getModel('Event', { 
    type: 'screening',
    is_published: true
})
```

#### Update Records

```javascript
const { putModel } = require('./helpers/strapiQuery.js')

await putModel('Film', {
    id: 456,
    title_et: 'Updated Title',
    is_published: true
})
```

### Direct HTTP Queries

#### GET Request

```javascript
const options = {
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
    },
    hostname: strapiAddress,
    path: '/films?_limit=-1',  // -1 = no limit
    method: 'GET'
}

const data = await strapiQuery(options)
```

#### POST Request

```javascript
const options = {
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
    },
    hostname: strapiAddress,
    path: '/films',
    method: 'POST'
}

const dataObject = {
    title_et: 'New Film',
    title_en: 'New Film',
    slug_et: 'new-film'
}

const created = await strapiQuery(options, dataObject)
```

#### PUT Request

```javascript
const options = {
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
    },
    hostname: strapiAddress,
    path: '/films/123',
    method: 'PUT'
}

const dataObject = {
    title_et: 'Updated Film Title'
}

const updated = await strapiQuery(options, dataObject)
```

#### DELETE Request

```javascript
const options = {
    method: 'DELETE',
    path: '/films/123'
}

await strapiQuery(options)
```

## Query Parameters

### Pagination

```javascript
// Limit results
?_limit=10

// Skip records
?_start=20

// Get all records
?_limit=-1
```

### Sorting

```javascript
// Ascending
?_sort=created_at:ASC

// Descending
?_sort=created_at:DESC

// Multiple fields
?_sort=priority:DESC,created_at:ASC
```

### Filtering

```javascript
// Exact match
?title=Something

// Contains
?title_contains=Search

// Multiple filters
?type=article&is_published=true

// Nested relations
?author.name=John
```

### Relations

```javascript
// Populate single relation
?_populate=author

// Populate multiple relations
?_populate=author,category,tags

// Deep populate (Strapi v3)
?_populate=author.profile.avatar
```

## Data Model Structure

Content types follow this pattern in `datamodel.yaml`:

```yaml
Film: &Film
    _path: /films
    title_et: (text)
    title_en: (text)
    slug_et: (text)
    slug_en: (text)
    description_et: (richtext)
    description_en: (richtext)
    is_published: (boolean)
    festival_edition: *FestivalEdition
    cassettes: [*Cassette]
```

### Field Types

- `(text)` - String
- `(richtext)` - Markdown/HTML
- `(number)` - Integer/Float
- `(date)` - Date
- `(datetime)` - Timestamp
- `(boolean)` - True/False
- `(email)` - Email
- `(password)` - Hashed password
- `(enumeration)` - Predefined values
- `*ModelName` - Relation to model
- `[*ModelName]` - Array of relations

## Components

Reusable data structures defined in `/strapi/strapi-development/components/`:

### Common Components

- `credentials.credentials` - Film credits
- `screening.subtitles` - Subtitle information
- `location.address` - Address data
- `user.my-films` - User's film list
- `frontpage.banner` - Banner configuration

### Using Components in Queries

Components are nested objects in API responses:

```javascript
{
    id: 123,
    title: "Film Title",
    credentials: [
        {
            role: "Director",
            person: { name: "Name" }
        }
    ]
}
```

## Common Patterns

### Fetching with Relations

```javascript
// Fetch films with all related data
const films = await getModel('Film', { 
    festival_edition: editionId 
})

// Each film includes populated relations based on model setup
films.forEach(film => {
    console.log(film.title_et)
    console.log(film.credentials)  // Nested credentials
    console.log(film.cassettes)    // Related cassettes
})
```

### Multi-language Content

Most content types have language-specific fields:

```javascript
{
    title_et: "Estonian Title",
    title_en: "English Title",
    title_ru: "Russian Title",
    description_et: "Estonian description",
    description_en: "English description"
}
```

When fetching, specify the language you need or handle all languages.

### Published Status

Many content types have publication flags:

```javascript
// Common flags
is_published: true/false    // Main publication status
public: true/false          // Public visibility
published_at: (datetime)    // Strapi's built-in

// strapiQuery automatically filters unpublished content:
// - Skips records where is_published: false
// - Skips records where public: false
```

### Slugs and URLs

Content typically has slugs for URL generation:

```javascript
{
    slug_et: "minu-film",
    slug_en: "my-film",
    path_et: "/filmid/minu-film",
    path_en: "/films/my-film"
}
```

## Integration with SSG

The SSG (Static Site Generator) fetches data from Strapi:

### Fetch Helpers

Located in `/ssg/helpers/fetch_*.js`:

- `fetch_article_type_from_yaml.js` - Articles
- `fetch_courses_from_yaml.js` - Courses
- `fetch_films_from_yaml.js` - Films
- etc.

### Build Process

1. **Authenticate**: Get JWT token
2. **Fetch Data**: Query Strapi API for content
3. **Transform**: Convert to YAML/JSON for SSG
4. **Generate**: Build static pages

Example from build helper:

```javascript
const minimodel = {
    'languages': {
        model_name: 'Language'
    },
    'credentials': {
        model_name: 'Credentials',
        expand: {
            'rolePerson': {
                model_name: 'RolePerson'
            }
        }
    }
}
```

## Error Handling

### Common Issues

1. **Timeout**: Auto-retries with backoff
2. **Authentication Failure**: Check credentials
3. **404**: Verify endpoint path in datamodel.yaml
4. **500**: Check Strapi server status

### Handling in Code

```javascript
try {
    const data = await getModel('Film')
    if (!data || data.length === 0) {
        console.log('No films found')
    }
} catch (error) {
    console.error('Strapi query failed:', error)
}
```

## Content Manager Extensions

Custom extensions in `/strapi/strapi-development/extensions/content-manager/`:

- Modified attribute display rules
- Custom validation schemas
- Permission handling
- Layout configuration

## Best Practices

### Query Optimization

1. **Use Filters**: Don't fetch all records if you need specific ones
2. **Limit Results**: Use `_limit` for pagination
3. **Select Fields**: Minimize payload size
4. **Batch Operations**: Group related queries

### Data Integrity

1. **Validate Before Save**: Check required fields
2. **Handle Relations**: Ensure related records exist
3. **Check Publication Status**: Respect is_published flags
4. **Maintain Slugs**: Keep URL-friendly unique slugs

### Performance

1. **Cache Tokens**: Reuse JWT tokens (valid for ~24h)
2. **Parallel Queries**: Use Promise.all for independent queries
3. **Progress Indicators**: Use `process.stdout.write()` for feedback
4. **Retry Logic**: Handle temporary failures gracefully

## Testing Endpoints

Use the REST client file at `/strapi.rest`:

```http
### Get user profile
GET {{hunt_url}}/api/profile 
Authorization: Bearer {{nonProdToken}}

### Login
POST https://admin.poff.ee/auth/local HTTP/1.1
content-type: application/json

{
    "identifier": "user@example.com", 
    "password": "password"
}
```

## Debugging

### Enable Verbose Logging

```javascript
console.log('=== getModel', filters, options)
```

### Check Response Status

```javascript
if (response.statusCode === 200) {
    // Success
} else {
    console.log('Status', response.statusCode, options)
}
```

### Inspect Data Structure

```javascript
const data = await getModel('Film', { id: 123 })
console.log(JSON.stringify(data, null, 2))
```

## Common Tasks

### Task: Add New Content Type

1. Create in Strapi admin UI
2. Update `/ssg/docs/datamodel.yaml`
3. Create fetch helper if needed
4. Add to build scripts

### Task: Modify Existing Content

```javascript
const { getModel, putModel } = require('./helpers/strapiQuery.js')

// 1. Get current data
const item = await getModel('Film', { id: 123 })

// 2. Modify
item.title_et = 'New Title'

// 3. Save
await putModel('Film', item)
```

### Task: Bulk Import

```javascript
const items = [...] // Your data array

for (const item of items) {
    try {
        await strapiQuery({
            method: 'POST',
            path: '/films',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        }, item)
        process.stdout.write('.')
    } catch (error) {
        console.error(`Failed to import ${item.title}:`, error)
    }
}
```

### Task: Generate Reports

```javascript
const allFilms = await getModel('Film')

const stats = {
    total: allFilms.length,
    published: allFilms.filter(f => f.is_published).length,
    byYear: {}
}

allFilms.forEach(film => {
    const year = new Date(film.created_at).getFullYear()
    stats.byYear[year] = (stats.byYear[year] || 0) + 1
})

console.log(stats)
```

## Resources

- Strapi v3 Documentation: https://docs.strapi.io/developer-docs/latest
- Project datamodel: `/ssg/docs/datamodel.yaml`
- API reference: `/strapi.rest`
- Helper functions: `/ssg/helpers/strapiQuery.js`

## Keywords for Agent Discovery

strapi, cms, headless cms, api, rest api, content management, content types, collections, single types, models, schema, database, postgres, authentication, jwt, bearer token, crud, create, read, update, delete, query, filter, sort, pagination, relations, populate, components, fields, attributes, endpoints, fetch data, api calls, json, yaml, data model, content editor, admin panel, strapi admin, backend, server, node.js