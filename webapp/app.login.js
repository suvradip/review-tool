var app = angular.module('loginapp', []);

app.controller('loginctrl', function($scope, $http){

	$scope.register = function(obj){
		$scope.siteroot = obj.siteRoot;
	};
	var getData,
		sendData;

	getData = function(url, callback){
        $http({
            method: 'GET',
            dataType: 'json',
            url: url,
            headers: {
            	"Content-Type": "application/json"
            }
        }).success(callback);
    };

    sendData = function(url, data, callback){
        $http({
            method: 'POST',
            dataType: 'json',
            url: url,
            data : data,
            headers: {
            	"Content-Type": "application/json"
            }
        }).success(callback);
    };	

	$scope.checkCred = function() {
		var data = {};
		data.username = $scope.username;
		data.password = $scope.password;
		
		console.log(data);
	};

});