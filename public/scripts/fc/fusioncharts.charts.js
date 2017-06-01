/*
 FusionCharts JavaScript Library
 Copyright FusionCharts Technologies LLP
 License Information at <http://www.fusioncharts.com/license>
*/

(function (env, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = env.document ?
            factory(env) : function(win) {
                if (!win.document) {
                    throw new Error("Window with document not present");
                }
                return factory(win, true);
            };
    } else {
        env.FusionCharts = factory(env, true);
    }
}(typeof window !== 'undefined' ? window : this, function (_window, windowExists) {


/**!
 * @license FusionCharts JavaScript Library
 * Copyright FusionCharts Technologies LLP
 * License Information at <http://www.fusioncharts.com/license>
 */
/**
 * @private
 * @module fusioncharts.renderer.javascript.charts.common
 */
FusionCharts.register ('module', ['private', 'modules.renderer.js-charts', function () {
        var global = this,
            lib = global.hcLib,
            hasTouch = lib.hasTouch,
            win = global.window,
            doc = win.document,
            R = lib.Raphael,
            getPosition = lib.getPosition,
            //strings
            BLANKSTRING = lib.BLANKSTRING,
            preDefStr = lib.preDefStr,
            HUNDREDSTRING = preDefStr.HUNDREDSTRING,
            NINETYSTRING = preDefStr.NINETYSTRING,
            //add the tools thats are requared
            pluck = lib.pluck,
            //getLinkAction = lib.getLinkAction,
            pluckNumber = lib.pluckNumber,
            getFirstValue = lib.getFirstValue,
            // parseUnsafeString = lib.parseUnsafeString,
            // FC_CONFIG_STRING = lib.FC_CONFIG_STRING,
            extend2 = lib.extend2, // old: jarendererExtend / margecolone
            toRaphaelColor = lib.toRaphaelColor,
            hasSVG = lib.hasSVG,
            hashify = lib.hashify,
            supportsTouch = 'createTouch' in doc,
            // The devices which both touch and pointer.
            supportsOnlyTouch = (supportsTouch &&
                ! (win.navigator.maxTouchPoints ||
                win.navigator.msMaxTouchPoints)),
            // isIE = lib.isIE,
            ROLLOVER = 'DataPlotRollOver',
            ROLLOUT = 'DataPlotRollOut',
            EVENTARGS = 'eventArgs',
            each = lib.each,
            // DASH_DEF = 'none',
            COMMA = ',',
            TRANSFORMSTR = 't',
            // TOUCH_THRESHOLD_PIXELS = lib.TOUCH_THRESHOLD_PIXELS,
            // CLICK_THRESHOLD_PIXELS = lib.CLICK_THRESHOLD_PIXELS,
            plotEventHandler = lib.plotEventHandler,
            componentDispose = lib.componentDispose,
            // hasTouch = lib.hasTouch,
            // // hot/tracker threshold in pixels
            // HTP = hasTouch ? TOUCH_THRESHOLD_PIXELS :
            //     CLICK_THRESHOLD_PIXELS,
            /*
             * Function to get the exact visual position (top, left) of a element
             */
            getContainerPosition = function (el, noscroll) {
                var p = {
                    left: 0,
                    top: 0
                },
                clientRect;
                // for newer browsers
                if (el.getBoundingClientRect) {
                    clientRect = el.getBoundingClientRect ();
                    p.top = clientRect.top + (win.pageYOffset || doc.scrollTop || 0) - (doc.clientTop || 0);
                    p.left = clientRect.left + (win.pageXOffset || doc.scrollLeft || 0) - (doc.clientLeft || 0);

                }
                // for very older browsers
                else {
                    // iterate till the root element of the DOM to get the exact position of the element
                    while (el) {
                        p.left += (el.offsetLeft || 0);
                        p.top += (el.offsetTop || 0);
                        if (el !== doc.body && el !== doc.documentElement && !noscroll) {
                            p.left -= (el.scrollLeft || 0);
                            p.top -= (el.scrollTop || 0);
                        }
                        el = el.offsetParent;
                    }
                }
                return p;
            },
            defined = function (obj) {
                return obj !== UNDEFINED && obj !== null;
            },
            pInt = function (s, mag) {
                return parseInt (s, mag || 10);
            },
            isObject = function (obj) {
                return typeof obj === 'object';
            },
            isString = function (s) {
                return typeof s === 'string';
            },
            docMode8 = win.document.documentMode === 8,
            UNDEFINED,
            // The default value for stroke-dash attribute.
            // TRACKER_FILL = 'rgba (192,192,192,' + (isIE ? 0.002 : 0.000001) + ')', // invisible but clickable
            HIDDEN = 'hidden',
            VISIBLE = docMode8 ? 'visible' : '',
            M = 'M',
            L = 'L',
            V = 'v',
            A = 'A',
            Z = 'Z',
            math = Math,
            mathSin = math.sin,
            mathCos = math.cos,
            mathATan2 = math.atan2,
            mathRound = math.round,
            mathMin = math.min,
            mathMax = math.max,
            mathAbs = math.abs,
            mathPI = math.PI,
            mathCeil = math.ceil,
            mathFloor = math.floor,
            deg2rad = mathPI / 180,
            rad2deg = 180 / mathPI,
            pi = Math.PI,
            piBy2 = pi / 2,
            pi2 = 2 * pi,
            pi3By2 = pi + piBy2,
            getFirstColor = lib.getFirstColor,
            // setLineHeight = lib.setLineHeight,
            // pluckFontSize = lib.pluckFontSize, // To get the valid font size (filters negative values)
            getFirstAlpha = lib.getFirstAlpha,
            getDarkColor = lib.graphics.getDarkColor,
            getLightColor = lib.graphics.getLightColor,
            convertColor = lib.graphics.convertColor,
            // COLOR_TRANSPARENT = lib.COLOR_TRANSPARENT,
            POSITION_BOTTOM = lib.POSITION_BOTTOM,
            POSITION_RIGHT = lib.POSITION_RIGHT,
            chartAPI = lib.chartAPI,
            COMMASTRING = lib.COMMASTRING,
            ZEROSTRING = lib.ZEROSTRING,
            ONESTRING = lib.ONESTRING,
            creditLabel = false && !/fusioncharts\.com$/i.test (win.location.hostname),
            pie3DCacheColorStore = {
                lighting3D: {

                },
                lighting2D: {

                }
            };

        /// New Architecture /////

        chartAPI ('column2d', {
            standaloneInit: true,
            friendlyName: 'Column Chart',
            creditLabel: creditLabel,
            defaultDatasetType : 'column',
            applicableDSList: { 'column': true },
            singleseries: true
        }, chartAPI.sscartesian);

        chartAPI ('column3d', {
            friendlyName: '3D Column Chart',
            defaultDatasetType: 'column3d',
            applicableDSList: { 'column3d': true },
            defaultPlotShadow: 1,
            creditLabel: creditLabel,
            is3D: true,
            standaloneInit: true,
            hasLegend: false,
            singleseries: true,
            fireGroupEvent: true,
            defaultZeroPlaneHighlighted: false
        }, chartAPI.sscartesian3d, {
            showplotborder: 0
        });

        chartAPI ('bar2d', {
            friendlyName: 'Bar Chart',
            isBar: true,
            standaloneInit: true,
            defaultDatasetType: 'bar2d',
            creditLabel: creditLabel,
            applicableDSList: { 'bar2d': true },
            singleseries: true,
            spaceManager: chartAPI.barbase
        }, chartAPI.ssbarcartesian);

        chartAPI ('bar3d', {
            friendlyName: '3D Bar Chart',
            defaultDatasetType: 'bar3d',
            applicableDSList: { 'bar3d': true },
            defaultPlotShadow: 1,
            fireGroupEvent: true,
            standaloneInit: true,
            creditLabel: creditLabel,
            is3D: true,
            isBar: true,
            singleseries: true,
            defaultZeroPlaneHighlighted: false
        }, chartAPI.ssbarcartesian3d, {
            showplotborder: 0
        });

        chartAPI ('area2d', {
            friendlyName: 'Area Chart',
            standaloneInit: true,
            creditLabel: creditLabel,
            defaultDatasetType: 'area',
            singleseries: true,
            defaultPlotShadow: 0
        }, chartAPI.sscartesian, {}, chartAPI.areabase);

        chartAPI ('line', {
            friendlyName: 'Line Chart',
            standaloneInit: true,
            creditLabel: creditLabel,
            defaultPlotShadow: 1,
            singleseries: true,
            axisPaddingLeft: 0,
            axisPaddingRight: 0,
            defaultDatasetType: 'line'
        }, chartAPI.sscartesian, {
            zeroplanethickness: 1,
            zeroplanealpha: 40,
            showzeroplaneontop: 0
        }, chartAPI.areabase);

        chartAPI ('pareto2d', {
            defaultDatasetType: 'column2d',
            singleseries : true,
            creditLabel: creditLabel,
            _createDatasets: function () {
                var iapi = this,
                    components = iapi.components,
                    dataObj = iapi.jsonData,
                    is3d = iapi.is3D,
                    numberFormatter = components.numberFormatter,
                    dataset = dataObj.data || (dataObj.dataset && dataObj.dataset[0] && dataObj.dataset[0].data),
                    length = dataset && dataset.length,
                    chartAttr = dataObj.chart,
                    yAxis,
                    i,
                    datasetStore,
                    datasetObj,
                    defaultDatasetType = iapi.defaultDatasetType,
                    DsGroupClass,
                    Pareto = FusionCharts.get('component', ['dataset', 'Pareto']),
                    dsType,
                    DsClass,
                    GroupManager,
                    datasetJSON,
                    pareto = new Pareto (),
                    showCumulativeLine = pluckNumber (chartAttr.showcumulativeline, 1),
                    groupManagerName,
                    dataOnlyArr = [],
                    newDataLen,
                    oldDataLen,
                    datasetComponent,
                    TRUE_STRING = 'true',
                    ONE_STRING = '1',
                    setObj,
                    value;

                if (!dataset) {
                    iapi.setChartMessage();
                    return;
                }

                for (i = 0; i< length; i++) {
                    setObj = dataset[i];
                    value = numberFormatter.getCleanValue (setObj.value);
                    if (value !== null && !(setObj.vline === TRUE_STRING || setObj.vline === true ||
                        setObj.vline === 1 || setObj.vline === ONE_STRING)) {
                        dataOnlyArr.push (setObj);
                    }
                }
                iapi.config.categories = dataOnlyArr;

                datasetStore = components.dataset  || (components.dataset = []);

                datasetJSON = dataOnlyArr;
                dsType = pluck (defaultDatasetType);
                dsType = dsType && dsType.toLowerCase ();
                DsGroupClass = FusionCharts.register('component', ['datasetGroup', 'column']);
                GroupManager = components[groupManagerName] = new DsGroupClass ();
                GroupManager.chart = iapi;
                GroupManager.init ();
                /// get the DsClass
                if (is3d) {
                    DsClass = FusionCharts.get('component', ['dataset', 'Column3d']);
                }
                else {
                    DsClass = FusionCharts.get('component', ['dataset', 'Column']);
                }
                if (DsClass) {
                    datasetComponent = datasetStore[0];
                    if (!datasetComponent) {
                        // create the dataset Object
                        datasetObj = new DsClass ();
                        datasetStore.push (datasetObj);
                        datasetObj.chart = iapi;
                        datasetObj.index = i;
                        // add to group manager
                        GroupManager && GroupManager.addDataSet (datasetObj, 0, 0);
                        pareto.init (datasetObj, datasetJSON, defaultDatasetType);
                    }
                    else {
                        newDataLen = datasetJSON.length;
                        oldDataLen = datasetComponent.components.data.length;
                        if (newDataLen < oldDataLen) {
                            datasetComponent.removeData(newDataLen, oldDataLen - newDataLen);
                        }
                        datasetComponent.JSONData = {
                            data: datasetJSON
                        };
                        pareto.configure.call(datasetComponent);
                    }

                }
                yAxis = components.yAxis[1];
                if (showCumulativeLine) {
                    yAxis && yAxis.setAxisConfig({
                        drawLabels: true,
                        drawPlotLines: true,
                        drawAxisName: true,
                        drawAxisLine: true,
                        drawPlotBands: true,
                        drawTrendLines: true,
                        drawTrendLabels: true
                    });
                    yAxis.show();
                    DsClass = FusionCharts.get('component', ['dataset', 'line']);

                    datasetComponent = datasetStore[1];
                    if (!datasetComponent) {
                        datasetObj = new DsClass ();
                        datasetStore.push (datasetObj);
                        datasetObj.chart = iapi;
                        datasetObj.index = i;
                        pareto.init (datasetObj, datasetJSON, 'line');
                    }
                    else {
                        newDataLen = datasetJSON.length;
                        oldDataLen = datasetComponent.components.data.length;
                        if (newDataLen < oldDataLen) {
                            datasetComponent.removeData(newDataLen, oldDataLen - newDataLen);
                        }
                        datasetComponent.JSONData = {
                            data: datasetJSON
                        };
                        pareto.configure.call(datasetComponent);
                    }

                }
                else {
                    datasetComponent = datasetStore[1];
                    if (datasetComponent) {
                        componentDispose.call(datasetComponent);
                        datasetStore.pop();
                    }

                    if (yAxis) {
                        yAxis.setAxisConfig({
                            drawLabels: false,
                            drawPlotLines: false,
                            drawAxisName: false,
                            drawAxisLine: false,
                            drawPlotBands: false,
                            drawTrendLines: false,
                            drawTrendLabels: false
                        });
                        yAxis.hide();
                    }
                }

            },
            _setCategories: function () {

                var iapi = this,
                    components = iapi.components,
                    dataObj = iapi.jsonData,
                    dataset = dataObj.dataset,
                    numberFormatter = components.numberFormatter,
                    xAxis = components.xAxis,
                    categories = dataObj.data || (dataset && dataset[0].data) || [],
                    catArr = [],
                    catObj,
                    catLen = categories.length,
                    i,
                    vLine = {},
                    count = 0,
                    value;

                for (i = 0; i < catLen; i++) {
                    catObj = categories[i];
                    value = numberFormatter.getCleanValue (catObj.value, true);

                    if (catObj.vline === 'true' || catObj.vline === '1' || catObj.vline === 1 ||
                        catObj.vline === true) {
                        vLine[count] = catObj;
                    }
                    else {
                        if (value === null) {
                            continue;
                        }
                        else {
                            catObj.value = value;
                            catArr.push (catObj);
                        }
                    }
                    count++;
                }

                catArr.sort (function (a, b) {
                    return b.value - a.value;
                });

                for (i in vLine) {
                    catArr.splice(i, 0, vLine[i]);
                }
                xAxis[0].setCategory (catArr);
            },
            standaloneInit: true,
            hasLegend: false,
            isPercentage: true
        }, chartAPI.msdybasecartesian, {
            plotfillalpha: NINETYSTRING
        });

        chartAPI ('pareto3d', {
            standaloneInit: true,
            is3D: true,
            friendlyName: '3D Pareto Chart',
            creditLabel: creditLabel,
            fireGroupEvent: true,
            defaultPlotShadow: 1,
            singleseries : true,
            hasLegend: false,
            defaultDatasetType: 'column3d',
            _createDatasets: chartAPI.pareto2d,
            _setCategories: chartAPI.pareto2d,
            isPercentage: true
        }, chartAPI.msdybasecartesian3d, {
            plotfillalpha: NINETYSTRING,
            use3dlineshift: 1
        });

        chartAPI ('pie2d', {
            friendlyName: 'Pie Chart',
            standaloneInit: true,
            defaultSeriesType: 'pie',
            defaultPlotShadow: 1,
            reverseLegend: 1,
            alignCaptionWithCanvas: 0,
            sliceOnLegendClick: true,
            isSingleSeries: true,
            dontShowLegendByDefault: true,
            defaultDatasetType : 'Pie2D',
            applicableDSList: {
                'Pie2D': true
            },
            defaultZeroPlaneHighlighted: false,
            creditLabel: creditLabel,
            _plotDragMove: function (dx, dy, x, y, evt) {
                var o = this,
                    plotItem = o.data ('plotItem'),
                    chart = plotItem.chart,
                    seriesData = plotItem.seriesData,
                    datasets = chart.components.dataset,
                    datasetConf = datasets[0].config,
                    angle;

                if (isNaN(dx) || isNaN(dy) || (!datasetConf.enableRotation || seriesData.singletonCase) ||
                    seriesData.isRightClicked) {
                    return;
                }
                angle = getClickArcTangent.call (evt, x, y, seriesData.pieCenter,
                    seriesData.chartPosition, 1);
                if (!seriesData.isRotating) {
                    seriesData.dragStartAngle !== angle && (seriesData.isRotating = true);
                    /**
                     * This event is fired on drag rotation start of pie chart.
                     *
                     * @event FusionCharts#rotationStart
                     * @group chart:pie
                     *
                     * @param { number} startingAngle - Gives the value of the
                     *                 startingAngle of the chart, when the chart
                     *                 starts rotating
                     */
                    global.raiseEvent ('RotationStart', {
                            startingAngle: (seriesData._rotationalStartAngle = chart._startingAngle())
                        },
                        chart.chartInstance
                    );
                }

                datasetConf.startAngle += (angle - seriesData.dragStartAngle);
                seriesData.dragStartAngle = angle;
                seriesData.moveDuration = 0;

                // Check if already there is an initiation for visual updates.
                if (!datasetConf.updateInited) {
                    // set the flag to truth value.
                    datasetConf.updateInited = true;
                    setTimeout(chart._batchRotate || (chart._batchRotate = function () {
                        // visually update the chart
                        chart._rotate ();
                        // turn the flag to falsy after an interval
                        datasetConf.updateInited = false;
                    }), 50);
                }
            },
            _plotDragStart: function (x, y, evt) {
                var o = this,
                    plotItem = o.data ('plotItem'),
                    chart = plotItem.chart,
                    seriesData = plotItem.seriesData,
                    datasets = chart.components.dataset,
                    datasetConf = datasets[0].config,
                    startingAng = -datasetConf.startAngle,
                    angle;
                seriesData.isRightClicked = !hasTouch && (evt.button !== 0 && evt.button !== 1) ? true : false;

                if (!datasetConf.enableRotation || seriesData.isRightClicked) {
                    return;
                }
                seriesData.isRotating = false;
                //Calculate chart's current position. Chart cotainer may be moved mean while
                seriesData.chartPosition = getContainerPosition (chart.linkedItems.container);
                angle = getClickArcTangent.call (evt, x, y, seriesData.pieCenter,
                    seriesData.chartPosition, 1);
                seriesData.dragStartAngle = angle;
                seriesData.startingAngleOnDragStart = startingAng;
            },
            _plotDragEnd: function (e) {
                var o = this,
                    rotaionalEndAngle,
                    plotItem = o.data ('plotItem'),
                    chart = plotItem.chart,
                    chartConfig = chart.config,
                    seriesData = plotItem.seriesData;
                if (seriesData.isRightClicked) {
                    return;
                }

                chartConfig.clicked = true;
                if (!chart.disposed) {
                    /*extend2 (chart.logic.chartInstance.jsVars._reflowData,
                        reflowUpdate, true);*/
                    chart._rotate ();
                }

                !seriesData.isRotating && chart._plotGraphicClick.call (plotItem.graphic, e);

                delete chartConfig.clicked;
                if (seriesData.isRotating) {
                    /* The events mouseup, dragend and click are raised in order. In order
                     * to update the flag isRotating to false post click event, setTimeout
                     * called, to take immediate effect, is programmed to update the flag.
                     * Thus, the flag gets updated post the series of events, in effect.
                     * NB: Click event is subscribed conditionally.
                     */
                    setTimeout (function () {
                        seriesData.isRotating = false;
                    }, 0);
                    /**
                     * This event is fired on drag rotation end of pie chart.
                     *
                     * @event FusionCharts#rotationEnd
                     * @group chart:pie
                     *
                     * @param { number} changeInAngle - Gives the value by how much
                     *                 the chart was rotated
                     * @param { number} startingAngle - Gives the value of the
                     *                 startingAngle of the chart on rotation end.
                     */
                    global.raiseEvent ('RotationEnd', {
                        startingAngle: (rotaionalEndAngle = chart._startingAngle()),
                        changeInAngle: (rotaionalEndAngle - seriesData._rotationalStartAngle)
                    }, chart.chartInstance);
                }
                // !chart.isHovered && chart.onPlotHover (o, false);
            },
            _plotRollOver: function (e) {
                var ele = this,
                    plotItem = ele.plotItem || ele.data ('plotItem'),
                    chart = plotItem.chart,
                    conf = chart.components.dataset[0].config,
                    innerDiameter,
                    centerLabelConfig,
                    centerLabelText;
                if (!conf.isRotating) {
                    plotEventHandler.call (ele, chart, e, ROLLOVER);
                    chart.onPlotHover (ele, true);
                }
                conf.isHovered = true;
                if (innerDiameter = plotItem.innerDiameter) {
                    (centerLabelConfig = plotItem.centerLabelConfig) &&
                        (centerLabelText = centerLabelConfig.label) &&
                        chart.drawDoughnutCenterLabel (centerLabelText, plotItem.center[0],
                            plotItem.center[1], innerDiameter, innerDiameter, centerLabelConfig, false);
                }
            },
            onPlotHover: function (plot, hover) {
                var plotItem = plot.data ('plotItem'),
                    center = plotItem.center,
                    rolloverProps = plotItem.rolloverProperties || {},
                    color = hover ? rolloverProps.color : plotItem.color,
                    borderWidth = hover ? rolloverProps.borderWidth : plotItem.borderWidth,
                    borderColor = hover ? rolloverProps.borderColor : plotItem.borderColor;
                if (color) {
                    if (hover) {
                        color.cx = center[0];
                        color.cy = center[1];
                        color.r = plotItem.radius;
                    }
                    rolloverProps.enabled && plotItem.graphic.attr ( {
                        fill: toRaphaelColor(color),
                        'stroke-width': borderWidth,
                        'stroke': borderColor
                    });
                }
            },

            _plotRollOut: function (e) {
                var ele = this,
                    plotItem = ele.plotItem || ele.data ('plotItem'),
                    chart = plotItem.chart,
                    seriesData = chart.components.dataset[0],
                    conf = seriesData.config,
                    /** @todo: enable doughnut center label feature related to enableMultiSlicing */
                    enableMultiSlicing = true, //seriesData.enableMultiSlicing,
                    innerDiameter,
                    centerLabelConfig,
                    centerLabelText;
                if (!conf.isRotating) {
                    plotEventHandler.call (ele, chart, e, ROLLOUT);
                    chart.onPlotHover (ele, false);
                }
                conf.isHovered = false;
                if (innerDiameter = plotItem.innerDiameter) {
                    (centerLabelConfig = !enableMultiSlicing ?
                        conf.lastCenterLabelConfig : conf.centerLabelConfig) &&
                        ((centerLabelText = centerLabelConfig.label) || !centerLabelText) &&
                        chart.drawDoughnutCenterLabel (centerLabelText, plotItem.center[0],
                            plotItem.center[1], innerDiameter, innerDiameter, centerLabelConfig, false);
                }
            },
            _rotate: function () {
                var _ringPath,
                    _rotateAttrs,
                    chart = this,
                    dataOptions = chart.components.dataset[0],
                    conf = dataOptions.config,
                    plotData = dataOptions.components.data,
                    chartConfig = chart.config,
                    piePlotOptions = conf.piePlotOptions,
                    startAngle = (conf.startAngle || 0) % pi2,
                    slicedOffset = conf.slicingDistance,
                    seriesConf = dataOptions.config,
                    valueTotal = seriesConf.valueTotal,
                    factor = pi2 / valueTotal,
                    cx = chartConfig.canvasLeft + chartConfig.canvasWidth * 0.5,
                    cy = chartConfig.canvasTop + chartConfig.canvasHeight * 0.5,
                    r = conf.pieMinRadius,
                    r2 = (piePlotOptions.innerSize || 0) * 0.5,
                    val,
                    angle,
                    angle1,
                    angle2,
                    setConfig,
                    setGraphics,
                    i;

                angle1 = angle2 = startAngle;
                for (i = 0; i < plotData.length; i += 1) {
                    setConfig = plotData[i].config;
                    setGraphics = plotData[i].graphics;
                    val = setConfig.y;

                    if (val === null || val === undefined) {
                        continue;
                    }

                    // plotItem = plotItems[i];

                    angle2 = angle1;
                    // This conditional assignment of value 2 * pi is to by-pass a
                    // computational error inherent to any computer system, which
                    // happens here for certain values in singleton cases.
                    angle1 -= !seriesConf.singletonCase ? val * factor : pi2;
                    angle = (angle1 + angle2) * 0.5;

                    setConfig.angle = angle;
                    setConfig.transX = mathCos (angle) * slicedOffset;
                    setConfig.transY = mathSin (angle) * slicedOffset;

                    setConfig.slicedTranslation = TRANSFORMSTR +
                        (mathCos (angle) * slicedOffset) + COMMASTRING +
                        (mathSin (angle) * slicedOffset);

                    if (!(_rotateAttrs = setConfig._rotateAttrs)) {
                        _rotateAttrs = setConfig._rotateAttrs = {
                            ringpath: [],
                            transform: BLANKSTRING
                        };
                    }
                    _ringPath = _rotateAttrs.ringpath;
                    _ringPath[0] = cx;
                    _ringPath[1] = cy;
                    _ringPath[2] = r;
                    _ringPath[3] = r2;
                    _ringPath[4] = angle1;
                    _ringPath[5] = angle2;
                    _rotateAttrs.transform = setConfig.sliced ? setConfig.slicedTranslation : BLANKSTRING;
                    setGraphics.element.attr (_rotateAttrs);
                }
                chart.placeDataLabels (true, plotData, conf);
            },
            getPlotData: function (id, slicedState) {
                var chart = this,
                    dataset = chart.components.dataset[0],
                    data = dataset.components.data[id].config,
                    userData = dataset.config.userData || (dataset.config.userData = []),
                    plotData,
                    value,
                    prop;

                if (!userData[id]) {
                    plotData = userData[id] = {};
                    for (prop in data) {
                        typeof (value = data[prop]) !== 'object' &&
                            typeof (value) !== 'function' &&
                            prop.indexOf('_') !== 0 && (plotData[prop] = value);
                    }
                    plotData.value = plotData.y;
                    plotData.categoryLabel = plotData.label = plotData.seriesName;

                    delete plotData.y;
                    delete plotData.total;
                    delete plotData.doNotSlice;
                    delete plotData.name;
                    delete plotData.seriesName;
                    delete plotData.centerAngle;
                    delete plotData.showInLegend;
                    delete plotData.angle;
                    delete plotData.endAngle;
                    delete plotData.isVisible;
                    delete plotData.setColor;
                    delete plotData.slicedTranslation;
                    delete plotData.startAngle;
                    delete plotData.transX;
                    delete plotData.transY;
                    delete plotData.pValue;
                }
                else {
                    plotData = userData[id];
                }

                plotData.sliced = slicedState;
                return plotData;
            },
            _plotGraphicClick: function (evt) {
                var prevTextPos,
                    o = this.element || this,
                    plotItem = o.plotItem || o.data ('plotItem'),
                    elData = o.data('eventArgs') || {},
                    chart = plotItem.chart,
                    index = plotItem.index,
                    // elData = o.data ('eventArgs') || { },
                    chartSeriesData = chart.components.dataset[0],
                    seriesData = chartSeriesData.config,
                    enableMultiSlicing = seriesData.enableMultiSlicing,
                    set = chartSeriesData.components.data[index],
                    setGraphics = set.graphics,
                    setConfig = set.config,
                    doNotSlice = setConfig.doNotSlice,
                    atleastOneOtherSliced,
                    graphic,
                    dataLabel,
                    sliced,
                    slicedTranslation = setConfig.slicedTranslation,
                    transX,
                    transY,
                    connector,
                    connectorPath,
                    lastSliceTimeStamp,
                    minTimeForNextSlice = 400,
                    animationObj = chart.get('config', 'animationObj'),
                    animationDuration = animationObj.duration || 200,
                    mainElm = animationObj.dummyObj,
                    animObj = animationObj.animObj,
                    animType = animationObj.animType,
                    eventArgs,
                    path;

                !seriesData.isRotating && plotEventHandler.call (o, chart, evt);

                if (seriesData.isRotating || seriesData.singletonCase || doNotSlice) {
                    return;
                }

                // If 'enableMultiSlicing' is false, sliceInOtherPies is called only once
                // for the clicked pie. From within sliceInOtherPies, 'enableMultiSlicing'
                // is set to true, method plotGraphicClick is called once for each
                // sliced pie and finally, value of 'enableMultiSlicing' is reset to false.
                // Value of multiSliced is always false for plotGraphicClick call from
                // sliceInOtherPies. However, its value may be true or false, by the
                // return value of the sliceInOtherPies.
                atleastOneOtherSliced = !enableMultiSlicing && chart.sliceInOtherPies (index);

                if ((sliced = setConfig.sliced) && atleastOneOtherSliced) {
                    return;
                }

                //
                // In chrome of hybrid touch devices (touch + mouse), slice is getting fired twice for single touch
                // To prevent this cancle slice event within very sort period
                //
                if (supportsTouch && !supportsOnlyTouch) {
                    lastSliceTimeStamp = new Date ().getTime ();
                    if (plotItem.lastSliceTimeStamp &&
                        (lastSliceTimeStamp - plotItem.lastSliceTimeStamp) < minTimeForNextSlice) {
                        return;
                    }

                    // store current time stamp
                    plotItem.lastSliceTimeStamp = lastSliceTimeStamp;
                }
                graphic = setGraphics.element;
                connector = setGraphics.connector;
                dataLabel = setGraphics.label || setGraphics.dataLabel;
                slicedTranslation = typeof slicedTranslation === 'object' ? 't' + slicedTranslation : slicedTranslation;
                connectorPath = setConfig.connectorPath;
                transX = (sliced ? -1 : 1) * setConfig.transX;
                transY = (sliced ? -1 : 1) * setConfig.transY;
                eventArgs = graphic.data(EVENTARGS) || graphic.data(EVENTARGS, {});
                /**
                 * This event is fired when a pieSlice in pie-chart starts slicing transition.
                 *
                 * @event FusionCharts#slicingStart
                 * @group chart:pie-slice
                 *
                 * @param { object} data - Contains the values for the following
                 *                 attributes borderColor, borderWidth,
                 *                 categoryLabel, dashStyle, displayValue,
                 *                 hoverEffects (boolean), label, link,
                 *                 rolloverProperties (boolean), sliced (boolean),
                 *                 toolText, value (value of the sliced object)
                 * @param { boolean} slicedState - Tells the state of the slice before
                 *                  transition begins. The value is true for
                 *                  sliced-out state and false for sliced-in state.
                 */
                global.raiseEvent ('slicingStart', {
                    slicedState: sliced,
                    dataIndex: ('index' in elData) && elData.index,
                    data: chart.getPlotData (index, sliced)
                }, chart.chartInstance);

                graphic.animateWith(mainElm, animObj, {
                    transform: sliced ? 't0,0' : slicedTranslation
                }, animationDuration, animType, function () {
                    /**
                     * This event is fired when a pieSlice in pie-chart ends slicing transition.
                     *
                     * @event FusionCharts#slicingEnd
                     * @group chart:pie-slice
                     *
                     * @param { object} data - Contains the values for the following
                     *                 attributes borderColor, borderWidth,
                     *                 categoryLabel, dashStyle, displayValue,
                     *                 hoverEffects (boolean), label, link,
                     *                 rolloverProperties (boolean), sliced (boolean),
                     *                 toolText, value (value of the sliced object)
                     * @param { boolean} slicedState - Tells the state of the slice
                     *                  before transition begins. The value is true
                     *                  for sliced-out state and false for
                     *                  sliced-in state.
                     */
                    global.raiseEvent ('slicingEnd', {
                        slicedState: sliced,
                        dataIndex: ('index' in elData) && elData.index,
                        data: chart.getPlotData (index, sliced)
                    }, chart.chartInstance);
                });

                if (dataLabel && dataLabel.x) {
                    if (!(prevTextPos = dataLabel.data('textPos'))) {
                        prevTextPos = dataLabel.data('textPos', {
                            x: dataLabel.x,
                            y: dataLabel.y
                        });
                    }
                    dataLabel.animateWith(mainElm, animObj, {
                        x: dataLabel.x + (sliced ? 0 : transX)
                    }, animationDuration, animType);
                    prevTextPos.x = dataLabel.x + (sliced ? 0 : transX);
                }

                if (connectorPath) {
                    path = connectorPath.slice(0);
                    path[1] += transX;
                    path[2] += transY;
                    path[4] += transX;
                    path[6] += transX;
                    connector.animateWith(mainElm, animObj, {
                        path: path
                    }, animationDuration, animType);
                    setConfig.connectorPath = path;
                }
                // updating the slicing information.
                eventArgs.isSliced = (sliced = setConfig.sliced = !sliced);

                /** @todo: Enable center label feature related to enableMultiSlicing */
                //if ((innerDiameter = plotItem.innerDiameter) && !enableMultiSlicing) {
                //  (centerLabelConfig = sliced && plotItem.centerLabelConfig.label ?
                //      plotItem.centerLabelConfig : chartSeriesData.centerLabelConfig) &&
                //  (centerLabelText = centerLabelConfig.label) &&
                //  chart.drawDoughnutCenterLabel (centerLabelText, plotItem.center[0], plotItem.center[1],
                //      innerDiameter, innerDiameter, centerLabelConfig, true);
                //}

                return sliced;
            },
            sliceInOtherPies: function (mainPieId) {
                var chart = this,
                    series = chart.components.dataset[0],
                    plotItems = series.components.data,
                    i = plotItems.length,
                    numSliced = 0,
                    plot;

                series.enableMultiSlicing = true;

                while (i--) {
                    i !== mainPieId && (plot = plotItems[i]).config.sliced && ++numSliced &&
                        chart._plotGraphicClick.call (plot.graphics);
                }

                series.enableMultiSlicing = false;
                // Returns true when at least one other pie is sliced
                return !!numSliced;
            },
            placeDataLabels: (function () {
                /*
                 * Pie Helper Functions.
                 */

                var sortArrayByPoint = function (a, b) {
                        return a.point.value - b.point.value;
                    },
                    sortArrayByAngle = function (a, b) {
                        return a.angle - b.angle;
                    },
                    alignments = ['start', 'start', 'end', 'end'],
                    alignCenter = 'middle',
                    ySign = [-1, 1, 1, -1],
                    xSign = [1, 1, -1, -1];

                return function (isRotating, plotItems, plot, seriesData) {
                    var chart = this,
                        chartConfig = chart.config,
                        chartComponents = chart.components,
                        dataSet = chartComponents.dataset[0],
                        datasetGraphics = dataSet.graphics,
                        plotOptions = dataSet.config,
                        canvasLeft = chartConfig.canvasLeft,
                        canvasTop = chartConfig.canvasTop,
                        canvasWidth = chartConfig.canvasWidth,
                        cx = canvasLeft + chartConfig.canvasWidth * 0.5,
                        cy = canvasTop + chartConfig.canvasHeight * 0.5,
                        smartLabel = chart.linkedItems.smartLabel,
                        dataLabelsOptions = plotOptions.dataLabelOptions,
                        style = dataLabelsOptions.style,
                        lineHeight = pluckNumber (mathCeil (parseFloat (style.lineHeight)), 12),
                        placeInside = (plotItems.length === 1 ? chartConfig.singletonPlaceValue : false),
                        skipOverlapLabels = dataLabelsOptions.skipOverlapLabels,
                        manageLabelOverflow = dataLabelsOptions.manageLabelOverflow,
                        connectorPadding = dataLabelsOptions.connectorPadding,
                        distanceOption = dataLabelsOptions.distance,
                        remainingHeight,
                        seriesCenter = seriesData && seriesData.metrics || [
                            cx,
                            cy,
                            2 * plotOptions.pieMinRadius,
                            (plotOptions.innerSize || 0)
                        ],
                        centerY = seriesCenter[1],
                        centerX = seriesCenter[0],
                        radius = seriesCenter[2] * 0.5,
                        // divide the points into quarters for anti collision
                        quarters = [
                            [], // top right
                            [], // bottom right
                            [], // bottom left
                            [] // top left
                        ],
                        plotLeft = canvasLeft,
                        plotTop = canvasTop,
                        plotWidth = canvasWidth,
                        dataLabelsRadius = (plot.labelsRadius = radius + distanceOption),
                        labelFontSize = parseInt (style.fontSize, 10),
                        labelHeight = labelFontSize,
                        halfLabelHeight = labelHeight / 2,
                        xDisplacement = [connectorPadding,
                            connectorPadding, -connectorPadding, -connectorPadding
                        ],
                        maxLabels = (plot.labelsMaxInQuadrant = mathFloor (
                            dataLabelsRadius / labelHeight)),
                        isSmartLineSlanted = dataLabelsOptions.isSmartLineSlanted,
                        innerRadius = seriesCenter[3] / 2,
                        align,
                        i,
                        labelWidth,
                        j,
                        oriY,
                        maxYmayHave,
                        spaceRequired,
                        length,
                        k,
                        sliced,
                        x1,
                        x2,
                        x3,
                        x4,
                        y1,
                        y2,
                        y3,
                        points,
                        point,
                        angle,
                        connector,
                        connectorPath,
                        excess,
                        excessArr,
                        labelQuadrantHeight,
                        maxQuadrantLabel,
                        dataLabel,
                        quarter,
                        transX,
                        transY,
                        smartLabelObj,
                        slicedTranslation,
                        centerDistance,
                        sameSideQuadrentLastY = Number.POSITIVE_INFINITY,
                        extraLineSpaceComp,
                        lPoint,
                        pointConfig,
                        pointGraphics,
                        leftClubbedQuadrent = [],
                        rightClubbedQuadrent = [],
                        prevTextPos,
                        prevConnectorPos,
                        animationObj = chart.get('config', 'animationObj'),
                        // animating on every rotations slows the performance. @revisit.
                        animationDuration = isRotating ? 0 : (animationObj.duration || 0),
                        mainElm = animationObj.dummyObj,
                        animObj = animationObj.animObj,
                        animType = animationObj.animType,

                        plotDragMove = chart._plotDragMove,
                        plotDragStart = chart._plotDragStart,
                        plotDragEnd = chart._plotDragEnd,
                        plotRollOver = chart._plotRollOver,
                        plotRollOut = chart._plotRollOut,
                        paper = chartComponents.paper,
                        dataLabelContainer = datasetGraphics.dataLabelContainer,
                        _textAttrs,
                        _textCss;

                    // run parent method
                    /**^
                     * Introduced the isRotating argument too to detect
                     * whether this is called during rotation.
                     */
                    smartLabel.useEllipsesOnOverflow(chartConfig.useEllipsesWhenOverflow);
                    if (!isRotating) {
                        //do not set the style every time
                        // Do it for first time
                        smartLabel.setStyle (style);
                    }

                    // arrange points for detection collision
                    // Creates an array of quarter containing labels of each
                    // quarter if there has only one label the draw it inside
                    if (plotItems.length == 1 && !innerRadius && placeInside) {
                        point = plotItems[0];
                        if ((_textAttrs = point.config._textAttrs).text) {
                            pointGraphics = point.graphics;
                            pointConfig = point.config;
                            dataLabel = pointGraphics.label;

                            point.slicedTranslation = [plotLeft, plotTop];
                            _textAttrs['text-anchor'] = alignCenter;
                            _textAttrs.x = 0;
                            _textAttrs.y = 0;
                            _textAttrs.transform = ['t', centerX, centerY];

                            if (!dataLabel) {
                                dataLabel = pointGraphics.label = paper
                                .text(_textAttrs, _textCss, dataLabelContainer)
                                .drag(plotDragMove, plotDragStart, plotDragEnd)
                                .hover(plotRollOver, plotRollOut);
                            }
                            else {
                                dataLabel.animateWith (mainElm, animObj, _textAttrs, animationDuration, animType);
                            }

                            dataLabel.x = centerX;
                            dataLabel.data('textPos', {
                                x: centerX,
                                y: centerY
                            })
                            .data('plotItem', _textAttrs.plotItem)
                            .data(EVENTARGS, _textAttrs.eventArgs);

                            if (pointConfig.y !== null && pointConfig.y !== undefined) {
                                dataLabel.show ();
                            }

                            if (pointGraphics.connector) {
                                pointGraphics.connector.attr({
                                    path: []
                                });
                            }
                        }
                    }
                    else {
                        if (placeInside) {
                            centerDistance = innerRadius + ((radius - innerRadius) / 2);
                            each (plotItems, function (point) {
                                pointConfig = point.config;
                                if ((_textAttrs = pointConfig._textAttrs).text) {
                                    pointGraphics = point.graphics;
                                    dataLabel = pointGraphics.label;
                                    if (pointConfig.y !== null && pointConfig.y !== undefined) {
                                        connector = pointGraphics.connector;
                                        connector && connector.show();
                                        dataLabel && dataLabel.show ();
                                    }
                                    _textAttrs.transform = 't0,0';
                                    angle = pointConfig.angle;
                                    y3 = centerY + (centerDistance *
                                        mathSin (angle));
                                    //previous implementation adds halfLebelHeight - 2 which makes the
                                    //label aligned to top instead middle [RED - 1717]
                                    /*y3 = centerY + (centerDistance *
                                        mathSin (angle)) + halfLabelHeight - 2;*/
                                    x3 = centerX + (centerDistance * mathCos (angle));
                                    _textAttrs._x = x3;
                                    _textAttrs._y = y3;
                                    if (point.sliced) {
                                        slicedTranslation = point.slicedTranslation;
                                        transX = slicedTranslation[0] - plotLeft;
                                        transY = slicedTranslation[1] - plotTop;
                                        x3 = x3 + transX;
                                        y3 = y3 + transY;
                                    }

                                    _textAttrs['text-anchor'] = alignCenter;
                                    _textAttrs.x = 0;
                                    _textAttrs.y = 0;
                                    _textAttrs.transform = ['t', x3, y3];

                                    if (!dataLabel) {
                                        dataLabel = pointGraphics.label = paper
                                        .text(_textAttrs, _textCss, dataLabelContainer)
                                        .drag(plotDragMove, plotDragStart, plotDragEnd)
                                        .hover(plotRollOver, plotRollOut);
                                    }
                                    else {
                                        dataLabel.animateWith (mainElm, animObj, _textAttrs, animationDuration,
                                            animType);
                                    }
                                    dataLabel.x = _textAttrs._x;
                                    // storing original x value
                                    // to use while slicing in (IE Issue original
                                    //  x get changed form animate)
                                    dataLabel.x = _textAttrs._x;
                                    dataLabel.y = _textAttrs._y;

                                    dataLabel
                                    .data('plotItem', _textAttrs.plotItem)
                                    .data(EVENTARGS, _textAttrs.eventArgs);

                                    if (_textAttrs.visibility === VISIBLE) {
                                        dataLabel.show();
                                    }
                                }

                            });
                        }
                        else { //outside
                            for (i = plotItems.length - 1; i >= 0; i --) {
                                point = plotItems[i];
                                pointConfig = point.config;
                                _textAttrs = pointConfig._textAttrs;
                                if (!(_textAttrs.text = pointConfig.displayValue)) {
                                    continue;
                                }
                                pointGraphics = point.graphics;
                                if (pointConfig.y !== null && pointConfig.y !== undefined) {
                                    dataLabel = pointGraphics.label;
                                    connector = pointGraphics.connector;
                                    connector && connector.show();
                                    dataLabel && dataLabel.show ();
                                }
                                _textAttrs.text = pointConfig.displayValue;
                                _textAttrs.transform = 't0,0';
                                angle = pointConfig.angle % pi2;

                                if (angle < 0) {
                                    angle = pi2 + angle;
                                }
                                // Calculate bottom right quarter labels
                                if (angle >= 0 && angle < piBy2) {
                                    quarter = 1;
                                } else
                                // Calculate bottom left quarter labels
                                if (angle < pi) {
                                    quarter = 2;
                                } else
                                // Calculate top left quarter labels
                                if (angle < pi3By2) {
                                    quarter = 3;
                                }
                                // Calculate top right quarter labels
                                else {
                                    quarter = 0;
                                }
                                // Now put labels according to each quarter
                                quarters[quarter].push ( {
                                    point: point,
                                    angle: angle
                                });
                            }
                            i = k = 4;
                            //if excess then remove the low value slice first
                            while (i--) {
                                if (skipOverlapLabels) {
                                    // Find labels can fit into the quarters or not
                                    excess = quarters[i].length - maxLabels;
                                    if (excess > 0) {
                                        // sort by point.value
                                        quarters[i].sort (sortArrayByPoint);
                                        // remove extra data form the array
                                        // which labels can not be fitted into
                                        // the quarters
                                        excessArr = quarters[i].splice (0, excess);
                                        //hide all removed labels
                                        for (j = 0, length = excessArr.length; j < length; j += 1) {
                                            point = excessArr[j].point;
                                            _textAttrs = point.config._textAttrs;
                                            pointGraphics = point.graphics;
                                            if (pointGraphics.label) {
                                                pointGraphics.label.attr('visibility', HIDDEN);
                                            }
                                            if (pointGraphics.connector) {
                                                pointGraphics.connector.attr ( {
                                                    visibility: HIDDEN
                                                });
                                            }
                                        }
                                    }
                                }
                                // now we sort the data labels by its label angle
                                quarters[i].sort (sortArrayByAngle);
                            }

                            maxQuadrantLabel = mathMax (
                                quarters[0].length,
                                quarters[1].length,
                                quarters[2].length,
                                quarters[3].length
                            );
                            labelQuadrantHeight = mathMax (
                                mathMin (maxQuadrantLabel, maxLabels) * labelHeight,
                                dataLabelsRadius + labelHeight
                            );

                            // Club the first and second quadrent as they appear in the right side of the
                            // chart and club the other two. Clubbing here means merge all the points together
                            // so that marginal quadrent case are handled like one point at first quadrent and
                            // second point at another quadrent but placed closely.
                            rightClubbedQuadrent = quarters[0].concat (quarters[1]);
                            leftClubbedQuadrent = quarters[2].concat (quarters[3]);

                            for (i = rightClubbedQuadrent.length - 1; i >= 0; i--) {
                                lPoint = rightClubbedQuadrent[i].point.config;
                                // Clear if any previous values are stored
                                delete lPoint.clearance;
                                delete lPoint.clearanceShift;
                                oriY = mathAbs (labelQuadrantHeight * mathSin (lPoint.angle));
                                if (Math.abs (sameSideQuadrentLastY - oriY) < lineHeight * 2) {
                                    lPoint.clearance = 0;
                                    rightClubbedQuadrent[i+1].point.clearanceShift = lineHeight / 2;
                                }
                                sameSideQuadrentLastY = oriY;
                            }

                            sameSideQuadrentLastY = Number.POSITIVE_INFINITY;

                            for (i = 0, length = leftClubbedQuadrent.length; i < length; i++) {
                                lPoint = leftClubbedQuadrent[i].point.config;
                                // Clear if any previous values are stored
                                delete lPoint.clearance;
                                delete lPoint.clearanceShift;
                                oriY = mathAbs (labelQuadrantHeight * mathSin (lPoint.angle));
                                if (Math.abs (sameSideQuadrentLastY - oriY) < lineHeight * 2) {
                                    lPoint.clearance = 0;
                                    leftClubbedQuadrent[i-1].point.clearanceShift = lineHeight / 2;
                                }
                                sameSideQuadrentLastY = oriY;
                            }

                            // reverse 1st and 3rd quardent points
                            quarters[1].reverse ();
                            quarters[3].reverse ();

                            while (k--) {
                                points = quarters[k];
                                length = points.length;

                                if (!skipOverlapLabels) {
                                    if (length > maxLabels) {
                                        labelHeight = labelQuadrantHeight / length;
                                    }
                                    else {
                                        labelHeight = labelFontSize;
                                    }
                                    halfLabelHeight = labelHeight / 2;
                                }

                                //1st pass
                                //place all labels at 1st quarter

                                // calculate the total available space to put labels
                                spaceRequired = length * labelHeight;
                                // calculate the remaining height
                                remainingHeight = labelQuadrantHeight;
                                //place all child point
                                for (i = 0; i < length; i += 1, spaceRequired -= labelHeight) {
                                    // Get the y position of the label (radius
                                    // where data label is to draw)
                                    oriY = mathAbs (labelQuadrantHeight * mathSin (points[i].angle));

                                    if (remainingHeight < oriY) {
                                        oriY = remainingHeight;
                                    }
                                    else if (oriY < spaceRequired) {
                                        oriY = spaceRequired;
                                    }

                                    remainingHeight = (points[i].oriY = oriY) - labelHeight;
                                }

                                //2nd pass (reverse)
                                align = alignments[k];
                                //place all labels at 1st quarter
                                maxYmayHave = labelQuadrantHeight - ((length - 1) * labelHeight);
                                remainingHeight = 0;

                                //place all child point
                                for (i = points.length - 1; i >= 0; i -= 1, maxYmayHave += labelHeight) {
                                    point = points[i].point;
                                    angle = points[i].angle;
                                    pointConfig = point.config;
                                    _textAttrs = pointConfig._textAttrs;
                                    if (!_textAttrs.text) {
                                        continue;
                                    }
                                    _textCss = pointConfig._textCss;
                                    pointGraphics = point.graphics;
                                    sliced = pointConfig.sliced;
                                    dataLabel = pointGraphics.label;

                                    oriY = mathAbs (labelQuadrantHeight * mathSin (angle));

                                    if (oriY < remainingHeight) {
                                        oriY = remainingHeight;
                                    }
                                    else if (oriY > maxYmayHave) {
                                        oriY = maxYmayHave;
                                    }

                                    remainingHeight = oriY + labelHeight;

                                    // If the there is a label down underneath or
                                    // bordered put elipses else wrap the word.
                                    extraLineSpaceComp = pointConfig.clearance === undefined?
                                        mathCeil (pluckNumber (parseFloat (pointConfig.style.border), 12), 12) * 2:
                                        mathCeil (pluckNumber (parseFloat (pointConfig.style.border),
                                            pointConfig.clearance)) * 2;



                                    y1 = ((oriY + points[i].oriY) / 2);
                                    x1 = centerX + xSign[k] * dataLabelsRadius *
                                        mathCos (math.asin (y1 / labelQuadrantHeight));
                                    y1 *= ySign[k];
                                    y1 += centerY;

                                    y2 = centerY + (radius * mathSin (angle));
                                    x2 = centerX + (radius * mathCos (angle));

                                    // Relation: centerX <= connectorStartX <= connectorEndX
                                    // (for right half and vice versa for left half)
                                    (k < 2 && x1 < x2 || k > 1 && x1 > x2) && (x1 = x2);

                                    x3 = x1 + xDisplacement[k];
                                    y3 = y1 - halfLabelHeight - 2;
                                    x4 = x3 + xDisplacement[k];

                                    _textAttrs._x = x4;

                                    if (manageLabelOverflow) {
                                        labelWidth = k > 1 ? x4 - chartConfig.canvasLeft : chartConfig.canvasLeft +
                                            plotWidth - x4;
                                        smartLabel.setStyle (pointConfig.style);
                                        lineHeight = pluckNumber (mathCeil (parseFloat (pointConfig.style.lineHeight)),
                                            12) + extraLineSpaceComp;
                                        smartLabelObj =
                                            smartLabel.getSmartText (pointConfig.displayValue, labelWidth, lineHeight);

                                        if (pointConfig.clearance === undefined && smartLabelObj.height > labelHeight) {
                                            y1 += labelHeight;
                                        }

                                        _textAttrs.text = smartLabelObj.text;
                                        // _textAttrs.title = smartLabelObj.tooltext || '';

                                        _textAttrs.tooltip = smartLabelObj.tooltext;


                                        /*dataLabel.attr ( {
                                            text: smartLabelObj.text
                                            //title: (smartLabelObj.tooltext || '')
                                        })
                                        .tooltip (smartLabelObj.tooltext);*/
                                    }
                                    _textAttrs._y = y3;

                                    if (sliced) {
                                        transX = pointConfig.transX;
                                        transY = pointConfig.transY;
                                        x3 = x3 + transX;
                                        x1 = x1 + transX;
                                        x2 = x2 + transX;
                                        y2 = y2 + transY;
                                        x4 = x4 + transX;
                                    }

                                    _textAttrs['text-anchor'] = align;
                                    _textAttrs.vAlign = 'middle';

                                    _textAttrs.x = x4;
                                    _textAttrs.y = y1;

                                    prevTextPos = dataLabel && dataLabel.data('textPos');
                                    if (prevTextPos) {
                                        dataLabel.attr({
                                            x: prevTextPos.x,
                                            y: prevTextPos.y
                                        }). animateWith(mainElm, animObj, _textAttrs, animationDuration);
                                    }
                                    else {
                                        // for the initial rendering.
                                        dataLabel = pointGraphics.label = paper
                                        .text(_textAttrs, _textCss, dataLabelContainer)
                                        .drag(plotDragMove, plotDragStart, plotDragEnd)
                                        .hover(plotRollOver, plotRollOut);
                                    }

                                    dataLabel.x = _textAttrs._x;
                                    dataLabel._x = _textAttrs._x;
                                    dataLabel.y = _textAttrs._y;

                                    if (_textAttrs.tooltip) {
                                        dataLabel.tooltip(_textAttrs.tooltip);
                                        delete _textAttrs.tooltip;
                                    }
                                    if (_textAttrs.visibility === VISIBLE) {
                                        dataLabel.show();
                                    }
                                    dataLabel.data('textPos', {
                                        x: x4,
                                        y: y1
                                    })
                                    .data('plotItem', _textAttrs.plotItem)
                                    .data(EVENTARGS, _textAttrs.eventArgs);
                                    // draw the connector
                                    if ((connector = pointGraphics.connector)) {
                                        pointConfig.connectorPath = connectorPath = [
                                            M,
                                            x2, y2, // base
                                            L,
                                            // first break, next to the label
                                            isSmartLineSlanted ? x1 : x2, y1,
                                            x3, y1 // end of the string at the label
                                        ];
                                        prevConnectorPos = connector.data('connectorPath');
                                        if (prevConnectorPos) {
                                            if (!chartConfig.clicked) {
                                                connector.attr({
                                                    path: prevConnectorPos.path
                                                }). animateWith(mainElm, animObj, {
                                                    path: connectorPath
                                                }, animationDuration);
                                            }
                                        }
                                        else {
                                            connector.attr ( {
                                                path: connectorPath
                                            });
                                        }
                                        connector.data('connectorPath', {
                                            path: connectorPath
                                        });
                                    }
                                }
                            }
                        }
                    }
                };
            } ()),
            _spaceManager: function () {
                var chart = this,
                    chartConfig = chart.config,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    data = dataSet.components.data,
                    conf = dataSet.config,
                    legend = chartComponents.legend,
                    colorM = chartComponents.colorManager,
                    SmartLabel = chart.linkedItems.smartLabel,
                    textWidthArr = [],
                    length = conf.dataLabelCounter,
                    labelMaxW = 0,
                    fcJSONChart = chart.jsonData.chart,
                    manageLabelOverflow = pluckNumber (fcJSONChart.managelabeloverflow, 0),
                    userGivenSlicingDist = pluckNumber (fcJSONChart.slicingdistance),
                    slicingDistance = !conf.preSliced && (chartConfig.allPlotSliceEnabled === ZEROSTRING) &&
                        (fcJSONChart.showlegend !== ONESTRING || fcJSONChart.interactivelegend === ZEROSTRING) ?
                        0 : mathAbs (pluckNumber (userGivenSlicingDist, 20)),
                    pieRadius = pluckNumber (fcJSONChart.pieradius, 0),
                    enableSmartLabels = pluckNumber (fcJSONChart.enablesmartlabels, fcJSONChart.enablesmartlabel, 1),
                    skipOverlapLabels = enableSmartLabels ? pluckNumber (fcJSONChart.skipoverlaplabels,
                        fcJSONChart.skipoverlaplabel, 1) : 0,
                    isSmartLineSlanted = pluckNumber (fcJSONChart.issmartlineslanted, 1),
                    labelDistance = length ? pluckNumber (fcJSONChart.labeldistance, fcJSONChart.nametbdistance, 5) :
                        slicingDistance,
                    smartLabelClearance = pluckNumber (fcJSONChart.smartlabelclearance, 5),
                    width = chartConfig.width,
                    height = chartConfig.height,
                    actionBarHeight = (chart._manageActionBarSpace(height * 0.225) || {}).bottom,
                    chartWorkingWidth = width - (chartConfig.marginRight + chartConfig.marginLeft),
                    chartWorkingHeight = height - (chartConfig.marginTop + chartConfig.marginBottom) -
                        (actionBarHeight ? actionBarHeight + chartConfig.marginBottom : 0),
                    minOfWH = mathMin (chartWorkingHeight, chartWorkingWidth),
                    smartLineColor = pluck (fcJSONChart.smartlinecolor, colorM.getColor ('plotFillColor')),
                    smartLineAlpha = pluckNumber (fcJSONChart.smartlinealpha, 100),
                    smartLineThickness = pluckNumber (fcJSONChart.smartlinethickness, 0.7),
                    dataLabelOptions = (conf.dataLabelOptions = dataSet._parseDataLabelOptions ()),
                    style = dataLabelOptions.style,
                    lineHeight = length ? pluckNumber (parseInt (style.lineHeight, 10), 12) : 0, //2px padding
                    pieMinRadius = pieRadius === 0 ? minOfWH * 0.15 : pieRadius,
                    pieMinDia = (2 * pieMinRadius),
                    legendSpace = {
                        bottom: 0,
                        right: 0
                    },
                    captionSpace,
                    pieYScale = conf.pieYScale,
                    pieSliceDepth = conf.pieSliceDepth,
                    textObj,
                    avaiableMaxpieSliceDepth,
                    totalSpaceReq;
                // Old code for placeValuesInside
                // placeLabelsInside = pluckNumber ((FCchartName === 'doughnut2d') ? 0 : fcJSONChart.placevaluesinside),

                dataLabelOptions.connectorWidth = smartLineThickness;
                dataLabelOptions.connectorPadding = pluckNumber (fcJSONChart.connectorpadding, 5);
                dataLabelOptions.connectorColor = convertColor (smartLineColor, smartLineAlpha);

                // If smart label is on and there is a label defined only then modify the label distance
                if (length) {
                    if (enableSmartLabels) {
                        labelDistance = smartLabelClearance;
                    }
                    labelDistance += slicingDistance;
                }
                // Include label
                totalSpaceReq = pieMinDia + ((lineHeight + labelDistance) * 2);

                // Provide at least single line height space for caption.
                // a space manager that manages the space for the tools as well as the captions.
                captionSpace = chart._manageChartMenuBar(totalSpaceReq < chartWorkingHeight ?
                    chartWorkingHeight - totalSpaceReq : chartWorkingHeight / 2);
                chartWorkingHeight -= ((captionSpace.top || 0) + (captionSpace.bottom || 0));
                if (conf.showLegend) {
                    chart.hasLegend = true;
                    if (pluck (fcJSONChart.legendposition, POSITION_BOTTOM).toLowerCase () !== POSITION_RIGHT) {
                        legendSpace = legend._manageLegendPosition (chartWorkingHeight / 2);
                        chartWorkingHeight -= legendSpace.bottom;
                    } else {
                        legendSpace = legend._manageLegendPosition (chartWorkingHeight / 2);
                        chartWorkingWidth -= legendSpace.right;
                    }
                }
                chart._allocateSpace (legendSpace);
                // Now get the max width required for all display text
                // set the style
                SmartLabel.useEllipsesOnOverflow(chartConfig.useEllipsesWhenOverflow);
                if (length !== 1) { // Fix for single data in Pie makes pie very small in size.
                    for (; length--; ) {
                        SmartLabel.setStyle (data[length].config.style || chartConfig.dataLabelStyle);
                        textWidthArr[length] = textObj = SmartLabel.getOriSize (data[length].config.displayValue);
                        labelMaxW = mathMax (labelMaxW, textObj.width);
                    }
                }
                // If redius not supplyed then auto calculate it
                if (pieRadius === 0) {
                    pieMinRadius = chart._stubRadius (chartWorkingWidth, labelMaxW, chartWorkingHeight, labelDistance,
                        slicingDistance, lineHeight, pieMinRadius);
                }
                else {
                    conf.slicingDistance = slicingDistance;
                    conf.pieMinRadius = pieMinRadius;
                    dataLabelOptions.distance = labelDistance;
                }
                avaiableMaxpieSliceDepth = chartWorkingHeight - (2 * ((pieMinRadius * pieYScale) + lineHeight));
                conf.managedPieSliceDepth = (pieSliceDepth > avaiableMaxpieSliceDepth) ? (pieSliceDepth -
                    avaiableMaxpieSliceDepth) : conf.pieSliceDepth;
                dataLabelOptions.isSmartLineSlanted = isSmartLineSlanted;
                dataLabelOptions.enableSmartLabels = enableSmartLabels;
                dataLabelOptions.skipOverlapLabels = skipOverlapLabels;
                dataLabelOptions.manageLabelOverflow = manageLabelOverflow;
            },
            // manages the spaces when no radius is given.
            _stubRadius: function (chartWorkingWidth, labelMaxW, chartWorkingHeight, labelDistance, slicingDistance,
                lineHeight, pieMinRadius) {
                var chart = this,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    conf = dataSet.config,
                    fcJSONChart = chart.jsonData.chart,
                    userGivenSlicingDist = pluckNumber (fcJSONChart.slicingdistance),
                    dataLabelOptions = conf.dataLabelOptions ||
                        (conf.dataLabelOptions = dataSet._parseDataLabelOptions ()),
                    availableRadius = 0,
                    // Slicing distance can not be less then the MINSLICINGDIST (10)
                    MINSLICINGDIST = 10,
                    shortFall;
                availableRadius = mathMin((chartWorkingWidth / 2) - labelMaxW - slicingDistance,
                        (chartWorkingHeight / 2) - lineHeight) - labelDistance;
                if (availableRadius >= pieMinRadius) {//there has space for min width
                    pieMinRadius = availableRadius;
                }
                else if (!userGivenSlicingDist) {/** @todo smartyfy Labels */
                    // If slicing distance is not given by the user, adjust slicing distance based on pie radius.
                    shortFall = pieMinRadius - availableRadius;
                    // Now reduce the pie slicing distance, but restrict the minimum slicing distance to 10 pixels.
                    slicingDistance = labelDistance = mathMax(mathMin(labelDistance - shortFall,
                        slicingDistance), MINSLICINGDIST);
                }
                conf.slicingDistance = slicingDistance;
                conf.pieMinRadius = pieMinRadius;
                dataLabelOptions.distance = labelDistance;

                return pieMinRadius;
            },
            getDataSet: function (index) {
                return this.components.dataset[index];
            },
            _startingAngle: function (angle, relative) {
                var ang,
                    chart = this,
                    dataSet = chart.components.dataset[0],
                    seriesData = dataSet.config,
                    // Angle is differently handled in Pie2D and Pie3D. So, angles is converted
                    // accordingly to the same base. Its radian in 2D while in degrees in 3D.
                    // Moreover, sense of positive angle is opposite in the two.
                    currentAngle = (ang = seriesData.startAngle) * (-rad2deg) +
                        ((-1) * ang < 0 ? 360 : 0);
                if (!isNaN(angle)) {
                    if (!(seriesData.singletonCase || seriesData.isRotating)) {
                        angle += relative ? currentAngle : 0;
                        seriesData.startAngle = -angle * deg2rad;
                        chart._rotate(angle);
                        currentAngle = angle;
                    }
                    else {
                        currentAngle = seriesData.startAngle;
                    }
                }
                // Angle normalised in the range of [0, 360]
                return mathRound(((currentAngle %= 360) + (currentAngle < 0 ? 360 : 0)) * 100) / 100;
            },
            eiMethods: /** @lends FusionCharts# */ {
                /**
                 * Pie charts have slices that can be clicked to slice in and out.
                 * Checks whether a particular wedge of Pie or Doughnut chart is sliced-out or sliced-in.
                 *
                 * > Available on `pie` and `doughnut` chart types only.
                 *
                 * @group chart:pie-slice
                 *
                 * @param {number} index - The index of the data corresponding to the pie/doughnut slice.
                 * @returns {boolean} - The sliced state of the pie/doughnut wedge. Returns `true` if it's sliced out,
                 * or `false` if it's sliced in.
                 *
                 * @example
                 * // Render a pie 2d chart with some data in sliced out state, provide data index
                 * // in an input textfield and get the sliced state of the pie on click of a button
                 * FusionCharts.ready(function () {
                 *     var chart = new FusionCharts({
                 *         type: "pie2d",
                 *         renderAt: "chart-container",
                 *         dataSource: "data.json",
                 *         dataFormat: "jsonurl"
                 *     }).render();
                 *
                 *     // Get the sliced state of a pie returned when clicked on a button
                 *     // (with an id pie-sliced-state). It picks the data index from
                 *     // an input textfield (with id pie-data-index).
                 *     document.getElementById("pie-sliced-state").onclick = function () {
                 *         var dataIndex = document.getElementById("pie-data-index").value,
                 *             slicedState = chart.isPlotItemSliced(dataIndex);
                 *     };
                 * });
                 */
                isPlotItemSliced: function (index) {
                    var num,
                        data,
                        config,
                        dataSet,
                        apiInstance = this.apiInstance;

                    return (apiInstance && apiInstance.components.dataset &&
                        (dataSet = apiInstance.components.dataset[0]) &&
                        (data = dataSet.components.data) && (num = data.length) &&
                        data[index] && (config = data[index].config)) &&
                        config.sliced;
                },

                addData: function () {
                    var dataSet,
                        apiInstance = this.apiInstance;
                    return (apiInstance && apiInstance.components.dataset &&
                        (dataSet = apiInstance.components.dataset[0]) && dataSet.addData.apply(dataSet, arguments));
                },

                removeData: function () {
                    var dataSet,
                        apiInstance = this.apiInstance;
                    return (apiInstance && apiInstance.components.dataset &&
                        (dataSet = apiInstance.components.dataset[0]) && dataSet.removeData.apply(dataSet, arguments));
                },

                updateData: function () {
                    var dataSet,
                        apiInstance = this.apiInstance;
                    return (apiInstance && apiInstance.components.dataset &&
                        (dataSet = apiInstance.components.dataset[0]) && dataSet.updateData.apply(dataSet, arguments));
                },

                /**
                 * Pie charts have slices. These slices can be clicked by users to slice in or slice out.
                 * Slices a pie/doughnut wedge to in / out state. In absence of the optional second parameter, it
                 * toggles the sliced state of the pie. The second parameter only enforces a specific sliced state.
                 *
                 * > Available on `pie` and `doughnut` chart types only.
                 *
                 * @group chart:pie-slice
                 *
                 * @param {number} index - The index of the data corresponding to the pie/doughnut slice.
                 * @param {boolean=} [slice] - Gives direction to chart on what is the required sliced state. For
                 * `true`, it slices out, if in sliced-in state. Or else, maintains it's sliced-out state. And
                 * vice-versa.
                 *
                 * @returns {boolean} - The final sliced state of the pie/doughnut wedge. Returns `true` if it's
                 * sliced out, or `false` if it's sliced in.
                 *
                 * @fires FusionCharts#slicingStart
                 * @fires FusionCharts#slicingEnd
                 *
                 * @example
                 * // Render a pie 2d chart, provide data index in an input textfield
                 * // and toggle the sliced state of the pie on click of a button
                 * FusionCharts.ready(function () {
                 *     var chart = new FusionCharts({
                 *         type: "pie2d",
                 *         renderAt: "chart-container",
                 *         dataSource: "data.json",
                 *         dataFormat: "jsonurl"
                 *     }).render();
                 *
                 *     // Toggle the sliced state of the pie when clicked on a button
                 *     // (with an id pie-sliced-state). It picks the data index from
                 *     // an input textfield (with id pie-data-index).
                 *     document.getElementById("pie-sliced-state").onclick = function () {
                 *         var dataIndex = document.getElementById("pie-data-index").value;
                 *         chart.slicePlotItem(dataIndex);
                 *     };
                 * });
                 */
                slicePlotItem: function (index, slice) {
                    var dataSet,
                        data,
                        config,
                        num,
                        sliceVal = !!slice,
                        apiInstance = this.apiInstance;
                    return (apiInstance && apiInstance.components.dataset &&
                        (dataSet = apiInstance.components.dataset[0]) &&
                        (data = dataSet.components.data) && (num = data.length) &&
                        data[index = dataSet.config.reversePlotOrder ? (num - index - 1) : index] &&
                        (config = data[index].config)) && ((sliceVal !== config.sliced || slice === UNDEFINED) &&
                        apiInstance._plotGraphicClick.call(data[index].graphics.element) || config.sliced);
                },

                /**
                 * Sets the center label in Dougnut 2D chart. The label cosmetics are configurable via the second
                 * optional parameter, which accepts a host of related properties.
                 *
                 * > Available on `doughnut` chart only.
                 *
                 * @group chart:pie-center-label
                 *
                 * @param {string} labelText - The text to be displayed at doughnut center.
                 * @param {object=} [options] - The optional parameter that holds a host of configurable params
                 * with most them being cosmetic properties of the center label. The properties are case sensitive.
                 *
                 * @param {string=} [options.font] - Sets the font face of the label.
                 * @param {string=} [options.fontSize] - Defines the font size of the label.
                 * @param {boolean=} [options.bold] - Specifies of whether the label be bold.
                 * @param {boolean=} [options.italic] - Specifies of whether the label be in italic.
                 * @param {hexcolor=} [options.color] - Sets the color of the label text.
                 * @param {alpha=} [options.alpha] - Sets the opacity of the label text.
                 * @param {hexcolor=} [options.hoverColor] - Sets the hover color of the label text.
                 * @param {alpha=} [options.hoverAlpha] - Sets the hover opacity of the label text.
                 * @param {hexcolor=} [options.bgColor] - Sets the color of the label background.
                 * @param {alpha=} [options.bgAlpha] - Sets the opacity of the label background.
                 * @param {hexcolor=} [options.borderColor] - Sets the color of the label background border.
                 * @param {alpha=} [options.borderAlpha] - Sets the opacity of the label background border.
                 * @param {number=} [options.borderThickness] - Sets the thickness of the label background border.
                 * @param {number=} [options.borderRadius] - Sets the radius for rounded label background.
                 * @param {number=} [options.padding] - The padding between extremities of the label and inner periphery
                 * of the doughnut. For rectangular label background, it's relative to any of the 4 corners. While for
                 * circular background, it's the gap between the 2 concentric circles, background border and inner
                 * periphery.
                 * @param {number=} [options.textPadding] - For rectangular label background, it's the gutter between
                 * the text and the background border. While for circular background, it's the minimum space between
                 * the background border and the containing circle of the text.
                 * @param {string=} [options.toolText] - Sets the tooltext for the label.
                 *
                 * @fires FusionCharts#centerLabelChanged
                 *
                 * @example
                 * // Render a doughnut 2d chart and set center label with some
                 * // configuring params on click of a button
                 * FusionCharts.ready(function () {
                 *     var chart = new FusionCharts({
                 *         type: "doughnut2d",
                 *         renderAt: "chart-container",
                 *         dataSource: "data.json",
                 *         dataFormat: "jsonurl"
                 *     }).render();
                 *
                 *     // Assign the functionality of setting the center label when clicked on
                 *     // a button (with an id set-center-label).
                 *     document.getElementById("set-center-label").onclick = function () {
                 *         chart.centerLabel("The central label", {bold: true, toolText: "center label tooltext"});
                 *     };
                 * });
                 */
                centerLabel: function (labelText, options) {
                    var chart = this.apiInstance,
                        seriesData = chart.components.dataset[0],
                        config = seriesData.config,
                        piePlotOptions = config.piePlotOptions,
                        innerSize = piePlotOptions.innerSize,
                        pieCenter = config.pieCenter,
                        cx = pieCenter[0],
                        cy = pieCenter[1],
                        centerLabelConfig = config.centerLabelConfig,
                        key;

                    if (typeof options !== 'object') {
                        options = centerLabelConfig;
                    }
                    else {
                        // Create the config cosmetics object from those obtained
                        // from argument and default values
                        for (key in centerLabelConfig) {
                            options[key] === UNDEFINED && (options[key] = centerLabelConfig[key]);
                        }
                    }
                    options.label = labelText;
                    seriesData.centerLabelConfig = options;

                    innerSize && chart.drawDoughnutCenterLabel(labelText || '',
                        cx, cy, innerSize, innerSize, options, true);
                },

                /**
                 * Rotates the pie/doughnut chart to a specific angle or by a specific angle. The mode of
                 * operation is controlled by the optional second parameter. Even the first parameter is optional,
                 * in absence of which, the chart doesn't rotate and simply returns the current starting angle
                 * of the pie/doughnut chart.
                 *
                 * Starting angle of a pie/doughnut chart is the angle at which the starting face of the first data is
                 * aligned to. Each pie is drawn in counter clock-wise direction.
                 *
                 * > Available on `pie` and `doughnut` chart types only.
                 *
                 * @group chart:pie-slice
                 *
                 * @param {degrees=} [angle=0] - The angle by which to rotate the entire pie/doughnut chart.
                 * @param {boolean=} [relative=false] - Specify whether the angle being set is relative to the current
                 * angle or with respect to absolute 0.
                 * @returns {degrees} - The final state of the starting angle of the chart.
                 *
                 * @example
                 * // Render a pie 2d chart and rotate the chart by 90 degrees on click of a button
                 * FusionCharts.ready(function () {
                 *     var chart = new FusionCharts({
                 *         type: "pie2d",
                 *         renderAt: "chart-container",
                 *         dataSource: "data.json",
                 *         dataFormat: "jsonurl"
                 *     }).render();
                 *
                 *     // Assign the functionality of rotating the chart by 90 degrees when clicked on
                 *     // a button (with an id rotate-chart).
                 *     document.getElementById("rotate-chart").onclick = function () {
                 *         chart.startingAngle(90, true);
                 *     };
                 * });
                 */
                startingAngle: function (angle, relative) {
                    return this.apiInstance._startingAngle(angle, relative);
                }
            }
        }, chartAPI.guageBase, {
            plotborderthickness: 1,
            alphaanimation: 0,
            singletonPlaceValue: true,
            usedataplotcolorforlabels: 0,
            enableslicing: ONESTRING
        });

        chartAPI ('pie3d', {
            defaultDatasetType : 'Pie3D',
            applicableDSList: {
                'Pie3D': true
            },
            is3D: true,
            friendlyName: '3D Pie Chart',
            fireGroupEvent: true,
            creditLabel: creditLabel,
            getPointColor: function (color) {
                return color;
            },
            _configureManager: function () {
                var chart = this,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    dataSetConfig = dataSet.config,
                    dataSetComponents = dataSet.components,
                    pie3DManager = dataSetComponents.Pie3DManager,
                    data = dataSetComponents.data;
                if (pie3DManager) {
                    pie3DManager.configure(dataSetConfig.pieSliceDepth, data.length === 1, dataSetConfig.use3DLighting,
                        false);
                }
            },
            // Pie2D (base) has defaultPlotShadow, but 3d does not.
            defaultPlotShadow: 0,
            //Initialising the pie3D manager class.
            _preDrawCalculate: function () {
                var i,
                    point,
                    chart = this,
                    chartConfig = chart.config,
                    chartComponents = chart.components,
                    precision = 1000,
                    total = 0,
                    dataSet = chartComponents.dataset[0],
                    dataSetConfig = dataSet.config,
                    dataSetComponents = dataSet.components,
                    dataLabelOptions = dataSetConfig.dataLabelOptions,
                    pie3DOptions = (dataSetConfig.pie3DOptions = dataSet._parsePie3DOptions()),
                    startingAngle = (pluck (dataSetConfig.startAngle, 0) % pi2),
                    fontSize,
                    managedPieSliceDepth = dataSetConfig.managedPieSliceDepth,
                    slicedOffset = dataSetConfig.slicedOffset = pie3DOptions.slicedOffset,
                    plotWidth = chartConfig.canvasWidth,
                    plotHeight = chartConfig.canvasHeight,
                    positions = [chartConfig.canvasLeft + plotWidth * 0.5,
                                 chartConfig.canvasTop + plotHeight * 0.5 - managedPieSliceDepth * 0.5],
                    start,
                    pointConfig,
                    end,
                    angle,
                    lastEnd,
                    maxEnd,
                    data = dataSetComponents.data,
                    fraction,
                    smallestSize = mathMin (plotWidth, plotHeight),
                    isPercent,
                    radiusX, // the x component of the radius vector for a given point
                    radiusY,
                    labelDistance = dataLabelOptions.distance,
                    pieYScale = dataSetConfig.pieYScale,

                    slicedOffsetY = dataSetConfig.slicedOffsetY || (dataSetConfig.slicedOffsetY =
                        slicedOffset * dataSetConfig.pieYScale),
                    pie3DManager = dataSetComponents.Pie3DManager;

                // get positions - either an integer or a percentage string must be given
                positions.push ((2 * dataSetConfig.pieMinRadius), pie3DOptions.innerSize || 0);

                positions = map (positions, function (length, i) {
                    isPercent = /%$/.test (length);
                    return isPercent ?
                    // i == 0: centerX, relative to width
                    // i == 1: centerY, relative to height
                    // i == 2: size, relative to smallestSize
                    // i == 4: innerSize, relative to smallestSize
                    [plotWidth, plotHeight - managedPieSliceDepth, smallestSize, smallestSize][i] *
                    pInt (length) / 100:
                    length;
                });


                //convert all diameter into radius
                positions[2] /= 2;
                positions[3] /= 2;
                //Add the ry
                positions.push (positions[2] * pieYScale);
                //centerRadiusX
                positions.push ((positions[2] + positions[3]) / 2);
                //centerRadiusY
                positions.push (positions[5] * pieYScale);

                // utility for getting the x value from a given y, used for anticollision logic in data labels
                dataSet.getX = function (y, left) {

                    angle = math.asin ((y - positions[1]) / (positions[2] + labelDistance));

                    return positions[0] +
                    (left ? -1 : 1) *
                    (mathCos (angle) * (positions[2] + labelDistance));
                };

                // set center for later use
                dataSetConfig.center = positions;

                // get the total sum
                each (data, function (point) {
                    total += point.config.y;
                });

                dataSetConfig.labelsRadius = positions[2] + labelDistance;
                dataSetConfig.labelsRadiusY = dataSetConfig.labelsRadius * pieYScale;
                dataSetConfig.quadrantHeight = (plotHeight - managedPieSliceDepth) / 2;
                dataSetConfig.quadrantWidth = plotWidth / 2;

                lastEnd = startingAngle;

                lastEnd = mathRound (lastEnd * precision) / precision;
                maxEnd = lastEnd + pi2;

                fontSize = pluckNumber (parseInt (dataLabelOptions.style.fontSize, 10), 10) + 4,//2px padding
                dataSetConfig.maxLabels = mathFloor (dataSetConfig.quadrantHeight / fontSize); //max labels per quarter
                dataSetConfig.labelFontSize = fontSize;
                dataSetConfig.connectorPadding = pluckNumber (dataLabelOptions.connectorPadding, 5);
                dataSetConfig.isSmartLineSlanted = pluck (dataLabelOptions.isSmartLineSlanted, true);
                dataSetConfig.connectorWidth = pluckNumber (dataLabelOptions.connectorWidth, 1);
                dataSetConfig.enableSmartLabels = dataLabelOptions.enableSmartLabels;
                if (!pie3DManager) {
                    pie3DManager = dataSetComponents.Pie3DManager = new Pie3DManager (chart);
                    // enabling the tooltip options for slices as it is the parent group being used by the pie3dmanager
                    chart.get('graphics','datasetGroup').trackTooltip(true);
                }
                chart._configureManager();

                // each (data, function (point) {
                for (i = data.length - 1; i >= 0; i -= 1) {
                    point = data[i];
                    pointConfig = point.config;
                    // set start and end angle
                    start = lastEnd;
                    fraction = total ? pointConfig.y / total : 0;

                    lastEnd = mathRound ((lastEnd + (fraction * pi2)) * precision) / precision;
                    if (lastEnd > maxEnd) {
                        lastEnd = maxEnd;
                    }
                    end = lastEnd;

                    // set the shape
                    pointConfig.shapeArgs = {
                        start: mathRound (start * precision) / precision,
                        end: mathRound (end * precision) / precision
                    };

                    // center for the sliced out slice
                    pointConfig.centerAngle = angle = ((end + start) / 2) % pi2;
                    /** @todo: slicedTranslation is implemented as string */
                    pointConfig.slicedTranslation = [
                            mathRound (mathCos (angle) * slicedOffset),
                            mathRound (mathSin (angle) * slicedOffsetY)
                        ];

                    // set the anchor point for tooltips
                    radiusX = mathCos (angle) * positions[2];
                    dataSetConfig.radiusY = radiusY = mathSin (angle) * positions[4];
                    pointConfig.tooltipPos = [
                        positions[0] + radiusX * 0.7,
                        positions[1] + radiusY//changed to reducr mouce on tooltip condition
                    ];

                    // API properties
                    pointConfig.percentage = fraction * 100;
                    pointConfig.total = total;
                }
            },
            placeDataLabels: (function () {
                /*
                 * Pie Helper Functions.
                 */
                var sortArrayByPoint = function (a, b) {
                    return a.point.value - b.point.value;
                },
                sortArrayByAngle = function (a, b) {
                    return a.angle - b.angle;
                },
                alignments = ['start', 'start', 'end', 'end'],
                alignCenter = 'middle',
                ySign = [-1, 1, 1, -1],
                xSign = [1, 1, -1, -1];

                return function (isRotating) {
                    var attr,
                        isNewElem,
                        prevTextPos,
                        chart = this,
                        chartConfig = chart.config,
                        chartComponents = chart.components,
                        dataSet = chartComponents.dataset[0],
                        plotOptions = dataSet.config,
                        plotItems = dataSet.components.data,
                        piePlotOptions = plotOptions.piePlotOptions,
                        canvasLeft = chartConfig.canvasLeft,
                        canvasTop = chartConfig.canvasTop,
                        canvasWidth = chartConfig.canvasWidth,
                        cx = canvasLeft + chartConfig.canvasWidth * 0.5,
                        cy = canvasTop + chartConfig.canvasHeight * 0.5,
                        smartLabel = chart.linkedItems.smartLabel,
                        dataLabelsOptions = plotOptions.dataLabelOptions,
                        style = dataLabelsOptions.style,
                        lineHeight = pluckNumber (mathCeil (parseFloat (style.lineHeight)), 12),
                        placeInside = getFirstValue (dataLabelsOptions.placeInside, false),
                        skipOverlapLabels = dataLabelsOptions.skipOverlapLabels,
                        manageLabelOverflow = dataLabelsOptions.manageLabelOverflow,
                        connectorPadding = dataLabelsOptions.connectorPadding,
                        distanceOption = dataLabelsOptions.distance,
                        connectorWidth = dataLabelsOptions.connectorWidth,
                        remainingHeight,
                        // divide the points into quarters for anti collision
                        quarters = [
                            [], // top right
                            [], // bottom right
                            [], // bottom left
                            [] // top left
                        ],
                        // todo remove the dupliace variables.
                        plotLeft = canvasLeft,
                        plotTop = canvasTop,
                        plotWidth = canvasWidth,
                        labelFontSize = parseInt (style.fontSize, 10),
                        labelHeight = labelFontSize,
                        halfLabelHeight = labelHeight / 2,
                        xDisplacement = [connectorPadding,
                            connectorPadding, -connectorPadding, -connectorPadding
                        ],
                        isSmartLineSlanted = dataLabelsOptions.isSmartLineSlanted,
                        align,
                        i,
                        labelWidth,
                        j,
                        oriY,
                        maxYmayHave,
                        spaceRequired,
                        length,
                        k,
                        sliced,
                        x1,
                        x2,
                        x3,
                        x4,
                        y1,
                        y2,
                        y3,
                        points,
                        point,
                        angle,
                        excess,
                        excessArr,
                        dataLabel,
                        quarter,
                        transX,
                        transY,
                        smartLabelObj,
                        pointConfig,
                        pointGraphics,
                        connector,
                        connectorPath,
                        outside = distanceOption > 0,
                        center = plotOptions.center || (plotOptions.center = [
                            cx,
                            cy,
                            piePlotOptions.size,
                            (piePlotOptions.innerSize || 0)
                        ]),
                        centerY = center[1],
                        centerX = center[0],
                        radius = center[2],
                        radiusY = center[4],
                        dataLabelsRadius = plotOptions.labelsRadius,
                        dataLabelsRadiusY = mathRound (plotOptions.labelsRadiusY * 100) / 100,
                        maxLabels = plotOptions.maxLabels,
                        enableSmartLabels = plotOptions.enableSmartLabels,
                        labelQuardentHeight,
                        maxQuardentLabel,
                        pieSliceDepthHalf = plotOptions.pieSliceDepth / 2,
                        animationObj = chart.get('config', 'animationObj'),
                        animationDuration = isRotating ? 0 : animationObj.duration,
                        mainElm = animationObj.dummyObj,
                        animObj = animationObj.animObj,
                        animType = animationObj.animType,
                        _textCss,
                        _textAttrs,
                        plotDragMove = chart._plotDragMove,
                        plotDragStart = chart._plotDragStart,
                        plotDragEnd = chart._plotDragEnd,
                        plotRollOver = chart._plotRollOver,
                        plotRollOut = chart._plotRollOut,
                        paper = chartComponents.paper,
                        datasetGraphics = dataSet.graphics,
                        dataLabelContainer = datasetGraphics.dataLabelContainer;
                    smartLabel.useEllipsesOnOverflow(chartConfig.useEllipsesWhenOverflow);
                    // save the world if there is no labels to be placed.
                    if (!plotOptions.dataLabelCounter) {
                        return;
                    }
                    if (!isRotating) {
                        //do not set the style every time
                        // Do it for first time
                        smartLabel.setStyle (style);
                    }

                    // arrange points for detection collision
                    // Creates an array of quarter containing labels of each quarter
                    //if there has only one label the draw it inside
                    if (plotItems.length == 1) {

                        point = plotItems[0];
                        pointGraphics = point.graphics;
                        pointConfig = point.config;
                        _textAttrs = pointConfig._textAttrs;
                        _textCss = pointConfig._textCss;
                        dataLabel = pointGraphics.label;
                        connector = pointGraphics.connector;
                        pointConfig.slicedTranslation = [plotLeft, plotTop];
                        if (pointConfig.y !== null && pointConfig.y !== undefined) {
                            _textAttrs.visibility = VISIBLE;
                            _textAttrs['text-anchor'] = alignCenter;
                            _textAttrs.x = centerX;
                            _textAttrs.y = centerY + halfLabelHeight - 2;

                            _textAttrs._x = centerX;
                        }
                        if (!dataLabel) {
                            dataLabel = pointGraphics.label = paper
                            .text(_textAttrs, _textCss, dataLabelContainer)
                            .drag(plotDragMove, plotDragStart, plotDragEnd)
                            .hover(plotRollOver, plotRollOut);
                        }
                        else {
                            dataLabel.animateWith (mainElm, animObj, _textAttrs, animationDuration, animType);
                        }
                        if (_textAttrs._x) {
                            dataLabel.x = _textAttrs._x;
                            delete _textAttrs.x;
                        }
                        dataLabel
                        .data('plotItem', _textAttrs.plotItem)
                        .data(EVENTARGS, _textAttrs.eventArgs);

                        if (_textAttrs.visibility === VISIBLE) {
                            dataLabel.show();
                        }

                        if (connector) {
                            connector.hide();
                        }
                    }
                    else {
                        if (placeInside) {
                            each (plotItems, function (point) {
                                pointGraphics = point.graphics;
                                pointConfig = point.config;
                                _textAttrs = pointConfig._textAttrs;
                                dataLabel = pointGraphics.label;
                                if (pointConfig.y !== null && pointConfig.y !== undefined) {
                                    angle = pointConfig.angle;
                                    y3 = centerY + (center[6] * mathSin (angle)) + halfLabelHeight - 2;
                                    x3 = centerX + (center[5] * mathCos (angle));
                                    _textAttrs._x = x3;
                                    _textAttrs._y = y3;
                                    if (pointConfig.sliced) {
                                        var slicedTranslation = point.slicedTranslation,
                                        transX = slicedTranslation[0] - plotLeft,
                                        transY = slicedTranslation[1] - plotTop;
                                        x3 = x3 + transX;
                                        y3 = y3 + transY;
                                    }
                                    _textAttrs.visibility = VISIBLE;
                                    _textAttrs.align = alignCenter;
                                    _textAttrs.x = x3;
                                    _textAttrs.y = y3;
                                }

                                if (!dataLabel) {
                                    dataLabel = pointGraphics.label = paper
                                    .text(_textAttrs, _textCss, dataLabelContainer)
                                    .drag(plotDragMove, plotDragStart, plotDragEnd)
                                    .hover(plotRollOver, plotRollOut);
                                }
                                else {
                                    dataLabel.animateWith (mainElm, animObj, _textAttrs, animationDuration, animType);
                                }

                                dataLabel
                                .data('plotItem', _textAttrs.plotItem)
                                .data(EVENTARGS, _textAttrs.eventArgs);

                                if (_textAttrs.visibility === VISIBLE) {
                                    dataLabel.show();
                                }

                                dataLabel.x = _textAttrs._x;
                                dataLabel._x = _textAttrs._x;
                                dataLabel._y = _textAttrs._y;
                            });
                        }
                        else { //outside
                            each (plotItems, function (point) {
                                pointGraphics = point.graphics;
                                pointConfig = point.config;
                                _textCss = pointConfig._textCss;
                                _textAttrs = pointConfig._textAttrs;
                                if (!(_textAttrs.text = pointConfig.displayValue)) {
                                    return;
                                }
                                pointGraphics = point.graphics;
                                if (pointConfig.y !== null && pointConfig.y !== undefined) {
                                    dataLabel = pointGraphics.label;
                                    connector = pointGraphics.connector;
                                    connector && connector.show();
                                    dataLabel && dataLabel.show ();
                                }

                                dataLabel = pointGraphics.label;

                                angle = pointConfig.angle;

                                if (angle < 0) {
                                    angle = pi2 + angle;
                                }
                                // Calculate top right quarter labels
                                if (angle >= 0 && angle < piBy2) {
                                    quarter = 1;
                                } else
                                // Calculate bottom right quarter labels
                                if (angle < pi) {
                                    quarter = 2;
                                } else
                                // Calculate bottom left quarter labels
                                if (angle < (pi3By2)) {
                                    quarter = 3;
                                }
                                // Calculate bottom left quarter labels
                                else {
                                    quarter = 0;
                                }
                                // Now put labels according to each quarter
                                quarters[quarter].push ( {
                                    point : point,
                                    angle : angle
                                });

                                /*dataLabel = pointGraphics.label;
                                if (dataLabel) {
                                    angle = pointConfig.angle;

                                    if (angle < 0) {
                                        angle = pi2 + angle;
                                    }
                                    // Calculate top right quarter labels
                                    if (angle >= 0 && angle < piBy2) {
                                        quarter = 1;
                                    } else
                                    // Calculate bottom right quarter labels
                                    if (angle < pi) {
                                        quarter = 2;
                                    } else
                                    // Calculate bottom left quarter labels
                                    if (angle < (pi3By2)) {
                                        quarter = 3;
                                    }
                                    // Calculate bottom left quarter labels
                                    else {
                                        quarter = 0;
                                    }
                                    // Now put labels according to each quarter
                                    quarters[quarter].push ( {
                                        point : point,
                                        angle : angle
                                    });
                                }*/
                            });

                            i = k = 4;
                            //if excess then remove the low value slice first
                            while (i --) {
                                if (skipOverlapLabels) {
                                    // Find labels can fit into the quarters or not
                                    excess = quarters[i].length - maxLabels;
                                    if (excess > 0) {
                                        quarters[i].sort (sortArrayByPoint); // sort by point.y
                                        // remove extra data form the array
                                        // which labels can not be fitted into the quarters
                                        excessArr = quarters[i].splice (0, excess);
                                        //hide all removed labels
                                        for (j = 0, length = excessArr.length; j < length; j += 1) {
                                            point = excessArr[j].point;
                                            pointGraphics = point.graphics;
                                            if (pointGraphics.label) {
                                                pointGraphics.label.attr('visibility', HIDDEN);
                                            }
                                            if (pointGraphics.connector) {
                                                pointGraphics.connector.attr ( {
                                                    visibility: HIDDEN
                                                });
                                            }
                                        }
                                    }
                                }
                                // now we sort the data labels by its label angle
                                quarters[i].sort (sortArrayByAngle);
                            }

                            maxQuardentLabel = mathMax (
                                    quarters[0].length,
                                    quarters[1].length,
                                    quarters[2].length,
                                    quarters[3].length
                                );
                            labelQuardentHeight = mathMax (
                                    mathMin (maxQuardentLabel, maxLabels) * labelHeight,
                                    dataLabelsRadiusY + labelHeight
                                );

                            // reverse 1st and 3rd quardent points
                            quarters[1].reverse ();
                            quarters[3].reverse ();
                            smartLabel.setStyle (style);

                            while (k --) {
                                points = quarters[k];
                                length = points.length;

                                if (!skipOverlapLabels) {
                                    if (length > maxLabels) {
                                        labelHeight = labelQuardentHeight / length;
                                    }
                                    else {
                                        labelHeight = labelFontSize;
                                    }
                                    halfLabelHeight = labelHeight / 2;
                                }

                                //1st pass
                                //place all labels at 1st quarter

                                // calculate the total available space to put labels
                                spaceRequired = length * labelHeight;
                                // calculate the remaining height
                                remainingHeight = labelQuardentHeight;
                                //place all child point
                                for (i = 0; i < length; i += 1, spaceRequired -= labelHeight) {
                                    // Get the y position of the label (radius where data label is to draw)
                                    oriY = mathAbs (labelQuardentHeight * mathSin (points[i].angle));
                                    if (remainingHeight < oriY) {
                                        oriY = remainingHeight;
                                    }
                                    else if (oriY < spaceRequired) {
                                        oriY = spaceRequired;
                                    }
                                    remainingHeight = (points[i].oriY = oriY) - labelHeight;
                                }

                                //2nd pass (reverse)
                                align = alignments[k];
                                //place all labels at 1st quarter
                                maxYmayHave = labelQuardentHeight - ((length - 1) * labelHeight);
                                remainingHeight = 0;

                                //place all child point
                                for (i = points.length - 1; i >= 0; i -= 1, maxYmayHave += labelHeight) {
                                    point = points[i].point;
                                    pointGraphics = point.graphics;
                                    pointConfig = point.config;
                                    _textAttrs = pointConfig._textAttrs;
                                    _textCss = pointConfig._textCss;

                                    if (pointConfig.y === null || !_textAttrs.text) {
                                        continue;
                                    }
                                    angle = points[i].angle;
                                    sliced = pointConfig.sliced;
                                    dataLabel = pointGraphics.label;

                                    oriY = mathAbs (labelQuardentHeight * mathSin (angle));

                                    if (oriY < remainingHeight) {
                                        oriY = remainingHeight;
                                    }
                                    else if (oriY > maxYmayHave) {
                                        oriY = maxYmayHave;
                                    }

                                    remainingHeight = oriY + labelHeight;

                                    y1 = ((oriY + points[i].oriY) / 2);
                                    x1 = centerX + xSign[k] * dataLabelsRadius * mathCos (math.asin (y1 /
                                        labelQuardentHeight));

                                    y1 *= ySign[k];
                                    y1 += centerY;

                                    y2 = centerY + (radiusY * mathSin (angle));
                                    x2 = centerX + (radius * mathCos (angle));

                                    // Relation: centerX <= connectorStartX <= connectorEndX (for right half and vice
                                    // versa for left half)
                                    (k < 2 && x1 < x2 || k > 1 && x1 > x2) && (x1 = x2);

                                    x3 = x1 + xDisplacement[k];
                                    y3 = y1 + halfLabelHeight - 2;
                                    x4 = x3 + xDisplacement[k];

                                    _textAttrs._x = x4;

                                    if (manageLabelOverflow) {
                                        labelWidth = k > 1 ? x4 - canvasLeft: canvasLeft + plotWidth - x4;
                                        smartLabel.setStyle (pointConfig.style);
                                        lineHeight = pluckNumber (mathCeil (parseFloat (pointConfig.style.lineHeight)),
                                            12) + ((mathCeil (parseFloat (pointConfig.style.border), 12) * 2) || 0);
                                        smartLabelObj = smartLabel.getSmartText (pointConfig.displayValue, labelWidth,
                                            lineHeight);
                                        _textAttrs.text = smartLabelObj.text;
                                        _textAttrs.tooltip = smartLabelObj.tooltext;
                                    }

                                    //shift the labels at front pieSliceDepthHalf
                                    if (angle < pi) {
                                        y1 += pieSliceDepthHalf;
                                        y2 += pieSliceDepthHalf;
                                        y3 += pieSliceDepthHalf;
                                    }
                                    _textAttrs._y = y3;
                                    // dataLabel.y = y3;
                                    if (sliced) {

                                        transX = pointConfig.transX;
                                        transY = pointConfig.transY;
                                        x3 = x3 + transX;
                                        x1 = x1 + transX;
                                        x2 = x2 + transX;
                                        y2 = y2 + transY;
                                        x4 = x4 + transX;
                                    }
                                    _textAttrs.visibility = VISIBLE;
                                    _textAttrs['text-anchor'] = align;
                                    prevTextPos = dataLabel && dataLabel.data('textPos');
                                    if (prevTextPos) {
                                        dataLabel.attr({
                                            x: prevTextPos.x,
                                            y: prevTextPos.y
                                        });
                                    }
                                    _textAttrs.x = x4;
                                    _textAttrs.y = y1;
                                    if (!isRotating && prevTextPos) {
                                        dataLabel.animateWith(mainElm, animObj, _textAttrs, animationDuration,
                                            animType);
                                    }
                                    else {
                                        if (!dataLabel) {
                                            dataLabel = pointGraphics.label = paper
                                            .text(_textAttrs, _textCss, dataLabelContainer)
                                            .drag(plotDragMove, plotDragStart, plotDragEnd)
                                            .hover(plotRollOver, plotRollOut);
                                        }
                                        else {
                                            _textAttrs && dataLabel.attr(_textAttrs);
                                        }
                                    }
                                    dataLabel.data('textPos', {
                                        x: x4,
                                        y: y1
                                    })
                                    .data('plotItem', _textAttrs.plotItem)
                                    .data(EVENTARGS, _textAttrs.eventArgs);

                                    dataLabel.x = _textAttrs._x;
                                    // storing original x value
                                    // to use while slicing in (IE Issue original x get changed form animate)
                                    dataLabel._x = _textAttrs._x;
                                    dataLabel.y = _textAttrs._y;

                                    if (_textAttrs.tooltip) {
                                        dataLabel.tooltip(_textAttrs.tooltip);
                                        delete _textAttrs.tooltip;
                                    }
                                    //draw the connector
                                    // draw the connector
                                    if (outside && connectorWidth && enableSmartLabels) {
                                        connector = pointGraphics.connector;
                                        if (!pointConfig.connectorPath) {
                                            isNewElem = true;
                                        }
                                        pointConfig.connectorPath = connectorPath = [
                                            M,
                                            x2, y2, // base
                                            L,
                                            isSmartLineSlanted ? x1 : x2, y1, // first break, next to the label
                                            x3, y1  // end of the string at the label
                                        ];

                                        attr = {
                                            path: connectorPath,
                                            'stroke-width': connectorWidth,
                                            stroke: dataLabelsOptions.connectorColor || '#606060',
                                            visibility: VISIBLE
                                        };
                                        if (connector) {
                                            if (!isRotating && !isNewElem) {
                                                connector.animateWith(mainElm, animObj, attr, animationDuration,
                                                    animType);
                                            }
                                            else {
                                                connector.attr(attr);

                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            } ()),
            animate: function () {
                var i,
                    point,
                    graphic,
                    pointGraphics,
                    pointConfig,
                    element,
                    args,
                    up,
                    start,
                    end,
                    chart = this,
                    chartGraphics = chart.graphics,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    dataSetConfig = dataSet.config,
                    dataSetComponents = dataSet.components,
                    plotItems = dataSetComponents.data,
                    dataSetGroup = chartGraphics.datasetGroup,
                    len = plotItems.length,
                    alphaAnim = dataSetConfig.alphaAnimation,
                    animStartFN = function () {
                        if (chart.disposed || chart.disposing) {
                            return;
                        }
                        chart.placeDataLabels (false);
                    },
                    animationObj = chart.get('config', 'animationObj'),
                    animationDuration = animationObj.duration || 0,
                    mainElm = animationObj.dummyObj,
                    animObj = animationObj.animObj,
                    animType = animationObj.animType;

                if (alphaAnim) {
                    dataSetGroup.attr ( {
                        opacity: 0
                    });
                    dataSetGroup.animateWith(mainElm, animObj, {
                        opacity: 1
                    }, animationDuration, animType, animStartFN);
                }
                else {
                    for (i = 0; i < len; i++) {
                        point = plotItems[i];
                        pointGraphics = point.graphics;
                        pointConfig = point.config;
                        args = pointConfig.shapeArgs;
                        up = 2 * mathPI;
                        element = pointGraphics.element;

                        // start values
                        if (element) {
                            element.attr ( {
                                start: up,
                                end: up
                            });

                            start = args.start;
                            end = args.end;

                           /* Raphael animation do not support start and end attributes.
                            * Since the attribute setting for Pie3D goes through attrFN
                            * method of Pie3DManager, we can safely use some unused
                            * attributes for pie3D to pass through Raphael animation module
                            * and trap the attributes to convert to start and end in attrFN */
                            graphic.animateWith (mainElm, animObj, {
                                cx: start - up,
                                cy: end - up
                            }, animationDuration, animType);
                        }
                    }
                }
            },
            _rotate: function (setAngle) {
                var chart = this,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    dataSetConfig = dataSet.config,
                    dataSetComponents = dataSet.components,
                    data = dataSetComponents.data,
                    slicedOffset = dataSetConfig.slicedOffset,
                    slicedOffsetY = dataSetConfig.slicedOffsetY,
                    startingAngle = dataSetConfig.startAngle,
                    angle;

                setAngle = !isNaN (setAngle) ? setAngle : -dataSetConfig._lastAngle;

                angle = (setAngle - startingAngle) % 360;

                dataSetConfig.startAngle = pluckNumber (setAngle,
                    dataSetConfig.startAngle) % 360;

                angle = - (angle * mathPI) / 180;

                if (dataSetComponents.Pie3DManager) {
                    dataSetComponents.Pie3DManager.rotate (angle);
                }

                each (data, function (point) {
                    var slicedTranslation = [],
                        pointGraphics = point.graphics,
                        pointConfig = point.config,
                        element = pointGraphics.element,
                        args = pointConfig.shapeArgs,
                        newAngleArgs = {
                            start: (args.start += angle),
                            end: (args.end += angle)
                        },
                        pointAngle = pointConfig.angle = normalizeAngle ((newAngleArgs.start + newAngleArgs.end) / 2),
                        sliced = pointConfig.sliced,
                        cosAngle = mathCos (pointAngle),
                        sinAngle = mathSin (pointAngle);

                    //set the  slicedTranslation
                    slicedTranslation = pointConfig.slicedTranslation = [
                        mathRound (cosAngle * slicedOffset),
                        mathRound (sinAngle * slicedOffsetY)
                    ];

                    pointConfig.transX = slicedTranslation[0];
                    pointConfig.transY = slicedTranslation[1];
                    pointConfig.slicedX = sliced ? mathCos (angle) * slicedOffset : 0;
                    pointConfig.slicedY = sliced ? mathSin (angle) * slicedOffsetY : 0;

                    if (element && sliced) {
                        element.attr ( {
                            transform: 't' + slicedTranslation[0] + ',' + slicedTranslation[1]
                        });

                    }

                });

                chart.placeDataLabels (true, data);

            },
            _plotRollOver: function (e) {
                var plotItem = this.data ('plotItem'),
                    index = plotItem.index,
                    chart = plotItem.chart,
                    chartConfig = chart.config,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    dataSetConfig = dataSet.config,
                    dataSetComponents = dataSet.components,
                    data = dataSetComponents.data[index],
                    setGraphics = data.graphics,
                    setConfig = data.config,
                    element = setGraphics.element,
                    hoverEffects = setConfig.hoverEffects;
                if (!dataSetConfig.isRotating) {
                    plotEventHandler.call (element, chart, e, ROLLOVER);
                    hoverEffects.enabled && element.attr(hoverEffects);
                }
                chartConfig.isHovered = true;
            },

            _plotRollOut: function (e) {
                var plotItem = this.data ('plotItem'),
                    index = plotItem.index,
                    chart = plotItem.chart,
                    chartConfig = chart.config,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    dataSetConfig = dataSet.config,
                    dataSetComponents = dataSet.components,
                    data = dataSetComponents.data[index],
                    setGraphics = data.graphics,
                    setConfig = data.config,
                    element = setGraphics.element;

                if (!dataSetConfig.isRotating) {
                    plotEventHandler.call (element, chart, e, ROLLOUT);
                    element.attr({
                        color: setConfig.color.color.split(',')[0],
                        alpha: setConfig._3dAlpha,
                        borderWidth: setConfig.borderWidth,
                        borderColor: setConfig.borderColor
                    });
                }
                chartConfig.isHovered = false;
            },

            _plotDragStart: function (x, y, evt) {
                var plotItem = this.data ('plotItem'),
                    chart = plotItem.chart,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    dataSetConfig = dataSet.config,
                    angle;

                dataSetConfig.isRightClicked = !hasTouch && (evt.button !== 0 && evt.button !== 1) ? true : false;
                if (!dataSetConfig.enableRotation || dataSetConfig.isRightClicked) {
                    return;
                }

                dataSetConfig.isRotating = false;
                angle = getClickArcTangent.call (evt, x, y, dataSetConfig.center,
                    (dataSetConfig.chartPosition = getPosition(chart.linkedItems.container)), dataSetConfig.pieYScale);
                dataSetConfig.dragStartAngle = angle;
                dataSetConfig._lastAngle = -dataSetConfig.startAngle;
                dataSetConfig.startingAngleOnDragStart = dataSetConfig.startAngle;
            },

            _plotDragEnd: function (e) {
                var plotItem = this.data ('plotItem'),
                    index = plotItem.index,
                    chart = plotItem.chart,
                    chartConfig = chart.config,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    dataSetConfig = dataSet.config,
                    dataSetComponents = dataSet.components,
                    Pie3DManager = dataSetComponents.Pie3DManager,
                    startingAng = dataSetConfig.startAngle;
                    // save state
                    /*reflowUpdate = {
                        hcJSON: {
                            series: [ {
                                startAngle: startingAng
                            }]
                        }
                    };*/
                /*if (!chart.disposed) {
                    extend2 (chart.logic.chartInstance.jsVars._reflowData,
                                reflowUpdate, true);
                }*/

                if (dataSetConfig.isRightClicked) {
                    return;
                }
                if (dataSetConfig.isRotating) {
                    /* The events mouseup, dragend and click are raised in order. In order
                     * to update the flag isRotating to false post click event, setTimeout
                     * called, to take immediate effect, is programmed to update the flag.
                     * Thus, the flag gets updated post the series of events, in effect.
                     * NB: Click event is subscribed conditionally.
                     */
                    setTimeout (function () {
                        dataSetConfig.isRotating = false;
                    }, 0);
                    /**
                     * @event FusionCharts#rotationEnd
                     * @group chart:pie-slice
                     *
                     * @param { number} startingAngle - The initial angle. (desc)
                     * @param { number} changeInAngle - It is the difference between the starting angle and the starting
                     * angle on the drag start.
                     */
                    global.raiseEvent ('rotationEnd', {
                        startingAngle: normalizeAngle (startingAng, true),
                        changeInAngle: startingAng - dataSetConfig.startingAngleOnDragStart
                    }, chart.chartInstance);

                    !chartConfig.isHovered && Pie3DManager.colorObjs[index] &&
                        Pie3DManager.onPlotHover (index, false);
                }
                else {
                    chart._plotGraphicClick.call (this,e);
                }
            },

            _plotDragMove: function (dx, dy, x, y, evt) {
                var plotItem = this.data ('plotItem'),
                    chart = plotItem.chart,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    dataSetConfig = dataSet.config,
                    angle,
                    currentTime,
                    deltaAngle;

                if (isNaN(dx) || isNaN(dy) || !dataSetConfig.enableRotation || dataSetConfig.singletonCase ||
                    dataSetConfig.isRightClicked) {
                    return;
                }

                angle = getClickArcTangent.call (evt, x, y, dataSetConfig.center,
                            dataSetConfig.chartPosition, dataSetConfig.pieYScale);

                if (!dataSetConfig.isRotating) {
                    dataSetConfig.dragStartAngle !== angle && (dataSetConfig.isRotating = true);
                    /**
                     * This event is fired when a pie or doughnut chart's rotation is triggered.
                     *
                     * @event FusionCharts#rotationStart
                     * @group chart:pie-slice
                     * @param { number} startingAngle - This indicates the angle from where rotation started.
                     */
                    global.raiseEvent ('rotationStart', { startingAngle: normalizeAngle (dataSetConfig.startAngle,
                        true)}, chart.chartInstance);
                }

                deltaAngle = angle - dataSetConfig.dragStartAngle;

                dataSetConfig.dragStartAngle = angle;
                dataSetConfig.moveDuration = 0;

                dataSetConfig._lastAngle += (deltaAngle * 180 / mathPI);
                currentTime = new Date ().getTime ();

                if (!dataSetConfig._lastTime || (dataSetConfig._lastTime + dataSetConfig.timerThreshold <
                    currentTime)) {
                    if (!dataSetConfig._lastTime) {
                        chart._rotate ();
                    }
                    dataSetConfig.timerId  = setTimeout (function () {
                        if (!chart.disposed || !chart.disposing) {
                            chart._rotate ();
                        }
                    }, dataSetConfig.timerThreshold);
                    dataSetConfig._lastTime  = currentTime;
                }
            },
            // manages the spaces when no radius is given.
            _stubRadius: function (chartWorkingWidth, labelMaxW, chartWorkingHeight, labelDistance, slicingDistance,
                lineHeight, pieMinRadius) {
                var chart = this,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    conf = dataSet.config,
                    fcJSONChart = dataSet.config,
                    userGivenSlicingDist = pluckNumber (fcJSONChart.slicingdistance),
                    dataLabelOptions = conf.dataLabelOptions ||
                        (conf.dataLabelOptions = dataSet._parseDataLabelOptions ()),
                    availableRadius = 0,
                    // Slicing distance can not be less then the MINSLICINGDIST (10)
                    MINSLICINGDIST = 10,
                    pieYScale = conf.pieYScale,
                    pieSliceDepth = conf.pieSliceDepth,
                    shortFall;
                chartWorkingHeight -= pieSliceDepth;
                availableRadius = mathMin ((chartWorkingWidth / 2) - labelMaxW - slicingDistance,
                    ((chartWorkingHeight / 2) - lineHeight) / pieYScale) - labelDistance;

                if (availableRadius >= pieMinRadius) { //there has space for min width
                    pieMinRadius = availableRadius;
                }
                else if (!userGivenSlicingDist) { /** @todo smartyfy Labels */
                    // If slicing distance is not given by the user, adjust slicing distance based on pie radius.
                    shortFall = pieMinRadius - availableRadius;
                    // Now reduce the pie slicing distance, but restrict the minimum slicing distance to 10 pixels.
                    slicingDistance = labelDistance = mathMax (mathMin (labelDistance - shortFall,
                        slicingDistance), MINSLICINGDIST);
                }
                conf.slicingDistance = slicingDistance;
                conf.pieMinRadius = pieMinRadius;
                dataLabelOptions.distance = labelDistance;

                return pieMinRadius;
            },
            _startingAngle: function (angle, relative) {
                var ang,
                    chart = this,
                    dataSet = chart.components.dataset[0],
                    seriesData = dataSet.config,
                    // Angle is differently handled in Pie2D and Pie3D. So, angles is converted
                    // accordingly to the same base. Its radian in 2D while in degrees in 3D.
                    // Moreover, sense of positive angle is opposite in the two.
                    currentAngle = (ang = seriesData.startAngle) + (ang < 0 ? 360 : 0);

                if (!isNaN(angle)) {
                    if (!(seriesData.singletonCase || seriesData.isRotating)) {
                        angle += relative ? currentAngle : 0;
                        chart._rotate(angle);
                        currentAngle = angle;
                    }
                }
                // Angle normalised in the range of [0, 360]
                return mathRound(((currentAngle %= 360) + (currentAngle < 0 ? 360 : 0)) * 100) / 100;
            }
        }, chartAPI.pie2d, {
            plotborderthickness: 0.1,
            alphaanimation: 1
        });

        chartAPI ('doughnut2d', {
            friendlyName: 'Doughnut Chart',
            defaultDatasetType : 'Doughnut2D',
            creditLabel: creditLabel,
            applicableDSList: {
                'Doughnut2D': true
            },
            getPointColor: function (color, alpha, radius3D) {
                var colorObj,
                    loLight,
                    hiLight;

                color = getFirstColor (color);
                alpha = getFirstAlpha (alpha);

                // Radial gradient is not supported in VML, hence we use for SVG
                // alone.
                if (radius3D < 100 && hasSVG) {
                    loLight = getDarkColor (color,
                        mathFloor ((85 - 0.2 * (100 - radius3D)) * 100) / 100);

                    hiLight = getLightColor (color,
                        mathFloor ((100 - 0.5 * radius3D) * 100) / 100);

                    colorObj = {
                        FCcolor: {
                            color: loLight + COMMA + hiLight + COMMA + hiLight +
                                COMMA + loLight,
                            alpha: alpha + COMMA + alpha + COMMA + alpha + COMMA + alpha,
                            radialGradient: true,
                            gradientUnits: 'userSpaceOnUse',
                            r: radius3D
                        }
                    };
                }
                else {
                    /** @todo replace the single shade radial to solid fill */
                    colorObj = {
                        FCcolor: {
                            color: color + COMMA + color,
                            alpha: alpha + COMMA + alpha,
                            ratio: '0,100'
                        }
                    };
                }

                return colorObj;
            },
            drawDoughnutCenterLabel: function (labelText, cx, cy, dx, dy, centerLabelConfig, updateConfig) {
                var chart = this,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    seriesData = dataSet.config,
                    labelConfig = centerLabelConfig || seriesData.lastCenterLabelConfig,
                    paper = chartComponents.paper,
                    smartLabel = chart.linkedItems.smartLabel,
                    chartGraphics = chart.graphics,
                    grp = chartGraphics.datasetGroup,
                    labelPadding = labelConfig.padding,
                    textpadding = labelConfig.textPadding * 2,
                    cssObj = {
                        fontFamily: labelConfig.font,
                        fontSize: labelConfig.fontSize + 'px',
                        lineHeight: (1.2 * labelConfig.fontSize) + 'px',
                        fontWeight: labelConfig.bold ? 'bold' : '',
                        fontStyle: labelConfig.italic ? 'italic' : ''
                    },
                    txtW = ((dx * 0.5 - labelPadding) * 1.414) - textpadding,
                    txtH = ((dy * 0.5 - labelPadding) * 1.414) - textpadding,
                    centerLabel,
                    smartLabelObj,
                    labelOvalBg;

                smartLabel.setStyle(cssObj);
                smartLabel.useEllipsesOnOverflow(chart.config.useEllipsesWhenOverflow);
                smartLabelObj = smartLabel.getSmartText(labelText, txtW, txtH);

                if (!(centerLabel = chartGraphics.doughnutCenterLabel)) {
                    labelConfig.bgOval &&
                        (chartGraphics.centerLabelOvalBg = labelOvalBg = paper.circle(cx, cy, dx * 0.5 - labelPadding,
                            grp));
                    centerLabel = chartGraphics.doughnutCenterLabel = paper.text(grp)
                        .hover(chart.centerLabelRollover, chart.centerLabelRollout)
                        .click(chart.centerLabelClick);
                    /** @todo: Fix reference issue */
                    centerLabel.chart = chart;
                }
                else {
                    centerLabel.attr('text') !== labelText && chart.centerLabelChange(labelText);
                    labelOvalBg = chartGraphics.centerLabelOvalBg;
                }

                if (labelText) {
                    centerLabel.css(cssObj)
                        .attr({
                            x: cx,
                            y: cy,
                            text: smartLabelObj.text,
                            visibility: VISIBLE,
                            direction: seriesData.textDirection,
                            //title: labelConfig.toolText ? '' : smartLabelObj.tooltext || '',
                            fill: toRaphaelColor({
                                FCcolor: {
                                    color: labelConfig.color,
                                    alpha: labelConfig.alpha
                                }
                            }),
                            'text-bound': labelConfig.bgOval ? 'none' : [
                                toRaphaelColor({
                                    FCcolor: {
                                        color: labelConfig.bgColor,
                                        alpha: labelConfig.bgAlpha
                                    }
                                }),
                                toRaphaelColor({
                                    FCcolor: {
                                        color: labelConfig.borderColor,
                                        alpha: labelConfig.borderAlpha
                                    }
                                }),
                                labelConfig.borderThickness,
                                labelConfig.textPadding,
                                labelConfig.borderRadius
                            ]
                        })
                        .tooltip(labelConfig.toolText || smartLabelObj.tooltext);

                    if (labelConfig.bgOval) {
                        labelOvalBg && labelOvalBg.attr({
                            visibility: VISIBLE,
                            fill: hashify(labelConfig.bgColor),
                            'fill-opacity': labelConfig.bgAlpha / 100,
                            stroke: hashify(labelConfig.borderColor),
                            'stroke-width': labelConfig.borderThickness,
                            'stroke-opacity': labelConfig.borderAlpha / 100
                        });
                    }
                }
                else {
                    centerLabel.attr('visibility', HIDDEN);
                    labelOvalBg && labelOvalBg.attr('visibility', HIDDEN);
                }

                if (updateConfig) {
                    seriesData.lastCenterLabelConfig = labelConfig;
                    seriesData.centerLabelConfig = labelConfig;
                }
            },

            centerLabelRollover: function () {
                var chart = this.chart,
                    chartComponents = chart.components,
                    chartConfig = chart.config,
                    dataSet = chartComponents.dataset[0],
                    chartInstance = chart.chartInstance,
                    seriesData = dataSet.config,
                    ref = chartInstance.ref,
                    labelConfig = seriesData.lastCenterLabelConfig,
                    eventArgs = {
                        height: chartConfig.height,
                        width: chartConfig.width,
                        pixelHeight: ref.offsetHeight,
                        pixelWidth: ref.offsetWidth,
                        id: chartInstance.id,
                        renderer: chartInstance.args.renderer,
                        container: chart.linkedItems.container,
                        centerLabelText: labelConfig && labelConfig.label
                    };
                /**
                 * This event is fired on mouse rollover on label at center of doughnut 2D.
                 *
                 * > Available on `doughnut` chart only.
                 *
                 * @group chart:pie-center-label
                 * @event FusionCharts#centerLabelRollover
                 *
                 * @param {string} centerLabelText - is the text for display at center label
                 * @param {number} chartX - is the relative X-Cordinate to chart container where the chart was clicked
                 * @param {number} chartY - is the relative Y-Cordinate to chart container where the chart was clicked.
                 * @param {string} container - is the DOM element where the chart is being rendered.
                 * @param {numeric|percent} height - height of the chart
                 * @param {numeric|percent} width - width of the chart
                 * @param {string} id - is the chart id
                 * @param {number} pageX - is the relative X-Cordinate to screen where the chart is clicked
                 * @param {number} pageY - is the relative Y-Cordinate to screen where the chart is clicked
                 * @param {number} pixelHeight - is the height of the DOM element where the chart is being rendered in
                 * pixels
                 * @param {number} pixelWidth - is the width of the DOM element where the chart is being rendered in
                 * pixels
                 * @param {string} renderer - tells if the chart is rendered using JavaScript or Flash
                 */
                this.attr('text') && global.raiseEvent('centerLabelRollover',
                    eventArgs, chartInstance, this, chart.hoverOnCenterLabel);
            },

            centerLabelRollout: function () {
                var chart = this.chart,
                    chartConfig = chart.config,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    chartInstance = chart.chartInstance,
                    ref = chartInstance.ref,
                    seriesData = dataSet.config,
                    labelConfig = seriesData.lastCenterLabelConfig,
                    eventArgs = {
                        height: chartConfig.height,
                        width: chartConfig.width,
                        pixelHeight: ref.offsetHeight,
                        pixelWidth: ref.offsetWidth,
                        id: chartInstance.id,
                        renderer: chartInstance.args.renderer,
                        container: chart.linkedItems.container,
                        centerLabelText: labelConfig && labelConfig.label
                    };
                /**
                 * This event is fired on mouse rollout from label at center of
                 * doughnut 2D.
                 *
                 * > Available on `doughnut` chart only.
                 *
                 * @group chart:pie-center-label
                 * @event FusionCharts#centerLabelRollout
                 *
                 * @param {string} centerLabelText - is the text for display at center label
                 * @param {number} chartX - is the relative X-Cordinate to chart container where the chart was clicked
                 * @param {number} chartY - is the relative Y-Cordinate to chart container where the chart was clicked.
                 * @param {string} container - is the DOM element where the chart is being rendered.
                 * @param {numeric|percent} height - height of the chart
                 * @param {numeric|percent} width - width of the chart
                 * @param {string} id - is the chart id
                 * @param {number} pageX - is the relative X-Cordinate to screen where the chart is clicked
                 * @param {number} pageY - is the relative Y-Cordinate to screen where the chart is clicked
                 * @param {number} pixelHeight - is the height of the DOM element where the chart is being rendered in
                 * pixels
                 * @param {number} pixelWidth - is the width of the DOM element where the chart is being rendered in
                 * pixels
                 * @param {string} renderer - tells if the chart is rendered using JavaScript or Flash
                 */
                this.attr('text') && global.raiseEvent('centerLabelRollout', eventArgs, chartInstance, this,
                    chart.hoverOffCenterLabel);
            },

            centerLabelClick: function () {
                var chart = this.chart,
                    chartConfig = chart.config,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    chartInstance = chart.chartInstance,
                    ref = chartInstance.ref,
                    seriesData = dataSet.config,
                    labelConfig = seriesData.lastCenterLabelConfig,
                    eventArgs = {
                        height: chartConfig.height,
                        width: chartConfig.width,
                        pixelHeight: ref.offsetHeight,
                        pixelWidth: ref.offsetWidth,
                        id: chartInstance.id,
                        renderer: chartInstance.args.renderer,
                        container: chart.linkedItems.container,
                        centerLabelText: labelConfig && labelConfig.label
                    };
                /**
                 * This event is fired on click on label at center of doughnut 2D.
                 *
                 * > Available on `doughnut` chart only.
                 *
                 * @group chart:pie-center-label
                 * @event FusionCharts#centerLabelClick
                 *
                 * @param {string} centerLabelText - is the text for display at center label.
                 * @param {number} chartX - is the relative X-Cordinate to chart container where the chart was clicked.
                 * @param {number} chartY - is the relative Y-Cordinate to chart container where the chart was clicked.
                 * @param {string} container - is the DOM element where the chart is being rendered.
                 * @param {numeric|percent} height - height of the chart
                 * @param {numeric|percent} width - width of the chart
                 * @param {string} id - is the chart id
                 * @param {number} pageX - is the relative X-Cordinate to screen where the chart is clicked
                 * @param {number} pageY - is the relative Y-Cordinate to screen where the chart is clicked
                 * @param {number} pixelHeight - is the height of the DOM element where the chart is being rendered in
                 * pixels
                 * @param {number} pixelWidth - is the width of the DOM element where the chart is being rendered in
                 * pixels
                 * @param {string} renderer - tells if the chart is rendered using JavaScript or Flash
                 */
                this.attr('text') && global.raiseEvent('centerLabelClick', eventArgs, chartInstance);
            },

            centerLabelChange: function (labelText) {
                var chart = this,
                    chartConfig = chart.config,
                    chartInstance = chart.chartInstance,
                    ref = chartInstance.ref,
                    eventArgs = {
                        height: chartConfig.height,
                        width: chartConfig.width,
                        pixelHeight: ref.offsetHeight,
                        pixelWidth: ref.offsetWidth,
                        id: chartInstance.id,
                        renderer: chartInstance.args.renderer,
                        container: chart.linkedItems.container,
                        centerLabelText: labelText
                    };
                /**
                 * This event is fired on change of label at center of doughnut 2D.
                 *
                 * > Available on `doughnut` chart only.
                 *
                 * @group chart:pie-center-label
                 * @event FusionCharts#centerLabelChanged
                 *
                 * @param {string} centerLabelText - is the text for display at center label
                 * @param {number} chartX - is the relative X-Cordinate to chart container where the chart was clicked
                 * @param {number} chartY - is the relative Y-Cordinate to chart container where the chart was clicked.
                 * @param {string} container - is the DOM element where the chart is being rendered.
                 * @param {numeric|percent} height - height of the chart
                 * @param {numeric|percent} width - width of the chart
                 * @param {string} id - is the chart id
                 * @param {number} pageX - is the relative X-Cordinate to screen where the chart is clicked
                 * @param {number} pageY - is the relative Y-Cordinate to screen where the chart is clicked
                 * @param {number} pixelHeight - is the height of the DOM element where the chart is being rendered in
                 * pixels
                 * @param {number} pixelWidth - is the width of the DOM element where the chart is being rendered in
                 * pixels
                 * @param {string} renderer - tells if the chart is rendered using JavaScript or Flash
                 */
                global.raiseEvent('centerLabelChanged', eventArgs, chartInstance);
            },

            hoverOnCenterLabel: function () {
                var chart = this.chart,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    seriesData = dataSet.config,
                    labelConfig = seriesData.lastCenterLabelConfig;

                if (labelConfig.hoverColor || labelConfig.hoverAlpha) {
                    this.attr({fill: toRaphaelColor({
                            FCcolor: {
                                color: labelConfig.hoverColor || labelConfig.color,
                                alpha: labelConfig.hoverAlpha || labelConfig.alpha
                            }
                        })
                    });
                }
            },

            hoverOffCenterLabel: function () {
                var chart = this.chart,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    seriesData = dataSet.config,
                    labelConfig = seriesData.lastCenterLabelConfig;

                if (labelConfig.hoverColor || labelConfig.hoverAlpha) {
                    this.attr({fill: toRaphaelColor({
                            FCcolor: {
                                color: labelConfig.color,
                                alpha: labelConfig.alpha
                            }
                        })
                    });
                }
            }
        }, chartAPI.pie2d, {
            singletonPlaceValue: false
        });

        chartAPI ('doughnut3d', {
            friendlyName: '3D Doughnut Chart',
            defaultDatasetType : 'Doughnut3D',
            creditLabel: creditLabel,
            applicableDSList: {
                'Doughnut3D': true
            },
            _configureManager: function () {
                var chart = this,
                    chartComponents = chart.components,
                    dataSet = chartComponents.dataset[0],
                    dataSetConfig = dataSet.config,
                    dataSetComponents = dataSet.components,
                    pie3DManager = dataSetComponents.Pie3DManager,
                    data = dataSetComponents.data;

                if (pie3DManager) {
                    pie3DManager.configure(dataSetConfig.pieSliceDepth, data.length === 1, dataSetConfig.use3DLighting,
                        true);
                }
            }
        }, chartAPI.pie3d);

        chartAPI ('mscolumn2d', {
            standaloneInit: true,
            friendlyName: 'Multi-series Column Chart',
            creditLabel: creditLabel,
            defaultDatasetType : 'column',
            applicableDSList: { 'column': true },
            eiMethods : { }
        }, chartAPI.mscartesian);

        chartAPI ('mscolumn3d', {
            standaloneInit: true,
            defaultDatasetType: 'column3d',
            friendlyName: 'Multi-series 3D Column Chart',
            applicableDSList: { 'column3d': true },
            // Default shadow is visible for 3D variant of MSColumn2D chart
            defaultPlotShadow: 1,
            fireGroupEvent: true,
            is3D: true,
            creditLabel: creditLabel,
            defaultZeroPlaneHighlighted: false
        }, chartAPI.mscartesian3d, {
            showplotborder: 0
        });

        chartAPI ('msbar2d', {
            standaloneInit: true,
            friendlyName: 'Multi-series Bar Chart',
            isBar: true,
            hasLegend: true,
            creditLabel: creditLabel,
            defaultDatasetType: 'bar2d',
            applicableDSList: { 'bar2d': true }
        }, chartAPI.msbarcartesian);


        chartAPI ('msbar3d', {
            standaloneInit: true,
            defaultSeriesType: 'bar3d',
            friendlyName: 'Multi-series 3D Bar Chart',
            fireGroupEvent: true,
            defaultPlotShadow: 1,
            is3D: true,
            isBar: true,
            hasLegend: true,
            creditLabel: creditLabel,
            defaultZeroPlaneHighlighted: false,
            defaultDatasetType: 'bar3d',
            applicableDSList: { 'bar3d': true }
        }, chartAPI.msbarcartesian3d, {
            showplotborder: 0
        });

        chartAPI ('msarea', {
            standaloneInit: true,
            friendlyName: 'Multi-series Area Chart',
            creditLabel: creditLabel,
            defaultDatasetType : 'area',
            defaultPlotShadow: 0,
            applicableDSList: { 'area': true }
        }, chartAPI.areabase);

        chartAPI ('msline', {
            standaloneInit: true,
            friendlyName: 'Multi-series Line Chart',
            creditLabel: creditLabel,
            defaultDatasetType : 'line',
            defaultPlotShadow: 1,
            axisPaddingLeft: 0,
            axisPaddingRight: 0,
            applicableDSList: { 'line': true }
        }, chartAPI.areabase, {
            zeroplanethickness: 1,
            zeroplanealpha: 40,
            showzeroplaneontop: 0
        });

        chartAPI ('stackedarea2d', {
            friendlyName: 'Stacked Area Chart',
            showsum: 0,
            creditLabel: creditLabel
        }, chartAPI.msarea, {
            plotfillalpha: HUNDREDSTRING,
            isstacked: 1
        });

        chartAPI ('stackedcolumn2d', {
            friendlyName: 'Stacked Column Chart',
            creditLabel: creditLabel
        }, chartAPI.mscolumn2d, {
            isstacked: true
        });

        chartAPI ('stackedcolumn3d', {
            friendlyName: '3D Stacked Column Chart',
            creditLabel: creditLabel
        }, chartAPI.mscolumn3d, {
            showplotborder: 0
        }, chartAPI.stackedcolumn2d);

        chartAPI ('stackedbar2d', {
            friendlyName: 'Stacked Bar Chart',
            creditLabel: creditLabel
        }, chartAPI.msbar2d, {
            maxbarheight: 50
        }, chartAPI.stackedcolumn2d);

        chartAPI ('stackedbar3d', {
            friendlyName: '3D Stacked Bar Chart',
            creditLabel: creditLabel
        }, chartAPI.msbar3d, {
            showplotborder: 0
        }, chartAPI.stackedcolumn2d);

        chartAPI ('marimekko', {
            standaloneInit: true,
            friendlyName: 'Marimekko Chart',
            isValueAbs: true,
            distributedColumns: true,
            stack100percent: true,
            defaultDatasetType: 'marimekko',
            applicableDSList: {'marimekko': true},
            isStacked: true,
            showsum: 1,
            creditLabel: creditLabel,
            _setAxisLimits : function () {
                var iapi = this,
                    components = iapi.components,
                    dataset = components.dataset,
                    yAxis = components.yAxis,
                    xAxis = components.xAxis,
                    currentDataset,
                    length = dataset.length,
                    i,
                    infMin = -Infinity,
                    infMax = +Infinity,
                    max = infMin,
                    min = infMax,
                    xMin = infMax,
                    xMax = infMin,
                    lastXPos,
                    maxminObj,
                    groupManager,
                    xLimit,
                    xRange,
                    len,
                    catLen,
                    value,
                    catXVal,
                    groupManagerObj = { },
                    categories = iapi.config.categories,
                    stackPercentValue,
                    stackValWidth,
                    noManager = [],
                    getMaxMin = function (maxminObj) {
                        max = mathMax (max, maxminObj.max);
                        min = mathMin (min, maxminObj.min);
                        xMax = mathMax (xMax, maxminObj.xMax || infMin);
                        xMin = mathMin (xMin, maxminObj.xMin || infMax);

                    };

                for (i=0; i<length; i++) {
                    currentDataset = dataset[i];
                    groupManager = currentDataset.groupManager;
                    if (groupManager) {
                        groupManagerObj[currentDataset.type] = groupManager;
                    }
                    else {
                        noManager.push (currentDataset);
                    }
                }

                for (groupManager in groupManagerObj) {
                    maxminObj = groupManagerObj[groupManager].getDataLimits ();
                    getMaxMin (maxminObj);
                }

                length =noManager.length;
                for (i=0; i<length; i++) {
                    maxminObj = noManager[i].getDataLimits ();
                    getMaxMin (maxminObj);
                }

                (max === -Infinity) && (max = 0);
                (min === +Infinity) && (min = 0);

                yAxis[0].setAxisConfig ( {
                    isPercent : iapi.config.isstacked ? iapi.config.stack100percent : 0
                });
                yAxis[0].setDataLimit (max, min);
                if ((xMax !== infMin) || (xMin !== infMax)) {
                    xAxis[0].config.xaxisrange = {
                        max : xMax,
                        min : xMin
                    };
                    xAxis[0].setDataLimit (xMax, xMin);
                }
                // get the stack sum values and calculate the stack width
                stackPercentValue = groupManagerObj[groupManager].getStackSumPercent();
                len = stackPercentValue.length;
                catLen = xAxis[0].getCategoryLen();
                if (catLen > len) {
                    categories.splice(len, catLen - len);
                }
                iapi._setCategories();
                xLimit = xAxis[0].getLimit();
                xMin = xLimit.min;
                xMax = xLimit.max;
                lastXPos = xMin;

                xRange = xMax - xMin;
                for (i = 0; i < stackPercentValue.length; i++) {
                    value = stackPercentValue[i];
                    stackValWidth = xRange * value/100;
                    catXVal = lastXPos + (stackValWidth / 2);
                    xAxis[0].updateCategory(i, {x: catXVal});
                    lastXPos += stackValWidth;
                }
            }
        }, chartAPI.mscartesian, {
            isstacked: true,
            showpercentvalues: 0,
            usepercentdistribution: 1,
            showsum: 1
        });

        chartAPI ('msstackedcolumn2d', {
            standaloneInit: true,
            defaultDatasetType: 'column',
            applicableDSList: { 'column': true },
            friendlyName: 'Multi-series Stacked Column Chart',
            _createDatasets: function () {
                var iapi = this,
                    components = iapi.components,
                    dataObj = iapi.jsonData,
                    dataset = dataObj.dataset,
                    length = (dataset && dataset.length) || 0,
                    i,
                    j,
                    datasetStore,
                    datasetObj,
                    defaultSeriesType = iapi.defaultDatasetType,
                    applicableDSList = iapi.applicableDSList,
                    GroupManager,
                    dsType,
                    DsClass,
                    DsGroupClass,
                    datasetJSON,
                    groupManagerName,
                    parentDataObj,
                    innerLength,
                    lineSets = dataObj.lineset || [],
                    lineSetJSON,
                    config = iapi.config,
                    dataSetMap = config.dataSetMap,
                    lineSetMap = config.lineSetMap,
                    dataSetMapLen = dataSetMap && dataSetMap.length,
                    legend = components.legend,
                    tempDataStoreMap = [],
                    tempLineStoreMap = [],
                    datasetIndex = 0,
                    currDataLength,
                    prevDataLength,
                    prevLineSetLen,
                    prevData,
                    k = 0,
                    len,
                    inited,
                    positionIndex = -1,
                    dataSet,
                    currCatLen,
                    catLen = iapi.config.catLen,
                    xAxis = components.xAxis[0],
                    dataDiff,
                    diff,
                    catDiff,
                    startIndex,
                    diffObj,
                    properDsStructure,
                    currentDataStore = components.dataset,
                    prevDSInnerLen;

                if (!dataset && lineSets.length === 0) {
                    iapi.setChartMessage();
                    return;
                }

                iapi.config.categories = dataObj.categories && dataObj.categories[0].category;

                datasetStore = components.dataset = [];

                for (j=0; j<length; j++) {
                    parentDataObj = dataset[j];
                    positionIndex ++;
                    if (parentDataObj.dataset) {
                        properDsStructure = true;
                        innerLength = (parentDataObj.dataset && parentDataObj.dataset.length) || 0;
                        tempDataStoreMap[j] = [];
                        for (i=0; i<innerLength; i++) {

                            datasetJSON = parentDataObj.dataset[i];
                            dsType = pluck (datasetJSON.renderas, defaultSeriesType);
                            dsType = dsType && dsType.toLowerCase ();
                            if (!applicableDSList[dsType]) {
                                dsType = defaultSeriesType;
                            }

                            /// get the DsClass
                            DsClass = FusionCharts.get('component', ['dataset', dsType]);
                            if (DsClass) {
                                groupManagerName = 'datasetGroup_' + dsType;
                                // get the ds group class
                                DsGroupClass = FusionCharts.register('component', ['datasetGroup', dsType]);
                                GroupManager = components[groupManagerName];
                                if (DsGroupClass && !GroupManager) {
                                    GroupManager = components[groupManagerName] = new DsGroupClass ();
                                    GroupManager.chart = iapi;
                                    GroupManager.init ();
                                }
                                // Resetting the groupManager object if it is an update.
                                else if (GroupManager && (dataSetMap && dataSetMap.length !== 0) && !inited) {
                                    GroupManager.init ();
                                    inited = true;
                                }

                                // If the dataset does not exists.
                                if (!(dataSetMap && dataSetMap[j] && dataSetMap[j][i])) {
                                // create the dataset Object
                                    datasetObj = new DsClass ();
                                    datasetObj.chart = iapi;
                                    datasetObj.index = datasetIndex;
                                    datasetObj.init (datasetJSON);
                                }
                                else {
                                    datasetObj = dataSetMap[j][i];
                                    datasetObj.index = datasetIndex;
                                    prevData = datasetObj.JSONData;
                                    prevDataLength = prevData.data.length;
                                    currDataLength = (datasetJSON.data && datasetJSON.data.length) || 0;

                                    currCatLen = xAxis.getCategoryLen();
                                    catDiff = catLen - currCatLen;
                                    dataDiff = prevDataLength - currDataLength;

                                    diffObj = iapi._getDiff(dataDiff, currDataLength, catDiff, currCatLen);
                                    diff = diffObj.diff;
                                    startIndex = diffObj.startIndex;

                                    // Removing data plots if the number of current data plots is more than the existing
                                    //ones based of category difference and data difference.
                                    if (diff > 0) {
                                        datasetObj.removeData(startIndex, diff, false);
                                    }

                                    datasetObj.JSONData = datasetJSON;
                                    datasetObj.configure();
                                }
                                datasetIndex ++;
                                tempDataStoreMap[j].push(datasetObj);
                                datasetStore.push(datasetObj);
                                // add to group manager
                                GroupManager && GroupManager.addDataSet (datasetObj, positionIndex, i);
                            }
                        }
                    }
                    else {
                        // Resetting inner Length  and i for dispose of any previous dataset
                        innerLength = i = 0;
                        positionIndex --;
                    }
                    prevDSInnerLen = dataSetMap && dataSetMap[j] && dataSetMap[j].length;

                    // When the number of inner datasets entered vis setChartData is less than the existing inner
                    // dataset then unadd the extra datasets and dispose them.
                    if (prevDSInnerLen > innerLength) {
                        for (k = i, len = prevDSInnerLen - innerLength + i; k < len; k ++ ) {
                            dataSet = dataSetMap[j][k];
                            legend.removeItem(dataSet.legendItemId);
                            componentDispose.call(dataSet);
                        }
                    }
                }

                if (dataSetMapLen > length) {
                    for (k = j, len = dataSetMapLen - length + j; k < len; k ++ ) {
                        innerLength = dataSetMap[k].length;
                        for (i = 0; i < innerLength; i ++) {
                            dataSet = dataSetMap[k][i];
                            legend.removeItem(dataSet.legendItemId);
                            componentDispose.call(dataSet);
                        }
                    }
                }

                config.dataSetMap = tempDataStoreMap;

                if (iapi.lineset) {
                    // For setting the lineset data if any
                    for (j = 0, length = lineSets.length; j < length; j++) {
                        lineSetJSON = lineSets[j];
                        DsClass = FusionCharts.get('component', ['dataset', 'line']);
                        datasetObj = new DsClass ();
                        if (!(lineSetMap && lineSetMap[j])) {
                            datasetObj.chart = iapi;
                            datasetObj.index = datasetIndex;
                            datasetObj.init (lineSetJSON);
                        }
                        else {
                            datasetObj = lineSetMap[j];
                            datasetObj.index = datasetIndex;
                            prevData = datasetObj.JSONData;
                            prevDataLength = prevData.data.length;
                            currDataLength = (lineSetJSON.data && lineSetJSON.data.length) || 0;
                            // Removing data plots if the number of current data plots is more than
                            // the existing ones.
                            if (prevDataLength > currDataLength) {
                                datasetObj.removeData(currDataLength,
                                    prevDataLength - currDataLength, false);
                            }
                            datasetObj.JSONData = lineSetJSON;
                            datasetObj.configure();
                        }
                        tempLineStoreMap.push (datasetObj);
                        datasetStore.push(datasetObj);
                        datasetIndex++;
                    }

                    prevLineSetLen = lineSetMap && lineSetMap.length;
                    if (prevLineSetLen > length) {
                        for (k = j, len = prevLineSetLen - length + j; k < len; k ++ ) {
                            dataSet = lineSetMap[k];
                            legend.removeItem(dataSet.legendItemId);
                            componentDispose.call(dataSet);
                        }
                    }

                    config.lineSetMap = tempLineStoreMap;
                }
                // When the data entered is of column2d or mscolumn2d
                if (!properDsStructure) {
                    components.dataset = currentDataStore;
                    iapi.setChartMessage();
                    return;
                }
                iapi.config.catLen = xAxis.getCategoryLen();
            },
            creditLabel: creditLabel
        }, chartAPI.mscartesian, {
            isstacked: true
        });


        chartAPI ('mscombi2d', {
            friendlyName: 'Multi-series Combination Chart',
            standaloneInit: true,
            creditLabel: creditLabel,
            defaultDatasetType: 'column',
            applicableDSList: { 'line': true, 'area': true, 'column': true },
            _createDatasets : function () {
                var iapi = this,
                    components = iapi.components,
                    dataObj = iapi.jsonData,
                    dataset = dataObj.dataset,
                    length = dataset && dataset.length,
                    i,
                    j,
                    datasetStore,
                    datasetObj,
                    defaultSeriesType = iapi.defaultDatasetType,
                    applicableDSList = iapi.applicableDSList,
                    legend = iapi.components.legend,
                    xAxis = components.xAxis[0],
                    GroupManager,
                    dsType,
                    DsClass,
                    DsGroupClass,
                    datasetJSON,
                    isStacked = iapi.config.isstacked,
                    groupManagerName,
                    parentyaxis,
                    prevDataLength,
                    currDataLength,
                    groupManagers = [],
                    dsCount = { },
                    config = iapi.config,
                    groupManager,
                    count,
                    diff,
                    catLen = iapi.config.catLen,
                    currCatLen,
                    dataDiff,
                    catDiff,
                    prevData,
                    diffObj,
                    startIndex,
                    // map,line,area,column, stores the index of the various dataplots in combinational charts.
                    datasetMap = config.datasetMap || (config.datasetMap = {
                        line : [],
                        area : [],
                        column : [],
                        column3d: [],
                        scrollcolumn2d: []
                    }),
                    dsTypeRef,
                    tempMap = {
                        line : [],
                        area : [],
                        column : [],
                        column3d: [],
                        scrollcolumn2d: []
                    };

                if (!dataset) {
                    iapi.setChartMessage();
                }
                iapi.config.categories = dataObj.categories && dataObj.categories[0].category;
                datasetStore = components.dataset = [];
                legend && legend.emptyItems();

                for (i=0; i<length; i++) {
                    datasetJSON = dataset[i];

                    parentyaxis = datasetJSON.parentyaxis || '';
                    if (iapi.config.isdual && parentyaxis.toLowerCase () === 's') {
                        if (iapi.defaultSecondaryDataset === 'line') {
                            dsType = iapi.sDefaultDatasetType;
                        }
                        else {
                            dsType = pluck (datasetJSON.renderas, iapi.sDefaultDatasetType);
                        }
                    }
                    else {
                        dsType = pluck (datasetJSON.renderas, defaultSeriesType);
                    }
                    dsType = dsType && dsType.toLowerCase ();
                    if (!applicableDSList[dsType]) {
                        dsType = defaultSeriesType;
                    }

                    /// get the DsClass
                    DsClass = FusionCharts.get('component', ['dataset', dsType]);
                    if (DsClass) {
                        if (dsCount[dsType] === UNDEFINED) {
                            dsCount[dsType] = 0;
                        }
                        else {
                            dsCount[dsType]++;
                        }
                        groupManagerName = 'datasetGroup_' + dsType;
                        // get the ds group class
                        DsGroupClass = FusionCharts.register('component', ['datasetGroup', dsType]);
                        GroupManager = components[groupManagerName];
                        GroupManager && groupManagers.push(GroupManager);
                        if (DsGroupClass && !GroupManager) {
                            GroupManager = components[groupManagerName] = new DsGroupClass ();
                            GroupManager.chart = iapi;
                            GroupManager.init ();
                        }

                        dsTypeRef = datasetMap[dsType];
                        datasetObj = dsTypeRef[0];

                        // If the dataset does not exists.
                        if (!datasetObj) {
                            // create the dataset Object
                            datasetObj = new DsClass ();
                            datasetObj.chart = iapi;
                            datasetObj.index = i;
                            // add to group manager
                            GroupManager && (isStacked ? GroupManager.addDataSet (datasetObj, 0, dsCount[dsType]) :
                                GroupManager.addDataSet (datasetObj, dsCount[dsType], 0));
                            datasetObj.init (datasetJSON);
                        }
                        // If the dataset exists incase the chart is updated using setChartData() method.
                        else {
                            delete datasetObj.legendItemId;
                            currCatLen = xAxis.getCategoryLen();
                            catDiff = catLen - currCatLen;
                            prevData = datasetObj.JSONData;
                            prevDataLength = prevData.data && prevData.data.length;
                            currDataLength = (datasetJSON.data && datasetJSON.data.length) || 0;

                            dataDiff = prevDataLength - currDataLength;

                            diffObj = iapi._getDiff(dataDiff, currDataLength, catDiff, currCatLen);
                            diff = diffObj.diff;
                            startIndex = diffObj.startIndex;

                            // Removing data plots if the number of current data plots/categories
                            // is more than the existing ones.
                            if (diff > 0) {
                                datasetObj.removeData(startIndex, diff, false);
                            }
                            datasetObj.index = i;
                            datasetObj.JSONData = datasetJSON;
                            datasetObj.configure();
                            dsTypeRef.splice(0, 1);
                        }
                        // Push new dataset object into both tempmap array and datastore array
                        tempMap[dsType].push(datasetObj);
                        datasetStore.push (datasetObj);
                    }
                }

                // Removing unused datasets if any
                for (dataset in datasetMap) {
                    dsTypeRef  = datasetMap[dataset];
                    groupManager = dsTypeRef[0] && dsTypeRef[0].groupManager;
                    length = dsTypeRef.length;
                    count = dsCount[dataset] === UNDEFINED ? 0 : dsCount[dataset] + 1;
                    if (length) {
                        isStacked && groupManager && groupManager.removeDataSet(0, count, length);
                        for (j = 0; j < length; j++) {
                            groupManager && !isStacked && groupManager.removeDataSet(count, 0, 1);
                            if (dsTypeRef[j].type === 'column' && iapi.is3D === true) {
                                dsTypeRef[j].visible = false;
                                dsTypeRef[j].draw();
                            }
                            else {
                                componentDispose.call(dsTypeRef[j]);
                            }
                        }
                    }
                }
                config.datasetMap = tempMap;
                iapi.config.catLen = xAxis.getCategoryLen();
            }
        }, chartAPI.areabase);

        chartAPI ('mscombi3d', {
            standaloneInit: true,
            friendlyName: 'Multi-series 3D Combination Chart',
            defaultDatasetType: 'column3d',
            is3D: true,
            creditLabel: creditLabel,
            defaultPlotShadow: 1,
            applicableDSList: { 'column3d': true, 'line': true, 'area': true },
            _createDatasets : chartAPI.mscombi2d
        }, chartAPI.mscartesian3d, {
            showplotborder: 0
        }, chartAPI.areabase);

        chartAPI ('mscolumnline3d', {
            friendlyName: 'Multi-series Column and Line Chart',
            is3D: true,
            creditLabel: creditLabel,
            defaultPlotShadow: 1,
            applicableDSList: { 'column3d': true, 'line': true }
        }, chartAPI.mscombi3d, {
            use3dlineshift: 1,
            showplotborder: 0
        }, chartAPI.msarea);

        chartAPI ('stackedcolumn2dline', {
            friendlyName: 'Stacked Column and Line Chart',
            defaultDatasetType: 'column',
            creditLabel: creditLabel,
            applicableDSList: { 'line': true, 'column': true }
        }, chartAPI.mscombi2d, {
            isstacked: true,
            stack100percent: 0
        }, chartAPI.msarea);

        chartAPI ('stackedcolumn3dline', {
            friendlyName: 'Stacked 3D Column and Line Chart',
            is3D: true,
            creditLabel: creditLabel,
            applicableDSList: { 'column3d' :true, 'line': true }
        }, chartAPI.mscombi3d, {
            use3dlineshift: 1,
            isstacked: true,
            stack100percent: 0,
            showplotborder: 0
        }, chartAPI.msarea);

        chartAPI ('mscombidy2d', {
            standaloneInit: true,
            friendlyName: 'Multi-series Dual Y-Axis Combination Chart',
            defaultDatasetType: 'column',
            sDefaultDatasetType: 'line',
            _createDatasets: chartAPI.mscombi2d,
            creditLabel: creditLabel,
            applicableDSList: { 'column': true, 'line': true, 'area': true }
        }, chartAPI.msdybasecartesian, {
            isdual: 1
        }, chartAPI.msarea);

        chartAPI ('mscolumn3dlinedy', {
            standaloneInit: true,
            friendlyName: 'Multi-series 3D Column and Line Chart',
            defaultDatasetType: 'column3d',
            sDefaultDatasetType: 'line',
            is3D: true,
            creditLabel: creditLabel,
            _createDatasets: chartAPI.mscombi2d,
            defaultPlotShadow: 1,
            applicableDSList: { 'column3d' :true, 'line': true }
        }, chartAPI.msdybasecartesian3d, {
            use3dlineshift: 1,
            isdual: true,
            showplotborder: 0
        }, chartAPI.msarea);

        chartAPI ('stackedcolumn3dlinedy', {
            standaloneInit: true,
            friendlyName: 'Stacked 3D Column and Line Chart',
            is3D: true,
            defaultDatasetType: 'column3d',
            creditLabel: creditLabel,
            sDefaultDatasetType: 'line',
            defaultSecondaryDataset: 'line',
            _createDatasets: chartAPI.mscombi2d,
            applicableDSList: { 'column3d': true, 'line': true }
        }, chartAPI.msdybasecartesian3d, {
            use3dlineshift: 1,
            isdual: true,
            isstacked: true,
            showplotborder: 0
        }, chartAPI.msarea);

        chartAPI ('msstackedcolumn2dlinedy', {
            standaloneInit: true,
            friendlyName: 'Multi-series Dual Y-Axis Stacked Column and Line Chart',
            stack100percent: 0,
            defaultDatasetType: 'column',
            sDefaultDatasetType: 'line',
            hasLineSet: true,
            creditLabel: creditLabel,
            applicableDSList: { 'column': true },
            lineset : true,
            _createDatasets: chartAPI.msstackedcolumn2d
        }, chartAPI.msdybasecartesian, {
            isdual: true,
            haslineset: true,
            isstacked: true
        }, chartAPI.msarea);

        chartAPI ('scrollcolumn2d', {
            standaloneInit: true,
            friendlyName: 'Scrollable Multi-series Column Chart',
            tooltipConstraint: 'plot',
            canvasborderthickness: 1,
            creditLabel: creditLabel,
            defaultDatasetType : 'scrollcolumn2d',
            applicableDSList: { 'scrollcolumn2d': true },
            avgScrollPointWidth: 40,
            hasScroll: true,
            defaultPlotShadow: 1,
            _manageScrollerPosition: function () {
                var iapi = this,
                    config = iapi.config,
                    chartComponents = iapi.components,
                    _scrollBar = iapi._scrollBar,
                    availableHeight,
                    availableWidth,
                    scrollEnabled,
                    getScrollItems = _scrollBar.get,
                    scrollBar = chartComponents.scrollBar,
                    scrollItem,
                    scrollDimensions;

                // Fetching the scroll Items.
                scrollItem = getScrollItems()[0];
                scrollBar.setConfiguaration(scrollItem.conf);
                scrollEnabled = config.scrollEnabled;
                //manage space for the scroll bar.
                // fetch the availble space for the canvas area after other space management is over
                availableHeight = config.canvasHeight;
                availableWidth = config.canvasWidth;
                scrollDimensions = scrollBar.getLogicalSpace();
                //allocate space for toolBox and set the chart configurations.
                // shift denotes the amount of shift required by the x-axis
                iapi._allocateSpace ({
                    bottom: (config.shift = scrollEnabled === false ? 0 :
                        (scrollDimensions.height + scrollBar.conf.padding))
                });

            },
            _resetViewPortConfig: function () {
                var iapi = this;

                iapi.config.viewPortConfig = {
                    scaleX: 1,
                    scaleY: 1,
                    x: 0,
                    y: 0
                };
            },
            updateManager: function (pos) {
                var iapi = this,
                    config = iapi.config,
                    viewPortConfig = iapi.config.viewPortConfig,
                    scaleX = viewPortConfig.scaleX,
                    canvasWidth = config.canvasWidth,
                    datasetLayer = iapi.graphics.datasetGroup,
                    dataLabelsLayer = iapi.graphics.datalabelsGroup,
                    trackerGroup = iapi.graphics.trackerGroup,
                    offset = (canvasWidth * (scaleX - 1) * pos),
                    xAxis = iapi.components.xAxis[0],
                    xAxisAnifConfig,
                    xAxisNameDrawConfig,
                    sumLabelsLayer = iapi.graphics.sumLabelsLayer,
                    transformAttr;
                viewPortConfig.x =  offset / scaleX;
                // Taking mathround of offset for crisp value
                transformAttr = 't' + -mathRound(offset) + ',0';
                config.lastScrollPosition = pos;
                datasetLayer.attr({
                    transform: transformAttr
                });
                dataLabelsLayer.attr({
                    transform: transformAttr
                });
                trackerGroup.attr({
                    transform: transformAttr
                });
                sumLabelsLayer && sumLabelsLayer.attr({
                    transform: transformAttr
                });

                xAxisAnifConfig = xAxis.getAxisConfig('animateAxis');
                xAxisNameDrawConfig = xAxis.getAxisConfig('drawAxisName');
                // temp fix for axis animation
                xAxis.setAxisConfig({
                    animateAxis : false,
                    drawAxisName : false
                });
                xAxis.draw();
                // reset the animation configuration
                xAxis.setAxisConfig({
                    animateAxis : xAxisAnifConfig,
                    drawAxisName : xAxisNameDrawConfig
                });
            },
            _createToolBox: function () {
                var iapi = this,
                    components = iapi.components,
                    _scrollBar = iapi._scrollBar,
                    getScrollItems = _scrollBar.get,
                    addScrollItems = _scrollBar.add,
                    tb,
                    Scroller,
                    scrollItem,
                    ComponentGroup,
                    scrollBar = components.scrollBar,
                    toolBoxAPI;

                // create the export or print buttons if required.
                chartAPI.mscartesian._createToolBox.call(iapi);
                tb = components.tb;
                toolBoxAPI = components.toolBoxAPI || tb.getAPIInstances(tb.ALIGNMENT_HORIZONTAL);
                Scroller = toolBoxAPI.Scroller;
                ComponentGroup = toolBoxAPI.ComponentGroup;
                // temp code: On update scroll items needs to be reused.
                _scrollBar.clear();
                // Adding the scroll items in the scroll bar.
                addScrollItems({
                    isHorizontal: true
                }, {
                    // Attach the callback for scroll Interaction.
                    'scroll' : (function (ref) {
                        return function () {
                            ref.updateManager.apply(ref, arguments);
                        };
                    })(iapi)
                });

                // Fetching the scroll Items.
                scrollItem = getScrollItems()[0];

                if (!scrollBar) {
                    // adding the scrollbar.
                    components.scrollBar = new Scroller(scrollItem.conf, tb.idCount, tb.pId)
                    .attachEventHandlers(scrollItem.handler);
                }
            },
            _setAxisScale: function () {
                var iapi = this,
                    components = iapi.components,
                    config = iapi.config,
                    xAxis = components.xAxis[0],
                    catCount = xAxis.getCategoryLen(),
                    jsonData = iapi.jsonData,
                    scrollOptions = config.scrollOptions || (config.scrollOptions = {}),
                    datasets = iapi.components.dataset,
                    outerDataSetLen = datasets.length,
                    chartAttr = jsonData.chart,
                    chartWidth = config.width,
                    scaleX,
                    dataset,
                    i,
                    numOfColumnSeries = 0,
                    offset,
                    noOfDatasets,
                    canvasWidth = config.canvasWidth,
                    totalNumPoint,
                    scrollToEnd = config.scrollToEnd,
                    lastScrollPosition = config.lastScrollPosition,
                    pos,
                    //number of columns to be drawn.
                    numVisiblePlot = pluckNumber (chartAttr.numvisibleplot,
                        mathFloor (chartWidth / iapi.avgScrollPointWidth));
                for (i = 0; i < outerDataSetLen; i++) {
                    dataset = datasets[i];
                    if (dataset.type === 'column') {
                        numOfColumnSeries++;
                    }
                }
                noOfDatasets = numOfColumnSeries;
                if (iapi.config.isstacked) {
                    numOfColumnSeries = 1;
                }

                totalNumPoint = catCount * (numOfColumnSeries || 1);


                if (numVisiblePlot >= 2 && numVisiblePlot < totalNumPoint) {
                    //update the scaleX for the axis.
                    config.viewPortConfig.scaleX = scaleX = totalNumPoint / numVisiblePlot;
                    if (lastScrollPosition !== undefined) {
                        pos = lastScrollPosition;
                    }
                    else {
                        pos = scrollToEnd ? 1 : 0;
                    }

                    offset = (canvasWidth * (scaleX - 1) * pos);
                    config.viewPortConfig.x = offset / scaleX;

                    //parse the scroll properties
                    scrollOptions.vxLength = numVisiblePlot / outerDataSetLen;
                    config.scrollEnabled = true;
                }
                else {
                    config.scrollEnabled = false;
                }
            },
            drawScrollBar: function () {
                var iapi = this,
                    config = iapi.config,
                    viewPortConfig = config.viewPortConfig,
                    components = iapi.components,
                    graphics = iapi.graphics,
                    paper = components.paper,
                    xAxis = components.xAxis[0],
                    axisConfig = xAxis.config,
                    axisRange = xAxis.config.axisRange,
                    scrollOptions = config.scrollOptions || (config.scrollOptions = {}),
                    max = axisRange.max,
                    min = axisRange.min,
                    vxLength = scrollOptions.vxLength,
                    scrollBar = components.scrollBar,
                    scrollNode = scrollBar.node,
                    scrollToEnd = config.scrollToEnd,
                    lastScrollPosition = config.lastScrollPosition,
                    scaleX = viewPortConfig.scaleX,
                    canvasLeft,
                    canvasTop,
                    canvasHeight,
                    canvasWidth,
                    canvasConfig,
                    canvasBorderWidth,
                    aXisLineWidth,
                    startPercent,
                    aXisLineStartExtension,
                    aXisLineEndExtension,
                    scrollRatio,
                    windowedCanvasWidth,
                    fullCanvasWidth,
                    scrollBarParentGroup;
                if (lastScrollPosition !== undefined) {
                    startPercent = lastScrollPosition;
                }
                else {
                    startPercent = scrollToEnd ? 1 : 0;
                }
                canvasLeft = config.canvasLeft;
                canvasTop = config.canvasTop;
                canvasHeight = config.canvasHeight;
                canvasWidth = config.canvasWidth;
                canvasConfig = components.canvas.config;
                canvasBorderWidth = canvasConfig.canvasBorderWidth;
                aXisLineWidth = axisConfig.showAxisLine ? axisConfig.axisLineThickness || 0 : 0;
                aXisLineStartExtension = pluckNumber(canvasBorderWidth, axisConfig.lineStartExtension);
                aXisLineEndExtension = pluckNumber(canvasBorderWidth, axisConfig.lineEndExtension);
                scrollOptions.viewPortMin = min;
                scrollOptions.viewPortMax = max;
                scrollRatio = (scrollOptions.scrollRatio = 1 / scaleX);
                windowedCanvasWidth = scrollOptions.windowedCanvasWidth = xAxis.getAxisPosition(vxLength);
                fullCanvasWidth = scrollOptions.fullCanvasWidth =
                    xAxis.getAxisPosition(max - min) - windowedCanvasWidth;

                scrollBarParentGroup = graphics.scrollBarParentGroup;
                if (!scrollBarParentGroup) {
                    scrollBarParentGroup = graphics.scrollBarParentGroup = paper.group('scrollBarParentGroup',
                       graphics.parentGroup).insertBefore(graphics.datalabelsGroup);
                }
                //draw the scroller element
                // todo padding needs to be included.
                if (config.scrollEnabled !== false) {
                    scrollBar.draw (canvasLeft - aXisLineStartExtension,
                        canvasTop + canvasHeight + canvasBorderWidth + aXisLineWidth - 2,{
                            width: canvasWidth + aXisLineStartExtension + aXisLineEndExtension,
                            scrollRatio: scrollRatio,
                            roundEdges: canvasConfig.isRoundEdges,
                            fullCanvasWidth: fullCanvasWidth,
                            windowedCanvasWidth: windowedCanvasWidth,
                            scrollPosition: startPercent,
                            parentLayer: scrollBarParentGroup
                        });

                    // attach the callback for raising event only for it is a new scroll node.
                    !scrollNode && (function () {
                        var prevPos;
                        R.eve.on('raphael.scroll.start.' + scrollBar.node.id, function (pos) {
                            prevPos = pos;
                            global.raiseEvent('scrollstart', {
                                scrollPosition: pos
                            }, iapi.chartInstance);
                        });

                        R.eve.on('raphael.scroll.end.' + scrollBar.node.id, function (pos) {
                            global.raiseEvent('scrollend', {
                                prevScrollPosition: prevPos,
                                scrollPosition: pos
                            }, iapi.chartInstance);
                        });
                    }());
                }
                else {
                    scrollBar && scrollBar.node && scrollBar.node.hide();
                }
            },
            _drawDataset: function () {
                var iapi = this;
                iapi._setClipping();
                chartAPI.mscartesian._drawDataset.call(this);
            },
            _setClipping: function () {
                var chart = this,
                    config = chart.config,
                    datasetLayer = chart.graphics.datasetGroup,
                    dataLabelsLayer = chart.graphics.datalabelsGroup,
                    trackerLayer  = chart.graphics.trackerGroup,
                    viewPortConfig = config.viewPortConfig,
                    sumLabelsLayer = chart.graphics.sumLabelsLayer,
                    scaleX = viewPortConfig.scaleX,
                    animationObj = chart.get('config', 'animationObj'),
                    animation = animationObj.duration,
                    dummyAnimElem = animationObj.dummyObj,
                    dummyAnimObj = animationObj.animObj,
                    animType = animationObj.animType,
                    x = viewPortConfig.x,
                    chartHeight = config.height,
                    clipCanvas = chart.components.canvas.config.clip['clip-canvas'];

                clipCanvas = (clipCanvas && clipCanvas.slice(0)) || [];
                if (!chart.config.clipSet) {
                    datasetLayer.attr({
                        'clip-rect': clipCanvas
                    });
                    dataLabelsLayer.attr({
                        'clip-rect': clipCanvas
                    });
                    trackerLayer.attr({
                        'clip-rect': clipCanvas
                    });
                    clipCanvas[3] = chartHeight;
                    clipCanvas[1] = 0;
                    sumLabelsLayer && sumLabelsLayer.attr({
                        'clip-rect': clipCanvas
                    });
                }
                else {
                    datasetLayer.animateWith(dummyAnimElem, dummyAnimObj,{
                        'clip-rect': clipCanvas
                    }, animation, animType);
                    dataLabelsLayer.animateWith(dummyAnimElem, dummyAnimObj,{
                        'clip-rect': clipCanvas
                    }, animation, animType);
                    trackerLayer.attr({
                        'clip-rect': clipCanvas
                    });

                    clipCanvas[3] = chartHeight;
                    clipCanvas[1] = 0;
                    sumLabelsLayer && sumLabelsLayer.animateWith(dummyAnimElem, dummyAnimObj, {
                        'clip-rect': clipCanvas
                    }, animation, animType);
                }
                datasetLayer.attr({
                    transform: 'T' + - (x * scaleX) + ',0'
                });
                dataLabelsLayer.attr({
                    transform: 'T' + - (x * scaleX) + ',0'
                });
                trackerLayer.attr({
                    transform: 'T' + - (x * scaleX) + ',0'
                });
                sumLabelsLayer && sumLabelsLayer.attr({
                    transform: 'T' + - (x * scaleX) + ',0'
                });
                chart.config.clipSet = true;
            },
            configure: function () {
                var chart = this,
                    jsonData = chart.jsonData,
                    chartAttr = jsonData.chart,
                    chartConfig;
                chartAPI.mscolumn2d.configure.call(this);
                chartConfig = chart.config;
                chartConfig.scrollToEnd = pluckNumber(chartAttr.scrolltoend, 0);
                chartConfig.lastScrollPosition = UNDEFINED;
            }
        }, chartAPI.scrollbase);

        chartAPI ('scrollarea2d', {
            friendlyName: 'Scrollable Multi-series Area Chart',
            tooltipConstraint: 'plot',
            canvasborderthickness: 1,
            creditLabel: creditLabel,
            hasScroll: true,
            defaultDatasetType: 'scrollarea2d',
            applicableDSList: { 'scrollarea2d': true },
            avgScrollPointWidth: 75,
            defaultPlotShadow: 0,
            _setAxisScale: function () {
                var iapi = this,
                    components = iapi.components,
                    config = iapi.config,
                    xAxis = components.xAxis[0],
                    catCount = xAxis.getCategoryLen(),
                    jsonData = iapi.jsonData,
                    scrollOptions = config.scrollOptions || (config.scrollOptions = {}),
                    chartAttr = jsonData.chart,
                    chartWidth = config.width,
                    scaleX,
                    totalNumPoint = catCount,
                    offset,
                    lastScrollPosition = config.lastScrollPosition,
                    pos,
                    scrollToEnd = config.scrollToEnd,
                    canvasWidth = config.canvasWidth,
                    //number of columns to be drawn.
                    numVisiblePlot = pluckNumber (chartAttr.numvisibleplot,
                        mathFloor (chartWidth / iapi.avgScrollPointWidth));
                if (numVisiblePlot >= 2 && numVisiblePlot < totalNumPoint) {
                    //update the scaleX for the axis.
                    config.viewPortConfig.scaleX = scaleX = totalNumPoint / numVisiblePlot;
                    if (lastScrollPosition !== undefined) {
                        pos = lastScrollPosition;
                    }
                    else {
                        pos = scrollToEnd ? 1 : 0;
                    }


                    offset = (canvasWidth * (scaleX - 1) * pos);
                    config.viewPortConfig.x = offset / scaleX;

                    //parse the scroll properties
                    scrollOptions.vxLength = numVisiblePlot;
                    config.scrollEnabled = true;
                }
                else {
                    config.scrollEnabled = false;
                }
            }
        }, chartAPI.scrollcolumn2d, {}, chartAPI.areabase);

        chartAPI ('scrollline2d', {
            friendlyName: 'Scrollable Multi-series Line Chart',
            tooltipConstraint: 'plot',
            canvasborderthickness: 1,
            defaultDatasetType: 'line',
            creditLabel: creditLabel,
            avgScrollPointWidth: 75,
            defaultPlotShadow: 1
        }, chartAPI.scrollarea2d, {
            zeroplanethickness: 1,
            zeroplanealpha: 40,
            showzeroplaneontop: 0
        }, chartAPI.areabase);

        chartAPI ('scrollstackedcolumn2d', {
            friendlyName: 'Scrollable Stacked Column Chart',
            canvasborderthickness: 1,
            tooltipConstraint: 'plot',
            avgScrollPointWidth: 75,
            creditLabel: creditLabel
        }, chartAPI.scrollcolumn2d, {}, chartAPI.stackedcolumn2d);

        chartAPI ('scrollcombi2d', {
            friendlyName: 'Scrollable Combination Chart',
            tooltipConstraint: 'plot',
            hasScroll: true,
            canvasborderthickness: 1,
            avgScrollPointWidth: 40,
            applicableDSList: {'area': true, 'line': true, 'column': true},
            creditLabel: creditLabel,
            _createDatasets : chartAPI.mscombi2d
        }, chartAPI.scrollcolumn2d, {}, chartAPI.msarea);

        chartAPI ('scrollcombidy2d', {
            friendlyName: 'Scrollable Dual Y-Axis Combination Chart',
            tooltipConstraint: 'plot',
            canvasborderthickness: 1,
            avgScrollPointWidth: 40,
            hasScroll: true,
            _drawDataset: chartAPI.scrollcolumn2d,
            updateManager: chartAPI.scrollcolumn2d,
            _setAxisScale: chartAPI.scrollcolumn2d,
            _createToolBox: chartAPI.scrollcolumn2d,
            _scrollBar: chartAPI.scrollcolumn2d,
            _manageScrollerPosition: chartAPI.scrollcolumn2d,
            drawScrollBar: chartAPI.scrollcolumn2d,
            _setClipping: chartAPI.scrollcolumn2d,
            creditLabel: creditLabel,
            configure: chartAPI.scrollcolumn2d
        }, chartAPI.mscombidy2d, {
            isdual: true
        }, chartAPI.areabase);


        chartAPI ('scatter', {
            friendlyName: 'Scatter Chart',
            isXY: true,
            standaloneInit: true,
            hasLegend: true,
            defaultZeroPlaneHighlighted: false,
            creditLabel: creditLabel,
            defaultDatasetType : 'Scatter',
            applicableDSList: {
                'Scatter': true
            }
        }, chartAPI.scatterBase);

        // Add events to the legacy event list
        extend2 (lib.eventList, {
            zoomedOut: 'FC_ZoomedOut'
        });

        chartAPI ('bubble', {
            friendlyName: 'Bubble Chart',
            standaloneInit: true,
            defaultDatasetType: 'bubble',
            creditLabel: creditLabel,
            applicableDSList: { 'bubble': true },
            getDataLimits: function () {
                var iapi = this,
                    datasets = iapi.components.dataset,
                    i,
                    dataset,
                    len,
                    limits,
                    zMax = -Infinity,
                    zMin = +Infinity;

                for (i = 0,len = datasets.length; i < len; i++) {
                    dataset = datasets[i];
                    limits = dataset.getDataLimits();
                    zMax = mathMax(zMax, limits.zMax || -Infinity);
                    zMin = mathMin(zMin, limits.zMin || +Infinity);
                }
                zMax = zMax === -Infinity ? 0 : zMax;
                zMin = zMin === +Infinity ? 0 : zMin;
                return {
                    zMax: zMax,
                    zMin: zMin
                };
            }
        }, chartAPI.scatter);

        /******************************************************************************
         * Raphael Renderer Extension
         ******************************************************************************

        /*
         * Loop up the node tree and add offsetWidth and offsetHeight to get the
         * total page offset for a given element. Used by Opera and iOS on hover and
         * all browsers on point click.
         *
         * ~param { object} el
         */
        // function getPosition (el) {
        //     var p = {
        //         left: el.offsetLeft,
        //         top: el.offsetTop
        //     };
        //     el = el.offsetParent;
        //     while (el) {
        //         p.left += el.offsetLeft;
        //         p.top += el.offsetTop;
        //         if (el !== doc.body && el !== doc.documentElement) {
        //             p.left -= el.scrollLeft;
        //             p.top -= el.scrollTop;
        //         }
        //         el = el.offsetParent;
        //     }
        //     return p;
        // }

        function map (arr, fn) {
            //return jQuery.map (arr, fn);
            var results = [],
                 i = 0,
                 len = arr.length;

            for (; i < len; i++) {
                results[i] = fn.call (arr[i], arr[i], i, arr);
            }
            return results;
        }

        /* Helper function */
        function normalizeAngle (angle, inDegrees) {
            var fullCycle = inDegrees ? 360 : pi2;
            angle = (angle || 0) % fullCycle;
            return angle < 0 ? fullCycle + angle : angle;
        }

        function getAbsScaleAngle (start, end) {
            return (start > end ? pi2 : 0) + end - start;
        }

        function getClickArcTangent (x, y, center, ref, pieYScale) {
            return mathATan2 ((y - center[1] - ref.top) / pieYScale, x - center[0] -
                                                                        ref.left);
        }

        // **** pie3d manager ***** //
        // set the new aimatable properites
        if(R._availableAnimAttrs && R._availableAnimAttrs.cx){
            // assuming that cx is also numaric type
            R._availableAnimAttrs.innerR = R._availableAnimAttrs.depth = R._availableAnimAttrs.radiusYFactor =
                R._availableAnimAttrs.start = R._availableAnimAttrs.end = R._availableAnimAttrs.cx;
        }

        // Pie 3D point class
        function Pie3DManager (chart) {
            var manager = this;

            manager.config = {};
            manager.linkedItems = {
                chart: chart
            };
        }

        Pie3DManager.prototype = {
            configure: function (depth, hasOnePoint, use3DLighting, isDoughnut) {
                var manager = this,
                    chart = manager.linkedItems.chart,
                    renderer = chart.get('components', 'paper'),
                    seriesGroup = chart.get('graphics', 'datasetGroup');
                if (isObject (depth)) {
                    depth = depth.depth;
                    hasOnePoint = depth.hasOnePoint;
                    use3DLighting = depth.use3DLighting;
                    isDoughnut = depth.isDoughnut;
                }
                // @todo: need to have pie to daughnut transpose

                //add the values to the instance
                if (!manager.renderer) {
                    manager.renderer = renderer;
                }
                manager.hasOnePoint = hasOnePoint;
                manager.use3DLighting = use3DLighting;
                manager.isDoughnut = isDoughnut;
                manager.depth = depth;

                //create required groups
                /** @todo if requared create bottom side group */
                !manager.bottomBorderGroup && (manager.bottomBorderGroup =
                    renderer.group('bottom-border', seriesGroup));

                // @todo: need to have animate with for dept
                manager.bottomBorderGroup.attr ({
                        transform: 't0,' + depth
                    });
                !manager.slicingWallsBackGroup && (manager.slicingWallsBackGroup =
                    renderer.group ('slicingWalls-back-Side', seriesGroup));
                !manager.slicingWallsFrontGroup && (manager.slicingWallsFrontGroup = renderer
                    .group ('slicingWalls-front-Side', seriesGroup));
                !manager.topGroup && (manager.topGroup = renderer.group ('top-Side', seriesGroup));


                // if arrays are not availabel the create the m for first time
                !manager.pointElemStore && (manager.pointElemStore = []);
                !manager.slicingWallsArr && (manager.slicingWallsArr = []);

                //few reusable code
                manager.moveCmdArr = [M];
                manager.lineCmdArr = [L];
                manager.closeCmdArr = [Z];

                manager.colorObjs = [];
            },

            getArcPath : function (cX, cY, startX, startY, endX, endY, rX, rY, isClockWise, isLargeArc) {
                return (startX == endX && startY == endY) ? [] : [A, rX, rY, 0, isLargeArc, isClockWise, endX, endY];

            },

            _parseSliceColor : function (color, alpha, pointConf) {
                var manager = this,
                    dark1,
                    dark2,
                    dark3,
                    dark4,
                    dark5,
                    dark6,
                    light1,
                    light2,
                    light3,
                    light4,
                    light5,
                    light6,
                    alpha1,
                    colorStr1,
                    colorStr2,
                    alphaStr1,
                    alphaStr2,
                    alphaStr3,
                    colorStr3,
                    colorStr4,
                    colorStr5,
                    alphaFactor = 3,
                    lighting3D = manager.use3DLighting,
                    cacheStore = lighting3D ? pie3DCacheColorStore.lighting3D : pie3DCacheColorStore.lighting2D,
                    colorsObj,
                    radiusYFactor = pointConf.radiusYFactor,
                    cx = pointConf.cx,
                    cy = pointConf.cy,
                    rx = pointConf.r,
                    ry = rx * radiusYFactor,
                    innerRx = pointConf.innerR || 0,
                    rightX = cx + rx,
                    leftX = cx - rx,
                    rightInnerX = cx + innerRx,
                    leftInnerX = cx - innerRx;

                alpha = alpha || 100;
                alpha1 = alpha / 2;

                // check in cacheStore
                if (cacheStore[color] && cacheStore[color][alpha]) { // if found return the color
                    colorsObj = cacheStore[color][alpha];
                }
                else {// create the color components
                    if (!cacheStore[color]) {
                        cacheStore[color] = {};
                    }
                    if (!cacheStore[color][alpha]) {
                        cacheStore[color][alpha] = {};
                    }
                    colorsObj = cacheStore[color][alpha];

                    if (lighting3D) {
                        dark1 = getDarkColor(color, 80);
                        dark2 = getDarkColor(color, 75);
                        light1 = getLightColor(color, 85);
                        light2 = getLightColor(color, 70);
                        light3 = getLightColor(color, 40);

                        light4 = getLightColor(color, 50);
                        light5 = getLightColor(color, 30);
                        light6 = getLightColor(color, 65);
                        dark3 = getDarkColor(color, 85);
                        dark4 = getDarkColor(color, 69);
                        dark5 = getDarkColor(color, 75);
                        dark6 = getDarkColor(color, 95);
                    }
                    else {
                        alphaFactor = 10;
                        dark1 = getDarkColor(color, 90);
                        dark2 = getDarkColor(color, 87);
                        light1 = getLightColor(color, 93);
                        light2 = getLightColor(color, 87);
                        light3 = getLightColor(color, 80);

                        light6 = light4 = getLightColor(color, 85);
                        light5 = getLightColor(color, 80);
                        dark6 = dark3 = getDarkColor(color, 85);
                        dark4 = getDarkColor(color, 75);
                        dark5 = getDarkColor(color, 80);
                    }
                    colorStr1 = dark2 + COMMASTRING + light1 + COMMASTRING + light2 +
                                          COMMASTRING + light1 + COMMASTRING + dark2;
                    alphaStr1 = alpha + COMMASTRING + alpha + COMMASTRING + alpha +
                                            COMMASTRING + alpha + COMMASTRING + alpha;
                    colorStr2 = dark2 + COMMASTRING + color + COMMASTRING + light1 +
                                          COMMASTRING + color + COMMASTRING + dark2;
                    alphaStr2 = alpha1 + COMMASTRING + alpha1 + COMMASTRING + alpha1 +
                                         COMMASTRING + alpha1 + COMMASTRING + alpha1;
                    colorStr3 = dark2 + COMMASTRING + color + COMMASTRING + light3 +
                                           COMMASTRING + color + COMMASTRING + dark2;
                    colorStr4 = dark5 + COMMASTRING + light1 + COMMASTRING + light4 +
                                          COMMASTRING + light1 + COMMASTRING + dark4;
                    colorStr5 = 'FFFFFF' + COMMASTRING + 'FFFFFF' + COMMASTRING + 'FFFFFF' +
                                          COMMASTRING + 'FFFFFF' + COMMASTRING + 'FFFFFF';
                    alphaStr3 = 0 + COMMASTRING + alpha1/alphaFactor + COMMASTRING + alpha/alphaFactor +
                                         COMMASTRING + alpha1/alphaFactor + COMMASTRING + 0;

                    if (hasSVG) {
                        colorsObj.top = {
                            FCcolor : {
                                gradientUnits : 'userSpaceOnUse',
                                radialGradient : true,
                                color : light6 + COMMASTRING + dark6,
                                alpha : alpha + COMMASTRING + alpha,
                                ratio : '0,100'
                            }
                        };
                    }
                    else {
                        colorsObj.top = {
                            FCcolor : {
                                gradientUnits : 'objectBoundingBox',
                                color : light2 + COMMASTRING + light2 + COMMASTRING + light1 + COMMASTRING + dark2,
                                alpha : alpha + COMMASTRING + alpha + COMMASTRING + alpha + COMMASTRING + alpha,
                                angle : -72,
                                ratio : '0,8,15,77'
                            }
                        };
                    }

                    colorsObj.frontOuter = {
                        FCcolor : {
                            gradientUnits : 'userSpaceOnUse',
                            y1 : 0,
                            y2 : 0,
                            color : colorStr4,
                            alpha : alphaStr1,
                            angle : 0,
                            ratio : '0,20,15,15,50'
                        }
                    };
                    colorsObj.backOuter = {
                        FCcolor : {
                            gradientUnits : 'userSpaceOnUse',
                            y1 : 0,
                            y2 : 0,
                            color : colorStr3,
                            alpha : alphaStr2,
                            angle : 0,
                            ratio : '0,62,8,8,22'
                        }
                    };
                    colorsObj.frontInner = {
                        FCcolor : {
                            gradientUnits : 'userSpaceOnUse',
                            y1 : 0,
                            y2 : 0,
                            color : colorStr2,
                            alpha : alphaStr2,
                            angle : 0,
                            ratio : '0,25,5,5,65'
                        }
                    };
                    colorsObj.backInner = {
                        FCcolor : {
                            gradientUnits : 'userSpaceOnUse',
                            y1 : 0,
                            y2 : 0,
                            color : colorStr1,
                            alpha : alphaStr1,
                            angle : 0,
                            ratio : '0,62,8,8,22'
                        }
                    };
                    colorsObj.topBorder = {
                        FCcolor : {
                            gradientUnits : 'userSpaceOnUse',
                            y1 : 0,
                            y2 : 0,
                            color : colorStr5,
                            alpha : alphaStr3,
                            angle : 0,
                            ratio : '0,20,15,15,50'
                        }
                    };
                    colorsObj.topInnerBorder = {
                        FCcolor : {
                            gradientUnits : 'userSpaceOnUse',
                            y1 : 0,
                            y2 : 0,
                            color : colorStr5,
                            alpha : alphaStr3,
                            angle : 0,
                            ratio : '0,50,15,15,20'
                        }
                    };
                    colorsObj.bottom = toRaphaelColor(convertColor(color, alpha1));
                    /** @todo will be changed w. r. t. angle */
                    colorsObj.startSlice = toRaphaelColor(convertColor(dark1, alpha));
                    colorsObj.endSlice = toRaphaelColor(convertColor(dark1, alpha));
                }


                // check if non color attributes match, else apply them
                if (colorsObj.cx !== cx || colorsObj.cy !== cy || colorsObj.rx !== rx ||
                    colorsObj.radiusYFactor !== radiusYFactor || colorsObj.innerRx !== innerRx) {
                    // appaly positional properties in colors
                    if (hasSVG) {
                        colorsObj.top.FCcolor.cx = cx;
                        colorsObj.top.FCcolor.cy = cy;
                        colorsObj.top.FCcolor.r = rx;
                        colorsObj.top.FCcolor.fx = cx - 0.3 * rx;
                        colorsObj.top.FCcolor.fy = cy + ry * 1.2;
                    }
                    colorsObj.topBorder.FCcolor.x1 = colorsObj.backOuter.FCcolor.x1 = colorsObj.frontOuter.FCcolor.x1 =
                        leftX;
                    colorsObj.topBorder.FCcolor.x2 = colorsObj.backOuter.FCcolor.x2 = colorsObj.frontOuter.FCcolor.x2 =
                        rightX;
                    colorsObj.topInnerBorder.FCcolor.x1 = colorsObj.backInner.FCcolor.x1 =
                        colorsObj.frontInner.FCcolor.x1 = leftInnerX;
                    colorsObj.topInnerBorder.FCcolor.x2 = colorsObj.backInner.FCcolor.x2 =
                        colorsObj.frontInner.FCcolor.x2 = rightInnerX;



                    // Set positional attributes in color Object
                    colorsObj.cx = cx;
                    colorsObj.cy = cy;
                    colorsObj.rx = rx;
                    colorsObj.radiusYFactor = radiusYFactor;
                    colorsObj.innerRx = innerRx;

                }

                return colorsObj;
            },

            rotate : function (angle) {
                var manager = this,
                pointElemStore = manager.pointElemStore,
                    x = 0, ln = pointElemStore.length, point, confObject;
                if (!manager.hasOnePoint) {
                    for (; x < ln; x += 1) {
                        point = pointElemStore[x];
                        confObject = point._confObject;
                        confObject.start += angle;
                        confObject.end += angle;
                        manager._setSliceShape(confObject);
                    }
                    manager.refreshDrawing();
                }
            },

            removeSlice: function (slice) {
                var manager = this,
                    pointElemStore = manager.pointElemStore,
                    confObject = slice._confObject,
                    elements = confObject.elements,
                    slicingWallsArr = manager.slicingWallsArr,
                    x,
                    ln = pointElemStore.length,
                    point,
                    wallElement;
                // remove the slice from the point store
                for (x = ln - 1; x >= 0; x -= 1) {
                    point = pointElemStore[x];
                    if (point === slice) {
                        pointElemStore.splice(x,1);
                    }
                }
                // remove the side elements from the side wall arr
                ln = slicingWallsArr.length;
                for (x = ln - 1; x >= 0; x -= 1) {
                    wallElement = slicingWallsArr[x];
                    if (wallElement === elements.startSlice || wallElement === elements.frontOuter1 ||
                        wallElement === elements.frontOuter || wallElement === elements.backInner ||
                        wallElement === elements.endSlice) {
                        slicingWallsArr.splice(x, 1);
                    }
                }

                // hide corrosponding elements
                slice.hide && slice.hide();

                // store the element in pool for future reuse
                if (!manager._slicePool) {
                    manager._slicePool = [];
                }
                manager._slicePool.push(slice);

                manager.refreshDrawing();
            },
            useSliceFromPool: function () {
                var manager = this,
                slicePool = manager._slicePool || (manager._slicePool = []),
                slicingWallsArr = manager.slicingWallsArr,
                newSlice = false,
                elements;
                if (slicePool.length) {
                    newSlice = slicePool.shift();
                    // restore the element in point store
                    manager.pointElemStore.push(newSlice);
                    // show the slice
                    newSlice.show();
                    // push the side walls in to the side wall array
                    elements = newSlice._confObject.elements;
                    slicingWallsArr.push(elements.startSlice, elements.frontOuter1, elements.frontOuter);

                    elements.backInner && slicingWallsArr.push(elements.backInner);
                    slicingWallsArr.push(elements.endSlice);
                }
                return newSlice;
            },
            // This function do the z-index management
            refreshDrawing : (function () {
                var elementZSortFn = function (a, b) {
                    var centerAngleDiff = (a._conf.index - b._conf.index) || (a._conf.cIndex - b._conf.cIndex) ||
                        (a._conf.isStart - b._conf.isStart) || (a._conf.si - b._conf.si);
                    //!centerAngleDiff && console.log("aaa");
                    return centerAngleDiff;
                },
                getStartIndex = function (array) {
                    var l,
                        i,
                        startsAtFrontHalf,
                        startIndex = array[0] && array[0]._conf.index,
                        atFrontHalf,
                        index;

                    startsAtFrontHalf = startIndex <= pi;
                    for (i = 1, l = array.length; i < l; i += 1) {
                        index = array[i]._conf.index;
                        atFrontHalf = index <= pi;
                        if (atFrontHalf != startsAtFrontHalf || index < startIndex) {
                            return i;
                        }
                    }
                    return 0;
                };

                return function () {
                    var slicingWallsArr = this.slicingWallsArr,
                        x = 0,
                        sWall,
                        ln = slicingWallsArr.length,
                        startIndex,
                        lastElem2,
                        lastElem3,
                        index,
                        frontGroup = this.slicingWallsFrontGroup,
                        backGroup =  this.slicingWallsBackGroup;

                    // sort the slicing walls for z-placing
                    slicingWallsArr.sort(elementZSortFn);
                    // find the index which cross the pi line
                    startIndex = getStartIndex(slicingWallsArr);

                    for (; x < ln; x += 1, startIndex += 1) {
                        if (startIndex === ln) {
                            startIndex = 0;
                        }
                        sWall = slicingWallsArr[startIndex], index = sWall._conf.index;
                        if (index < piBy2) {
                            frontGroup.appendChild(sWall);
                        }
                        else if (index <= pi) {
                            if (lastElem2) {
                                sWall.insertBefore(lastElem2);
                            }
                            else {
                                frontGroup.appendChild(sWall);
                            }
                            lastElem2 = sWall;
                        }
                        else if (index <= pi3By2) {
                            if (lastElem3) {
                                sWall.insertBefore(lastElem3);
                            }
                            else {
                                backGroup.appendChild(sWall);
                            }
                            lastElem3 = sWall;
                        }
                        else{
                            backGroup.appendChild(sWall);
                        }
                    }
                };
            })(),
            // @todo: needs to be optimize
            _setSliceShape : function (pointConf, doNotApply) {
                var Pie3DManager = this,
                    getArcPath = Pie3DManager.getArcPath,
                    startOri = pointConf.start, endOri = pointConf.end,
                    start = normalizeAngle(startOri),
                    end = normalizeAngle(endOri),
                    scaleAngle,
                    startCos, startSin, endCos, endSin, startOuterX, startOuterY,
                    startOuterTopClipX, startOuterTopClipY, endOuterTopClipX, endOuterTopClipY,
                    startInnerX, startInnerY, endInnerX, endInnerY, startInnerY1, endInnerY1,
                    borderThickness = 1,
                    isDoughnut = Pie3DManager.isDoughnut,
                    radiusYFactor = pointConf.radiusYFactor,
                    cx = pointConf.cx,
                    cy = pointConf.cy,
                    rx = pointConf.r,
                    ry = rx * radiusYFactor,
                    topCliprx = rx + (hasSVG ? -borderThickness : 2),
                    topClipry = ry + (hasSVG ? -borderThickness : 2),
                    innerRx = pointConf.innerR || 0,
                    innerRy = innerRx * radiusYFactor,
                    depth = Pie3DManager.depth,
                    depthY = depth + cy,
                    rightX = cx + rx,
                    leftX = cx - rx,
                    rightInnerX = cx + innerRx,
                    leftInnerX = cx - innerRx,
                    topY = cy - ry,
                    bottomY = depthY + ry,
                    clipPathforNoClip = [M, leftInnerX, topY, L, leftInnerX, bottomY, Z],
                    elements = pointConf.elements,
                    startOuterY1, endOuterX, endOuterY, endOuterY1,
                    tempArr1, tempArr2, tempArr3, tempArr4, tempArr5, tempArr6,
                    moveCmdArr,
                    lineCmdArr,
                    closeCmdArr,
                    centerPoint,
                    leftPoint,
                    topPoint,
                    rightPoint,
                    bottomPoint,
                    leftDepthPoint,
                    rightDepthPoint,
                    leftInnerPoint,
                    rightInnerPoint,
                    leftInnerDepthPoint,
                    rightInnerDepthPoint,
                    pathAttrString = 'path',
                    middleAngle = (start + end) / 2, // not applicable for the slices that are crossing the 0deg
                    frontOuterIndex,
                    BackOuterIndex,
                    crossed2Pi = start > end;

                startCos = mathCos(start);
                startSin = mathSin(start);
                endCos = mathCos(end);
                endSin = mathSin(end);

                startOuterX = cx + (rx * startCos);
                startOuterY = cy + (ry * startSin);
                startOuterTopClipX = cx + (topCliprx * startCos);
                startOuterTopClipY = cy + (topClipry * startSin);
                startOuterY1 = startOuterY + depth;
                endOuterX = cx + (rx * endCos);
                endOuterY = cy + (ry * endSin);
                endOuterTopClipX = cx + (topCliprx * endCos);
                endOuterTopClipY = cy + (topClipry * endSin);
                endOuterY1 = endOuterY + depth;

                if (isDoughnut) {//doughnut like slice
                    startInnerX = cx + (innerRx * startCos);
                    startInnerY = cy + (innerRy * startSin);
                    startInnerY1 = startInnerY + depth;
                    endInnerX = cx + (innerRx * endCos);
                    endInnerY = cy + (innerRy * endSin);
                    endInnerY1 = endInnerY + depth;
                    pointConf.startSlice = [M, startOuterX, startOuterY, L, startOuterX, startOuterY1, startInnerX,
                        startInnerY1, startInnerX, startInnerY, Z];
                    pointConf.endSlice = [M, endOuterX, endOuterY, L, endOuterX, endOuterY1, endInnerX, endInnerY1,
                        endInnerX, endInnerY, Z];
                }
                else {
                    pointConf.startSlice = [M, startOuterX, startOuterY, L, startOuterX, startOuterY1, cx, depthY, cx,
                        cy, Z];
                    pointConf.endSlice = [M, endOuterX, endOuterY, L, endOuterX, endOuterY1, cx, depthY, cx, cy, Z];
                }

                if (hasSVG) {
                    scaleAngle = getAbsScaleAngle (start, end);
                    //create the clip for top and bottom
                    if (!isDoughnut) {
                        pointConf.clipTopPath = [[M, startOuterX, startOuterY,
                                                 A, rx, ry, 0, (scaleAngle > pi ? 1 : 0), 1, endOuterX, endOuterY,
                                                 L, cx, cy,
                                                 Z]];
                    }
                    else {
                        pointConf.clipTopPath = [[M, startOuterX, startOuterY, A, rx, ry, 0, (scaleAngle > pi ? 1 : 0),
                                                 1, endOuterX, endOuterY, L, endInnerX, endInnerY, A, innerRx, innerRy,
                                                 0, (scaleAngle > pi ? 1 : 0), 0, startInnerX, startInnerY, Z]];
                    }

                    pointConf.clipOuterFrontPath1 = [clipPathforNoClip];

                    pointConf.clipTopBorderPath = [[M, startOuterTopClipX, startOuterTopClipY, A, topCliprx, topClipry,
                                                   0, (scaleAngle > pi ? 1 : 0), 1, endOuterTopClipX, endOuterTopClipY,
                                                   L, endOuterX, endOuterY, endOuterX, endOuterY + borderThickness, A,
                                                   rx, ry, 0, (scaleAngle > pi ? 1 : 0), 0, startOuterX, startOuterY +
                                                   borderThickness, L, startOuterX, startOuterY, Z]];

                    if (startOri != endOri) {
                        if(start > end) {//crossed the 0 deg line
                            if (start < pi){//crossed the 180 deg line also
                                pointConf.clipOuterFrontPath = [[M, rightX, cy,
                                                                A, rx, ry, 0, 0, 1, endOuterX, endOuterY,
                                                                V, depth,
                                                                A, rx, ry, 0, 0, 0, rightX, cy + depth,
                                                                Z]];
                                pointConf.clipOuterFrontPath1 = [[M, leftX, cy,
                                                                 A, rx, ry, 0, 0, 0, startOuterX, startOuterY,
                                                                 V, depth,
                                                                 A, rx, ry, 0, 0, 1, leftX, cy + depth,
                                                                 Z]];
                                pointConf.clipOuterBackPath = [[M, rightX, cy,
                                                               A, rx, ry, 0, 1, 0, leftX, cy,
                                                               V, depth,
                                                               A, rx, ry, 0, 1, 1, rightX, cy + depth,
                                                               Z]];
                                if (isDoughnut) {
                                    pointConf.clipInnerBackPath = [[M, rightInnerX, cy,
                                                                   A, innerRx, innerRy, 0, 1, 0, leftInnerX, cy,
                                                                   V, depth,
                                                                   A, innerRx, innerRy, 0, 1, 1, rightInnerX, cy +
                                                                   depth, Z]];

                                    pointConf.clipInnerFrontPath = [[M, rightInnerX, cy,
                                                                    A, innerRx, innerRy, 0, 0, 1, endInnerX, endInnerY,
                                                                    V, depth,
                                                                    A, innerRx, innerRy, 0, 0, 0, rightInnerX, cy +
                                                                    depth, Z,
                                                                    M, leftInnerX, cy,
                                                                    A, innerRx, innerRy, 0, 0, 0, startInnerX,
                                                                    startInnerY, V, depth,
                                                                    A, innerRx, innerRy, 0, 0, 1, leftInnerX, cy +
                                                                    depth, Z]];

                                }
                            }
                            else if( end > pi) {//crossed the 180 deg line also
                                pointConf.clipOuterFrontPath = [[M, rightX, cy,
                                                                A, rx, ry, 0, 1, 1, leftX, cy,
                                                                V, depth,
                                                                A, rx, ry, 0, 1, 0, rightX, cy + depth,
                                                                Z]];
                                pointConf.clipOuterBackPath = [[M, leftX, cy,
                                                               A, rx, ry, 0, 0, 1, endOuterX, endOuterY,
                                                               V, depth,
                                                               A, rx, ry, 0, 0, 0, leftX, cy + depth,
                                                               Z,
                                                               M, rightX, cy,
                                                               A, rx, ry, 0, 0, 0, startOuterX, startOuterY,
                                                               V, depth,
                                                               A, rx, ry, 0, 0, 1, rightX, cy + depth,
                                                               Z]];
                                if (isDoughnut) {

                                    pointConf.clipInnerFrontPath = [[M, rightInnerX, cy,
                                                                    A, innerRx, innerRy, 0, 1, 1, leftInnerX, cy,
                                                                    V, depth,
                                                                    A, innerRx, innerRy, 0, 1, 0, rightInnerX, cy +
                                                                    depth, Z]];

                                    pointConf.clipInnerBackPath = [[M, leftInnerX, cy,
                                                                   A, innerRx, innerRy, 0, 0, 1, endInnerX, endInnerY,
                                                                   V, depth,
                                                                   A, innerRx, innerRy, 0, 0, 0, leftInnerX, cy +
                                                                   depth, Z,
                                                                   M, rightInnerX, cy,
                                                                   A, innerRx, innerRy, 0, 0, 0, startInnerX,
                                                                   startInnerY, V, depth,
                                                                   A, innerRx, innerRy, 0, 0, 1, rightInnerX, cy +
                                                                   depth, Z]];
                                }
                            }
                            else {
                                pointConf.clipOuterFrontPath = [[M, rightX, cy,
                                                                A, rx, ry, 0, 0, 1, endOuterX, endOuterY,
                                                                V, depth,
                                                                A, rx, ry, 0, 0, 0, rightX, cy + depth,
                                                                Z]];
                                pointConf.clipOuterBackPath = [[M, startOuterX, startOuterY,
                                                               A, rx, ry, 0, 0, 1, rightX, cy,
                                                               V, depth,
                                                               A, rx, ry, 0, 0, 0, startOuterX, startOuterY1,
                                                               Z]];
                                if (isDoughnut) {

                                    pointConf.clipInnerFrontPath = [[M, rightInnerX, cy,
                                                                    A, innerRx, innerRy, 0, 0, 1, endInnerX, endInnerY,
                                                                    V, depth,
                                                                    A, innerRx, innerRy, 0, 0, 0, rightInnerX, cy +
                                                                    depth, Z]];

                                    pointConf.clipInnerBackPath = [[M, startInnerX, startInnerY,
                                                                   A, innerRx, innerRy, 0, 0, 1, rightInnerX, cy,
                                                                   V, depth,
                                                                   A, innerRx, innerRy, 0, 0, 0, startInnerX,
                                                                   startInnerY1, Z]];
                                }
                            }
                        }
                        else if (start < pi){
                            if (end > pi) {//crossed the 180 deg line only
                                pointConf.clipOuterFrontPath = [[M, startOuterX, startOuterY,
                                                                A, rx, ry, 0, 0, 1, leftX, cy,
                                                                V, depth,
                                                                A, rx, ry, 0, 0, 0, startOuterX, startOuterY1,
                                                                Z]];
                                pointConf.clipOuterBackPath = [[M, leftX, cy,
                                                               A, rx, ry, 0, 0, 1, endOuterX, endOuterY,
                                                               V, depth,
                                                               A, rx, ry, 0, 0, 0, leftX, cy + depth,
                                                               Z]];
                                if (isDoughnut) {
                                    pointConf.clipInnerFrontPath = [[M, startInnerX, startInnerY,
                                                                        A, innerRx, innerRy, 0, 0, 1, leftInnerX,
                                                                        cy, V, depth,
                                                                        A, innerRx, innerRy, 0, 0, 0, startInnerX,
                                                                        startInnerY1, Z]];
                                    pointConf.clipInnerBackPath = [[M, leftInnerX, cy,
                                                                       A, innerRx, innerRy, 0, 0, 1, endInnerX,
                                                                       endInnerY, V, depth,
                                                                       A, innerRx, innerRy, 0, 0, 0, leftInnerX,
                                                                       cy + depth, Z]];
                                }
                            }
                            else {//haven't crossed any thing
                                pointConf.clipOuterFrontPath = [[M, startOuterX, startOuterY,
                                                                A, rx, ry, 0, 0, 1, endOuterX, endOuterY,
                                                                V, depth,
                                                                A, rx, ry, 0, 0, 0, startOuterX, startOuterY1,
                                                                Z]];
                                pointConf.clipOuterBackPath = [clipPathforNoClip];

                                if (isDoughnut) {

                                    pointConf.clipInnerFrontPath = [[M, startInnerX, startInnerY,
                                                                    A, innerRx, innerRy, 0, 0, 1, endInnerX, endInnerY,
                                                                    V, depth,
                                                                    A, innerRx, innerRy, 0, 0, 0, startInnerX,
                                                                    startInnerY1, Z]];

                                    pointConf.clipInnerBackPath = [clipPathforNoClip];

                                }
                            }
                        }
                        else {//haven't crossed any thing
                            pointConf.clipOuterFrontPath = [clipPathforNoClip];
                            pointConf.clipOuterBackPath = [[M, startOuterX, startOuterY,
                                                           A, rx, ry, 0, 0, 1, endOuterX, endOuterY,
                                                           V, depth,
                                                           A, rx, ry, 0, 0, 0, startOuterX, startOuterY1,
                                                           Z]];
                            if (isDoughnut) {

                                pointConf.clipInnerFrontPath = [clipPathforNoClip];

                                pointConf.clipInnerBackPath = [[M, startInnerX, startInnerY,
                                                               A, innerRx, innerRy, 0, 0, 1, endInnerX, endInnerY,
                                                               V, depth,
                                                               A, innerRx, innerRy, 0, 0, 0, startInnerX, startInnerY1,
                                                               Z]];
                            }
                        }
                    }
                    else {//zero Pie
                        pointConf.clipOuterFrontPath = pointConf.clipOuterBackPath = pointConf.clipInnerBackPath =
                        pointConf.clipInnerFrontPath = [clipPathforNoClip];
                    }

                    pathAttrString = 'litepath';
                    pointConf.clipBottomBorderPath = pointConf.clipTopPath;
                    pointConf.startSlice = [pointConf.startSlice];
                    pointConf.endSlice = [pointConf.endSlice];
                }
                else {//for VML
                    moveCmdArr = Pie3DManager.moveCmdArr;
                    lineCmdArr = Pie3DManager.lineCmdArr;
                    closeCmdArr = Pie3DManager.closeCmdArr;
                    centerPoint = [cx, cy];
                    leftPoint = [leftX, cy];
                    topPoint = [cx, topY];
                    rightPoint = [rightX, cy];
                    bottomPoint = [cx, cy + ry];
                    leftDepthPoint = [leftX, depthY];
                    rightDepthPoint = [rightX, depthY];
                    leftInnerPoint = [leftInnerX, cy];
                    rightInnerPoint = [rightInnerX, cy];
                    leftInnerDepthPoint = [leftInnerX, depthY];
                    rightInnerDepthPoint = [rightInnerX, depthY];
                    pointConf.clipOuterFrontPath1 = [];
                    if (startOri != endOri) {
                        if(start > end) {//crossed the 0 deg line
                            if (start < pi){//crossed the 180 deg line also
                                tempArr1 = getArcPath(cx, cy, startOuterX, startOuterY, leftX, cy, rx, ry, 1, 0);
                                tempArr3 = getArcPath(cx, cy, leftX, cy, rightX, cy, rx, ry, 1, 0);
                                tempArr5 = getArcPath(cx, cy, rightX, cy, endOuterX, endOuterY, rx, ry, 1, 0);
                                pointConf.clipOuterBackPath = moveCmdArr.concat(leftPoint, tempArr3, lineCmdArr,
                                    rightDepthPoint, getArcPath(cx, depthY, rightX,
                                        depthY, leftX, depthY, rx, ry, 0, 0), closeCmdArr);
                                pointConf.clipOuterFrontPath1 = moveCmdArr.concat( [startOuterX, startOuterY], tempArr1,
                                    lineCmdArr, leftDepthPoint, getArcPath(cx, depthY, leftX, depthY, startOuterX,
                                    startOuterY1, rx, ry, 0, 0), closeCmdArr);
                                pointConf.clipOuterFrontPath = moveCmdArr.concat(rightPoint,
                                    tempArr5, lineCmdArr, [endOuterX, endOuterY1], getArcPath(cx, depthY, endOuterX,
                                        endOuterY1, rightX, depthY, rx, ry, 0, 0), closeCmdArr);
                                pointConf.clipTopBorderPath = moveCmdArr.concat([startOuterX, startOuterY], tempArr1,
                                    tempArr3, tempArr5);
                                if (isDoughnut) {
                                    tempArr2 = getArcPath(cx, cy, endInnerX, endInnerY, rightInnerX, cy, innerRx,
                                        innerRy, 0, 0);
                                    tempArr4 = getArcPath(cx, cy, rightInnerX, cy, leftInnerX, cy, innerRx,
                                        innerRy, 0, 0);
                                    tempArr6 = getArcPath(cx, cy, leftInnerX, cy, startInnerX, startInnerY,
                                        innerRx, innerRy, 0, 0);
                                    pointConf.clipInnerBackPath = moveCmdArr.concat(rightInnerPoint, tempArr4,
                                        lineCmdArr, leftInnerDepthPoint,
                                        getArcPath(cx, depthY, leftInnerX, depthY, rightInnerX, depthY,
                                        innerRx, innerRy, 1, 0), closeCmdArr);
                                    pointConf.clipInnerFrontPath = moveCmdArr.concat(leftInnerPoint, tempArr6,
                                        lineCmdArr, [startInnerX, startInnerY1], getArcPath(cx, depthY, startInnerX,
                                            startInnerY1, leftInnerX, depthY, innerRx, innerRy, 1, 0), closeCmdArr,
                                            moveCmdArr,
                                            [endInnerX, endInnerY], tempArr2, lineCmdArr, rightInnerDepthPoint,
                                            getArcPath(cx, depthY, rightInnerX, depthY, endInnerX, endInnerY1,
                                            innerRx, innerRy, 1, 0), closeCmdArr);
                                    pointConf.clipTopPath = pointConf.clipTopBorderPath.concat(lineCmdArr, [endInnerX,
                                        endInnerY], tempArr2, tempArr4, tempArr6, closeCmdArr);
                                    pointConf.clipTopBorderPath = pointConf.clipTopBorderPath.concat(moveCmdArr,
                                        [endInnerX, endInnerY], tempArr2, tempArr4, tempArr6);

                                }
                                else {
                                    pointConf.clipTopPath = pointConf.clipTopBorderPath.concat(lineCmdArr, centerPoint,
                                    closeCmdArr);
                                }
                            }
                            else if( end > pi) {//crossed the 180 deg line also
                                tempArr1 = getArcPath(cx, cy, startOuterX, startOuterY, rightX, cy, rx, ry, 1, 0);
                                tempArr3 = getArcPath(cx, cy, rightX, cy, leftX, cy, rx, ry, 1, 0);
                                tempArr5 = getArcPath(cx, cy, leftX, cy, endOuterX, endOuterY, rx, ry, 1, 0);
                                pointConf.clipOuterFrontPath = moveCmdArr.concat(rightPoint, tempArr3, lineCmdArr,
                                leftDepthPoint,
                                    getArcPath(cx, depthY, leftX,
                                        depthY, rightX, depthY, rx, ry, 0, 0), closeCmdArr);
                                pointConf.clipOuterBackPath = moveCmdArr.concat( [startOuterX, startOuterY], tempArr1,
                                    lineCmdArr,
                                    rightDepthPoint, getArcPath(cx, depthY, rightX,
                                        depthY, startOuterX, startOuterY1, rx, ry, 0, 0), closeCmdArr, moveCmdArr,
                                        leftPoint,
                                    tempArr5, lineCmdArr, [endOuterX, endOuterY1], getArcPath(cx, depthY, endOuterX,
                                        endOuterY1, leftX, depthY, rx, ry, 0, 0), closeCmdArr);
                                pointConf.clipTopBorderPath = moveCmdArr.concat([startOuterX, startOuterY], tempArr1,
                                    tempArr3, tempArr5);
                                if (isDoughnut) {
                                    tempArr2 = getArcPath(cx, cy, endInnerX, endInnerY, leftInnerX, cy, innerRx,
                                        innerRy, 0, 0);
                                    tempArr4 = getArcPath(cx, cy, leftInnerX, cy, rightInnerX, cy, innerRx,
                                        innerRy, 0, 0);
                                    tempArr6 = getArcPath(cx, cy, rightInnerX, cy, startInnerX, startInnerY,
                                        innerRx, innerRy, 0, 0);
                                    pointConf.clipInnerFrontPath = moveCmdArr.concat(leftInnerPoint, tempArr4,
                                        lineCmdArr, rightInnerDepthPoint,
                                        getArcPath(cx, depthY, rightInnerX, depthY, leftInnerX, depthY,
                                        innerRx, innerRy, 1, 0), closeCmdArr);
                                    pointConf.clipInnerBackPath = moveCmdArr.concat(rightInnerPoint, tempArr6,
                                        lineCmdArr, [startInnerX, startInnerY1], getArcPath(cx, depthY, startInnerX,
                                            startInnerY1, rightInnerX, depthY, innerRx, innerRy, 1, 0),
                                            closeCmdArr, moveCmdArr, [endInnerX, endInnerY], tempArr2, lineCmdArr,
                                            leftInnerDepthPoint, getArcPath(cx, depthY, leftInnerX, depthY,
                                            endInnerX, endInnerY1, innerRx, innerRy, 1, 0), closeCmdArr);

                                    pointConf.clipTopPath = pointConf.clipTopBorderPath.concat(lineCmdArr, [endInnerX,
                                        endInnerY], tempArr2, tempArr4, tempArr6, closeCmdArr);
                                    pointConf.clipTopBorderPath = pointConf.clipTopBorderPath.concat(moveCmdArr,
                                        [endInnerX, endInnerY], tempArr2, tempArr4, tempArr6);

                                }
                                else {
                                    pointConf.clipTopPath = pointConf.clipTopBorderPath.concat(lineCmdArr, centerPoint,
                                    closeCmdArr);
                                }
                            }
                            else {
                                tempArr1 = getArcPath(cx, cy, startOuterX, startOuterY, rightX, cy, rx, ry, 1, 0);
                                tempArr3 = getArcPath(cx, cy, rightX, cy, endOuterX, endOuterY, rx, ry, 1, 0);
                                pointConf.clipOuterFrontPath = moveCmdArr.concat(rightPoint, tempArr3, lineCmdArr,
                                    [endOuterX, endOuterY1], getArcPath(cx, depthY, endOuterX, endOuterY1, rightX,
                                    depthY, rx, ry, 0, 0), closeCmdArr);
                                pointConf.clipOuterBackPath = moveCmdArr.concat( [startOuterX, startOuterY], tempArr1,
                                    lineCmdArr, rightDepthPoint, getArcPath(cx, depthY, rightX, depthY,
                                    startOuterX, startOuterY1, rx, ry, 0, 0), closeCmdArr);
                                pointConf.clipTopBorderPath = moveCmdArr.concat([startOuterX, startOuterY], tempArr1,
                                    tempArr3);
                                if (isDoughnut) {
                                    tempArr2 = getArcPath(cx, cy, endInnerX, endInnerY, rightInnerX, cy, innerRx,
                                        innerRy, 0, 0);
                                    tempArr4 = getArcPath(cx, cy, rightInnerX, cy, startInnerX, startInnerY,
                                        innerRx, innerRy, 0, 0);
                                    pointConf.clipInnerFrontPath = moveCmdArr.concat([endInnerX, endInnerY], tempArr2,
                                        lineCmdArr, rightInnerDepthPoint,
                                        getArcPath(cx, depthY, rightInnerX, depthY, endInnerX, endInnerY1, innerRx,
                                        innerRy, 1, 0), closeCmdArr);
                                    pointConf.clipInnerBackPath = moveCmdArr.concat(rightInnerPoint, tempArr4,
                                        lineCmdArr, [startInnerX, startInnerY1], getArcPath(cx, depthY, startInnerX,
                                            startInnerY1, rightInnerX, depthY, innerRx, innerRy, 1, 0),
                                            closeCmdArr);
                                    pointConf.clipTopPath = pointConf.clipTopBorderPath.concat(lineCmdArr, [endInnerX,
                                        endInnerY], tempArr2, tempArr4, closeCmdArr);
                                    pointConf.clipTopBorderPath = pointConf.clipTopBorderPath.concat(moveCmdArr,
                                        [endInnerX, endInnerY], tempArr2, tempArr4);

                                }
                                else {
                                    pointConf.clipTopPath = pointConf.clipTopBorderPath.concat(lineCmdArr, centerPoint,
                                    closeCmdArr);
                                }
                            }
                        }
                        else if (start < pi){
                            if (end > pi) {//crossed the 180 deg line only
                                tempArr1 = getArcPath(cx, cy, startOuterX, startOuterY, leftX, cy, rx, ry, 1, 0);
                                tempArr3 = getArcPath(cx, cy, leftX, cy, endOuterX, endOuterY, rx, ry, 1, 0);
                                pointConf.clipOuterBackPath = moveCmdArr.concat(leftPoint, tempArr3, lineCmdArr,
                                    [endOuterX, endOuterY1],
                                    getArcPath(cx, depthY, endOuterX,
                                        endOuterY1, leftX, depthY, rx, ry, 0, 0), closeCmdArr);
                                pointConf.clipOuterFrontPath = moveCmdArr.concat( [startOuterX, startOuterY], tempArr1,
                                    lineCmdArr,
                                    leftDepthPoint, getArcPath(cx, depthY, leftX,
                                        depthY, startOuterX, startOuterY1, rx, ry, 0, 0), closeCmdArr);
                                pointConf.clipTopBorderPath = moveCmdArr.concat([startOuterX, startOuterY], tempArr1,
                                    tempArr3);
                                if (isDoughnut) {
                                    tempArr2 = getArcPath(cx, cy, endInnerX, endInnerY, leftInnerX, cy, innerRx,
                                    innerRy, 0, 0);
                                    tempArr4 = getArcPath(cx, cy, leftInnerX, cy, startInnerX, startInnerY,
                                        innerRx, innerRy, 0, 0);
                                    pointConf.clipInnerBackPath = moveCmdArr.concat([endInnerX, endInnerY], tempArr2,
                                        lineCmdArr, leftInnerDepthPoint,
                                        getArcPath(cx, depthY, leftInnerX, depthY, endInnerX, endInnerY1, innerRx,
                                        innerRy, 1, 0), closeCmdArr);
                                    pointConf.clipInnerFrontPath = moveCmdArr.concat(leftInnerPoint, tempArr4,
                                        lineCmdArr, [startInnerX, startInnerY1], getArcPath(cx, depthY, startInnerX,
                                            startInnerY1, leftInnerX, depthY, innerRx, innerRy, 1, 0),
                                            closeCmdArr);
                                    pointConf.clipTopPath = pointConf.clipTopBorderPath.concat(lineCmdArr, [endInnerX,
                                        endInnerY], tempArr2, tempArr4, closeCmdArr);
                                    pointConf.clipTopBorderPath = pointConf.clipTopBorderPath.concat(moveCmdArr,
                                        [endInnerX, endInnerY], tempArr2, tempArr4);

                                }
                                else {
                                    pointConf.clipTopPath = pointConf.clipTopBorderPath.concat(lineCmdArr, centerPoint,
                                        closeCmdArr);
                                }
                            }
                            else {//haven't crossed any thing
                                tempArr1 = getArcPath(cx, cy, startOuterX, startOuterY, endOuterX, endOuterY, rx, ry, 1,
                                    0);
                                pointConf.clipOuterBackPath = moveCmdArr.concat([startOuterX, startOuterY]);
                                pointConf.clipTopBorderPath = pointConf.clipOuterBackPath.concat(tempArr1);
                                pointConf.clipOuterFrontPath = pointConf.clipTopBorderPath.concat( lineCmdArr,
                                    [endOuterX, endOuterY1], getArcPath(cx, depthY, endOuterX,
                                        endOuterY1, startOuterX, startOuterY1, rx, ry, 0, 0), closeCmdArr);
                                if (isDoughnut) {
                                    tempArr2 = getArcPath(cx, cy, endInnerX, endInnerY, startInnerX, startInnerY,
                                        innerRx, innerRy, 0, 0);
                                    pointConf.clipInnerBackPath = moveCmdArr.concat([endInnerX, endInnerY]);
                                    pointConf.clipTopPath = pointConf.clipTopBorderPath.concat(lineCmdArr, [endInnerX,
                                        endInnerY], tempArr2, closeCmdArr);
                                    pointConf.clipTopBorderPath = pointConf.clipTopBorderPath.concat(moveCmdArr,
                                        [endInnerX, endInnerY], tempArr2);
                                    pointConf.clipInnerFrontPath = pointConf.clipInnerBackPath.concat(tempArr2,
                                        lineCmdArr, [startInnerX, startInnerY1], getArcPath(cx, depthY, startInnerX,
                                            startInnerY1, endInnerX, endInnerY1, innerRx, innerRy, 1, 0), closeCmdArr);

                                }
                                else {
                                    pointConf.clipTopPath = pointConf.clipTopBorderPath.concat(lineCmdArr, centerPoint,
                                        closeCmdArr);
                                }
                            }
                        }
                        else {//haven't crossed any thing
                            tempArr1 = getArcPath(cx, cy, startOuterX, startOuterY, endOuterX, endOuterY, rx, ry, 1, 0);
                            pointConf.clipOuterFrontPath = moveCmdArr.concat([startOuterX, startOuterY]);
                            pointConf.clipTopBorderPath = pointConf.clipOuterFrontPath.concat(tempArr1);
                            pointConf.clipOuterBackPath = pointConf.clipTopBorderPath.concat( lineCmdArr,
                                [endOuterX, endOuterY1], getArcPath(cx, depthY, endOuterX,
                                    endOuterY1, startOuterX, startOuterY1, rx, ry, 0, 0), closeCmdArr);
                            if (isDoughnut) {
                                tempArr2 = getArcPath(cx, cy, endInnerX, endInnerY, startInnerX, startInnerY, innerRx,
                                    innerRy, 0, 0);
                                pointConf.clipInnerFrontPath = moveCmdArr.concat([endInnerX, endInnerY]);
                                pointConf.clipTopPath = pointConf.clipTopBorderPath.concat(lineCmdArr, [endInnerX,
                                    endInnerY], tempArr2, closeCmdArr);
                                pointConf.clipTopBorderPath = pointConf.clipTopBorderPath.concat(
                                    pointConf.clipInnerFrontPath, tempArr2);
                                pointConf.clipInnerBackPath = pointConf.clipInnerFrontPath.concat(tempArr2,
                                    lineCmdArr, [startInnerX, startInnerY1], getArcPath(cx, depthY, startInnerX,
                                        startInnerY1, endInnerX, endInnerY1, innerRx, innerRy, 1, 0), closeCmdArr);

                            }
                            else {
                                pointConf.clipTopPath = pointConf.clipTopBorderPath.concat(lineCmdArr, centerPoint,
                                    closeCmdArr);
                            }
                        }
                        //enlarge the bounded box so that the gradient works perfactly
                        tempArr1 = moveCmdArr.concat(leftPoint, lineCmdArr, rightPoint);
                        tempArr2 = moveCmdArr.concat(topPoint, lineCmdArr, bottomPoint);
                        pointConf.clipTopPath = pointConf.clipTopPath.concat(tempArr1, tempArr2);
                        pointConf.clipOuterFrontPath = pointConf.clipOuterFrontPath.concat(tempArr1);
                        pointConf.clipOuterFrontPath1 = pointConf.clipOuterFrontPath1.concat(tempArr1);
                        pointConf.clipOuterBackPath = pointConf.clipOuterBackPath.concat(tempArr1);

                        if (isDoughnut) {
                            tempArr2 = moveCmdArr.concat(leftInnerPoint, lineCmdArr, rightInnerPoint);
                            pointConf.clipInnerFrontPath = pointConf.clipInnerFrontPath.concat(tempArr2);
                            pointConf.clipInnerBackPath = pointConf.clipInnerBackPath.concat(tempArr2);
                        }
                    }
                    else {//zero Pie
                        pointConf.clipTopPath =
                        pointConf.clipOuterFrontPath =
                        pointConf.clipOuterBackPath = [];
                        if (isDoughnut) {
                            pointConf.clipInnerFrontPath =
                            pointConf.clipInnerBackPath = [];
                        }
                    }

                    pointConf.clipBottomBorderPath = pointConf.clipTopBorderPath;
                }

                //now apply the changes
                if (!doNotApply) {
                    elements.startSlice._conf.index = start;
                    elements.endSlice._conf.index = end;
                    elements.backOuter._conf.index = BackOuterIndex =
                     (crossed2Pi && (start <= pi3By2 || end > pi3By2)) ||
                     (start <= pi3By2 && end > pi3By2) ? pi3By2 : (start > pi ? start : end);

                    elements.frontOuter._conf.index = frontOuterIndex = end <= piBy2 ? end : ((start > end ||
                        start <= piBy2) ? piBy2 : start);
                    elements.frontOuter1._conf.index = start;
                    elements.frontOuter1._conf.cIndex = pi;
                    if (start > end) {
                        elements.backOuter._conf.cIndex = start < pi3By2 ? pi3By2 : pi2;
                        elements.startSlice._conf.cIndex = start < pi ? (start + pi) / 2 : (start + pi2) / 2;
                        elements.endSlice._conf.cIndex = elements.frontOuter._conf.cIndex = 0;
                    }
                    else {
                        elements.backOuter._conf.cIndex = elements.startSlice._conf.cIndex =
                        elements.endSlice._conf.cIndex = elements.frontOuter._conf.cIndex = middleAngle;
                    }

                    if (scaleAngle > pi) {
                        elements.frontOuter1.show().attr(
                            pathAttrString, pointConf.clipOuterFrontPath1
                        );
                    }
                    else {
                        elements.frontOuter1.hide();
                    }
                    pointConf.thisElement._attr(
                        pathAttrString, pointConf.clipTopPath
                    );
                    elements.bottom.attr(
                        pathAttrString, pointConf.clipTopPath
                    );
                    elements.bottomBorder.attr(
                        pathAttrString, pointConf.clipBottomBorderPath
                    );

                    elements.topBorder && elements.topBorder.attr(
                        pathAttrString, pointConf.clipTopBorderPath
                    );
                    elements.frontOuter.attr(
                        pathAttrString, pointConf.clipOuterFrontPath
                    );
                    elements.backOuter.attr(
                        pathAttrString, pointConf.clipOuterBackPath
                    );

                    if (isDoughnut) {
                        elements.backInner.attr(
                            pathAttrString, pointConf.clipInnerBackPath
                        );
                        elements.frontInner.attr(
                            pathAttrString, pointConf.clipInnerFrontPath
                        );
                        elements.backInner._conf.index = BackOuterIndex;
                        elements.frontInner._conf.index = frontOuterIndex;
                        if (start > end) {
                            elements.backInner._conf.cIndex = pi2;
                            elements.frontInner._conf.cIndex = 0;
                        }
                        else {
                            elements.backInner._conf.cIndex =
                             elements.frontInner._conf.cIndex = middleAngle;
                        }
                    }

                    if (Pie3DManager.hasOnePoint) {
                        elements.startSlice.hide();
                        elements.endSlice.hide();
                    }
                    else {
                        elements.startSlice.attr(
                            pathAttrString, pointConf.startSlice
                        ).show();
                        elements.endSlice.attr(
                            pathAttrString, pointConf.endSlice
                        ).show();
                    }
                }
            },

            _setSliceCosmetics: function (pointConf) {
                var manager = this,
                    topElement = pointConf.thisElement,
                    showBorderEffect = pointConf.showBorderEffect,
                    elements = pointConf.elements,
                    colorObj,
                    borderColor = convertColor(pointConf.borderColor, pluckNumber(pointConf.borderAlpha,
                        pointConf.alpha)),
                    borderWidth = pointConf.borderWidth,
                    topAttrObj;
                if (!pointConf.color) {
                    return;
                }
                colorObj = manager._parseSliceColor(pointConf.color, pointConf.alpha, pointConf);
                if (hasSVG) {
                    topAttrObj = {fill: toRaphaelColor(colorObj.top), 'stroke-width': 0};

                    if (showBorderEffect) {
                        elements.topBorder.show().attr({
                            fill: toRaphaelColor(colorObj.topBorder),
                            'stroke-width': 0
                        });
                    }
                    else {
                        elements.topBorder.hide();
                        topAttrObj.stroke = borderColor;
                        topAttrObj['stroke-width'] = borderWidth;
                    }

                    // top
                    topElement._attr(topAttrObj);
                }
                else {
                    topElement._attr({
                        fill: toRaphaelColor(colorObj.top),
                        'stroke-width': 0
                    });
                    // top border
                    elements.topBorder.attr({
                        stroke: borderColor,
                        'stroke-width': borderWidth
                    });
                }

                // bottom
                elements.bottom.attr({
                    fill: toRaphaelColor(colorObj.bottom)
                });

                // bottom
                elements.bottomBorder.attr({
                    stroke: borderColor,
                    'stroke-width': borderWidth
                });

                elements.frontOuter.attr({
                    fill: toRaphaelColor(colorObj.frontOuter)
                });
                elements.frontOuter1.attr({
                    fill: toRaphaelColor(colorObj.frontOuter)
                });

                // outerback
                elements.backOuter.attr({
                    fill: toRaphaelColor(colorObj.backOuter)
                });

                // startSlice
                // whenAtBack
                elements.startSlice.attr({
                    fill: toRaphaelColor(colorObj.startSlice),
                    stroke: borderColor,
                    'stroke-width': borderWidth
                });

                // endSlice
                // whenAtBack
                elements.endSlice.attr({
                    fill: toRaphaelColor(colorObj.endSlice),
                    stroke: borderColor,
                    'stroke-width': borderWidth
                });
                if (manager.isDoughnut) {
                    // innerFront
                    elements.frontInner.attr({
                        fill: toRaphaelColor(colorObj.frontInner)
                    });

                    elements.backInner.attr({
                        fill: toRaphaelColor(colorObj.backInner)
                    });
                }

            },

            /**
             * This function create a new 3d slice and return that for futher use
             * @returns {slice} an raphael like composite object that can be used as a slice element
             * @todo update slice color depending upon angle
             * @todo For proper z-index create 2 back outer element for larger (>180 deg) slices
             * @todo Optimize ***** the element creation, instead of outer1, back and from for all elements,
             * create few extra element per manager, which will act as outer1, back / front (inner / outer wall) for
             *  slices, who has both. Because, at max 1 slice can have outer1 and only 2 slice can have
             *   back and front both
             */
            createSlice: (function () {
                var attrKeyList = {
                    //block following attribute
                    stroke: true,
                    strokeWidth: true,
                    'stroke-width': true,
                    dashstyle: true,
                    'stroke-dasharray': true,
                    translateX: true,
                    translateY: true,
                    'stroke-opacity': true,
                    fill: true,
                    opacity: true,
                    // attribute that has direct effect
                    transform: true,
                    ishot : true,
                    cursor: true,
                    start: true,
                    end : true,
                    color: true,
                    alpha: true,
                    borderColor: true,
                    borderAlpha: true,
                    borderWidth: true,
                    rolloverProps: true,
                    showBorderEffect: true,
                    positionIndex: true,
                    cx: true,
                    cy: true,
                    radiusYFactor: true,
                    r: true,
                    innerR: true
                },
                attrFN = function(hash, val) {
                    var key,
                        value,
                        slice = this,
                        confObject = slice._confObject,
                        commonAttr = {},
                        elements = confObject.elements,
                        x,
                        updateShape,
                        updateColor,
                        Pie3DManager = confObject.Pie3DManager,
                        applyCommonAttr,
                        attrObj;

                    // single key-value pair
                    if (isString(hash) && defined(val)) {
                        key = hash;
                        hash = {};
                        hash[key] = val;
                    }

                    // used as a getter: first argument is a string, second is undefined
                    if (!hash || isString(hash)) {
                        if (attrKeyList[hash]) {
                            slice = confObject[hash];
                        }
                        else {
                            slice = slice._attr(hash);
                        }
                        // setter
                    } else {

                        for (key in hash) {
                            value = hash[key];

                            //if belongs from the list then handle here
                            if (attrKeyList[key]) {
                                //store the att in confObject for further use
                                confObject[key] = value;
                                if (key === 'ishot' || key === 'cursor' || key === 'transform') {
                                    attrObj = {};
                                    commonAttr[key] = value;
                                    applyCommonAttr = true;

                                }
                                /* jshint ignore:end */
                                else if (key === 'start' || key === 'end' || key === 'cx' || key === 'cy' ||
                                    key === 'radiusYFactor' || key === 'r' || key === 'innerR') {
                                    updateShape = true;
                                }
                                else if (key === 'color' || key === 'alpha' || key === 'borderColor' ||
                                    key === 'borderAlpha' || key === 'borderWidth'){
                                    updateColor = true;
                                }
                            } else { //else leve for the original attr
                                slice._attr(key, value);
                            }
                        }

                        // if paths need to be updated
                        if (updateShape) {
                            Pie3DManager._setSliceShape(confObject);
                            //refreash the drawinh for proper z lavel for elements
                            Pie3DManager.refreshDrawing();
                        }
                        // if colors need to be updated
                        // If the shape got changed, then also cange the color
                        if (updateColor || updateShape) {
                            Pie3DManager._setSliceCosmetics(confObject);
                        }
                        // apply common attributes
                        if (applyCommonAttr) {
                            //other elements
                            for (x in elements) {
                                elements[x].attr(commonAttr);
                            }
                            //main element
                            slice._attr(commonAttr);
                        }

                    }
                    return slice;
                },
                onFN = function (eventType, handler) {
                    var slice = this,
                    confObject = slice._confObject,
                    elements = confObject.elements,
                    element;

                    for (element in elements) {
                        elements[element].on(eventType, handler);
                    }
                    return slice._on(eventType, handler);
                },
                onDragFN = function (dragStart, dragMove, dragEnd) {
                    var element,
                        slice = this,
                        confObject = slice._confObject,
                        elements = confObject.elements,
                        navigator = win.navigator,
                        ua = navigator.userAgent.toLowerCase(),
                        isAndroid = ua.indexOf('android') > -1;
                    for (element in elements) {
                        if (isAndroid) {
                            if (element === 'topBorder' || element === 'frontOuter' || element === 'startSlice' ||
                                element === 'endSlice') {
                                elements[element].drag(dragStart, dragMove, dragEnd);
                            }
                        }
                        else {
                            elements[element].drag(dragStart, dragMove, dragEnd);
                        }
                    }
                    return slice._drag(dragStart, dragMove, dragEnd);
                },
                hideFN = function () {
                    var slice = this,
                    confObject = slice._confObject,
                    elements = confObject.elements,
                    element;

                    for (element in elements) {
                        elements[element].hide();
                    }
                    return slice._hide();
                },
                showFN = function () {
                    var slice = this,
                    confObject = slice._confObject,
                    elements = confObject.elements,
                    element;

                    for (element in elements) {
                        elements[element].show();
                    }
                    return slice._show();
                },
                destroyFN = function () {
                    var confObject = this._confObject,
                    elements = confObject.elements, x;
                    //other elements
                    for (x in elements) {
                        elements[x].destroy();
                    }
                    if (hasSVG) {
                        //destory other element
                        /** @todo check whether this clip elements are not destroying from else where */
                        confObject.clipTop.destroy();
                        confObject.clipOuterFront.destroy();
                        confObject.clipOuterBack.destroy();
                        if (confObject.clipOuterFront1) {
                            confObject.clipOuterFront1.destroy();
                        }
                        if (confObject.clipInnerFront) {
                            confObject.clipInnerFront.destroy();
                        }
                        if (confObject.clipInnerBack) {
                            confObject.clipInnerBack.destroy();
                        }
                    }
                    //main element
                    return this._destroy();
                },
                tooltipFN = function (tooltext) {
                    var slice = this,
                    confObject = slice._confObject,
                    elements = confObject.elements,
                    element;
                    //other elements
                    for (element in elements) {
                        elements[element].tooltip(tooltext);
                    }
                    //main element
                    return slice._tooltip(tooltext);
                },
                dataFN = function (key, value) {
                    var slice = this,
                    confObject = slice._confObject,
                    elements = confObject.elements,
                    element;
                    if (value === undefined) {
                        return slice._data(key);
                    }
                    else {
                        //other elements
                        for (element in elements) {
                            elements[element].data(key, value);
                        }
                        //main element
                        return slice._data(key, value);
                    }
                },
                si = 0; // slice index
                return function () {

                    var manager = this,
                    renderer = manager.renderer,
                        returnElement,
                        confObject = {
                            elements : {},
                            Pie3DManager : manager
                        },
                        slicingWallsArr = manager.slicingWallsArr,
                        elements = confObject.elements,
                        renderingPath = hasSVG ? 'litepath' : 'path';

                    // create elements
                    returnElement = renderer[renderingPath](manager.topGroup);
                    //store the _confObject reference
                    returnElement._confObject = confObject;
                    confObject.thisElement = returnElement;

                    //modify few core function

                    returnElement._destroy = returnElement.destroy;
                    returnElement.destroy = destroyFN;

                    returnElement._show = returnElement.show;
                    returnElement.show = showFN;

                    returnElement._hide = returnElement.hide;
                    returnElement.hide = hideFN;

                    returnElement._on = returnElement.on;
                    returnElement.on = onFN;

                    returnElement._drag = returnElement.drag;
                    returnElement.drag = onDragFN;

                    returnElement._attr = returnElement.attr;
                    returnElement.attr = attrFN;

                    returnElement._tooltip = returnElement.tooltip;
                    returnElement.tooltip = tooltipFN;

                    returnElement._data = returnElement.data;
                    returnElement.data = dataFN;

                    //add the element to the store
                    manager.pointElemStore.push(returnElement);

                    elements.topBorder = renderer[renderingPath](manager.topGroup);
                    elements.bottom = renderer[renderingPath](manager.bottomBorderGroup)
                    .attr({
                        'stroke-width' : 0
                    });
                    elements.bottomBorder = renderer[renderingPath](manager.bottomBorderGroup);
                    elements.frontOuter = renderer[renderingPath](manager.slicingWallsFrontGroup)
                    .attr({
                        'stroke-width' : 0
                    });
                    elements.backOuter = renderer[renderingPath](manager.slicingWallsFrontGroup)
                    .attr({
                        'stroke-width' : 0
                    });
                    elements.startSlice = renderer[renderingPath](manager.slicingWallsFrontGroup);
                    elements.endSlice = renderer[renderingPath](manager.slicingWallsFrontGroup);
                    elements.frontOuter1 = renderer[renderingPath](manager.slicingWallsFrontGroup)
                    .attr({
                        'stroke-width' : 0
                    });

                    // update config object for proper z order
                    elements.frontOuter._conf = {
                        si: si,
                        isStart : 0.5
                    };
                    elements.frontOuter1._conf = {
                        si: si,
                        isStart : 0.5
                    };
                    elements.startSlice._conf = {
                        si: si,
                        isStart : 0
                    };
                    elements.endSlice._conf = {
                        si: si,
                        isStart : 1
                    };
                    elements.backOuter._conf = {
                        si: si,
                        isStart : 0.4
                    };
                    slicingWallsArr.push(elements.startSlice, elements.frontOuter1, elements.frontOuter,
                        elements.backOuter, elements.endSlice);
                    if (manager.isDoughnut) {
                        // innerFront
                        elements.frontInner = renderer[renderingPath](manager.slicingWallsFrontGroup)
                        .attr({
                            'stroke-width' : 0
                        });
                        elements.backInner = renderer[renderingPath](manager.slicingWallsFrontGroup)
                        .attr({
                            'stroke-width' : 0
                        });

                        elements.backInner._conf = {
                            si: si,
                            isStart : 0.5
                        };

                        elements.frontInner._conf = {
                            si: si,
                            isStart : 0.4
                        };
                        slicingWallsArr.push(elements.frontInner, elements.backInner);
                    }

                    si += 1;
                    return returnElement;
                };
            })()
        };

        Pie3DManager.prototype.constructor = Pie3DManager;

    }, [3, 2, 2, 'sr4']]);

/**
 * FusionCharts JavaScript Library
 * ZoomLine visualization module extension comprising visualization logic as well as renderer adapter.
 * @private
 *
 * @module fusioncharts.renderer.javascript.charts.zoomline
 * @requires fusioncharts.renderer.javascript.charts.common
 */
FusionCharts.register ('module', ['private', 'modules.renderer.js-zoomline', function () {
    /*jslint newcap: false */
    var global = this,
        lib = global.hcLib,
        hashify = lib.hashify,
        win = global.window,
        doc = win.document,
        Image = win.Image,
        MouseEvent = win.MouseEvent,
        userAgent = win.navigator.userAgent,
        isIE = /msie/i.test (userAgent) && !win.opera,
        chartAPI = lib.chartAPI,
        extend2 = lib.extend2,
        addEvent = lib.addEvent,
        pluck = lib.pluck,
        // BLANKSTRING = lib.BLANKSTRING,
        // parseTooltext = lib.parseTooltext,
        pluckNumber = lib.pluckNumber,
        getFirstColor = lib.getFirstColor,
        convertColor = lib.graphics.convertColor,
        bindSelectionEvent = lib.bindSelectionEvent,
        // parseTrendlines = lib.createTrendLine,
        parseUnsafeString = lib.parseUnsafeString,
        componentDispose = lib.componentDispose,
        // regescape = lib.regescape,
        R = lib.Raphael,
        toRaphaelColor = lib.toRaphaelColor,
        hasTouch = lib.hasTouch,
        plotEventHandler = lib.plotEventHandler,
        getMouseCoordinate = lib.getMouseCoordinate,
        UNDEFINED,
        creditLabel = false && !/fusioncharts\.com$/i.test(win.location.hostname),
        // CONFIGKEY = lib.FC_CONFIG_STRING,
        // G = 'g',
        PIPE = '|',
        // DOT = '.',
        BLANK = '',
        ROLLOVER = 'DataPlotRollOver',
        ROLLOUT = 'DataPlotRollOut',
        //default cursor type.
        // STR_DEF = 'default',
        PX = 'px',
        TRACKER_FILL = 'rgba(192,192,192,' + (isIE ? 0.002 : 0.000001) + ')', // invisible but clickable
        UNDEF,

        math = Math,
        mathCeil = math.ceil,
        mathFloor = math.floor,
        mathRound = math.round,
        mathMax = math.max,
        mathMin = math.min,
        mathCos = math.cos,
        mathSin = math.sin,
        // mathAbs = math.abs,
        toFloat = win.parseFloat,
        toInt = win.parseInt,
        MAX_MITER_LINEJOIN = 2,
        CrossLine; // function (constructor)

    // Add events to the legacy event list
    extend2 (lib.eventList, {
        zoomed: 'FC_Zoomed',
        pinned: 'FC_Pinned',
        resetzoomchart: 'FC_ResetZoomChart'
    });

    chartAPI ('zoomline',{
        standaloneInit: true,
        canvasborderthickness: 1,
        defaultDatasetType: 'zoomline',
        applicableDSList: {
            'zoomline': true
        },
        friendlyName: 'Zoomable and Panable Multi-series Line Chart',
        creditLabel: creditLabel,
        /*
         * Only y-axes are being drawn.
         * x-axis is drawn after setting the label step value.
        */
        _drawAxis : function () {
            var iapi = this,
                components = iapi.components,
                yAxisArr = components.yAxis || [],
                i,
                len;
            for (i = 0, len = yAxisArr.length; i < len; i++) {
                yAxisArr[i].draw ();
            }
        },
        _setCategories: function () {
            var iapi = this,
                config = iapi.config,
                components = iapi.components,
                dataObj = iapi.jsonData,
                xAxis = components.xAxis,
                tempArr,
                data,
                j,
                len,
                cdm = config.cdm,
                cdmchar = config.cdmchar,
                category = (dataObj.categories && dataObj.categories[0].category) || [];
            if (cdm || typeof category === 'string') {
                if (category.split) {
                    tempArr = category.split(cdmchar);
                    data = [];
                    for (j = 0, len = tempArr.length; j < len; j += 1) {
                        data.push({
                            label : tempArr[j]
                        });
                    }
                    iapi.config.categories = dataObj.categories[0].category = data;
                }
            }
            xAxis[0].setAxisPadding(0, 0);
            xAxis[0].setCategory (data || category);
        },

        _createDatasets : function () {
            var i,
                j,
                len,
                data,
                diff,
                dsType,
                DsClass,
                tempArr,
                datasetObj,
                datasetJSON,
                parentyaxis,
                datasetStore,
                prevDataLength,
                datasetStoreLen,
                currDataLength,
                dsCount = {},
                iapi = this,
                config = iapi.config,
                components = iapi.components,
                dataObj = iapi.jsonData,
                dataset = dataObj.dataset,
                length = dataset && dataset.length,
                cdmchar = config.cdmchar,
                cdm = config.cdm,
                defaultSeriesType = iapi.defaultDatasetType,
                applicableDSList = iapi.applicableDSList,
                legend = iapi.components.legend,
                legendItems = legend.components.items || [],
                category = dataObj.categories && dataObj.categories[0].category;
            if (!dataset || !category) {
                iapi.setChartMessage();
            }
            iapi.config.categories = category;
            datasetStore = components.dataset  || (components.dataset = []);
            datasetStoreLen = datasetStore.length;
            for (i=0; i<length; i++) {
                datasetJSON = dataset[i];
                // Check for compact data
                if (cdm) {
                    if (datasetJSON.data && datasetJSON.data.split) {
                        tempArr = datasetJSON.data.split(cdmchar);
                        data = [];
                        for (j = 0, len = tempArr.length; j < len; j++) {
                            data.push({
                                value : tempArr[j]
                            });
                        }
                        datasetJSON.data = data;
                    }
                }

                parentyaxis = datasetJSON.parentyaxis || '';
                if (iapi.isDual && parentyaxis.toLowerCase () === 's') {
                    dsType = pluck (datasetJSON.renderas, iapi.sDefaultDatasetType);
                }
                else {
                    dsType = pluck (datasetJSON.renderas, defaultSeriesType);
                }
                dsType = dsType && dsType.toLowerCase ();
                if (!applicableDSList[dsType]) {
                    dsType = defaultSeriesType;
                }

                /// get the DsClass
                DsClass = FusionCharts.get('component', ['dataset', dsType]);
                if (DsClass) {
                    if (dsCount[dsType] === UNDEFINED) {
                        dsCount[dsType] = 0;
                    }
                    else {
                        dsCount[dsType]++;
                    }
                    // If the dataset does not exists.
                    if (!(datasetObj = datasetStore[i])) {
                        // create the dataset Object
                        datasetObj = new DsClass ();
                        datasetStore.push (datasetObj);
                        datasetObj.chart = iapi;
                        datasetObj.index = i;
                        datasetObj.init (datasetJSON);
                    }
                    // If the dataset exists incase the chart is updated using setChartData() method.
                    else {
                        prevDataLength = (datasetObj.JSONData.data || []).length;
                        currDataLength = (datasetJSON.data || []).length;
                        // Removing data plots if the number of current data plots is more than the existing ones.
                        if (prevDataLength > currDataLength) {
                            datasetObj.removeData(currDataLength, prevDataLength - currDataLength, false);
                        }
                        datasetStore[i].JSONData = datasetJSON;
                        datasetStore[i].configure();
                        datasetStore[i]._deleteGridImages && datasetStore[i]._deleteGridImages();
                    }
                }
            }

            // When the number of datasets entered vis setChartData is less than the existing dataset then dispose the
            // extra datasets.
            if (datasetStoreLen > length) {
                diff = datasetStoreLen - length;
                for (j = i, length = diff + i; j < length; j ++ ) {
                    componentDispose.call(datasetStore[j]);
                }
                datasetStore.splice(i, diff);
                legendItems.splice(i, diff);
            }
        },

        isWithinCanvas : function (e, chart) {
            var mousePos = lib.getMouseCoordinate(chart.get('linkedItems', 'container'),e),
            /*converts the original mouse event toa Fusion Charts event( that has chartX, chartY, pageX and pageY as
                its property)*/
                chartX = mousePos.chartX,
                chartY = mousePos.chartY,
                chartConfig = chart.get('config'),
                minX = chartConfig.canvasLeft,
                minY = chartConfig.canvasTop,
                maxX = chartConfig.canvasLeft + chartConfig.canvasWidth,
                maxY = chartConfig.canvasHeight + chartConfig.canvasTop;
            //default value of the flag.
            mousePos.insideCanvas = false;

            // store the original event as well
            mousePos.originalEvent = e;
            //return true if within the canvas
            if (chartX > minX && chartX < maxX && chartY > minY && chartY < maxY) {
                //set the flag to be TRUE if triggered within the canvas area.
                mousePos.insideCanvas = true;
            }
            return mousePos;
        },

        highlightPoint: function (showHover,cx,cy,point,index, toolText) {
            var chart = this,
                chartConfig = chart.config,
                chartComponents = chart.components,
                chartGraphics = chart.graphics,
                paper = chartComponents.paper,
                tracker = chartGraphics.tracker,
                datasetObj = chartComponents.dataset[index],
                datasetConfig = datasetObj && datasetObj.config,
                radius = ( datasetObj && datasetConfig.zoomedRadius || 0),
                hoverCosmetics = datasetObj && datasetConfig.hoverCosmetics,
                fill = hoverCosmetics && hoverCosmetics.fill,
                borderColor = hoverCosmetics && hoverCosmetics.borderColor,
                borderThickness = hoverCosmetics && hoverCosmetics.borderThickness,
                attrObj = {},
                //attach the callbacks for the click and hover interactions for the hovering element.
                plotEventHandlerCallback = {
                    'click': function (e){
                        lib.plotEventHandler.call(this, chart, e);
                    },
                    'hoverIn': function (e){
                        lib.plotEventHandler.call(this, chart, e, 'dataplotRollover');
                    },
                    'hoverOut': function (e) {
                        lib.plotEventHandler.call(this, chart, e, 'dataplotRollout');
                    }
                };

            if (!tracker) {
                // in case the tracker element is not created. Attach the callbacks for click and hovering effects.
                tracker = chartGraphics.tracker = paper.circle(0, 0, 0, chartGraphics.trackerGroup)
                .attr({
                    'clip-rect': chartConfig.canvasLeft + ',' + (chartConfig.canvasTop) + ',' +
                        chartConfig.canvasWidth + ',' + chartConfig.canvasHeight
                })
                .click(plotEventHandlerCallback.click)
                .trackTooltip(true)
                .hover(plotEventHandlerCallback.hoverIn, plotEventHandlerCallback.hoverOut);
            }
            //Attach the required information for the hovering element.
            point && tracker.data('eventArgs', {
                x: point.x,
                y: point.y,
                tooltip: point.tooltip,
                link: point.link
            });

            /* store the hovered point as last visible point. This is required to avoid redaundant calls if the same
            point is hovered. */
            chartConfig.lastHoveredPoint = point;

            // if hover cosmetics then add that in the attrObj
            if (Number(showHover)) {
                attrObj = {
                    r: radius,
                    fill: fill,
                    stroke: borderColor,
                    'stroke-width': borderThickness
                };
            }
            else { // make transparent configuration
                attrObj = {
                    r: radius,
                    fill: TRACKER_FILL,
                    stroke: TRACKER_FILL,
                    'stroke-width': 0
                };
            }
            tracker
            .attr(attrObj)
            .tooltip(toolText)
            .transform('t' + (cx + chartConfig.canvasLeft) + ',' + (cy + chartConfig.canvasTop));
            /*on first mouse move the element is created and on the next mouse move the tooltip is shown.
            In order give the effect of displaying the tooltip once hovered, another mouseMove event is
            fired forcefully */
            point && chart.fireMouseEvent('mouseover', tracker && tracker.node, chartConfig.lastMouseEvent);
        },

        fireMouseEvent : function (eventName, domElement, mouseEventInit) {
            var event;
            if (!domElement || !eventName) {
                return;
            }

            if(!mouseEventInit){
                mouseEventInit = {};
            }
            if (mouseEventInit.originalEvent) {
                mouseEventInit = mouseEventInit.originalEvent;
            }
            // map touch event for touch devices
            if (mouseEventInit.touches) {
                mouseEventInit = mouseEventInit.touches[0];
            }


            if (domElement.dispatchEvent) {
                if (MouseEvent) {
                    //for FireFox, chrome and opera. NOT confirmed in Safari
                    // Creates a MouseEvent object.
                    event = new MouseEvent(eventName, {
                        bubbles: !!mouseEventInit.bubbles,
                        cancelable: !!mouseEventInit.cancelable,
                        clientX: mouseEventInit.clientX || ( mouseEventInit.pageX && (mouseEventInit.pageX -
                            doc.body.scrollLeft - doc.documentElement.scrollLeft)) || 0,
                        clientY: mouseEventInit.clientY || ( mouseEventInit.pageY && (mouseEventInit.pageY -
                            doc.body.scrollTop - doc.documentElement.scrollTop)) || 0,
                        screenX: mouseEventInit.screenX || 0,
                        screenY: mouseEventInit.screenY || 0,
                        pageX: mouseEventInit.pageX || 0,
                        pageY: mouseEventInit.pageY || 0
                    });
                }
                else if (doc.createEvent) {
                    //for IE support.
                    event = doc.createEvent('HTMLEvents');
                    event.initEvent(eventName, !!mouseEventInit.bubbles, !!mouseEventInit.cancelable);
                }
                event.eventName = eventName;
                event && domElement.dispatchEvent(event);
            }
            else if(doc.createEventObject && domElement.fireEvent){
                event = doc.createEventObject();
                event.eventType = eventName;
                event.eventName = eventName;
                //trigger the event forcefully.
                domElement.fireEvent('on' + eventName, event);
            }
        },

        configure: function () {
            var style,
                iapi = this,
                jsonData = iapi.jsonData,
                chartDef = jsonData.chart || {},
                colorManager = iapi.components.colorManager,
                canvasBorderColor = colorManager.getColor('canvasBorderColor'),
                config;
            // todo code: Need to extend support for these attributes, temporarily hardcoded.
            chartDef.animation = 0;
            chartDef.showvalues = 0;

            chartAPI.msline.configure.call(iapi);
            // The base configure fn above creates a dummy chart object if there is no chart object in json data.
            config = iapi.config;
            style = config.style;
            // overwrite the existing chart configurations.
            // Copy and prepare some configurations for zoom charts
            extend2(config, {
                useRoundEdges: pluckNumber (chartDef.useroundedges,0),
                animation: false,
                zoomType: 'x',
                canvasPadding: pluckNumber(chartDef.canvaspadding, 0),
                scrollColor: getFirstColor(pluck(chartDef.scrollcolor,
                        colorManager.getColor('altHGridColor'))),
                scrollShowButtons: !!pluckNumber(chartDef.scrollshowbuttons, 1),
                scrollHeight: pluckNumber(chartDef.scrollheight, 16) || 16,
                scrollBarFlat: pluckNumber (chartDef.flatscrollbars, 0),
                allowPinMode: pluckNumber(chartDef.allowpinmode, 1),
                skipOverlapPoints: pluckNumber(chartDef.skipoverlappoints, 1),
                showToolBarButtonTooltext: pluckNumber(chartDef.showtoolbarbuttontooltext, 1),
                btnResetChartTooltext: pluck(chartDef.btnresetcharttooltext, 'Reset Chart'),
                btnZoomOutTooltext: pluck(chartDef.btnzoomouttooltext, 'Zoom out one level'),
                btnSwitchToZoomModeTooltext: pluck(chartDef.btnswitchtozoommodetooltext,
                        '<strong>Switch to Zoom Mode</strong><br/>Select a subset of data to zoom ' +
                        'into it for detailed view'),
                btnSwitchToPinModeTooltext: pluck(chartDef.btnswitchtopinmodetooltext,
                        '<strong>Switch to Pin Mode</strong><br/>Select a subset of data and compare ' +
                        'with the rest of the view'),
                /**
                 *  @note pinPaneStroke related attribute parsing is unused in
                 * present JS ZoomLine implementation.
                 pinPaneStrokeWidth: pluckNumber(chartDef.pinpaneborderthickness, 1),
                 pinPaneStroke: convertColor(pluck(chartDef.pinpanebordercolor,
                 canvasBorderColor), pluckNumber(chartDef.pinpaneborderalpha, 15)),
                 */
                pinPaneFill: convertColor(pluck(chartDef.pinpanebgcolor,
                        canvasBorderColor), pluckNumber(chartDef.pinpanebgalpha, 15)),
                zoomPaneFill: convertColor(pluck(chartDef.zoompanebgcolor,
                        '#b9d5f1'), pluckNumber(chartDef.zoompanebgalpha, 30)),
                zoomPaneStroke: convertColor(pluck(chartDef.zoompanebordercolor,
                        '#3399ff'), pluckNumber(chartDef.zoompaneborderalpha, 80)),
                showPeakData: pluckNumber(chartDef.showpeakdata, 0),
                maxPeakDataLimit: pluckNumber(chartDef.maxpeakdatalimit, chartDef.maxpeaklimit, null),
                minPeakDataLimit: pluckNumber(chartDef.minpeakdatalimit, chartDef.minpeaklimit, null),
                crossline: {
                    enabled: pluckNumber(chartDef.showcrossline, 1),
                    line: {
                        'stroke-width': pluckNumber(chartDef.crosslinethickness, 1),
                        'stroke': getFirstColor(pluck(chartDef.crosslinecolor, '#000000')),
                        'stroke-opacity': pluckNumber(chartDef.crosslinealpha, 20) / 100
                    },
                    labelEnabled: pluckNumber(chartDef.showcrosslinelabel,
                            chartDef.showcrossline, 1),
                    labelstyle: {
                        fontSize: toFloat(chartDef.crosslinelabelsize) ?
                                toFloat(chartDef.crosslinelabelsize) + PX : style.outCanfontSize,
                        fontFamily: pluck(chartDef.crosslinelabelfont,
                                style.outCanfontFamily)
                    },
                    valueEnabled: pluckNumber(chartDef.showcrosslinevalues,
                            chartDef.showcrossline, 1),
                    valuestyle: {
                        fontSize: toFloat(chartDef.crosslinevaluesize) ?
                                toFloat(chartDef.crosslinevaluesize) + PX : style.inCanfontSize,
                        fontFamily: pluck(chartDef.crosslinevaluefont,
                                style.inCanvasStyle.fontFamily)
                    }
                },
                useCrossline: pluckNumber(chartDef.usecrossline, 1),
                tooltipSepChar: pluck(chartDef.tooltipsepchar, ', '),
                showTerminalValidData: pluckNumber(chartDef.showterminalvaliddata, 0),
                cdmchar: pluck(chartDef.dataseparator, PIPE),
                cdm: pluckNumber(chartDef.compactdatamode, 0)
            });
        },

        getValuePixel: function (px) {
            var chart = this,
                chartConfig = chart.config,
                info = chartConfig.viewPortConfig;
            return info.ddsi + mathFloor(px / info.ppp);
        },

        __toolbar: function () {
            var toolBoxAPI,
                SymbolStore,
                ComponentGroup,
                HorizontalToolbar,
                chart = this,
                chartComponents = chart.components,
                toolBox = chartComponents.tb = new (FusionCharts.register('component', ['toolbox', 'toolbox']))(),
                toolConf = toolBox.getDefaultConfiguration(),
                Symbol,
                Scroller;

            toolBox.init({
                iAPI: {
                    chart: chart
                },
                graphics: chart.graphics,
                chart: chart,
                components: chartComponents
            });

            toolBoxAPI = chartComponents.toolBoxAPI || toolBox.getAPIInstances(toolBox.ALIGNMENT_HORIZONTAL);
            SymbolStore = toolBoxAPI.SymbolStore;
            ComponentGroup = toolBoxAPI.ComponentGroup;
            HorizontalToolbar = toolBoxAPI.Toolbar;
            Symbol = toolBoxAPI.Symbol;
            Scroller = toolBoxAPI.Scroller;
            toolBox.graphics = {};

            return {
                reInit: function () {
                    toolBox.init({
                        iAPI: {
                            chart: chart
                        },
                        graphics: chart.graphics,
                        chart: chart,
                        components: chartComponents
                    });
                },
                addSymbol: function (symbolName, callBack, options, group) {
                    var symbol = new Symbol(symbolName);
                    options && group.setConfiguaration({
                        buttons : extend2(extend2({},toolConf),options)
                    });
                    callBack.tooltext = options.tooltip;
                    callBack && symbol.attachEventHandlers(callBack);
                    group.addSymbol(symbol);
                    return symbol;
                },

                addScroll: function (options, callBack) {
                    var scrl = new Scroller(options);
                    /*options && group.setConfiguaration({
                        buttons : extend2(extend2({},toolConf),options)
                    });
                    callBack.tooltext = options.tooltip;*/
                    callBack && scrl.attachEventHandlers(callBack);
                    return scrl;
                },

                addComponentGroup: function (groupName, options) {
                    var group;
                    group = new ComponentGroup();
                    group.setConfiguaration({
                        group : {
                            fill : options ? options.fill : convertColor('EBEBEB', 0),
                            borderThickness : options ? pluckNumber(options.borderThickness, 0) : 0
                        }
                    });
                    return group;
                },

                addToolBox: function (componentGroups) {
                    var i,
                        toolBox = new HorizontalToolbar();

                    for (i = 0; i < componentGroups.length; i += 1) {
                        toolBox.addComponent(componentGroups[i]);
                    }
                    return toolBox;
                },

                setDrawingArea: function (toolBox, drawingArea) {
                    toolBox.drawingArea = drawingArea;
                    return toolBox;
                },

                draw: function (toolBoxes) {
                    var i,
                        toolBox,
                        drawingArea;
                    for (i = 0; i < toolBoxes.length; i += 1) {
                        toolBox = toolBoxes[i];
                        drawingArea = toolBox.drawingArea;
                        toolBox.draw(drawingArea.x, drawingArea.y);
                    }
                },

                registerSymbol: function (symbolName, symbolPathFn) {
                    SymbolStore.register(symbolName, symbolPathFn);
                },

                getLogicalSpace: function (toolBox) {
                    return toolBox.getLogicalSpace();
                },

                getNode: function (buttonGroup) {
                    return buttonGroup.node;
                }
            };
        },

        __preDraw: function () {
            var seriesItemConf,
                ppp,
                ppl,
                visw,
                visx,
                yminValue,
                ymin,
                pinclip,
                tAtt,
                pingroup,
                datalayer,
                preZoomed,
                scrollerLayer,
                pinrect,
                iapi = this,
                iapiComponents = iapi.components,
                paper = iapiComponents.paper,
                iapiGraphics = iapi.graphics,
                //todo: containerelement should be a part of graphics components.
                // containerElem = iapiGraphics.container || iapi.container,
                imageContainer = iapiGraphics.imageContainer,
                iapiConfig = iapi.config,
                canvasLeft = iapiConfig.canvasLeft,
                canvasWidth = iapiConfig.canvasWidth,
                chartDef = iapi.jsonData.chart,
                cdm = iapiConfig.cdm,
                xAxis = iapiComponents.xAxis[0],
                // listeners = iapiComponents.eventListeners || (iapiComponents.eventListeners = []),
                // containerElem = iapi.container,
                info = iapiConfig.viewPortConfig,
                canvasConfig = iapi.components.canvas.config,
                canvasPadding = mathMax(canvasConfig.canvasPadding, canvasConfig.canvasPaddingLeft,
                    canvasConfig.canvasPaddingRight),
                yAxis = iapiComponents.yAxis[0],
                datasetGroup = iapiGraphics.datasetGroup,
                canvasHeight = iapiConfig.canvasHeight,
                canvasTop = iapiConfig.canvasTop,
                chartAttrs = iapi.jsonData.chart,
                borderWidth = iapiConfig.borderWidth || (iapiConfig.borderWidth = pluckNumber (chartAttrs.showborder,
                    1) ? pluckNumber (chartAttrs.borderthickness, 1) : 0),
                allowpin = iapiConfig.allowPinMode,
                crosslineOptions = iapiConfig.crossline,
                clen = xAxis.getCategoryLen(),
                // Validate and parse the data display indices and also calculate
                // initial pixels-per-point.
                dsi = toInt(pluckNumber(chartDef.displaystartindex, 1), 10) - 1,
                dei = toInt(pluckNumber(chartDef.displayendindex, clen || 2), 10) - 1,

                overFlowingMarkerWidth = 0,
                dataSetArr = iapiComponents.dataset,
                j = dataSetArr.length,
                crossline = iapiGraphics.crossline;

            iapiConfig.updateAnimDuration = 500; // default animation durations.
            //the origin of the container element should coincide with the origin(top-left) of the canvas area.

            imageContainer.transform('t' + canvasLeft + ',' + canvasTop);
            //apply clipping to the container element.
            imageContainer.attr({
                'clip-rect': canvasLeft + ',' + canvasTop + ',' + canvasWidth + ',' + canvasHeight
            });
            iapiConfig.status = 'zoom';
            //set the maximum scaleX and scaleY.
            iapiConfig.maxZoomLimit = pluckNumber(chartDef.maxzoomlimit, 1000);

            //stores the different visual configurations for a historical reference.
            iapiConfig.viewPortHistory = [];

            ((ppp = pluckNumber(chartDef.pixelsperpoint, 15)) < 1) && (ppp = 1);
            ((ppl = pluckNumber(chartDef.pixelsperlabel, chartDef.xaxisminlabelwidth,
                xAxis.getAxisConfig('labels').rotation ? 20 : 60)) < ppp) && (ppl = ppp);
            // start index must be positive and less than end. last index must
            // not be greater than category count.
            (dsi < 0 || dsi >= ((clen - 1) || 1)) && (dsi = 0);
            (dei <= dsi || dei > ((clen - 1) || 1)) && (dei = (clen - 1) || 1);
            // Set initial zoom information
            info = (iapiConfig.viewPortConfig = extend2(iapiConfig.viewPortConfig, {
                // cnd: pluckNumber(chartDef.connectnulldata, 0), // connectNullData
                amrd: pluckNumber(chartDef.anchorminrenderdistance, 20), // anchor render distance
                nvl: pluckNumber(chartDef.numvisiblelabels, 0), // num visible labels
                cdm: cdm, // compact data mode
                oppp: ppp, // original pixels per point
                oppl: ppl, // original pixels per label
                dsi: dsi, // dislay start index
                dei: dei, // display end index
                vdl: dei - dsi, // visible display length
                // dmax: legacyYAxisConf.max = dmax, // max value of all data
                // dmin: legacyYAxisConf.min = dmin, // min value of all data
                // dsecondarymax : secondaryYAxisConf.max = dsecondarymax,
                // dsecondarymin : secondaryYAxisConf.min = dsecondarymin,
                clen: clen, // category length and data length

                // Internal variables required for zoom state.
                offset: 0, // (internal) drawing offset for smooth scroll,
                step: 1, // (internal) default stepping or skipping,
                llen: 0, // (internal) number of labels
                alen: 0, // (internal) length of anchors already drawn
                ddsi: dsi, // (internal) dynamic display start as per scroll
                ddei: dei, // (internal) dynamic display end as per scroll
                ppc: 0 // (internal) pixels per category
            }));

            if (!info.clen) {
                return;
            }
            // calculate the overflowing markers width
            while (j--) {
                seriesItemConf = dataSetArr[j].config;
                overFlowingMarkerWidth = mathMax(overFlowingMarkerWidth, ((seriesItemConf.drawanchors &&
                    ((seriesItemConf.anchorradius || 0) + (Number(seriesItemConf.anchorborderthickness) || 0))) || 0));
            }

            iapiConfig.overFlowingMarkerWidth = overFlowingMarkerWidth;
            canvasPadding = (iapiConfig.canvasPadding = mathMax(overFlowingMarkerWidth, canvasPadding));

            // Do a check whether user has initially zoomed. That would
            // mean to keep zoomOut button visible and also to create a
            // fake first zoom level.
            preZoomed = iapiConfig._prezoomed = (info.dei - info.dsi < info.clen - 1);
            // Set the visual dimensions of plot inside canvas.
            visw = iapiConfig._visw = iapiConfig.canvasWidth - canvasPadding * 2;
            visx = iapiConfig._visx = iapiConfig.canvasLeft + canvasPadding;
            iapiConfig._visout = -(iapiConfig.height + canvasHeight + 1e3);

            // Get the y-axis pixel value ratio, other y-axis related values and store for later use.
            iapiConfig._ypvr = yAxis && yAxis.getPVR() || 0;
            yminValue = iapiConfig._yminValue = yAxis.getLimit().min;
            ymin = iapiConfig._ymin = yAxis.getPixel(yminValue);

            // Clip the dataset layer to required dimension. This layer will be
            // scrolled by the scroller
            // Increase the clipping region to acomodate overflowing anchors
            datalayer = datasetGroup.attr('clip-rect', [visx - overFlowingMarkerWidth,
                canvasTop, visw + (overFlowingMarkerWidth * 2), canvasHeight]);
            scrollerLayer = iapiGraphics.scroll || (iapiGraphics.scroll =
                paper.group('scroll').insertAfter(iapiGraphics.datasetGroup));

            // Create the group to store pinlines. We do it here as it is easier
            // to transform that way.
            if (allowpin)  {
                // Create the pin graphics. We create a background that sits atop the
                // canvas and is clipped to match size later.
                tAtt = R.crispBound(0, canvasTop - ymin, 0, canvasHeight, borderWidth);
                /** @todo need to not do renderer based clipping box after raphael's
                 * clipping on transformed group is addressed.
                 */
                pinclip = iapiConfig['clip-pinrect'] =
                    [tAtt.x, canvasTop, tAtt.width, tAtt.height];
                pingroup = (iapiGraphics.zoompin = paper.group('zoompin'))
                    .insertBefore(datalayer)
                    .transform(iapiConfig._pingrouptransform = ['T', visx, ymin]).hide();

                pinrect = iapiGraphics.pinrect = paper.rect(0, canvasTop - ymin,
                    visw, canvasHeight, pingroup).attr({
                    'stroke-width': 0,
                    stroke: 'none',
                    fill: iapiConfig.pinPaneFill,
                    'shape-rendering': 'crisp',
                    ishot: true
                });

                // draw pin tracker
                iapiGraphics.pintracker = paper.rect(iapiGraphics.trackerGroup).attr({
                    transform: pingroup.transform(),
                    x: 0,
                    y: canvasTop - ymin,
                    width: 0,
                    height: canvasHeight,
                    stroke: 'none',
                    fill: TRACKER_FILL,
                    ishot: true,
                    cursor: R.svg && 'ew-resize' || 'e-resize'
                })
                .hide()
                .drag(function (_dx) {
                    var offset = visx + _dx + this.__pindragdelta,
                        pbl = this.__pinboundleft,
                        pbr = this.__pinboundright,
                        clip = this.data('cliprect').slice(0);

                    // Restrict to boundaries.
                    if (offset < pbl) {
                        offset = pbl;
                    }
                    else if (offset > pbr) {
                        offset = pbr;
                    }

                    pingroup.transform(['T', offset, ymin]);
                    iapiGraphics.pintracker.transform(pingroup.transform());
                    // reclip the pin area visibility for VML browser
                    if (!R.svg) {
                        clip[0] = clip[0] + offset - visx - this.__pindragdelta;
                        pingroup.attr('clip-rect', clip);
                    }
                    this.__pindragoffset = _dx;
                }, function () {
                    // Calculate the pin bounds.
                    /** @todo remove renderer checks */
                    this.__pinboundleft = 0 - pinclip[0] + visx + canvasLeft;
                    this.__pinboundright = this.__pinboundleft + visw - pinclip[2];
                    // Store the value of clip-rect to be used later while re-clipping
                    // the pin area for VML browsers, as VML browser doesn't support clipispath
                    this.data('cliprect', pingroup.attr('clip-rect'));

                    // temporarily mark the group as if it is a clip path and
                    // not a clip rect. This is to prevent raphael's internal
                    // matrix inversion on clipping.
                    pingroup._.clipispath = true;
                }, function () {
                    pingroup._.clipispath = false; // reset clip behavior
                    // store the last delta movement so that dragging can be
                    // resumed on next drag on same pin instance.
                    this.__pindragdelta = this.__pindragoffset;

                    // delete unneeded flags and accumulators;
                    delete this.__pindragoffset;
                    delete this.__pinboundleft;
                    delete this.__pinboundright;
                });
            }

            // Draw the scrollbars and perform the initial configuration of
            // the scrollbars.
            // First crispen the scroller position to keep it in sync with the
            // canvas. We temporarily increment plotborderwidth to account for
            // the 1 pixel stroke width of scrollbar.
            borderWidth++;
            tAtt = R.crispBound(canvasLeft - borderWidth, canvasTop + canvasHeight + borderWidth,
                canvasWidth + borderWidth + borderWidth, iapiConfig.scrollHeight, borderWidth);
            borderWidth--; // revert the temporary increment
            // During creation of the scroller element, we check for the
            // "useRoundEdges" options and based on that, match the visuals and
            // positioning of the scrollbar with the canvas. We shift it up
            // slightly when useRoundEdges is on; so that it covers the lower
            // round edges of the canvas.

            // Bind pin and zoom selection events.
            bindSelectionEvent(iapi, {
                attr: {
                    stroke: iapiConfig.zoomPaneStroke,
                    fill: iapiConfig.zoomPaneFill,
                    strokeWidth: 0
                },

                selectionStart: function () {},

                selectionEnd: function (o) {
                    // Calculate the pixel start and pixel end of the selection.
                    var pxs = o.selectionLeft - canvasLeft,
                        pxe = pxs + o.selectionWidth;
                    // In case chart crossline is available and visible, we hide it.
                    // In all cases, on selection end, the crossline is not needed
                    // to be visible.
                    iapiGraphics.crossline && iapiGraphics.crossline.hide();
                    // Based on the flag status of pin mode, we send the selection
                    // pixels to either pinRange or zoomRange functions.
                    iapi[iapiConfig.viewPortConfig.pinned ?
                        'pinRangePixels' : 'zoomRangePixels'](pxs, pxe);
                }
            });
            // Create the crosshair and its related events. The crossline
            // constructor is self aware and independently configures itself
            // from the chart options.
            if (crosslineOptions && crosslineOptions.enabled !== 0 && iapiConfig.useCrossline === 1) {
                if (!crossline) {
                    crossline = iapiGraphics.crossline = new CrossLine();
                }
                crossline.configure(iapi, crosslineOptions);
            }
            else {
                crosslineOptions && (crosslineOptions.enabled = 0);
                crossline && crossline.hide();
            }
        },

        resetZoom: function () {
            var iapi = this,
                iapiConfig = iapi.config,
                history = iapiConfig.viewPortHistory,
                origInfo = history[0];

            // cannot reset twice!
            if (!history.length) {
                return false;
            }


            history.length = 0; // clear history
            if (iapi.zoomTo(origInfo.dsi, origInfo.dei, origInfo)) {
                /**
                 * This event is fired whenever the zoom history is cleared on a ZoomLine chart.
                 *
                 * @event FusionCharts#zoomReset
                 * @group chart-zoomline:zoom
                 */
                global.raiseEvent('zoomReset', iapi._zoomargs,
                    iapi.chartInstance, [iapi.chartInstance.id]);
            }

            return true;
        },

        eiMethods: /** @lends FusionCharts# */ {
            /**
             * Zooms ZoomLine chart one level out
             * @group chart-zoomline:zoom-1
             *
             * @fires FusionCharts#zoomed
             * @fires FusionCharts#zoomedOut
             */
            zoomOut: function () {
                var chart;

                if (!(chart = this.apiInstance)) {
                    return;
                }

                return chart.zoomOut && chart.zoomOut();
            },

            /**
             * Zooms ZoomLine chart to a range of data.
             *
             * @group chart-zoomline:zoom-2
             *
             * @fires FusionCharts#zoomed
             * @fires FusionCharts#zoomedIn
             *
             * @param {number} startIndex The index of the dataset from which it needs to be zoomed into.
             * @param {number} endIndex the index of the dataset until which it needs to be zoomed into.
             */
            zoomTo: function (startIndex, endIndex) {
                var chart;

                if (!(chart = this.apiInstance)) {
                    return;
                }

                return chart.zoomRange && chart.zoomRange(startIndex, endIndex);
            },

            /**
             * Reset all zoom, pan and pin actions that has been done on ZoomLine chart.
             *
             * @group chart-zoomline:zoom-3
             *
             * @fires FusionCharts#zoomReset
             */
            resetChart: function () {
                var chart;

                if (!(chart = this.apiInstance)) {
                    return;
                }

                chart.pinRangePixels && chart.pinRangePixels();
                chart.resetZoom && chart.resetZoom();
            },

            /**
             * Switches between zoom and pin mode. This function does not work when `allowPinMode` is set to `0` in
             * chart XML or JSON.
             *
             * Zoom Line charts can have either a zoom mode or a pin mode. Zoom mode lets you select a section of the
             * chart by dragging mouse cursor across the canvas and the chart zooms in on the selected section. In pin
             * mode, the selected portion can be dragged around to compare with the rest of the chart. Zoom mode and pin
             * mode can be toggled by clicking a button on the top right corner of the chart. This function lets you
             * switch between zoom mode and pin mode programmatically.
             *
             * @group chart-zoomline:zoom-4
             *
             * @fires FusionCharts#zoomModeChanged
             *
             * @param {boolean} yes Boolean value to be `true` if zoom mode needs to be activated, `false` to activate
             * pin mode.
             */
            setZoomMode: function (yes) {
                var chart;

                if (!(chart = this.apiInstance)) {
                    return;
                }

                chart.activatePin && chart.activatePin(!yes);
            },

            /**
             * Returns the index of the first visible point on canvas of ZoomLine chart
             * @group chart-zoomline:view-1
             * @returns {number}
             */
            getViewStartIndex: function () {
                var zi;

                if (!(this.apiInstance && (zi = this.apiInstance.config.viewPortConfig))) {
                    return;
                }
                return zi.ddsi;
            },

            /**
             * Returns the index of the last visible point on canvas of ZoomLine chart
             * @group chart-zoomline:view-2
             * @returns {number}
             */
            getViewEndIndex: function () {
                var zi,
                    vei;

                if (!(this.apiInstance && (zi = this.apiInstance.config.viewPortConfig))) {
                    return;
                }

                vei = zi.ddei - 1;
                return ((vei >= zi.clen ? zi.clen : vei) - 1);
            }
        },

        zoomOut: function () {
            var lastinfo,
                origInfo,
                iapi = this,
                iapiConfig = iapi.config,
                history = iapiConfig.viewPortHistory,
                dsi,
                dei,
                args;
            lastinfo = history.pop(); // access the last history
            origInfo = history[0] || iapiConfig.viewPortConfig;
            if (lastinfo) {
                dsi = lastinfo.dsi;
                dei = lastinfo.dei;
            }
            // If zoom level is less than 1, it is equivalent to reset.
            else {
                // But, in case chart was initially zoomed, we need to zoom out
                // to full view.
                if (iapiConfig._prezoomed) {
                    dsi = 0;
                    dei = origInfo.clen - 1;
                }
            }
            /*info.lskip = lastinfo.lskip;
            info.step = lastinfo.step;
            iapi.components.xAxis[0].setAxisConfig({
                'labelStep': info.lskip + 1
            });*/
            if (args = iapi.zoomTo(dsi, dei, lastinfo)) {
                /**
                 * This event is fired when user zooms out on a ZoomLine chart.
                 *
                 * @event FusionCharts#zoomedOut
                 * @group chart-zoomline:zoom
                 *
                 * @param {number} level - Indicates to which zoom level the user has zoomed out to. `1` indicates that
                 * the chart has been completely zoomed out.
                 *
                 * @param {number} startIndex - The data start index that is in view for the zoomed out level
                 * @param {string} startLabel - The label of the data of the starting item in view.
                 * @param {number} endIndex - The data end index that is in view for the zoomed out level
                 * @param {string} endLabel - The label of the data of the last item in view.
                 */
                global.raiseEvent('zoomedout', args, iapi.chartInstance);
            }

            return true;
        },

        zoomRangePixels: function (pxs, pxe) {
            var chart =  this,
                chartConfig = chart.config,
                history = chartConfig.viewPortHistory,
                info = chartConfig.viewPortConfig,
                ppp = info.ppp,
                start = info.ddsi,
                args;
            history.push(info); // push current state to history

            // Peform function equvalent to this.getValuePixel().
            // Code repeated here for lesser performance penalty of function
            // call.
            /*if (args = chart.zoomTo(start + mathFloor(pxs / ppp),
                    start + mathFloor(pxe / ppp))) {*/
            if (args = chart.zoomTo(start + mathFloor(pxs / ppp),
                    start + mathFloor(pxe / ppp))) {
                /**
                 * This event is fired when user zooms in on a ZoomLine chart.
                 *
                 * @event FusionCharts#zoomedIn
                 * @group chart-zoomline:zoom
                 *
                 * @param {number} level - Indicates to which zoom level the user has zoomed out to. `1` indicates that
                 * the chart has been completely zoomed out. It increments as user zooms in further.
                 *
                 * @param {number} startIndex - The data start index that is in view for the zoomed in level
                 * @param {string} startLabel - The label of the data of the starting item in view.
                 * @param {number} endIndex - The data end index that is in view for the zoomed in level
                 * @param {string} endLabel - The label of the data of the last item in view.
                 */
                global.raiseEvent('zoomedin', args, chart.chartInstance);
            }
            else {
                // If zooming has failed then pop the history state that we
                // pushed earlier.
                history.pop();
            }

        },

        zoomRange: function (dsi, dei) {
            var pxs,
                pxe,
                iapi =  this,
                iapiConfig = iapi.config,
                info = iapiConfig.viewPortConfig,
                lastinfo,
                xAxis = iapi.components.xAxis[0],
                history = iapiConfig.viewPortHistory,
                args;

            history.push(info); // push current state to history
            lastinfo = info;
            info = history[0];
            pxs = xAxis.getPixel(dsi);
            pxe = xAxis.getPixel(dei);
            lastinfo.x = pxs;
            lastinfo.scaleX = iapiConfig.canvasWidth / (pxs - pxe);
            info = lastinfo;
            if (args = iapi.zoomTo(+dsi, +dei)) {
                // already described in apidocs insidr zoomRangePixls
                global.raiseEvent('zoomedin', args, iapi.chartInstance);
            }
            else {
                // If zooming has failed then pop the history state that we
                // pushed earlier.
                history.pop();
            }
        },

        zoomTo: function (dsi, dei, lastinfo) {
            var pxs,
                pxe,
                origPos,
                chart = this,
                chartConfig = chart.config,
                components = chart.components,
                // labels = chart.xlabels.data,
                info = chartConfig.viewPortConfig,
                canvasHeight = chartConfig.canvasHeight,
                canvasLeft = chartConfig.canvasLeft,
                canvasTop = chartConfig.canvasTop,
                canvasBottom = chartConfig.canvasBottom,
                newinfo,
                history = chartConfig.viewPortHistory,
                clen = info.clen,
                args,
                xAxis = chart.components.xAxis[0];
            // Detect max zoom and update the zoom history.
            // start index must be positive and less than end. last index must
            // not be greater than category count.
            (dsi < 0) && (dsi = 0);
            (dsi >= clen - 1) && (dsi = clen - 1);
            (dei <= dsi) && (dei = dsi + 1);
            (dei > clen - 1) && (dei = clen - 1);
            // Find the final zoom level and bail out.
            if (dsi === dei || (dsi === info.dsi && dei === info.dei)) {
                return false;
            }

            // Revert pin mode, in case it is active.
            chart.pinRangePixels();
            // dsi = Math.floor(xAxis.getValue(pxs));
            // dei = Math.ceil(xAxis.getValue(pxe));
            newinfo = extend2({}, info);
            newinfo.dsi = dsi;
            newinfo.dei = dei;
            info = (chartConfig.viewPortConfig = newinfo); // set current state
            // Derive new zoom state from existing state.
            if (!lastinfo) {
                pxs = xAxis.getPixel(dsi);
                pxe = xAxis.getPixel(dei);
                origPos = chart.getOriginalPositions(pxs - canvasLeft,
                    canvasTop, pxe - canvasLeft, canvasBottom - canvasTop);
                chart.zoomSelection(origPos[0], 0, origPos[2], canvasHeight);
            }
            else {
                chart.updateVisual(lastinfo.x, lastinfo.y, lastinfo.scaleX, lastinfo.scaleY);
            }

            components.scrollBar.node.attr({
                'scroll-ratio': info.vdl / (clen - !!clen),
                'scroll-position': [info.dsi / (clen - info.vdl - 1), true]
            });
            args = {
                level: history.length + 1,
                startIndex: dsi,
                startLabel: xAxis.getLabel(dsi).label,
                endIndex: dei,
                endLabel: xAxis.getLabel(dei).label
            };

            /**
             * This event is fired when user either zooms in or zooms out on a ZoomLine chart.
             *
             * @event FusionCharts#zoomed
             * @group chart-zoomline:zoom
             *
             * @param {number} level - Indicates to which zoom level the user has zoomed to. `1` indicates that
             * the chart has been completely zoomed out. It increments as user zooms in further and decrements when user
             * zooms out.
             *
             * @param {number} startIndex - The data start index that is in view for the zoomed level
             * @param {string} startLabel - The label of the data of the starting item in view.
             * @param {number} endIndex - The data end index that is in view for the zoomed level
             * @param {string} endLabel - The label of the data of the last item in view.
             */
            global.raiseEvent('zoomed', args, chart.chartInstance, [chart.chartInstance.id, dsi, dei, args.startLabel,
                args.endLabel, args.level]);

            return args;
        },

        activatePin: function (yes) {
            var iapi =  this,
                iapiConfig = iapi.config,
                toolBoxGraphics = iapi.components.tb.graphics,
                info = iapiConfig.viewPortConfig,
                button = toolBoxGraphics.pinButton;

            // Checking for button is an indirect way to check if pinning is
            // allowed.
            /*if (!button) {
                return;
            }*/

            // If pin is already active and "yes" is true then we get lost.
            if (!(info.pinned ^ (yes = !!yes))) {
                return;
            }
            if (!yes) {
                // Call pin range with no range to deactivate pin.
                iapi.pinRangePixels();
            }

            /**
             * This event is fired when user toggles between zoom and pin mode of a zoomline chart.
             *
             * @event FusionCharts#zoomModeChanged
             * @group chart-zoomline:zoom
             *
             * @param {boolean} pinModeActive - `true` indicates that post the mode change, pin mode is active.
             */
            global.raiseEvent('zoomModeChanged', {
                pinModeActive: yes
            }, iapi.chartInstance, []);
            /*iapiConfig.showToolBarButtonTooltext &&
                    (button.conf.tooltip = iapiConfig[yes &&
                    'btnSwitchToZoomModeTooltext' ||
                    'btnSwitchToPinModeTooltext'] || BLANK);*/
            iapi.updateButtonVisual(button, yes ? 'pressed' : 'enable');

            return (info.pinned = yes);
        },

        updateButtonVisual: function (button, mode) {
            return button.updateVisual(mode);
        },

        pinRangePixels: function (pxs, pxe) {
            var plotGraphics,
                iapi = this,
                iapiComponents = iapi.components,
                paper = iapiComponents.paper,
                iapiGraphics = iapi.graphics,
                iapiConfig = iapi.config,
                canvasLeft = iapiConfig.canvasLeft,
                // elements = chart.elements,
                // labels = chart.xlabels.data,
                info = iapiConfig.viewPortConfig,
                pingroup = iapiGraphics.zoompin,
                pinrect = iapiGraphics.pinrect,
                pinclip = iapiConfig['clip-pinrect'],
                pingrouptransform = iapiConfig._pingrouptransform,
                plots = iapiComponents.dataset,
                pxw = pxe - pxs,
                plot,
                pinline,
                i,
                pintracker = iapiGraphics.pintracker;
            // Find the no-pin situation and bailout.
            if (!info || !pingroup || !pinrect) {
                return;
            }
            // Hide
            if (pxs === pxe) {
                pingroup.hide();
                pintracker.hide();
                // todo code
                // chart.pinButton.attr('button-active', false);
                return info.pinned = false;
            }

            // Iterate over plots and copy the lines.
            i = plots.length;
            while (i--) {
                plot = plots[i];
                plotGraphics = plot.graphics;
                pinline = plotGraphics.pinline;
                if (!pinline) {
                    pinline = plotGraphics.pinline = paper.path(pingroup);
                }
                pinline.attr({
                    'path': plotGraphics.lineElement.attrs.path,
                    'transform': ['T',-iapiConfig._visx, -iapiConfig._ymin]
                })
                .attr(plot.config.pin);
            }

            // Adjust the cliprect to the new x amd width.
            /** @todo remove renderer checks */
            pinclip[0] = pxs + canvasLeft;
            pinclip[2] = pxw;
            pingroup.attr({
                'clip-rect': pinclip,
                'transform': pingrouptransform
            }).show();
            pintracker.__pindragdelta = 0; // dragging helper
            pintracker.show().attr({
                transform: pingrouptransform,
                x: pxs,
                width: pxw
            });

            // store the dsi and dei in px variables for raising in events
            pxs = iapi.getValuePixel(pxs);
            pxe = iapi.getValuePixel(pxe);
            /**
             * This event is fired when user switches to pin mode on zoomline chart and then performs a selection on the
             * data plot to "pin" a range.
             *
             * @event FusionCharts#pinned
             *
             * @group chart-zoomline
             *
             * @param {number} startIndex - The data start index of the pinned range.
             * @param {string} startLabel - The label of the data of the starting item of the pinned range.
             * @param {number} endIndex - The data end index that is in view of the pinned range.
             * @param {string} endLabel - The label of the data of the last item of the pinned range.
             */
            // global.raiseEvent('pinned', {
            //     startIndex: pxs,
            //     endIndex: pxe,
            //     startLabel: labels[pxs],
            //     endLabel: labels[pxe]
            // }, iapi.chartInstance, [iapi.chartInstance.id, pxs, pxe,
            //     labels[pxs], labels[pxe]]);

            // state pin state in meta.
            return info.pinned = true;
        },

        _createLayers: function () {
            var iapi = this,
                iapiGraphics,
                paper = iapi.components.paper;
            chartAPI.scatter._createLayers.call(iapi);
            iapiGraphics = iapi.graphics;
            //create the additional layers.
            //create the container element
            iapiGraphics.imageContainer = paper.group('dataset-orphan', iapiGraphics.dataSetGroup);
            iapi.__preDraw();
            iapi.toogleDragPan(true);
        },

        getValue: function (point) {
            var chart = this,
                chartConfig = chart.config,
                chartComponents = chart.components,
                viewPortConfig = chartConfig.viewPortConfig,
                //the pixel wrt original canvas size
                origpixel = chart.getOriginalPositions(point.x,point.y,point.x,point.y),
                origX = origpixel[0],
                origY = origpixel[1],
                xAxis = chartComponents.xAxis[0],
                yAxis = chartComponents.yAxis[0],
                xaxisRange = xAxis.config.axisRange,
                yaxisRange = yAxis.config.axisRange,
                minX = xaxisRange.min,
                maxX = xaxisRange.max,
                maxY = yaxisRange.max,
                minY = yaxisRange.min,
                //calcualte the Pixel to Value Ratios.
                xPVR = chartConfig.canvasWidth * viewPortConfig.scaleX / (maxX - minX),
                yPVR = chartConfig.canvasHeight * viewPortConfig.scaleY / (maxY - minY);

            return {
                x: minX + ((origX - chartConfig.canvasLeft) / xPVR),
                y: maxY - ((origY - chartConfig.canvasTop) / yPVR)
            };
        },

        getOriginalPositions: function (x1,y1,x2,y2) {
            var newW,
                newH,
                newX,
                newY,
                chart = this,
                chartConfig = chart.config,
                viewPortConfig = chartConfig.viewPortConfig,
                oldScaleX = viewPortConfig.scaleX,
                oldScaleY = viewPortConfig.scaleY,
                //coodinates of the visual canvas origin wrt to original canvas.
                oldX = viewPortConfig.x,
                oldY = viewPortConfig.y,

                xMin = mathMin(x1, x2),
                xMax = mathMax(x1, x2),
                yMin = mathMin(y1, y2),
                yMax = mathMax(y1, y2);

            //Right Bottom limit boundary
            xMax = xMax > chartConfig.canvasWidth ? chartConfig.canvasWidth : xMax;
            yMax = yMax > chartConfig.canvasHeight ? chartConfig.canvasHeight : yMax;
            //Left Top Limit Boundary
            xMin = xMin < 0 ? 0 : xMin;
            yMin = yMin < 0 ? 0 : yMin;
            // update the dimensions wrt to initial viewPort configurations.
            newW = (xMax - xMin ) / oldScaleX;
            newH = (yMax - yMin ) / oldScaleY;
            newX = oldX + (xMin / oldScaleX);
            newY = oldY + (yMin / oldScaleY);
            //converts to the coordinates wrt original image
            return [newX, newY, newW, newH];
        },

        zoomSelection: function (x, y, w, h) {
            var chart = this,
                chartConfig = chart.config,
                scaleX,
                scaleY,
                newWidth,
                newHeight,
                maxX,
                maxY,
                newOriginX,
                newOriginY;


            // if the width or height is 0 return it
            if (!w || !h) {
                return;
            }
            //scale factors cannnot be negatives.
            scaleX = Math.abs(chartConfig.canvasWidth / w);
            scaleY = Math.abs(chartConfig.canvasHeight / h);
            //total dimensions it would look alike when zoomed with these scale factors
            newWidth = chartConfig.canvasWidth * scaleX;
            newHeight = chartConfig.canvasHeight * scaleY;
            //the amount to be shifted so that the zoom portion falls in the visible area.
            newOriginX = x * scaleX;
            newOriginY = y * scaleY;
            //impose restrictions on the boundaries.
            maxX = (newWidth - chartConfig.canvasWidth);
            maxY = (newHeight - chartConfig.canvasHeight);

            //left top restricition
            newOriginX = (newOriginX < 0) ? 0 : newOriginX;
            newOriginY = (newOriginY < 0) ? 0 : newOriginY;

            //right bottom restriction
            newOriginX = (newOriginX > maxX) ? maxX : newOriginX;
            newOriginY = (newOriginY > maxY) ? maxY : newOriginY;
            //update the final visual(drawing) part.
            chart.updateVisual(x, y, scaleX, scaleY);
        },

        updateVisual: function (zoomX, zoomY, scaleX, scaleY, pixelatedDraw) {
            var chart = this,
                chartConfig = chart.config,
                viewPortConfig = chartConfig.viewPortConfig,
                oldCanvasWidth = chartConfig.canvasWidth,
                oldCanvasHeight = chartConfig.canvasHeight,
                // newCanvasWidth = oldCanvasWidth,
                // newCanvasHeight = oldCanvasHeight,
                viewPortHistory = chartConfig.viewPortHistory,
                lastViewPortConfig = viewPortHistory.slice(-1)[0] || viewPortConfig,
                // zoomEvent = [],
                // viewPortStatus = viewPortConfig.status,

                // xAxis = chartComponents.xAxis[0],
                // yAxis = chartComponents.yAxis[0],

                maxZoomLimit = chartConfig.maxZoomLimit; //restrictions in the zooming limit.
            //check for validity for the input arguments provided.
            //Incase invalid, revert to the last viewPort configurations, that is visually there remains no change.
            viewPortConfig.x = isNaN(zoomX) ? (zoomX = lastViewPortConfig.x) : zoomX;
            viewPortConfig.y = isNaN(zoomY) ? (zoomY = lastViewPortConfig.y) : zoomY;
            viewPortConfig.scaleX = scaleX || (scaleX = lastViewPortConfig.scaleX);
            viewPortConfig.scaleY = scaleY || (scaleY = lastViewPortConfig.scaleY);

            // apply the limit
            if (scaleX > maxZoomLimit) {
                viewPortConfig.x = zoomX = mathMin(zoomX, (oldCanvasWidth - oldCanvasWidth/maxZoomLimit));
                viewPortConfig.scaleX = scaleX = maxZoomLimit;
            }
            if (scaleY > maxZoomLimit) {
                viewPortConfig.y = zoomY = mathMin(zoomY, (oldCanvasHeight - oldCanvasHeight/maxZoomLimit));
                viewPortConfig.scaleY = scaleY = maxZoomLimit;
            }
            chart.updateManager(pixelatedDraw);
        },

        toogleDragPan: function (isToogle) {
            var chart = this,
                chartConfig = chart.config,
                viewPortConfig = chartConfig.viewPortConfig,
                status = viewPortConfig.status;
            if (isToogle) {
                viewPortConfig.status = (status === 'zoom') ? 'pan': 'zoom';
                // global.raiseEvent('zoomModeChanged', {
                //     panModeActive: chartConfig.viewPortConfig.status
                // }, chart.fusionCharts, [chart.fusionCharts.id]);
            }
            //visual update
            //chart.updateButtonVisual();

        },

        resize: function () {
            var chart = this,
                chartConfig = chart.config,
                chartGraphics = chart.graphics,
                canvasComponents = chart.components.canvas,
                canvasConfig = canvasComponents.config,
                canvasGraphics = canvasComponents.graphics,
                canvasBorder = canvasGraphics.canvasBorderElement,
                canvas = canvasGraphics.canvasElement,
                //bridge code
                canvasBorderThickness = canvasConfig.canvasBorderThickness,
                canvasHalfThickness = canvasBorderThickness / 2,
                newHeight = (chartConfig.canvasHeight -= canvasBorderThickness),
                newWidth = (chartConfig.canvasWidth -= (2*canvasBorderThickness)),
                left = (chartConfig.canvasLeft += canvasBorderThickness);
            chartConfig.canvasBottom -= canvasBorderThickness;
            chartConfig.canvasRight -= canvasBorderThickness;
            //resize the canvas according to the latest modifications in the canvas dimensions.
            if (canvas) {
                canvas.attr({
                    x: left,
                    y: chartConfig.canvasTop,
                    height: newHeight,
                    width: newWidth
                });
            }
            else {
                chart.drawCanvas(); // draw the canvas if it ceases to exist.
            }

            if (canvasBorder) {
                //update the dimensions of the border of the canvas
                canvasBorder.attr({
                    x: left - canvasHalfThickness,
                    y: chartConfig.canvasTop - canvasHalfThickness,
                    height: newHeight + canvasBorderThickness,
                    width: newWidth + canvasBorderThickness,
                    'stroke-width': canvasBorderThickness /* stroke-width is a property being applied both on
                    outer and inner side, hence canvasHalfThickness is used instead the full of it.*/
                });
            }

            //update the image container wrt modified canvas dimension after resizing.
            chartGraphics.imageContainer.attr({
                'clip-rect': chartConfig.canvasLeft + ',' + chartConfig.canvasTop + ',' + chartConfig.canvasWidth +
                    ',' + chartConfig.canvasHeight
            }).transform('t' + chartConfig.canvasLeft + ',' + chartConfig.canvasTop);
            //clipping the hot tracker element.
            chartGraphics.trackerElem.attr({
                x: chartConfig.canvasLeft,
                y: chartConfig.canvasTop,
                width: chartConfig.canvasWidth,
                height: chartConfig.canvasHeight
            });
            /*Clipping on the tracker is required when a single plot covers more than the screen and one hover on
            it, the hovering circle goes out of the canvas, which needs to be prevented and hence needs to be
            clipped. This clipping again needs to be updated with every resizing.*/
            chartGraphics.tracker && chartGraphics.tracker.attr({
                'clip-rect': chartConfig.canvasLeft + ',' + chartConfig.canvasTop + ',' + chartConfig.canvasWidth +
                    ',' + chartConfig.canvasHeight
            });
        },

        updateManager: function (pos) {
            var i,
                labelStep,
                stepValue,
                chart = this,
                scaleX,
                chartComponents = chart.components,
                dataSets = chartComponents.dataset,
                len = dataSets.length,
                chartConfig = chart.config,
                info = chartConfig.viewPortConfig,
                ypvr = chartConfig._ypvr,
                visW = chartConfig._visw,
                xAxis = chart.components.xAxis[0],
                getPixelX = function() {
                    return xAxis.getPixel.apply(xAxis,arguments);
                },
                // labels = chart.xlabels,
                cssLabel = xAxis.getAxisConfig('labels').style,
                // labelGroup = labels.group,
                // textDirection = chartConfig.textDirection,
                oppp, // target pixels-per-point
                vdl, // visible display length
                ppl, // num visible labels
                ppp, // current pixels-per-point
                step, // stepping on vdl to reach target ppp
                lskip,
                norm, // normalizer of vdl to allow smooth scrolling
                dsi, // display start index
                dei, // display end index
                ddsi, // dynamic dsi post normalization
                ddei,
                nvl,
                xAxisAnifConfig,
                xAxisNameDrawConfig,
                visibleExtremes,
                updateButtonVisual = chart.updateButtonVisual,
                toolBoxGraphics = chartComponents.tb.graphics,
                zoomOutButton = toolBoxGraphics.zoomOutButton,
                resetButton = toolBoxGraphics.resetButton,
                history = chartConfig.viewPortHistory;
            if (chartConfig.legendClicked) {
                for (i = 0; i < len; i += 1) {
                    dataSets[i].draw();
                }
                return;
            }
            // Use default config if none has been provided else extend current
            // state.
            !info && (info = chartConfig.viewPortConfig);

            // Calculate stepping values here. This is required so that the
            // number of anchors can be recalculated prior to updating plot.
            oppp = info.oppp;
            nvl = ppl = info.nvl;
            dsi = info.dsi;
            dei = info.dei;
            vdl = info.vdl = dei - dsi;
            ppl = info.ppl = nvl ? visW / nvl : info.oppl;
            // Calculate label and anchor stepping.
            step = info.step = ((ppp = info.ppp = visW / vdl) < oppp) ? mathCeil(oppp / ppp) : 1;
            lskip = info.lskip = mathCeil(mathMax(ppl, toFloat(cssLabel.lineHeight)) / ppp / step);

            // If scroll position is provided, we recalculate indices and
            // ignore what has been sent via zoom info.
            // We do not put position calculation in a separate function to
            // avoid repeated recalculations
            if (pos !== UNDEF) {
                ddsi = (info.clen - vdl - 1) * pos ;
                info.offset = (ddsi - (ddsi = toInt(ddsi))) * ppp;
                ddei = ddsi + vdl;
            }
            else {
                ddsi = info.dsi;
                ddei = info.dei;
                info.offset = 0;
            }
            norm = info.norm = ddsi % step;

            // normalize the indices
            info.ddsi = (ddsi = ddsi - norm);
            info.ddei = (ddei = ddei + 2 * step - norm);
            info.pvr = ypvr;
            info._ymin = chartConfig._ymin;
            info._yminValue = chartConfig._yminValue;
            info.x = ((getPixelX(ddsi) - getPixelX(xAxis.getLimit().min) + info.offset)/ info.scaleX);
            // once the visible labels are exceeding the category length.
            if ((ddei - ddsi) > xAxis.getCategoryLen()) {
                info.scaleX = 1;
            }
            else {
                // info.scaleX = chartConfig.canvasWidth / (mathRound((ddei - ddsi + 1)/ (step)) * 0.5 * ppl);
                info.scaleX = xAxis.getCategoryLen() / Math.abs(ddei - ddsi - step - 0.9);
            }
            if (pos !== UNDEF){
                chartComponents.scrollBar.node && chartComponents.scrollBar.node.attr({
                    'scroll-position': (info._pos = pos)
                });
            }
            visibleExtremes = xAxis._getVisibleConfig();

            stepValue = Math.ceil((visibleExtremes.maxValue - visibleExtremes.minValue + 1) / nvl);
            scaleX = chartConfig.viewPortConfig && chartConfig.viewPortConfig.scaleX;
            labelStep = Math.max(Math.round(xAxis.getAxisConfig('labelStep')/scaleX), nvl ? stepValue : lskip * step);
            xAxis.setLabelConfig({
                step: labelStep
            });
            /*xAxis.setAxisConfig({
                'labelStep': labelStep
            });*/
            xAxisAnifConfig = xAxis.getAxisConfig('animateAxis');
            xAxisNameDrawConfig = xAxis.getAxisConfig('drawAxisName');
            pos && (xAxis.setAxisConfig({
                animateAxis : false,
                drawAxisName : false
            }));
            xAxis.draw();
            xAxis.setAxisConfig({
                animateAxis : xAxisAnifConfig,
                drawAxisName : xAxisNameDrawConfig
            });
            // Calculate the label length
            /*len = labels.show ? mathCeil((ddei - ddsi) / step / lskip) : 0;
            oldlen = info.llen - 1;
            info.llen = len;
            ppc = info.ppc = ppp * lskip * step; // pixels between two x-labels
            labelGroup.trackTooltip(true);
            // Iterate over the labels and update them.
            // Add new anchor elements or if added, show them.
            if (len > oldlen) {
                for (j = oldlen, jj = len; j < jj; j++) {
                    (label = labels[j]) && label.show() ||
                        (labels[j] = paper.text(0, 0, BLANK, labelGroup).css(cssLabel).attr({
                            direction: textDirection
                        }));
                }
            }
            // Hide extra label elements.
            else {
                for (j = len, jj = oldlen + 1; j < jj; j++) {
                    labels[j].hide();
                }
            }
            // Calculate amount of anchors that will be visible. Until amrd is reached,
            // all labels should be hidden. (re-use the previous len variables)
            len = (ppp * step < info.amrd) ? 0 : mathCeil((ddei - ddsi) / step);
            deltalen = len - info.alen;
            oldlen = info.alen - 1;
            info.alen = len; // Update anchor length.*/
            // redraw the datasets
            for (i = 0; i < len; i += 1) {
                dataSets[i].draw();
            }

            // Show reset button when zoom history is long enough and always show
            // zoom out button on every zoom-in.
            updateButtonVisual(zoomOutButton, (info.vdl === info.clen - 1 ? 'disable' : 'enable'));
            updateButtonVisual(resetButton, (history.length > 0 ? 'enable' : 'disable'));


            if (win.FC_DEV_ENVIRONMENT && win.jQuery) {
                if (FusionCharts['debugger'].enable()) {
                    this.debug = this.debug || (win.jQuery('#fc-zoominfo').length ||
                        win.jQuery('body').append('<pre id="fc-zoominfo">'), win.jQuery('#fc-zoominfo').css({
                        position: 'absolute',
                        left: '10px',
                        top: '0',
                        'pointer-events': 'none',
                        opacity: 0.7,
                        width: '250px',
                        zIndex: '999',
                        border: '1px solid #cccccc',
                        'box-shadow': '1px 1px 3px #cccccc',
                        background: '#ffffff'
                    }));
                    this.debug.text(JSON.stringify(info, 0, 2));
                }
                else {
                    this.debug && win.jQuery('#fc-zoominfo').remove();
                    delete this.debug;
                }
            }
        },
        _drawDataset: function () {
            var iapi = this;
            chartAPI.zoomline.updateManager.call(iapi);
        },

        getParsedLabel: function (index) {
            var xlabels = this.xlabels;
            return xlabels.parsed[index] ||
                (xlabels.parsed[index] =
                    parseUnsafeString(xlabels.data[index] || BLANK));
        },
        _createToolBox: function () {
            var toolBox,
                toolBoxGraphics,
                toolBoxAPI,
                group,
                SymbolStore,
                Symbol,
                zoomOutButton,
                resetButton,
                pinButton,
                iapi = this,
                config = iapi.config,
                allowPinMode = config.allowPinMode,
                components = iapi.components,
                tooltip = config.showToolBarButtonTooltext,
                chartMenuBar = components.chartMenuBar,
                actionBar = components.actionBar;
            /* Do not reconfigure the toolbox if its already drawn. This flag is set falsy on each time configurations
            are updated. */
            if (chartMenuBar && chartMenuBar.drawn || actionBar && actionBar.drawn) {
                return;
            }
            chartAPI.scrollcolumn2d._createToolBox.call(iapi);
            toolBox = components.tb;
            toolBoxGraphics = toolBox.graphics || (toolBox.graphics = {});
            toolBoxAPI = components.toolBoxAPI || toolBox.getAPIInstances(toolBox.ALIGNMENT_HORIZONTAL);
            Symbol = toolBoxAPI.Symbol;
            SymbolStore = toolBoxAPI.SymbolStore;
            group = (components.chartMenuBar || components.actionBar).componentGroups[0];

            // Add the symbols in the chartMenuBar
            zoomOutButton = toolBoxGraphics.zoomOutButton = new Symbol('zoomOutIcon', undefined, toolBox.idCount++,
                toolBox.pId)
            .attachEventHandlers({
                'click' : function () {
                    iapi.zoomOut();
                },
                'tooltext': tooltip && config.btnZoomOutTooltext || BLANK
            });
            resetButton = toolBoxGraphics.resetButton = new Symbol('resetIcon', undefined, toolBox.idCount++,
                toolBox.pId)
            .attachEventHandlers({
                'click' : function () {
                    iapi.resetZoom();
                },
                'tooltext': tooltip && config.btnResetChartTooltext || BLANK
            });
            if (allowPinMode) {
                pinButton = toolBoxGraphics.pinButton = new Symbol('pinModeIcon', undefined, toolBox.idCount++,
                    toolBox.pId)
                .attachEventHandlers({
                    'click' : function () {
                        var info = config.viewPortConfig;
                        iapi.activatePin(!info.pinned);
                    },
                    'tooltext': tooltip && config.btnSwitchToPinModeTooltext || BLANK
                });
                // append the instance of the buttons to the group
                group.addSymbol(pinButton, true);
            }
            group.addSymbol(resetButton, true);
            group.addSymbol(zoomOutButton, true);

            /*group = (components.chartMenuBar || components.actionBar).componentGroups[1];
            // Add the symbols in the chartMenuBar
            zoomOutButton = toolBoxGraphics.zoomOutButton = new Symbol('zoomOutIcon', undefined, toolBox.idCount++,
                toolBox.pId);
            zoomOutButton.attachEventHandlers({
                'click' : function () {
                    this._parentGroup.setState(this);
                },
                'tooltext': tooltip && config.btnZoomOutTooltext || BLANK
            });
            resetButton = toolBoxGraphics.resetButton = new Symbol('resetIcon', undefined, toolBox.idCount++,
                toolBox.pId);
            resetButton.attachEventHandlers({
                'click' : function () {
                    this._parentGroup.setState(this);
                },
                'tooltext': tooltip && config.btnResetChartTooltext || BLANK
            });
            group.addSymbol(resetButton, true);
            group.addSymbol(zoomOutButton, true);*/
        },
        _scrollBar: chartAPI.scrollcolumn2d,
        _manageScrollerPosition: chartAPI.scrollcolumn2d,

        draw: function () {
            var borderWidth,
                roundEdges,
                info,
                tAtt,
                scrollBar,
                scrollNode,
                canvasLeft,
                canvasTop,
                canvasHeight,
                canvasWidth,
                canvasConfig,
                canvasBorderWidth,
                iapi = this,
                config = iapi.config,
                graphics = iapi.graphics || (iapi.graphics = {}),
                components = iapi.components,
                jsonData = iapi.jsonData,
                dataSet = jsonData.dataset,
                category = jsonData.categories && jsonData.categories[0].category,
                toolboxParentGroup;
            chartAPI.msline.draw.call (iapi);

            canvasLeft = config.canvasLeft;
            canvasTop = config.canvasTop;
            canvasHeight = config.canvasHeight;
            canvasWidth = config.canvasWidth;
            canvasConfig = components.canvas.config;
            canvasBorderWidth = canvasConfig.canvasBorderWidth;
            borderWidth = config.borderWidth;
            roundEdges = config.useRoundEdges;
            info = config.viewPortConfig;
            if (!(toolboxParentGroup = graphics.toolboxParentGroup)) {
                toolboxParentGroup = graphics.toolboxParentGroup = components.paper.group('toolbarParentGroup',
                    graphics.parentGroup);
            }
            if (dataSet && category) {

                // Draw the scrollbars and perform the initial configuration of
                // the scrollbars.
                // First crispen the scroller position to keep it in sync with the
                // canvas. We temporarily increment plotborderwidth to account for
                // the 1 pixel stroke width of scrollbar.
                borderWidth++;
                tAtt = R.crispBound(canvasLeft - borderWidth, canvasTop + canvasHeight + borderWidth,
                    canvasWidth + borderWidth + borderWidth, config.scrollHeight, borderWidth);
                borderWidth--; // revert the temporary increment
                // During creation of the scroller element, we check for the
                // "useRoundEdges" options and based on that, match the visuals and
                // positioning of the scrollbar with the canvas. We shift it up
                // slightly when useRoundEdges is on; so that it covers the lower
                // round edges of the canvas.
                scrollBar = components.scrollBar;
                scrollNode = scrollBar && scrollBar.node;
                // donot draw the scroller element if there is no dataSet in the JSON data.
                scrollBar.draw(tAtt.x + (roundEdges && -1 || (borderWidth % 2)), tAtt.y - (roundEdges && 4 || 2), {
                    isHorizontal: true,
                    width: tAtt.width - (!roundEdges && 2 || 0),
                    height: tAtt.height,
                    showButtons: config.scrollShowButtons,
                    scrollRatio: info.vdl / (info.clen - !!info.clen), // standard
                    scrollPosition: [info.dsi / (info.clen - info.vdl - 1), false],
                    r: roundEdges && 2 || 0,
                    parentLayer : toolboxParentGroup.insertBefore(graphics.datalabelsGroup)
                });
                // attach the callback for raising event only for it is a new scroll node.
                !scrollNode && (function () {
                    var prevPos;
                    R.eve.on('raphael.scroll.start.' + scrollBar.node.id, function (pos) {
                        prevPos = pos;
                        iapi.graphics.crossline && iapi.graphics.crossline.disable(true);

                        global.raiseEvent('scrollstart', {
                            scrollPosition: pos
                        }, iapi.chartInstance);
                    });

                    R.eve.on('raphael.scroll.end.' + scrollBar.node.id, function (pos) {
                        iapi.graphics.crossline && iapi.graphics.crossline.disable(false);
                        global.raiseEvent('scrollend', {
                            prevScrollPosition: prevPos,
                            scrollPosition: pos
                        }, iapi.chartInstance);
                    });
                }());
            }
        }
    }, chartAPI.msline, {
        showValues: 0,
        zeroplanethickness: 1,
        zeroplanealpha: 40,
        showzeroplaneontop: 0
    });

    chartAPI('zoomlinedy',{
        standaloneInit: true,
        defaultDatasetType: 'zoomline',
        applicableDSList: {
            'zoomline': true
        },
        creditLabel: creditLabel,
        friendlyName : 'Zoomable and Panable Multi-series Dual-axis Line Chart',
        _spaceManager: chartAPI.msdybasecartesian._spaceManager,
        _setAxisLimits: chartAPI.msdybasecartesian._setAxisLimits,
        _createAxes: chartAPI.msdybasecartesian._createAxes,
        _feedAxesRawData : chartAPI.msdybasecartesian._feedAxesRawData
    }, chartAPI.zoomline, {
        isdual: true
    });

    FusionCharts.register('component', ['dataset', 'zoomline', {
        _setConfigure: function () {
            var dataSet = this,
                conf = dataSet.config,
                cdef = dataSet.chart.jsonData.chart,
                JSONData = dataSet.JSONData;
            conf.drawanchors = pluckNumber(cdef.drawanchors, cdef.showanchors, 1);
            conf.anchorradius = pluckNumber(JSONData.anchorradius, cdef.anchorradius, conf.linethickness + 2);
            dataSet.__base__._setConfigure.apply(dataSet, arguments);
        },
        configure: function () {
            var pgsw,
                conf,
                pin = {},
                dataSet = this,
                cdef = dataSet.chart.jsonData.chart;
            //no animation is supported.
            cdef.animation = 0;
            cdef.showvalues = pluckNumber(cdef.showvalues, 0);
            dataSet.__base__.configure.call(dataSet);
            conf = dataSet.config;
            // pin line graphics is same as main graphics except a few changes
            pgsw = conf.linethickness + pluckNumber(cdef.pinlinethicknessdelta, 1);
            pin['stroke-width'] = pgsw > 0 && pgsw || 0;
            pin['stroke-dasharray'] = [3, 2];
            pin.stroke = lib.hashify(conf.linecolor);
            pin['stroke-opacity'] = conf.alpha / 100;
            pin['stroke-linejoin'] = (conf['stroke-linejoin'] = 'round');
            pin['stroke-linecap'] = (conf['stroke-linecap'] = 'round');

            conf.pin = pin;
            // animation is disabled in zoomline charts.
            conf.animation = false;
            conf.transposeanimduration = 0;
        },
        draw: function () {// retrieve required objects
            var newElem,
                graphics,
                UNDEF = null,
                flStart = false,
                flEnd = false,
                k,
                flag1 = false,
                flag2 = false,
                dataSet = this,
                JSONData = dataSet.JSONData,
                chart = dataSet.chart,
                chartComponents = chart.components,
                conf = dataSet.config,
                datasetIndex = dataSet.index || dataSet.positionIndex,
                chartConfig = chart.config,
                chartAttr = chart.jsonData.chart,
                dataSetComponents = dataSet.components,
                dataStore = dataSetComponents.data,
                dataSetLen = dataStore.length,
                len = dataSetLen,
                i,
                paper = chartComponents.paper,
                xAxis = chartComponents.xAxis[0],
                yAxis = dataSet.yAxis,
                xPos,
                yPos,
                layers = chart.graphics,
                dataLabelsLayer = layers.datalabelsGroup,
                parseUnsafeString = lib.parseUnsafeString,
                getValidValue = lib.getValidValue,
                toolText,
                label,
                setElement,
                hotElement,
                setLink,
                setValue,
                eventArgs,
                displayValue,
                groupId,
                animationDuration = conf.animation.duration,
                dataObj,
                setRolloutAttr,
                setRolloverAttr,
                lineThickness = conf.linethickness,
                container = dataSet.graphics.container,
                trackerContainer = dataSet.graphics.trackerContainer,
                // Called when clicking on the data plot
                // @param {Array} setDataArr
                clickFunc = function (setDataArr) {
                    var ele = this;
                    plotEventHandler.call(ele, chart, setDataArr);
                },
                /*
                    Called when hovering over anchor
                    @param {object} dataObj
                    @param {boolean} hoverEnabled
                */
                rolloverResponseSetter = function (data) {
                    var ele = this,
                        dataObj = ele.data('dataObj'),
                        hoverEnabled = dataObj.config.hoverEffects;
                    // Calling hoverplotanchor if hovereffects are enabled
                    if (hoverEnabled && dataObj && dataObj.graphics && dataObj.graphics.element) {
                        dataSet._hoverPlotAnchor(dataObj, ROLLOVER, chartAttr);
                    }
                    plotEventHandler.call(ele, chart, data, ROLLOVER);
                },
                /*
                    Called when hovering out of anchor
                    @param {object} dataObj
                    @param {boolean} hoverEnabled
                */
                rolloutResponseSetter = function (data) {
                    var ele = this,
                    dataObj = ele.data('dataObj'),
                    hoverEnabled = dataObj.config.hoverEffects;
                    // Calling hoverplotanchor if hovereffects are enabled
                    if (hoverEnabled && dataObj && dataObj.graphics && dataObj.graphics.element) {
                        dataSet._hoverPlotAnchor(dataObj, ROLLOUT, chartAttr);
                    }
                    plotEventHandler.call(ele, chart, data, ROLLOUT);
                },
                viewPortConfig = chartConfig.viewPortConfig,
                showTooltip = chartConfig.showtooltip,
                attr,
                group = layers.datasetGroup,
                hoverEffects,
                shadow = conf.shadow,
                anchorShadow,
                dataLabelContainer = dataSet.graphics.dataLabelContainer,
                anchorProps = {},
                imgRef,
                addAttr,
                symbol,
                config,
                is3D = chart.is3D,
                use3dlineshift = conf.use3dlineshift,
                showValue,
                /*
                    Called when transpose animation is completed
                    for hiding the dataset
                */
                /*animCallBack = function() {
                    lineElement.attr({
                        path: currentPath.getPathArr()
                    });
                    if (dataSet.visible === false && (dataSet._conatinerHidden === false ||
                            dataSet._conatinerHidden=== undefined)) {
                        container.lineGroup.hide();
                        container.lineShadowGroup.hide();
                        container.anchorShadowGroup.hide();
                        container.anchorGroup.hide();
                        trackerContainer.hide();
                        dataLabelContainer && dataLabelContainer.hide();
                        // isLineSet ? (dataSet._conatinerHidden  = fcJSON.lineset._conatinerHidden) :
                        //     (dataSet._conatinerHidden = true);
                        dataSet._conatinerHidden = true;
                    }
                },*/
                // animCompleteFn = chart.getAnimationCompleteFn(),
                /*
                    Called when the initial animation compeletes
                    for showing the dataset
                */
                initAnimCallBack = function () {
                    container.lineShadowGroup.show();
                    container.anchorShadowGroup.show();
                    container.anchorGroup.show();
                    trackerContainer.show();
                    dataLabelContainer && dataLabelContainer.show();
                    chart._animCallBack();
                    // animCompleteFn();
                },
                // animFlag = true,
                setTooltext,
                connector,
                dashStyle,
                yBase = yAxis.getAxisBase(),
                yBasePos = yAxis.yBasePos = yAxis.getAxisPosition(yBase),
                xAxisZeroPos = xAxis.getAxisPosition(0),
                xAxisFirstPos = xAxis.getAxisPosition(1),
                pointDistance = xAxisFirstPos - xAxisZeroPos,
                totalCanvasWidth,
                xDepth = is3D ? 10 : 0,
                yDepth = (is3D && use3dlineshift) ? 10 : 0,
                clipCanvas = [
                    mathMax(0, chartConfig.canvasLeft - xDepth),
                    mathMax(0, chartConfig.canvasTop - yDepth),
                    mathMax(1, chartConfig.canvasWidth + xDepth * 2),
                    mathMax(1, chartConfig.canvasHeight + yDepth)
                ],
                clipCanvasInit = [
                    mathMax(0, chartConfig.canvasLeft - xDepth),
                    mathMax(0, chartConfig.canvasTop - yDepth),
                    1,
                    mathMax(1, chartConfig.canvasHeight + yDepth * 2)
                ],
                scroll = {},
                isScroll = chart.hasScroll || false,
                scrollPosition,
                lineDashStyle = conf.lineDashStyle,
                lineColorObj = {
                    color: conf.linecolor,
                    alpha: conf.alpha
                },
                lscthash = [toRaphaelColor(lineColorObj), lineDashStyle].join(':'),
                setColor,
                setDashStyle,
                lineSegmentChange,
                colorObj,
                lineDrawing = 0,
                initialAnimation = false,
                connectorShadow,
                lineElement = dataSet.graphics.lineElement,
                visible = dataSet.visible,
                x,
                dip,
                pool = dataSet.pool || (dataSet.pool = {
                    element: []
                }),
                removePath = {},
                currentPath = {},
                connectorPath = {},
                anchorRadius = conf.anchorradius,
                catLabel,
                dataArr = [],
                cntr,
                j,
                dataIndex,
                strtIndex,
                skippedVals,
                endIndex,
                showTerminalValidData = chartConfig.showTerminalValidData,
                info = chartConfig.viewPortConfig,
                showPeakData = chartConfig.showPeakData,
                maxPeakDataLimit = chartConfig.maxPeakDataLimit,
                minPeakDataLimit = chartConfig.minPeakDataLimit,
                useCrossline = pluckNumber(chartConfig.useCrossline, 0),
                step = info.step, // stepping that can fit target pixels per point
                // minimum distance between two visible anchors
                anchorminrenderdistance = xAxis.getPixel(info.step) - xAxisZeroPos,
                // make anchors visible only when it is less than amrd.
                hideAnchors = anchorminrenderdistance < info.amrd,
                addAnchors = function (dataObj, dataIndex) {
                    var graphics = dataObj.graphics;

                    config = dataObj.config;
                    setValue = config.setValue;
                    setLink  = config.setLink;
                    x = config.x || dataIndex;
                    setTooltext = getValidValue(parseUnsafeString(pluck(config.setLevelTooltext,
                        JSONData.plottooltext, chartAttr.plottooltext)));
                    showValue = config.showValue;
                    anchorProps = config.anchorProps;
                    symbol = anchorProps.symbol;
                    anchorShadow = anchorProps.shadow;
                    displayValue = config.displayValue;
                    dip = config.dip || 0;
                    // Creating the data object if not created
                    if (!dataObj) {
                        dataObj = dataStore[dataIndex] = {
                            graphics : {}
                        };
                    }
                    // Storing the color Object of this data
                    colorObj = {
                        color: config.color,
                        alpha: config.alpha
                    };
                    dashStyle = config.dashStyle;
                    xPos = config.xPos || (xAxis.getAxisPosition(x) - xDepth);
                    // On hiding a dataset the y position of the hidden dataset is set to yBasePos
                    if (!dataSet.visible) {
                        yPos = yBasePos;
                    }
                    else {
                        yPos = yAxis.getAxisPosition(setValue) + yDepth;
                    }
                    hoverEffects = config.hoverEffects;
                    anchorProps.isAnchorHoverRadius = hoverEffects.anchorRadius;

                    label = config.label;
                    catLabel = xAxis.getLabel(dataIndex);
                    toolText = useCrossline ? BLANK : config.toolText + (setTooltext ? BLANK :
                        config.toolTipValue);
                    // Storing the event arguments
                    eventArgs = {
                        index: dataIndex,
                        link: setLink,
                        value: setValue,
                        displayValue: displayValue,
                        categoryLabel: catLabel,
                        toolText: toolText,
                        id: conf.userID,
                        datasetIndex: datasetIndex,
                        datasetName: JSONData.seriesname,
                        visible: visible
                    };
                    // donot create anchor elements if thats a null data.
                    if (config.setValue !== null && !hideAnchors) {
                        // If imageurl is present
                        if (anchorProps.imageUrl) {
                            imgRef = new Image();
                            addAttr = {
                                isTooltip : showTooltip,
                                setLink : setLink,
                                hotLayer : trackerContainer,
                                groupId : groupId,
                                clickFunc : clickFunc
                            };
                            imgRef.onload = dataSet._onAnchorImageLoad(dataSet, dataIndex, eventArgs, xPos, yPos);
                            imgRef.onerror = dataSet._onErrorSetter(xPos, yPos, dataIndex, dataSet);
                            imgRef.src = anchorProps.imageUrl;
                        }
                        else {
                            setElement = graphics.element;
                            if (!setElement) {
                                // If there is no existing graphics element then create it
                                if(pool.element && pool.element.length) {
                                    setElement = graphics.element = pool.element.shift();
                                }
                                else {
                                    setElement = graphics.element = paper.polypath(container.anchorGroup);
                                }
                            }
                            // Set all attributes that are not related to non position
                            setElement
                            .attr({
                                polypath: [anchorProps.symbol[1] || 2, xPos, yPos,
                                anchorProps.radius, anchorProps.startAngle, dip],
                                fill: toRaphaelColor({
                                    color: anchorProps.bgColor,
                                    alpha: anchorProps.bgAlpha
                                }),
                                stroke: toRaphaelColor({
                                    color: anchorProps.borderColor,
                                    alpha: anchorProps.borderAlpha
                                }),
                                'stroke-width': anchorProps.borderThickness,
                                'visibility': !anchorProps.radius ? 'hidden' : visible
                            })
                            .shadow(anchorShadow, container.anchorShadowGroup)
                            .data('anchorRadius', anchorProps.radius)
                            .data('anchorHoverRadius', hoverEffects.anchorRadius)
                            .data('setRolloverAttr', setRolloverAttr)
                            .data('setRolloutAttr', setRolloutAttr);
                            // hide the anchor element if the data is that of a null data
                            setElement[(setValue || (setValue === 0)) ? 'show' : 'hide']();
                        }
                        setRolloverAttr = {
                            polypath: [hoverEffects.anchorSides || 2,
                                        xPos, yPos,
                                        hoverEffects.anchorRadius,
                                        hoverEffects.startAngle,
                                        hoverEffects.dip
                                    ],
                            fill: toRaphaelColor({
                                color: hoverEffects.anchorColor,
                                alpha: hoverEffects.anchorBgAlpha
                            }),
                            stroke: toRaphaelColor({
                                color: hoverEffects.anchorBorderColor,
                                alpha: hoverEffects.anchorBorderAlpha
                            }),
                            'stroke-width': hoverEffects.anchorBorderThickness
                        };
                        setRolloutAttr = {
                            polypath: [anchorProps.sides, xPos, yPos,
                                        anchorProps.radius, anchorProps.startAngle, dip
                                    ],
                            fill: toRaphaelColor({
                                color: anchorProps.bgColor,
                                alpha: anchorProps.bgAlpha
                            }),
                            stroke: toRaphaelColor({
                                color: anchorProps.borderColor,
                                alpha: anchorProps.borderAlpha
                            }),
                            'stroke-width': anchorProps.borderThickness
                        };
                        setElement && setElement
                        .data('anchorRadius', anchorProps.radius)
                        .data('anchorHoverRadius', hoverEffects.anchorRadius)
                        .data('setRolloverAttr', setRolloverAttr)
                        .data('setRolloutAttr', setRolloutAttr);
                        // anchor Radius of hot element is set to maximum of hover radius and anchor radius
                        anchorRadius = mathMax(anchorProps.radius,
                            hoverEffects &&
                            hoverEffects.anchorRadius || 0);

                        // Hot Element drawing
                        attr = {
                            cx: xPos,
                            cy: yPos,
                            r: anchorRadius,
                            cursor: setLink ? 'pointer' : '',
                            stroke: TRACKER_FILL,
                            'stroke-width': anchorProps.borderThickness,
                            fill: TRACKER_FILL,
                            ishot: true,
                            visibility: visible
                        };
                        if (!anchorProps.imageUrl && (setLink || showTooltip)) {
                            hotElement = graphics.hotElement;
                            // Creating the hot element if not created
                            if (!hotElement) {
                                if (pool.hotElement && pool.hotElement.length) {
                                    hotElement = graphics.hotElement = pool.hotElement.shift();
                                }
                                else {
                                    newElem = true;
                                    hotElement = graphics.hotElement = paper.circle(trackerContainer);
                                }
                            }
                            hotElement
                            .show()
                            .attr(attr);

                            (hotElement || setElement)
                            .data('eventArgs', eventArgs)
                            .data('groupId', groupId)
                            .data('dataObj', dataObj);

                            if (newElem) {
                                (hotElement || setElement)
                                .click(clickFunc)
                                .hover(rolloverResponseSetter, rolloutResponseSetter);
                            }
                            newElem = false;
                        }
                    }
                    dataObj._xPos = xPos;
                    dataObj._yPos = yPos;
                    /*
                        if colorObj and dash style of this data is different from
                        the previous data then a new line segment is to be created
                    */
                    lineSegmentChange = (lscthash !== [
                        toRaphaelColor(colorObj || lineColorObj),
                        dashStyle || lineDashStyle
                    ].join(':'));
                    connector = dataObj.graphics.connector;
                    connectorPath = dataSet.getLinePath([dataObj], connectorPath);
                    setColor = toRaphaelColor(colorObj || lineColorObj);
                    if (colorObj) {
                        connectorShadow = {
                            opacity: colorObj && colorObj.alpha/100
                        };
                    }
                    else {
                        connectorShadow = shadow;
                    }
                    setDashStyle = dashStyle || lineDashStyle;
                    /*If color,alpha or dashed is not defined for this data
                    then line drawing is set to 1 so the path of this data is
                    appended to mainLinePath and not the connector path
                    */
                    if (pluck(config.setColor, config.setAlpha, config.setDashed) === UNDEFINED) {
                        lineDrawing = 1;
                    }
                    else {
                        lineDrawing = 0;
                    }
                    lscthash = [setColor, setDashStyle].join(':');
                    /*Storing the x position and y position in dataObject for future reference
                    For example - when drawing labels we need this xPos and yPos
                    */
                    showValue && !anchorProps.imageUrl && dataSet.drawLabel(dataIndex);
                    dataArr.push(dataObj);
                },
                renderPeakData = function(cVal, index) {
                    var numVals = cVal && cVal.length,
                        orderArr = cVal.slice().sort(function (a, b){
                            return a.config.setValue - b.config.setValue;
                        }),
                        maxVal = orderArr && orderArr.pop().config.setValue,
                        minVal = (orderArr.length && orderArr.shift().config.setValue) || maxVal,
                        counter = 0,
                        origIndex,
                        val;
                    //now if any value is above or below of the
                    //peak limits enter into iteration. This is to maximize
                    //performance.
                    if(maxVal > maxPeakDataLimit || minVal < minPeakDataLimit) {
                        while(counter < numVals) {
                            setElement = cVal[counter];
                            val = setElement.config.setValue;
                            if(val > maxPeakDataLimit || val < minPeakDataLimit) {
                                origIndex = index + counter;
                                //we have a sudden peak. need to show this
                                addAnchors(setElement, origIndex);
                            }
                            counter += 1;
                        }
                    }

                },
                reuseFN = function (start, end) {
                    // todo: Need to re-validate the use of this. Its a safer approach to remove one elements each
                    // from both sides
                    start -= 1;
                    end += 1;
                    // todo ends.
                    var prop;
                    for (i = start; i < end; i += 1) {
                        graphics = dataStore[i] && dataStore[i].graphics || {};
                        dataStore[i] && (dataStore[i].config.isRemoving = true);
                        for (prop in graphics) {
                            if (!pool[prop]) {
                                pool[prop] = [];
                            }
                            if (graphics[prop]) {
                                pool[prop].push(graphics[prop].hide());
                                graphics[prop] = undefined;
                            }
                        }
                    }
                },
                ddsi = (viewPortConfig.ddsi || 0),
                ii = viewPortConfig.ddei || len,
                _oldStartIndex = conf._oldStartIndex,
                _oldEndIndex = conf._oldEndIndex,
                _oldStep = conf._oldStep,
                removeDataArr = dataSetComponents.removeDataArr,
                removeDataArrLen = removeDataArr && removeDataArr.length;

            // Creating the line group and appending it to dataset layer if not created
            group.line = group.line ||
                paper.group('line', group);
            /*
             * Creating lineConnector group and appending it to dataset layer if not created
             * Lineconnector group has the anchorgroups of all datasets
             */
            group.lineConnector = group.lineConnector ||
                paper.group('line-connector', group);
            // Create dataset container if not created
            if (!container) {
                container = dataSet.graphics.container = {
                    lineShadowGroup: paper.group('connector-shadow', group.line),
                    anchorShadowGroup: paper.group('anchor-shadow', group.lineConnector),
                    lineGroup: paper.group('line', group.line),
                    anchorGroup: paper.group('anchors', group.lineConnector)
                };
                container.lineGroup.trackTooltip(true);
                if (!visible) {
                    container.lineShadowGroup.hide();
                    container.anchorShadowGroup.hide();
                    container.lineGroup.hide();
                    container.anchorGroup.hide();
                }
            }
            // Create tracker container if not created
            if (!trackerContainer) {
                trackerContainer = dataSet.graphics.trackerContainer = paper.group('line-hot',layers.trackerGroup)
                .toBack();
                if (!visible) {
                    trackerContainer.hide();
                }
            }

            if (!dataStore) {
                dataStore = dataSet.components.data = [];
            }

            if (!dataLabelContainer) {
                dataLabelContainer = dataSet.graphics.dataLabelContainer = dataSet.graphics.dataLabelContainer ||
                    paper.group('datalabel', dataLabelsLayer);
                if (!visible) {
                    dataLabelContainer.hide();
                }
            }
            /*  Calculating total canvas width
                Required for scroll charts
            */
            totalCanvasWidth = pointDistance * len;
            // if anchors were shown in previous state and now hidden due to amrd constrain, hide them all of the prev.
            if (hideAnchors && !conf._oldHideAnchors) {
                reuseFN(_oldStartIndex, _oldEndIndex);
            }
            else {
                // If step values are changed while zoom in/out, remove all of the prev anchors.
                if (step !== _oldStep) {
                    reuseFN(_oldStartIndex, _oldEndIndex);
                }
                // useful in case of scroll. Here the step values are not changed. Hence removing optimally.
                else {
                    if (ddsi > _oldStartIndex) {
                        reuseFN(_oldStartIndex, (ddsi > _oldEndIndex) ? _oldEndIndex : ddsi);
                    }
                    if (ii < _oldEndIndex) {
                        reuseFN((ii < _oldStartIndex) ? _oldStartIndex : ii, _oldEndIndex);
                    }
                    if (ddsi < _oldStartIndex || ii > _oldEndIndex) {
                        reuseFN(_oldStartIndex, _oldEndIndex);
                    }
                }
            }
            // caching the present state for future reference.
            conf._oldHideAnchors = hideAnchors;
            conf._oldEndIndex = ii;
            conf._oldStep = step;
            dataSet.setVisibility(visible);
            //create plot elements
            for (i = (conf._oldStartIndex = ddsi); i <= ii; i += (step)) {
                dataObj = dataStore[i] || {};
                config = dataObj.config || {};
                config.isRemoving = false;
                setValue = config.setValue || UNDEF;
                dataIndex = i;
                if (showTerminalValidData) {
                    // search for first valid data point and first step valid data point
                    // true if first data value is undefined
                    if ((i === 0) && (setValue === UNDEF)) {
                        cntr = 0;
                        for (j = k = i; j < len;) {

                            // search for first valid data point and set flag1 true,
                            // if first valid data point found
                            if ((dataStore[j].config.setValue === UNDEF) && !flag1) {
                                j++;
                            }
                            else {
                                flag1 = true;
                            }

                            // search for first valid step data point and set flag2 true,
                            // if first valid data point found
                            if ((dataStore[k].config.setValue === UNDEF) && (!flag2) && (k <= len)) {
                                k += step;
                                cntr++;
                            }
                            else {
                                flag2 = true;
                            }

                            // check both flag value
                            // terminates loop if both first valid data point and first valid step data point found
                            if (flag1 && flag2) {
                                flag1 = flag2 = false;
                                break;
                            }
                        }
                        if ( j % step !== 0) {
                            flStart = true;
                            config = dataStore[j].config;
                            dataIndex = j;
                        }
                    }

                    // search for last valid data point and last step valid data point
                    // true if i exceeds data length
                    else if ((i >= len) && (setValue === UNDEF)) {
                        for (j = k = i; j > 0;) {

                            // search for last valid data point and set flag1 true,
                            // if last valid data point found
                            if ((dataStore[j] === undefined) && !flag1) {
                                j--;
                            }
                            else {
                                flag1 = true;
                            }

                            // search for last valid step data point and set flag2 true,
                            // if last valid data point found
                            if (dataStore[k] === undefined && (!flag2)  && (k >= 0)) {
                                k -= step;
                            }
                            else {
                                flag2 = true;
                            }

                            // check both flag value
                            // terminates loop if both last valid data point and last valid step data point found
                            if (flag1 && flag2) {
                                break;
                            }
                        }
                        if ( j % step !== 0) {
                            flEnd = true;
                            config = dataStore[j].config;
                            dataIndex = j;
                        }
                    }
                }
                dataObj = dataStore[dataIndex];
                if (!dataObj) {
                    continue;
                }
                addAnchors(dataObj, dataIndex);
                // No point searching for peak when ther is no stepping
                if(showPeakData && step > 1) {
                    strtIndex = mathMin((i + 1), ii);
                    endIndex = mathMin((strtIndex + step), ii);
                    skippedVals = (endIndex === ii) ? dataStore.slice(strtIndex) : dataStore.slice(strtIndex,
                        endIndex);
                    skippedVals.length && renderPeakData(skippedVals, strtIndex);
                }
            }
            currentPath = dataSet.getLinePath(dataArr, {});
            removePath = dataSet.getLinePath(dataArr, removePath);
            conf.lastPath = currentPath;
            if (!lineElement) {
                if (pool.lineElement && pool.lineElement.length) {
                    lineElement = dataSet.graphics.lineElement = pool.lineElement.shift();
                }
                else {
                    lineElement = dataSet.graphics.lineElement = paper.path(container.lineGroup);
                }
            }
            // Show tooltip if crossline is disabled
            if (!useCrossline) {
                if (!lineElement.tooltipListenerAttached) {
                    lineElement.tooltipListenerAttached = true;
                    lineElement.mousemove(function (e) {
                        info = chartConfig.viewPortConfig;
                        var plotX = chartConfig._visx,
                            step = info.step,
                            stepw = info.ppp * step,
                            x = getMouseCoordinate(chart.linkedItems.container, e).chartX - plotX,
                            pos,
                            parsedLabel,
                            tooltipText,
                            tooltipTextSeparator = chartConfig.tooltipSepChar;
                        x = (x += (stepw / 2) + info.offset) - x % (stepw);
                        pos = (pos = (chart.getValuePixel(x))) + pos % step;
                        parsedLabel = xAxis.getLabel(pos).label;

                        // Initial tooltip text
                        tooltipText = parsedLabel + tooltipTextSeparator +
                            dataSet.components.data[pos].config.formatedVal;
                        // Add plot name if exists in tooltip text
                        tooltipText = conf.seriesname && (conf.seriesname + tooltipTextSeparator + tooltipText) ||
                            tooltipText;
                        lineElement.tooltip(chartConfig.crossline.enabled === 0 ? tooltipText : false);
                    });
                }
            }
            lineElement
            .attr({
                path: currentPath.getPathArr(),
                'stroke-dasharray': lineDashStyle,
                'stroke-width': lineThickness,
                stroke: toRaphaelColor(lineColorObj),
                'stroke-linecap': 'round',
                /*  for lines even with thickness as 2 we need to have round line join
                otherwise the line join may look like exceeding the correct position
                */
                'stroke-linejoin': lineThickness >= MAX_MITER_LINEJOIN ? 'round' : 'miter'
            })
            .shadow(shadow, container.lineShadowGroup);

            // Animation from right when scrollToEnd is 1
            if (isScroll) {
                scrollPosition = scroll.startPercent;
                clipCanvas[2] = totalCanvasWidth + clipCanvasInit[0];
                if (scrollPosition === 1) {
                    clipCanvasInit[0] = clipCanvas[2];
                    clipCanvas[0] = 0;
                }
            }
            clipCanvas[3] = clipCanvas[3] + yDepth;
            if (animationDuration && visible && initialAnimation) {
                container.anchorGroup.hide();
                container.lineShadowGroup.hide();
                container.anchorShadowGroup.hide();
                dataLabelContainer.hide();
                group.line.attr({
                    'clip-rect': clipCanvasInit
                })
                .animate({
                    'clip-rect': clipCanvas
                }, animationDuration, 'normal', initAnimCallBack);
            }
            dataSet.drawn = true;
            removeDataArrLen && dataSet.remove();
        },
        setVisibility: function (isVisible, isTranspose) {
            var dataSet = this,
                graphics = dataSet.graphics,
                container = graphics && graphics.container,
                trackerContainer = graphics && graphics.trackerContainer,
                dataLabelContainer = graphics && graphics.dataLabelContainer,
                action = isVisible ? 'show' : 'hide';
            container.lineGroup[action]();
            container.anchorGroup[action]();
            container.anchorShadowGroup[action]();
            container.lineShadowGroup[action]();
            trackerContainer[action]();
            dataLabelContainer[action]();

            isTranspose && dataSet.transposeLimits(isVisible);

        },
        transposeLimits: function (isVisible) {
            var dataSet = this,
                chart = dataSet.chart,
                chartConfig = chart.config,
                yAxis = dataSet.yAxis;

            chart._chartAnimation();
            dataSet.visible = isVisible;
            dataSet._conatinerHidden = !isVisible;

            chart._setAxisLimits();
            yAxis.draw();
            chartConfig.legendClicked = true;
            // Calling the draw function for redrawing the dataset
            chart._drawDataset();
            delete chartConfig.legendClicked;
        },
        /*
         * Hides when clicked on its respective legend
         * Fired every time an activated legend is clicked
         */
        hide : function() {
            this.setVisibility(false, true);
        },
        show : function() {
            this.setVisibility(true, true);
        }
    },'Line']);

    CrossLine = function ()  {};

    CrossLine.prototype.configure = function (chart, options) {
        // Create the tracker for cross-hair. This is needed for mouse
        // tracking.
        var i,
            ii,
            plot,
            plotColor,
            attrObj = {},
            crossLine = this,
            labelPadding = 2.5,
            chartComponents = chart.components,
            numberFormatter = chartComponents.numberFormatter,
            paper = chartComponents.paper,
            chartConfig = chart.config,
            chartGraphics = chart.graphics,
            plotX = this.left = chartConfig._visx,
            plotY = this.top = chartConfig.canvasTop,
            plotH = this.height = chartConfig.canvasHeight,
            plotO = this._visout = chartConfig._visout,
            plots = this.plots = chart.components.dataset,
            datalayer = chartGraphics.datalabelsGroup,
            group,
            line,
            labelStyle = options.labelstyle,
            valueStyle = options.valuestyle,
            pyaxis = chartComponents.yAxis[0],
            pYAxisLimits = pyaxis.getLimit(),
            syaxis = chartComponents.yAxis[1],
            sYAxisLimits = syaxis && syaxis.getLimit(),
            tracker = this.tracker,
            labels = this.labels,
            positionLabel = this.positionLabel,
            linkedItems = chart.get('linkedItems'),
            containerElem = linkedItems.container,
            listeners = linkedItems.eventListeners || (linkedItems.eventListeners = []),
            isWithinCanvas = function (e, fn, fnOut) {
                // calls the function only if it is within the canvasArea.
                if (chart.isWithinCanvas(e, chart).insideCanvas) {
                    fn.call(crossLine, e);
                }
                else {
                    fnOut.call(crossLine, e);
                }
            };

        crossLine.width = chartConfig._visw;
        // Create the group inside data layer where the cross-line elements will play around.
        group = this.group;
        if (!group) {
            group = this.group = paper.group ('crossline-labels', datalayer);
            // Store chart's container to be use by mouseMove event
            // to calculate the mouse coordinates.
            this.container = containerElem;
        }
        group
        .attr ( {
            transform: ['T', plotX, chartConfig._ymin]
        })
        .css(valueStyle);

        // Cross-line needs a personal tracker to intercept mouse interactions around and over data plots.
        if (!tracker) {
            tracker = crossLine.tracker = containerElem;

            //adds to event stack.
            listeners.push(addEvent(containerElem, 'touchstart mousemove', function (e) {
                isWithinCanvas(e, crossLine.onMouseMove, crossLine.onMouseOut);
            }, crossLine));

            //adds to event stack.
            listeners.push(addEvent(containerElem, 'mousedown', function () {
                crossLine.onMouseDown();
            }, crossLine));

            //adds to event stack.
            listeners.push(addEvent(containerElem, 'mouseup', function () {
                crossLine.onMouseUp();
            }, crossLine));

            //adds to event stack.
            listeners.push(addEvent(containerElem, 'mouseout', function () {
                crossLine.onMouseOut();
            }, crossLine));
        }
        /*tracker
        .attr ({
            x: plotX,
            y: plotY,
            width: plotW,
            height: plotH,
            stroke: 'none',
            'stroke-width': 0,
            fill: TRACKER_FILL
        });*/

        // Cross-line obviously needs a line.
        line = this.line;

        if (!line) {
            line = this.line = paper.path(datalayer)
            .toBack ();
        }
        line
        .attr (extend2 ( {
            path: ['M', plotX, plotY, 'l', 0, plotH]
        }, options.line));

        if (!labels) {
            labels = this.labels = options.valueEnabled && paper.set ();
        }
        // add the category label
        if (options.labelEnabled) {
            attrObj.x = plotO;
            attrObj.y = plotY + plotH + (chartConfig.scrollHeight || 0) + labelPadding;
            attrObj['vertical-align'] = 'top';
            attrObj.direction = chartConfig.textDirection;
            attrObj.text = BLANK;
            if (!positionLabel) {
                positionLabel = this.positionLabel = paper.text(attrObj, labelStyle, chartGraphics.datalabelsGroup)
                .insertBefore (chartGraphics.datasetGroup);
            }
            else {
                positionLabel.attr(attrObj);
                positionLabel.css(labelStyle);
            }
        }
        else {
            positionLabel && positionLabel.remove();
            delete this.positionLabel;
        }

        // initially hidden
        this.hide ();
        this.ppixelRatio = -pyaxis.getPVR();
        this.spixelRatio = syaxis && -syaxis.getPVR();
        this.yminValue = chartConfig._yminValue;
        this.pyaxisminvalue = pYAxisLimits.min;
        this.pyaxismaxvalue = pYAxisLimits.max;
        this.syaxisminvalue = sYAxisLimits && sYAxisLimits.min;
        this.syaxismaxvalue = sYAxisLimits && sYAxisLimits.max;
        this.positionLabels = chartConfig.xlabels || {
            data: [],
            parsed: []
        };
        this.chart = chart;

        // Open closed function to access chart variables.
        this.getZoomInfo = function () {
            return chartConfig.viewPortConfig;
        };

        this.getDataIndexFromPixel = function (px) {
            return Math.round(chart.components.xAxis[0].getValue(px));
        };

        this.getPositionLabel = function (index) {
            var text = chart.components.xAxis[0].getLabel(index);
            return (text && text.label) || BLANK;
        };

        if (options.valueEnabled) {
            for (i = 0, ii = plots.length; i < ii; i += 1) {
                plot = plots[i];
                plotColor = hashify(plot.config.linecolor);

                attrObj.x = 0;
                attrObj.y = plotO;
                attrObj.fill = plotColor;
                attrObj.direction = chartConfig.textDirection;
                attrObj.text = BLANK;
                attrObj['text-bound'] = valueStyle['text-bound'];
                attrObj.lineHeight = valueStyle.lineHeight;
                if (!labels[i]) {
                    labels[i] = labels.items[i] = paper.text(attrObj, UNDEFINED, group);
                }
                else {
                    labels[i]
                    .attr(attrObj);
                    // .css (valueStyle);
                }
            }
            for (; i < labels.items.length; i += 1) {
                labels[i].remove();
                delete labels[i];
                labels.items.splice(i,1);
            }
            this.numberFormatter = numberFormatter;
        }
        else if (labels.items && labels.items.length) {
            for (i = 0; i < labels.items.length; i += 1) {
                labels[i].remove();
                delete labels[i];
            }
            labels.length = 0;
        }
    };
    CrossLine.prototype.disable = function (state) {
        if (state !== UNDEF) {
            this.disabled = !!state;
            if (this.disabled && this.visible) {
                this.hide ();
            }
        }
        return this.disabled;
    };

    CrossLine.prototype.onMouseOut = function () {
        this.hide ();
        this.position = undefined;
    };

    CrossLine.prototype.onMouseDown = function () {
        !hasTouch && this.hide ();
        this._mouseIsDown = true;
    };

    CrossLine.prototype.onMouseUp = function () {
        !hasTouch && this.hide ();
        delete this._mouseIsDown;
    };

    CrossLine.prototype.onMouseMove = function (e) {
        if (this.disabled || (this._mouseIsDown && !hasTouch)) {
            return;
        }
        var residue,
            info = this.getZoomInfo (),
            line = this.line,
            plotX = this.left,
            step = info.step,
            chart = this.chart,
            xAxis = chart.components.xAxis[0],
            chartConfig = chart.get('config'),
            canvasLeft = chartConfig.canvasLeft,
            axisDimention = xAxis.getAxisConfig('axisDimention'),
            // labelStep = xAxis.getAxisConfig('labelStep'),
            x = getMouseCoordinate (this.container, e).chartX - plotX,
            xAxisVisible = xAxis._getVisibleConfig(),
            // cdm = chart.config.cdm,
            //bridge code.
            /*bridgePixel = cdm ? (xAxis.getPixel(0) - xAxis.getPixel(axisMin)) / info.scaleX :
                axisDimention.x - canvasLeft,*/
            bridgePixel = axisDimention.x - canvasLeft,
            pos;
        // x = (x += (stepw / 2) + info.offset) - x % (stepw);
        pos = (pos = this.getDataIndexFromPixel (mathRound (x))) + ((((residue =
            (pos % step)) > (step / 2)) ? step - residue : -residue));
        x = (xAxis.getPixel(pos) - bridgePixel) - canvasLeft;
        // x -= info.offset;
        line.transform(['T', mathRound(x), 0]);
        (this.hidden && (chartConfig.crossline.enabled !== 0)) && this.show ();
        // Donot show the crossline out of canvas area.
        (pos < xAxisVisible.minValue || pos > xAxisVisible.maxValue) && (this.hide());
        if (pos !== this.position || this.hidden) {
            this.position = pos;
            this.lineX = x;
            this.updateLabels ();
        }
    };

    CrossLine.prototype.updateLabels = function () {
        var crossline = this,
            labelPadding = 2.5,
            labels = crossline.labels,
            plots = crossline.plots,
            visw = crossline.width,
            position = crossline.position,
            x = crossline.lineX,
            flooredX = mathFloor (x),
            ppvr = crossline.ppixelRatio,
            spvr = crossline.spixelRatio,
            yminValue = crossline.yminValue,
            plotOut = crossline._visout,
            numberFormatter = crossline.numberFormatter,
            pYAxisMinValue = crossline.pyaxisminvalue,
            pYAxisMaxValue = crossline.pyaxismaxvalue,
            sYAxisMinValue = crossline.syaxisminvalue,
            sYAxisMaxValue = crossline.syaxismaxvalue,
            verticalLimits = (function () {
                /*
                 * This controls the overlapping of the crosshair labels if the plots are close.
                 * This calculates the space to display the labels at the before it is plotted in DOM.
                 * The buleprint of the algorithm is like:
                 * When the labels position is being calculated.
                 * a) Place the label if the position is not occupied
                 * b) If the position is occupied find the neares unoccupied space
                 * c) If the unoccupied space is downwards place it there
                 * d) If the unoccupied space is upwards move the whole system up and place it in the next available
                 * down position
                 */
                var _top = crossline.height * (-1),
                    _bottom = yminValue * ppvr,
                    boxHeight = 0,  // Height of text
                    margin = 2,
                    oMatrix,
                    result = { },
                    isSpaceEnough = false,
                    sections,
                    abs = Math.abs,
                    floor = Math.floor,
                    scale = { };

                /*
                * Polyfills
                * Ofcourse and obviously for IE8
                */
                // Pollyfills for Object.create
                // Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
                if (typeof Object.create != 'function') {
                    // Production steps of ECMA-262, Edition 5, 15.2.3.5
                    // Reference: http://es5.github.io/#x15.2.3.5
                    /*jslint freeze: false */
                    Object.create = (function () {
                        // To save on memory, use a shared constructor
                        function Temp () { }

                        // make a safe reference to Object.prototype.hasOwnProperty
                        var hasOwn = Object.prototype.hasOwnProperty;

                        return function (O) {
                            var Properties, prop, obj;
                            // 1. If Type (O) is not Object or Null throw a TypeError exception.
                            if (typeof O != 'object') {
                                throw new TypeError ('Object prototype may only be an Object or null');
                            }

                            // 2. Let obj be the result of creating a new object as if by the
                            //    expression new Object () where Object is the standard built-in
                            //    constructor with that name
                            // 3. Set the [[Prototype]] internal property of obj to O.
                            Temp.prototype = O;
                            obj = new Temp ();
                            Temp.prototype = null; // Let's not keep a stray reference to O...

                            // 4. If the argument Properties is present and not undefined, add
                            //    own properties to obj as if by calling the standard built-in
                            //    function Object.defineProperties with arguments obj and
                            //    Properties.
                            if (arguments.length > 1) {
                                // Object.defineProperties does ToObject on its first argument.
                                Properties = Object (arguments[1]);
                                for (prop in Properties) {
                                    if (hasOwn.call (Properties, prop)) {
                                        obj[prop] = Properties[prop];
                                    }
                                }
                            }

                            // 5. Return obj
                            return obj;
                        };
                    }) ();
                }

                // Pollyfills for Array indexOf
                // Ref: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
                if (!Array.prototype.indexOf) {
                    /*jslint freeze: false */
                    Array.prototype.indexOf = function (searchElement, fromIndex) {

                        var k, O, len, n;

                        // 1. Let O be the result of calling ToObject passing
                        //    the this value as the argument.
                        if (this == null) {
                            throw new TypeError ('"this" is null or not defined');
                        }

                        O = Object (this);

                        // 2. Let lenValue be the result of calling the Get
                        //    internal method of O with the argument "length".
                        // 3. Let len be ToUint32 (lenValue).
                        len = O.length >>> 0;

                        // 4. If len is 0, return -1.
                        if (len === 0) {
                            return -1;
                        }

                        // 5. If argument fromIndex was passed let n be
                        //    ToInteger (fromIndex); else let n be 0.
                        n = +fromIndex || 0;

                        if (Math.abs (n) === Infinity) {
                            n = 0;
                        }

                        // 6. If n >= len, return -1.
                        if (n >= len) {
                            return -1;
                        }

                        // 7. If n >= 0, then Let k be n.
                        // 8. Else, n<0, Let k be len - abs (n).
                        //    If k is less than 0, then let k be 0.
                        k = Math.max (n >= 0 ? n : len - Math.abs (n), 0);

                        // 9. Repeat, while k < len
                        while (k < len) {
                            // a. Let Pk be ToString (k).
                            //   This is implicit for LHS operands of the in operator
                            // b. Let kPresent be the result of calling the
                            //    HasProperty internal method of O with argument Pk.
                            //   This step can be combined with c
                            // c. If kPresent is true, then
                            //    i.  Let elementK be the result of calling the Get
                            //        internal method of O with the argument ToString (k).
                            //   ii.  Let same be the result of applying the
                            //        Strict Equality Comparison Algorithm to
                            //        searchElement and elementK.
                            //  iii.  If same is true, return k.
                            if (k in O && O[k] === searchElement) {
                                return k;
                            }
                            k++;
                        }
                        return -1;
                    };
                }

                // Pollyfills for Array forEach
                // Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
                if (!Array.prototype.forEach) {
                    // Production steps of ECMA-262, Edition 5, 15.4.4.18
                    // Reference: http://es5.github.io/#x15.4.4.18
                    /*jslint freeze: false */
                    Array.prototype.forEach = function (callback, thisArg) {

                        var T, k, O, len, kValue;

                        if (this == null) {
                            throw new TypeError (' this is null or not defined');
                        }

                        // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
                        O = Object (this);

                        // 2. Let lenValue be the result of calling the Get internal method of O
                        // with the argument "length".
                        // 3. Let len be ToUint32 (lenValue).
                        len = O.length >>> 0;

                        // 4. If IsCallable (callback) is false, throw a TypeError exception.
                        // See: http://es5.github.com/#x9.11
                        if (typeof callback !== 'function') {
                            throw new TypeError (callback + ' is not a function');
                        }

                        // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
                        if (arguments.length > 1) {
                            T = thisArg;
                        }

                        // 6. Let k be 0
                        k = 0;

                        // 7. Repeat, while k < len
                        while (k < len) {
                            // a. Let Pk be ToString (k).
                            //   This is implicit for LHS operands of the in operator
                            // b. Let kPresent be the result of calling the HasProperty internal method of O
                            // with argument Pk.
                            //   This step can be combined with c
                            // c. If kPresent is true, then
                            if (k in O) {

                                // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                                kValue = O[k];

                                // ii. Call the Call internal method of callback with T as the this value and
                                // argument list containing kValue, k, and O.
                                callback.call (T, kValue, k, O);
                            }
                            // d. Increase k by 1.
                            k++;
                        }
                        // 8. return undefined
                    };
                }

                // Attachable label can be positioned / attached anywhere along the y axis.
                // If its position is changed via shifting or providing index it auto calculates the y.
                function AttachableLabel () {
                    this.y = 0;  // Absolute position
                    this.lRef = undefined;   // Label object itself
                    this.__shift = 0;    // Inner properties to calculate y. Indicate relative shift.
                    this.__index = 0;     // Inner properties to calculate y. Indicate absolute index.
                }


                AttachableLabel.prototype.constructor = AttachableLabel;

                AttachableLabel.prototype.applyShift = function (shiftApplied) {
                    this.__shift = shiftApplied;
                    // Shift applied, now calculate the y
                    this.lRef.calcY = (this.y += shiftApplied * boxHeight);
                };

                AttachableLabel.prototype.applyDirectIndex = function (newIndex) {
                    this.__index = newIndex;
                    // Index changed along the sections of y axis. now calculate the y
                    this.lRef.calcY = (this.y = _top - (newIndex * boxHeight * -1));
                };

                /*
                 * An enum to determine whether the actions (shift / unoccupied position) is in the left side
                 * or right side.
                 * >----------------I----------------<
                 * I is the reference index from which the actions are calculated.
                 * Anypoint left to I is scale.NEG otherwise scale.POS
                 */
                try {
                    Object.defineProperty (scale, 'POS', {
                        enumerable : false,
                        configurable : false,
                        get : function () { return 1; }
                    });

                    Object.defineProperty (scale, 'NEG', {
                        enumerable : false,
                        configurable : false,
                        get : function () { return -1; }
                    });
                }catch (e) {
                    // For almighty IE8
                    scale.POS = 1;
                    scale.NEG = -1;
                }

                /*
                 * Get an array, whose value incrementing from 0 to n-1 for index 0, n-1
                 * @param: n { int} The number till which increment is needed
                 * @return: { Array} with value populated from 0 to n-1
                 */
                //Array.prototype.inc = function (n) {
                function inc (n) {
                    var counter = 0;
                    while (counter < n) {
                        this.push (counter++);
                    }
                    return this;
                }


                /*
                 * Calculates the position of nearest undefined (unoccupied) element.
                 * @param: pos { int} The position from where the reference to be calculated
                 * @return: { Object} { absValue: { int}, noScaleSide: { scale}}
                 */
                //Array.prototype.nearestUndefined = function (pos) {
                function nearestUndefined (pos) {
                    var i,
                        diff,
                        _scale,
                        nearest = {},
                        lowest = Number.POSITIVE_INFINITY;

                    for (i = 0; i < this.length; i++) {
                        diff = this[i] - pos;
                        diff < 0 ? (_scale = scale.NEG) : (_scale = scale.POS);
                        diff = abs (diff);

                        if (diff <= lowest) {
                            lowest = diff;
                            nearest.absValue = diff;
                            nearest.noScaleSide = _scale;
                        }
                    }

                    return nearest;
                }

                /*
                 * Keeps a matrix of lables plotted virtually alreday, (not actually in DOM) and
                 * controls the overlapping by shifting or suggesting indexes.
                 * This class when initialized, is itself an array containg the plotted labels.
                 * There is an holes array which is of same length and keeps track of the unoccupied position.
                 * These two are closely related and relate like
                 *  -------------------------
                 * |   |   | l1 |   |   | l2 |  Is the occupency matrix itself
                 *  -------------------------
                 *  ---------------
                 * | 0 | 1 | 3 | 4 | Would be the holes.
                 *  ---------------
                 * @param: count { int} - size of the matrix. Generally be the size of the sections
                 */
                function OccupancyMatrix (count) {
                    this.holes = inc.call ([], count);
                }

                OccupancyMatrix.prototype = Object.create (Array.prototype);
                OccupancyMatrix.prototype.constructor = OccupancyMatrix;

                /*
                 * Recalculate the state of unoccupied positions freshly.
                 * Removes the state before it was called
                 */
                OccupancyMatrix.prototype.repositionHoles = function () {
                    var i,
                        index = 0,
                        value;

                    this.holes.length = 0;
                    for (i = 0; i < this.length; i++) {
                        value = this[i];
                        !value && (this.holes[index++] = i);
                    }
                };


                /*
                 * Possition the labels and attach the shidt information along with calculeatedY on the labels.
                 * @param: value { int} - value of the labels, inthis case y position of the labels
                 * @param: index { int} - the section where it would fit normally, calculated based on his value only.
                 * @param: label { object} - the label object, which is to be attached. label.calcY is injected
                 *                          after calculating it correctly.
                 */
                OccupancyMatrix.prototype.attachShift = function (value, index, label) {
                    var indexVal,
                        length = this.length,
                        nearestUndefIndex,
                        tempArr,
                        attachedLabel,
                        _index,
                        calibratedIndex,
                        nearestOffset;

                    if (value === plotOut) {
                        // Plot outside if label is not visible
                        label.calcY = plotOut;
                        return;
                    }else {
                        calibratedIndex = (index > (length - 1)) ? length - 1 : index;  // If the plot value is too low
                        indexVal = this[calibratedIndex];
                    }
                    attachedLabel = new AttachableLabel (); // Create a new label which is attachable
                    attachedLabel.y = value;
                    attachedLabel.lRef = label;

                    if (!indexVal) {
                        // If the position is unoccupied, go ahead and occupy it
                        attachedLabel.applyDirectIndex (calibratedIndex);
                        this.splice (calibratedIndex, 1, attachedLabel);
                        this.holes.splice (this.holes.indexOf (calibratedIndex), 1); // Update the occupancy matrix.
                        return;
                    }

                    // If position is occupied, the label needs to be opsitioned down or up
                    nearestOffset = nearestUndefined.call (this.holes, calibratedIndex);
                    // Get the absolute nearest index
                    nearestUndefIndex = calibratedIndex + (nearestOffset.absValue * nearestOffset.noScaleSide);

                    if (nearestOffset.noScaleSide === scale.POS) {
                        // If labels to be attached down the y axis
                        attachedLabel.applyDirectIndex (nearestUndefIndex);
                        this.splice (nearestUndefIndex, 1, attachedLabel);
                        this.holes.splice (this.holes.indexOf (nearestUndefIndex), 1);
                        return nearestUndefIndex;
                    }

                    if (nearestOffset.noScaleSide === scale.NEG) {
                        // If the labels to be aattached is up the y axis we need the shift of sections and
                        // then put it down
                        tempArr = this.splice (nearestUndefIndex + 1, this.length - 1); // Section to be shifted
                        this.pop ();
                        tempArr.forEach (function (element) {
                            // Shift the system of attachable lable
                            element && (element.applyShift (-1));
                        });
                        [].push.apply (this, tempArr);
                        _index = nearestUndefIndex;
                        // Find the nearest  unoccupied position after shifting the index
                        while (true) {
                            if (!this[_index]) {
                                break;
                            }
                            _index++;
                        }
                        // This is an dummy insert for recalculation of holes since the whole system has changed.
                        this.push (0);
                        this.repositionHoles ();
                        // After recalculation get the nearest unoocupied position again since there might be better
                        // place to push the new label
                        nearestOffset = nearestUndefined.call (this.holes, _index);
                        _index += (nearestOffset.absValue * nearestOffset.noScaleSide);
                        attachedLabel.applyDirectIndex (_index);
                        // Add the label where it was suggested
                        this.splice (_index, 1, attachedLabel);
                        this.repositionHoles ();
                        return this.length - 1;
                    }
                };

                try {
                    Object.defineProperty (result, 'top', {
                        enumerable : false,
                        configurable : false,
                        get : function () { return _top; }
                    });

                    Object.defineProperty (result, 'bottom', {
                        enumerable : false,
                        configurable : false,
                        get : function () { return _bottom; }
                    });
                }catch (e) {
                    // IE-8
                    result.top = _top;
                    result.bottom = _bottom;
                }


                /*
                 * Initialize the limiting system
                 * @param height { int} - label height
                 * @param labelCount { int} - total no of labels
                 */
                result.init = function (height, labelCount) {
                    var i,
                        defaultValue = 0;

                    boxHeight = height + margin;
                    _top += (boxHeight / 2);
                    sections = floor (abs (_top) / boxHeight);

                    if (sections >= labelCount) {
                        isSpaceEnough = true;
                    }
                    oMatrix = new OccupancyMatrix (sections);
                    for (i = 0; i < sections ; i++) {
                        oMatrix.push (defaultValue);
                    }
                };

                /*
                 * Occupy one section in the vertical scale
                 * @param pos { int} - value from data config
                 * @param label { object} - label object
                 */
                result.occupy = function (pos, label) {
                    var passedSections = floor (abs (_top - pos) / boxHeight);
                    oMatrix && oMatrix.attachShift (pos, passedSections, label);
                };


                return result;

            }) ();
        if (labels) {
            // First set text so that we get correct value of boundingBox
            labels[0] && labels[0].attr ( {
                text: numberFormatter.yAxis ('0')
            });

            labels[0] && verticalLimits.init (labels[0].getBBox ().height, labels.length);

            labels.forEach (function (label, i) {
                var plot = plots[i],
                    value = plot.components.data[position] && plot.components.data[position].config.setValue,
                    labelYPos,
                    yAxis = plot.config.parentYAxis;
                if (value === undefined || !plot.visible ||
                    (yAxis ? (value > sYAxisMaxValue || value < sYAxisMinValue):
                        (value > pYAxisMaxValue || value < pYAxisMinValue))) {
                    labelYPos = plotOut;
                } else {
                    labelYPos = (yAxis ? (value - sYAxisMinValue) * spvr : (value - pYAxisMinValue) * ppvr ) ;
                }
                verticalLimits.occupy (labelYPos, label);
            });
        }


        labels && labels.forEach (function (label, i) {
            var plot = plots[i],
                GUTTER = 10,
                value = plot.components.data[position] && plot.components.data[position].config.setValue,
                bBox,
                labelWidth,
                halfLabelWidth,
                adjustedHalfLabelWidth,
                labelHeight,
                _xPos,
                _yPos,
                text = numberFormatter[plot.config.parentYAxis ? 'sYAxis' : 'yAxis'] (value);

            // Only defined and valid texts are shown on the labels.
            if (text) {
                label.attr({
                    text: text
                });

                // Now calculate boundingBox and label positions
                bBox = label.getBBox();
                labelWidth = bBox && bBox.width;
                halfLabelWidth = labelWidth && labelWidth * 0.5;
                adjustedHalfLabelWidth = halfLabelWidth && (halfLabelWidth + GUTTER);
                labelHeight = bBox && bBox.height;
                _yPos = label.calcY;
                _xPos = mathMax (0, mathMin (flooredX, visw));
                (_yPos !== UNDEFINED && _xPos !== UNDEFINED) && (label.attr ( {
                    x: _xPos,
                    y: _yPos,
                    'text-anchor': (x <= adjustedHalfLabelWidth) && 'start' ||
                        ((x + adjustedHalfLabelWidth) >= visw) && 'end' || 'middle',
                    'text-bound': ['rgba(255,255,255,0.8)', 'rgba(0,0,0,0.2)', 1, labelPadding]
                }));
            }
            else {
                // In case of undefined text labels, the label is transfered to out of visual. One way of hiding it.
                label.attr({
                    x: -visw
                });
            }

        });

        crossline.positionLabel && crossline.positionLabel.attr ( {
            x: x + crossline.left,
            text: crossline.getPositionLabel (position),
            'text-bound': ['rgba(255,255,255,1)', 'rgba(0,0,0,1)', 1, labelPadding]
        });
    };

    CrossLine.prototype.show = function () {
        if (!this.disabled) {
            this.hidden = false;
            this.group.attr ('visibility', 'visible');
            this.line.attr ('visibility', 'visible');
            this.positionLabel && this.positionLabel.attr ('visibility', 'visible');
        }
    };

    CrossLine.prototype.hide = function () {
        this.hidden = true;
        this.group.attr ('visibility', 'hidden');
        this.line.attr ('visibility', 'hidden');
        this.positionLabel && this.positionLabel.attr ('visibility', 'hidden');
    };

    CrossLine.prototype.dispose = function () {
        var crossline = this,
            key;

        // delete all the properties in crossline object
        for (key in crossline) {
            crossline.hasOwnProperty (key) && (delete crossline[key]);
        }
    };

    R.addSymbol ( {
        pinModeIcon: function (posx, posy, rad) {
            var x = posx,
                y = posy,
                r = rad,
                r1 = r * 0.5,
                r2 = r - r1,
                x1 = x - r,
                x2 = x + r,
                x3 = x - r1,
                x4 = x + r1,
                x5 = x - 0.5,
                x6 = x + 0.5,
                x7 = x6 + 1,
                x8 = x6 + 1.5,
                y1 = y - r,
                y2 = y + r1,
                y3 = y - r1,
                y4 = y + r2,
                y5 = y + r  + 0.5;

            return ['M', x1, y1, 'L', x3, y3, x3, y4, x1, y2, x5, y2, x, y5, x6,
                y2, x2, y2, x4, y4, x4, y3, x2, y1, x8, y1, x8, y3, x8, y4, x7,
                y4, x7, y3, x8, y3, x8, y1, 'Z'];
        },

        zoomOutIcon: function (x, y, radius) {

            var
            icoX = x - radius * 0.2,
            icoY = y - radius * 0.2,
            rad = radius * 0.8,
            startAngle = R.rad (43),
            endAngle = R.rad (48), // to prevent cos and sin of start and end from becoming equal on 360 arcs
            startX = icoX + rad * mathCos (startAngle),
            startY = icoY + rad * mathSin (startAngle),
            endX = icoX + rad * mathCos (endAngle),
            endY = icoY + rad * mathSin (endAngle),
            handleHeight = radius, // the height of the handle
            handAngle = R.rad (45),
            handX1 = startX + handleHeight * mathCos (handAngle),
            handY1 = startY + handleHeight * mathSin (handAngle),
            handX2 = endX + handleHeight * mathCos (handAngle),
            handY2 = endY + handleHeight * mathSin (handAngle),
            semiW = 2;

            return ['M', startX , startY,
                'A', rad, rad, 0, 1, 0, endX, endY, 'Z', 'M', startX + 1 , startY + 1 , 'L',
                handX1, handY1, handX2, handY2, endX + 1,
                endY + 1, 'Z', 'M', icoX - semiW, icoY, 'L', icoX + semiW,
                icoY, 'Z'];

        },

        resetIcon: function (x, y, radius) {
            var r = radius,
            startX = x - r, startY = y,
            endAngle = (math.PI / 2 + math.PI) / 2,
            endX = x + r * mathCos (endAngle),
            endY = y + r * mathSin (endAngle),
            arrowLength = r * 2 / 3,

            paths = ['M', startX, startY, 'A',
                r, r, 0, 1, 1, endX, endY, 'L', endX + arrowLength,
                endY - 1, endX + 2, endY + arrowLength - 0.5, endX, endY];

            return paths;
        }
    });

}]);



if (windowExists) {
    _window.FusionCharts = FusionCharts;
}
return FusionCharts;
}));
