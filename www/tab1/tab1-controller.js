angular.module('tab1', []).controller('Tab1Ctrl', function(
  $q, $scope, FIREBASE_ROOT, PleaseWait, Auth, Users, Interests) {

  var usersRef = new Firebase(FIREBASE_ROOT + '/users');

  $scope.ready = false;
  $scope.data = {
    filter: ''
  };

  PleaseWait.show();

  usersRef.child(Auth.username()).child('interests').on('value', function(snapshot) {
    var interestsObj = snapshot.val();
    var interestIds = (interestsObj === null ? [] : Object.keys(interestsObj));
    var promises = interestIds.map(function(interestId) {
      return Interests.getById(interestId);
    });

    $q.all(promises).then(function(interests) {
      PleaseWait.hide();
      $scope.interests = interests;
      $scope.ready = true;
    });
  });

  $scope.addInterest = function() {
    Interests.addUserTo($scope.data.filter).then(function(interestId) {
      Users.addInterest(interestId).then(function() {
        $scope.data.filter = '';
      });
    });
  };

  $scope.removeInterest = function(interestId) {
    Users.removeInterest(interestId).then(function() {
      Interests.removeUserFrom(interestId);
    });
  };
});
