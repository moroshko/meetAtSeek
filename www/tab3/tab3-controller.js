angular.module('tab3', []).controller('Tab3Ctrl', function(
  $scope, $q, $state, $stateParams, dateFilter, PleaseWait, Auth, Meetups, Users, FIREBASE_ROOT) {

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
        defer.resolve(meetups);
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

  $scope.availability = {};

  if ($scope.view === 'new') {
    setDayAndTimes();

    $scope.invite = function() {
      var requestedTimes = [];

      for (var pipeSeparatedStr in $scope.availability) {
        if ($scope.availability[pipeSeparatedStr] === true) {
          var parts = pipeSeparatedStr.split('|');

          requestedTimes.push({
            day: parts[0],
            date: parts[1],
            time: parts[2]
          });
        }
      }

      Meetups.add($stateParams.username, requestedTimes).then(function(meetupId) {
        Users.addRequest($stateParams.username, meetupId).then(function() {
          Users.addSent(Auth.username(), meetupId).then(function() {
            $state.go('tab.tab3-all', {
              view: 'all'
            });
          });
        });
      });
    };
  };

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

    $q.all(allPromises).then(function () {
      $scope.ready = true;

      $scope.upcoming.sort(function(up1, up2) {
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
      });

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

      for (var i = 0, len = meetup.requestedTimes.length; i < len; i++) {
        if (meetup.requestedTimes[i].date < minDate) {
          minDate = meetup.requestedTimes[i].date;
        }
      }

      setDayAndTimes(minDate);

      for (var i = 0, len = meetup.requestedTimes.length; i < len; i++) {
        var requestedTime = meetup.requestedTimes[i];

        $scope.availability[requestedTime.day + '|' + requestedTime.date + '|' + requestedTime.time] = false;
      }

      $scope.timeSlotSelected = false;

      $scope.onTimeSlotClick = function(pipeSeparatedStr) {
        for (var key in $scope.availability) {
          $scope.availability[key] = false;
        }

        $scope.availability[pipeSeparatedStr] = true;
        $scope.timeSlotSelected = true;
      };

      $scope.letsMeet = function() {
        for (var key in $scope.availability) {
          if ($scope.availability[key] === true) {
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
