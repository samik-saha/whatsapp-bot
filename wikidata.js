var request = require('request');
const axios = require('axios');

async function searchWikipedia(keyword) {
  if (keyword) {
    response = await axios.get("https://en.wikipedia.org/w/api.php",
      {
        params: {
          action: 'query',
          format: 'json',
          list: 'search',
          srsearch: keyword,
          srprop: 'redirecttitle',
          srlimit: 1,
          srwhat: 'nearmatch'
        }
      });

    //console.log(response.data);

    if (response.data.query.search.length > 0) {
      let title = response.data.query.search[0].title
      //console.log(title);
      let response2 = await axios.get("https://en.wikipedia.org/api/rest_v1/page/summary/" + title);
      let thumbnail_url;
      if(response2.data.thumbnail){
        let thumbnail_url=response2.data.thumbnail.source;
      }
      let extract = response2.data.extract;
      //console.log(extract);
      return {"thumbnail_url":thumbnail_url,"extract":extract};
    }
  }
}

//searchWikipedia("albert einstein");
exports.searchWikipedia = searchWikipedia;

var search_wikipedia = function (keyword, fn) {
  request({
    url: 'https://en.wikipedia.org/w/api.php',
    qs: {
      action: 'query',
      format: 'json',
      list: 'search',
      srsearch: keyword,
      srprop: 'redirecttitle',
      srlimit: 1,
      srwhat: 'nearmatch'
    },

    callback: function (err, resp, body) {
      //console.log('body: '+body);
      var obj = JSON.parse(body);
      if (obj.query.search.length > 0) {
        var title = obj.query.search[0].title;
        request({
          url: 'https://en.wikipedia.org/api/rest_v1/page/summary/' + title,
          callback: function (err, resp, body) {
            obj = JSON.parse(body);
            if (obj.thumbnail) {
              var thumbnail_url = obj.thumbnail.source;
            }
            fn(obj.title, obj.extract, thumbnail_url);
          }
        });
      }
      else {
        fn(null);
      }

    }
  });
};

//search_wikipedia('marie curie', function (title, extract) { console.log('extract: ' + extract) });

exports.search_wikipedia = search_wikipedia;

var search_wiktionary = function (headword, fn) {
  request({
    url: 'https://en.wiktionary.org/w/api.php',
    qs: {
      format: 'json',
      action: 'query',
      titles: headword,
      prop: 'extracts',
      redirects: 'true',
      explaintext: 'true'
    },

    callback: function (err, resp, body) {
      //console.log('body: '+body);
      var obj = JSON.parse(body);
      var definition = obj.query.pages[Object.keys(obj.query.pages)[0]].extract;
      definition = definition.replace(/====(.+)/g, '####$1');
      definition = definition.replace(/===(.+)/g, '###$1');
      definition = definition.replace(/==(.+)/g, '##$1');
      definition = definition.replace(/=/g, '');
      definition = definition.split('#### Translations')[0];
      if (definition) {
        fn(definition);
      }
      else {
        fn(null);
      }

    }
  });
}

exports.search_wiktionary = search_wiktionary;

//search_wiktionary('enervate',function(x){console.log(x)});



var getProperty = function (item, property, fn) {
  /* Get entity id */
  request({
    url: 'https://www.wikidata.org/w/api.php',
    qs: {
      action: 'wbgetentities',
      sites: 'enwiki',
      format: 'json',
      titles: item,
      normalize: 'true',
      props: 'info',
      languages: 'en'
    },
    callback: function (err, resp, body) {
      console.log(body);
      var obj = JSON.parse(body);
      var item_id = obj.entities[Object.keys(obj.entities)[0]].id;

      /* Get property id */
      request({
        url: 'https://www.wikidata.org/w/api.php',
        qs: {
          action: 'wbsearchentities',
          format: 'json',
          search: property,
          type: 'property',
          language: 'en'
        },
        callback: function (err, resp, body) {
          console.log(body);
          var obj = JSON.parse(body);
          if (obj.search.length > 0) {
            var property_id = obj.search[0].id;
          }
          var sparql_query = 'select ?valueLabel\
                                where{\
                                    wd:'+ item_id + ' wdt:' + property_id + ' ?value.\
                                    SERVICE wikibase:label {\
                                        bd:serviceParam wikibase:language "en" .\
                                    }\
                                }';
          request({
            url: 'https://query.wikidata.org/bigdata/namespace/wdq/sparql',
            qs: {
              format: 'json',
              query: sparql_query
            },
            callback: function (err, resp, body) {
              console.log(body);
              var obj = JSON.parse(body);
              if (obj.results.bindings.length > 0) {
                var propertyValue = obj.results.bindings[0].valueLabel.value;
              }
              fn(propertyValue);
            }
          });

        }
      });



    }

  })
}

//getProperty('earth','radius', function(c){console.log(c);});
exports.getProperty = getProperty;