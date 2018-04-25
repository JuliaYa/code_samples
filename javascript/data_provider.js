/**
 * Factories for get data from Mnemosyne and Barney and data provider
 */

brs.app.service('brsDataProvider', function(filterManager){

  var brsDataProvider = {};
  var barney_url = "/http_proxy/barney";

  var target_path = {
    seeds: '/v2/clients/' + OPTS.remote_client_id + '/seeds.json',
    stats: '/v2/clients/' + OPTS.remote_client_id + '/filters/stats.json',
    labels: '/v2/clients/' + OPTS.remote_client_id + '/labels.json',
    total_mentions: '/v2/clients/' + OPTS.remote_client_id + '/metrics/mentions_count/summary.json',
    total_mentioners: '/v2/clients/' + OPTS.remote_client_id + '/metrics/mentioners_count/summary.json'
  }

  brsDataProvider.getPath = function(target){
    var filters = filterManager.getFilters();
    if((filters.filters.text || filters.filters.tagcloud_search) && target != 'labels' && target != 'seeds'){
      return barney_url + target_path[target];
    }else{
      return MNEMOSYNE_BASE_URL + target_path[target];
    }
  };
  brsDataProvider.addGroupParamForAssessorPage = function(params){
    if(filterManager.getCurrentPage() == 'assessor' && !(params.filters.text || params.filters.tagcloud_search)){
      params.group = 'topics';
    }
    return params;
  };

  return brsDataProvider;

});

/**
 * PEOPLE
 */
brs.app.factory('PeopleResource', ['$resource',
  function($resource) {
    return $resource('/http_proxy/mnemosyne/v2/clients/:client_id/authors/:id.json',
      {
        client_id: "@client_id",
        id: "@id"
      },
      { 'get': { method: 'GET'},
        'all': { method: 'GET', isArray:false },
        'change': { method: 'PUT'},
        'cached': {method: 'GET', isArray:false, cache:true}
      });
  }
]); 

/**
 * SEEDS
 */
brs.app.factory('SeedsResource', ['$resource',
  function($resource) {
    return $resource('/http_proxy/mnemosyne/v2/clients/:client_id/seeds/:id.json',
      {
        client_id: "@client_id",
        id: "@id",
        seed_id: "@seed_id"
      },
      { 'get': { method: 'GET'},
        'all': { method: 'GET', isArray:true },
        'change': { method: 'PUT'},
        'cached': {method: 'GET', isArray:true, cache:true},
        'add_label': {method: 'POST', url: '/http_proxy/mnemosyne/v2/clients/:client_id/seeds/:seed_id/labels.json'},
        'remove_label': {method: 'DELETE', url: '/http_proxy/mnemosyne/v2/clients/:client_id/seeds/:seed_id/labels/:id.json'}
      });
  }
]); 

brs.app.factory('Seeds', function(SeedsResource) {

  var Seeds = function(data) {
    angular.extend(this, data);
  };

  var default_params = {
    client_id: OPTS.remote_client_id
  };

  Seeds.all = function(){
    return SeedsResource.all(default_params).$promise;
  };

  Seeds.cached = function(){
    return SeedsResource.cached(default_params).$promise;
  };

  Seeds.save = function(params){
    return params.id == undefined ? SeedsResource.save(params).$promise : SeedsResource.change(params).$promise;
  };

  Seeds.remove = function(params){
    return SeedsResource.remove(params).$promise;
  };

  Seeds.remove_label = function(params){
    return SeedsResource.remove_label(params).$promise;
  };

  Seeds.add_label = function(params){
    return SeedsResource.add_label(params).$promise;
  };

  Seeds.by_labels = function() {
    return Seeds.cached().then(function(result){
      var seeds_by_labels = {labels: {}, competitors: {}};
      result.forEach(function(seed){
        seed.labels.forEach(function(label){
          var seeds = label.is_competitor ? seeds_by_labels['competitors']
            : seeds_by_labels['labels'];
          seeds[this.label] = seeds[this.label] || [];
          seeds[this.label].push(seed);
        });
      });
      return seeds_by_labels;
    });
  };

  return Seeds;
});

/**
 * LABELS
 */

brs.app.factory('LabelsResource', ['$resource',
  function($resource) {
    return $resource('/http_proxy/mnemosyne/v2/clients/:client_id/labels/:id.json',
      {
        client_id: "@client_id",
        id: "@id"
      },
      { 'get': { method: 'GET'},
        'all': { method: 'GET', isArray:true },
        'change': { method: 'PUT'},
        'cached': {method: 'GET', isArray:true, cache:true}
      });
  }
]);

brs.app.factory('Labels', function(LabelsResource) {

  var Labels = function(data) {
    angular.extend(this, data);
  };
  var cashed_lables = null;
  var default_params = {
    client_id: OPTS.remote_client_id
  };

  Labels.all = function(params){
    params = (params == undefined ? default_params : params);
    return LabelsResource.all(params).$promise;
  };

  Labels.cached = function(){
    return LabelsResource.cached(default_params).$promise;
  };

  Labels.remove = function(params){
    return LabelsResource.remove(params).$promise;
  };

  Labels.save = function(params){
    return params.id == undefined ? LabelsResource.save(params).$promise : LabelsResource.change(params).$promise;
  };

  //FIXME must be refactored into Labels.all_cached for filters, 
  //Labels.get should be used for one distinct label access
  Labels.get = function(params) {
    if(!cashed_lables){
      cashed_lables = Labels.all(params).then(function(response) {
        return response.data;
      });
    }
    return cashed_lables;
  };

  Labels.by_groups = function(params) {
    return Labels.cached(params).then(function(result){
      var groups = {labels: [], competitors: []};
      $.each(result, function(idx, brand){
        if(brand.is_competitor){
          groups.competitors.push(brand);
        }else{
          groups.labels.push(brand);
        }
      });
      return groups;
    });
  };

  return Labels;
});

brs.app.factory('LabelsByStat', function($http, brsDataProvider,filterManager) {

  var LabelsByStat = function(data) {
    angular.extend(this, data);
  };

  LabelsByStat.get = function() {
    var params = $.extend(filterManager.getFilters('labels'), {criteria: 'labels'});
    brsDataProvider.addGroupParamForAssessorPage(params);
    return $http.get(brsDataProvider.getPath('stats') + '?' + $.param(params)).then(function(response) {
      var result = [];
      for(var i = 0; i < response.data.length; i++){
        result.push(new LabelsByStat(response.data[i]));
      }
      return result;
    });
  };

  return LabelsByStat;
});

/**
 * LNGMODEL
 */

brs.app.factory('LngmodelResource', ['$resource',
  function($resource) {
    return $resource('/http_proxy/mnemosyne/v2/lingua_models/:id.json',
      {
        id: "@id"
      },
      { 'get': { method: 'GET'},
        'all': { method: 'GET', isArray:true },
        'change': { method: 'PUT'},
        'sources': {method: 'GET', url: '/http_proxy/mnemosyne/v2/lingua_models/:id/model_sources.json', isArray:true}
      });
  }
]);

brs.app.factory('Lngmodel', function(LngmodelResource) {
    var Lngmodel = function(data) {
        angular.extend(this, data);
    };

    Lngmodel.get = function(params){
      return LngmodelResource.all(params, function(result, headers){
        // FIXME possible dup at public/javascripts/controllers/console/factories/lngmodel.js
        var sort_by_field = function (field) { 
            return function (x, y) {
              var x_lower = x[field].toLowerCase();
              var y_lower = y[field].toLowerCase();
              return (x_lower < y_lower) ? -1 : (x_lower > y_lower) ? 1 : 0;
            }
        };
        result.sort(sort_by_field('name'));
        return result;
      }).$promise;
    };

    Lngmodel.model_sources = function(params){
      return LngmodelResource.sources(params).$promise;
    };

    return Lngmodel;
});

//Tags
brs.app.factory('Tags', function($resource) {
  return $resource('/http_proxy/mnemosyne/v2/clients/:client_id/tags/:id.json',
      {id: "@id",
       client_id: '@client_id',
       topic_id: '@topic_id'},
      { 'query': {method: 'GET', isArray:true, cache:true},
        'update': {method: 'PUT'},
        'change_topic_tag': {url: '/http_proxy/mnemosyne/v2/clients/:client_id/actions.json', method:'POST'}
      });
});

//Tags stats
brs.app.factory('TagsByStat', function($http, brsDataProvider,filterManager) {

  var TagsByStat = function(data) {
    angular.extend(this, data);
  };

  TagsByStat.get = function() {
    var params = $.extend(filterManager.getFilters('tags'), {criteria: 'tags'});
    brsDataProvider.addGroupParamForAssessorPage(params);
    return $http.get(brsDataProvider.getPath('stats') + '?' + $.param(params)).then(function(response) {
      var result = [];
      for(var i = 0; i < response.data.length; i++){
        result.push(new TagsByStat(response.data[i]));
      }
      return result;
    });
  };

  return TagsByStat;
});


/**
 * STATS
 */

brs.app.factory('TonalityStat', function($http, brsDataProvider, filterManager) {

  var TonalityStat = function(data) {
    angular.extend(this, data);
  };

  TonalityStat.get = function() {
    var params = $.extend(filterManager.getFilters('tonality'), {criteria: 'tonality'});
    brsDataProvider.addGroupParamForAssessorPage(params);
    if (window.location.pathname.match('words$')) {
      params.forceactual = true;
    }
    return $http.get(brsDataProvider.getPath('stats') + '?' + $.param(params)).then(function(response) {
      return response.data;
    });
  };

  return TonalityStat;
});

brs.app.factory('PlatformStat', function($http, brsDataProvider, filterManager) {

  var PlatformStat = function(data) {
    angular.extend(this, data);
  };

  PlatformStat.get = function(param) {
    var params = $.extend(param ? param : filterManager.getFilters('platforms'), {criteria: 'platforms'});
    brsDataProvider.addGroupParamForAssessorPage(params);
    if (window.location.pathname.match('words$')) {
      params.forceactual = true;
    }
    return $http.get(brsDataProvider.getPath('stats') + '?' + $.param(params)).then(function(response) {
      return response.data;
    });
  };

  return PlatformStat;
});

//Platforms
brs.app.factory('Platforms', function($resource) {
  return $resource('/http_proxy/mnemosyne/clients/:client_id/platforms/words.json',
    { client_id: OPTS.remote_client_id},
    { 'all': {method: 'GET', isArray:true, cache:true}
    });
});

brs.app.factory('OriginStat', function($http, brsDataProvider, filterManager) {

  var OriginStat = function(data) {
    angular.extend(this, data);
  };

  OriginStat.get = function() {
    var params = $.extend(filterManager.getFilters('origins'), {criteria: 'origins'});
    brsDataProvider.addGroupParamForAssessorPage(params);
    if (window.location.pathname.match('words$')) {
      params.forceactual = true;
    }
    return $http.get(brsDataProvider.getPath('stats') + '?' + $.param(params)).then(function(response) {
      return response.data;
    });
  };

  return OriginStat;
});

brs.app.factory('KindStat', function($http, brsDataProvider, filterManager) {

  var KindStat = function(data) {
    angular.extend(this, data);
  };

  KindStat.get = function(param) {
    var params = $.extend(param ? param : filterManager.getFilters('kinds'), {criteria: 'kinds'});
    brsDataProvider.addGroupParamForAssessorPage(params);
    if (window.location.pathname.match('words$')) {
      params.forceactual = true;
    }
    return $http.get(brsDataProvider.getPath('stats') + '?' + $.param(params)).then(function(response) {
      return response.data;
    });
  };

  return KindStat;
});

brs.app.factory('TotalStat', function($http, brsDataProvider, filterManager) {

  var TotalStat = function(data) {
    angular.extend(this, data);
  };

  TotalStat.get = function() {
    var current_page = filterManager.getCurrentPage();
    var params = filterManager.getFilters(current_page);
    brsDataProvider.addGroupParamForAssessorPage(params);
    delete params.pagesize;
    var total_type = "total_" + (current_page == "people" ? 'mentioners' : 'mentions');
    return $http.get(brsDataProvider.getPath(total_type) + '?' + $.param(params)).then(function(response) {
      return response.data && response.status == 200 ? response.data.current[0] : 0;
    });
  };

  return TotalStat;
});
