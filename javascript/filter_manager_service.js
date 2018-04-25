
brs.app.factory('filterManager', function() {

  // TODO: just use black list, it's so simple
 var ALLOWED_FILTERS = {
   tonality: [ 'created_at_lt', 'created_at_gte', 'platforms', 'kinds', 'labels', 'seeds', 'sources', 'text', 'urls', 'author_names', 'authors', 'origins', 'is_spam', 'has_snippet', 'lingua_languages','is_processed', 'lingua_keywords', 'is_competitor', 'group', 'tags', 'answer' ],
   platforms: [ 'created_at_lt', 'created_at_gte', 'labels', 'tonality', 'seeds', 'sources', 'text', 'urls', 'author_names', 'authors', 'origins', 'kinds', 'is_spam', 'has_snippet', 'lingua_languages','is_processed', 'lingua_keywords', 'is_competitor', 'group', 'tags', 'answer' ],
   labels:[ 'created_at_lt', 'created_at_gte', 'sources', 'tonality', 'platforms', 'seeds', 'kinds', 'origins', 'text', 'urls', 'author_names', 'authors', 'is_spam', 'has_snippet', 'lingua_languages', 'is_competitor','is_processed', 'lingua_keywords', 'group', 'tags', 'answer' ],
   tags:[ 'created_at_lt', 'created_at_gte', 'sources', 'tonality', 'platforms', 'seeds', 'kinds', 'origins', 'text', 'urls', 'author_names', 'authors', 'is_spam', 'has_snippet', 'lingua_languages', 'is_competitor','is_processed', 'lingua_keywords', 'group', 'labels', 'answer' ],
   origins: ['created_at_lt', 'created_at_gte', 'sources', 'tonality', 'platforms', 'kinds', 'labels', 'seeds', 'text', 'urls', 'author_names', 'authors', 'is_spam', 'has_snippet', 'lingua_languages', 'is_competitor', 'is_processed', 'lingua_keywords', 'group', 'tags', 'answer'],
   kinds: ['created_at_lt', 'created_at_gte', 'sources', 'tonality', 'platforms', 'labels', 'origins', 'seeds', 'text', 'urls', 'author_names', 'authors', 'is_spam', 'has_snippet', 'lingua_languages', 'is_competitor', 'is_processed', 'lingua_keywords', 'group', 'tags', 'answer'],
   highchart: [ 'created_at_lt', 'created_at_gte', 'users', 'is_competitor', 'origins', 'kinds', 'tonality', 'step', 'mode', 'platforms', 'labels', 'seeds', 'is_spam', 'has_snippet', 'lingua_languages', 'lingua_keywords', 'tags'],
   words:[ 'created_at_lt', 'created_at_gte', 'platforms', 'kinds', 'tonality', 'labels', 'seeds', 'sources', 'text', 'urls', 'authors', 'origins', 'is_processed', 'is_spam', 'has_snippet', 'lingua_languages', 'is_competitor','lingua_keywords', 'tags', 'answer'],
   assessor: ['created_at_lt', 'created_at_gte', 'platforms', 'kinds', 'tonality', 'labels', 'seeds', 'sources', 'text', 'urls', 'authors', 'origins', 'is_processed', 'is_spam', 'has_snippet', 'lingua_languages', 'is_competitor','lingua_keywords', 'tags', 'order'],
   spam: ['created_at_lt', 'created_at_gte', 'platforms', 'kinds', 'tonality', 'labels', 'seeds', 'sources', 'text', 'urls', 'authors', 'origins', 'is_processed', 'is_spam', 'has_snippet', 'lingua_languages', 'is_competitor','lingua_keywords', 'is_spam', 'tags', 'order'],
   tagcloud:[ 'created_at_lt', 'created_at_gte', 'platforms', 'kinds', 'tonality', 'labels', 'seeds', 'sources', 'text', 'tags', 'urls', 'authors', 'is_spam', 'has_snippet', 'lingua_languages', 'is_competitor'],
   people:[ 'created_at_lt', 'created_at_gte', 'platforms', 'kinds', 'tonality', 'labels', 'seeds', 'sources', 'author_names', 'origins', 'is_spam', 'has_snippet', 'lingua_languages', 'is_competitor' ],
   metrics: [ 'created_at_lt', 'created_at_gte', 'is_competitor', 'origins', 'kinds', 'tonality', 'step', 'mode', 'platforms', 'labels', 'tags'],
   numbers: [ 'created_at_lt', 'created_at_gte', 'is_competitor', 'origins', 'kinds', 'tonality', 'step', 'mode', 'platforms', 'labels', 'tags'],
   report_designer: [ 'created_at_lt', 'created_at_gte', 'platforms', 'kinds', 'tonality', 'labels', 'seeds', 'sources', 'text', 'urls', 'author_names', 'authors', 'origins', 'is_processed', 'is_spam', 'has_snippet', 'lingua_languages', 'is_competitor','lingua_keywords', 'tags'],
   agora: ['created_at_lt', 'created_at_gte', 'is_competitor', 'users'],
   form: ['created_at_lt', 'created_at_gte', 'is_competitor', 'origins', 'kinds', 'tonality', 'step', 'mode', 'platforms', 'labels', 'tags', 'users'],
   mention: []
 };

 var get_agora_start_date = function(){
   var today = moment();
   var start_date = today;
   if(today.date() < 7) {
     start_date = today.subtract(1, 'month');
   }
   return start_date.startOf('month').format('YYYY-MM-DD');
 };


 var DEFAULT_FILTERS = {
   commonFilters: { competitor: false, fromdate: moment().subtract(6, 'days').format('YYYY-MM-DD'), todate: moment().format('YYYY-MM-DD') },
   words: {pagesize: 10},
   assessor: {pagesize: 10, order: 'stored_at'},
   spam: {pagesize: 10, is_spam: true, order: 'stored_at'},
   people: {pagesize: 25, sortby:'-mentions_count'},
   metrics: {step: 'auto', mode: 'tonalities'},
   agora: {competitor: false, step: 'month', fromdate: get_agora_start_date(), todate: moment().format('YYYY-MM-DD'), users: false},
   agora_form: {competitor: false, step: 'month', fromdate: get_agora_start_date(), todate: moment().format('YYYY-MM-DD'), users: false},
   numbers: {},
   tagcloud: {},
   mention: {},
   dashboard: {fromdate: moment().subtract(30, 'days').format('YYYY-MM-DD'), todate: moment().format('YYYY-MM-DD')},
   report_designer: { competitor: false, fromdate: moment().subtract(6, 'days').format('YYYY-MM-DD'), todate: moment().format('YYYY-MM-DD') }
 };

 var NOT_ALLOWED_FILTERS = {
   words: ['author_names', 'mode', 'step',  'is_spam', 'is_processed', 'order', 'users'],
   spam: ['author_names', 'mode', 'step','is_processed', 'users', 'answer'],
   assessor:['author_names', 'mode', 'step', 'is_spam', 'users', 'answer'],
   people: ['mode', 'is_processed', 'authors', 'url', 'text', 'step', 'is_spam', 'tags', 'order', 'users', 'answer'],
   metrics: ['is_processed', 'author_names', 'authors', 'name','url','text', 'page', 'is_spam', 'order', 'users', 'answer'],
   numbers: ['mode', 'platforms', 'text', 'urls', 'author_names', 'authors', 'origins', 'tagcloud_search', 'is_processed', 'pagesize', 'page', 'is_spam', 'order', 'users', 'answer'],
   origins: ['mode', 'origins', 'order', 'users'],
   tagcloud: ['author_names', 'mode','is_processed', 'step', 'is_spam', 'order', 'users', 'answer'],
   dashboard: ['pagesize', 'page', 'competitor', 'is_spam', 'tags', 'order', 'users', 'answer'],
   report_designer: ['pagesize', 'page', 'order', 'users', 'answer'],
   agora: ['pagesize', 'page', 'mode', 'answer'],
   agora_form: ['pagesize', 'page', 'mode', 'answer'],
   mention: ['competitor', 'fromdate', 'todate', 'answer']
 };

 var NAME_OF_SEARCH_FIELDS = ['url', 'text', 'author_names'];

 var ADDITIONAL_PARAMETERS = ['mode', 'page', 'pagesize', 'step', 'origin', 'criteria', 'sortby', 'group', 'order'];

 var PAGES_WITH_FILTERS = ['dashboard','words', 'assessor','tagcloud', 'spam', 'numbers', 'metrics', 'people', 'report_designer', 'agora', 'agora_form'];

 var is_init = false;
 var current_page = undefined;
 var current_metric = undefined;
 var filter_params = {};
 filter_params.filters = {}; // valid filter parameters

 var hash_params = {};    // parameters from hash

 var init = function(){
   is_init = true;
   setCurrentPageName();

   if(current_page == 'dashboard'){    // special fix for dashboard, temporary, I hope
     filter_params = {};
     filter_params.filters = {};
     $.extend(filter_params.filters, DEFAULT_FILTERS[current_page]);
     _firstLoadFilterHashUpdate();
   }else {
     filter_params = getFilters();
     _setDefaultFiltersForPage();
   }
 };

 var setCurrentPageName = function(){ // name of page, where filter initialised
   var path = location.pathname;
   $.each(PAGES_WITH_FILTERS, function(_idx, page){
     if(path.indexOf(page)>-1){
       current_page = page;
     }
   });
   if(current_page == 'metrics'){
     current_metric = location.pathname.split('/').pop(); // get metric name
   }
   if(!current_page) current_page = 'dashboard';
 };

 var addFilterToUrl = function(filter, isAdditional){
   filter_params = getFilters();
   var keyName = Object.keys(filter)[0];
   if(isAdditional){
     filter_params[keyName] = filter[keyName];
   }else{
     filter_params.filters[keyName] = filter[keyName];
   }
   if(keyName == 'sortby' || keyName == 'pagesize'){
     filter_params.page = 0;
   }
   _updateUrlWithCurrentFilters();
 };

 var removeFilterFromUrl = function(filter_name, isAdditional){
   filter_params = getFilters();
   if(isAdditional){
     delete filter_params[filter_name]
   }else{
     delete filter_params.filters[filter_name]
   }
   _updateUrlWithCurrentFilters();
 }

 var updateFilters = function(newFilters){
   filter_params = $.extend(true, {}, newFilters);
   _cleanEmptyFilters();
   _checkSearchParams();
   _checkForResetPage();
   _removeNotAllowedFiltersForPage();
   _updateUrlWithCurrentFilters();
 };

 var setDefaultFilters = function(){
   filter_params = {};
   filter_params.filters = {};
   _setDefaultFiltersForPage();
 };

 var _isHashParamsEmpty = function(){
   for(var prop in hash_params) {
     if(hash_params.hasOwnProperty(prop))
       return false;
   }
   return true;
 };

 var getFilters = function(filter_name){
   _updateHashParams(_getHash());

   if(_isHashParamsEmpty()){ // Fix for empty hash when user pressed back button
     //TODO: DEFAULT_FILTERS.commonFilters and DEFAULT_FILTERS.agora had a really strange value, still don't know why
     var common = { competitor: false,
                   fromdate: moment().subtract(6, 'days').format('YYYY-MM-DD'),
                   todate: moment().format('YYYY-MM-DD')
                   };
     var agora = { competitor: false,
                   fromdate: get_agora_start_date(),
                   todate: moment().format('YYYY-MM-DD')
     };
     filter_params.filters = current_page == 'agora' ? agora : common;
   }else {
     filter_params = _getAdditionalParams();
     filter_params.filters = _getOnlyFilters();
   }

   check_pagesize(filter_params);

   _cleanEmptyFilters();
   _restoreReplacedSearchParams();   // fix for '=' in search fields

   if(filter_name){
     return _getFiltersForRequest(filter_name);
   }

   return filter_params;
 };

 var _cleanEmptyFilters = function(){
   $.each(filter_params, function(param, value){
     if(value === ''){
       delete filter_params[param];
     }
   });
   $.each(filter_params.filters, function(filter, value){
     if(value === ''){
       delete filter_params.filters[filter];
     }
   });
 };

 var _getAdditionalParams = function(){
   var params = {};
   $.each(ADDITIONAL_PARAMETERS, function(i){
     if(hash_params.hasOwnProperty(ADDITIONAL_PARAMETERS[i])){
       params[ADDITIONAL_PARAMETERS[i]] = hash_params[ADDITIONAL_PARAMETERS[i]];
     }
   });
   return params;
 };

 var _getOnlyFilters = function(params){
   var hash_params_copy = {}
   if(params){
     hash_params_copy = $.extend({},params);
   }else{
     hash_params_copy = $.extend({},hash_params);
   }
   $.each(ADDITIONAL_PARAMETERS, function(parameter){
     delete hash_params_copy[ADDITIONAL_PARAMETERS[parameter]];
   });
   return hash_params_copy;
 };

 var _getHash = function(){
   var hash = location.hash;
   return hash;
 };

 var _updateHashParams = function(hash){
   hash = hash.replace(new RegExp("#\/",'g'), "").replace(new RegExp("&\/",'g'), "&");
   hash_params = $.deparam(hash, true);
 };

 var _buildUrlByCurrentFilters = function(){
   _convertFilterParams();
   return '/' + $.param(hash_params, true);
 };

 var getFiltersForMenuUrls = function(){
   _convertFilterParams();

   delete hash_params.page;
   delete hash_params.sortby;

   return '/' + $.param(hash_params, true);
 };

 var _convertFilterParams = function(){
   hash_params = $.extend(true, {}, filter_params.filters);
   $.each(filter_params, function(key, value){
     if(key != 'filters') {
       hash_params[key] = value;
     }
   });
 };

 var _checkSearchParams = function(){
   var regexp = new RegExp('(http|https|ftp):\/\/');
   $.each(NAME_OF_SEARCH_FIELDS, function(index, field_name){
     if(filter_params.filters.hasOwnProperty(field_name)){
       filter_params.filters[field_name] = filter_params.filters[field_name].toString().replace(regexp, '');
       filter_params.filters[field_name] = encodeURIComponent(filter_params.filters[field_name]);
     }
   });
 };

 var _restoreReplacedSearchParams = function(){
   $.each(NAME_OF_SEARCH_FIELDS, function(index, field_name){
     if(filter_params.filters.hasOwnProperty(field_name)){
       filter_params.filters[field_name] = decodeURIComponent(filter_params.filters[field_name].toString());
     }
   });
 };

 var _checkForResetPage = function(){
   if(!filter_params.hasOwnProperty('page')) return;

   var previous_filters = _getOnlyFilters($.deparam(localStorage.lastFilter, true)); // get old filter params from localStorage
   var is_filters_changed = false;
   $.each(filter_params.filters, function(filter_name, filter_value){
     if (!previous_filters.filters || previous_filters.filters[filter_name] != filter_value) {
       is_filters_changed = true;
     }
   });
   $.each(previous_filters, function(filter_name, filter_value){
     if (!filter_params.filters || filter_params.filters[filter_name] != filter_value) {
       is_filters_changed = true;
     }
   });

   if ( is_filters_changed) filter_params.page = 0;
 };

 var _updateUrlWithCurrentFilters = function(){
   location.hash = _buildUrlByCurrentFilters();
   localStorage.lastFilter = location.hash;
 };

 var _addMissedFilters = function(filters){
   $.each(filters, function(filter, value){
     if(!(ADDITIONAL_PARAMETERS.indexOf(filter) > -1) && !filter_params.filters.hasOwnProperty(filter)){
       filter_params.filters[filter] = value;
     }
     if((ADDITIONAL_PARAMETERS.indexOf(filter) > -1) && !filter_params.hasOwnProperty(filter)){
       filter_params[filter] = value;
     }
   });
 };

 var _removeNotAllowedFiltersForPage = function(){
   if ( !('competitor' in filter_params.filters) || !filter_params.filters.competitor) {
     delete filter_params.filters.competitor_names;
   }
   if(NOT_ALLOWED_FILTERS[current_page].length)
     $.each(NOT_ALLOWED_FILTERS[current_page], function(ind){
       var param_name = NOT_ALLOWED_FILTERS[current_page][ind];
       if(filter_params.hasOwnProperty(param_name)){
         delete filter_params[param_name];
       }
       if(filter_params.filters.hasOwnProperty(param_name)){
         delete filter_params.filters[param_name];
       }
     });

   if(current_page == 'metrics'){
     _correctFiltersForMetricPage();
   }
 };

 var _correctFiltersForMetricPage = function(){
   if(filter_params.filters.competitor && filter_params.filters.competitor == true){
     filter_params.mode = 'competitors';
   }

   if (current_metric == 'platforms' || current_metric == 'lingua_keywords'){
     delete filter_params.mode;
   }else{
     delete filter_params.filters.competitor;
   }
   if (filter_params.mode == 'tonalities' && current_metric == 'reputation_index') {
     filter_params.mode = 'labels'
   }

   if ( filter_params.mode == 'competitors' || filter_params.mode == 'labels'){
     delete filter_params.filters.competitor;
   }

   if ( filter_params.mode === 'tonalities') {
     delete filter_params.filters.tonality;
   }
 };

 var _setDefaultFiltersForPage = function(){
   if($.isEmptyObject(filter_params.filters)){ // if filters empty, set common and default page filters
     if (current_page != 'agora')
       filter_params.filters = $.extend(filter_params.filters, DEFAULT_FILTERS.commonFilters);
     _addMissedFilters(DEFAULT_FILTERS[current_page]);
     if(current_page == 'metrics'){
       _correctFiltersForMetricPage();
     }
   }else{
     if (current_page != 'agora')
       _addMissedFilters(DEFAULT_FILTERS.commonFilters);
     _addMissedFilters(DEFAULT_FILTERS[current_page]);
     _removeNotAllowedFiltersForPage();
     _checkSearchParams();
   }
   _firstLoadFilterHashUpdate();
 };

 var _firstLoadFilterHashUpdate = function(){
   var url = location.protocol + '//' + location.host + location.pathname,
       path = url + '#' + _buildUrlByCurrentFilters();
   if (history && history.pushState){
     history.pushState(filter_params, "", path);
     $(window).trigger('hashchange');
   } else {
     location.href = path;
   }
 };


 // TODO: отдавать массивы id'ишников или значений, а не строки (так будет удобнее)
 //FIXME убрать весь код, который для старой версии.
 var _getFiltersForRequest = function(filter_name){
   var filters_for_request = $.extend({}, filter_params);
   if(!is_init) {
     return undefined;
   }
   filters_for_request.filters.created_at_gte = filter_params.filters.fromdate;
   filters_for_request.filters.created_at_lt = moment(filter_params.filters.todate, 'YYYY-MM-DD').add('days', 1).format("YYYY-MM-DD"); // conversion for mnemosine

   if(!filters_for_request.filters.created_at_gte) {
     filters_for_request.filters.created_at_gte = DEFAULT_FILTERS.commonFilters.fromdate;
   }
   if(!filters_for_request.filters.created_at_lt){
     filters_for_request.filters.created_at_lt = moment(DEFAULT_FILTERS.commonFilters.todate, 'YYYY-MM-DD').add('days', 1).format("YYYY-MM-DD");
   }

   delete filters_for_request.filters.fromdate;
   delete filters_for_request.filters.todate;

   if (filters_for_request.filters.competitor && filters_for_request.filters.competitor_names === undefined) {
     filters_for_request.filters.is_competitor = true;
   }else{
     filters_for_request.filters.is_competitor = false;
   }

   if (filters_for_request.filters.tagcloud_search){
     filters_for_request.filters.lingua_keywords = filters_for_request.filters.tagcloud_search;
     delete filters_for_request.filters.tagcloud_search;
   }

   if (location.href.search(/\/accounts\/\d+\/clients\/\d+\/words\/spam/) !== -1) {
     filters_for_request.spam = true;
   }

   if(filters_for_request.filters.url){
     filters_for_request.filters.urls = filter_params.filters.url;
   }

   if(current_page == 'people'){
     filters_for_request.group = 'authors';  // add for all requests filters/stats on page 'people'
   }

   // For assessor text search
   if(filters_for_request.filters.text){
     filters_for_request.filters.text = filters_for_request.filters.text.trim();
   }

   //remove not allowed filters
   $.each(filters_for_request.filters, function (filter) {
     if ($.inArray(filter, ALLOWED_FILTERS[filter_name]) == -1 ) {
       delete filters_for_request.filters[filter];
     }
   });

   if(filters_for_request.mode == 'competitors'){
     filters_for_request.filters.is_competitor = true;
   }

   //add common v2 parametrs

   filters_for_request.filters.has_snippet = true;
   if(current_page != 'spam') filters_for_request.filters.is_spam = false;
   filters_for_request.filters.lingua_languages = OPTS.mentions_languages.join(',');
   return filters_for_request;
 };

 var check_pagesize = function(params){
   if(params.pagesize){
     var page_sizes = [10,25, 50, 100];
     if(page_sizes.indexOf(params.pagesize) < 0){
       params.pagesize = DEFAULT_FILTERS[current_page].pagesize;
     }
   }else{
     if(DEFAULT_FILTERS[current_page].pagesize){
       params.pagesize = DEFAULT_FILTERS[current_page].pagesize;
     }
   }
 };

 var isAllowed = function(filter_name){
   if(is_init && current_page && NOT_ALLOWED_FILTERS[current_page].indexOf(filter_name) < 0){
     return true;
   }
   return false;
 };

 var checkAuthorFilter = function() {    // это здесь временно, чтобы не забыть переписать, когда переделаем менеджер в сервис
   var authorNameTag = $('#filterAuthorName');
   var filters = filter_params;
   if (filters.filters.authors && authorNameTag.length) {   //
     $('#message').removeClass('hide');
     authorNameTag.text(filters.filters.authors);

     var url = MNEMOSYNE_BASE_URL + '/v2/authors/' + filters.filters.authors + '.json';

     $.get(url, '', function (author) {
       authorNameTag.text(author.name);
     });
   } else {
     $('#message').addClass('hide');
   }
 };

 var get_optimise_step = function(){
   var filters = getFilters().filters;
   var fromdate, todate;

   if(filters.fromdate){
     fromdate = moment(filters.fromdate, "YYYY-MM-DD");
   }
   if(filters.todate){
     todate = moment(filters.todate, "YYYY-MM-DD");
   }
   //if no dates given and no step exists, fallback to day
   if(!fromdate && !todate){
     return getFilters().step == undefined ? 'day' : getFilters().step;
   };

   //calculate step based on given dates
   var step;
   var diff = (todate - fromdate)/(1000*60*60);
   if (diff >= 24*30*4) step = 'month';
   if (!step && diff >= 24*28) step = 'week';   // чтобы для месячного периода возвращался шаг - неделя (b-6442)
   if (!step && diff > 24) step = 'day';
   if (!step) step = 'hour';

   return step;
 };

 var getFiltersForReport = function(){   // TODO: it will be refactored soon.
   var filters_for_req = getFilters(current_page);
   delete filters_for_req.filters.has_snippet;
   delete filters_for_req.filters.is_spam;
   delete filters_for_req.filters.lingua_languages;
   return filters_for_req;
 };

 init();

 return {
   init: init,
   getFilters: getFilters,
   getFiltersForReport: getFiltersForReport,
   updateFilters : updateFilters,
   addFilterToUrl: addFilterToUrl,
   setDefaultFilters: setDefaultFilters,
   removeFilter: removeFilterFromUrl,
   getFiltersForMenuUrls: getFiltersForMenuUrls,
   isAllowed: isAllowed,
   checkAuthorFilter: checkAuthorFilter,
   get_optimise_step: get_optimise_step,
   isInit: function(){
     return is_init;
   },
   getCurrentPage: function(){
     return current_page;
   }
 };
});
