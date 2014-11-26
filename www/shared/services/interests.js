angular.module('shared').service('Interests', function($q, FIREBASE_ROOT, Auth, Users) {
  var interestsRef = new Firebase(FIREBASE_ROOT + '/interests');

  // TODO: Check here that interest doesn't exist first.
  // If it does exist, don't "push".
  // Instead, do this:
  // - set interests/II/users/UU to true
  // - Users.addInterest(interest)
  this.add = function(interest) {
    var defer = $q.defer();
    var users = {};

    users[Auth.username()] = true;
    
    interestsRef.push({
      name: interest,
      users: users
    }, function(error) {
      if (error) {
        defer.reject();
      } else {
        Users.addInterest(interest).then(defer.resolve);
      }
    });

    return defer.promise;
  };
});
