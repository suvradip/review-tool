var app = angular.module('chartsetup', []);

app.controller('chartsetupctrl', function($scope, $http){
	var getData,
		sendData,
		loadAllReviews,
		createScreenshot,
        chartref,
        getlinks;

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

    getlinks = function() {
        getData($scope.site_root+'api/chartsetup/getlinks', function(response){
            console.log(response);
            $scope.links = response.result.links;
        });    
    };

    $scope.register = function(obj){
        $scope.site_root = obj.site_root;
        getlinks();
    };

    //triiger on post button-click
	$scope.setchart = function(){
		var d,
			data,
			fname;
		d = new Date();
        fname = 'f.'+d.getTime()+'.js';

        //this data saved to db
        data = {
                name: $scope.link_name, 
                fname: fname,
                type: '',
                main: $scope.bodyfile
            };    
        console.log(data);
		sendData($scope.site_root+'api/chartsetup', data, function(response){
            console.log(response);
        });
	};

    $scope.test = function(e) {
        var target = e.target;
    };
});