var app = angular.module('reviewapp', []);

app.controller('reviewSection', function($scope, $http){
	var getData,
		sendData,
		loadAllReviews;

	$scope.posts = [{username: 'test user', avatar: '/images/avatar.png', review:'ok. cool!'}];

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

    loadAllReviews = function(){
    	getData('/api/review', function(response){
    		$scope.posts = response.map(function(ele){
    			return {
    				name: ele.name,
    				avatar: ele.avatar,
    				review: ele.review
    			};
    		});
    	});
    };

    loadAllReviews();
    //triiger on post button-click
	$scope.postReview = function(){
		var data = {
				name: 'anonymous', 
				review: $scope.review,
				avatar: '/images/avatar.png'
			};

		//to show new posts	
		$scope.posts.push(data);
		//cleanup textare
		$scope.review = "";

		sendData('/api/review', data, function(){});
	};
});