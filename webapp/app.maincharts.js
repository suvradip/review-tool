var app = angular.module('mainchart', []);

app.controller('mainchartctrl', function($scope, $http, $timeout){
	var getData,
		sendData,
		loadAllReviews,
		createScreenshot;

    //angular variable delarations & definations    
	$scope.posts = [];
    $scope.colorBtn = false; 
    $scope.color = "#000000";
    $scope.selectEle = "rect";
    $scope.textBox = false;

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

  	createScreenshot = function(name){
  		var svg,
  			svgData,
  			canvas,
  			ctx,
  			svgSize,
  			img,
            fc;

        fc = FusionCharts('chartobject-1');
        
        if(typeof fc.jsVars.instanceAPI !== "undefined"){
            svgData = fc.jsVars.instanceAPI.components.paper.toSVG();
        } else {
            svgData = fc.jsVars.fcObj.apiInstance._paper.toSVG();
        }

        svg = document.querySelector( "svg" );
		canvas = document.createElement( "canvas" );
		ctx = canvas.getContext( "2d" );
		svgSize = svg.getBoundingClientRect();
        
        canvas.width = svgSize.width;
        canvas.height = svgSize.height;

		img = document.createElement( "img" );     
		img.setAttribute( "src", "data:image/svg+xml;base64," + btoa( svgData ) );
		img.onload = function() {
		    ctx.drawImage( img, 0, 0 );
		    sendData($scope.site_root+'api/create-screenshot', {data: canvas.toDataURL("image/png"), name: name}, function(){});
		};
  	};

    $scope.loadAllReviews = function(obj){
        var chartref;
        //console.log(obj);
        $scope.site_root = obj.site_root;
        $scope.linkid = obj.linkid;
        $timeout(function() {
            for(var ii in FusionCharts.items)
            chartref = FusionCharts.items[ii];
            $scope.data = chartref.getJSONData();
        }, 1500);

    	getData($scope.site_root+'api/review/'+$scope.linkid, function(response){
           
            if(response.success && typeof response.result !== 'undefined'){
        		$scope.posts = response.result.map(function(ele){
        			var d = new Date(ele.time);
        			return {
        				name: ele.name,
        				avatar: ele.avatar,
        				review: ele.review,
        				time: d.toLocaleTimeString(),
        				date: d.toLocaleDateString(),
        				ssid: ele.screenshots
        			};
        		});
            }    
    	});
    };

    //triiger on post button-click
	$scope.postReview = function(){
		var d,
			data,
			ssid;
		d = new Date();
        ssid = 'ss'+d.getTime()+'.png';

        for(var ii in FusionCharts.items)
            chartref = FusionCharts.items[ii];
            
        //this data saved to db
        data = {
                review: $scope.review,
                linkid: $scope.linkid,
                ssid: ssid,
                chartinfo : {
                    type: chartref.chartType(),
                    width: chartref.width,
                    height: chartref.height,
                    datasource : chartref.getJSONData(),
                    build: 'xx-xx'
                }
            };
        
        if(chartref.chartType() === "timeseries"){
            var c,
                r1,
                r2,
                temp = {};            

            temp.reactiveModel = {};    
            temp.globalReactiveModel = {};    
            temp.datasource = {};

            c  = chartref.apiInstance.getComponentStore().getCanvasByIndex(0).composition;
            r1 = c.impl.reactiveModel;
            r2 = c.impl.globalReactiveModel;
           
            for(var a in r1.model) {
                temp.reactiveModel[a] = r1.model[a];
            }

             for(var b in r2.model) {
                temp.globalReactiveModel[a] = r1.model[a];
            }

            //console.log(JSON.stringify(temp, null, 4));
            temp.datasource = data.chartinfo.datasource;
            data.chartinfo.datasource = temp;            
        }

        //create screenshots
		createScreenshot(ssid);
		//store data in database
		sendData($scope.site_root+'api/review', data, function(response){
            //to show new posts 
            $scope.posts.push(response.obj);
            //cleanup textare
            $scope.review = "";
        });
	};

    $scope.updateData = function(){
        var chartref;
        for(var ii in FusionCharts.items)
            chartref = FusionCharts.items[ii];
        
        chartref.setJSONData($scope.newdata);
        //$scope.newdata = chartref.getJSONData();
    };

    $scope.startMarking = function(e){
        var target = e.target;
        if(target.value === 'stop'){
           window.marking.deletMarkers(true);
            $scope.colorBtn = false; 
            $scope.textBox = false;
            
            if(window.marking.markersLength() === 0){
                $scope.resetBtn = false;
            }

            e.target.setAttribute("value", "Start marking");

       } else {
            window.marking.createMarker();
            $scope.colorBtn = true;
            $scope.resetBtn = true;
            e.target.setAttribute("value", "stop");
        }
    };

    $scope.resetMarking = function(){
        window.marking.deletMarkers();
        if(!$scope.colorBtn)
            $scope.resetBtn = false;
    };

    $scope.setConf = function(){
        if($scope.selectEle === "text"){
            $scope.textBox = true;
        } else {
            $scope.textBox = false;
        }
        window.marking.setConfig({ color: $scope.color, ele: $scope.selectEle, text: $scope.text });
    };
});