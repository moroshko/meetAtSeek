angular.module('tab1', []).controller('Tab1Ctrl', function(
  $q, $scope, $state, FIREBASE_ROOT, PleaseWait, Auth, Users, Interests) {

  var usersRef = new Firebase(FIREBASE_ROOT + '/users');
  var allInterests;

  $scope.ready = false;
  $scope.data = {
    filter: ''
  };

  function compareMatchingInterests(int1, int2) {
    var users1 = Object.keys(int1.users).length;
    var users2 = Object.keys(int2.users).length;

    if (users1 > users2) {
      return -1;
    }

    if (users1 < users2) {
      return 1;
    }

    return 0;
  }

  $scope.usersCount = function(matchingInterest) {
    return Object.keys(matchingInterest.users).length;
  };

  $scope.notInMyInterests = function(interestObjOrName) {
    var checkName = (typeof interestObjOrName === 'string');

    return $scope.interests.filter(function(interest) {
      return checkName ? interest.name === interestObjOrName
                       : interest.id === interestObjOrName.id;
    }).length === 0;
  };

  $scope.$watch('data.filter', function(newValue, oldValue) {
    if (newValue === oldValue) {
      return;
    }

    $scope.matchingInterests = allInterests.filter($scope.notInMyInterests);

    if (newValue.length > 0) {
      var regex = new RegExp($scope.data.filter.split('').join('[\\s\\S]*'), 'i');

      $scope.matchingInterests = $scope.matchingInterests.filter(function(interest) {
        return regex.test(interest.name);
      }).sort(compareMatchingInterests);
    }
  });

  PleaseWait.show();

  Interests.all().then(function(interests) {
    allInterests = interests;

    usersRef.child(Auth.username()).child('interests').on('value', function(snapshot) {
      var interestsObj = snapshot.val();
      var interestIds = (interestsObj === null ? [] : Object.keys(interestsObj));
      var promises = interestIds.map(function(interestId) {
        return Interests.getById(interestId);
      });

      $q.all(promises).then(function(interests) {
        PleaseWait.hide();
        $scope.interests = interests;
        $scope.matchingInterests = allInterests.filter($scope.notInMyInterests).sort(compareMatchingInterests);
        $scope.ready = true;      
      });
    });
  });

  $scope.addInterest = function(interest) {
    Interests.addUserTo(interest || $scope.data.filter).then(function(interestId) {
      Users.addInterest(interestId).then(function() {
        $scope.data.filter = '';
        $scope.matchingInterests = [];
      });
    });
  };

  $scope.removeInterest = function(interestId) {
    Users.removeInterest(interestId).then(function() {
      Interests.removeUserFrom(interestId);
    });
  };

  var lastClick = null;

  $scope.onInterestsPoolClick = function() {
    if (lastClick !== null && Date.now() - lastClick < 1000) {
      $state.go('login');
      Auth.reset();
    } else {
      lastClick = Date.now();
    }
  };

  $scope.findSeekers = function() {
    $state.go('tab.tab2');
  };
});
