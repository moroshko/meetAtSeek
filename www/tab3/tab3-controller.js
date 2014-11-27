angular.module('tab3', []).controller('Tab3Ctrl', function($scope, $q, Auth, Meetups, FIREBASE_ROOT) {

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
        defer.resolve(meetups);
      });
    });

    return defer.promise;
  }

  var allPromises = [];
  var requestsPromises = getMeetupsForUser('requests');
  var sentPromises = getMeetupsForUser('sent');
  var upcomingPromises = getMeetupsForUser('upcoming');
  allPromises = allPromises.concat(requestsPromises, sentPromises, upcomingPromises);

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
  });
});
