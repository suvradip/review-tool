var app = angular.module('chartsetup', []);

app.controller('chartsetupctrl', function($scope, $http){
	var getData,
		sendData,
		loadAllReviews,
		createScreenshot,
        chartref,
        getlinks;

    $scope.link_check = false;    
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
                description: $scope.link_description,
                type: $scope.link_type,
                fname: fname,
                filecontents: $scope.link_content,
                update: $scope.link_check
            };    

         console.log('setchart');
         console.log(data);
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
        $scope.linkid = linkid;
        $scope.link_check = false;
        getData($scope.site_root+'api/chartsetup/getlinks?linkid='+linkid, function(response){
            var data = response.result.links[0];
            $scope.link_name = data.name;
            $scope.link_description = data.description || '';
            $scope.link_type = data.type || '';
            getData($scope.site_root+'fc.charts.resource/'+data.fname, function(file_data){
                $scope.link_content = file_data;
            });
        });
    };

    $scope.updatedata = function(){
        var data;
        data = {
            name: $scope.link_name, 
            description: $scope.link_description,
            type: $scope.link_type,
            filecontents: $scope.link_content,
            linkid: $scope.linkid,
            update: $scope.link_check
        }; 

        console.log('update chart');
        console.log(data);
        sendData($scope.site_root+'api/chartsetup/updatelinks', data, function(response){
            console.log(response);
        });
    };

    $scope.reset = function() {
        $scope.link_name = "";
        $scope.link_description = "";
        $scope.link_type = "";
        $scope.link_content = "";
        console.log($scope.link_check);

    };

});