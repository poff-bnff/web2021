requireLogin()
let formOriginalData = null;
let state = {}
let activeFormType = false
const TYPE_OF_WORK_EDUCATION_ID = 7
const ROLE_AT_FILM_ACTOR_ID = 76

async function showSection(sectionName) {
    const section = document.querySelector('.addProSection')
    section.classList.remove('organisationprofile', 'personprofile', 'disabled')
    section.classList.add(sectionName)
    emptyFields(document.querySelector('.addProSection'))
    document.getElementById('loader').classList.add('loading')
    if (sectionName == 'organisationprofile') {
        formOriginalData = await fetchData('organisation')
        fillForm(formOriginalData, getOrganisationFields(), translate('errorOnOrganisationLoad'))
        console.log('Organisation: ', formOriginalData)
    } else if (sectionName == 'personprofile') {
        formOriginalData = await fetchData('person')
        fillForm(formOriginalData, getPersonFields(), translate('errorOnPersonLoad'))
        console.log('Person: ', formOriginalData)
    }
    activeFormType = sectionName;
    document.getElementById('loader').classList.remove('loading')
}

function addNewGalleryImage(event) {
    const fieldset = event.currentTarget.closest('fieldset')
    const images = fieldset.querySelectorAll('.gallery')
    const newElement = duplicateElement(images[images.length-1])
    newElement.querySelector('input').focus()
    updateAddGalleryImageButtonVisibility(fieldset)
};

function removeGalleryImage(event) {
    const fieldset = event.currentTarget.closest('fieldset');
    const count = fieldset.querySelectorAll('.gallery').length
    if (count > 1) {
        const gallery = event.currentTarget.closest('.gallery')
        gallery.remove()
        updateAddGalleryImageButtonVisibility(fieldset)
    } else {
        hideFieldsetFields(event)
    }
};
function updateAddGalleryImageButtonVisibility(fieldset) {
    const galleryDiv = fieldset.querySelectorAll('.addProSection .gallery')
    const visibilitiy = (galleryDiv.length >=10) ? 'none' : 'block'

    document.getElementById('add_new_gallery_image').style.display = visibilitiy

}

function  duplicatePreviousElement(event) {
    let fieldsElement = event.currentTarget.previousSibling
    if (!fieldsElement) {
        const elements = fieldsElement = event.currentTarget.closest('fieldset').querySelectorAll('.sub_form')
        fieldsElement = elements[elements.length - 1]
    }
    const newElement = duplicateElement(fieldsElement)
    newElement.querySelector('select').focus()
};

function duplicateElement(element) {
    const newElement = element.cloneNode(true)
    resetFields(newElement)
    element.after(newElement)
    return newElement
}

function removeFields(event) {
    removeDuplicateSelects(event.currentTarget.closest('.sub_form'))
}

function removeDuplicateSelects(subFormElement) {
    const domElement = subFormElement.closest('.form_group');
    if (domElement.querySelectorAll('.remove_fields').length > 1) {
        subFormElement.remove()
    } else {
        resetFields(event.currentTarget.closest('.sub_form'))
        if (subFormElement.hasAttribute('data-close-fieldset')) {
            domElement.closest('fieldset').classList.remove('opened')
        }
    }
}

function clearFields(event) {
    const fieldset_grid =  event.currentTarget.closest('.fieldset_grid');
    resetFields(fieldset_grid)
    if (event.currentTarget.hasAttribute('data-close-fieldset')) {
        fieldset_grid.closest('fieldset').classList.remove('opened')
    }
};

function removeStill(el) {
    resetFields(el.currentTarget.closest('.still'))
}

function resetFields(element) {
    element.querySelectorAll('.imgPreview').forEach(el => { el.setAttribute('data-is-deleted', true)});
    emptyFields(element)
}

function emptyFields(element) {
    element.querySelectorAll('input[type="file"], input[type="number"], input[type="text"], input[type="url"], select, input[type="hidden"], input[type="checkbox"], input[type="url"], textarea, input[list="name"]').forEach(el => el.value="" );
    element.querySelectorAll('.imgPreview').forEach(el => { el.src = el.getAttribute('data-placeholder-img'); el.removeAttribute('data-image-id') });
    element.querySelectorAll('audio').forEach(el => { el.style.display = 'none';  el.src = ''});
    element.querySelectorAll('.error').forEach(el => el.innerHTML = '')
}

document.querySelectorAll('.show_form_fields').forEach(function (button) {
    button.addEventListener('click', function (event) {
        showFormFields(event)
        const el = event.currentTarget.closest('fieldset').querySelector('input, select');
        if (el) {
            el.focus()
        }
    });
});

function showFormFields(event) {
    const fieldset = event.currentTarget.closest('fieldset')
    fieldset.classList.add('opened')
}

function showFilmographyFields(event) {
    const fieldset = event.currentTarget.closest('fieldset')
    fieldset.classList.add('opened')
    event.currentTarget.closest('fieldset').querySelector('.filmography_form.template').style.display = 'block'
    event.currentTarget.closest('fieldset').querySelector('.filmography_form.template').querySelector('select').focus()
}

function showClientFields(event) {
    const fieldset = event.currentTarget.closest('fieldset')
    fieldset.classList.add('opened')
    event.currentTarget.closest('fieldset').querySelector('.client_form.template').style.display = 'block'
    event.currentTarget.closest('fieldset').querySelector('.client_form.template input').focus()
}

document.querySelectorAll('.hide_fieldset_fields').forEach(function (button) {
    button.addEventListener('click', hideFieldsetFields);
});

document.querySelector('[name="country"]').addEventListener('input', event => {
    const show_dropdown_fields = event.target.options[event.target.selectedIndex].text == 'Estonia'
    document.querySelectorAll('[name="county"], [name="municipality"]').forEach(el => el.style.display = show_dropdown_fields ? 'block' : 'none');
    document.querySelectorAll('[name="add_county"], [name="add_municipality"]').forEach(el => el.style.display = show_dropdown_fields ? 'none' : 'block');
})

function orderedRaFChanged(el) {
    validateField(el)
    refreshActorSubFormClass()
}

function refreshActorSubFormClass() {
    const isActor = Array.from(document.querySelectorAll('[name="orderedRaF"]')).some(el => el.value == ROLE_AT_FILM_ACTOR_ID)
    document.getElementById('actor_fieldset').classList.toggle('hide_actor', !isActor)
}

function hideFieldsetFields(el) {
    const fieldset = el.currentTarget.closest('fieldset')
    fieldset.classList.remove('opened')
    resetFields(fieldset)
}

const fetchData = async (type) => {
    const accessToken = localStorage.getItem('ID_TOKEN')
    const headers = { Authorization: `Bearer ${accessToken}` }
    let url = `${huntAuthDomain}/api/${type}`
    const response = await fetch(url, { headers })
    const data = await response.json()
    return data
}

function resetSelects(domElement, fieldName) {
    while (domElement.querySelectorAll(`[name^="${fieldName}"]`).length > 1) {
        domElement.querySelector(`[name^="${fieldName}"]:last-of-type`).closest('.sub_form').remove()
    }
    domElement.querySelector(`[name^="${fieldName}"]:last-of-type`).value = ""
}

function setSelectByFieldName(domElement, values, fieldName) {
    resetSelects(domElement, fieldName)
    if (values === null || values === undefined ) {
        return
    }

    if (!Array.isArray(values)) {
        if (typeof values === 'object') {
            values = [values.id]
        } else {
            values = [values]
        }
    }else if (typeof values[0] === 'object') {
        values = values.map( value => value.id)
    }

    let lastElement = domElement.querySelector(`[name^="${fieldName}"]:last-of-type`)
    values = values.filter(val => lastElement.querySelector(`[value="${val}"]`));
    for (let i = 0; i < values.length; i++) {
        let value = values[i];
        if (i === 0) {
            lastElement.value = value
            lastElement.dispatchEvent(new Event('input', { 'bubbles': false }))
        } else {
            let newChild = lastElement.closest('.sub_form').cloneNode(true)
            newChild.querySelector('select').value = value
            lastElement.closest('.sub_form').after(newChild)
            newChild.querySelector('select').dispatchEvent(new Event('input', { 'bubbles': false }))
            lastElement = newChild
        }
    }
}

document.querySelectorAll('.addProSection .textarea textarea').forEach(function (textarea) {
    textarea.addEventListener('input', event => updateTextareaCounter(event.target));
});

document.querySelector('.addProSection [name^="name_en"]').addEventListener('input', function (event) {
    document.querySelector(`.addProSection [name^="profile_url"]`).value = "https://industry.poff.ee/" + slugify(event.target.value)
});

document.querySelectorAll('.addProSection [name^="firstName"], .addProSection [name^="lastName"]').forEach(element => element.addEventListener('input', refreshUrl))

function refreshUrl() {
    const firstName = document.querySelector('.addProSection [name^="firstName"]').value
    const lastName = document.querySelector('.addProSection [name^="lastName"]').value
    document.querySelector(`.addProSection [name^="profile_url"]`).value = "https://industry.poff.ee/" + slugify(`${firstName}-${lastName}`)
}

function updateTextareaCounter(textarea) {
    let charCount = textarea.value.length
    const maxCount = textarea.closest('.textarea').querySelector('.maximum_count').innerHTML
    if (charCount > maxCount) {
        textarea.value = textarea.value.substring(0, maxCount)
        charCount = maxCount
    }
    textarea.closest('.textarea').querySelector('.current_count').innerHTML = charCount
}

function getFields(type) {
    if (type == 'organisationprofile') {
        return getOrganisationFields()
    } else if (type == 'personprofile') {
        return getPersonFields()
    }
}

async function saveForm() {
    document.getElementById('loader').classList.add('loading')
    let saveButton = document.getElementById(`saveButton`)
    saveButton.disabled = true

    if (isFormValid(document.querySelector('.addProSection'), getFields(activeFormType))) {
        const formData = collectFormData(document.querySelector('.addProSection'), getFields(activeFormType))
        const response = await sendData(formData)
        if (response) {
            showPopup(translate(activeFormType == 'organisationprofile' ? 'messageOrganisationSaveSuccess' : 'messagePersonSaveSuccess'))
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    saveButton.disabled = false
    document.getElementById('loader').classList.remove('loading')
}

async function sendData(data) {
    data['id'] = formOriginalData['id']
    const endpoint = activeFormType == 'personprofile' ? 'person': 'organisation'
    console.log('Send:', endpoint, data)

    const formData = new FormData()
    if (data.new_files) {
        Object.entries(data.new_files).forEach(([key, file]) => {
            formData.append(`files.${key}`, file, file.file)
        });
        delete data.new_files
    }
    data['addProType'] = endpoint
    formData.append('data', JSON.stringify(data))

    let response = await fetch(`${huntAuthDomain}/api/addpro`, {
        method: 'PUT',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('ID_TOKEN')
        },
        body: formData
    })

    console.log('Send data response', endpoint, response)
    const response_data = await response.json()
    if (response_data.statusCode == 200) {
        if (activeFormType == 'organisationprofile' && response_data.organisation !== undefined) {
            formOriginalData = await response_data.organisation
            state.newCollectionIds = await response_data.newCollectionIds
            return await response_data.organisation
        }

        if (activeFormType == 'personprofile' && response_data.person !== undefined) {
            formOriginalData = await response_data.person
            state.newCollectionIds = await response_data.newCollectionIds
            return await response_data.person
        }
    }
    showErrorMsg(translate('messageErrorOnSave'))
    return false

}

function isFormValid(formElement, fields) {
    let firstInvalidElement = false
    for (let field_name in fields) {
        element = formElement.querySelector(`[name="${field_name}"]`)
        if (element && element.hasAttribute('data-validate')) {
            if (!validateField(element) && firstInvalidElement === false) {
                firstInvalidElement = element
            }
        }
    }

    if (firstInvalidElement) {
        firstInvalidElement.scrollIntoView(true)
    }

    return firstInvalidElement === false
}

function collectFormData(formElement, fields) {
    const formData = {new_files: {}}
    for (var field_name in fields) {
        const conf = fields[field_name]

        if (conf.collectFunction !== undefined) {
            conf.collectFunction(field_name, conf, formData, formElement)
        } else if (conf.type == 'checkbox') {
            formData[conf.field] = formElement.querySelector(`[name="${field_name}"]`).checked ? 1 : 0
        } else if (conf.type == 'select') {
            formData[conf.field] = Array.from(formElement.querySelectorAll(`[name="${field_name}"]`)).map(el => parseInt(el.value)).filter(el => !isNaN(el))
        } else if (conf.type == 'collection') {
            formData[conf.field] = collectFormData(formElement.querySelector(`.${field_name}`), conf.fields)
        } else {
            formData[conf.field] = formElement.querySelector(`[name="${field_name}"]`).value
        }

        if (conf.sendType === 'Integer') {
            if (Array.isArray(formData[conf.field])) {
                formData[conf.field] = formData[conf.field][0]
            }
            formData[conf.field] = isNaN(formData[conf.field]) ? null : parseInt(formData[conf.field])
        } else if (conf.sendType === 'url') {
            formData[conf.field] = addHttpsIfNoPrefix(formData[conf.field])
        }
    }

    return formData
}
function addHttpsIfNoPrefix(url) {
    if (url == null || url == "" || url.toLowerCase().startsWith('http')) {
        return url
    }
    return `https://${url}`
}

function collectGalleryData(field_name, conf, orgToSend, formElement)
{
    orgToSend['images'] = []
    const images = formElement.querySelectorAll('.gallery')
    for (let index = 0; index < images.length; index++) {
        const imageElement = images[index]
        const id = imageElement.querySelector(`[name="id"]`).value

        const metadata = generateImageMetadataJson(imageElement)
        const files = imageElement.querySelector(`[name="${field_name}"]`).files
        if (files.length) {
            orgToSend['new_files'][`images.new.img.${index}`] = files[0]
            orgToSend[`files.images.new.metadata.${index}`] = metadata
            orgToSend['images'].push(`|${index}|`)
        } else {
            orgToSend['images'].push(id)
            if (isImageMetaDataChanged(id, metadata)) {
                orgToSend[`files.images.changed.metadata.${id}`] = metadata
            }
        }
    };
}

function collectStill(field_name, conf, orgToSend, formElement) {
    const imageElement = formElement.querySelector(`[name="${field_name}"]`).closest('.fieldset_grid')
    const files = formElement.querySelector(`[name="${field_name}"]`).files

    if (files.length) {
        orgToSend['new_files'][conf.field] = files[0]
    } else {
        const imgPreviewElement = imageElement.querySelector('.imgPreview')
        if (imgPreviewElement.hasAttribute('data-is-deleted')) {
            orgToSend[`deleted_img_${field_name}`] = true
        }
    }
}

function collectImgData(field_name, conf, orgToSend, formElement) {
    const imageElement = formElement.querySelector(`[name="${field_name}"]`).closest('.fieldset_grid')
    const files = formElement.querySelector(`[name="${field_name}"]`).files
    const imageMetadata = generateImageMetadataJson(imageElement)
    orgToSend[`metadata_${conf.field}`] = imageMetadata

    if (files.length) {
        orgToSend['new_files'][conf.field] = files[0]
    } else {
        const imgPreviewElement = imageElement.querySelector('.imgPreview')
        if (imgPreviewElement.hasAttribute('data-is-deleted')) {
            orgToSend[`deleted_${conf.field}`] = true
        }
    }
}

function collectAudioreelData(field_name, conf, orgToSend, formElement) {
    const audioreelElement = formElement.querySelector(`[name="${field_name}"]`).closest('.fieldset_grid, .fieldset_grid_two_column, .fieldset_grid_one_column')
    const files = formElement.querySelector(`[name="${field_name}"]`).files

    if (files.length) {
        orgToSend['new_files'][conf.field] = files[0]
    } else {
        const audioreelPreview = audioreelElement.querySelector('#audioreel_preview')
        if (audioreelPreview.style.display == 'none') {
            orgToSend['deleted_audioreel'] = true
        }
    }
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

function isImageMetaDataChanged(id, newMetadata) {
    for (let index = 0; index < formOriginalData.images.length; index++) {
        if (formOriginalData.images[index].id == id) {
            return newMetadata != formOriginalData.images[index].caption
        }
    }
    return false
}

function fillFilmographies(domElement, filmographies, fieldName) {
    const filmographiesElement = document.querySelector(".filmographies .list")
    const onGoingProjectsElement = document.querySelector(".on_going_projects .list")
    const educationsElement = document.querySelector(".educations .list")

    filmographiesElement.innerHTML = ""
    onGoingProjectsElement.innerHTML = ""

    for (let i = 0; i < filmographies.length; i++) {
        if (filmographies[i].type_of_work == TYPE_OF_WORK_EDUCATION_ID) {
            const filmographyDiv = getEducationSummaryrow(filmographies[i], educationsElement.childNodes.length + 1)
            educationsElement.appendChild(filmographyDiv)

            educationsElement.closest('fieldset').classList.add('opened')

        } else if (filmographies[i].is_ongoing) {
            const filmographyDiv = getFilmographySummaryRow(filmographies[i], onGoingProjectsElement.childNodes.length + 1)
            onGoingProjectsElement.appendChild(filmographyDiv)

            onGoingProjectsElement.closest('fieldset').classList.add('opened')
        } else {
            const filmographyDiv = getFilmographySummaryRow(filmographies[i], filmographiesElement.childNodes.length + 1)
            filmographiesElement.appendChild(filmographyDiv)

            filmographiesElement.closest('fieldset').classList.add('opened')
        }
    }
}

function collectFilmographies(field_name, conf, formData, formElement) {
    return
}

function updateFilmographyhSummaryRow(form, data) {
    const targetClass = data.type_of_work == TYPE_OF_WORK_EDUCATION_ID ? '.educations': (data.is_ongoing ? '.on_going_projects': '.filmographies')
    let targetDiv = document.querySelector(`${targetClass} .list`)
    const filmographyDiv = data.type_of_work == TYPE_OF_WORK_EDUCATION_ID ? getEducationSummaryrow(data, 'nr') : getFilmographySummaryRow(data, 'nr')
    updateCollectionSummaryRow(targetDiv, form, filmographyDiv)
}

function updateCollectionSummaryRow(targetDiv, form, rowDiv) {
    if (form.closest('.list')) {
        form.closest('.list').replaceChild(rowDiv, form.closest('.collection_entry'))
    } else {
        targetDiv.appendChild(rowDiv)
    }

    if (refreshRowNumbers(targetDiv) == 0) {
        targetDiv.closest('fieldset').classList.remove('opened')
    }
}

function getEducationSummaryrow(filmography, index)
{
    const template = document.querySelector('.education_row_template .filmography')
    let filmographyDiv = template.cloneNode(true)

    filmographyDiv.querySelector('strong').innerHTML = filmographyDiv.querySelector('strong').innerHTML.
        replace('%nr%', index).
        replace('%org_name%', filmography.org_name).
        replace('%years%', getEducationYears(filmography))

    filmographyDiv.querySelector('button').setAttribute('onclick', `toggleFilmography(event, "${filmography.id}", 'education')`)
    return filmographyDiv
}

function getEducationYears(filmography)
{
    let years = ''
    if (filmography.year_from) {
        years = ` ${filmography.year_from}`
    }
    if (filmography.year_to) {
        if (years) {
            years += ' -'
        }
        years += ` ${filmography.year_to}`
    }
    return years
}

function getFilmographySummaryRow(filmography, index) {
    const template = document.querySelector('.filmographies .filmography_row_template .filmography')
    let filmographyDiv = template.cloneNode(true)

    let roleAtFilmDiv = ''
    if (filmography.role_at_films[0]) {
        let roleAtFilm = ''
        if (filmography.role_at_films[0].roleName) {
            roleAtFilm =  filmography.role_at_films[0].roleName.en
        } else {
            roleAtFilm = document.querySelector(`[name="role_at_films"] option[value="${filmography.role_at_films[0]}"]`).text
        }
        if (roleAtFilm) {
            roleAtFilmDiv = filmographyDiv.querySelector('.role_at_film').innerHTML.replace('%role_at_film%', roleAtFilm)
        }
    }
    filmographyDiv.querySelector('.role_at_film').innerHTML = roleAtFilmDiv

    filmographyDiv.querySelector('strong').innerHTML = filmographyDiv.querySelector('strong').innerHTML.replace('%nr%', index).replace('%work_name%', filmography.work_name)

    let type = 'completed'
    if (filmography.is_ongoing) {
        filmographyDiv.querySelector('.is_featured_project').remove()
        type = 'ongoing'
    } else {
        if (filmography.is_featured) {
            filmographyDiv.querySelector('.is_featured_project').querySelector('input').checked = true
        } else {
            filmographyDiv.querySelector('.is_featured_project').querySelector('span').remove()
        }
    }

    filmographyDiv.querySelector('button').setAttribute('onclick', `toggleFilmography(event, "${filmography.id}", "${type}")`)
    return filmographyDiv
}

function getClientSummaryRow(client, index) {
    const template = document.querySelector('.clients .client_row_template .client')
    let clientDiv = template.cloneNode(true)

    clientDiv.querySelector('strong').innerHTML = clientDiv.querySelector('strong').innerHTML.replace('%nr%', index).replace('%client_name%', client.name)
    clientDiv.querySelector('button').setAttribute('onclick', `toggleClient(event, "${client.id}")`)

    return clientDiv
}

function getAssetsUrl() {
    if (strapiDomain.includes('admin.poff.ee')) {
        return 'https://assets.poff.ee/img/'
    }
    return  `${strapiDomain}/uploads/`;
}

function toggleClient(event, id) {
    const form =  event.currentTarget.closest('.client').querySelector('.filled_client .client_form')
    if (event.currentTarget.classList.contains('opened')) {
        if (form.getAttribute('data-is-changed') === "false" || confirm(translate("collectionDataChanged"))) {
            event.currentTarget.classList.remove('opened')
            form.remove()
        }
    } else {
        event.currentTarget.classList.add('opened')
        const targetElement = event.currentTarget.closest('.client').querySelector('.filled_client')
        const data = formOriginalData['clients'].find(client => id == client.id)
        const subForm = event.currentTarget.closest('fieldset').querySelector('.client_form.template').cloneNode(true)
        subForm.classList.remove('template')
        subForm.style.display = 'block'
        targetElement.appendChild(subForm)
        subForm.setAttribute('data-is-changed', false)

        subForm.addEventListener('input', function (event) {
            event.target.closest('.client_form').setAttribute('data-is-changed', true)
        });
        fillFields(subForm, getClientFields(), data)
    }
}

async function saveClient(event) {
    const form = event.target.closest('.client_form')
    const fields = getClientFields()
    if (!isFormValid(form, fields)) {
        return;
    }

    document.getElementById('loader').classList.add('loading')
    let saveButton = document.getElementById(`saveButton`)
    saveButton.disabled = true

    data = collectFormData(form, fields)
    const result = await sendClient(data)

    if (result) {
        showSuccessMsg(translate('messageClientSaveSuccess'))
        const id = data.id ? data.id : state?.newCollectionIds?.client
        const client = formOriginalData['clients'].find((element) => element.id == id)
        updateCollectionSummaryRow(document.querySelector(".clients .list"), form, getClientSummaryRow(client, 'nr'))
        if (!data.id) {
            closeClientForm(form)
        }
    }

    saveButton.disabled = false
    document.getElementById('loader').classList.remove('loading')

}

async function removeClient(event) {
    const form = event.currentTarget.closest('.client_form')
    const id = event.currentTarget.closest('.client_form').querySelector(`[name="id"]`).value
    if (id) {
        const clients = {
            'clients': formOriginalData['clients'].filter((client) => client['id'] != id).map(client => client.id)
        }

        document.getElementById('loader').classList.add('loading')

        const result = await sendData(clients)

        document.getElementById('loader').classList.remove('loading')

        if (result) {
            closeClientForm(form)
        }
    } else {
        closeClientForm(form)
    }
}

function closeClientForm(form) {
    const fieldset = form.closest('fieldset')
    if (form.classList.contains('template')) {
        form.style.display = 'none'
        resetFields(form)
    } else {
        form.closest('.client').remove()
    }
    if (refreshRowNumbers(fieldset.querySelector('.list')) == 0) {
        fieldset.classList.remove('opened')
    }
}

function toggleIsFeatured(event) {
    event.currentTarget.closest('.filmography_form').classList.toggle("featured_filmography", event.currentTarget.checked);
}

function toggleFilmography(event, id, type) {
    if (event.currentTarget.classList.contains('opened')) {
        const form = event.currentTarget.closest('.filmography').querySelector('.filled_filmography .filmography_form')
        if (form && form.getAttribute('data-is-changed') === "false" || confirm(translate("collectionDataChanged"))) {
            event.currentTarget.classList.remove('opened')
            form.remove()
        }
    } else {
        const formFields = getFilmographyFields(type)
        const data = getFilmographyById(id);
        event.currentTarget.classList.add('opened')
        const targetElement = event.currentTarget.closest('.filmography').querySelector('.filled_filmography')
        const subForm = event.currentTarget.closest('fieldset').querySelector('.filmography_form.template').cloneNode(true)
        subForm.classList.remove('template')
        subForm.classList.toggle('featured_filmography', !data.is_ongoing && data.is_featured)
        subForm.style.display = 'block'
        subForm.setAttribute('data-is-changed', false)

        fillFields(subForm, formFields, data)
        subForm.addEventListener('input', function (event) {
            event.target.closest('.filmography_form').setAttribute('data-is-changed', true)
        });
        targetElement.appendChild(subForm)
    }
}

async function saveFilmography(event, type) {
    const form = event.target.closest('.filmography_form')
    const fields = getFilmographyFields(type)
    if (!isFormValid(form, fields)) {
        return;
    }

    document.getElementById('loader').classList.add('loading')
    let saveButton = document.getElementById(`saveButton`)
    saveButton.disabled = true

    data = collectFormData(form, fields)
    data['is_ongoing'] = type == 'ongoing' ? 1 : 0
    if (type == "education") {
        data['type_of_work'] = TYPE_OF_WORK_EDUCATION_ID
    }
    const result = await sendFilmography(data)

    if (result) {
        showSuccessMsg(translate('messageFilmographySaveSuccess'))
        const id = data.id ? data.id : state?.newCollectionIds?.filmography
        const filmography = formOriginalData['filmographies'].find((element) => element.id == id)

        updateFilmographyhSummaryRow(form, filmography)
        if (!data.id) {
            closeFilmographyForm(form)
        }
    }

    saveButton.disabled = false
    document.getElementById('loader').classList.remove('loading')
}

function sendClient(data) {
    return sendData({
        'client': data
    })
}

function sendFilmography(data)
{
    const formData = {}
    formData['new_files'] = data['new_files']
    delete data['new_files']
    formData['filmography'] = data
    return sendData(formData)
}

function removeFilmography(event) {
    const form = event.currentTarget.closest('.filmography_form')
    const id = event.currentTarget.closest('.filmography_form').querySelector(`[name="id"]`).value
    if (id) {
        const formData = {
            'filmographies': formOriginalData['filmographies'].filter((filmography) => filmography['id'] != id).map(filmography => filmography.id)
        }

        document.getElementById('loader').classList.add('loading')
        const result = await(formData)
        document.getElementById('loader').classList.remove('loading')

        if (result) {
            closeFilmographyForm(form)
        }
    } else {
        closeFilmographyForm(form)
    }
}

function closeFilmographyForm(form) {
    const fieldset = form.closest('fieldset')
    if (form.classList.contains('template')) {
        form.style.display = 'none'
        resetFields(form)
    } else {
        form.closest('.filmography').remove()
    }
    if (refreshRowNumbers(fieldset.querySelector('.list')) == 0) {
        fieldset.classList.remove('opened')
    }
}

function getFilmographyById(id) {
    for (let i = 0; i < formOriginalData['filmographies'].length; i++) {
        if (formOriginalData['filmographies'][i].id == id) {
            return formOriginalData['filmographies'][i];
        }
    }
    return {}
}

function validateField(element) {
    const rules = element.getAttribute('data-validate')
    if (rules === null) {
        return true
    }
    const errors = validate(element, rules.split('|'));

    let errorDiv = element.closest('.form_group').querySelector('.error')
    if (element.closest('label') && element.closest('label').querySelector('.error')) {
        errorDiv = element.closest('label').querySelector('.error')
    }
    errorDiv.innerHTML = (errors) ? errors.join('<br />') : '';
    return errors.length === 0
}

function isNumberInRange(value, min, max) {
    value = Number(value)
    if (!Number.isInteger(value)) {
        return false
    }
    if (value < min) {
        return false
    }
    if (value > max) {
        return false
    }
    return true
}

function validate(field, validators) {
    const errors = [];
    const fieldValue = field.value
    validators.forEach(validator => {
        if (validator == 'required' && fieldValue == "") {
            errors.push(translate('validationErrorRequiredField'))
        } else if (validator == 'at-least-one-option-selected') {
            const values = Array.from(field.closest('.form_group').querySelectorAll(`[name="${field.name}"]`)).map(el => parseInt(el.value)).filter(el => !isNaN(el))
            if (!values.length) {
                errors.push(translate('validationErrorRequiredField'))
            }
        } else if (validator == 'is-number-between-1-10000' && fieldValue != "" && !isNumberInRange(fieldValue, 1, 10000)) {
            errors.push(translate('validatinErrorInvalidNumberBetween1_10000'))
        } else if (validator == 'is-number-0-to-100' && fieldValue != "" && !isNumberInRange(fieldValue, 0, 100)) {
            errors.push(translate('validationErrorInvalidNumber_0_to_100'))
        } else if (validator == 'is-number-0-to-500' && fieldValue != "" && !isNumberInRange(fieldValue, 0, 500)) {
            errors.push(translate('validationErrorInvalidNumber_0_to_500'))
        } else if (validator == 'is-valid-year' && fieldValue != "" && !/^(19|20)\d{2}$/.test(fieldValue)) {
            errors.push(translate('validationErrorInvalidYear'))
        } else if (validator == 'is-email' && (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(fieldValue))) {
            errors.push(translate('validationErrorEmail'))
        } else if (validator == 'is-phone-nr' && fieldValue != "" && !/^[+]?[\s./0-9]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/g.test(fieldValue)) {
            errors.push(translate('validationErrorPhone'))
        } else if (validator == 'is-showreel' && fieldValue != "") {
            const youtubeRegex = /(?:(?:https?:)?\/\/)?(?:(?:www|m)\.)?(?:(youtube(?:-nocookie)?\.com|youtu.be))(?:\/(?:[\w\-]+\?v=|embed\/|live\/|v\/)?)([\w\-]+)(?:\S+)?/
            const vimeoRegex = /(?:http|https)?:?\/?\/?(?:www\.)?(?:player\.)?(vimeo\.com)\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|video\/|)(\d+)(?:|\/\?)/
            if (!youtubeRegex.test(fieldValue) && !vimeoRegex.test(fieldValue)) {
                errors.push(translate('validationErrorShowreel'))
            }
        } else if (validator == 'still-image') {
            const isFeatured = field.closest('.filmography_form').querySelector('input[name="is_featured"]').checked
            const imgPreview = field.closest('.form_group').querySelector('.imgPreview')
            if (isFeatured && field.files.length == 0 && !imgPreview.hasAttribute('data-image-id')) {
                errors.push(translate('validationErrorMissingStill'))
            }
        }
    });
    return errors
}

const fillForm = (entity, fields,  error) => {
    if (entity.id) {
        fillFields(document.querySelector('.addProSection'), fields, entity)
    } else {
        showPopup(error)
    }
}

function getImageMetaData(field) {
    let data = {};
    try {
        data = JSON.parse(field)
        if (typeof data !== "object" || data == null) {
            data = {}
        }
    } catch (e) {
        data = {}
    }

    return {
        caption: data.caption ?? "",
        photographer: data.photographer ?? "",
        img_year: data.img_year ?? ""
    }
}

function generateImageMetadataJson(imageElement) {
    return JSON.stringify({
        caption: imageElement.querySelector(`[name="caption"]`).value,
        photographer: imageElement.querySelector(`[name="photographer"]`).value,
        img_year: imageElement.querySelector(`[name="img_year"]`).value
    })
}

function fillStill(imgEl, val, fieldName) {
    if (!Array.isArray(val) || val.length < 1) {
        return
    }
    val = val[0]
    imgEl.querySelector('.imgPreview').src = `${getAssetsUrl()}${val.hash}${val.ext}`
    imgEl.querySelector('.imgPreview').setAttribute('data-image-id', val.id)
    imgEl.classList.add('preview_image_filled')

}

function fillImage(domElement, val, fieldName = false) {
    const imgEl = fieldName ? domElement.querySelector(`[name="${fieldName}"]`).closest('.fieldset_grid') : domElement
    const metaData = getImageMetaData(val.caption)
    imgEl.querySelector(`[name="caption"]`).value = metaData.caption
    imgEl.querySelector(`[name="photographer"]`).value = metaData.photographer
    imgEl.querySelector(`[name="img_year"]`).value = metaData.img_year
    imgEl.querySelector('.imgPreview').src = `${getAssetsUrl()}${val.hash}${val.ext}`
    if (imgEl.querySelector(`[name="id"]`)) {
        imgEl.querySelector(`[name="id"]`).value = val.id
    }
}

function fillGallery(domElement, val, fieldName) {
    while (domElement.querySelectorAll('.gallery').length > 1) {
        let gallery = domElement.querySelectorAll(`.gallery`)
        gallery[gallery.length -1].remove()
    }

    let gallery = domElement.querySelector('.gallery')
    for (let i = 0; i < val.length; i++) {
        fillImage(gallery, val[i])
        if (i < val.length - 1) {
            gallery = duplicateElement(gallery)
        }
    }
}

function fillAudioreel(domElement , val, fieldName) {
    if (val && val.hash && val.ext) {
        const htmlElement = domElement.querySelector(`[name="${fieldName}"]`).closest('.fieldset_grid');
        htmlElement.querySelector('#audioreel_preview').src = `${getAssetsUrl()}${val.hash}${val.ext}`
        htmlElement.querySelector('#audioreel_preview').style.display = "block"
    }
}

function fillFields(domElement, fields, data) {
    for (var field_name in fields) {
        const conf = fields[field_name]
        let val = data[conf.field]

        if (conf.fillFunction) {
            if (val !== null && val !== undefined) {
                conf.fillFunction(domElement, val, field_name)
            }
        } else if (fields[field_name].type == 'select') {
            setSelectByFieldName(domElement, val, field_name)
        } else if (fields[field_name].type == 'checkbox') {
            domElement.querySelector(`[name="${field_name}"]`).checked = val;
        } else if (fields[field_name].type == 'collection') {
            if (val !== null && val !== undefined) {
                fillFields(domElement.querySelector(`.${field_name}`), conf.fields, val)
            }
        } else {
            domElement.querySelector(`[name="${field_name}"]`).value = val ?? ""
            domElement.querySelector(`[name="${field_name}"]`).dispatchEvent(new Event('input', { 'bubbles': false }))
        }
        if (val && ((typeof val != 'object' && val) || (typeof val == 'object' && Object.keys(val).length))) {
            const field = domElement.querySelector(`input[name="${field_name}"], select[name="${field_name}"]`)

            if (field) {
                if (domElement.querySelector('fieldset') || domElement.tagName.toLowerCase() == 'fieldset') {
                    field.closest('fieldset').classList.add('opened')
                }
            }
        }
    }
}

function fillOrderedRaF(domElement, val, field_name) {
    const sortedValues = val.sort((a, b) => a.order > b.order).map((e) => {return  { id: e.role_at_film.id } })
    setSelectByFieldName(domElement, sortedValues, field_name)
}

function collectOrderedRaf(field_name, conf, formData, formElement) {
    formData[conf.field] = Array.from(formElement.querySelectorAll(`[name="${field_name}"]`)).filter(el => el.value != '').map((el, index) => { return { role_at_film: parseInt(el.value), order: index + 1} })
}

function fillClients(domElement, clients, fieldName) {
    const clientsList = document.querySelector(".clients .list")
    clientsList.innerHTML = ""

    for (let i = 0; i < clients.length; i++) {
        const clientDiv = getClientSummaryRow(clients[i], clientsList.childNodes.length + 1)
        clientsList.appendChild(clientDiv)
        clientDiv.closest('fieldset').classList.add('opened')
    }
}

function collectClients(field_name, conf, formData, formElement) {
    return;
}

function translate(template, variables = {}) {
    const element = document.querySelector(`#translationStrings .${template}`)
    if (!element) {
        return template
    }
    let text = element.innerHTML
    Object.entries(variables).forEach(([key, value]) => {
        text = text.replace(`%${key}%`, value)
    });
    return text
}

function previewImage(event) {
    const file = event.currentTarget.files[0]
    const imageElement = event.currentTarget.closest('.form_group')
    let error = imageElement.querySelector(".error")
    let previewElement = imageElement.getElementsByClassName('imgPreview')[0]

    if (!file.type.includes("image")) {
        error.innerHTML = translate('validatioErrorFileIsNotImage')
        previewElement.src = previewElement.getAttribute('data-placeholder-img')
        imageElement.querySelector('input[type="file"]').value = ''
        imageElement.classList.remove('preview_image_filled')
    } else if (file.size / 1024 / 1024 > 5) {
        error.innerHTML = translate('validationErrorImageFileIsToBig', {size: (file.size / 1024 / 1024).toFixed(2)})
        previewElement.src = previewElement.getAttribute('data-placeholder-img')
        imageElement.querySelector('input[type="file"]').value = ''
        imageElement.classList.remove('preview_image_filled')
    } else {
        error.innerHTML = ""
        var reader = new FileReader()
        reader.onload = function () {
            previewElement.src = reader.result
        }
        reader.readAsDataURL(file)
        imageElement.classList.add('preview_image_filled')

    }
}

function previewAudioreel(event) {
    const file = event.currentTarget.files[0]
    const audioreelElement = event.currentTarget.closest('.form_group')
    let error = audioreelElement.querySelector(".error")
    let previewElement = audioreelElement.querySelector('#audioreel_preview')

    if (!file.type.includes("audio")) {
        audioreelElement.querySelector('input[type="file"]').value = '';
        previewElement.src = '';
        previewElement.style.display = 'none';

        error.innerHTML = translate('validatioErrorFileIsNotAudio')
    } else if (file.size / 1024 / 1024 > 5) {
        audioreelElement.querySelector('input[type="file"]').value = '';
        previewElement.src = '';
        previewElement.style.display = 'none';

        error.innerHTML = translate('validationErrorAudioFileIsToBig', {size: (file.size / 1024 / 1024).toFixed(2)})
    } else {
        error.innerHTML = '';
        var reader = new FileReader()
        reader.onloadend = function (e) {
            previewElement.src = e.target.result;
            previewElement.style.display= 'block'
        };
        reader.readAsDataURL(file);
    }
}

//start sortable role_at_films fieds
Sortable.create(document.querySelector('.orderedRaF'),  {
    handle: '.drag_me', // handle's class
    animation: 150,
    draggable: '.sub_form'
});

function refreshRowNumbers(element) {
    const nrFields = element.querySelectorAll('.nr');
    for (let index = 0; index < nrFields.length; index++) {
        nrFields[index].innerHTML = `${index+1}.`
    }
    return nrFields.length
}

const observer = new MutationObserver(function(mutationsList, observer) {
    refreshRowNumbers(document.querySelector('.orderedRaF'))
});

observer.observe(document.querySelector('.orderedRaF'), {characterData: false, childList: true, attributes: false});
//end sortable role_at_films fieds

function showSuccessMsg(message) {
    const notification = document.getElementById('alertSuccess')
    notification.innerHTML = message
    notification.style.display = 'block'
    setTimeout(()=>{notification.style.display = 'none';}, 5000);
}

function showErrorMsg(message) {
    const notification = document.getElementById('alertError')
    notification.innerHTML = message
    notification.style.display = 'block'
    setTimeout(()=>{notification.style.display = 'none';}, 5000);
}

function showPopup(message) {
    document.getElementById('infoPopup').querySelector('p').innerHTML = message
    document.getElementById('infoPopup').style.display = "block"
}

const getPersonFields = () => {
    let fields = getOrganisationFields()
    delete fields['name_en']
    delete fields['employees_n']
    delete fields['creative_gate_relations']
    delete fields['client_name']
    delete fields['description_en']
    delete fields['languages']
    delete fields['logoColour']
    delete fields['profile_img']


    fields['logoColour'] = {
        field: 'profile_img',
        collectFunction: collectImgData,
        fillFunction: fillImage
    }

    fields['firstName'] = {
        'field': 'firstName'
    }
    fields['lastName'] = {
        'field': 'lastName'
    }
    fields['gender'] = {
        field: 'gender',
        type: 'select',
        sendType: 'Integer',
    }
    fields['native_lang'] = {
        field: 'native_lang',
        type: 'select',
        sendType: 'Integer',
    }
    fields['other_lang'] = {
        field: 'other_lang',
        type: 'select',
    }

    fields['acc_etalenta'] = {
        field: 'acc_etalenta',
        sendType: 'url',
    }

    fields['acc_castupload'] = {
        field: 'acc_castupload',
        sendType: 'url',
    }

    fields['acting_age_from'] = {
        field: 'acting_age_from',
        sendType: 'Integer',
    }

    fields['acting_age_to'] = {
        field: 'acting_age_to',
        sendType: 'Integer',
    }

    fields['weight_kg'] = {
        field: 'weight_kg',
        sendType: 'Integer',
    }

    fields['height_cm'] = {
        field: 'height_cm',
        sendType: 'Integer',
    }

    fields['eye_colour'] = {
        field: 'eye_colour',
        type: 'select',
        sendType: 'Integer',
    }

    fields['hair_colour'] = {
        field: 'hair_colour',
        type: 'select',
        sendType: 'Integer',
    }

    fields['hair_length'] = {
        field: 'hair_length',
        type: 'select',
        sendType: 'Integer',
    }
    fields['pitch_of_voice'] = {
        field: 'pitch_of_voice',
        type: 'select',
        sendType: 'Integer',
    }

    fields['stature'] = {
        field: 'stature',
        type: 'select',
        sendType: 'Integer',
    }

    fields['description_en'] = {
        field: 'bio_en',
    }

    return fields;
}

const getOrganisationFields = () =>  {
    return  {
        name_en: {
            field: 'name_en',
        },
        h_rate_from: {
            field: 'h_rate_from',
            sendType: 'Integer',
        },
        h_rate_to: {
            field: 'h_rate_to',
            sendType: 'Integer',
        },
        orderedRaF: {
            field: 'orderedRaF',
            type: 'custom',
            fillFunction: fillOrderedRaF,
            collectFunction: collectOrderedRaf,
        },

        filmographies: {
            field: 'filmographies',
            type: 'custom',
            fillFunction: fillFilmographies,
            collectFunction: collectFilmographies
        },

        employees_n: {
            field: 'employees_n',
            sendType: 'Integer',
        },
        languages: {
            field: 'languages',
            type: 'select',
        },
        creative_gate_relations: {
            field: 'people',
            type: 'select'
        },
        description_en: {
            field: 'description_en',
        },
        skills_en: {
            field: 'skills_en',
        },
        tag_looking_fors: {
            field: 'tag_looking_fors',
            type: 'select',
        },
        acc_imdb: {
            field: 'acc_imdb',
            sendType: 'url',
        },
        acc_efis: {
            field: 'acc_efis',
            sendType: 'url',
        },
        acc_instagram: {
            field: 'acc_instagram',
            sendType: 'url',
        },
        acc_fb: {
            field: 'acc_fb',
            sendType: 'url',
        },
        acc_other: {
            field: 'acc_other',
            sendType: 'url',
        },
        acc_youtube: {
            field: 'acc_youtube',
            sendType: 'url',
        },
        acc_vimeo: {
            field: 'acc_vimeo',
            sendType: 'url',
        },
        webpage_url: {
            field: 'webpage_url',
            sendType: 'url',
        },
        eMail: {
            field: 'eMail',
        },
        phoneNr: {
            field: 'phoneNr',
        },

        addr_coll: {
            type: 'collection',
            field: 'addr_coll',
            fields: {
                id: {
                    field: 'id'
                },
                country: {
                    field: 'country',
                    type: "select",
                    sendType: "Integer"
                },
                county: {
                    field: 'county',
                    type: "select",
                    sendType: "Integer"
                },

                municipality: {
                    field: 'municipality',
                    type: "select",
                    sendType: "Integer"
                },

                add_county: {
                    field: 'add_county',
                },

                add_municipality: {
                    field: 'add_municipality',
                },

                populated_place: {
                    field: 'popul_place',
                },
                street_name: {
                    field: 'street_name',
                },
                address_number: {
                    field: 'address_number',
                },
                appartment: {
                    field: 'appartment',
                },
                postal_code: {
                    field: 'postal_code',
                }
            }
        },

        client_name: {
            field: 'clients',
            type: 'custom',
            fillFunction: fillClients,
            collectFunction: collectClients
        },
        showreel: {
            field: 'showreel',
            sendType: 'url'
        },

        audioreel: {
            field: 'audioreel',
            type: 'audioreel',
            collectFunction: collectAudioreelData,
            fillFunction: fillAudioreel
        },
        logoColour: {
            field: 'logoColour',
            collectFunction: collectImgData,
            fillFunction: fillImage
        },
        profile_img: {
            field: 'profile_img',
            collectFunction: collectImgData,
            fillFunction: fillImage
        },
        images: {
            field: 'images',
            collectFunction: collectGalleryData,
            fillFunction: fillGallery
        },
        ok_to_contact: {
            field: "ok_to_contact",
            type: "checkbox"
        }
    }
}

function getFilmographyFields(type) {
    if (type == 'education') {
        return  {
            year_from: {
                field: 'year_from',
                sendType: "Integer"
            },
            year_to: {
                field: 'year_to',
                sendType: "Integer"
            },
            org_name: {
                field: 'org_name',
            },
            org_department: {
                field: 'org_department',
            },
            degree: {
                field: 'degree',
            },
            org_url: {
                field: 'org_url',
                sendType: 'url',
            },
            id: {
                field: 'id'
            }
        }
    } else if (type == 'ongoing') {
        return  {
            type_of_work: {
                field: 'type_of_work',
                type: 'select',
                sendType: 'Integer'
            },
            role_at_films: {
                field: 'role_at_films',
                type: 'select'
            },
            work_name: {
                field: 'work_name',
            },
            work_url: {
                field: 'work_url',
                sendType: 'url',
            },
            decsription_en: {
                field: 'decsription_en',
            },
            project_statuses: {
                field: 'project_statuses',
                type: 'select'
            },
            ongoing_tag_looking_fors: {
                field: 'tag_looking_fors',
                type: 'select'
            },
            id: {
                field: 'id'
            }
        }
    } else if (type == 'completed') {
        return {
            type_of_work: {
                field: 'type_of_work',
                type: 'select',
                sendType: "Integer"
            },
            role_at_films: {
                field: 'role_at_films',
                type: 'select'
            },
            year_from: {
                field: 'year_from',
                sendType: "Integer"
            },
            year_to: {
                field: 'year_to',
                sendType: "Integer"
            },
            work_name: {
                field: 'work_name',
            },
            work_url: {
                field: 'work_url',
                sendType: 'url',
            },
            runtime: {
                field: 'runtime',
                sendType: "Integer"
            },
            org_name: {
                field: 'org_name',
            },
            org_url: {
                field: 'org_url',
                sendType: 'url',
            },
            decsription_en: {
                field: 'decsription_en',
            },
            is_featured: {
                field: 'is_featured',
                type: 'checkbox'
            },

            stills: {
                field: 'stills',
                fillFunction: fillStill,
                collectFunction: collectStill
            },
            id: {
                field: 'id'
            },
        }
    }
}

function getClientFields() {
    return {
        url: {
            field: 'url',
            sendType: 'url',
        },
        description: {
            field: 'description',
        },
        name: {
            field: 'name',
        },
        id: {
            field: 'id'
        },
    }
}

; (async () => {
    requireLogin()
})()
