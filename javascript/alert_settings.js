/*----latest code---*/

brs.app.controller('alertSettings', function($scope, Alerts, Labels, Platforms, $http, $q){
  $scope.alerts = [];
  $scope.loading = true;
  $scope.ownlb = true;
  $scope.new_email = {value: ""};
  $scope.new_phone = {value: ""};
  $scope.new_author = {value: ""};
  $scope.m_emails = [];
  $scope.m_phones = [];
  $scope.time = {start: 8, end: 21, tz: 'Moscow'};
  $scope.action = 'new';
  $scope.copy_of_edit_alert = {};
  $scope.authors = [];
  $scope.authors_type = "white";
  $scope.saving = false;
  $scope.error_text = "";
  $scope.emptyFields = false;

  $scope.other_platforms_list = []; // for displaying platform names

  $scope.other_platforms = [];
  $scope.labels = [];


  $scope.frequency_array = [ 300, 600, 900, 1200, 1800, 3600, 7200, 10800, 21600, 28800, 43200, 86400];
  var frequency_to_str = { '300' : '5 ' + brs.locale.minutes,
                    '600' : '10 ' + brs.locale.minutes,
                    '900' : '15 ' + brs.locale.minutes,
                    '1200' : '20 ' + brs.locale.minutes,
                    '1800' : '30 ' + brs.locale.minutes,
                    '3600' : '1 ' + brs.locale.hour,
                    '7200' : '2 ' + brs.locale.few_hours,
                    '10800' : '3 ' + brs.locale.few_hours,
                    '14400' : '4 ' + brs.locale.few_hours,
                    '21600' : '6 ' + brs.locale.many_hours,
                    '28800' : '8 ' + brs.locale.many_hours,
                    '43200' : '12 ' + brs.locale.many_hours,
                    '86400': '24 ' + brs.locale.few_hours};

  $scope.static_platforms = [     // just sample for local testing
      {
        "id": 63225,
        "name": "ВКонтакте",
        "url": "http://vk.com"
      },
      {
        "id": 107891,
        "name": "Instagram",
        "url": "http://instagram.com"
      },
      {
        "id": 16,
        "name": "Facebook",
        "url": "http://facebook.com"
      },
      {
        "id": 3,
        "name": "LiveJournal",
        "url": "http://livejournal.com"
      },
      {
        "id": 6,
        "name": "Twitter",
        "url": "http://twitter.com"
      },
      {
        "id": 122790,
        "name": "irecommend.ru",
        "url": "http://irecommend.ru"
      },
      {
        "id": 87010,
        "name": "Одноклассники",
        "url": "http://odnoklassniki.ru"
      },
      {
        "id": 22474,
        "name": "cosmo.ru",
        "url": "http://cosmo.ru"
      },
      {
        "id": 125904,
        "name": "otzovik.com",
        "url": "http://otzovik.com"
      },
      {
        "id": 92042,
        "name": "Yandex.Market",
        "url": "http://market.yandex.ru"
      },
      {
        "id": 9226,
        "name": "YouTube",
        "url": "http://youtube.com"
      }
  ];
  var static_platform_ids = $scope.static_platforms.map(function (platform) {
    return platform.id;
  });

  var tonality = {
    '1': brs.locale.positive,
    '0': brs.locale.neutral,
    '-1': brs.locale.negative
  };
  var default_alert = { name: "",
                        active: true,
                        emails: [],
                        phones: [],
                        phone_time: '8-21',
                        phone_tz: 'Moscow',
                        type: ['email'],
                        frequency: 86400, // in sec
                        filters: {tonality: [1, 0, -1], platforms: [],
                          followers: 0, labels: [],
                          white_authors: [],
                          black_authors: []}
  };
  $scope.current_alert = angular.merge({}, default_alert);

  var init = function(){
    Alerts.query({}, function (resp) {
      console.log(resp);
      $scope.alerts = resp;
      getOtherPlatforms();
      $scope.loading = false;
    }, function (error) {
      console.log(error);
    });
    getData();
  };

  var getLabels = function(){
    Labels.all({client_id: OPTS.remote_client_id}).then(function(labels){
      $scope.loading = false;
      $scope.labels = labels;
      $scope.own_labels = brs.app.sort_labels(labels.filter(function(label){return !label.is_competitor}));
      $scope.competitors = brs.app.sort_labels(labels.filter(function(label){return label.is_competitor}));
    });
  };

  var getOtherPlatforms = function(){
    $scope.other_pi = [];
    //all alerts
    angular.forEach($scope.alerts, function(alert) {
      angular.forEach(alert.filters.platforms, function (id) {
        if ($.inArray(id, static_platform_ids) < 0 && $.inArray(id, $scope.other_pi)) {
          $scope.other_pi.push(id);
        }
      });
    });
    $http({
      method: 'GET',
      url: '/http_proxy/mnemosyne/platforms.json',
      params: {
        ids: $scope.other_pi.join(','),
        pagesize: 2000
      }
    }).then(function(resp) {
      console.log(resp);
      $scope.other_platforms_list = resp.data.items;
    })['finally'](function() {
      // nothing
    });
  };

  $scope.notChosenPlatform = function(platform){
    var other_pl_ids = $scope.other_platforms.map(function (platform) {return platform.id});
    if($.inArray(platform.id, static_platform_ids) !== -1 || $.inArray(platform.id, other_pl_ids) !== -1) return false;
    return true;
  };

  var getData = function(){
    getLabels();
  };

  var isAlertValid = function(alert) {
    if ($scope.current_alert.name.length == 0 || $scope.current_alert.emails.length == 0) {
      $scope.emptyFields = true;
      return false;
    }
    if($.inArray('phone', $scope.current_alert.type) > 0 && $scope.current_alert.phones.length == 0){
      $scope.emptyFields = true;
      $scope.error_text = brs.locale.phone_error;
      return false;
    }
    $scope.emptyFields = false;
    $scope.error_text = "";
    return true;
  };

  var modify_fields = function(){
    $scope.m_emails = [];
    angular.forEach($scope.current_alert.emails, function(email){
      $scope.m_emails.push({value: email});
    });

    $scope.m_phones = [];
    angular.forEach($scope.current_alert.phones, function(email){
      $scope.m_phones.push({value: email});
    });

    $scope.authors = [];
    if($scope.current_alert.filters.white_authors.length > 0) {
      angular.forEach($scope.current_alert.filters.white_authors, function (author) {
        $scope.authors.push({value: author})
      });
      $scope.authors_type = "white";
    }else{
      angular.forEach($scope.current_alert.filters.black_authors, function (author) {
        $scope.authors.push({value: author})
      });
      $scope.authors_type = "black";
    }
    if($scope.current_alert.filters.white_authors.length == 0 && $scope.current_alert.filters.black_authors.length == 0){
      $scope.authors_type = "white";
    }
    var time = $scope.current_alert.phone_time;
    if(time && time.length){
      $scope.time.start = parseInt(time.split('-')[0], 10);
      $scope.time.end = parseInt(time.split('-')[1], 10);
      $scope.time.tz = $scope.current_alert.phone_tz;
    }else {
      $scope.time = {start: 8, end: 21, tz: "Moscow"};
    }

    $scope.other_platforms = [];
    var ids = $scope.current_alert.filters.platforms;
    if(ids.length > 0){
      angular.forEach(ids, function(id){
        angular.forEach($scope.other_platforms_list, function(platform){
          if(id == platform.id){
            $scope.other_platforms.push(platform);
          }
        })
      });
    }
  };

  var getLabelsType = function(){
    var labels = $scope.current_alert.filters.labels;
    if(labels.length == 0)
      return true;
    var label_id = labels[0];
    var label = null;
    for(var i=0; i < $scope.labels.length; i++){
      if($scope.labels[i].id == label_id){
        label = $scope.labels[i];
        break;
      }
    }
    return !label.is_competitor;
  };

  $scope.newAlert = function () {
    $scope.current_alert = angular.merge({}, default_alert);
    $scope.action = 'new';
    $scope.authors = [];
    $scope.authors_type = "white";
    $scope.new_email = {value: ""};
    $scope.new_phone = {value: ""};
    $scope.m_emails = [];
    $scope.m_phones = [];
    $scope.ownlb = true;
    $scope.time = {start: 8, end: 21, tz: "Moscow"};
    $scope.saving = false;
  };

  $scope.editAlert = function(alert){
    $scope.current_alert = alert;
    $scope.new_email = {value: ""};
    $scope.new_phone = {value: ""};
    $scope.ownlb = getLabelsType();
    $scope.saving = false;
    modify_fields();
    $scope.action = 'edit';
    $scope.copy_of_edit_alert = $.extend(true, {}, alert); // angular merge not working properly

    $("#new-alert-modal").modal('show');
  };

  var create_alert = function() {
    Alerts.create($scope.current_alert, function (resp) {
      $scope.alerts.push(resp);
      $scope.saving = false;
      $("#new-alert-modal").modal('hide');
    }, function (error) {
      $scope.saving = false;
      console.log(error);
    });
  };

  var change_alert = function(alert){
    Alerts.change(alert, function (resp) {
      $scope.saving = false;
      $("#new-alert-modal").modal('hide');
    }, function (error) {
      $scope.saving = false;
      console.log(error);
    });
  };

  var remove_alert_from_list = function(alert){
    var index = $.inArray(alert, $scope.alerts);
    $scope.alerts.splice(index, 1);
  };

  $scope.cancel = function (){
    var index = $.inArray($scope.current_alert, $scope.alerts);
    $scope.alerts[index] = $scope.copy_of_edit_alert;
    $("#new-alert-modal").modal('hide');
  };

  var check_new_fields = function(){
    if($scope.new_email.value && ($scope.new_email.value.length > 0 && !$scope.alertForm.new_email.$error.email)){
      $scope.m_emails.push($scope.new_email);
      $scope.new_email = {value: ""};
    }
    if($scope.new_phone.value && ($scope.new_phone.value.length > 0 && !$scope.alertForm.new_phone.$error.phone)){
      $scope.m_phones.push($scope.new_phone);
      $scope.new_email = {value: ""};
    }
    if($scope.new_author.value && $scope.new_author.value.length > 0){
      $scope.authors.push($scope.new_author);
      $scope.new_author = {value: ""};
    }
    if($scope.data.selected){
      $scope.addOtherPlatform();
    }
  };
  var modify_fields_back = function(){
    $scope.current_alert.emails = [];
    angular.forEach($scope.m_emails, function(email){
      $scope.current_alert.emails.push(email.value);
    });
    $scope.current_alert.phones = [];
    angular.forEach($scope.m_phones, function(phone){
      $scope.current_alert.phones.push(phone.value);
    });
    if($scope.authors_type == 'white'){
      $scope.current_alert.filters.white_authors = $scope.authors.map(function(author){return author.value});
      $scope.current_alert.filters.black_authors = [];
    }else{
      $scope.current_alert.filters.black_authors = $scope.authors.map(function(author){return author.value});
      $scope.current_alert.filters.white_authors = [];
    }
    $scope.current_alert.phone_time = $scope.time.start + '-' + $scope.time.end;
    $scope.current_alert.phone_tz = $scope.time.tz;

    if($scope.other_platforms.length > 0){
      angular.forEach($scope.other_platforms, function(platform){
        if($.inArray(platform.id, $scope.current_alert.filters.platforms) < 0)
          $scope.current_alert.filters.platforms.push(platform.id);
      });
    }
  };

  $scope.save_alert = function(){
    check_new_fields();
    modify_fields_back();
    if(!isAlertValid($scope.currrent_alert)) return;
    $scope.saving = true;
    $scope.current_alert.authenticity_token = OPTS.auth_token;

    if($scope.action == "new") {
      create_alert();
    }else{
      change_alert($scope.current_alert);
    }
  };

  $scope.change_status = function(alert){
    Alerts.change(alert, function (resp) {
      $scope.saving = false;
    }, function (error) {
      $scope.saving = false;
      console.log(error);
    });
  };

  $scope.remove_alert = function(alert){
    Alerts.delete({authenticity_token: OPTS.auth_token, id: alert.id}, function(resp){
      remove_alert_from_list(resp);
    }, function (error) {
      console.log(error);
    });
  };

  //active
  $scope.activate = function(){
    $scope.current_alert.active = !$scope.current_alert.active;
    if($scope.action == 'edit'){
      $scope.copy_of_edit_alert = angular.merge({authenticity_token: OPTS.auth_token}, $scope.copy_of_edit_alert);
      alert.active = !alert.active;
      $scope.change_status($scope.copy_of_edit_alert);
    }
    return;
  };

  $scope.change_status_from_list = function(alert){
    alert.active = !alert.active;
    alert = angular.merge({authenticity_token: OPTS.auth_token}, alert);
    $scope.change_status(alert);
  };

  // email and phone
  $scope.addEmail = function(){
    if($scope.new_email.value && $scope.new_email.value.length > 0 && !$scope.alertForm.new_email.$error.email) {
      $scope.m_emails.push($scope.new_email);
      $scope.new_email = {value: ""};
    }
  };

  $scope.removeEmail = function(email, m_index){
    $scope.m_emails.splice(m_index, 1);
    var index = $.inArray(email.value, $scope.current_alert.emails);
    $scope.current_alert.emails.splice(index, 1);
  };
  $scope.addPhone = function(){
    if($scope.new_phone.value && $scope.new_phone.value.length > 0 && !$scope.alertForm.new_phone.$error.phone) {
      $scope.m_phones.push($scope.new_phone);
      $scope.new_phone = {value: ""};
    }
  };
  $scope.removePhone = function(phone, m_index){
    $scope.m_phones.splice(m_index, 1);
    var index = $.inArray(phone.value, $scope.current_alert.phones);
    $scope.current_alert.phones.splice(index, 1);
  };
  $scope.isTypeChecked = function(type){
    return $.inArray(type, $scope.current_alert.type) !== -1;
  };
  $scope.addSmsAlert = function(){
    var index = $.inArray('phone', $scope.current_alert.type);
    if(index < 0){
      $scope.current_alert.type.push('phone');
    }else{
      $scope.current_alert.type.splice(index, 1);
    }
  };
  //authors
  $scope.getButtonClass = function(type){
    switch (type){
      case 'follow':
        if($scope.authors_type == 'white')
          return 'active btn-primary';
        if($scope.authors_type == 'black')
          return 'btn-default';
      case 'exclude':
        if($scope.authors_type == 'black')
          return 'active btn-primary';
        if($scope.authors_type == 'white')
          return 'btn-default';
      case 'own':
        if($scope.ownlb)
          return 'active btn-primary';
        return 'btn-default';
      case 'comp':
        if(!$scope.ownlb)
          return 'active btn-primary';
        return 'btn-default';
    }
  };

  $scope.addAuthor = function(){
    if($scope.new_author.value && $scope.new_author.value.length > 0) {
      $scope.authors.push($scope.new_author);
      $scope.new_author = {value: ""};
    }
  };
  $scope.removeAuthor = function(author){
    var index = $.inArray(author,$scope.authors);
    $scope.authors.splice(index, 1);
  };


  //tonality
  $scope.isTonalityChecked = function(tonality){
    return $.inArray(tonality, $scope.current_alert.filters.tonality) !== -1;
  };

  $scope.addTonality = function(tonality){
    if(tonality == 'all') {
      if($scope.current_alert.filters.tonality.length == 3){
        $scope.current_alert.filters.tonality = [];
      }else {
        $scope.current_alert.filters.tonality = [1, 0, -1];
      }
      return;
    }
    var index = $.inArray(tonality, $scope.current_alert.filters.tonality);
    if(index < 0){
      $scope.current_alert.filters.tonality.push(tonality);
    }else{
      $scope.current_alert.filters.tonality.splice(index, 1);
    }
  };

  $scope.addLabel = function(id){
    var index = $.inArray(id, $scope.current_alert.filters.labels);
    if(index < 0){
      $scope.current_alert.filters.labels.push(id);
    }else{
      $scope.current_alert.filters.labels.splice(index, 1);
    }
  };

  $scope.isLabelChecked = function(id){
    return $.inArray(id, $scope.current_alert.filters.labels) !== -1;
  };

  $scope.addPlatform = function(id){
    var index = $.inArray(id, $scope.current_alert.filters.platforms);
    if(index < 0){
      $scope.current_alert.filters.platforms.push(id);
    }else{
      $scope.current_alert.filters.platforms.splice(index, 1);
    }
  };

  $scope.isPlatformChecked = function(id){
    return $.inArray(id, $scope.current_alert.filters.platforms) !== -1;
  };

  //display data functions
  $scope.display_type = function(alert){
    var str = "email";
    if($.inArray('phone', alert.type) > 0){
      str += ', sms';
    }
    return str;
  };
  $scope.display_target = function (alert) {
    var target = '';
    if(alert.emails.length > 0){
      target += alert.emails.join(', ');
    }
    if($.inArray('phone', alert.type) !== -1 && alert.phones.length > 0){
      target += target.length > 0 ? ', ' : '';
      target += alert.phones.join(', ');
    }
    return target;
  };

  $scope.display_labels = function(alert){
    var labels_ids = alert.filters.labels.slice(0, 3);
    var lbls_names = [];
    angular.forEach(labels_ids, function(id){
      angular.forEach($scope.labels, function(label){
        if(label.id == id){
          lbls_names.push(label.label);
        }
      });
    });
    if($scope.labels.length > 0 && alert.filters.labels.length > 3){
      return lbls_names.join(', ') + ", ..."
    }
    return lbls_names.join(', ');
  };

  $scope.display_platforms = function(alert){
    var platforms_ids = alert.filters.platforms.slice(0, 3);
    var plms_names = [];
    angular.forEach(platforms_ids, function(id){
      var platforms = $scope.static_platforms;
      if($.inArray(id, $scope.other_pi) !== -1){
        platforms = $scope.other_platforms_list;
      }
      for (var i = 0; i < platforms.length; i++) {
        if (platforms[i].id === id) {
          plms_names.push(platforms[i].name);
          break;
        }
      }
    });
    if(alert.filters.platforms.length > 3){
      return plms_names.join(', ') + ", ..."
    }
    return plms_names.join(', ');
  };

  $scope.display_tonality = function(tonalities){
    if(tonalities.length == 3)
      return brs.locale.all_tonalities;
    var str = "";
    angular.forEach(tonalities, function(tnlt){
      str += tonality[tnlt]
      if(tnlt != tonalities[tonalities.length -1])
        str += ', ';
    });
    return str;
  };

  $scope.display_frequency = function(frequency){
    return frequency_to_str[frequency];
  };

  init();

  $scope.addOtherPlatform = function(){
    var selected_plm = $scope.data.selected;
    if(selected_plm){
      $scope.other_platforms.push(selected_plm);
      if($.inArray(selected_plm.id, $scope.other_pi) < 0){
        $scope.other_platforms_list.push(selected_plm);
        $scope.other_pi.push(selected_plm);
      }
    }
    $scope.data.selected = null;
  };

  $scope.removeOtherPlatform = function(platform, o_index){
    $scope.other_platforms.splice(o_index, 1);
    var index = $.inArray(platform.id, $scope.current_alert.filters.platforms);
    if(index >= 0){
      $scope.current_alert.filters.platforms.splice(index, 1);
    }
  };
  ////////
  $scope.items = [];
  $scope.load_more_btn = true;
  $scope.page = 0;
  $scope.pagesize = 15;

  $scope.data = {
    selected: null
  };

  $scope.fetch = function($select, $event) {
    // no event means first load!
    if (!$event) {
      $scope.page = 0;
      $scope.items = [];
    } else {
      $event.stopPropagation();
      $event.preventDefault();
      $scope.page++;
    }

    $scope.p_loading = true;
    $http({
      method: 'GET',
      url: '/http_proxy/mnemosyne/platforms.json',
      params: {
        q: $select.search,
        page: $scope.page,
        pagesize: $scope.pagesize
      }
    }).then(function(resp) {
      $scope.items = $scope.items.concat(resp.data.items);
      if(resp.data.items.length < $scope.pagesize){
        $scope.load_more_btn = false;
      }else{
        $scope.load_more_btn = true;
      }
    })['finally'](function() {
      $scope.p_loading = false;
    });
  };

});
