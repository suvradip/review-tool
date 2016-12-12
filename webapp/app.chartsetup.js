var app = angular.module('chartsetup', []);

app.controller('chartsetupctrl', function($scope, $http, $timeout){
	var getData,
		sendData,
		loadAllReviews,
		createScreenshot,
        chartref,
        getlinks,
        showoutput,
        selector,
        finalHTMLContent,
        showMsg;

    //for checkbox    
    $scope.link_check = false;
    //for li item active class
    $scope.selectedIndex = -1;

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

    selector = {
        container : document.getElementById("output")
    };

    finalHTMLContent = function(data) {
        var content = '<!DOCTYPE html><html><head>';
        content += '<script type="text/javascript" src="'+ $scope.site_root + 'bower_components/fusioncharts/fusioncharts.js"></script>';
        content += "</head><body>";
       // content += '<script type="text/javascript" src="http://static.fusioncharts.com/code/latest/fusioncharts.js"></script>';
        content += '<script type="text/javascript">'+ data +'</script>';
        content += '<div id="chart-container"></div>';
        content += "</body></html>";

        return content;
    };

    showoutput = function(fname){
        selector.container.setAttribute('data',"data:text/html;charset=utf-8,"+escape(finalHTMLContent(fname)));
    };

    showMsg = function(msg) {
        $scope.msg = msg;
        $timeout(function(){
         $scope.msg = "";   
        }, 2500);
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

		sendData($scope.site_root+'api/chartsetup', data, function(response){
            $scope.reset();
            $timeout(getlinks, 1100); 
            showMsg("New chart setup done.", "s");
        });
	};

    $scope.linkDetails = function(index, e) {
        var target,
            linkid;

        target = e.target;
        linkid = target.attributes["data-linkid"].value;

        $scope.selectedIndex = index;
        $scope.btn_action = true;
        $scope.linkid = linkid;
        $scope.link_check = false;
        getData($scope.site_root+'api/chartsetup/getlinks?linkid='+linkid, function(response){
            var data = response.result.links[0];
            $scope.link_name = data.name;
            $scope.link_description = data.description || '';
            $scope.link_type = data.type || '';
            getData($scope.site_root+'fc.charts.resource/'+data.fname, function(file_data){
                showoutput(file_data);
                $scope.link_content = file_data;//.replace(/\s\s\s?\s?/i, '\n');
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

        sendData($scope.site_root+'api/chartsetup/updatelinks', data, function(response){
            $timeout(function(){
                showMsg("Content updated.", "s");
                showoutput(data.filecontents);
            }, 1000);
        });

    };

    $scope.reset = function() {
        $scope.link_name = "";
        $scope.link_description = "";
        $scope.link_type = "";
        $scope.link_content = "";
    };

});