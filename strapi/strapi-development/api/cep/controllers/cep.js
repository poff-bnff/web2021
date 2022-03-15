'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

async function putOrPost(model_name, data) {
    console.log(data.id ? data.id : null)
    let date = Date.now()
    let updated_at = date.toISOString()
    let created_at = date.toISOString()

    let response = data.id ? await strapi.query(model_name).update({"id": data.id}, {...data, ...updated_at}) : await strapi.query(model_name).create({...data, ...created_at})
    return response
}

async function iPeopleIDs( data) { 
    let ids = []
    for (let person of data) {
        let person_data = { //map IndustryPerson data to match table data
            "id": person.ID,
            "fullNamePrivate": person.fullNamePrivate,
            "slug": person.slug,
            "created_at": new Date()
        }
        console.log(person_data)
        let i_person = await putOrPost('industry-person', person_data)
        console.log({i_person})
        ids.push(i_person.id)
    }
    return ids

}

module.exports = {
    async indusrtyEventRelated(ctx) {
        let industryEvents = ctx.request.body.IndustryEvents
        if(industryEvents) {
            for(let i_event of industryEvents ){
                let data = { //match event data to table data
                    "id": i_event.ID,
                    "titlePrivate": i_event.titlePrivate,
                    "startTime": i_event.startTime,
                    "title_en": i_event.title_en,
                    "slug_en": i_event.slug_en,

                    "industry_people": await iPeopleIDs(i_event.IndustryPeople)
                }

                let print = await putOrPost('industry-event', data)
                console.log({print})
            }
        }



        // console.log('body', ctx.request.body)
        return {"ok": "ok"}
    }

};
