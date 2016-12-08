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
                description: $scope.link_description,
                type: $scope.link_type,
                fname: fname,
                main: $scope.link_content
            };    

		sendData($scope.site_root+'api/chartsetup', data, function(response){
            console.log(response);
        });
	};

    $scope.linkDetails = function(e) {
        var target,
            linkid;

        target = e.target;
        linkid = target.attributes["data-linkid"].value;

        $scope.btn_action = true;

        getData($scope.site_root+'api/chartsetup/getlinks?_id='+linkid, function(response){
            var data = response.result.links[0];
            $scope.link_name = data.name;
            $scope.link_description = data.description || '';
            $scope.link_type = data.type || '';
            getData($scope.site_root+'fc.charts.resource/'+data.fname, function(file_data){
                $scope.link_content = file_data;
            });
        });
    };

    $scope.reset = function() {
        $scope.link_name = "";
        $scope.link_description = "";
        $scope.link_type = "";
        $scope.link_content = "";
    };
});