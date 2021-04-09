'use strict';

/**
 * publisher.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

 const lambda = [
    'trio-bruno',
    'trio-filmikool',
    'trio-hoff',
    'trio-industry',
    'trio-just-film',
    'trio-kinoff',
    'trio-kumu',
    'trio-shorts',
    'trio-tartuff',
    'trio-p-oe-ff',
    'article-hero',
    'hero-article-bruno',
    'hero-article-filmikool',
    'hero-article-hoff',
    'hero-article-industry',
    'hero-article-just-film',
    'hero-article-kinoff',
    'hero-article-kumu',
    'hero-article-shorts',
    'hero-article-tartuff']

const addS = (result) => {

    return result.map(a => !lambda.includes(a.args.split(' ')[0]) ? a.args = `${a.args}s` : a.args)
}

module.exports = {
    addS

};
