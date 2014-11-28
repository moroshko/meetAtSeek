angular.module('tab3', []).controller('Tab3Ctrl', function(
  $scope, $q, $state, $stateParams, dateFilter, PleaseWait, Auth, Meetups, Interests, Users, FIREBASE_ROOT) {

  if ($stateParams.view === 'new') {
    $scope.view = 'new';
    $scope.title = 'Invite ' + Users.getName($stateParams.username);
  } else if ($stateParams.view === 'view') {
    var parts = $stateParams.username.split('|');

    $scope.view = 'view';
    $scope.title = 'Invite from ' + Users.getName(parts[1]);
    $scope.meetupId = parts[0];
  } else {
    $scope.view = 'all';
    $scope.title = 'Meetups';
  }

  $scope.isToday = function(day) {
    var parts = day.fullDate.split('-');
    var month = parts[1];
    var day = parts[2];
    var now = new Date();

    return (now.getMonth() + 1 === +month) && (now.getDate() === +day);
  };

  $scope.Users = Users;
  
  var usersRef = new Firebase(FIREBASE_ROOT + '/users');
  
  $scope.ready = true;
  $scope.requests = [];
  $scope.sent = [];
  $scope.upcoming = [];

  var invitations = [{
    from: 'ashelton',
    to: 'dpryce',
    accepted: true
  }, {
    from: 'ashelton',
    to: 'mmoroshko',
    accepted: false
  }];

  function getMeetupsForUser(type) {
    var defer = $q.defer();

    usersRef.child(Auth.username()).child(type).on('value', function (snapshot) {
      var meetupsObj = snapshot.val();
      var meetupIds = (meetupsObj === null ? [] : Object.keys(meetupsObj));
      var promises = meetupIds.map(function (meetupId) {
        return Meetups.getById(meetupId);
      });

      $q.all(promises).then(function (meetups) {
        $scope[type] = meetups;
        var interestPromises = [];
        for (var i = 0; i < meetups.length; i++) {
          var interestsPromise = addCommonInterests(meetups[i]);
          interestPromises.push(interestsPromise);
        }
        $q.all(interestPromises).then(function() {
          defer.resolve(meetups);
        });
      });
    });

    return defer.promise;
  }

  function addCommonInterests(meetup) {
    var defer = $q.defer();

    var username1 = meetup.to;
    var username2 = meetup.from;

    Users.getInterests(username1).then(function (interest1Ids) {
      var interest1IdKeys = Object.keys(interest1Ids);

      Users.getInterests(username2).then(function (interest2Ids) {
        var interest2IdKeys = Object.keys(interest2Ids);

        var matches = [];
        for(var i = 0; i < interest1IdKeys.length; i++) {
          for(var j = 0; j < interest2IdKeys.length; j++) {
            if (interest1IdKeys[i] === interest2IdKeys[j]) {
              matches.push(interest1IdKeys[i]);
            }
          }
        }

        var promises = matches.map(function(interestId) {
          return Interests.getById(interestId);
        });

        $q.all(promises).then(function(interests) {
          meetup.interests = interests;
          defer.resolve(interests);
        })
      });
    });
    return defer.promise;
  }

  function setDayAndTimes(startDate) {
    if (angular.isDefined(startDate)) {
      var now = +new Date(startDate);
    } else {
      var now = Date.now();
    }

    var day = 24 * 60 * 60 * 1000;

    $scope.days = [];

    for (var i = 0; $scope.days.length < 5; i++) {
      var dayStr = dateFilter(now + i * day, 'EEE');
      
      if (dayStr !== 'Sat' && dayStr !== 'Sun') {
        var date = dateFilter(now + i * day, 'd/MM');
        var fullDate = dateFilter(now + i * day, 'yyyy-MM-dd');

        $scope.days.push({
          day: dayStr,
          date: date,
          fullDate: fullDate
        });
      }
    }

    $scope.times = [];

    for (var i = 9; i <= 17; i++) {
      $scope.times.push(i + ':00');
    }
  }

  $scope.data = {
    message: '',
    availability: {},
    place: ''
  };

  var requestsCount = Auth.getRequestsCount();

  $scope.$watch('data', function() {
    Auth.setRequestsCount(requestsCount);
  }, true);

  if ($scope.view === 'new') {
    setDayAndTimes();

    $scope.setPlace = function(place) {
      Auth.setRequestsCount(requestsCount);
      $scope.data.place = place;
    };

    $scope.availabilityIsSet = function() {
      return Object.keys($scope.data.availability).length > 0;
    };

    $scope.invite = function() {
      var requestedTimes = [];

      for (var pipeSeparatedStr in $scope.data.availability) {
        if ($scope.data.availability[pipeSeparatedStr] === true) {
          var parts = pipeSeparatedStr.split('|');

          requestedTimes.push({
            day: parts[0],
            date: parts[1],
            time: parts[2]
          });
        }
      }

      Meetups.add($stateParams.username, requestedTimes, $scope.data.message, $scope.data.place).then(function(meetupId) {
        Users.addRequest($stateParams.username, meetupId).then(function() {
          Users.addSent(Auth.username(), meetupId).then(function() {
            $state.go('tab.tab3-all', {
              view: 'all'
            });
          });
        });
      });
    };
  }

  function upcomingCompare(up1, up2) {
    if (up1.acceptedTime.date < up2.acceptedTime.date) {
      return -1;
    }

    if (up1.acceptedTime.date > up2.acceptedTime.date) {
      return 1;
    }

    if (up1.acceptedTime.time < up2.acceptedTime.time) {
      return -1;
    }

    if (up1.acceptedTime.time > up2.acceptedTime.time) {
      return 1;
    }

    return 0;
  }

  $scope.backToAll = function() {
    $state.go('tab.tab3-all', {
      view: 'all'
    });
  };

  if ($scope.view === 'all') {
    var allPromises = [];
    var requestsPromises = getMeetupsForUser('requests');
    var sentPromises = getMeetupsForUser('sent');
    var upcomingPromises = getMeetupsForUser('upcoming');
    allPromises = allPromises.concat(requestsPromises, sentPromises, upcomingPromises);
  
    PleaseWait.show();
    $scope.ready = false;

    $q.all(allPromises).then(function () {
      $scope.ready = true;

      $scope.upcoming.sort(upcomingCompare);

      PleaseWait.hide();
    });

    $scope.viewRequestedMeetup = function(requestedMeetup) {
      $state.go('tab.tab3-view', {
        view: 'view',
        username: requestedMeetup.id + '|' + requestedMeetup.from
      });
    };

    $scope.acceptedTimeDate = function(dateStr) {
      var date = new Date(dateStr);

      return dateFilter(+date, 'MMM dd')
    };

    $scope.upcomingUserName = function(meetup) {
      if (meetup.to !== Auth.username()) {
        return Users.getName(meetup.to);
      }

      return Users.getName(meetup.from);
    };
  }

  if ($scope.view === 'view') {
    Meetups.getById($scope.meetupId).then(function(meetup) {
      var minDate = '3000-01-01';

      $scope.meetup = meetup;

      for (var i = 0, len = meetup.requestedTimes.length; i < len; i++) {
        if (meetup.requestedTimes[i].date < minDate) {
          minDate = meetup.requestedTimes[i].date;
        }
      }

      setDayAndTimes(minDate);

      for (var i = 0, len = meetup.requestedTimes.length; i < len; i++) {
        var requestedTime = meetup.requestedTimes[i];

        $scope.data.availability[requestedTime.day + '|' + requestedTime.date + '|' + requestedTime.time] = false;
      }

      $scope.timeSlotSelected = false;

      $scope.onTimeSlotClick = function(pipeSeparatedStr) {
        for (var key in $scope.data.availability) {
          $scope.data.availability[key] = false;
        }

        $scope.data.availability[pipeSeparatedStr] = true;
        $scope.timeSlotSelected = true;
      };

      $scope.letsMeet = function() {
        Auth.setRequestsCount(requestsCount);
        
        for (var key in $scope.data.availability) {
          if ($scope.data.availability[key] === true) {
            var parts = key.split('|');
            var acceptedTime = {
              date: parts[1],
              day: parts[0],
              time: parts[2]
            };

            return Meetups.addAcceptedTime(meetup.id, acceptedTime).then(function() {
              Users.removeRequest(meetup.to, meetup.id).then(function() {
                Users.removeSent(meetup.from, meetup.id).then(function() {
                  Users.addUpcoming(meetup.to, meetup.id).then(function() {
                    Users.addUpcoming(meetup.from, meetup.id).then(function() {
                      $state.go('tab.tab3-all', {
                        view: 'all'
                      });
                    });
                  });
                });
              })
            });
          }
        }
      };
    });
  }
});
