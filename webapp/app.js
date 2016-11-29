var app = angular.module('reviewapp', ['ng-fusioncharts']);

app.controller('chartRender', function($scope){
	$scope.data =  {
        chart: {
            caption: "Harry's SuperMart",
            subCaption: "Top 5 stores in last month by revenue",
            numberPrefix: "$",
            theme: "zune"
        },
        data:[
        	{label: "Bakersfield Central", value: "880000"}, 
        	{label: "Garden Groove harbour", value: "730000"}, 
        	{label: "Los Angeles Topanga", value: "590000"}, 
        	{label: "Compton-Rancho Dom", value: "520000"}, 
        	{label: "Daly City Serramonte", value: "330000"}
        ] 
    };
});

app.controller('reviewSection', function($scope, $http){
	var getData,
		sendData,
		loadAllReviews;

	$scope.posts = [];

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
    				review: ele.review,
    				date: ele.time 
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