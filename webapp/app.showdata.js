var app = angular.module('showdata', []);

app.controller('dataSection', function($scope, $http){
	var getData,
		sendData;

	//scope variable declare & defined	
	$scope.site_root = '';
	$scope.reviews = [];

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

    $scope.showAllReviews = function(site_root){
        $scope.site_root = site_root;
    	getData($scope.site_root+'api/showdata', function(response){
    		$scope.reviews = response.map(function(ele){
    			var d = new Date(ele.time);
    			return {
    				name: ele.username,
    				review: ele.review,
    				width: ele.chartinfo.width,
                    height: ele.chartinfo.height,
                    build: ele.chartinfo.buildno,
    				data: JSON.stringify(ele.chartjson, null, 4),
    				ssid: ele.screenshots,
    				date: d.toLocaleDateString(),
    				time: d.toLocaleTimeString()
    			};
    		});
    	});
    };
});