/*---Huge directive angular 1.4.9----*/

brs.app.directive('mentions', function($injector, Mentions, Labels, Tags, TaggingService, MentionsActions, Colorizer, filterManager, pluralize_mention_format, $location){
  return {
    restrict: 'E',
    templateUrl: 'mentions-list',
    scope: {
      mode: '@',
      clientId: '=',
      authToken: '@',
      mentionId: '='
    },
    controller: function($scope, $rootScope, $element){
      $scope.is_admin = OPTS.is_admin; //FIXME REMOVE THIS!
      $scope.star_tag_name = "starred:user=" + OPTS.user_id;

      var answer_platform = {
        'vk': 'vk',
        'vk2': 'vk',
        'fb': 'facebook',
        'facebook': 'facebook',
        'facebook2': 'facebook',
        'twitter': 'twitter',
        'twitter2': 'twitter'
      }

      //Mention processor, global
      var proc;

      (function(){
        //Set default params for commands service (client id, auth token)
        MentionsActions.init_defaults({
          client_id: $scope.clientId,
          authenticity_token: $scope.authToken
        });
        //Get all labels, required by mentions-topics dialog (to render dialog),
        //assign colors to them.
        Labels.cached().then(function(labels){
          $scope.all_labels = {
            labels: labels.filter(function(label){return !label.is_competitor}),
            competitors: labels.filter(function(label){return label.is_competitor})
          };
          Colorizer.build_color_map(labels);
        });
        //Get all tags
        Tags.query({client_id: $scope.clientId}).$promise.then(function(tags){
          $scope.tags = tags;
        });
      })();

      //~~~~~~~~~~~~~ scope UI methods

      //Fired by Tagging Service upon tag creation.
      //adds new tag to the scope (for autocomplete)
      $scope.$on('filters.tags:create', function($event, tag){
        $scope.tags.push(tag);
      });

      $scope.is_answer_btn_visible = function(mention){
        mention.provider = mention.platform.url.split('//')[1].split('.')[0];
        return OPTS.social_providers.indexOf(mention.provider) !== -1;
      };

      $scope.set_answer_status = function(mention, status) {
        var data = {answer: status, client_id: mention.client_id, id: mention.id};
        data.authenticity_token = OPTS.auth_token;
        brs.app.start_ajax_cursor();
        Mentions.answer(data, function(resp){
          //console.log(resp);
          mention.answer = status;
          brs.app.stop_ajax_cursor();
        }, function(err){
          //console.log(err);
          brs.app.stop_ajax_cursor();
          alert(brs.locale.answer_status_error);
        });
      };

      var send_to_briareos = function(mention, data){
        data.authenticity_token = OPTS.auth_token;
        brs.app.start_ajax_cursor();
        var url = "/http_proxy/briareos/api/corpora/" + data.platform + "/answer";

        $.ajax({
          url: url,
          type: 'post',
          data: data,
          success: function(answer){
            if(!mention.answers){
              mention.answers = [];
            }
            mention.answers.push({text: data.text, created_at: new(Date), url: answer.url, user_id: data.user_id});
            mention.answer_success = brs.locale.answer_sent;
            mention.answer_text = '';
            mention.show_answers = false;
            brs.app.stop_ajax_cursor();
            if (mention.metrics.comments){
              mention.metrics.comments += 1;
            }else{
              mention.metrics.comments = 1;
              mention.show_comments_btn = true;
            }
            $scope.show_answers(mention);
          },
          error: function(err){
            mention.answer_error = brs.locale.answer_error;
            brs.app.stop_ajax_cursor();
            $scope.$digest();
            console.log(err);
          }
        });

      };

      var get_provider_accounts = function(entry){
        if(entry.answer_accounts.length !== 0) return;  // todo: save accounts data to some storage variable for other entries

        var platform = entry.origin.split('-')[0];
        platform = answer_platform[platform] ? answer_platform[platform] : platform;

        var url = location.pathname + '/platform_accounts?platform=' + platform;

        // get auth details
        $.ajax({
          url: url,
          type: 'get',
          success: function(resp){
            entry.answer_accounts = resp;
            $scope.$digest();
          },
          error: function(err){
            console.log(err);
          }
        });
      };

      $scope.show_answer_area = function(mention){
        mention.show_answer_area = !mention.show_answer_area;
        mention.answer_error = undefined;
        mention.answer_success = undefined;
        get_provider_accounts(mention);
      };

      $scope.send_answer = function(mention){
        mention.answer_error = undefined;
        mention.answer_success = undefined;
        var answer = $.trim(mention.answer_text);
        if(answer.length == 0) {
          mention.answer_error = brs.locale.empty_answer_error;
          return;
        }
        if(!mention.acc_for_answer){
          mention.answer_error = brs.locale.choose_account;
          return;
        }
        var platform = mention.origin.split('-')[0];
        platform = answer_platform[platform] ? answer_platform[platform] : platform;

        var answer = {client_id: OPTS.remote_client_id, mention_id: mention.id,
                      text: answer, platform: platform,
                      encrypted_token: mention.acc_for_answer.encrypted_token,
                      account_name: mention.acc_for_answer.description,
                      group: mention.acc_for_answer.group, group_url: mention.acc_for_answer.group_url,
                      url: mention.url, user_id: OPTS.user_id};

        send_to_briareos(mention, answer);
      };

      var get_user_info = function(mention){
        if(!mention.answers || mention.answers.length === 0) {
          mention.answers_loading = false;
          return;
        }
        var ids = mention.answers.map(function(answer){return answer.user_id;});
        var url = location.pathname + '/users_info';

        $.ajax({
          url: url,
          data: {ids: ids},
          type: 'get',
          success: function(users){
            angular.forEach(mention.answers, function(answer){
              for(var i=0, len = users.length; i < len; i++){
                var user = users[i];
                if(user.id === answer.user_id){
                  answer.author_email = user.email;
                  answer.author_name = user.name;
                  break;
                }
              }
            });
            mention.answers_loading = false;
            $scope.$digest();
          },
          error: function(err){
            console.log(err);
            mention.answers_loading = false;
            $scope.$digest();
          }
        });
      };

      $scope.show_answers = function(mention){
        mention.show_answers = !mention.show_answers;
        if(!mention.show_answers){
          return;
        }
        var data = {client_id: mention.client_id, id: mention.id};
        mention.answers_loading = true;
        Mentions.answers(data, function(resp){
          mention.answers = resp.items;
          get_user_info(mention);
        },
        function(error) {
          console.log(error);
          mention.answers_loading_error = true;
          mention.answers_loading = false;
        });
      };

      $scope.date_format = function(date){
        return moment(date).format("DD MMMM YYYY HH:mm")
      }

      $scope.add_tag = function(topic, tag){
        TaggingService.tag(topic, tag);
      };

      $scope.add_tag_from_list = function(topic, tag){
        topic.tags.push(tag);
        $scope.add_tag(topic, tag);
      };

      $scope.remove_tag = function(topic, tag){
        TaggingService.untag(topic, tag);
      };

      $scope.filter_tags = function(topic){
        return TaggingService.filter_tags(topic.tags, $scope.tags);
      };

      $scope.is_starred = function(topic){
        if (!topic.tags) return false;
        return topic.tags.filter(function(tag){
          return tag.title === $scope.star_tag_name;
        }).length != 0;
      };

      $scope.star = function(topic, is_applied){
        var star_tag = $scope.tags.filter(function(tag){
          return tag.title == $scope.star_tag_name;
        })[0];
        //does not exist yet, pretend its a new one
        if(!star_tag){
          star_tag = {title: $scope.star_tag_name};
        }
        return TaggingService.toggle_tag(star_tag, topic, is_applied);
      };

      //Sets currently selected topic for modal dialog
      //TODO
      $scope.select_topic_for_tags = function(topic){
        $scope.topic_for_tags = topic;
        //TODO store filtered non_machine taglist at the
        //model property, do not use filter upon collection (infinite digest cycle)
        //TODO rewrite tag_input directive
        var re = /^([^ ":]+|"[^"]+"):([^=]+)=(.*)$/;
        $scope.topic_for_tags.taglist = $scope.topic_for_tags.tags.filter(function(tag){
          if(tag.display_title || !tag.title.match(re)){
            return tag;
          }
        });
      };

      var getComments = function() {

        $scope.comments_loading = true;

        var data = {client_id: $scope.comment_mention.client_id,
                    id: $scope.comment_mention.mention_id,
                    page: $scope.comment_mention.page,
                    pagesize: $scope.comment_mention.pagesize};

        Mentions.comments(data, function(resp){
          $scope.comments = $scope.comments.concat(resp.items);
          $scope.load_more_comments_btn = resp.meta.pagination.total_pages && resp.meta.pagination.total_pages != $scope.comment_mention.page + 1;
          $scope.comments_loading = false;
        },
        function(error) {
          console.log(err);
          $scope.comments_loading = false;
        });
      };

      $scope.loadmore_comments = function(){
        $scope.comment_mention.page = $scope.comment_mention.page + 1;
        getComments();
      }

      $scope.show_comments = function(mention){
        $('#mention-comments-modal').modal('show');
        $scope.comment_mention = mention;
        var id = mention.id;
        if(filterManager.getCurrentPage() == 'assessor'){
          id = mention.mention.id;
        }
        $scope.comment_mention.mention_id = id;

        $scope.comment_mention.page = 0;
        $scope.comment_mention.pagesize = 100;

        $scope.comments = [];

        getComments();
      };

      $scope.setCommentTonality = function(comment, tonality){
        comment.loading = true;
        var data = {tonality: tonality, authenticity_token: OPTS.auth_token};

        var url = '/http_proxy/mnemosyne/v2/clients/' + $scope.comment_mention.client_id;
        url += '/mentions/' + $scope.comment_mention.mention_id + '/comments/' + comment.id +'.json';

        $.ajax({
          url: url,
          type: 'put',
          contentType: 'application/json',
          dataType: 'json',
          data: JSON.stringify(data),
          success: function(resp){
            comment.tonality = tonality;
            comment.loading = false;
            $scope.$digest();
          },
          error: function(err){
            console.log(err);
            comment.loading = false;
            $scope.$digest();
          }
        });
      };

      $scope.hide_comments = function(){
        $('#mention-comments-modal').modal('hide');
      };

      //Sets entry as spam (or not spam)
      $scope.setSpam = function(entry){
        if(_is_manual_mention(entry)){
          return false;
        }
        _clear_entry_errors();
        //collect entries for operation fallback
        var entries = $scope.entries.filter(function(e){
          return e.id == entry.id;
        });
        //Remove entries from the displayed list immediately,
        //without waiting for the operation to actually proceed,
        //display error message if fails. Use cached entries for
        //every mode.
        $scope.entries = $scope.entries.filter(function(e){
          return e.id != entry.id;
        });
        _get_cached_entries();// might fire hashchange and load()
        //since scope.isSpam (from directive attributes) means actually
        //that we should(not) fetch mentions from spam, e.g. mentions is_spam="false"
        //means "get non-spammed mentions", we have to revert its value here to the opposite
        //one since here we are indeed sending mentions to/from spam, so without
        //it example above would be setSpam(false) while in this case we indeed
        //want to send this mention to spam.
        //^ what??
        var is_spam = !$scope.is_spam;
        MentionsActions.spam(entry.id, is_spam).then(
          function(data){
            //since we already removed entry from the displayed list,
            //do nothing here actually.
          }, function(responseError){
            //get back deleted entry to the list
            entries.forEach(function(entry){
              $scope.entries.push(entry);
            });
            _display_entry_error(entry, brs.locale.spam_error + ' ' + (is_spam ? brs.locale.add_to_spam : brs.locale.remove_from_spam) );
            throw new Error(responseError);
          }
        );
      };

      $scope.setSpamAssessorMode = function(entry){
        if(_is_manual_mention(entry)){
          return false;
        }
        _clear_entry_errors();
        var mention_id = entry.mention_id;
        //collect entries for operation fallback
        var entries = $scope.entries.filter(function(e){
          return e.mention_id == mention_id;
        });
        //Remove entries from the displayed list immediately,
        //without waiting for the operation to actually proceed,
        //display error message if fails. Use cached entries for
        //every mode.
        $scope.entries = $scope.entries.filter(function(e){
          return e.mention_id != mention_id;
        });
        _get_cached_entries();// might fire hashchange and load()
        //since scope.isSpam (from directive attributes) means actually
        //that we should(not) fetch mentions from spam, e.g. mentions is_spam="false"
        //means "get non-spammed mentions", we have to revert its value here to the opposite
        //one since here we are indeed sending mentions to/from spam, so without
        //it example above would be setSpam(false) while in this case we indeed
        //want to send this mention to spam.
        //^ what??
        var is_spam = !$scope.is_spam;
        MentionsActions.spam(mention_id, is_spam).then(
            function(data){
              //since we already removed entry from the displayed list,
              //do nothing here actually.
            }, function(responseError){
              //get back deleted entry to the list
              entries.forEach(function(entry){
                $scope.entries.push(entry);
              });
              _display_entry_error(entry, brs.locale.spam_error + ' ' + (is_spam ? brs.locale.add_to_spam : brs.locale.remove_from_spam) );
              throw new Error(responseError);
            }
        );
      };

      $scope.getMentionIndex = function(index){ // number placed in top right angle of mention
        var filters = filterManager.getFilters();
        return (index + 1 + ((filters.page ? filters.page : 0) * (filters.pagesize ? filters.pagesize : 0)));
      };

      //Change tonality (topic required)
      $scope.setTonality = function(entry, topic, tone){
        if(_is_manual_mention(entry)){
          return false;
        }
        _clear_entry_errors();
        //immediately switch to requested tonality, assume op success.
        entry.loading = true;
        //Process
        MentionsActions.tonality(topic.id, tone).then(
          function(data){
            entry.loading = false;
            //Switch to manually processed
            topic.tonality = tone;
            topic.manual_tonality = tone;
            // temporary fix for assessors mode
            if(filterManager.getCurrentPage() == 'assessor'){
              entry.tonality = tone;
              entry.manual_tonality = tone;
            }
            //ensure tonality processing only for the case
            //when we're in 'only unprocessed' operation mode
            if($scope.filters.is_processed === false){
              _remove_entry(entry);
              _get_cached_entries();// might fire hashchange and load()
            }
            //fire change event so tonality filters could update themselves
            $rootScope.$broadcast('filters.tonality:update');
          }, function(responseError){
            _display_entry_error(entry, brs.locale.tonality_error);
            throw new Error(responseError);
          }
        );
      };

      //Removes entry from a topicz
      $scope.removeFromTopic = function(entry, topic){
        if(_is_manual_mention(entry)){
          return false;
        }
        _clear_entry_errors();
        entry.loading = true;
        MentionsActions.remove_topic(topic.id).then(
          function(data){
            entry.loading = false;
            _remove_entry_topic(entry, topic);
            //if assessor
            if($scope.mode == 'assessor'){
              //Do not diplay this entry for assessors
              _remove_entry(entry);
              _get_cached_entries();// might fire hashchange and load()
              //Recalculate all other entries with the same mention id,
              //updating their topics array as well (to update view properly)
              angular.forEach($scope.entries, function(sibling){
                if(sibling.id === entry.id){
                  _remove_entry_topic(sibling, topic);
                }
              })
            }
            //update labels filter
            $rootScope.$broadcast('filters.labels:update');
          }, function(responseError){
            entry.loading = false;
            _display_entry_error(entry, brs.locale.remove_from_label_error);
          }
        );
      };

      /* Opens modal window for changing theme for a mention,
       * handled by @changeTopic
       *
       * @operation - either copyto or moveto
       */
      $scope.changeTopicDialog = function(operation, entry, topic){
        if(_is_manual_mention(entry)){
          return false;
        }
        var dialogEl = $('#seeds_transfer_dialog');
        //hide current entry topics/labels
        $('#seeds_transfer_dialog div.modal-body ul li').show();
        angular.forEach(entry.topics, function(t){
          if(t.label) {
            $('#seeds_transfer_dialog div.modal-body ul li[data-label-id=' + t.label.id + ']').hide();
          }
        });
        //make proper title
        if (operation == 'moveto') {
          $('#theme-operation-title').text(brs.locale.move_to_label);
        } else {
          $('#theme-operation-title').text(brs.locale.copy_to_label);
        }
        //pass arguments to the handler [@changeTopic] via modal dialog data
        dialogEl.data('operation', operation);
        dialogEl.data('entry', entry);
        dialogEl.data('topic', topic);
        dialogEl.modal();
      };

      /* Process actual topic change (copy/move) based on dialog data
       * @label - Label, selected at the dialog
       */
      $scope.changeTopic = function(label, evt){
        var dialogEl = $('#seeds_transfer_dialog');
        var operation = dialogEl.data('operation');
        var entry = dialogEl.data('entry');
        var topic = dialogEl.data('topic');
        //ui cleanup
        dialogEl.modal('hide');
        $('div.modal-body ul li').show(); //get back all labels for the next run
        //process
        entry.loading = true;
        MentionsActions.change_topic(operation, topic.id, label.id).then(
          function(data){
            _load();
            $rootScope.$broadcast('filters.labels:update');
          }, function(responseError){
            entry.loading = false;
            _display_entry_error(entry, brs.locale.change_label_error);
          }
        );
      };

      //Loads highlighted fulltext for an entry,
      //also toggles its display
      $scope.toggleFullText = function(entry){
        if (!entry.full_text){
          entry.loading_full_text = true;
          _get_mention_body(entry);
        }
        entry.show_full_text = !entry.show_full_text;
      };

      //FIXME move to proc
      $scope.format_tonality = function(topic){
        if(topic){
          var tonalities = {
            '1': 'positive',
            '0': 'neutral',
            '-1': 'negative'
          };
          return tonalities[topic.tonality];
        }
      };

      //Returns config object for ng-pluralize,
      //format is configured via application variable (bs.app.js)
      $scope.pluralize = pluralize_mention_format;

      //Returns proper color css ref for the label
      $scope.colorize = function(label){
        return Colorizer.colorize_label(label)
      };

      //~~~~~~~~~~~~ controller public methods

      //loads mentions to scope
      this.load = function(append) {
        _load(append);
      };

      //Hides errors for the displayed entries (if any)
      this.clear_entry_errors = function(){
       _clear_entry_errors();
      };

      //Displays an error for an entry only
      this.display_entry_error = function(entry, error_text){
        _display_entry_error(entry, error_text);
      };

      //Returns currently selected entries (assessor mode uses checkbox for this)
      //DEPRECATED
      this.get_selected_entries = function(){
        return $scope.entries == undefined ? [] : $scope.entries.filter(function(entry){
            if(entry.checked) return entry;
          });
      };

      //Selects (or deselects) all scope entries, e.g. select_all_entries(true);
      //DEPRECATED
      this.change_selected_entries = function(select){
        angular.forEach($scope.entries, function(entry) {
          entry.checked = select;
        });
      };

      //Returns currently selected topics;
      //uses entries_topics array to improve selection speed
      //@see mentions_processor.after_load()
      this.get_selected_topics = function(){
        return $scope.entries_topics == undefined ? [] : $scope.entries_topics.filter(function(topic){
          if(topic.checked) return topic;
        });
      };

      //Selects (or deselects) all topics, e.g. select_all_topics(true);
      //FIXME get rid of eval somehow
      this.change_selected_topics = function(select, condition){
        angular.forEach($scope.entries_topics, function(topic) {
          if(condition){
            if(eval(condition)){
              topic.checked = select;
            }
          }else{
            topic.checked = select;
          }
        });
      };

      //Finds entries by id (mention id), returns array of entries since
      //for 'index' mode there could be several entries with the same id
      this.find_entries_by_mention_id = function(mention_id){
         return $scope.entries.filter(function(entry){
          if(entry.id == mention_id) return entry;
        });
      };

      //FIXME rename method into smth meaningful
      this.get_query_type = function(){
        return $scope.query_type;
      };

      this.is_spam = function(){
        return $scope.is_spam;
      }

      //~~~~~~~~~~~~~~ private

      //Removes an entry from the view
      var _remove_entry = function(entry){
        var deleted_index = $.inArray(entry, $scope.entries);
        var deleted_entry = $scope.entries.splice(deleted_index, 1);
        return deleted_entry;
      };

      //Removes a topic from entry (view)
      var _remove_entry_topic = function(entry, topic){
        entry.topics = entry.topics.filter(function(t) {
          return t.id !== topic.id;
        });
      };

      //Hides errors for the displayed entries (if any)
      var _clear_entry_errors = function(){
       angular.forEach($scope.entries, function(entry, index) {
         entry.error = false;
         entry.error_text = '';
       });
      };

      var _is_manual_mention = function(entry){
        if(OPTS.is_admin && OPTS.manual_edit) return false;
        if(entry.origin == 'manual'){
          brs.app.show_bootstrap_alert(brs.locale.manual_mention_error, 'error', true);
          return true;
        }
        return false;
      };

      //Displays an error for an entry only
      var _display_entry_error = function(entry, error_text){
        entry.error = true;
        entry.error_text = error_text;
        entry.loading = false;
      };
      var show_starred_tag_alert = function(){
        $scope.show_starred_tag_alert = false;
        var tags_from_filter = $scope.filters.tags.toString().split(',');
        tags_from_filter.forEach(function (f_tag, _){
          $scope.tags.forEach(function (tag, _idx){
            if(f_tag == tag.id.toString() && tag.title.indexOf("starred:user=") == 0){
              $scope.show_starred_tag_alert = tag.title.indexOf($scope.star_tag_name) == -1;
            }
          });
        });
      };

      var _load = function(append){
        $scope.loading = true;
        //drop spam count
        $scope.spam_count = null;
        //copy params so we accidentally don't brake them up below
        var params = angular.copy(_prepare_state(append));
        //check if request is search (must be pushed through barney and processed by IndexMentionsProcessor)
        var has_search = _is_barney_request(params);
        //rebuild mention processor for each request
        proc = _init_proc(params, has_search);
        //angular seems to fuckup nested objects when interpolating them
        //to querystring, so we have to rebuild it "the jquery way"
        //mnemosyne client id from directive's options to default params
        if($scope.mode == 'mention'){
          params = {id: $scope.mentionId};
        }else{
          //TODO perhaps there's an api call for this
          MentionsActions.format_filters_for_get_request(params);
        }
        angular.extend(params, {client_id: $scope.clientId});
        //success callback, fire load events and proxy to
        //on_mentions_load (see mentions_processor.js)
        var success = function(data, responseHeaders){
          $(document).trigger('pageload', [data]);
          $scope.json = data;
          //get spam count (if not on spam and is searching)
          //note params filters are flattened after MentionsActions.format_filters_for_get_request
          if(params['filters[text]'] && !$scope.is_spam){
            _get_spam_count(params);
          }
          if(params['filters[tags]']){
            show_starred_tag_alert();
          }
          //process loaded mentions
          proc.on_mentions_load($scope, append, data, responseHeaders);
          $scope.loading = false;
        };
        var success_for_mention = function (data, responseHeaders) {
          $scope.json = {items: [data]};
          proc.on_mentions_load($scope, append, $scope.json, responseHeaders);
          $scope.loading = false;
        };
        //error callback
        //TODO ensue reports properly to the errbit
        var error = function(httpResponse){
          throw new Error("Mentions loading error: "+httpResponse.data, httpResponse);
        };

        //load mentions based on the mode (index, assessors) and request type
        //search is always processed by barney
        //FIXME rename query_type into smth meaningful
        if(has_search){
          $scope.query_type = "barney"; //for conditional ng-include (view)
          Mentions.search(params, success, error)
        //anything else by dedicated calls
        }else{
          $scope.query_type = "mnemosyne"; //for conditional ng-include (view)
          switch($scope.mode) {
            case 'assessor':
              Mentions.assessors(params, success, error);
              break;
            case 'index':
              Mentions.query(params, success, error);
              break;
            case 'mention':
              Mentions.mention(params, success_for_mention, error);
              break;
            }
        }
      };

      // MentionsProcessor; rebuild for each request since we have to process
      // search (barney) requests only with IndexProcessor, despite of the current
      // mode
      var _init_proc = function(params, has_search){
        if(has_search){
          return $injector.get('IndexMentionProcessor');
        }else{
          //processor class name based on directive mode (index, spam, assessor)
          var mode = $scope.mode.replace(/^(.)|(\s|\-)(.)/g, function($1) {
            return $1.toUpperCase();
          });
          return $injector.get(mode+'MentionProcessor');
        }
      };

      // Checks if request should go through barney instead of mnemosyne
      var _is_barney_request = function(params){
        return undefined != (params.filters['text'] || params.filters['lingua_keywords']);
      };

      //private, loads count for messages in spam (so when user is searching
      // we could show how much stuff were deleted)
      var _get_spam_count = function(params){
        params.only_meta = true;
        params['filters[is_spam]'] = true;
        Mentions.search(params, function(data, responseHeaders){
          var link = "";
          if ($scope.mode == 'assessor') {
            link = 'spam#' + $location.path();
          }else{
            link = 'words/spam#' + $location.path();
          }
          if(data && data.meta){
            $scope.spam_count = {
              count: data.meta.pagination.total_items,
              link: link
            };
          }
        }, function(error){
          throw new Error(error);
        });
      };

      var _get_mention_body = function(entry){
        var id = entry.id;
        if(filterManager.getCurrentPage() == 'assessor' && entry.mention_id){
          id = entry.mention_id;
        }
        var params = {id: id, client_id: OPTS.remote_client_id};
        Mentions.query(params, function(mention){
          entry.body = mention.body;
          _highlight_fulltext(entry);
        }, function(httpResponse){
          //hide loader
          entry.loading_full_text = false;
          //notify on error
          entry.full_text = '<p class="alert">' + brs.locale.upload_full_text_error + ' ('+httpResponse.data+')!</p>';
        })
      };

      //private, loads highlighted fulltext
      //have to pass through lingua
      var _highlight_fulltext = function(entry){
        //collect data to highlight with
        var seed = {keywords: [], context: [], synonyms: []}
        if (entry.seed){
          seed.keywords = entry.seed.keywords;
        }else {
          angular.forEach(entry.topics, function (topic, index) {
            if(topic.seed && topic.seed.keywords)
              seed.keywords = seed.keywords.concat(topic.seed.keywords.length > 0 ? topic.seed.keywords :[]);
            if(topic.seed && topic.seed.context)
              seed.context = seed.context.concat(topic.seed.context.length > 0 ? topic.seed.context :[]);
          });
        }
        //prepare params
        var params = {
            content: {
                content: entry.body,
                title: entry.title
            },
            seed: seed
        };
        //process
        Mentions.highlight({
             highlight_data: JSON.stringify(params),
             authenticity_token: OPTS.auth_token
          }, function(data, responseHeaders){
               //FIXME could silently fuck up highlighted data from lingua
               //(if lingua is not responsive), error callback below seems
               //not be called at all in this case. No idea why.
               if (data.content && data.content.highlight.body) {
                 //highlight based on the current filter
                 entry.full_text = proc.highlight_full_body(entry, data.content.highlight.body.join(''));
               }else{
                 //just copy entry body without highlight if none received OR lingua was too busy with something
                 entry.full_text = '<p class="alert alert-info">' + brs.locale.format_text_error + '</p>' + entry.body;
               }
               //hide loader
               entry.loading_full_text = false;
        }, function(httpResponse){
          //hide loader
          entry.loading_full_text = false;
          //notify on error, but show body
          entry.full_text = '<p class="alert">' + brs.locale.upload_formatted_text_error + ' (' + httpResponse.data + ')!</p>' + entry.body;
        });
      };

      //private, sets up scope state based on the current
      //params (filters etc.), returns properly formatted
      //params for Mentions queries.
      var _prepare_state = function(append){
        var params = filterManager.getFilters('words');
        params.criteria = 'lingua_keywords'; //FIXME what this shit is for?
        params.master = 'true';              //FIXME what this shit is for?
        if ($scope.mode == 'assessor') {
          params.prefetch = 70;
        }
        $scope.filters = params.filters;//required by template (conditional messages)
        //FIXME not needed?
        $scope.meta = {
          page: ( 'page' in params ) ? parseInt(params.page, 10) : 0,
          pagesize: ( 'pagesize' in params ) ? parseInt(params.pagesize, 10) : 10
        };
        //FIXME what's this?
        if(append) {
          params.page = ($scope.meta.page + 1) * $scope.meta.pagesize - 1; // entry just marked as spam
          params.pagesize = 1;
        }
        return params;
      };

      //private, loads entries from the cache, if cache is empty fires
      //hashchange (reloads data and adds back the cache)
      /*
       total_items <= pagesize*(page+1)+prefetch
      если условие выполняется — значит, это на данный момент последняя страница
      */
      var _get_cached_entries = function(){
        //do nothing if there's nothing prefetched
        if($scope.json.prefetched_items == undefined){
          return;
        }
        var cache = $scope.json.prefetched_items;
        var page_meta = $scope.json.meta.pagination;
        var items_from_cache_count = page_meta.pagesize - $scope.entries.length;
        if (items_from_cache_count > $scope.json.length){
            items_from_cache_count = cache.length;
        }
        //if there's nothing left in the cache - reload page
        if(cache.length == 0){
          if(page_meta.prefetched > 0){
            $(window).trigger('hashchange');
          }
        }
        //populate entries from the cache
        for (var i = 0; i < items_from_cache_count; i++){
          var item = cache.shift();
          if(item){
            $scope.entries.push(proc.compose_entry(item));
            proc.after_load($scope);//update entries_topics cache for selection
          }
        }
      };

    //~ end controller funcs
    },
    //FIXME move all scope function to link
    link: function(scope, element, attrs, ctrl) {
      //FIXME move all filter-based init to link
      var params = filterManager.getFilters('words');
      scope.is_spam = params.filters['is_spam'];

      $(window).bind('hashchange', function () {
        ctrl.load();
      });
      ctrl.load();
    }
  };

});
