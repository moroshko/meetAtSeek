angular.module('shared').service('Users', function($q, FIREBASE_ROOT, Auth) {
  var usersRef = new Firebase(FIREBASE_ROOT + '/users');

  this.exists = function(username) {
    var defer = $q.defer();
    
    usersRef.child(username).once('value', function(snapshot) {
      defer.resolve(snapshot.val() !== null);
    });

    return defer.promise;
  };

  this.add = function(username) {
    var defer = $q.defer();
    var firstName = username[0].toUpperCase() + '.';
    var lastName = (username[1] || '').toUpperCase() + username.slice(2);

    usersRef.child(username).set({
      firstName: firstName,
      lastName: lastName
    }, function() {
      defer.resolve();
    });

    return defer.promise;
  };

  this.addInterest = function(interestId) {
    var defer = $q.defer();

    usersRef.child(Auth.username()).child('interests').child(interestId).set(true, function() {
      defer.resolve();
    });

    return defer.promise;
  };

  this.removeInterest = function(interestId) {
    var defer = $q.defer();
    
    usersRef.child(Auth.username()).child('interests').child(interestId).remove(function() {
      defer.resolve();
    });

    return defer.promise;
  };
});
