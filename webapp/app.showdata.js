var app = angular.module('showdata', []);

app.controller('dataSection', function($scope, $http){
	var getData,
		sendData,
        showAllReviews,
        filterInit;

	//scope variable declare & defined	
	$scope.site_root = '';
	$scope.reviews = [];
    $scope.reviews.isReady = true;

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

    filterInit = function() {
        getData($scope.site_root+'assets/charts.json', function(response){
            //console.log(response);
            $scope.chartTypes = response;
        });
    };

    $scope.register = function(site_root){
        $scope.site_root = site_root;
        showAllReviews();
        filterInit();
    };

    showAllReviews = function(site_root){
    	getData($scope.site_root+'api/showdata', function(response){
            $scope.reviews.isReady = false;
    		$scope.reviews = response.map(function(ele){
    			var d = new Date(ele.time);
    			return {
                    id: ele.reviewid,
    				name: ele.name,
    				review: ele.review,
    				width: ele.chartinfo.width,
                    height: ele.chartinfo.height,
                    build: ele.chartinfo.buildno,
    				data: JSON.stringify(ele.chartinfo.datasource, null, 4),
    				ssid: ele.screenshots,
                    active: ele.isActive,
    				date: d.toLocaleDateString(),
    				time: d.toLocaleTimeString()
    			};
    		});
    	});
    };

    $scope.updatePost = function(e){
        var target = e.currentTarget,
            reviewid = target.attributes['data-reviewid'].value;
        console.log(reviewid);
        sendData($scope.site_root+'api/review/update/'+ reviewid, {}, function(){
            for(var ii in $scope.reviews) {
                if($scope.reviews[ii].id === reviewid) {
                    $scope.reviews[ii].active = true;
                }
            }
        });
    };

});