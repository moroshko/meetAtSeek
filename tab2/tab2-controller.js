angular.module('tab2', []).controller('Tab2Ctrl', function(
  $q, $scope, PleaseWait, Auth, Users, Interests) {

  var myUsername = Auth.username();

  $scope.getName = function(username) {
    if (angular.isDefined(Users.all[username])) {
      var firstName = Users.all[username].first;
      var lastName = Users.all[username].last;
    } else {
      var firstName = username[0].toUpperCase() + '.';
      var lastName = (username[1] || '').toUpperCase() + username.slice(2);
    }

    return firstName + ' ' + lastName;
  };

  function compareByInterestsCount(user1, user2) {
    if (user1.interests.length > user2.interests.length) {
      return -1;
    }

    if (user1.interests.length < user2.interests.length) {
      return 1;
    }

    return 0;
  }

  PleaseWait.show();

  Users.getInterests().then(function(interestIds) {
    var promises = Object.keys(interestIds).map(function(interestId) {
      return Interests.getById(interestId);
    });

    $q.all(promises).then(function(interests) {
      var matchingUsers = {};

      for (var i = 0, len = interests.length; i < len; i++) {
        var users = Object.keys(interests[i].users);

        for (var k = 0, len2 = users.length; k < len2; k++) {
          var username = users[k];

          if (username === myUsername) { // Ignore myself
            continue;
          }

          if (angular.isUndefined(matchingUsers[username])) {
            matchingUsers[username] = [];
          }

          matchingUsers[username].push(interests[i].name)
        }
      }

      var matchingUsersArray = [];

      for (var username in matchingUsers) {
        matchingUsersArray.push({
          username: username,
          interests: angular.copy(matchingUsers[username])
        });
      }

      matchingUsersArray.sort(compareByInterestsCount);

      $scope.matchingUsersArray = matchingUsersArray;
      
      PleaseWait.hide();
    });
  });
});
