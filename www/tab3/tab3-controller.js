angular.module('tab3', []).controller('Tab3Ctrl', function(
  $scope, $q, $state, $stateParams, dateFilter, PleaseWait, Auth, Meetups, Users, FIREBASE_ROOT) {

  if ($stateParams.view === 'new') {
    $scope.view = 'new';
    $scope.title = 'Invite ' + Users.getName($stateParams.username);
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

    usersRef.child(Auth.username()).child(type).once('value', function (snapshot) {
      var meetupsObj = snapshot.val();
      var meetupIds = (meetupsObj === null ? [] : Object.keys(meetupsObj));
      var promises = meetupIds.map(function (meetupId) {
        return Meetups.getById(meetupId);
      });

      $q.all(promises).then(function (meetups) {
        defer.resolve(meetups);
      });
    });

    return defer.promise;
  }

  if ($scope.view === 'new') {
    var now = Date.now();
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

    $scope.availability = {};

    $scope.invite = function() {
      var requestedTimes = Object.keys($scope.availability).map(function(pipeSeparatedStr) {
        var parts = pipeSeparatedStr.split('|');

        return {
          day: parts[0],
          time: parts[1],
          date: parts[2]
        };
      });

      Meetups.add($stateParams.username, requestedTimes).then(function(meetupId) {
        Users.addRequest($stateParams.username, meetupId).then(function() {
          Users.addSent(Auth.username(), meetupId).then(function() {
            $state.go('tab.tab3', {
              view: 'all'
            });
          });
        });
      });
    };
  }

  if ($scope.view === 'all') {
    var allPromises = [];
    var requestsPromises = getMeetupsForUser('requests');
    var sentPromises = getMeetupsForUser('sent');
    var upcomingPromises = getMeetupsForUser('upcoming');

    allPromises = allPromises.concat(requestsPromises, sentPromises, upcomingPromises);
  
    PleaseWait.show();

    $q.all(requestsPromises).then(function (meetups) {
      $scope.requests = meetups;
    });

    $q.all(sentPromises).then(function (meetups) {
      $scope.sent = meetups;
    });

    $q.all(upcomingPromises).then(function (meetups) {
      $scope.upcoming = meetups;
    });

    $q.all(allPromises).then(function () {
      $scope.ready = true;
      PleaseWait.hide();
    });
  }
});
