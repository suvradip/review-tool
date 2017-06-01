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


/**
 * @private
 *
 * @module fusioncharts.renderer.javascript.js-component-toolbox
 */
FusionCharts.register('module', ['private', 'modules.renderer.timeseries-toolbox', function () {
    var global = this,
        win = global.window,
        lib = global.hcLib,
        math = win.Math,
        mathMax = math.max,
        R = lib.Raphael,
        doc = win.document,
        graphics = lib.graphics,
        convertColor = graphics.convertColor,
        getLightColor = graphics.getLightColor,
        rawRGBtoHEX = graphics.rawRGBtoHEX,
        rSymbolFns = {},
        SymbolStore,
        EMPTY_FN = function () {},
        PXSTR = 'px',
        DIV = 'div',
        CLICK = 'click',
        HOVER = 'hover',
        DEFAULT_TIMEOUT = 150,
        // SVGRectElement = win.SVGRectElement,
        TEXTBOX_SYMBOL = 'Internal_CB',
        TRANSPARENT_FILL = convertColor('FFFFFF', 0),
        COLOR_WHITE = '#FFFFFF',
        COLOR_E3E3E3 = '#E3E3E3',
        COLOR_C2C2C2 = '#C2C2C2',
        COLOR_EFEFEF = '#EFEFEF',
        STR_DEF = 'default',
        toolBoxComponents,
        defTextStyle;

    function isDIV (ele) {
        if (ele && ele.nodeName && ele.nodeName.toUpperCase() === 'DIV') {
            return true;
        }

        return false;
    }

    function normalizeTarget (target, evt) {
        var clientRect;

        if (target.getBBox) {
            return target;
        }

        clientRect = target.getBoundingClientRect();
        target.getBBox = function () {
            return {
                x: evt.x,
                y: evt.y,
                width: clientRect.right - clientRect.left,
                height: clientRect.bottom - clientRect.top,
                isArtificial: true
            };
        };

        return target;
    }

    function mergeConf (source, sink, theirsMergeEnabled) {
        var key, sourceVal;

        for (key in source) {
            sourceVal = source[key];

            if (sourceVal === undefined || sourceVal === null) { continue; }

            if (theirsMergeEnabled) {
                if (sink[key]) { continue; }
                sink[key] = sourceVal;
            } else {
                if (typeof sourceVal === 'object') {
                    mergeConf(sourceVal, sink[key], theirsMergeEnabled);
                }
                else {
                    sink[key] = sourceVal;
                }
            }
        }
    }

    function getEventHandlersFor (eventName, node) {
        switch (eventName) {
            case 'click':
                return  function (mouseClickFn) {
                    lib.dem.listen(node, 'click', function (e) {
                        (e.target && e.target.parentNode) && mouseClickFn.call(e.target);
                    });
                };

            case 'hover':
                return function (mouseOverFn, mouseOutFn) {
                    lib.dem.listen(node, 'pointerhover', function (e) {
                        (e.target && e.target.parentNode) && (e.state === 'start' ?
                            mouseOverFn : mouseOutFn).call(e.target);
                    });
                };
        }
    }

    // Readymade symbol functions for internal use
    rSymbolFns.CB_NOT_CHECKED = function (posx, posy, rad) {
        var x = posx,
            y = posy,
            r = rad,
            x0 = x - r,
            y0 = y - r;

        return ['M', x0, y0];
    };

    rSymbolFns.CB_CHECKED = function (posx, posy, rad) {
        var x = posx,
            y = posy,
            r = rad,
            rq = r / 4,
            rtq = 3 * rq,
            x0 = x - rtq,
            y0 = y,
            x1 = x - rq,
            y1 = y + r,
            x2 = x + r,
            y2 = y - r;

        return ['M', x0, y0, 'L', x1, y1, x2, y2];
    };

    /**
     * Global symbolStore to store all the symbols and their definitions.
     * If a symbol is re-registered, it will be overridden.
     */
    SymbolStore = (function (){

        // Default symbols for checkbox. Just the box outside
        R.addSymbol(TEXTBOX_SYMBOL, rSymbolFns.CB_NOT_CHECKED);


        var store = {
            /**
             * Registers individual or group of icons.
             */
            register : function () {
                var symbolName, symbolDrawingFn, symbolRegObj, itrObj;

                if(arguments.length === 1) {
                    // Only one argument is given, possibility is that the whole object is passed. This object contains
                    // all the symbol definiation and drawing function
                    symbolRegObj = arguments[0];

                    if (!(symbolRegObj != null && typeof symbolRegObj === 'object')) {
                        // If no object is passed, return silently.
                        return;
                    }

                    // Adds a iterator pointer to the object
                    itrObj = symbolRegObj;
                } else if (arguments.length > 1) {
                    // If two or more parameters are passed, take those (or the first two) and assume that individual
                    // symbol has been sent to register.
                    symbolName = arguments[0];
                    symbolDrawingFn = arguments[1];

                    if (typeof symbolName !== 'string' || typeof symbolDrawingFn !== 'function') {
                        // symbolName is not given in string format or the symbol function has noot ben provided
                        // return silently
                        return;
                    }

                    // Prepare a object for iteration
                    itrObj = {};
                    itrObj[symbolName] = symbolDrawingFn;
                } else {
                    return;
                }

                for (symbolName in itrObj) {
                    symbolDrawingFn = itrObj[symbolName];

                    if (!({}).hasOwnProperty.call(itrObj, symbolName)) {
                        // If its a symbol in the prototype chain, ignore it as redefinition might happen, which is
                        // not expected
                        continue;
                    }

                    // Sent it to raphael for registration
                    R.addSymbol(symbolName, symbolDrawingFn);
                }
            }
        };

        return store;

    })();


    defTextStyle = {
        'fontFamily': 'Verdana Sans',
        'fontSize': '14px',
        fill: undefined,
        'fontStyle': 'normal',
        'fontWeight' : 'normal'
    };

    function AtomicList (options) {
        options = options || {};

        this.name = options.name;
        this.handler = options.handler || EMPTY_FN;
        this.action = (options.action && options.action.toLowerCase()) || CLICK,
        this.eventMap = {};

        this.style = {
            padding : '3px 8px',
            margin: '2px 2px 2px 2px'
        };

        this.hoverOverStyle = options.hoverOverStyle || {};
        this.hoverOutStyle = options.hoverOutStyle || {};


        this.args = options.args;

        mergeConf(options.style || {}, this.style);
        this.subConRef = undefined;
        this.node = undefined;
    }

    AtomicList.prototype.updateName = function (name) {
        this.name = name;
        this.node && (this.node.innerHTML = name);
    };

    AtomicList.prototype.assignSubContainer = function (container) {
        if (!(container instanceof ListContainer)) {
            return;
        }
        this.subConRef = container;
    };

    AtomicList.prototype.stickIntoContainer = function (container, listContainerInstance) {
        var node = this.node = doc.createElement(DIV),
            style = this.style,
            name,
            nodeStyle,
            hoverEvtListeners,
            clickEvtListeners,
            fn,
            self = this,
            args = self.args;

        node && (node.ishot = true);
        if (this.handler) {
            this.eventMap[this.action] = this.handler;
        }

        container.appendChild(node);

        node.innerHTML = this.name;

        nodeStyle = node.style;
        for (name in style) {
            nodeStyle[name] = style[name];
        }

        if (this.interactivity !== false) {
            hoverEvtListeners = getEventHandlersFor(HOVER, node);
            clickEvtListeners = getEventHandlersFor(CLICK, node);

            clickEvtListeners(function () {
                if (self.handler){
                    fn = self.eventMap[CLICK];
                    fn && fn.apply(self, args);
                    listContainerInstance.hide();
                }
            });

            hoverEvtListeners(function () {
                var key, elemStyle = node.style,
                    hoverStyle = self.hoverOverStyle;

                if (self.selected !== true) {
                    for (key in hoverStyle) {
                        elemStyle[key] = hoverStyle[key];
                    }
                }

                if (self.subConRef) {self.subConRef.show(this);}

            }, function () {
                var key, elemStyle = node.style,
                    hoverStyle = self.hoverOutStyle;

                if (self.selected !== true) {
                    for (key in hoverStyle) {
                        elemStyle[key] = hoverStyle[key];
                    }
                }

                if (self.subConRef) {self.subConRef.hide(DEFAULT_TIMEOUT, this);}

            });
        }

    };

    AtomicList.prototype.setStyle = function (styleObj) {
        mergeConf(styleObj || {}, this.style);
        mergeConf({
            color: styleObj.color
        }, this.hoverOutStyle);
    };

    AtomicList.prototype.applyStyles = function (style) {
        var node = this.node,
            nodeStyle = node.style,
            name;

        for (name in style) {
            nodeStyle[name] = style[name];
        }
    };

    AtomicList.prototype.resetStyle = function () {
        var node = this.node,
            nodeStyle = node.style,
            style = this.hoverOutStyle,
            name;

        for (name in style) {
            nodeStyle[name] = style[name];
        }
    };


    AtomicList.prototype.dispose = function () {
        var node = this.node;

        if (node) {
            node.remove && node.remove();
        }

        this.node = undefined;
    };

    function ListContainer (containerNode, measurement, dependencies, config) {
        var self = this,
            conStyle,
            styleKey,
            top = measurement && measurement.top || 0,
            left = measurement && measurement.left,
            right = measurement && measurement.right,
            chartContainer = dependencies.chartContainer,
            hoverEvtListeners,
            contConfig,
            textStyle = config.text || {},
            containerStyle = config.container || {},
            hoverStyle = config.hoverStyle || {};

        this.container = containerNode;
        this.dependencies = dependencies;
        this.position = ListContainer.POSITION_BOTTOM;
        this.atomicLists = [];
        this.refContainers = [];
        this.parentListCon = undefined;
        this.hideFnIds = [];
        this.target = undefined;
        contConfig = this.config = config;

        if (!(left && right)) {
            this.positionCalculation = true;
        }

        this.hoverOverStyle = {
            background : hoverStyle.background || '#E7DDDD',
            color : hoverStyle.color || '#000000',
            cursor : 'pointer'
        };

        this.hoverOutStyle = {
            background : '#FFFFFF',
            color : '#000000'
        };

        this.setHoverStyle(contConfig.style);

        this._defaultStyle = {
            position : 'absolute',
            'z-index' : 999999,
            top : top === undefined ? 'auto' : top + PXSTR,
            right: right === undefined ? 'auto' : right + PXSTR,
            left : left === undefined ? 'auto' : left + PXSTR,
            overflow : 'wrap',
            background : containerStyle.backgroundColor || '#ffffff',
            'border-width': '1px',
            borderColor: containerStyle.borderColor || '#000000',
            'border-style': 'solid',
            'box-shadow': '#999999 2px 2px 5px',
            fontFamily: textStyle.fontFamily || 'sans-serif',
            fontSize: textStyle.fontSize || '14px',
            opacity: containerStyle.opacity || '1',
            color: textStyle.color || '#000000',
            display : 'none'
        };

        conStyle = this.container.style;

        for (styleKey in this._defaultStyle) {
            conStyle[styleKey] = this._defaultStyle[styleKey];
        }

        chartContainer && chartContainer.appendChild(this.container);

        hoverEvtListeners = getEventHandlersFor('hover', this.container);

        hoverEvtListeners(function () {
            self.show(this);
        }, function () {
            self.hide(DEFAULT_TIMEOUT, this);
        });
    }

    ListContainer.prototype.setHoverStyle = function (style) {
        if (!style) {
            return;
        }
        var hoverOver = style.hoverOver,
            hoverOut = style.hoverOut;

        mergeConf(hoverOver, this.hoverOverStyle);
        mergeConf(hoverOut, this.hoverOutStyle);
    };

    ListContainer.prototype.setStyle = function (style) {
        var container = this.container,
            conStyle,
            key;

        conStyle = container.style;

        for (key in style) {
            conStyle[key] = style[key];
        }
    };

    ListContainer.prototype.setDefaultStyle = function (defaultStyle) {
        // debugger;
        mergeConf(defaultStyle, this._defaultStyle);
        mergeConf(defaultStyle, this.hoverOutStyle);
        this.setStyle(this._defaultStyle);
    };

    ListContainer.prototype.setSelectedStyle = function (style) {
        if (!this.selectedStyle) {
            this.selectedStyle = {};
        }

        mergeConf(style, this.selectedStyle);
    };

    ListContainer.prototype.setSelectedItem = function (atomicList) {
        var atomicLists = this.atomicLists,
            i,
            ln;

        this.selectedItem = atomicList;
        atomicList.selected = true;

        for (i = 0, ln = atomicLists.length; i < ln; i++) {
            if (atomicLists[i] !== atomicList) {
                atomicLists[i].selected = false;
                atomicLists[i].resetStyle();
            }
        }

        atomicList.applyStyles(this.selectedStyle);
    };

    ListContainer.POSITION_TOP = 'top';
    ListContainer.POSITION_BOTTOM = 'bottom';


    ListContainer.prototype.addAtomicListItem = function (item) {
        if (!(item instanceof AtomicList)) {
            return;
        }

        this.atomicLists.push(item);
        item.stickIntoContainer(this.container, this);
    };

    ListContainer.prototype.show = function (target) {
        var idArr = this.hideFnIds,
            chart = this.dependencies.chart,
            refWidth = chart.width,
            positionCalculation = this.positionCalculation,
            config = this.config,
            diffScale = config.diffScale,
            borderWidth = config.borderWidth || 0,
            index = 0,
            length,
            parentContainer,
            listWidth,
            bBox;

        this.target = this.target || target;
        this.visible = true;
        for (length = idArr.length; index < length; index++) {
            clearTimeout(idArr[index]);
        }

        idArr.length = 0;

        if (this.atomicLists.length === 0) {
            this.container.style.display = 'none';
            return;
        }

        parentContainer = this.parentListCon;
        if (parentContainer) {
            this.container.style.display = 'block';
            parentContainer.show(this.target);
            if (this.config.position !== 'right') {
                this.container.style.left = (parentContainer.container.offsetLeft +
                    parentContainer.container.offsetWidth) + PXSTR;
            }
            else {
                this.container.style.left = (parentContainer.container.offsetLeft -
                    this.container.offsetWidth) + PXSTR;
            }
            this.container.style.top = (parentContainer.container.offsetTop + this.target.offsetTop) + PXSTR;
        // } else if (target instanceof SVGRectElement) {
        } else if (!isDIV(target) && target.getBBox) {
            bBox = target.getBBox();

            if (positionCalculation) {
                // Show the container so that the width can be retrieved.
                this.container.style.display = 'block';
                listWidth = this.container.offsetWidth;
                if (listWidth + bBox.x > refWidth) {
                    this.container.style.left = 'auto';
                    this.container.style.right = (refWidth - bBox.x - bBox.width) + PXSTR;
                } else {
                    if (this.config.position !== 'right') {
                        this.container.style.left = (bBox.x - borderWidth / 2) + PXSTR;
                        this.container.style.right = 'auto';
                    }
                    else {
                        this.container.style.left = (bBox.x + bBox.width -
                            this.container.offsetWidth - borderWidth / 2) + PXSTR;
                        this.container.style.right = 'auto';
                    }
                }

                // When all the calculations are done, hides it
                this.container.style.display = 'none';
            }


            if (this.position === SymbolWithContext.POSITION_BOTTOM) {
                diffScale = diffScale === undefined ? bBox.isArtificial ? 0.5 : 1.5 : diffScale;
                this.container.style.top = (bBox.y + bBox.height * diffScale + borderWidth / 2) + PXSTR;
                this.container.style.bottom = 'auto';
            } else {
                this.container.style.bottom = (chart.height - bBox.y) +
                    PXSTR;
                this.container.style.top = 'auto';
            }
            this.container.style['min-width'] = bBox.width - borderWidth + 'px';

        }


        this.container.style.display = 'block';
    };

    ListContainer.prototype.hide = function (timeout) {
        var con = this.container,
        parentContainer;
        this.visible = false;
        parentContainer = this.parentListCon;

        if (parentContainer) {
            parentContainer.hide(DEFAULT_TIMEOUT);
        }

        this.hideFnIds.push(setTimeout(function () {
            con.style.display = 'none';
        }, timeout));
    };

    ListContainer.prototype.dispose = function () {
        var atomicLists = this.atomicLists,
            refContainers = this.refContainers,
            index, length;

        this.hideFnIds.length = 0;

        for (index = 0, length = atomicLists.length; index < length; index++) {
            atomicLists[index].dispose();
        }

        atomicLists.length = 0;

        for (index = 0, length = refContainers.length; index < length; index++) {
            refContainers[index].dispose();
        }

        refContainers.length = 0;
    };

    function ListContainerManager (measurement, config) {
        this.container = undefined;
        this.listContainer = undefined;
        this.measurement = measurement;
        this.config = config || {};
    }

    ListContainer.prototype.setConfig = function (config) {
        mergeConf(config, this.config);
    };

    ListContainerManager.prototype.init = function (dependencies) {
        var container;

        this.dependencies = dependencies;

        if (!this.container) {
            container = doc.createElement('div');
            container && (container.innerHTML = '');
            this.container = new ListContainer(container, this.measurement, dependencies, this.config);
        }
        return this;
    };

    ListContainerManager.prototype.getFirstContainer = function () {
        return this.container;
    };

    ListContainerManager.prototype.appendAsList = function (rawDS, refTo) {
        var self = this,
            con,
            hoverOverStyle = this.container.hoverOverStyle,
            hoverOutStyle = this.container.hoverOutStyle;

        (function recursiveParser (items, fCon) {
            var listItems, index = 0, length, thisItem,
                atomicList, key, value, handler, container, refContainer;

            container = fCon ? fCon : self.container;

            if (items instanceof Array) {
                listItems = items;
            } else {
                listItems = [items];
            }

            for (length = listItems.length; index < length; index++) {
                thisItem = listItems[index];
                atomicList = new AtomicList({
                    'hoverOverStyle' : hoverOverStyle,
                    'hoverOutStyle' : hoverOutStyle
                });
                for (key in thisItem) {
                    atomicList.name = key;
                    value = thisItem[key];

                    atomicList.interactivity = !!value.handler;

                    atomicList.action = value.action;
                    atomicList.setStyle(value.style);
                    atomicList.args = value.args;
                    if (key.search(/^<[^<]+>$/) !== -1) {
                        atomicList.hoverOverStyle = {};
                        atomicList.hoverOutStyle = {};
                        value.handler = EMPTY_FN;
                    }

                    handler = value.handler;

                    if (handler && typeof handler !== 'function') {
                        refContainer = recursiveParser(
                            handler,
                            new ListContainer(doc.createElement(DIV), self.measurement, self.dependencies,
                                self.config));
                    } else {
                        atomicList.handler = value.handler;
                    }

                }
                container.addAtomicListItem(atomicList);
                if (refContainer) {
                    refContainer.parentListCon = container;
                    container.refContainers.push(refContainer);
                    atomicList.assignSubContainer(refContainer);
                }

                refContainer = undefined;
            }

            return (con = container);
        })(rawDS, refTo);

        return con;
    };

    ListContainerManager.prototype.dispose = function () {
        this.container.dispose();
        this.container = undefined;
    };

    /**
     * Constructor for creating an instance of symbol
     * @namespace FusionCharts.Symbol
     * @constructor
     * @param {String} componentName - name of the component
     * @param {boolean} isPlainText - Whether the symbol is plain text
     * @param {Object} config - configuration object of symbol
     * @param {Object} dependencies - Dependencies to create a symbol
     * @param {Object} dependencies.paper - raphael element
     * @param {Object} dependencies.smartLabel - smart Label instance
     * @param {Object} dependencies.chartContainer - chart container element
     * @param {Object} dependencies.chart - chart object
     * @param {Object} config - configuration object of symbol
     * @param {string} config.hoverFill - fill color of symbol when hovered
     * @param {string} config.labelFill - fill of label when hovered
     * @param {string} config.width - width of symbol
     * @param {string} config.height - height of symbol
     * @param {string} config.stroke - stroke color of the symbol
     * @param {string} config.strokeWidth - stroke width of the symbol
     * @param {object} config.margin - margin properties of the symbol
     * @param {number} config.margin.top - top margin of the symbol
     * @param {number} config.margin.bottom - bottom margin of the symbol
     * @param {number} config.margin.right - right margin of the symbol
     * @param {number} config.margin.left - left margin of the symbol
     * @param {object} config.btnTextStyle - text style of button
     * @param {string} config.btnTextStyle.fontFamily - font family of button text
     * @param {string} config.btnTextStyle.fontSize - font size of button text
     * @example
     * // Example for creating a text button
     * var button =  new Symbol('Reset', true, dependencies, {
     *      fill: '#525252' // Fill color of the button,
     *      labelFill: '#ffffff' // Fill color of label
     * };
     *
     */

    function Symbol (componentName, isPlaintext, dependencies, config) {
        var symbolConfig,
            fill,
            hoverFill,
            labelFill,
            stroke,
            symbolStroke;

        this.symbol = componentName;
        this.svgElems = {};
        this.isPlaintext = isPlaintext;
        symbolConfig = this.config = this.getDefaultConfig();

        config && this.setConfig(config);

        symbolConfig = this.config;

        fill = symbolConfig.fill;
        stroke = symbolConfig.stroke;
        hoverFill = symbolConfig.hoverFill;
        labelFill = symbolConfig.labelFill;
        symbolStroke = symbolConfig.symbolStroke;

        this.stateConfig = {
            disabled:{
                config: {
                    hover: {
                        fill:  hoverFill,
                        'stroke-width': 1,
                        stroke: COLOR_E3E3E3,
                        cursor: STR_DEF
                    },
                    normal: {
                        fill:  fill,
                        stroke: COLOR_E3E3E3,
                        'stroke-width': 1,
                        cursor: STR_DEF
                    },
                    disabled: {
                        fill: '#ff0000',
                        'stroke-width': 2,
                        stroke: '#000000',
                        'stroke-opacity': 1,
                        cursor: STR_DEF
                    },
                    pressed: {
                        fill: '#ff0000',
                        'stroke-width': 1,
                        stroke: COLOR_E3E3E3,
                        cursor: STR_DEF
                    }
                },
                'button-disabled': true,
                'stroke': '#000000',
                'stroke-opacity': 1
            },
            enabled: {
                config: {
                    hover: {
                        fill: hoverFill,
                        'stroke-width': symbolConfig.hoverStrokeWidth,
                        stroke: symbolConfig.hoverStroke,
                        cursor: 'pointer'
                    },
                    normal: {
                        fill: fill,
                        'stroke-width': symbolConfig.strokeWidth,
                        stroke: symbolConfig.stroke,
                        cursor: 'pointer',
                        symbol: {
                            'stroke-width': symbolConfig.symbolStrokeWidth,
                            stroke: symbolStroke
                        }
                    },
                    disabled: {
                        fill: COLOR_WHITE,
                        'stroke-width': 1,
                        stroke: COLOR_E3E3E3,
                        'stroke-opacity': 1,
                        cursor: 'pointer'
                    },
                    pressed: {}
                },
                'button-disabled': false,
                fill: [fill, labelFill, COLOR_WHITE || symbolStroke, COLOR_WHITE, true],
                'stroke': [stroke, symbolStroke],
                'stroke-opacity': 1,
                'stroke-width': symbolConfig.strokeWidth
            },
            pressed: {
                config: {
                    hover: {
                        fill:  hoverFill,
                        'stroke-width': 1,
                        stroke: '#aaaaaa',
                        cursor: 'pointer'
                    },
                    normal: {
                        fill: COLOR_EFEFEF,
                        stroke: COLOR_C2C2C2,
                        'stroke-width': 1,
                        cursor: 'pointer'
                    },
                    disabled: {
                        fill: COLOR_EFEFEF,
                        'stroke-width': 1,
                        stroke: COLOR_E3E3E3,
                        'stroke-opacity': 1,
                        cursor: 'pointer'
                    },
                    pressed: {
                        fill: COLOR_EFEFEF,
                        'stroke-width': 1,
                        stroke: COLOR_C2C2C2,
                        cursor: 'pointer'
                    }
                },
                fill: [COLOR_EFEFEF, labelFill,COLOR_EFEFEF,COLOR_EFEFEF,true],
                'stroke': COLOR_C2C2C2
            }
        };
        config.customConfig && mergeConf(this.stateConfig, config.customConfig);
        this.evt = {
            tooltext : undefined,
            click : EMPTY_FN,
            hover : [EMPTY_FN, EMPTY_FN]
        };

        this.dependencies = dependencies;
        this._state = false;
    }

    Symbol.prototype.getDefaultConfig = function () {
        return {
            btnTextStyle: {
                'stroke-width': '1px',
                'stroke' : 'none',
                'fontFamily': 'Lucida Grande',
                'fontSize': 12
            },
            textPadding: 10,
            fill: 'rgba(255,255,255,1)',
            hAlign: 'r',
            hDirection: -1,
            hMargin: 10,
            labelFill: '#000000',
            hoverFill: '#ffffff',
            position: 'tr',
            radius: 0,
            scale: 1.15,
            spaceNotHardCoded: true,
            spacing: 10,
            stroke: 'rgba(187,187,187,1)',
            strokeWidth: 2,
            symbolFill: 'rgba(255,255,255,1)',
            symbolHPadding: 5,
            symbolPadding: 30,
            symbolStroke: '#7f7f7f',
            symbolVPadding: 20,
            vAlign: 't',
            vDirection: 1,
            vMargin: 6,
            margin: {
                top: 0,
                bottom: 3,
                right: 10,
                left: 0
            }
        };
    };

    Symbol.prototype.getParentGroup = function (instance) {
        if (instance) {
            this._parentGroup = instance;
        }
        return this._parentGroup;
    };

    Symbol.prototype.attr = function (attrObj) {
        return this.svgElems.node && this.svgElems.node.attr(attrObj);
    };

    Symbol.prototype.registerSymbol = function (fn) {
        SymbolStore.register(this.symbol, fn);
    };

    /**
     * Function to get the logical space of the symbol component
     * Returns the width and height of the symbol
     */
    Symbol.prototype.getLogicalSpace = function () {
        var dependencies = this.dependencies,
            smartLabel = dependencies.smartLabel,
            config = this.config,
            btnTextStyle = config.btnTextStyle,
            textDim;

        if (this.isPlaintext) {
            smartLabel.useEllipsesOnOverflow(1);
            smartLabel.setStyle(btnTextStyle);
            textDim = smartLabel.getOriSize(this.symbol);
            config.width = config.width === undefined ?
                Math.max(textDim.width + config.textPadding, config.width || 0) : config.width;
            config.height = config.height === undefined ?
                Math.max(textDim.height + config.textPadding, config.height || 0) : config.height;
        }

        return {
            width: config.width,
            height: config.height
        };
    };

    Symbol.prototype.show = function () {
        var node = this.svgElems.node;
        if (node) {
            node.css({
                display: 'block'
            });
        }
    };

    Symbol.prototype.hide = function () {
        var node = this.svgElems.node;
        if (node) {
            node.css({
                display: 'none'
            });
        }
    };

    Symbol.prototype.draw = function (x, y, parentGroup) {
        var elem,
            btnConfig = this.config || {},
            symbol,
            text,
            dependencies = this.dependencies,
            animationObj = dependencies.animationObj || {},
            animObj = animationObj.animObj,
            dummyObj = animationObj.dummyObj,
            paper = dependencies.paper,
            animationDuration = animationObj.duration,
            svgElems = this.svgElems;

        if (this.isPlaintext) {
            text = this.symbol;
        } else {
            symbol = this.symbol;
        }

        if (!btnConfig.hoverFill) {
            btnConfig.hoverFill = convertColor(getLightColor(rawRGBtoHEX(btnConfig.fill), 80));
        } else {
            btnConfig.hoverFill = convertColor(btnConfig.hoverFill);
        }

        elem = svgElems.node;

        if (!elem) {
            elem = svgElems.node = paper.button(x, y, text, symbol, {
                width: btnConfig.width,
                height: btnConfig.height,
                r: btnConfig.radius,
                verticalPadding: btnConfig.symbolHPadding * btnConfig.scale,
                horizontalPadding: btnConfig.symbolHPadding
            }, parentGroup);
        }
        else {
            elem.attr({
                x: x,
                y: y,
                width: btnConfig.width,
                height: btnConfig.height,
                text: text,
                r: btnConfig.radius,
                verticalPadding: btnConfig.symbolHPadding * btnConfig.scale,
                horizontalPadding: btnConfig.symbolHPadding
            });
        }

        elem.labelcss(this.config.btnTextStyle);

        elem.attr({
            ishot : true,
            fill : [btnConfig.fill, btnConfig.labelFill, btnConfig.symbolFill, btnConfig.hoverFill, true],
            stroke : [btnConfig.stroke, btnConfig.symbolStroke],
            'stroke-width' : [btnConfig.strokeWidth, btnConfig.symbolStrokeWidth]
        })
        .tooltip(this.evt.tooltext)
        .buttonclick(this.evt.click)
        .hover(this.evt.hover[0], this.evt.hover[1]);

        elem.unclick();

        elem.animateWith(dummyObj, animObj, {
            'button-repaint': [x, y, btnConfig.width, btnConfig.height, btnConfig.radius]
        }, animationDuration, animationObj.animType);

        elem
            .attr({
                'button-label': text,
                'button-padding': [btnConfig.symbolHPadding, btnConfig.symbolHPadding * btnConfig.scale]
            });
        elem.buttonclick(this.evt.click);

        elem.getBBox = function () {
            return {
                x: x,
                y: y,
                width: btnConfig.width,
                height: btnConfig.height
            };
        };

        this.attr(this.stateConfig.enabled);

        return elem;
    };

    Symbol.prototype.dispose = function () {
        var node = this.svgElems.node;

        if (node) {
            node.remove();
        }

        this.svgElems.node = undefined;
    };

    global.extend(Symbol.prototype, /** @lends FusionCharts.Symbol */ {
        /**
         * Function for setting configuration of a symbol
         * @param {Object} config - configuration of symbol
         */
        setConfig: function (config) {
            // this.config = config;
            if (!this.config) {
                this.config = config;
            } else {
                mergeConf(config, this.config);
            }
        },

        /**
         * Gets the configuration
         * @param {string} key - configuration key
         */
        getConfig: function (key) {
            return this.config[key];
        },
        /**
         * Function to attach event handlers to a symbol
         * @param {Object} eventMap - event handlers with respect to corresponding event name
         * @param {Object} hooks -  callback functions to execute
         * @example
         * // Example for attaching event handlers
         * var symbol = new Symbol ('ContextIcon', 'Reset', dependencies);
         * symbol.attachEventHandlers({
         *      click: function () {
         *          this._parentGroup.setState(this);
         *      }
         *  });
         */
        attachEventHandlers: function (eventMap, hooks) {
            var evt = this.evt,
                toolText = eventMap.tooltext,
                clickFn = eventMap.click || EMPTY_FN,
                HoverFn = eventMap.hover,
                clickHook = hooks && hooks.click || EMPTY_FN,
                managedClickFn,
                self = this;

            if (typeof clickFn === 'function') {
                managedClickFn = function () {
                    clickHook.apply(self, arguments);
                    clickFn.apply(self, arguments);
                };
            } else {
                managedClickFn = function () {
                    var oriFn = clickFn.fn,
                        context = clickFn.context,
                        args = (clickFn.args || []).slice(0);

                    if (clickFn.hasOwnProperty('context')) {
                        args.push(self);
                    } else {
                        context = self;
                    }

                    [].push.apply(args, arguments);
                    clickHook();
                    oriFn.apply(context, args);
                };
            }

            if (toolText) { evt.tooltext = toolText; }
            evt.click = managedClickFn;

            if (HoverFn && HoverFn instanceof Array) { evt.hover = HoverFn; }

            if (this.node) {
                this.node
                    .tooltip(this.evt.tooltext)
                    .buttonclick(this.evt.click)
                    .hover(this.evt.hover[0], this.evt.hover[1]);
            }

            eventMap.textOnBlur && (evt.textOnBlur = eventMap.textOnBlur);
            eventMap.textOnChange && (evt.textOnChange = eventMap.textOnChange);

            return self;
        },

        setStyle: function (styleObj) {
            var defaultStyle = styleObj.default,
                hoveredStyle = styleObj.hover,
                defaultContainerStyle = defaultStyle.container,
                defaultTextStyle = defaultStyle.text,
                hoveredContainerStyle = hoveredStyle.container,
                config = this.config;

            if (defaultContainerStyle) {
                config.fill = defaultContainerStyle.fill;
                config.stroke = defaultContainerStyle.stroke;
                config.strokeWidth = defaultContainerStyle['stroke-width'];
            }

            if (hoveredContainerStyle) {
                config.hoverFill = hoveredContainerStyle.fill;
            }

            if (defaultTextStyle) {
                config.labelFill = defaultTextStyle.fill;
            }
        },

        getDefaultTextStyle: function () {
            var config = this;

            return  {
                fill: config.labelFill,
                'font-family': config.btnTextStyle.fontFamily,
                'font-weight': config.btnTextStyle.fontWeight,
                'font-style': config.btnTextStyle.fontStyle
            };

        },

        getDefaultContainerStyle: function () {
            var config = this;

            return {
                fill: config.fill,
                stroke: config.stroke,
                'stroke-width': config['stroke-width']
            };
        },
        /**
         * Get bound element of button
         */
        getBoundElement: function () {
            return this.svgElems.node._.button.bound;
        },

        /**
         * Updates the visual of the button depending upon the state
         * @param {string} mode - enable, disable or pressed mode
         * Depending upon the mode the button visual will be changed
         */
        updateVisual: function (mode) {
            var stateConfig = this.stateConfig,
                arrow = this.svgElems.arrow;

            if (arrow) {
                if (mode === 'enabled') {
                    arrow.attr('opacity', '1');
                } else if (mode === 'disabled') {
                    arrow.attr('opacity', '0.3');
                }
            }
            this.attr(stateConfig[mode]);
            this.attr({
                update: mode
            });
        },

        /**
         * Sets the state configuration
         * @param {object} config - state configuration
         * @param {object} config.pressed - pressed state configuration
         * @param {array} config.pressed.fill - fill configuration of button when pressed [fill, labelFill, symbolFill,
         * hoverFill, disableGradient]
         * @param {object} config.disable - disabled state configuration
         * @param {object} config.enable - enabled state configuration
         */
        setStateConfig: function (config) {
            mergeConf(config, this.stateConfig);
        },

        /**
         * Gets the state configuration
         */
        getStateConfig: function () {
            return this.stateConfig;
        },

        /**
         * Sets the state of the button
         * @param {boolean} isPressed - change the state to pressed
         */
        setState: function (isPressed) {
            // check the current state for the button.
            // if its different update the visual.
            if (isPressed !== undefined) {
                if (isPressed !== this._state) {
                    this.updateVisual((this._state = isPressed) ? 'pressed' : 'enabled');
                }
            }
            return this;
        }
    });

    /**
     * Constructor for creating input text box symbol
     * @namespace FusionCharts.InputTextBoxSymbol
     * @constructor
     * @augments Symbol {@link FusionCharts.Symbol}
     * @param {Object} dimensions - width and height of symbol
     * @param {Object} dependencies - dependencies needed to create an input box
     * @param {Object} config - configuration object of Input box
     */

    function InputTextBoxSymbol (dimensions, dependencies, config) {
        Symbol.call(this, TEXTBOX_SYMBOL, false, dependencies, config);
        dimensions = dimensions || {};

        this.setConfig({
            width: dimensions.width || 100,
            height: dimensions.height || 30
        });

        this.symbol = 'textBoxIcon';

        // this.text = {
        //     // plaintext: text,
        //     node: undefined,
        //     style: defTextStyle
        // };

        this.interPadding = 3;
        this.hasTextBox = true;
        this.hasLabel = true;
        this.svgElems = {};
        return this;
    }

    InputTextBoxSymbol.prototype = Object.create(Symbol.prototype);
    InputTextBoxSymbol.prototype.constructor = InputTextBoxSymbol;

    InputTextBoxSymbol.prototype.draw = function (x, y, parentGroup) {
        var elem,
            offsetX,
            textBox,
            btnConfig = this.config || {},
            dependencies = this.dependencies,
            paper = dependencies.paper,
            symbol,
            text,
            logicalSpace = this.getLogicalSpace(),
            width = Math.max(btnConfig.width, logicalSpace.width),
            height = Math.max(btnConfig.height, logicalSpace.height),
            svgElems = this.svgElems,
            btnTextStyle = btnConfig.btnTextStyle,
            containerElem = dependencies.chartContainer;

        if (this.isPlaintext) {
            text = this.symbol;
        } else {
            symbol = this.symbol;
        }

        if (!btnConfig.hoverFill) {
            btnConfig.hoverFill = convertColor(getLightColor(rawRGBtoHEX(btnConfig.fill), 80));
        } else {
            btnConfig.hoverFill = convertColor(btnConfig.hoverFill);
        }

        elem = svgElems.node;
        if (!elem) {
            elem = svgElems.node = paper.button(x, y, text, symbol, {
                width: width,
                height: height,
                r: btnConfig.radius,
                verticalPadding: btnConfig.symbolHPadding * btnConfig.scale,
                horizontalPadding: btnConfig.symbolHPadding,
                // only for the text box part.
                hasLabel: this.hasLabel,
                hasTextBox: this.hasTextBox,
                container: containerElem
            }, parentGroup);
        }
        else {
            elem.attr({
                x: x,
                y: y,
                text: text,
                symbol: symbol,
                width: width,
                height: height,
                r: btnConfig.radius,
                verticalPadding: btnConfig.symbolHPadding * btnConfig.scale,
                horizontalPadding: btnConfig.symbolHPadding,
                // only for the text box part.
                hasLabel: this.hasLabel,
                hasTextBox: this.hasTextBox,
                container: containerElem
            });
        }

        elem.labelcss(this.config.btnTextStyle);
        elem.attr({
            ishot : true,
            fill : [btnConfig.fill, btnConfig.labelFill, btnConfig.symbolFill, btnConfig.hoverFill, true],
            stroke : [btnConfig.stroke, btnConfig.symbolStroke],
            'stroke-width' : [btnConfig.strokeWidth, btnConfig.symbolStrokeWidth],
            'button-textbox': {
                color: btnConfig.labelFill,
                fontFamily: btnTextStyle.fontFamily,
                fontSize: btnTextStyle.fontSize,
                fontWeight: btnTextStyle.fontWeight,
                fontStyle: btnTextStyle.fontWeight
            }
        })
        .tooltip(this.evt.tooltext)
        .buttonclick(this.evt.click)
        .hover(this.evt.hover[0], this.evt.hover[1]);

        offsetX = this.blur(btnConfig.label, {
            smartLabel: dependencies.smartLabel,
            chart: dependencies.chart
        }, x, y, height);

        if (textBox = this.getElement(elem._.button)) {
            this.evt.textOnBlur && textBox.on('blur', this.evt.textOnBlur);
            this.evt.textOnChange && textBox.on('change', this.evt.textOnChange);
        }

        elem.unclick();

        elem.attr({
            'button-repaint': [x, y, btnConfig.width, btnConfig.height, btnConfig.radius, offsetX]
        });
        elem
            .attr({
                'button-label': text,
                'button-padding': [btnConfig.symbolHPadding, btnConfig.symbolHPadding * btnConfig.scale]
            });
        elem.buttonclick(this.evt.click);

        elem.getBBox = function () {
            return {
                x: x,
                y: y,
                width: btnConfig.width,
                height: btnConfig.height
            };
        };

        this.attr(this.stateConfig.enabled);

        return elem;
    };

    InputTextBoxSymbol.prototype.edit = function () {
        var dimensions = this.dimensions,
            svgElems = this.svgElems,
            button = svgElems.node._.button;

        // show the input box.
        this.getElement(button).attr(dimensions).show().focus();
        // hide the text node.
        button.textLabel.hide();
        svgElems.arrow && svgElems.arrow.hide();
    };

    InputTextBoxSymbol.prototype.blur = function (label) {
        var smartText,
            dependencies = this.dependencies,
            smartLabel = dependencies.smartLabel,
            svgElems = this.svgElems,
            button = svgElems.node._.button,
            textBox = this.getElement(button),
            text = this.getText(textBox, label),
            symbol = button.symbol,
            symbolAttrs = symbol.attr('symbol'),
            width = symbolAttrs[4],
            height = symbolAttrs[5],
            x = symbolAttrs[1],
            y = symbolAttrs[2],
            padX = symbolAttrs[6],
            padY = symbolAttrs[7],
            textStyle = this.config.btnTextStyle,
            x1 = x - width / 2 + padX,
            y1 = y - height / 2 + padY,
            h = height - 2 * padY,
            bBox,
            symbolMeasurement = this.getLogicalSpace();

        smartLabel.useEllipsesOnOverflow(1);
        smartLabel.setStyle(textStyle);

        smartText = smartLabel.getSmartText(text, symbolMeasurement.width - (5 * this.interPadding),
            symbolMeasurement.height - (2 * this.interPadding));

        // hide the input box
        textBox.hide();
        // show the text node and update its value.
        button.textLabel
        .attr({
            x: x1 + smartText.width / 2 + this.interPadding,
            y: y1 + h / 2,
            text: smartText.text
        })
        .show();

        svgElems.arrow && svgElems.arrow.show();

        button.textLabel.css(textStyle);

        bBox = button.textLabel.getBBox();

        this.dimensions = {
            x: bBox.x,
            y: bBox.y,
            width: smartText.width,
            height: smartText.height
        };

        return smartText.width / 2 + this.interPadding;
    };


    global.extend(InputTextBoxSymbol.prototype, /** @lends FusionCharts.Symbol */ {
        getElement: function (node) {
            node = node ? node : this.svgElems.node._.button;
            return node.textBox;
        },
        getText: function (textBox, label) {
            textBox = textBox ? textBox : this.svgElems.node._.button.textBox;
            return textBox && (label ? textBox.val(label).element.value : textBox.val());
        }
    });

    /**
     * Constructor for creating Select Symbol component
     * @namespace FusionCharts.SelectSymbol
     * @constructor
     * @augments InputTextBoxSymbol
     * @param {Object} dimensions - width and height of symbol
     * @param {Object} dependencies - modules required for creating a select symbol
     * @param {Object} dependencies.paper - raphael element
     * @param {Object} dependencies.smartLabel - smart Label instance
     * @param {Object} dependencies.chartContainer - chart container element
     * @param {Object} dependencies.chart - chart object
     * @param {Object} options - contains innerHTML for the select symbol
     * @param {Object} config - configuration object of select symbol
     * @example
     * var selectMenu = new SelectSymbol({
     *      width: 100,
     *      height: 25
     *   }, dependencies,{
     *       innerHTML: '<option value="rect">Rectangle</option><option value="circ">Circle</option><option ' +
     *       'value="poly">Polygon</option>'
     *   });
     */
    function SelectSymbol (dimensions, dependencies, options, config) {
        var self = this,
            listContainerManager,
            cont,
            btnConfig;

        InputTextBoxSymbol.call(this, dimensions, dependencies, config);

        this.symbol = undefined;

        btnConfig = this.config;
        btnConfig.arrowWidth = 7;
        btnConfig.arrowPadding = 5;
        btnConfig.arrowFill = '#696969';
        btnConfig.arrowStroke = '#696969';

        config && this.setConfig(config);
        this.interPadding = 3;
        this.svgElems = {};
        this.hasTextBox = undefined;
        this.dependencies = dependencies;
        this.options = options;

        this.evt = {
            tooltext : undefined,
            click : [],
            hover : []
        };

        listContainerManager = this.createListContainerManager();

        cont = listContainerManager.getFirstContainer();


        this.addOptions(options);


        this.attachEventHandlers({
            click: self.click(),
            hover: [
                EMPTY_FN,
                function (e) {
                    var listContainerManager = self.listContainerManager,
                        cont = listContainerManager.getFirstContainer();
                    if (e.toElement !== cont) {
                        cont.hide();
                    }
                }
            ]
        });

        return this;
    }

    SelectSymbol.prototype = Object.create(InputTextBoxSymbol.prototype);
    SelectSymbol.prototype.constructor = SelectSymbol;

    SelectSymbol.prototype.getDefaultConfig = function () {
        return {
            btnTextStyle: {
                'stroke-width': '1px',
                'stroke' : 'none',
                'fontFamily': 'Lucida Grande',
                'fontSize': 12
            },
            textPadding: 10,
            fill: 'rgba(255,255,255,1)',
            hAlign: 'r',
            hDirection: -1,
            hMargin: 10,
            labelFill: '#000000',
            hoverFill: '#ffffff',
            position: 'tr',
            radius: 0,
            scale: 1.15,
            spaceNotHardCoded: true,
            spacing: 10,
            stroke: 'rgba(187,187,187,1)',
            strokeWidth: 2,
            symbolFill: 'rgba(255,255,255,1)',
            symbolHPadding: 5,
            symbolPadding: 30,
            symbolStroke: '#7f7f7f',
            symbolVPadding: 20,
            vAlign: 't',
            vDirection: 1,
            vMargin: 6,
            margin: {
                top: 0,
                bottom: 3,
                right: 10,
                left: 0
            },
            dropDownMenu: {
                normal: {
                    container: {
                        style: {
                            fill: '#ffffff'
                        }
                    },
                    text: {
                        style: {
                            fill: '#000000'
                        }
                    }
                },
                hover: {
                    container: {
                        style: {
                            fill: '#e6e8e8'
                        }
                    },
                    text: {
                        style: {
                            fill: '#1e1f1f'
                        }
                    }
                },
                selected: {
                    container: {
                        style: {
                            fill: '#898b8b'
                        }
                    },
                    text: {
                        style: {
                            fill: '#ffffff'
                        }
                    }
                }
            }
        };
    };

    SelectSymbol.prototype.attachEventHandlers = function (eventMap) {
        var self = this,
            fn,
            event,
            eventFn,
            context;

        if (!this.node) {
            for (event in eventMap) {
                eventFn = eventMap[event];
                if (!self.evt[event]) {
                    self.evt[event] = [];
                }
                if (typeof eventFn === 'object' && !(eventFn instanceof Array)) {
                    fn = eventFn.fn;
                    context = eventFn.context;
                }
                else {
                    fn = eventFn;
                }

                self.evt[event].push({
                    fn: fn,
                    context: context
                });
            }
        }
        else {
            for (event in eventMap) {

                if (this.node[event] === undefined) {
                    self.evt[event] = eventMap[event];
                }
                else {
                    fn = eventMap[event];
                    if (!(fn instanceof Array)) {
                        fn = [fn];
                    }
                    this.node[event].apply(this.node, fn);
                }

            }
        }
    };

    SelectSymbol.prototype.click = function () {
        var self = this;
        return function (e) {
            var listContainerManager = self.listContainerManager,
            cont = listContainerManager.getFirstContainer();

            !cont.visible ? cont.show(normalizeTarget(e[0].target || e[0].fromElement, e[0])) : cont.hide();
        };
    };

    SelectSymbol.prototype.addOptions = function (options) {

        var listContainerManager = this.listContainerManager,
            style = {},
            listObj,
            list = [],
            name,
            option,
            i,
            ln,
            self = this,
            clickHandler = function (option) {
                var name = option.name,
                    onChangeCallbacks = self.evt.textOnChange || [],
                    cont = listContainerManager.getFirstContainer(),
                    fn,
                    context,
                    callback,
                    i,
                    ln;

                self.blur(name);
                self.selectedOption = option;
                cont.setSelectedItem(this);

                for (i = 0, ln = onChangeCallbacks.length; i < ln; i++) {
                    callback = onChangeCallbacks[i];
                    fn = callback.fn || callback;
                    context = callback.context || self;
                    fn.call(context, option);
                }
            };

        for (i = 0, ln = options.length; i < ln; i++) {
            option = options[i];

            name = option.name;

            listObj = {};
            listObj[name] = {};
            listObj[name].style = style;
            listObj[name].action = 'click';
            listObj[name].handler = clickHandler;

            listObj[name].args = [{
                name: name,
                value: option.value
            }];

            list.push(listObj);
        }

        this.selectedOption = options[0];

        listContainerManager.appendAsList(list);

        this.setSelectedItem(this.selectedOption);

    };

    SelectSymbol.prototype.draw = function (x, y, parentGroup) {
        var elem,
            bBox,
            arrowX,
            arrowY,
            arrowHeight,
            textBBox,
            bound,
            arrowWidth = this.config.arrowWidth,
            textLabel,
            offsetX,
            btnConfig = this.config || {},
            arrowFill = btnConfig.arrowFill,
            arrowStroke = btnConfig.arrowStroke,
            arrowPadding = btnConfig.arrowPadding,
            dependencies = this.dependencies,
            paper = dependencies.paper,
            symbol,
            text,
            logicalSpace = this.getLogicalSpace(),
            width = Math.max(btnConfig.width, logicalSpace.width),
            height = Math.max(btnConfig.height, logicalSpace.height),
            svgElems = this.svgElems,
            containerElem = dependencies.chartContainer,
            btnTextStyle = btnConfig.btnTextStyle,
            eventMap,
            event,
            i,
            eventFns,
            fn,
            self = this,
            ln,
            clickFn = function (callbackFns) {
                return function (e) {
                    var i,
                        ln,
                        callback,
                        fn,
                        context;

                    for (i = 0, ln = callbackFns.length; i < ln; i++) {
                        callback = callbackFns[i];
                        fn = callback.fn || callback;
                        context = callback.context || self;
                        fn.call(context, e);
                    }
                };
            },
            context;

        if (this.isPlaintext) {
            text = this.symbol;
        } else {
            symbol = this.symbol;
        }

        if (!btnConfig.hoverFill) {
            btnConfig.hoverFill = convertColor(getLightColor(rawRGBtoHEX(btnConfig.fill), 80));
        } else {
            btnConfig.hoverFill = convertColor(btnConfig.hoverFill);
        }

        elem = svgElems.node;
        if (!elem) {
            elem = svgElems.node = paper.button(x, y, text, symbol, {
                width: width,
                height: height,
                r: btnConfig.radius,
                verticalPadding: btnConfig.symbolHPadding * btnConfig.scale,
                horizontalPadding: btnConfig.symbolHPadding,
                // only for the text box part.
                hasLabel: this.hasLabel,
                hasTextBox: false,
                container: containerElem
            }, parentGroup);
        }
        else {
            elem.attr({
                x: x,
                y: y,
                text: text,
                symbol: symbol,
                width: width,
                height: height,
                r: btnConfig.radius,
                verticalPadding: btnConfig.symbolHPadding * btnConfig.scale,
                horizontalPadding: btnConfig.symbolHPadding,
                // only for the text box part.
                hasLabel: this.hasLabel,
                hasTextBox: this.hasTextBox,
                container: containerElem
            });
        }

        elem.labelcss(btnTextStyle);

        elem.attr({
            ishot : true,
            fill : [btnConfig.fill, '#00ff00', btnConfig.symbolFill, btnConfig.hoverFill, true],
            stroke : [btnConfig.stroke, btnConfig.symbolStroke],
            'stroke-width' : [btnConfig.strokeWidth, btnConfig.symbolStrokeWidth]
        })
        .tooltip(this.evt.tooltext);

        offsetX = this.blur(this.selectedOption && this.selectedOption.name, {
            smartLabel: dependencies.smartLabel,
            chart: dependencies.chart
        }, x, y, height);

        elem.unclick();

        // elem.attr({
        //     'button-repaint': [x, y, btnConfig.width, btnConfig.height, btnConfig.radius, offsetX]
        // });
        // elem
        //     .attr({
        //         'button-label': text,
        //         'button-padding': [btnConfig.symbolHPadding, btnConfig.symbolHPadding * btnConfig.scale]
        //     });

        eventMap = this.evt;

        for (event in eventMap) {
            eventFns = eventMap[event];

            if (eventFns instanceof Array) {
                if (event === 'click') {
                    event = 'buttonclick';
                }

                for (i = 0, ln = eventFns.length; i < ln; i++) {
                    context = eventFns[i].context;
                    fn = eventFns[i].fn;
                    if (!(fn instanceof Array)) {
                        fn = [fn];
                    }
                    if (event === 'buttonclick') {
                        elem[event].call(elem, clickFn(eventFns));
                    }
                    else {
                        elem[event] && elem[event].apply(elem, fn);
                    }
                }
            }

        }

        elem.getBBox = function () {
            return {
                x: x,
                y: y,
                width: btnConfig.width,
                height: btnConfig.height
            };
        };

        bound = this.getBoundElement();
        textLabel = this.svgElems.node._.button.textLabel;
        bBox = bound.getBBox();
        textBBox = textLabel.getBBox();
        arrowHeight = textBBox.height / 4;

        arrowX = bBox.x + bBox.width - arrowWidth - this.interPadding - arrowPadding;
        arrowY = textBBox.y + textBBox.height / 2 - arrowHeight / 2;

        if (!svgElems.arrow) {
            svgElems.arrow = paper.path(parentGroup);
        }

        svgElems.arrow.attr({
            path: ['M', arrowX, arrowY, 'L', arrowX + arrowWidth, arrowY, 'L', arrowX + arrowWidth / 2,
                arrowY + arrowHeight, 'Z']
        }).attr({
            fill: arrowFill,
            stroke: arrowStroke
        }).insertBefore(elem._.button.tracker);

        this.attr(this.stateConfig.enabled);

        return elem;

    };

    SelectSymbol.prototype.blur = function (text) {
        var smartText,
            dependencies = this.dependencies,
            smartLabel = dependencies.smartLabel,
            svgElems = this.svgElems,
            button = svgElems.node._.button,
            symbol = button.bound,
            bBox = symbol.getBBox(),
            width = bBox.width,
            height = bBox.height,
            x = bBox.x,
            y = bBox.y,
            config = this.config,
            textStyle = config.btnTextStyle,
            w = width,
            h = height,
            symbolMeasurement = this.getLogicalSpace(),
            arrowWidth = config.arrowWidth,
            arrowPadding = config.arrowPadding;

        this.dimensions = {
            x: x,
            y: y,
            width: w,
            height: h
        };

        smartLabel.useEllipsesOnOverflow(1);
        smartLabel.setStyle(textStyle);

        smartText = smartLabel.getSmartText(text, symbolMeasurement.width - (5 * this.interPadding) - arrowWidth -
            arrowPadding,
            symbolMeasurement.height - (2 * this.interPadding));

        button.textLabel
        .attr({
            x: x + smartText.width / 2 + this.interPadding,
            y: y + h / 2,
            text: smartText.text
        })
        .show();

        svgElems.arrow && svgElems.arrow.show();

        button.textLabel.css(textStyle);
        return smartText.width / 2 + this.interPadding;
    };

    global.extend(SelectSymbol.prototype, /** @lends FusionCharts.SelectSymbol */ {
        /**
         * Updates the options of select menu
         * @param {string} innerHTML - innerHTML of select options menu
         */
        updateList: function (options) {
            var listContainerManager = this.listContainerManager;
            listContainerManager.dispose();

            this.createListContainerManager();
            this.addOptions(options);
            this.blur((options[0] && options[0].name) || '');
            this.selectedOption = options[0];
            this.options = options;

            return this;
        },

        createListContainerManager: function () {
            var config = this.config;

            this.listContainerManager = new ListContainerManager(this.position, {
                diffScale: 1,
                borderWidth: config.strokeWidth,
                contextMenu: this.svgElems
            }).init(this.dependencies);

            this.setDropDownMenuStyle(config.dropDownMenu);

            return this.listContainerManager;
        },

        setDropDownMenuStyle: function (dropDownMenu) {
            var normalStyle = dropDownMenu.normal,
                hoverStyle = dropDownMenu.hover,
                selectedStyle = dropDownMenu.selected,
                textStyle,
                listCont = this.listContainerManager.getFirstContainer(),
                config = this.config,
                btnTextStyle = config.btnTextStyle,
                containerStyle;

            if (normalStyle) {
                containerStyle = normalStyle.container.style || {};
                textStyle = normalStyle.text.style || {};
                listCont.setDefaultStyle({
                    background: containerStyle.fill,
                    color: config.labelFill || textStyle.fill,
                    fontFamily: textStyle.fontFamily || btnTextStyle.fontFamily,
                    fontWeight: textStyle.fontWeight || btnTextStyle.fontWeight,
                    fontSize: (textStyle.fontSize || btnTextStyle.fontSize) + 'px',
                    'border-color': containerStyle.stroke || '#000000',
                    'border-radius': (containerStyle.radius || 1) + 'px',
                    'border-width': (containerStyle['stroke-width'] || 1) + 'px'
                });
            }

            if (hoverStyle) {
                containerStyle = hoverStyle.container.style || {};
                textStyle = hoverStyle.text.style || {};
                listCont.setHoverStyle({
                    hoverOver: {
                        background : containerStyle.fill,
                        color : textStyle.fill
                    }
                });
            }

            if (selectedStyle) {
                containerStyle = selectedStyle.container.style || {};
                textStyle = selectedStyle.text.style || {};

                listCont.setSelectedStyle({
                    background : containerStyle.fill,
                    color : textStyle.fill
                });
            }

        },
        /*
         * Sets or gets the selected value from the select menu
         */
        value: function (value) {
            var options = this.options,
                option,
                i,
                ln;

            if (value === undefined) {
                return this.selectedOption.value;
            }

            for (i = 0, ln = options.length; i < ln; i++) {
                option = options[i];
                if (option.value === value) {
                    break;
                }
            }

            if (option) {
                this.svgElems.node && this.blur(option && option.name);
                this.selectedOption = option;
                this.setSelectedItem(option);
            }
        },

        setSelectedItem: function (option) {
            var cont = this.listContainerManager.getFirstContainer(),
                atomicLists = cont.atomicLists,
                atomicList,
                i,
                ln;

            for (i = 0, ln = atomicLists.length; i < ln; i++) {
                atomicList = atomicLists[i];
                if (atomicList.name === option.name) {
                    cont.setSelectedItem(atomicList);
                    break;
                }
            }
        },

        /**
         * Gets the html element of select menu
         * @param {object} node - svg element (optional)
         */

        getElement: function (node) {
            node = node || this.svgElems.node._.button;
            return node.select;
        }
    });

    function CheckboxSymbol (text, isChecked, dependencies) {
        Symbol.call(this, TEXTBOX_SYMBOL);

        // this._id = 'TB_CBSYMBOL' + (idCount || 0);
        this.symbol = TEXTBOX_SYMBOL;
        this.text = {
            plaintext: text,
            node: undefined,
            style: defTextStyle
        };
        // this.pId = poolId;
        this.checked = !!isChecked;

        this.svgElems = {};
        this.interPadding = 3;
        this.pos = {};
        this.regSymbolCmd = undefined;
        this.dependencies = dependencies;
        if (this.checked) {
            this.check();
        } else {
            this.uncheck();
        }
    }

    CheckboxSymbol.prototype = Object.create(Symbol.prototype);
    CheckboxSymbol.prototype.constructor = CheckboxSymbol;

    CheckboxSymbol.prototype.check = function () {
        var pos = this.pos,
            node = this.svgElems.node;

        this.checked = true;
        this.regSymbolCmd = rSymbolFns.CB_CHECKED;

        if (node) {
            this.registerSymbol(this.regSymbolCmd);
            node.attr({'button-repaint' : [pos.x, pos.y, pos.width, pos.height, pos.r]});
        }
    };

    CheckboxSymbol.prototype.uncheck = function () {
        var pos = this.pos,
            node = this.svgElems.node;

        this.checked = false;
        this.regSymbolCmd = rSymbolFns.CB_NOT_CHECKED;
        if (node) {
            this.registerSymbol(this.regSymbolCmd);
            node.attr({'button-repaint' : [pos.x, pos.y, pos.width, pos.height, pos.r]});
        }
    };

    CheckboxSymbol.prototype.click = function () {
        if (this.checked) {
            this.uncheck();
        } else {
            this.check();
        }
    };

    CheckboxSymbol.prototype.attachEventHandlers = function (eventMap) {
        var self = this,
            clickHandler = function () {
                self.click();
            };

        Symbol.prototype.attachEventHandlers.apply(this, [eventMap, {
            click: clickHandler
        }]);
    };

    CheckboxSymbol.prototype.getLogicalSpace = function () {
        var dependencies = this.dependencies,
            smartLabel = dependencies.smartLabel,
            textStyle = this.text.style,
            smartText,
            symbolMeasurement;

        symbolMeasurement = Symbol.prototype.getLogicalSpace.apply(this, arguments);

        smartLabel.useEllipsesOnOverflow(1);
        smartLabel.setStyle(textStyle);
        smartText = smartLabel.getSmartText(this.text.plaintext);

        return {
            width: smartText.width + this.interPadding + symbolMeasurement.width,
            height: Math.max(symbolMeasurement.height,  smartText.height)
        };
    };

    CheckboxSymbol.prototype.draw = function (x, y, parentGroup) {
        var cbElem,
            btnConfig = this.config,
            bBox, smartText,
            dependencies = this.dependencies,
            smartLabel = dependencies.smartLabel,
            paper = dependencies.paper,
            plaintext = this.text.plaintext,
            boundingheight,
            boundingRect,
            textStyle,
            textNode,
            svgElems = this.svgElems;

        this.registerSymbol(this.regSymbolCmd);

        cbElem = svgElems.node = Symbol.prototype.draw.apply(this, arguments);

        this.pos = {
            x: x,
            y: y,
            width: btnConfig.width,
            height : btnConfig.height,
            r: btnConfig.radius
        };

        textStyle = this.text.style;
        textStyle.fill = textStyle.fill || '#000000';

        smartLabel.useEllipsesOnOverflow(1);
        smartLabel.setStyle(textStyle);
        smartText = smartLabel.getSmartText(plaintext);

        bBox = cbElem.getBBox();

        textNode = svgElems.textNode;

        if (!textNode) {
            textNode = paper.text(parentGroup);
        }

        textNode.attr({
            text: plaintext,
            x: bBox.x + bBox.width + smartText.width / 2 + this.interPadding,
            y: bBox.y + bBox.height / 2
        }).css(textStyle);

        boundingheight = btnConfig.height > smartText.height ? btnConfig.height : smartText.height;

        boundingRect = svgElems.boundingRect;

        if (!boundingRect) {
            boundingRect = svgElems.boundingRect = paper.rect(parentGroup);
        }

        boundingRect.attr({
            height : boundingheight,
            width : bBox.width + smartText.width + this.interPadding,
            x : x,
            y: y,
            stroke: TRANSPARENT_FILL
        });

        return boundingRect;
    };

    CheckboxSymbol.prototype.dispose = function () {
        this.svgElems.textNode && this.svgElems.textNode.remove();
        this.svgElems.textNode = undefined;
        Symbol.prototype.dispose.call(this);
    };

    /**
     *  Creates a symbol with context menu
     * @namespace FusionCharts.SymbolWithContext
     * @constructor
     * @extends Symbol
     * @param {string} symbolName - name of the symbol
     * @param {object} dependencies - modules required for rendering the symbolwithcontext
     * @param {object} config - configuration of symbolwithcontext menu
     */

    function SymbolWithContext (symbolName, dependencies, config) {
        var cont;
        (this._unitClass || Symbol).call(this, symbolName, undefined, undefined, config);
        this.rawContextDefinitation = undefined;
        this.config.contextMenu = {
            container: {
                backgroundColor: '#ffffff',
                borderColor: '#7f7f7f'
            },
            text: {
                fontSize: '14px',
                fontFamily: 'sans-serif',
                color: '#525252'
            },
            hoverStyle: {
                backgroundColor: '#e7e8e8',
                color: '#696969'
            },
            position: config.position,
            diffScale: 1.1
        };
        this.listContainerManager = new ListContainerManager(this.position, this.config.contextMenu).init(dependencies);
        this.dependencies = dependencies;
        cont = this.listContainerManager.getFirstContainer();
        this.evt.hover = [function (e) {
            cont.show(normalizeTarget(e.target || e.fromElement, e));
        }, function (e) {
            cont.hide(DEFAULT_TIMEOUT, e.target);
        }];
    }

    SymbolWithContext.POSITION_TOP = 'top';
    SymbolWithContext.POSITION_BOTTOM = 'bottom';

    SymbolWithContext.prototype = Object.create(Symbol.prototype);
    SymbolWithContext.prototype.constructor = SymbolWithContext;

    // SymbolWithContext.prototype.parseStyles = function (contextMenu) {
    //     var containerStyle = {
    //         fill: 'backgroundColor',
    //         stroke: 'borderColor',
    //     },
    //     textStyle = {
    //         fontFamily: 'fontFamily',
    //         fontSize: 'fontSize',
    //         fontWeight: 'fontWeight',
    //         fontStyle: 'fontStyle',
    //         opacity: 'opacity',
    //         fill: 'color'
    //     },
    //     container = contextMenu.container,
    //     text = contextMenu.text,
    //     contextMenuStyle = {
    //         container: {},
    //         text: {}
    //     },
    //     styleName;

    //     for (key in container) {
    //         styleName = containerStyle[key];
    //         if (styleName) {
    //             contextMenuStyle.container[styleName] = container[key];
    //         }
    //     }

    //     for (key in text) {
    //         styleName = textStyle[key];
    //         if (styleName) {
    //             if (styleName === 'fontSize') {
    //                 text[key] += 'px';
    //             }
    //             contextMenuStyle.text[styleName] = text[key];
    //         }
    //     }

    //     return contextMenuStyle;
    // };

    SymbolWithContext.allNodes = [];

    SymbolWithContext.prototype.attachEventHandler = function (eventMap) {
        var evt = this.evt,
            toolText = eventMap.tooltext;

        if (toolText) { evt.tooltext = toolText; }
    };

    SymbolWithContext.prototype.getLogicalSpace = function () {
        var firstContainer = this.listContainerManager.getFirstContainer(),
            atomicLists = firstContainer.atomicLists;

        if (atomicLists && atomicLists.length === 0) {
            return {
                width: 0,
                height: 0
            };
        }

        return Symbol.prototype.getLogicalSpace.call(this);
    };

    SymbolWithContext.prototype.draw = function () {
        var firstContainer = this.listContainerManager.getFirstContainer(),
            atomicLists = firstContainer.atomicLists,
            res;

        if (atomicLists && atomicLists.length === 0) {
            this.hide();
            return {
                getBBox : function () {
                    return {
                        width: 0,
                        height: 0
                    };
                }
            };
        }

        res = (this._unitClass || Symbol).prototype.draw.apply(this, arguments);
        SymbolWithContext.allNodes.push(this.node);

        return res;
    };

    SymbolWithContext.prototype.dispose = function () {
        this.listContainerManager && this.listContainerManager.dispose();
        this.listContainerManager = undefined;
        Symbol.prototype.dispose.call(this);
    };

    global.extend(SymbolWithContext.prototype, /** lends FusionCharts.SymbolWithContext */ {
        /**
         *  Get list container reference
         */
        getListRefernce: function () {
            return this.listContainerManager;
        },
        /**
         * Append list menu items
         */
        appendAsList: function (list) {
            this.listContainerManager.appendAsList(list);
        }
    });
    // todo: check the multiple inheritance. Here SymbolLabelWithContext inherits multiply from SymbolWithContext
    // and InputTextBoxSymbol.
    // todo: Dependency with the text box seems unnecessary here.
    function SymbolLabelWithContext (symbolName, dependencies) {
        this._unitClass = InputTextBoxSymbol;
        SymbolWithContext.call(this, symbolName, dependencies);
    }

    SymbolLabelWithContext.prototype = Object.create(SymbolWithContext.prototype);
    SymbolLabelWithContext.prototype.constructor = SymbolLabelWithContext;

    SymbolLabelWithContext.prototype.edit = InputTextBoxSymbol.prototype.edit;

    SymbolLabelWithContext.prototype.blur = InputTextBoxSymbol.prototype.blur;

    SymbolLabelWithContext.prototype.getText = InputTextBoxSymbol.prototype.getText;

    SymbolLabelWithContext.prototype.getElement = InputTextBoxSymbol.prototype.getElement;

    function Scroller (conf, dependencies) {
        var scrollerSpecAttr = {
            color: '#EEEEEE',
            padding: 0,
            height: 12,
            width: 12,
            displayFlat: 0,
            scrollBar3DLighting: 1,
            isHorizontal: true,
            startPercent: 0,
            showButtons: 1,
            buttonPadding: 0
        };

        Symbol.call(this);
        this.config = scrollerSpecAttr;
        this.setConfig(conf);
        this.svgElems = {};
        this.dependencies = dependencies;
        this.evt.scroll = EMPTY_FN;
        return this;
    }

    Scroller.prototype = Object.create(Symbol.prototype);
    Scroller.prototype.constructor = Scroller;

    Scroller.prototype.setConfig = function (conf) {
        mergeConf(conf, this.config);
    };

    Scroller.prototype.getLogicalSpace = function () {
        return Symbol.prototype.getLogicalSpace.call(this);
    };

    Scroller.prototype.getDefaultLayer = function () {
        var dependencies = this.dependencies,
            paper = dependencies.paper,
            svgElems = this.svgElems,
            defLayer = svgElems.parentGroup;

        if (!defLayer) {
            defLayer = svgElems.parentGroup = paper.group('scroller');
        }

        return defLayer;
    };

    Scroller.prototype.registerSymbol = undefined;

    Scroller.prototype.attachEventHandlers = function (eventMap) {
        var scroller = this;
        if (eventMap && eventMap.scroll && typeof eventMap.scroll === 'function') {
            this.evt.scroll = eventMap.scroll;
        }

        Symbol.prototype.attachEventHandlers.apply(scroller, arguments);
        return scroller;
    };

    Scroller.prototype.draw = function () {
        var x, y, height, width, options, isHorizontal, parentLayer,
            scrollRatio, showButtons, displayFlat,
            fullCanvasWidth, windowedCanvasWidth,
            color, roundEdges, createScrollerLayer,
            argObj,
            scrollLayer,
            startPercent,
            config = this.config,
            dependencies = this.dependencies,
            paper = dependencies.paper,
            svgElems = this.svgElems,
            node,
            preperaedScrollerSpecAttr = {};

        if (arguments.length === 1) {
            argObj = arguments[0];

            x = argObj.x;
            y = argObj.y;
            parentLayer = argObj.parentLayer;
            createScrollerLayer = !!argObj.sepLayer;
        } else {
            x = arguments[0];
            y = arguments[1];
            options = arguments[2];

            if (config && options) {
                mergeConf(options, config);
            } else {
                options = {};
            }

            parentLayer = options.parentLayer;
            createScrollerLayer = !!options.sepLayer;
            argObj = config;
        }

        mergeConf(config, preperaedScrollerSpecAttr);

        if (argObj.isHorizontal) {
            delete preperaedScrollerSpecAttr.width;
        } else {
            delete preperaedScrollerSpecAttr.height;
        }

        y += argObj.padding;

        height = argObj.height;
        width = argObj.width;
        isHorizontal = argObj.isHorizontal;
        startPercent = argObj.startPercent;
        scrollRatio = argObj.scrollRatio;
        showButtons = argObj.showButtons;
        displayFlat = argObj.displayFlat;
        fullCanvasWidth = argObj.fullCanvasWidth;
        windowedCanvasWidth = argObj.windowedCanvasWidth;
        color = argObj.color;
        roundEdges = argObj.roundEdges;

        if (parentLayer) {
            svgElems.parentGroup = parentLayer;
        }
        else {
            svgElems.parentGroup = this.getDefaultLayer();
        }

        scrollLayer = svgElems.parentGroup;

        node = svgElems.node;

        if (!node) {
            node = svgElems.node = paper.scroller(x, y, width, height, isHorizontal, {
                scrollPosition: argObj.scrollPosition || startPercent || 0,
                displayStyleFlat: displayFlat,
                showButtons: showButtons
            }, scrollLayer);
        }
        else {
            node.attr({
                'scroll-repaint': [x, y, width, height],
                'scroll-display-buttons': showButtons && 'arrow' || 'none',
                'scroll-display-style': displayFlat && 'flat' || '3d',
                'scroll-position': argObj.scrollPosition || startPercent || 0
            });
        }

        node.data('fullCanvasWidth', fullCanvasWidth)
        .data('windowedCanvasWidth', windowedCanvasWidth)
        .attr({
            'scroll-ratio': scrollRatio,
            'fill': color,
            r: roundEdges && 2 || 0
        });

        node.undrag();

        node.scroll(this.evt.scroll);

        return this;
    };

    /**
     * Component Group
     * @namespace FusionCharts.ComponentGroup
     * @constructor
     * @param {Object} dependencies - modules required for creating a component group
     * @param {Object} dependencies.paper - raphael element
     * @param {Object} dependencies.smartLabel - smart Label instance
     * @param {Object} dependencies.chartContainer - chart container element
     * @param {Object} dependencies.chart - chart object
     * @param {Object} config - configuration object of component group
     * @example
     * // Example to create component group
     *      var self = this;
     *      require('graphics', 'chart', 'smartLabel', function (graphics, chart, smartLabel) {
     *          self.graphics = graphics;
     *          self.smartLabel = smartLabel;
     *          self.chart = chart;
     *      });
     *
     *      var dependencies = {
     *          paper: self.graphics.paper,
     *          chart: self.chart,
     *          smartLabel: self.smartLabel,
     *          chartContainer: self.graphics.container
     *      };
     *      var componentGroup = new ComponentGroup(dependencies);
     */
    function ComponentGroup (dependencies, config) {
        var defaultGroupConf = {
                hPadding : 3,
                vPadding : 3,
                borderRadius : 2,
                fill : convertColor('#ffffff', 100),
                borderColor : convertColor('B2B1B1', 100),
                borderThickness : 1,
                offsetAdjustment : 1,
                radius: 1,
                spacing: 6,
                btnSpacing: 10
            };

        this.symbolList = [];
        this.svgElems = {};
        this.config = defaultGroupConf;
        this.dependencies = dependencies;

        config && this.setConfig(config);
    }

    ComponentGroup.prototype.draw = function (drawCoord, parentGroup) {
        var symbolList = this.symbolList,
            index, length, symbol, config,
            groupConfig = this.config,
            startX = drawCoord.x,
            startY = drawCoord.y,
            dependencies = this.dependencies,
            paper = dependencies.paper,
            thisToolBarGroupLayers,
            groupRect,
            effectiveHeight = 0, effectiveWidth = 0,
            bBox,
            maxHeight = Number.NEGATIVE_INFINITY,
            svgElems = this.svgElems,
            buttonElem;

        thisToolBarGroupLayers = svgElems.group;

        if (!thisToolBarGroupLayers) {
            thisToolBarGroupLayers = svgElems.group = paper.group('toolbar-group', parentGroup).trackTooltip(true);
        }

        groupRect = svgElems.groupRect;

        if (!groupRect)  {
            groupRect = svgElems.groupRect = paper.rect({
                height : 0,
                width : 0,
                x : startX,
                y: startY
            }, thisToolBarGroupLayers);
        }
        else {
            groupRect.attr({
                height : 0,
                width : 0,
                x : startX,
                y: startY
            });
        }

        startX += groupConfig.hPadding;
        startY += groupConfig.vPadding;

        effectiveWidth += groupConfig.hPadding;
        effectiveHeight += groupConfig.vPadding;

        for (index = 0, length = symbolList.length; index < length; index++) {
            symbol = symbolList[index];
            config = symbol.config;
            buttonElem = symbol.draw(startX + config.offsetX, startY + config.offsetY, thisToolBarGroupLayers,
                this.config.maxHeight[config.rowIndex]);

            bBox = buttonElem.getBBox();
            if (maxHeight < bBox.height) {
                maxHeight = bBox.height;
            }
        }

        effectiveWidth += groupConfig.sumWidth;
        effectiveHeight += groupConfig.sumHeight;

        effectiveWidth += startX + groupConfig.hPadding - drawCoord.x - groupConfig.offsetAdjustment;
        effectiveHeight += groupConfig.vPadding + groupConfig.offsetAdjustment;

        isFinite(effectiveHeight) || (effectiveHeight = 0);
        isFinite(effectiveWidth) || (effectiveWidth = 0);

        groupRect.attr({
            height : effectiveHeight,
            width : effectiveWidth
        }).attr({
            fill : groupConfig.fill,
            r : groupConfig.radius,
            stroke : groupConfig.borderColor,
            'stroke-width' : groupConfig.borderThickness
        });

        bBox = groupRect.getBBox();

        return {
            height : bBox.height,
            width : bBox.width
        };

    };

    global.extend(ComponentGroup.prototype, /** @lends FusionCharts.ComponentGroup */ {
        /**
         * Adds symbol component
         * @param {object} instance - instance of the symbol created
         * @param {boolean} prepend - for adding the symbol at first
         * @example
         * // Example to add a text button to component group
         * var symbolInstance = new Symbol('APPLY', true, dependencies, configuration);
         * componentGroup.addSymbol(symbolInstance);
         */
        addSymbol: function (instance, prepend) {
            var symbolList = this.symbolList;
            if (prepend) {
                symbolList.unshift(instance);
            }
            else {
                symbolList.push(instance);
            }
            instance._parentGroup = this;
            // instance.getParentGroup(this);
        },

        /**
         * Sets configuration of component group
         * @param {Object} config - configuration of the component group
         */
        setConfig: function (config) {
            mergeConf(config, this.config);
        },

        /*
         * Gets the logical space of the component group
         * @return {object} width and height of the group
         */

        getLogicalSpace: function (dependencies, availableWidth, availableHeight) {
            var symbolList = this.symbolList,
                groupConfig = this.config,
                symbol,
                index, length,
                width = 0,
                totHeight = 0,
                totWidth = 0,
                netHeight = 0,
                maxHeight = 0,
                symbolWidth = 0,
                rowIndex = 0,
                measurement,
                i;

            if (!groupConfig.maxHeight) {
                groupConfig.maxHeight = [];
            }

            for (index = 0, length = symbolList.length; index < length; index++) {
                symbol = symbolList[index];
                // symbol.setConfig(btnConfig);

                measurement = symbol.getLogicalSpace(dependencies);
                // check if the width exceeds the available width
                if (width + measurement.width + symbol.getConfig('margin').right > availableWidth) {
                    groupConfig.maxHeight[rowIndex] = maxHeight;
                    rowIndex += 1;
                    totHeight += (maxHeight + symbol.getConfig('margin').bottom);
                    totWidth = mathMax(totWidth, width);
                    maxHeight = 0;
                    width = 0;
                }
                symbol.config.offsetX = width;
                symbol.config.offsetY = totHeight;
                symbol.config.rowIndex = rowIndex;

                width += measurement.width + symbol.getConfig('margin').right;
                symbolWidth += measurement.width;

                maxHeight = maxHeight < measurement.height ? measurement.height : maxHeight;
            }
            totHeight += maxHeight;
            // totHeight = mathMax(totHeight, maxHeight);
            totWidth = mathMax(totWidth, width);
            groupConfig.maxHeight[rowIndex] = totHeight;
            // @todo api should not include dirty check like this, but this is the need of the time.
            // if no components are created with spacing but hidden, returns 0
            if (!symbolWidth) {
                return {
                    width: 0,
                    height: 0
                };
            }

            if (maxHeight !== Number.NEGATIVE_INFINITY && width) {
                totWidth -= groupConfig.btnSpacing - 2 * groupConfig.hPadding - groupConfig.offsetAdjustment;
                if ((netHeight = totHeight + 2 * groupConfig.vPadding +
                    groupConfig.offsetAdjustment) < availableHeight) {
                    totHeight = netHeight;
                }
            }
            groupConfig.sumWidth = totWidth;
            groupConfig.sumHeight = 0;
            for (i = 0; i <= groupConfig.maxHeight.length; i += 1) {
                groupConfig.sumHeight += groupConfig.maxHeight[i];
            }
            return {
                width: totWidth,
                height: totHeight
            };
        },

        /*
         * Disposes the component group
         */

        dispose: function () {
            var symbols = this.symbolList,
                index = 0,
                length = symbols.length,
                svgElems = this.svgElems;

            for (; index < length; index++) {
                symbols[index].dispose();
            }

            symbols.length = 0;

            svgElems.groupRect && svgElems.groupRect.remove();
        }
    });

    /**
     * UniSelectComponentGroup
     * Primarily composed of only buttons
     * Only one button can be selected at an instant.
     * @namespace FusionCharts.UniSelectComponentGroup
     * @constructor
     * @augments ComponentGroup
     * @param {object} dependencies - modules needed for creating uniselectcomponentgroup
     * @param {object} config - configuration for group
    */
    function UniSelectComponentGroup (dependencies, config) {
        ComponentGroup.call(this, dependencies, config);
        this._state = {};
        return this;
    }

    UniSelectComponentGroup.prototype = Object.create(ComponentGroup.prototype);
    UniSelectComponentGroup.prototype.constructor = UniSelectComponentGroup;

    global.extend(UniSelectComponentGroup.prototype, /** @lends FusionCharts.UniSelectComponentGroup */ {
        /**
         * Sets the state of the symbol to pressed and other symbols in the group to default state
         * If symbol is not passed in parameter then it returns the current state of the component
         * i.e the symbol which is currently pressed
         * @param {object} symbol - instance of symbol
         * @return {object} state of the symbol
         */
        setState: function (symbol) {
            if (symbol) {
                // previously selected state button turns off.
                this._state.setState && this._state.setState(false);

                // the current selection turns pressed.
                this._state = symbol.setState(true);
            }
            return this._state;
        }
    });
    /**
     * MultiSelectComponentGroup
     * Multiple buttons can be selected at an instant.
     * @namespace FusionCharts.MultiSelectComponentGroup
     * @constructor
     * @augments ComponentGroup
     * @param {object} dependencies - modules needed for creating uniselectcomponentgroup
     * @param {object} dependencies - configuration for group
    */
    function MultiSelectComponentGroup (dependencies, config) {
        return UniSelectComponentGroup.call(this, dependencies, config);
    }

    MultiSelectComponentGroup.prototype = Object.create(ComponentGroup.prototype);
    MultiSelectComponentGroup.prototype.constructor = MultiSelectComponentGroup;

    MultiSelectComponentGroup.prototype.setState = function (symbol) {
        if (symbol) {
            // the current selection turns is toggled.
            this._state = symbol.setState(!symbol._state);
        }
        return this._state;
    };

    global.extend(MultiSelectComponentGroup.prototype, /** @lends FusionCharts.MultiSelectComponentGroup */{});

    /**
     * Horizontal Toolbar
     * Creates a horizontal toolbar instance
     * @namespace FusionCharts.HorizontalToolbar
     * @constructor
     * @param {Object} dependencies - modules required for creating a toolbar
     * @param {Object} dependencies.paper - raphael element
     * @param {Object} dependencies.smartLabel - smart Label instance
     * @param {Object} dependencies.chartContainer - chart container element
     * @param {Object} dependencies.chart - chart object
     * @param {Object} config - configuration object of toolbar
     * @example
     * // An example extension to create a horizontal toolbar
     * ToolBarExtension.prototype.init = function (require) {
     *      var self = this;
     *      require('graphics', 'chart', 'smartLabel', function (graphics, chart, smartLabel) {
     *          self.graphics = graphics;
     *          self.smartLabel = smartLabel;
     *          self.chart = chart;
     *      });
     *
     *      var dependencies = {
     *          paper: self.graphics.paper,
     *          chart: self.chart,
     *          smartLabel: self.smartLabel,
     *          chartContainer: self.graphics.container
     *      };
     *      toolbar = new HorizontalToolbar(dependencies);
     *      componentGroup = new ComponentGroup(dependencies);
     *      toolbar.addComponent(componentGroup);
     * };
     *
     * ToolBarExtension.prototype.draw = function (x, y, group) {
     *      this.toolbar.draw(x, y, group);
     * };
     */
    function HorizontalToolbar (dependencies, config) {
        this.svgElems = {};
        this.componentGroups = [];
        this.config = this.getDefaultConfig();
        config && this.setConfig(config);
        this.dependencies = dependencies;
    }

    HorizontalToolbar.prototype.getDefaultConfig = function () {
        return {
            hPadding : 3,
            vPadding : 3,
            borderRadius : 0,
            fill : convertColor('EBEBEB', 100),
            borderColor : convertColor('D1D0D0', 100),
            borderThickness : 1,
            offsetAdjustment : 1,
            radius: 0
        };
    };

    HorizontalToolbar.prototype.dispose = function () {
        var componentGroups = this.componentGroups,
            index = 0, length = componentGroups.length;

        for (; index < length; index++) {
            componentGroups[index].dispose();
        }

        componentGroups.length = 0;

        this.svgElems.toolbarRect.remove();
    };

    global.extend(HorizontalToolbar.prototype, /** @lends FusionCharts.HorizontalToolbar */ {
        /**
         * Draws a toolbar with all the component groups contained inside
         * @param {Number} x - x position of the drawn toolbar
         * @param {Number} y - y position of the drawn toolbar
         * @param {Object} parentGroup - group element where the toolbar needs to be drawn
         */
        draw: function (x, y, parentGroup) {
            var componentsGroups = this.componentGroups,
                dependencies = this.dependencies,
                paper = dependencies.paper,
                toolBarRect,
                startX = x,
                startY = y,
                toolbarConf = this.config,
                effectiveWidth,
                effectiveHeight,
                measurementTaken,
                groupSpacing,
                maxHeight = Number.NEGATIVE_INFINITY,
                svgElems = this.svgElems,
                group,
                index,
                length,
                thisToolbarLayer;

            thisToolbarLayer = svgElems.group;

            if (!thisToolbarLayer) {
                svgElems.group = thisToolbarLayer = paper.group('toolBarGroup', parentGroup);
            }

            toolBarRect = svgElems.toolBarRect;

            if (!toolBarRect) {
                toolBarRect = svgElems.toolbarRect = paper.rect({
                    height : 0,
                    width : 0,
                    x : startX,
                    y: startY
                }, thisToolbarLayer);
            }
            else {
                toolBarRect.attr({
                    height : 0,
                    width : 0,
                    x : startX,
                    y: startY
                });
            }

            startX += toolbarConf.hPadding;
            startY += toolbarConf.vPadding;
            for (index = 0, length = componentsGroups.length; index < length; index++) {
                group = componentsGroups[index];
                groupSpacing = group.config.spacing || 1;

                measurementTaken = group.draw({
                    x: startX + group.config.offsetX,
                    y: startY + group.config.offsetY
                }, parentGroup);

                // lastStartX = startX;
                // startX += measurementTaken.width + groupSpacing;

                // maxHeight = maxHeight > measurementTaken.height ? maxHeight : measurementTaken.height;
            }

            effectiveHeight = maxHeight;
            effectiveWidth = startX - groupSpacing - toolbarConf.hPadding - x;

            isFinite(effectiveHeight) || (effectiveHeight = 0);
            isFinite(effectiveWidth) || (effectiveWidth = 0);

            toolBarRect.attr({
                height : (effectiveHeight = effectiveHeight + 2 * toolbarConf.vPadding),
                width : (effectiveWidth = effectiveWidth + 2 * toolbarConf.hPadding)
            }).attr({
                fill : toolbarConf.fill,
                r : toolbarConf.radius,
                stroke : toolbarConf.borderColor,
                'stroke-width' : toolbarConf.borderThickness
            });

            return {
                height: effectiveHeight,
                width: effectiveWidth
            };
        },

        /**
         * Sets configuration of toolbar instance
         * @param {Object} config - configuration object
         */

        setConfig: function (config) {
            mergeConf(config, this.config);
            return this;
        },

        /**
         * Adds a component group to the toolbar instance
         * @param {Object} compoentGroup - instance of the component group created
         * @example
         * // Example to add component group
         * var componentGroup = new ComponentGroup(dependencies);
         * toolbar.addComponent(componentGroup);
         */

        addComponent: function (componentGroup) {
            this.componentGroups.push(componentGroup);
            return this;
        },

        /**
         * Gets logical space of the toolbar component
         * Returns an object containing the width and height of the toolbar instance
         * @return {object} width and height
         */

        getLogicalSpace: function (availableWidth, availableHeight) {
            var componentsGroups = this.componentGroups,
                config = this.config,
                dependencies = this.dependencies,
                index,
                length,
                group,
                width = 0,
                maxHeight = Number.NEGATIVE_INFINITY,
                groupSpacing,
                gLogicalSpace,
                rowIndex = 0,
                sumWidth = 0,
                sumHeight = 0,
                arr = [],
                flag = false,
                offsetY = 0;
            for (index = 0, length = componentsGroups.length; index < length; index++) {
                group = componentsGroups[index];
                groupSpacing = group.config.spacing || 1;
                gLogicalSpace = group.getLogicalSpace(dependencies, availableWidth - width - groupSpacing,
                    availableHeight - offsetY);

                // exceeds the max width
                if (width + gLogicalSpace.width + groupSpacing < availableWidth) {
                    group.config.offsetX = width;
                    width += gLogicalSpace.width + groupSpacing;
                    group.config.offsetY = offsetY;
                }
                else if (!flag){
                    if (!arr[rowIndex]) {
                        arr[rowIndex] = {};
                    }
                    arr[rowIndex].width = width;
                    offsetY += (arr[rowIndex].height = maxHeight);
                    index -= 1;
                    flag = true;
                    width = 0;
                    rowIndex += 1;
                    // @todo twice the logical space is being called.
                    continue;
                }

                maxHeight = maxHeight < gLogicalSpace.height ? gLogicalSpace.height : maxHeight;

                maxHeight += group.config.vPadding;
                flag = false;
            }

            if (!arr[rowIndex]) {
                arr[rowIndex] = {};
            }
            arr[rowIndex].width = width;
            arr[rowIndex].height = maxHeight;

            for (index = 0; index <= rowIndex; index += 1) {
                sumWidth = mathMax(sumWidth, arr[index].width);
                sumHeight += arr[rowIndex].height;
            }

            // @todo api should not include dirty check like this, but this is the need of the time.
            // if no components are created with spacing but hidden, returns 0
            if (!sumWidth) {
                return {
                    width: 0,
                    height: 0
                };
            }

            sumWidth -= groupSpacing - 2 * config.hPadding;
            // height = maxHeight;
            sumHeight += 2 * config.vPadding;

            return {
                width: sumWidth,
                height: sumHeight
            };
        }
    });

    /*
     * Creates a label
     * @namespace FusionCharts.Label
     * @constructor
     * @extends Symbol
     * @param {string} text - text to be displayed
     * @param {object} dependencies - modules required to create a label
     * @param {object} dependencies.paper - raphael element
     * @param {object} dependencies.smartLabel - smart Label module to calculate text dimensions
     * @param {object} config - configuration of label component
     * @param {object} config.text - text configuration
     * @param {object} config.text.style - text style
     */

    function Label (text, dependencies, config) {
        this.config = {
            container: {
                style: {
                    fill: '#7f7f7f',
                    'fill-opacity': '0',
                    'stroke-opacity': '0'
                }
            },
            text: {
                style: {
                    fill: '#000000',
                    'font-family': 'Lucida Grande',
                    'font-size': 12
                }
            },
            margin: {
                top: 0,
                bottom: 0,
                right: 5,
                left: 0
            }
        };

        this.text = text;
        this.dependencies = dependencies;
        this.svgElems = {};
        config && this.setConfig(config);
    }

    Label.prototype = Object.create(Symbol.prototype);


    Label.prototype.draw = function (x, y, group, groupHeight) {
        var config = this.config,
            textConf = config.text,
            style = textConf.style,
            paper = this.dependencies.paper,
            svgElems = this.svgElems,
            text = this.text,
            textNode = svgElems.node,
            textDim = this.textDimensions,
            containerConf = config.container,
            containerStyle = containerConf.style,
            height = containerConf.height || groupHeight,
            textX = x,
            containerNode = svgElems.containerNode,
            width = containerConf.width || textDim.width,
            textY = y;

        textX += width / 2;
        textY += (height || 0) / 2;

        if (!containerNode) {
            containerNode = svgElems.containerNode = paper.rect(group, true);
        }

        containerNode.attr({
            x: x,
            y: y,
            height: height,
            width: width
        });

        containerNode.attr(containerStyle);

        if (!textNode) {
            textNode = svgElems.node = paper.text(group, true);
        }

        textNode.attr({
            x: textX,
            y: textY,
            text: text
        });

        textNode.attr(style);

        return textNode;

    };

    global.extend(Label.prototype, /** lends FusionCharts.Label */ {
        /**
         * Gets the logical space of the label container
         * @return {object} width and height of the container
         */
        getLogicalSpace: function () {
            var config = this.config,
                dependencies = this.dependencies,
                textConf = config.text,
                textStyle = textConf.style,
                smartLabel = dependencies.smartLabel,
                style = {
                    fill: '#000000',
                    fontSize: textStyle['font-size'] + 'px',
                    fontFamily: textStyle['font-family']
                },
                containerConf = config.container,
                text = this.text,
                width,
                height,
                textDim;

            smartLabel.useEllipsesOnOverflow(1);

            smartLabel.setStyle(style);

            textDim = smartLabel.getOriSize(text);

            this.textDimensions = textDim;
            width = containerConf.width || textDim.width;
            height = containerConf.height || textDim.height;

            return {
                width: width,
                height: height
            };

        },

        getBoundElement: function () {
            return this.svgElems.node;
        }
    });

    toolBoxComponents = {
        HorizontalToolbar: HorizontalToolbar,
        ComponentGroup: ComponentGroup,
        Symbol: Symbol,
        SymbolStore: SymbolStore,
        SymbolWithContext: SymbolWithContext,
        UniSelectComponentGroup: UniSelectComponentGroup,
        MultiSelectComponentGroup: MultiSelectComponentGroup,
        Scroller: Scroller,
        SymbolLabelWithContext: SymbolLabelWithContext,
        CheckboxSymbol: CheckboxSymbol,
        InputTextBoxSymbol: InputTextBoxSymbol,
        SelectSymbol: SelectSymbol,
        Label: Label
    };

    FusionCharts.registerComponent('api', 'toolbox', toolBoxComponents);
}]);

FusionCharts.register('module', ['private', 'modules.renderer.js-component-spacemanager', function () {
    var global = this,
        mathRound = Math.round;

    /**
     * SpaceManager helps you to register and allocate space for different modules and chart elements. Using it, one can
     * allocate place to different extensions in the chart. Try different orientations, alignments to suit your needs.
     * @namespace FusionCharts.SpaceManager
     * @param {object} options - The options.
     */
    function SpaceManager (options) {
        this.init(options);
    }

    function VerticalSwimLane () {
        SpaceManager.apply(this, arguments);
    }

    function VerticalSwimLane3 () {
        VerticalSwimLane1.apply(this, arguments);
    }

    function HorizontalSwimLane () {
        VerticalSwimLane.apply(this, arguments);
    }

    function Modules () {
        HorizontalSwimLane.apply(this, arguments);
    }




    SpaceManager.prototype.constructor = SpaceManager;

    SpaceManager.prototype.init = function (options) {
        var manager = this,
            config;

        manager.componentArr = [];

        config = (manager.config = {});

        config.name = options.name;
        config.pIndex = options.pIndex;
        config.index = options.index;
        config.width = options.width;
        config.x = options.x;
        config.y = options.y;
        config.height = options.height;
        config.type = options.type;
        config._parentInstance = options._parentInstance;
        // for horizontal swimline capping.
        config.minHeight = options.minHeight;
        // for vertical swimline capping.
        config.minWidth = options.minWidth;

        config.alignment = options.alignment;
        config.layout = options.layout;
        config.dimensions = options.dimensions;

        config.initProp = options.initProp;

        manager.linkedItems = {};

        manager.preDrawHook = options.preDrawHook;
        config.padding = options.padding || manager.getStubPadding;

        manager.getLinkedItems('VerticalSwimLane', VerticalSwimLane);
        manager.getLinkedItems('VerticalSwimLane1', VerticalSwimLane1);
        manager.getLinkedItems('VerticalSwimLane2', VerticalSwimLane2);
        manager.getLinkedItems('VerticalSwimLane3', VerticalSwimLane3);
        manager.getLinkedItems('VerticalSwimLane4', VerticalSwimLane4);
        manager.getLinkedItems('HorizontalSwimLane', HorizontalSwimLane);
        manager.getLinkedItems('HorizontalSwimLane1', HorizontalSwimLane1);
        manager.getLinkedItems('SpaceManager', SpaceManager);
        manager.getLinkedItems('Modules', Modules);

        manager.getLinkedItems('ref', options.ref);

        return manager;
    };
    SpaceManager.prototype.getTypes = (function () {
        var vAlign = {
            top: {
                key: 0
            },
            middle: {
                key: 1
            },
            bottom: {
                key: 2
            }
        },
        hAlign = {
            left: {
                key: 0
            },
            center: {
                key: 1
            },
            right: {
                key: 2
            }
        },
        config = {
            orientation: {
                horizontal: {
                    key: 1,
                    position: {
                        top: {
                            key: 0,
                            align: hAlign
                        },
                        bottom: {
                            key: 1,
                            align: hAlign
                        }
                    }
                },
                vertical: {
                    key: 0,
                    position: {
                        left: {
                            key: 0,
                            align: vAlign
                        },
                        right: {
                            key: 1,
                            align: vAlign
                        }
                    }
                }
            },
            layout: {
                block: {
                    key: 0
                },
                inline: {
                    key: 1
                }
            }
        };

        return function (key, obj) {
            if (!obj) {
                obj = config;
            }
            return obj[key];
        };
    })();

    SpaceManager.prototype.getCanvasGroup = function (index) {
        return this.cacheByName('Canvas' + (index || 0) + 'Group');
    };

    SpaceManager.prototype.registerModule = function (configObj) {
        var extensionContainer,
            position = configObj.position;
        // its vertical
        if (configObj.orientation) {
            extensionContainer = position ? 'Extension4' : 'Extension1';
        }
        // horizontal
        else {
            extensionContainer = position ? 'Extension3' : 'Extension2';
        }

        this.cacheByName(extensionContainer)
        .addComponent([{
            type: 'Modules',
            index: 0,
            pIndex: 2,
            name: configObj.name,
            alignment: configObj.alignment,
            ref: configObj.selfRef,
            layout: configObj.layout,
            dimensions: configObj.dimensions,
            preDrawHook: configObj.preDrawHook
        }]);
    };
    // Assign initProportions and index if not having so.
    SpaceManager.prototype.assignProportions = function () {
        var component,
            i,
            val,
            unitExcess,
            manager  = this,
            componentArr = manager.componentArr,
            len = componentArr.length,
            excess = 0,
            count = 0;

        for (i = 0; i < len; i += 1) {
            component = componentArr[i];
            if (component.assignProportions){
                if (val = component.assignProportions()) {
                    excess +=  val;
                }
                else {
                    count += 1;
                }
            }
        }

        if (!len || excess === 1) {
            excess = this.config.initProp;
            this.config.initProp = 0;
        }

        if (excess && count) {
            unitExcess = excess / count;
            for (i = 0; i < len; i += 1) {
                component = componentArr[i];
                if (component.config.initProp) {
                    component.config.initProp += unitExcess;
                }
            }
            excess = 0;
        }
        return excess;
    };

    SpaceManager.prototype.cacheByName = function (key, value) {
        var manager = this,
            config = manager.config,
            cache;

        if (!(cache = config._cache)) {
            cache = config._cache = {};
        }
        if (value) {
            cache[key] = value;
        }

        return cache[key];
    };

    SpaceManager.prototype.addComponent = function (componentArr, index) {
        var i,
            len,
            child,
            manager = this,
            childComponents = manager.componentArr || (manager.componentArr = []),
            spaceManager = manager.getParents()[0],
            ChildFactory,
            component,
            j;

        for (i = 0, len = componentArr.length; i < len; i += 1) {
            component = componentArr[i];
            ChildFactory = manager.getLinkedItems(component.type);
            component._parentInstance = manager;
            child = new ChildFactory(component);
            // if name is specified, cache it.
            component.name && spaceManager.cacheByName(component.name, child);
            child.getId();
            if (component.components) {
                child.addComponent(component.components);
            }
            if (index !== undefined) {
                childComponents.splice(index, 0, child);
                // temp code: Shift all rest elements and reassign their index.
                for (j = index + 1; j < childComponents.length; j += 1) {
                    childComponents[j].config.index += 1;
                }
            }
            else {
                childComponents.push(child);
            }
        }

        return manager;
    };

    SpaceManager.prototype.getStubPadding = function () {
        return {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        };
    };

    SpaceManager.prototype.equiAllotment = function () {
        var i,
            len,
            componentArr = this.componentArr,
            paddingObj = this.config.padding();

        if (componentArr) {
            componentArr.sort(this.sortAsIndex);
        }

        if (!this.getComponentCount()) {
            this.getComponentCount(componentArr.length);
        }

        // If there are no dimensions yet assigned by configurations, assign the default unit dimensions.
        if (!this.getWidth()) {
            this.getWidth(this.getUnitWidth() - paddingObj.left - paddingObj.right);
        }

        if (!this.getHeight()) {
            this.getHeight(this.getUnitHeight() - paddingObj.bottom - paddingObj.top);
        }
        if (!this.getX()) {
            this.getX(this.equiX(paddingObj));
        }

        if (!this.getY()) {
            this.getY(this.equiY(paddingObj));
        }

        for (i =0, len = componentArr.length; i < len; i += 1) {
            componentArr[i].getIndex(i);
            componentArr[i].equiAllotment();
        }
    };

    SpaceManager.prototype.restoreWidth = function () {
        var config = this.config;
        config.x = config._x;
        config._x = null;
        config.width = null;
    };

    SpaceManager.prototype.restoreHeight = function () {
        var config = this.config;
        config.y = config._y;
        config._y = null;
        config.height = null;
    };

    SpaceManager.prototype.resizeTo = function (newDimenesions) {
        var self = this,
            config = self.config,
            // Avoid resizing for same dimension resizing.
            isResizing = false,
            oldWidth = self.getWidth(),
            newWidth = newDimenesions.width || oldWidth,
            oldHeight = self.getHeight(),
            newHeight = newDimenesions.height || oldHeight;

        // Restores to the position before equi-allotment, i.e. back to the state post component addition.
        if (oldHeight !== newHeight) {
            self.recurse(function () {
                this.restoreHeight();
            });
            isResizing = true;
        }
        if (oldWidth !== newWidth) {
            self.recurse(function () {
                this.restoreWidth();
            });
            isResizing = true;
        }

        config.height = newHeight;
        config.width = newWidth;

        if (isResizing) {
            self.recurse(self.doNotDraw, false, true);
            self.equiAllotment();
            self.allocate(true);
        }
    };

    SpaceManager.prototype.getParents = function (arr) {
        var manager = this,
            parentInstance;

        if (!arr) {
            arr = [manager];
        }

        parentInstance = manager.getParentComponentGroup();
        if (parentInstance) {
            arr.unshift(parentInstance);
            return parentInstance.getParents(arr);
        }
        else {
            return arr;
        }
    };


    SpaceManager.prototype.getUnitX = function () {
        return 0;
    };

    SpaceManager.prototype.getUnitY = SpaceManager.prototype.getUnitX;

    SpaceManager.prototype.sortAsPriority = function (a, b) {
        return a.config.pIndex - b.config.pIndex;
    };

    SpaceManager.prototype.sortAsIndex = function (a, b) {
        return a.config.index - b.config.index;
    };

    SpaceManager.prototype.sortComponentsAsIndex = function (a, b) {
        return a.config.index - b.config.index;
    };

    SpaceManager.prototype.getParentComponentGroup = function () {
        return this.config._parentInstance;
    };

    SpaceManager.prototype.getLinkedItems = function (key, value) {
        if (value) {
            this.linkedItems[key] = value;
        }
        return this.linkedItems[key];
    };

    SpaceManager.prototype.getComponentCount = function (val, hardCoded) {
        if (val) {
            this.config.componentCount = val;
        }
        else if (hardCoded) {
            this.config.componentCount = val;
        }
        return this.config.componentCount;
    };

    SpaceManager.prototype.setWidth = function (width, incremental) {
        var self = this,
            config = self.config,
            Modules = self.getLinkedItems('Modules');

        if (self.constructor !== Modules) {
            if (incremental) {
                config.width += width;
            }
            else if (width !== undefined) {
                config.width = width;
            }
        }

        return this.config.width;
    };

    SpaceManager.prototype.getWidth = function () {

        var self = this,
            config = self.config,
            x = config.width,
            res,
            isFunction = self.isFunction;

        if (isFunction(x)) {
            res = x.apply(self);
            if (typeof res === 'string' || !isNaN(res)) {
                config.width = res;
                return res;
            }
            else {
                return x;
            }
        }
        else {
            return self.setWidth.apply(self, arguments);
        }
    };

    SpaceManager.prototype.setHeight = function (height, incremental, shift) {
        var self = this,
            neighbours,
            lowerComponent,
            config = self.config,
            Modules = self.getLinkedItems('Modules'),
            HorizontalSwimLane = self.getLinkedItems('HorizontalSwimLane');
        if (self.constructor !== Modules) {

            if (incremental) {
                config.height = Math.max(config.height + height, 0);
            }
            else if (height !== undefined && height >= 0) {
                config.height = height;
            }
        }
        if (shift && self.constructor === HorizontalSwimLane) {
            neighbours = self.getAdjComponents() || [];
            // for height adjustment in Horizontal Swim line
            if (lowerComponent = neighbours[1]) {
                lowerComponent.recurse(lowerComponent.getY, config.height + self.getY() - lowerComponent.getY(), true);
            }
        }
        return this.config.height;
    };
    // @todo: Repeatable code as in getWidth.
    SpaceManager.prototype.getHeight = function () {
        var self = this,
            config = self.config,
            x = config.height,
            res,
            isFunction = self.isFunction;

        if (isFunction(x)) {
            res = x.apply(self);
            if (typeof res === 'string' || !isNaN(res)) {
                config.height = res;
                return res;
            }
            else {
                return x;
            }
        }
        else {
            return self.setHeight.apply(self, arguments);
        }
    };

    SpaceManager.prototype.getUnitWidth = function () {
        var manager = this;
        return manager.getWidth() / manager.getComponentCount();
    };

    SpaceManager.prototype.getUnitHeight = function () {
        return this.getHeight();
    };

    SpaceManager.prototype.doNotDraw = function (flag, hardSet) {
        if (flag) {
            this.config.doNotDraw = !!flag;
        }
        else if (hardSet) {
            this.config.doNotDraw = !!flag;
        }
        return this.config.doNotDraw;
    };

    SpaceManager.prototype.sortDependency = function () {
        var group = this,
            dependants = group.dependants || [],
            i,
            len;
        for (i = 0, len = dependants.length; i < len; i += 1) {
            dependants[i].allocate();
        }
        group.dependants = undefined;
        group.dependantObj = undefined;
    };

    SpaceManager.prototype.registerDependency = function (sibling) {
        var manager = this,
            dependants,
            dependantObj,
            siblingId = sibling.getId();
        if (!(dependants = manager.dependants)) {
            dependants = (manager.dependants = []);
        }

        if (!(dependantObj = manager.dependantObj)) {
            dependantObj = (manager.dependantObj = {});
        }
        // prevent multiple dependency registration.
        if (!dependantObj[siblingId]) {
            dependants.unshift(sibling);
            dependantObj[siblingId] = true;
        }
    };

    SpaceManager.prototype.getId = function () {
        var manager = this,
            config = manager.config;

        if (!config._id) {
            config._id = Math.random()*16|0 + '';
        }

        return config._id;
    };

    SpaceManager.prototype.getIndex = function (val) {
        var config = this.config;
        if (val !== undefined) {
            config.index = val;
        }
        return config.index;
    };

    SpaceManager.prototype.getName = function (name) {
        var config = this.config;
        if (name) {
            config.name = name;
        }
        return config.name;
    };

    SpaceManager.prototype.setX = function (val, incremental) {
        if (incremental) {
            if (+this.config.x) {
                this.config.x += val;
            }
            else if (+this.config._x){
                this.config._x += val;
            }
        }
        else if (val !== undefined) {
            this.config.x = val;
        }
        return this.config.x;
    };

    SpaceManager.prototype.getX = function() {
        var self = this,
            config = self.config,
            x = config.x,
            res,
            isFunction = self.isFunction;
        if (isFunction(x)) {
            if (!isNaN(res = x.apply(self))) {
                self.adjustX(res);
                return self.setX(res);
            }
            else {
                return x;
            }
        }
        else {
            return self.setX.apply(self, arguments);
        }

    };

    SpaceManager.prototype.get = function (key, moduleName) {
        var self = this,
            spaceManager = self.getParents()[0],
            module = spaceManager.cacheByName(moduleName),
            val = module && module.config[key];
        if (!module) {
            self.createAbstractModules(spaceManager, key, moduleName);
        }
        else if (!(Number(val))) {
            module.getParentComponentGroup().registerDependency(self);
        }
        return val;
    };
    SpaceManager.prototype.createAbstractModules = function (spaceManager, key, moduleName) {
        var dummyObj,
            keyObj;
        if (!(dummyObj = spaceManager._dummy)) {
            dummyObj = spaceManager._dummy = {};
        }
        if (!(keyObj = dummyObj[key])) {
            keyObj = dummyObj[key] = {};
        }
        if (!keyObj[moduleName]) {
            keyObj[moduleName] = {};
        }
        keyObj[moduleName][this.getName() || this.getId()] = this;
    };
    SpaceManager.prototype.getY = function(val, incremental) {
        if (incremental) {
            if (+this.config.y) {
                this.config.y += val;
            }
            else if (+this.config._y){
                this.config._y += val;
            }
        }
        else if (val !== undefined) {
            this.config.y = val;
        }
        return this.config.y;
    };

    SpaceManager.prototype.clipGroupElement = function (group/*, x, y, width, height*/) {
        // var relaxation = 10;
        /*group.attr('clip-rect', [x - relaxation, y - relaxation, width + (relaxation * 2),
            height + (relaxation * 2)]);*/
        return group;
    };

    SpaceManager.prototype.setDrawingConfiguration = function (containerGroup, paper) {
        var manager = this,
            cb = this.clipGroupElement,
            componentArr = manager.componentArr,
            ref = manager.getLinkedItems('ref'),
            len,
            x,
            y,
            width,
            height,
            i;
        if (!containerGroup) {
            containerGroup = paper.group('containerGroup');
        }
        componentArr.sort(manager.sortAsPriority);
        // The last boolean arguments is to do only those calculations which were not meant for re-allocations.
        manager.preDrawHook && manager.preDrawHook.call(manager, true);
        for (i = 0, len = manager.getComponentCount(); i < len; i += 1) {
            componentArr[i].setDrawingConfiguration(containerGroup, paper);
        }

        if (manager.constructor === Modules) {
            /*console.log(manager.getName(),manager.getX(), manager.getY(), manager.getWidth(), manager.getHeight());*/
            if (ref && ref.setDrawingConfiguration) {
                x = manager.getX();
                y = manager.getY();
                width = manager.getWidth();
                height = manager.getHeight();
                if (!manager.group) {
                    manager.group = cb((ref.getDefaultGroup && ref.getDefaultGroup()) || paper.group(manager.getName(),
                        containerGroup), x, y, width, height);
                }
                ref.setDrawingConfiguration(x, y, width, height, manager.group);
            }
        }
    };

    SpaceManager.prototype.draw = function () {
        var manager = this,
            componentArr = manager.componentArr,
            len,
            ref = manager.getLinkedItems('ref'),
            i;
        componentArr.sort(manager.sortAsPriority);

        for (i = 0, len = manager.getComponentCount(); i < len; i += 1) {
            componentArr[i].draw();
        }

        if (manager.constructor === Modules) {
            ref && ref.draw(manager.getX(), manager.getY(), manager.getWidth(), manager.getHeight());
        }
    };

    SpaceManager.prototype.getPriority = function () {
        return this.config.pIndex;
    };

    SpaceManager.prototype.allocate = function (dontEquiAllot) {
        var component,
            i,
            prevHeight,
            oldUsedConfig,
            h,
            mostPriorElement,
            usedConfig,
            manager = this,
            componentArr = manager.componentArr,
            excessHeight = 0,
            len = componentArr.length,
            checkAllocate = function (component, height) {
                component.recurse(component.getHeight, height, true);
                component.reset();
                return component.allocate();
            };

        // Initially equi allot all the components, just before the final allocations.
        if (!dontEquiAllot) {
            manager.assignProportions();
            manager.equiAllotment();
        }
        if (componentArr) {
            componentArr.sort(manager.sortAsPriority);
        }
        for (i = 0; i < len; i += 1) {
            component = componentArr[i];
            usedConfig = component.allocate();
            component.usedConfig = usedConfig;
            excessHeight += usedConfig.excess;
        }
        /*Calling the pre-hooks before crunching the space was essential as because of this preDrawingHook,
        the space requirements might change, and there might be a requirement for more space.*/
        this.recurse(function(){
            this.preDrawHook && this.preDrawHook();
        });
        componentArr.sort(manager.sortAsIndex);
        for (i = 0; i < len; i += 1) {
            component = componentArr[i];
            usedConfig = component.usedConfig;
            if (usedConfig.excess) {
                component.adjustY(-usedConfig.excess);
                manager.adjustX(-usedConfig.excess, i + 1);
            }
            else if (usedConfig.queue.length) {
                h = component.getHeight();
                component.adjustY(-h);
                manager.adjustX(-h, i + 1);
                excessHeight += h;
            }
        }
        if (excessHeight) {
            for (i = 0; i < len; i += 1) {
                componentArr.sort(manager.sortAsPriority);
                component = componentArr[i];
                oldUsedConfig = component.usedConfig;
                if (oldUsedConfig.queue.length) {
                    prevHeight = component.getHeight();
                    usedConfig = checkAllocate(component, excessHeight);
                    if (usedConfig.queue.length < oldUsedConfig.queue.length) {
                        component.adjustY(-usedConfig.excess);
                        // @ todo: Repeated sorting might be avoided by caching the index.
                        componentArr.sort(manager.sortAsIndex);
                        h = component.getHeight() - prevHeight;
                        manager.adjustX(h, component.getIndex() + 1);
                        excessHeight -= h;
                    }
                    else {
                        checkAllocate(component, -excessHeight);
                    }
                }
            }
        }
        if (excessHeight) {
            componentArr.sort(manager.sortAsPriority);
            mostPriorElement = componentArr[0];
            mostPriorElement.adjustY(excessHeight);
            componentArr.sort(manager.sortAsIndex);
            manager.adjustX(excessHeight, mostPriorElement.config.index + 1);
            mostPriorElement.reset();
            mostPriorElement.allocate(true);
        }

        manager.sortAbstractModules();
        return manager;
    };

    SpaceManager.prototype.adjustX = function (excess, index) {
        var i,
            j,
            component,
            childComponent,
            len1,
            manager = this,
            componentArr = manager.componentArr,
            len = componentArr.length;
        for (i = index; i < len; i += 1) {
            component = componentArr[i];
            component.config.y += excess;

            for (j = 0, len1 = component.componentArr.length; j < len1; j += 1) {
                childComponent = component.componentArr[j];
                childComponent.config.y += excess;
                childComponent.adjustY && childComponent.adjustY(excess);
            }
        }
    };

    SpaceManager.prototype.sortAbstractModules = function () {
        var manager = this,
            spaceManager = manager.getParents()[0],
            dummyObj = manager._dummy,
            keyObj,
            name,
            obj,
            nameObj,
            sumFactor,
            sumParent,
            moduleObj,
            unit,
            parentGroup,
            dimension,
            diff,
            key,
            module,
            lowerComponent;

        for (key in dummyObj) {
            keyObj = dummyObj[key];
            for (name in keyObj) {
                // only for height for now.

                // register the abstract module for height of unit.
                obj = {
                    config: {}
                };
                obj.config[key] = 1; // set to unity.
                spaceManager.cacheByName(name, obj);

                // iterate across all the elements to fetch the scale factored height.
                // store their parent sum of height as well.
                nameObj = keyObj[name];
                sumFactor = 0;
                sumParent = 0;
                for (module in nameObj) {
                    moduleObj = nameObj[module];
                    sumFactor += moduleObj.config[key].call(moduleObj);
                    sumParent += moduleObj.getParentComponentGroup().config[key];
                }
                // decide the unit height for each of them.
                unit = sumParent / sumFactor;

                // reset the unit key and update the cache.
                obj.config[key] = unit;
                spaceManager.cacheByName(name, obj);

                // and adjust their keys
                for (module in nameObj) {
                    moduleObj = nameObj[module];
                    dimension = moduleObj.config[key] = moduleObj.config[key].call(moduleObj);
                    parentGroup = moduleObj.getParentComponentGroup().getParentComponentGroup();
                    // @todo:: Hardcoded for height only.
                    // Get the diff for the key.
                    diff = parentGroup.config[key] - dimension;
                    parentGroup.recurse(parentGroup.getHeight, dimension);

                    parentGroup.allocate();
                    // Get component on the lower.
                    lowerComponent = parentGroup.getAdjComponents()[1];

                    while (lowerComponent) {
                        if (diff > 0) {
                            // If excess pull the y for the remaining groups.
                            lowerComponent.recurse(lowerComponent.getY, -diff, true);
                        }
                        else {
                            // If shortage, push the lower components below.
                            lowerComponent.recurse(lowerComponent.getY, -diff, true);
                        }
                        lowerComponent = lowerComponent.getAdjComponents()[1];

                    }
                }
            }
        }
        manager._dummy = undefined;
    };

    SpaceManager.prototype.getAdjComponents = function () {
        var component = this,
            index = component.getIndex(),
            parentInstance = component.getParentComponentGroup(),
            componentArr = parentInstance && parentInstance.componentArr || [],
            _componentArr = componentArr && componentArr.slice(0);
        // todo: This is performance costly. But we are sorting as per index while adding component. And sorting as per
        // priority when allocating. But when to fetch the adjoining information while allocation, we need this.
        if (_componentArr) {
            _componentArr.sort(component.sortComponentsAsIndex);
            return [_componentArr[index - 1] , _componentArr[index + 1]];
        }
    };

    SpaceManager.prototype.recurse = function () {
        var i,
            len,
            manager = this,
            args = Array.prototype.slice.call(arguments, 0),
            fn = args.shift(),
            componentArr = manager.componentArr;

        fn.apply(manager, args);
        args.unshift(fn);
        len = componentArr.length;
        if (fn === manager.getHeight && manager.constructor === VerticalSwimLane) {
            args[1] /= len;
        }
        for (i = 0; i < len; i += 1) {
            // fn.apply(componentArr[i], args);
            componentArr[i].recurse.apply(componentArr[i], args);
        }
        return manager;
    };
    /*
     * Check if its an instance of Function, i.e. fn is a function or not.
    */
    SpaceManager.prototype.isFunction = function (fn) {
        if (fn) {
            return fn instanceof Function;
        }
    };

    SpaceManager.prototype.dispose = function () {
        var i,
            j,
            len,
            l,
            key,
            componentArr,
            self = this,
            keys = Object.keys(self);

        for (i = 0, l = keys.length; i < l; i += 1) {
            key = keys[i];
            if (key === 'componentArr') {
                for (j = 0, componentArr = self.componentArr, len = componentArr.length; j < len; j += 1) {
                    componentArr[i].dispose();
                }
            }
            self[key] = undefined;
            delete self[key];
        }
    };

    SpaceManager.prototype.equiX = function () {
        return this.getUnitX();
    };

    SpaceManager.prototype.equiY = function (paddingObj) {
        return this.getUnitY() + paddingObj.top;
    };

    SpaceManager.prototype.reset = function () {
        var i,
            len,
            manager = this,
            componentArr = manager.componentArr;
        for (i = 0, len = componentArr.length; i < len; i += 1) {
            componentArr[i].reset();
        }
        return this;
    };


    global.extend(SpaceManager.prototype, /** @lends FusionCharts.SpaceManager# */ {
        /*
         * @typedef alignment
         * @type {array}
         * @property {function} alignment.type - This specifies the alignment of the module. In case of horizontal
         * orientations, this can be either `left`, `center` or `right`. Whereas in case of the vertical orientations,
         * it can assume any of the values from `top`, `middle` or `bottom` alignments.
         * @property {array} alignment.dimensions - The list of supported dimensions. A dimension can be of either of
         * the formats:
         *
         * @example
         * // General implementation
         * {
         *      width: 40,
         *      height: 30
         * }
         * // In range mode. Here width is given in range format. Similarly range can be given for the height property.
         * {
         *      width: {
         *         max: 50,
         *           min: 35
         *      },
         *      height: 30
         * }
        */

        /**
         * @typedef position
         * @type {array}
         * @property {function} position.type - Determines the positon of the module. In case of horizontal orientation
         * it can be placed to `left` or `right` whereas in case of vertical orientation it takes the `top` or `bottom`
         * positions.
         * @property {alignment} position.dimension - List of possible dimensions a module can be allocated.
        */

        /**
         * @typedef orientation
         * @type {array}
         * @property {function} orientation.type - Type of orientation, e.g. horizontal or vertical.
         * @property {position} orientation.position - The positional informations of the module for that orientation.
        */

        /**
         * Registers an extension module to the spaceManager.
         * @example
         * // An example to add a module to the spaceManager.
         * new SpaceManager().add([{
         *
         *      name: function () {
         *          return 'ToolBoxExt';
         *      },
         *
         *      // `obj` {object} - Collection of all the canvasImpl instances.
         *      // `0` here returns the first canvas module reference,
         *      // i.e. the 'ToolBoxExt' is to be allocated wrt the first canvas module of the chart.
         *
         *      ref: function(obj) {
         *          return obj['0'];
         *      },
         *
         *      self: function () {
         *          return this;
         *      },
         *
         *      priority: function () {
         *          return 2;
         *       },
         *      layout: function (obj) {
         *          return obj.inline;
         *      },
         *      orientation: [{
         *          type: function (obj) {
         *              return obj.horizontal;
         *          },
         *          position: [{
         *              type: function (obj) {
         *                  return obj.bottom;
         *              },
         *              alignment: [{
         *                  type: function (obj) {
         *                      return obj.left;
         *                  },
         *                  dimensions: [{
         *                      height: 30,
         *                      width: {
         *                          max: 130,
         *                          min: 120
         *                      }
         *                  }]
         *              }]
         *          }]
         *      }]
         *  }]);
         *
         * @param {array} configArr The options that pertain to the new module element to be added.
         * @param {function} configArr[].name - Returns the name of the module in a {string} format.
         * @param {function} configArr[].ref - Reference of the parent module around which the module has to be placed.
         * @param {function} configArr[].self - The self-refernce to the constructor class. The space manager invokes
         * the placeInCanvas and setDrawingConfiguration methods of this instance.
         * @param {function} configArr[].priority - Sets the priority of the module which helps the space manager to
         * decide which module to show/ hide during space crunching situations.
         *
         * The different priority options that the spaceManager provides are:
         *
         * a. `1` - Non-core chart elements like legend, caption, navigation bar.
         *
         * b. `2` - (default) Crucial extension modules.
         *
         * c. `3` - Relatively less important  extension modules, whose full visibility can be compromised
         * during absolute space crunching situations.
         *
         * @param {function} configArr[].layout - Sets the layout option for the module. It can be:
         *
         * 1. `block` - In this layout option, no other elements is placed adjacent to it.
         *
         * 2. `inline` - In this layouting, other elements can also be placed adjacent to it.
         *
         * @param {orientation} configArr[].orientation - Reference of the parent module around which the module has
         * to be placed.
         */
        add: function (configArr) {
            var self = this,
                i,j,k,l,
                preDrawHook,
                orientConfig,
                position,
                positionConfig,
                alignment,
                alignConfig,
                len1, len2, len3,
                len = (configArr || []).length,
                config,
                layout,
                priority,
                ref,
                minDimension,
                name,
                orientation,
                canvasContainer = self.cacheByName('canvasContainer'),
                selfRef,
                getTypes = self.getTypes;

            // todo: Need to create scope for default values. Now there is always an exhaustive options.
            for (i = 0; i < len; i += 1) {
                config = configArr[i];
                // todo: This is temporarily a function only. Need to suport also for string returns.
                // todo: Also one module can refer to some module, thats not yet registered.
                ref = config.ref({
                    0: canvasContainer
                });

                minDimension = config.minDimension;
                // todo: This is an unique id. If exists or not defined. create a unique UID everytime.
                name = config.name();

                preDrawHook = config.preDrawHook;

                selfRef = config.self();

                layout = config.layout(getTypes('layout')).key;

                priority = config.priority();

                orientation = config.orientation;

                for (j = 0, len1 = orientation.length; j < len1; j += 1) {
                    config = orientation[j];
                    // todo: create scope to deal with the function definations.
                    orientConfig = config.type(getTypes('orientation'));

                    position = config.position;

                    for (k = 0, len2 = position.length; k < len2; k += 1) {
                        config = position[k];
                        positionConfig = config.type(getTypes('position', orientConfig));

                        // todo: Get a default alignment for a particular type of orientation.
                        alignment = config.alignment;

                        for (l = 0, len3 = alignment.length; l < len3; l += 1) {
                            config = alignment[l];
                            alignConfig = config.type(getTypes('align', positionConfig));

                            // todo: for now, either width can mentioned in range or that of height.
                            self.registerModule({
                                dimensions: config.dimensions,
                                priority: priority,
                                layout: layout,
                                alignment: alignConfig.key,
                                orientation: orientConfig.key,
                                position: positionConfig.key,
                                name: name,
                                minDimension: minDimension,
                                selfRef: selfRef,
                                ref: ref,
                                preDrawHook: preDrawHook
                            });
                        }
                    }
                }
            }
        }
    });












    VerticalSwimLane.prototype = Object.create(SpaceManager.prototype);
    VerticalSwimLane.prototype.constructor = VerticalSwimLane;

    /*
     * Checks if the diff is applied to the current width, does it exceeds the minimum capping.
    */
    VerticalSwimLane.prototype.exceedMinWidth = function (diff) {
        var self = this,
            config = self.config,
            minWidth = config.minWidth,
            isFunction = self.isFunction;

        // Check if the user has applied the minHeight as a valid number.
        if (isFunction(minWidth)) {
            config.minWidth = minWidth.apply(self, self.getParents());
        }
        if (+minWidth && self.getWidth() + diff < minWidth) {
            return true;
        }
    };

    VerticalSwimLane.prototype.getUnitWidth = function () {
        var self = this,
            parentInstance = self.getParentComponentGroup(),
            initProp = self.config.initProp,
            width;
        if (!parentInstance.config.allotedX) {
            parentInstance.config.allotedX = 0;
        }
        if (initProp !== undefined) {
            width = parentInstance.getWidth() * initProp;
        }
        else {
            width = self * parentInstance.getWidth() / parentInstance.getComponentCount();
        }
        parentInstance.config.allotedX += width;
        return width;
    };

    VerticalSwimLane.prototype.getUnitHeight = function () {
        return this.getParentComponentGroup().getHeight();
    };

    VerticalSwimLane.prototype.getUnitX = function () {
        var parentInstance = this.getParentComponentGroup();
        return parentInstance.config.allotedX - this.getWidth() + parentInstance.getX();
    };

    VerticalSwimLane.prototype.getUnitY = function () {
        return this.getParentComponentGroup().getY();
    };

    VerticalSwimLane.prototype.childrenAllocation = function () {
        var manager = this,
            componentArr = manager.componentArr,
            len,
            i,
            component,
            usedSpace,
            sumWidth = 0,
            sumHeight = 0,
            totHeight = manager.getHeight(),
            componentHeight,
            componentWidth,
            parentInstance = manager.getParentComponentGroup();

        if (componentArr) {
            componentArr.sort(manager.sortAsPriority);
        }

        for (i = 0, len = componentArr.length; i < len; i += 1) {

            component = componentArr[i];
            usedSpace = component.allocate();
            componentHeight = usedSpace.height;
            componentWidth = usedSpace.width;

            if (+componentHeight && +sumHeight !== undefined) {
                if ((sumHeight + componentHeight) <= totHeight) {
                    sumHeight += componentHeight;
                }
                else {
                    // vertical takes care of width.
                    // so an excess in height, should be taken care by the parentInstance
                    if (parentInstance.adjustY && parentInstance.adjustY((sumHeight + componentHeight))) {
                        sumHeight += componentHeight;
                    }
                    else {
                        // donot draw the component even parent was not successful in distributing the excess.
                        component.doNotDraw(true);
                    }
                }
            }
            else {
                sumHeight = componentHeight;
            }

            if (+componentWidth  && +sumWidth !== undefined) {
                // if (componentWidth > totWidth) {
                //     component.doNotDraw(true);
                //     +componentHeight && (sumHeight -= componentHeight);
                // }
                // else {
                !component.doNotDraw() && (sumWidth = Math.max(sumWidth, componentWidth));
                // }
            }
            else {
                sumWidth = componentWidth;
            }
        }
        return {
            width: sumWidth,
            height: sumHeight
        };
    };

    VerticalSwimLane.prototype.allocate = function () {
        var manager = this,
            diff,
            neighbours,
            topComponent,
            lowerComponent,
            usedSpace,
            sumWidth = 0,
            sumHeight = 0,
            offset1,
            offset2,
            totWidth = manager.getWidth();

        usedSpace = manager.childrenAllocation();
        sumWidth = usedSpace.width;
        sumHeight = usedSpace.height;
        // todo: If a component demands more than its parents containment, not possible.
        if ((diff = totWidth - sumWidth) > 0 || !isNaN(diff)) {
            neighbours = manager.getAdjComponents();

            if (topComponent = neighbours[0]) {
                topComponent = (topComponent.getPriority() < manager.getPriority()) ? topComponent : null;
            }
            if (lowerComponent = neighbours[1]) {
                lowerComponent = (neighbours[1].getPriority() < manager.getPriority()) ? lowerComponent : null;
            }

            if (topComponent && topComponent.getComponentCount() && lowerComponent &&
                lowerComponent.getComponentCount()) {
                offset1 = offset2 = diff / 2;
            }
            else if (topComponent && topComponent.getComponentCount()) {
                offset1 = diff;
                if (topComponent.exceedMinWidth(offset1)) {
                    sumWidth += offset1;
                    offset1 = 0;
                }
            }
            else if (lowerComponent && lowerComponent.getComponentCount()) {
                offset2 = diff;
                if (lowerComponent.exceedMinWidth(offset2)) {
                    sumWidth += offset2;
                    offset2 = 0;
                }
            }
            if (offset1 || offset2) {
                manager.recurse(manager.getWidth, sumWidth);
            }
            else if (diff < 0){
                // If there is no lower priority component to overflow the data, hide the manager for a -ve diff.
                manager.recurse(manager.doNotDraw, true);
            }
            if (topComponent && offset1) {
                /*for (j = 0, len1 = manager.componentArr.length; j < len1; j += 1) {
                    manager.componentArr[j].recurse(manager.getX, diff, true);
                }*/
                manager.recurse(manager.getX, diff, true);
                // manager.getX(diff, true);
                topComponent.recurse(manager.getWidth, diff, true);
            }

            if (lowerComponent && offset2) {
                lowerComponent.recurse(manager.getX, -offset2, true);
                lowerComponent.recurse(manager.getWidth, offset2, true);
            }
        }

        // If there is any dependency for this group. Re-allocate for them.
        if (manager.dependants) {
            manager.sortDependency();
        }

        return {
            width: +sumWidth ? Math.max(sumWidth, manager.getWidth()) : manager.getParentComponentGroup().getWidth(),
            height: sumHeight
        };
    };

    VerticalSwimLane.prototype.offsetX = function (diff, incremental, onlyWidth) {
        var component = this,
            i,
            len,
            componentArr = component.componentArr;
        // offset the X.
        if (!onlyWidth && +component.getX()) {
            component.getX(diff, incremental);
        }
        // offset the width.
        if (+component.getWidth()) {
            component.getWidth(Math.abs(diff), incremental, onlyWidth);
        }
        // do it recursively.
        for (i = 0, len = componentArr.length; i < len; i += 1) {
            componentArr[i].offsetX(diff, incremental, onlyWidth);
        }
    };

    VerticalSwimLane.prototype.adjustX = function (diff) {
        var component = this,
            flag = false,
            neighbours = component.getAdjComponents(),
            leftComponent = neighbours[0],
            rightComponent = neighbours[1];

        component.config.x += diff;

        if (rightComponent && rightComponent.constructor === VerticalSwimLane && rightComponent.capWidth(diff)) {
            flag = true;
            rightComponent.recurse(rightComponent.getX, diff, true);
            rightComponent.recurse(rightComponent.getWidth, -diff, true);
        }

        if (leftComponent && leftComponent.constructor === VerticalSwimLane) {
            flag = true;
            leftComponent.recurse(leftComponent.getWidth, diff, true);
        }

        if (!flag) {
            component.recurse(component.getWidth, -diff, true);
        }
        else {
            component.capWidth();
        }
    };

    VerticalSwimLane.prototype.capWidth = function (check) {
        var self = this,
            parentInstance = self.getParentComponentGroup(),
            diff = (self.getWidth() + self.getX()) - (parentInstance.getWidth() + parentInstance.getX());
        if (check) {
            return check + diff <= 0;
        }
        if (diff > 0) {
            self.recurse(self.getWidth, -diff, true);
        }
    };






    function VerticalSwimLane1(){
        VerticalSwimLane.apply(this, arguments);
    }

    VerticalSwimLane1.prototype = Object.create(VerticalSwimLane.prototype);
    VerticalSwimLane1.prototype.constructor = VerticalSwimLane1;

    VerticalSwimLane1.prototype.allocate = function () {
        return this.placeElements.apply(this, arguments);
    };

    VerticalSwimLane1.prototype.sortAspIndex = function (a, b) {
        return b.element.config.pIndex - a.element.config.pIndex;
    };

    VerticalSwimLane1.prototype.placeX = function (row, width) {
        return row.rightMostX - width;
    };

    VerticalSwimLane1.prototype.placeElements = function (newWidth, newHeight, newComponents, arr) {
        var i,
            j,
            len1,
            len,
            bucket,
            priorityBuckets,
            element,
            allocated,
            row,
            // layout,
            priority,
            keys,
            topMostX,
            bottomMostX,
            rightMostX,
            round = Math.round,
            manager = this,
            placeX = manager.placeX,
            placeAdjustedX = manager.placeAdjustedX,
            totWidth = newWidth || manager.getWidth(),
            totHeight = newHeight || manager.getHeight(),
            x = manager.getX(),
            componentArr = newComponents || manager.componentArr,
            queue = [],
            elementArr = arr || manager.elementArr || (manager.elementArr = []),
            getMin = function (dimension, key) {
                var min;
                if (typeof dimension[key] === 'object') {
                    min = dimension[key].min;
                }
                else if (+dimension[key] !== undefined) {
                    min = dimension[key];
                }
                return min;
            },
            getMax = function (dimension, key) {
                var max;
                if (typeof dimension[key] === 'object') {
                    max = dimension[key].max;
                }
                else if (+dimension[key] !== undefined) {
                    max = dimension[key];
                }
                return max;
            },
            placeFn = function (element, rowIndex, min, noNewRows) {
                var layout,
                    alignment,
                    dimensions,
                    k,
                    fn,
                    row,
                    width,
                    height,
                    dimension,
                    minHeight,
                    minWidth,
                    leftMostX,
                    allocated = false,
                    correspondingDimension = min ? getMin : getMax;
                layout = element.config.layout;
                alignment = element.config.alignment;
                dimensions = element.config.dimensions;
                for (k = 0; k < dimensions.length; k += 1) {
                    if (allocated) {
                        continue;
                    }
                    if (typeof dimensions[k] === 'function') {
                        fn = dimensions[k];
                        dimensions[k] = dimension = dimensions[k].call(element);
                        element.config._dimensions[k]  = fn;
                    }
                    else {
                        dimension = dimensions[k];
                    }
                    minWidth = getMin(dimension, 'width');
                    minHeight = getMin(dimension, 'height');

                    // filter out the entirely infeasible dimensional elements for current dimension.
                    if (round(minHeight) > round(totHeight) || round(minWidth) > round(totWidth)) {
                        continue;
                    }

                    // So we are trying for the 0th row now.
                    row = elementArr[rowIndex];
                    topMostX = row.topMostX;
                    bottomMostX = row.bottomMostX;
                    rightMostX = row.rightMostX;
                    leftMostX = row.leftMostX;

                    width = correspondingDimension(dimension, 'width');
                    height = correspondingDimension(dimension, 'height');
                    // @temp: need to validate if required and then delete if at all not required.
                    /*if (min) {
                        height = Math.max((bottomMostX - topMostX), height);
                    }*/
                    // If a block element.
                    if (layout === 0) {
                        // @todo: Code repeatation here. Just similar code in inline case.
                        // check if any element is being placed in the current row stack.
                        // If no,
                        if (!row.elements.length && manager.checkPlacement(width, height, row, newWidth, newHeight)) {
                            allocated = true;
                            element.config.height = height;
                            element.config.width = width;
                            element.config.selectedDimension = dimension;
                            row.elements.push(element);
                            manager.allocateElement(row, element, width, height);
                            row.isBlocked = true;
                        }
                        // If yes.
                        else if (!element.config.selectedDimension){
                            // Can we create another row of the required thickness?
                            // can we create another row to accomodate this new width element.
                            // If yes.
                            if (!noNewRows && manager.checkExcess(row, width, height)) {
                                // create another row.
                                currRowIndex += 1;
                                row = manager.getNewRowConfig(currRowIndex, row);
                                elementArr.push(row);
                                allocated = placeFn(element, rowIndex + 1, min, true);
                            }
                        }
                    }
                    // If its an inline element.
                    else {
                        // check for alignment.
                        // if its a top/ left alignment.
                        if (alignment === 0) {
                            // check if feasible to fit in.
                            if (!row.isBlocked && manager.checkPlacement(width, height, row, newWidth, newHeight)) {
                                allocated = true;
                                element.config.height = height;
                                element.config.width = width;
                                element.config.selectedDimension = dimension;
                                row.elements.push(element);
                                manager.allocateElement(row, element, width, height);
                            }
                            // try for another row.
                            else {
                                // can we create another row to accomodate this new width element.
                                if (!noNewRows && manager.checkExcess(row, width, height)) {
                                    // create another row.
                                    currRowIndex += 1;
                                    row = manager.getNewRowConfig(currRowIndex, row);
                                    elementArr.push(row);
                                    allocated = placeFn(element, rowIndex + 1, min, true);
                                }
                                else {
                                    // try allocating this element in other rows.
                                    if (!noNewRows && rowIndex > 0) {
                                        allocated = placeFn(element, rowIndex - 1, min, true);
                                    }
                                }
                            }
                        }

                        // if bottom/ right alignment.
                        else if (alignment === 2) {
                            // check if feasible to fit in.
                            if (!row.isBlocked && manager.checkPlacement(width, height, row, newWidth, newHeight)) {
                                // @todo: Code repeatation here. Just similar code in inline case.
                                allocated = true;
                                element.config.height = height;
                                element.config.width = width;
                                element.config.selectedDimension = dimension;
                                row.elements.push(element);
                                manager.allocateElement(row, element, width, height, true);
                                /*element.config.x = row.rightMostX - width;
                                row.rightMostX -= width;*/
                            }
                            // try for another row.
                            else {
                                // can we create another row to accomodate this new width element.
                                if (!noNewRows && manager.checkExcess(row, width, height)) {
                                    // create another row.
                                    currRowIndex += 1;
                                    row = manager.getNewRowConfig(currRowIndex, row);
                                    elementArr.push(row);
                                    allocated = placeFn(element, rowIndex + 1, min, true);
                                }
                                else {
                                    // try allocating this element in other rows.
                                    if (!noNewRows && rowIndex > 0) {
                                        allocated = placeFn(element, rowIndex - 1, min, true);
                                    }
                                }
                            }
                        }
                    }

                }
                return allocated;
            },
            placeAndAdjust = function (element, rowIndex) {
                var i,
                    j,
                    len1,
                    len,
                    ele,
                    index,
                    deficiet,
                    reduction,
                    height,
                    shrinker,
                    xPos,
                    width,
                    sum = 0,
                    row = elementArr[rowIndex],
                    eleInRow = row.elements,
                    dimensions = element.config.dimensions,
                    dimension = dimensions[dimensions.length - 1],
                    availableShrinkers = [];

                // taking the min height for the element.
                deficiet = height = getMin(dimension, 'height');
                width = element.config.width = getMin(dimension, 'width');

                if (height > manager.getHeight() || width > manager.getWidth() || (placeX(row, width)) < x ||
                    (xPos + width > x + totWidth)) {
                    return false;
                }

                // check if the maximum shrinkage for that row.
                // todo: This can be saved, and adjusted everytime disturbed. Optimisation. Skipping for now.
                // if (!eleInRow.extraHeight) {
                for (i = 0, len = eleInRow.length; i < len; i += 1) {
                    ele = eleInRow[i];
                    reduction = ele.config.height - getMin(ele.config.selectedDimension, 'height');
                    if (reduction > 0) {
                        sum += reduction;
                        availableShrinkers.push({
                            element: ele,
                            reduction: reduction,
                            index: i
                        });
                    }
                }
                // eleInRow.extraHeight = sum;
                // }

                // if the shrinkage available is more than the element min height.
                if (height <= sum) {
                    // sort the elements based on their priorities. - lower first.
                    availableShrinkers.sort(manager.sortAspIndex);

                    for (j = 0, len1 = availableShrinkers.length; j < len1; j += 1) {
                        if (deficiet <= 0) {
                            break;
                        }
                        shrinker = availableShrinkers[j];
                        // reduce their heights to min and reduce the shrinkage.
                        reduction = Math.min(shrinker.reduction, deficiet);
                        deficiet -= reduction;
                        shrinker.element.config.height -= reduction;
                        index = shrinker.index;
                        // adjust all the below elements y.
                        while (++index < len) {
                            eleInRow[index].config.y -= reduction;
                        }
                        if (deficiet <= 0) {
                            ele = eleInRow[len - 1];
                            element.config.height = height;
                            element.config.y = ele.config.y + ele.config.height;
                            element.config.x = placeAdjustedX(elementArr[rowIndex], width);
                            element.config.selectedDimension = dimension;
                            eleInRow.push(element);
                            allocated = true;
                        }
                    }


                }
                // recuse this function for the next available row.
                else {
                    if (rowIndex > 0 && !allocated) {
                        allocated = placeAndAdjust(element, rowIndex - 1);
                    }
                }
                return allocated;
            },
            currRowIndex = manager.currRowIndex || (manager.currRowIndex = 0);
        // round off the parents dimensions.
        manager.getHeight(mathRound(totHeight));
        manager.getWidth(mathRound(totWidth));
        if (!elementArr.length) {
            elementArr.push(manager.getStubConfig());
        }
        if (!(priorityBuckets = manager.priorityBuckets)) {
            priorityBuckets = manager.priorityBuckets = {};
            for (i = 0, len = componentArr.length; i < len; i += 1) {
                element = componentArr[i];
                priority = element.getPriority();
                if (!priorityBuckets[priority]) {
                    priorityBuckets[priority] = [];
                }
                priorityBuckets[priority].push(element);
            }
        }
        // todo: code repeatation. Need to optimise.
        else if (newComponents) {
            priorityBuckets = {};
            for (i = 0, len = newComponents.length; i < len; i += 1) {
                element = newComponents[i];
                priority = element.getPriority();
                if (!priorityBuckets[priority]) {
                    priorityBuckets[priority] = [];
                }
                priorityBuckets[priority].push(element);
            }
        }

        keys = Object.keys(priorityBuckets);
        len = keys.length;

        keys.sort();

        for (i = 0; i < len; i += 1) {
            bucket = priorityBuckets[keys[i]];
            bucket.sort(manager.sortAsIndex);
            for (j = 0, len1 = bucket.length; j < len1; j += 1) {
                element = bucket[j];
                if (!element.config._dimensions) {
                    element.config._dimensions = element.config.dimensions;
                }
                allocated = placeFn(element, currRowIndex);
                if (!allocated) {
                    allocated = placeFn(element, currRowIndex, true);
                }
                // @todo: Need to do this.
                /*if (!allocated) {
                    allocated = placeAndAdjust(element, currRowIndex);
                }*/
                if (!allocated) {
                    queue.push(element);
                }
            }
        }
        len = elementArr.length;
        row = elementArr[len - 1];
        return {
            queue: queue,
            excess: manager.getExcess(row),
            excessHeight: manager.getExcessHeight(row),
            row: row
        };
    };

    VerticalSwimLane1.prototype.getExcessHeight = function (row) {
        return this.getHeight() - row.height;
    };

    VerticalSwimLane1.prototype.getNewRowConfig = function (index, row) {
        return this.getStubConfig(index, row.rightMostX - row.width, row.leftMostX + row.width);
    };

    VerticalSwimLane1.prototype.getStubConfig = function (index, rightMostX, leftMostX) {
        var manager = this,
            totHeight = manager.getHeight(),
            x = manager.getX(),
            y = manager.getY();
        return {
            index: index || 0,
            height: totHeight,
            topMostX: y,
            bottomMostX: y + totHeight,
            rightMostX: rightMostX || (manager.getWidth() + x),
            leftMostX: leftMostX || x,
            elements: []
        };
    };

    VerticalSwimLane1.prototype.checkPlacement = function (width, height, row) {
        var xPos,
            manager = this,
            x = manager.getX();
        return row.topMostX + height <= row.bottomMostX && (xPos = manager.placeX(row, width)) >= x &&
                                (xPos + width <= x + manager.getWidth());
    };

    VerticalSwimLane1.prototype.allocateElement = function (row, element, width, height, isBottomAligned) {
        var manager = this;
        if (isBottomAligned) {
            row.bottomMostX -= height;
            element.config.y = row.bottomMostX;
        }
        else {
            element.config.y = row.topMostX;
            row.topMostX += height;
        }
        element.config.x = manager.placeX(row, width);
        row.width = Math.max(row.width || 0, width);
    };

    VerticalSwimLane1.prototype.checkExcess = function (row, width) {
        return row.rightMostX - row.width - width >= 0;
    };

    VerticalSwimLane1.prototype.placeAdjustedX = function (elem, width) {
        return elem.rightMostX - width;
    };

    VerticalSwimLane1.prototype.getExcess = function (row) {
        var x = this.getX(),
            width = this.getWidth();
        if (row.rightMostX === x + width) {
            return row.rightMostX - row.width - this.getX();
        }
        // there is some element wrt to right aligned
        else {
            return 0;
        }
    };
    // shifts the x position for all the containing elements by a diff amount.
    VerticalSwimLane1.prototype.adjustX = function (diff, isY) {
        var i,
            j,
            len1,
            len,
            elements,
            column,
            manager = this,
            dimension = isY ? 'y' : 'x',
            elementArr = manager.elementArr;

        for (i = 0, len = elementArr.length; i < len; i += 1) {
            column = elementArr[i];
            if (isY) {
                column.bottomMostX += diff;
            }
            else {
                column.rightMostX += diff;
            }
            elements = column.elements;
            for (j = 0, len1 = elements.length; j < len1; j += 1) {
                elements[j].config[dimension] += diff;
            }
        }
    };

    VerticalSwimLane1.prototype.adjustY = function (excess) {
        return this.adjustX(excess, true);
    };

    VerticalSwimLane1.prototype.spaceQuincher = function (excess) {
        this.config.width -= excess;
        this.adjustX(-excess);
    };

    VerticalSwimLane1.prototype.insertColumn = function (col) {
        var manager = this,
            elementArr = manager.elementArr;

        // manager.adjustX(col.width);
        elementArr.push(col);
    };




    function VerticalSwimLane2(){
        VerticalSwimLane1.apply(this, arguments);
    }

    VerticalSwimLane2.prototype = Object.create(VerticalSwimLane1.prototype);
    VerticalSwimLane2.prototype.constructor = VerticalSwimLane2;

    VerticalSwimLane2.prototype.spaceQuincher = function () {

    };

    VerticalSwimLane2.prototype.placeX = function (row) {
        return row.leftMostX;
    };

    VerticalSwimLane2.prototype.placeAdjustedX = function (elem) {
        return elem.leftMostX;
    };

    VerticalSwimLane2.prototype.checkExcess = function (row, width) {
        var manager = this;
        return row.leftMostX + row.width + width <= manager.getX() + manager.getWidth();
    };

    VerticalSwimLane2.prototype.getExcess = function (row) {
        var rowWidth = row.width,
            manager = this;
        if (rowWidth === undefined) {
            rowWidth = manager.getWidth();
        }
        return row.rightMostX - rowWidth - manager.getX();
    };

    VerticalSwimLane2.prototype.spaceQuincher = function (excess) {
        this.config.width -= excess;
    };





    VerticalSwimLane3.prototype = Object.create(VerticalSwimLane1.prototype);

    VerticalSwimLane3.prototype.checkExcess = function (row, width, height) {
        return row.topMostX - height >= this.getY();
    };

    VerticalSwimLane3.prototype.getStubConfig = function (index, bottomMostX) {
        var manager = this,
            totWidth = manager.getWidth(),
            x = manager.getX();
        return {
            index: index || 0,
            width: totWidth,
            bottomMostX: bottomMostX || (manager.getY() + manager.getHeight()),
            rightMostX: totWidth + x,
            leftMostX: x,
            elements: []
        };
    };

    VerticalSwimLane3.prototype.checkPlacement = function (width, height, row) {
        return row.bottomMostX - height >= this.getY() && row.leftMostX + width <= row.rightMostX;
    };

    VerticalSwimLane3.prototype.allocateElement = function (row, element, width, height, isRightAligned) {
        var bottomMostX = row.bottomMostX;
        element.config.y = bottomMostX - height;
        row.height = Math.max(row.height || 0, height);
        if (isRightAligned) {
            element.config.x = row.rightMostX - width;
            row.rightMostX -= width;
        }
        else {
            element.config.x = row.leftMostX;
            row.leftMostX += width;
        }
        row.topMostX = bottomMostX - row.height;
    };

    VerticalSwimLane3.prototype.getNewRowConfig = function (index, row) {
        return this.getStubConfig(index, row.topMostX, row.bottomMostX);
    };

    VerticalSwimLane3.prototype.getExcessHeight = function (row) {
        return row.topMostX - this.getY();
    };

    VerticalSwimLane3.prototype._spaceQuincher = function (excess) {
        this.config.height -= excess;
        this.adjustX(-excess, true);
    };

    VerticalSwimLane3.prototype.adjustY = function (excess) {
        return this.adjustX(excess, true);
    };




    function VerticalSwimLane4() {
        VerticalSwimLane3.apply(this, arguments);
    }

    VerticalSwimLane4.prototype = Object.create(VerticalSwimLane3.prototype);

    VerticalSwimLane4.prototype.checkPlacement = function (width, height, row) {
        return row.topMostX + height <= this.getY() + this.getHeight() && row.leftMostX +
            width <= row.rightMostX;
    };
    // todo: merge this with VerticalSwimLane3.prototype.allocateElement
    VerticalSwimLane4.prototype.allocateElement = function (row, element, width, height, isRightAligned) {
        var topMostX = row.topMostX;
        element.config.y = topMostX;
        if (isRightAligned) {
            element.config.x = row.rightMostX - width;
            row.rightMostX -= width;
        }
        else {
            element.config.x = row.leftMostX;
            row.leftMostX += width;
        }
        row.height = Math.max(row.height || 0, height);
        row.bottomMostX = topMostX + row.height;
    };

    VerticalSwimLane4.prototype.checkExcess = function (row, width, height) {
        return row.bottomMostX + height <= this.getY() + this.getHeight();
    };

    VerticalSwimLane4.prototype.getExcessHeight = function (row) {
        var manager = this;
        return manager.getY() + manager.getHeight() - row.bottomMostX;
    };

    VerticalSwimLane4.prototype.getStubConfig = function (index, bottomMostX, topMostX) {
        var manager = this,
            totWidth = manager.getWidth(),
            x = manager.getX();
        return {
            index: index || 0,
            width: totWidth,
            // need it for the VerticalSwimLane4
            topMostX: topMostX || manager.getY(),
            bottomMostX: bottomMostX || (manager.getY() + manager.getHeight()),
            rightMostX: totWidth + x,
            leftMostX: x,
            elements: []
        };
    };

    VerticalSwimLane4.prototype.adjustY = function (excess) {
        if (mathRound(this.getY()) !== mathRound((this.elementArr[0].bottomMostX - this.elementArr[0].height))) {
            return this.adjustX(excess, true);
        }
    };








    HorizontalSwimLane.prototype = Object.create(VerticalSwimLane.prototype);
    HorizontalSwimLane.prototype.constructor = HorizontalSwimLane;

    /*
     * Checks if the diff is applied to the current height, does it exceeds the minimum capping.
    */
    HorizontalSwimLane.prototype.exceedMinHeight = function (diff) {
        var self = this,
            config = self.config,
            minHeight = config.minHeight,
            isFunction = self.isFunction;

        // Check if the user has applied the minHeight as a valid number.
        if (isFunction(minHeight)) {
            minHeight = config.minHeight = minHeight.apply(self, self.getParents());
        }
        if (+minHeight && self.getHeight() + diff < minHeight) {
            return true;
        }
    };

    HorizontalSwimLane.prototype.getUnitWidth = function () {
        return this.getParentComponentGroup().getWidth();
    };

    HorizontalSwimLane.prototype.getUnitHeight = function () {
        var height,
            self = this,
            parentInstance = self.getParentComponentGroup(),
            parentConfig = parentInstance.config,
            initProp = self.config.initProp;

        if (!parentConfig.allotedHeight) {
            parentConfig.allotedHeight = 0;
        }

        if (initProp !== undefined) {
            height = parentInstance.getHeight() * initProp;
        }
        else {
            height = parentInstance.getHeight() / parentInstance.getComponentCount();
        }
        parentConfig.allotedHeight += height;
        return height;
    };

    HorizontalSwimLane.prototype.getUnitX = function () {
        return this.getParentComponentGroup().getX();
    };

    HorizontalSwimLane.prototype.getUnitY = function () {
        var parentInstance = this.getParentComponentGroup();
        return parentInstance.config.allotedHeight - this.getHeight() + parentInstance.getY();
    };

    HorizontalSwimLane.prototype.allocate = function (noReallocation) {
        var manager = this,
            componentArr = manager.componentArr,
            i,
            component,
            usedSpace,
            sumHeight = 0,
            sumWidth = 0,
            componentHeight,
            componentWidth,
            len;

        if (componentArr) {
            componentArr.sort(manager.sortAsPriority);
        }

        for (i = 0, len = componentArr.length; i < len; i += 1) {
            component = componentArr[i];
            usedSpace = component.allocate();
            componentHeight = usedSpace && usedSpace.height;
            componentWidth = usedSpace && usedSpace.width;

            if (+componentHeight) {
                // manager.getHeight() may get updated avobe.
                if (componentHeight <= manager.getHeight()) {
                    sumHeight = Math.max(componentHeight, sumHeight);
                }
                else {
                    component.doNotDraw(true);
                }
            }

            if (+componentWidth) {
                if (componentWidth + sumWidth > manager.getWidth()) {
                    component.doNotDraw(true);
                    /* If it has a valid height, then undo the sumHeight addition, as its no longer eligible to get
                    drawn.*/
                    // +componentHeight && (sumHeight -= componentHeight);
                }
                else {
                    sumWidth += componentWidth;
                }
            }
        }

        if (!noReallocation) {
            manager.adjustY(sumHeight);
        }
        return {
            width: sumWidth,
            height: sumHeight
        };
    };

    HorizontalSwimLane.prototype.adjustY = function (sumHeight) {
        var topComponent,
            lowerComponent,
            manager = this,
            offset1,
            offset2,
            diff,
            neighbours,
            allocation = false,
            totHeight = manager.getHeight();


        // excess height gets appended to the adjacent sub-components / components.
        if ((diff = totHeight - sumHeight) >= 0 || true) {
            neighbours = manager.getAdjComponents();
            topComponent = neighbours[0];
            lowerComponent = neighbours[1];

            if (topComponent = neighbours[0]) {
                topComponent = (topComponent.getPriority() < manager.getPriority()) ? topComponent : null;
            }
            if (lowerComponent = neighbours[1]) {
                lowerComponent = (neighbours[1].getPriority() < manager.getPriority()) ? lowerComponent : null;
            }

            if (topComponent && topComponent.getComponentCount() && lowerComponent &&
                lowerComponent.getComponentCount()) {
                offset1 = offset2 = diff / 2;
            }
            else if (topComponent && topComponent.getComponentCount()) {
                offset1 = diff;
                if (topComponent.exceedMinHeight(offset1)) {
                    sumHeight += offset1;
                    offset1 = 0;
                }
            }
            else if (lowerComponent && lowerComponent.getComponentCount()) {
                offset2 = diff;
                if (lowerComponent.exceedMinHeight(offset2)) {
                    sumHeight += offset2;
                    offset2 = 0;
                }
            }
            if (offset1 || offset2) {
                allocation = true;
                manager.recurse(manager.getHeight, sumHeight);
                // manager.getHeight(sumHeight);
            }
            if (topComponent && offset1) {
                // topComponent.recurse(topComponent.getHeight, offset1, true);
                manager.recurse(topComponent.getY, offset1, true);
                topComponent.recurse(topComponent.getHeight, offset1, true, true);
                // manager.getY(offset1, true);
            }

            if (lowerComponent && offset2) {
                // lowerComponent.recurse(lowerComponent.getHeight, offset2, true);
                lowerComponent.recurse(lowerComponent.getY, -offset2, true);
                lowerComponent.recurse(lowerComponent.getHeight, offset2, true, true);

                /*lowerComponent.getHeight(offset2, true);
                lowerComponent.getY(-offset2, true);*/
            }
        }

        return allocation;
    };

    HorizontalSwimLane.prototype.equiX = function (paddingObj) {
        return this.getUnitX() + paddingObj.left;
    };

    HorizontalSwimLane.prototype.equiY = function (paddingObj) {
        return this.getUnitY() - paddingObj.bottom;
    };



    function HorizontalSwimLane1() {
        HorizontalSwimLane.apply(this, arguments);
    }

    HorizontalSwimLane1.prototype = Object.create(HorizontalSwimLane.prototype);
    HorizontalSwimLane1.prototype.constructor = HorizontalSwimLane1;

    HorizontalSwimLane1.prototype.adjustX = function (excess, index) {
        var i,
            manager = this,
            componentArr = manager.componentArr,
            len = componentArr.length;
        for (i = index; i < len; i += 1) {
            componentArr[i].config.x += excess;
            componentArr[i].adjustX(excess);
        }
    };

    HorizontalSwimLane1.prototype.spaceQuincher = VerticalSwimLane3.prototype._spaceQuincher;

    HorizontalSwimLane1.prototype.allocate = function (noAdjustment) {
        var i,
            component,
            mostPriorElement,
            excess,
            usedConfig,
            len,
            manager = this,
            componentArr = manager.componentArr,
            excessWidth = 0,
            excessHeight = 0,
            queuedComponents = [];

        if (componentArr) {
            componentArr.sort(manager.sortAsPriority);
        }

        for (i = 0, len = componentArr.length; i < len; i += 1) {
            component = componentArr[i];
            usedConfig = component.allocate();
            component.config.usedConfig = usedConfig;
        }

        if (noAdjustment) {
            return;
        }

        if (componentArr) {
            componentArr.sort(manager.sortAsIndex);
        }

        for (i = 0, len = componentArr.length; i < len; i += 1) {
            component = componentArr[i];
            usedConfig = component.config.usedConfig;
            excess = usedConfig.excess;
            // if there is an excess. Quench the width by that amount, make all the subsequent adjustments.
            if (excess) {
                excessWidth += excess;
                // Quench out the excess in space from the component.
                component.spaceQuincher(excess);
                // Adjust all the x pos of adjoing elements.
                manager.adjustX(-excess, i + 1);
            }

            if (usedConfig.excessHeight) {
                excessHeight += usedConfig.excessHeight;
            }

            if (usedConfig.queue.length) {
                queuedComponents.push({
                    component: component,
                    queue: usedConfig.queue,
                    excess: usedConfig.excess
                });
            }
        }

        if (componentArr) {
            componentArr.sort(manager.sortAsPriority);
        }

        if (excessWidth) {
            // todo: Need to do this.
            /*for (i = 0; i < len, excessWidth > 0; i += 1) {
                queuedComponent = queuedComponents[i];
                component = queuedComponent.component;
                arr = [{
                    index: 0,
                    height: component.getHeight(), // todo : store in variables.
                    topMostX: component.getY(),
                    bottomMostX: component.getY() + component.getHeight(),
                    rightMostX: excessWidth + component.getX(),
                    leftMostX: component.getX(),
                    elements: []
                }];
                // check if for this excess width if atleast a single elements
                usedSpace = component.allocate(excessWidth, undefined, queuedComponent.queue, arr);
                // can the component reduce its queue?
                if (usedSpace.queue.length < queuedComponent.queue.length) {
                    // update the new queue.
                    component.queue = usedSpace.queue;
                    // increase the width.
                    component.spaceQuincher(-usedSpace.row.width);
                    // insert the new column.
                    component.insertColumn(usedSpace.row);
                    // shift all others.
                    manager.adjustX(usedSpace.row.width, i + 1);
                }
                excessWidth = usedSpace.excess;
            }*/
            mostPriorElement = componentArr[0];
            mostPriorElement.config.width += excessWidth;
            componentArr.sort(manager.sortAsIndex);
            manager.adjustX(excessWidth, mostPriorElement.config.index + 1);
        }
        return {
            queue: queuedComponents,
            excess: excessHeight
        };
    };

    HorizontalSwimLane1.prototype.adjustY = function (excess) {
        var i,
            len,
            component,
            manager = this,
            componentArr = manager.componentArr;

        manager.config.height += excess;
        for (i = 0, len = componentArr.length; i < len; i += 1) {
            component = componentArr[i];
            component.config.height += excess;
            component.adjustY && component.adjustY(excess);
        }
    };

    HorizontalSwimLane1.prototype.reset = function () {
        var i,
            j,
            len1,
            config,
            module,
            len,
            component,
            manager = this,
            componentArr = manager.componentArr;
        for (i = 0, len = componentArr.length; i < len; i += 1) {
            component = componentArr[i];
            component.elementArr.length = 0;
            component.currRowIndex = 0;
            component.priorityBuckets = undefined;
            for (j = 0, len1 = component.componentArr.length; j < len1; j += 1){
                module = component.componentArr[j];
                config = module.config;
                config.x = config.y = config.width = config.height = undefined;
                config.selectedDimension = null;
                config.dimensions = config._dimensions;
            }
        }
        return this;
    };









    Modules.prototype = Object.create(HorizontalSwimLane.prototype);
    Modules.prototype.constructor = Modules;

    Modules.prototype.adjustX = function (dependentModuleX) {
        var component = this,
            parent = component.getParentComponentGroup();
        component.config.x = dependentModuleX;
        parent.adjustX(dependentModuleX - parent.getX());
    };

    Modules.prototype.allocate = function (noReallocation, sumHeight) {
        if (!sumHeight) {
            sumHeight = 0;
        }

        var component = this,
            parentInstance = component.getParentComponentGroup(),
            diff,
            neighbours,
            dependentModule,
            dependentModuleWidth,
            dependentModuleHeight,
            dependentModuleX,
            dependentModuleY,
            componentY,
            componentX,

            dummyObj,
            topComponent,
            lowerComponent,
            componentWidth,
            componentHeight,
            excess,
            isTempAllocation = false,
            totWidth = parentInstance.getWidth(),
            totHeight = parentInstance.getHeight(),
            Modules = component.getLinkedItems('Modules'),
            spaceManager = component.getParents()[0];

        if (!component.config._width) {
            component.config._width = component.config.width;
        }
        if (!component.config._height) {
            component.config._height = component.config.height;
        }

        componentWidth = component.getWidth();
        componentHeight = component.getHeight();

        if (!(+componentWidth && +componentHeight)) {

            dummyObj = {};
            // check if any dimension is an instance of the Modules class.
            if (typeof componentWidth === 'string' && (dependentModule =
                spaceManager.cacheByName(componentWidth)) instanceof Modules) {
                isTempAllocation = true;
                if (+(dependentModuleWidth = dependentModule.getWidth())) {
                    component.config.width = dependentModuleWidth;
                    // manager.recurse(component.getWidth, dependentModuleWidth);
                    isTempAllocation = false;
                }
                else {
                    // inform the dependant module that it has a dependant module to take care.
                    dependentModule.getParentComponentGroup().registerDependency(component);
                }
            }
            else if (componentWidth === 'parent') {
                dummyObj.width = this.config.width = totWidth;
            }

            if (typeof componentHeight === 'string' && (dependentModule =
                spaceManager.cacheByName(componentHeight)) instanceof Modules) {
                isTempAllocation = true;

                if (+(dependentModuleHeight = dependentModule.getHeight())) {
                    component.config.height = dependentModuleHeight;
                    diff = dependentModuleHeight - component.getHeight();
                    neighbours = component.getAdjComponents();

                    if (component.getY() + dependentModuleHeight < component.getParentComponentGroup().getHeight()) {
                        // try increasing its own height and adjust the lower module.
                        component.recurse(component.getHeight, dependentModuleHeight);

                        lowerComponent = neighbours && neighbours[1];
                        lowerComponent && lowerComponent.getHeight(-diff, true);
                        lowerComponent && lowerComponent.recurse(component.getY, diff, true);
                        lowerComponent.allocate(true);

                        totHeight = component.getHeight();
                    }
                    else {
                        // reduce the upward component if it has a lower pIndex.
                        topComponent = neighbours && neighbours[0];
                        if (topComponent && topComponent.getPriority() < component.getPriority()) {
                            // try shifting y of the component
                            topComponent.getHeight(dependentModule.getY() - component.getY(), true);
                            topComponent.allocate(false);


                            component.recurse(component.getY, dependentModule.getY() - component.getY(), true);
                            component.recurse(component.getHeight, dependentModuleHeight);

                            if (lowerComponent = neighbours[1]) {
                                diff = component.getY() + dependentModuleHeight - lowerComponent.getY();
                                lowerComponent.getHeight(-diff, true);
                                lowerComponent.allocate(false);
                                lowerComponent.recurse(component.getY, diff, true);
                            }
                        }

                    }





                    // reduce the lower block, if height is decreased.
                    isTempAllocation = false;
                }
                else {
                    // inform the dependant module that it has a dependant module to take care.
                    dependentModule.getParentComponentGroup().registerDependency(component);
                }
            }
            else if (componentHeight === 'parent') {
                dummyObj.height = component.config.height = totHeight;
            }
        }






        this.config._x = componentX = component.getX();
        this.config._y = componentY = component.getY();


        if (typeof componentX === 'string' && (dependentModule =
            spaceManager.cacheByName(componentX)) instanceof Modules) {
            isTempAllocation = true;

            if (+(dependentModuleX = dependentModule.getX())) {
                component.config._x = componentX;
                component.adjustX(dependentModuleX);
                isTempAllocation = false;
            }
            else {
                component.config._x = parentInstance.getX();
                // inform the dependant module that it has a dependant module to take care.
                dependentModule.getParentComponentGroup().registerDependency(component);
            }
        }
        // todo: This might be inside if (!tempAllocation ) block.
        else if (componentX === undefined) {
            component.getX(parentInstance.getX());
        }


        if (typeof componentY === 'string' && (dependentModule =
            spaceManager.cacheByName(componentY)) instanceof Modules) {
            isTempAllocation = true;

            if (+(dependentModuleY = dependentModule.getY())) {
                component.config._y = componentY;
                component.getY(dependentModuleY);
                diff = component.getY() - dependentModuleY;
                neighbours = component.getAdjComponents();
                topComponent = neighbours[0];
                lowerComponent = neighbours[1];
                if (diff > 0 && topComponent) {
                    topComponent.recurse(component.getHeight, -diff, true);
                    topComponent.allocate(true);
                    if (lowerComponent) {
                        lowerComponent.getHeight(diff, true);
                        lowerComponent.recurse(component.getY, -diff, true);
                        lowerComponent.allocate(true);
                    }
                }
                else if (lowerComponent = neighbours[1]){
                    lowerComponent.getHeight(diff, true);
                    lowerComponent.allocate(true);
                    parentInstance = lowerComponent.getParentComponentGroup();

                    if (lowerComponent.getY() - diff + lowerComponent.getHeight() <= parentInstance.getY() +
                        parentInstance.getHeight()) {
                        lowerComponent.recurse(component.getY, -diff, true);
                    }
                }

                parentInstance = component.getParentComponentGroup();
                component.recurse(component.getY, dependentModuleY);
                if ((excess = (dependentModuleY + component.getHeight()) - (parentInstance.getY() +
                    parentInstance.getHeight())) > 0) {
                    component.getHeight(-excess, true);
                    component.allocate();
                }
                isTempAllocation = false;
            }
            else {
                component.config._y = parentInstance.getY();
                // inform the dependant module that it has a dependant module to take care.
                dependentModule.getParentComponentGroup().registerDependency(component);
            }
        }
        // todo: This might be inside if (!tempAllocation ) block.
        else if (componentY === undefined) {
            component.getY(sumHeight + parentInstance.getY());
        }

        return {
            width: component.getWidth(),
            height: component.getHeight()
        };
    };

    Modules.prototype.equiAllotment = function () {};

    Modules.prototype.restoreWidth = function () {
        var config = this.config;
        if (+config._x) {
            config.x = config._x = undefined;
        }
        else {
            config.x = config._x;
            config._x = null;
        }
        if (config._width) {
            config.width = config._width;
            config._width = null;
        }
        else {
            config.width = undefined;
        }
    };

    Modules.prototype.restoreHeight = function () {
        var config = this.config;
        if (+config._y) {
            config.y = config._y = undefined;
        }
        else {
            config.y = config._y;
            config._y = undefined;
        }
        if (config._height) {
            config.height = config._height;
            config._height = undefined;
        }
        else {
            config.height = undefined;
        }
    };

    Modules.prototype.reAllocate = function () {
        var parentGroup = this.getLinkedItems('ref').getDefaultGroup(),
            parent = this.getParentComponentGroup();
        parent.getParentComponentGroup().reset().allocate();
        parent.setDrawingConfiguration(parentGroup);
        parent.draw();
    };

    Modules.prototype.assignProportions = undefined;

    FusionCharts.registerComponent('api', 'spacemanager', SpaceManager);



}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-element-recycle-api',
    function () {

        function ElementRecycle () {
            this.elementObj= {};
        }

        /*
         * This function transfer all the element to the pool so that the can be use during drawing
         * @returns {Object} instance of the class
         */
        ElementRecycle.prototype.preProcessor = function(reserveElementObj) {
            var self = this,
                elements = self.elementObj,
                aa,
                a;

            for(a in elements) {
                if(elements.hasOwnProperty(a) && elements[a].pool) {
                    self.insertReserveElement(a, (reserveElementObj && reserveElementObj[a]));
                    for(aa in elements[a].elements) {
                        if(elements[a].elements.hasOwnProperty(aa)) {
                            elements[a].pool[aa] = elements[a].elements[aa];
                            delete elements[a].elements[aa];
                        }
                    }
                }
            }
            return this;
        };

        /*
         * this function hides the element present in the pool
         * @returns {Object} instance of the object
         */
        ElementRecycle.prototype.postProcessor = function() {
            var self = this,
                elements = self.elementObj,
                aa,
                a;

            for(a in elements) {
                if(elements.hasOwnProperty(a) && elements[a].pool) {
                    for(aa in elements[a].pool) {
                        if(elements[a].pool.hasOwnProperty(aa)) {
                            elements[a].pool[aa].hide && elements[a].pool[aa].hide();
                        }
                    }
                }
            }
            return this;
        };

        /*
         * this function returns the suitable element from the pool if there or return undefined
         * @param {string} type the pool of the element to be used
         * @param {string} name name of the element to get
         * @returns {Object} Raphael element or undefined
         */
        ElementRecycle.prototype.getElementIfExist = function(type, name) {
            var self = this,
                elementsObj,
                returnElem,
                a;

            if(!(elementsObj = self.elementObj[type])) {
                elementsObj = self.elementObj[type] = {
                    elements: {},
                    pool: {},
                    reserveElement: []
                };
            }

            if (elementsObj.pool[name]) {
                returnElem = elementsObj.pool[name];
                delete elementsObj.pool[name];
            } else {
                for(a in elementsObj.pool) {
                    if(elementsObj.pool.hasOwnProperty(a) && elementsObj.reserveElement.indexOf(a) === -1) {
                        returnElem = elementsObj.pool[a];
                        delete elementsObj.pool[a];
                        break;
                    }
                }
            }
            if(returnElem !== undefined) {
                returnElem.show && returnElem.show();
                return elementsObj.elements[name] = returnElem;
            } else {
                return undefined;
            }
        };

        ElementRecycle.prototype.getDrawnElements = function (type, name) {
            var self = this,
                elementsObj = self.elementObj[type],
                elements = elementsObj && elementsObj.elements;
            return elements && elements[name];
        };


        ElementRecycle.prototype.insertElement = function(type, name, elem) {
            var self = this,
                elementsObj = self.elementObj[type];

            elementsObj && (elementsObj.elements[name] = elem);
            return self;
        };

        ElementRecycle.prototype.insertReserveElement = function(type, arr) {
            var self = this,
                elementsObj = self.elementObj[type];

            if (elementsObj) {
                elementsObj.reserveElement.length = 0;
                elementsObj.reserveElement = arr || [];
            }
            return self;
        };

        FusionCharts.registerComponent('api', 'elementrecycle', ElementRecycle);
    }

]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-time-series-time-rules-api', function () {
    var global = this,
        lib = global.hcLib,
        timeFormatter = lib.DateTimeFormatter.formatAs;

    function TimeRules() {
        var primaryRules = {
            millisecond: {
                interval: 1,
                abbreviation: {
                    single: 'm',
                    multi: 'ms'
                },
                description: 'Millisecond'
            },
            second: {
                interval: 1000,
                abbreviation: {
                    single: 's',
                    multi: 'sec'
                },
                description: 'Second'
            },
            minute: {
                interval: 60000, //60 * 1000
                abbreviation: {
                    single: 'm',
                    multi: 'min'
                },
                description: 'Minute'
            },
            hour: {
                interval: 3600000, //60 * 60 * 1000
                abbreviation: {
                    single: 'h',
                    multi: 'hr'
                },
                description: 'Hour'
            },
            day: {
                interval: 86400000, //24 * 60 * 60 * 1000
                abbreviation: {
                    single: 'D',
                    multi: 'Day'
                },
                description: 'Day'
            },
            week: {
                interval: 604800000, //7 * 24 * 60 * 60 * 1000
                abbreviation: {
                    single: 'W',
                    multi: 'Wk'
                },
                description: 'Week',
                accomodateAll: true,
                showInSpan: true,
                use: false
            },
            month: {
                interval: 2592000000, //30 * 24 * 60 * 60 * 1000
                abbreviation: {
                    single: 'M',
                    multi: 'Mon'
                },
                description: 'Month'
            },
            year: {
                interval: 31104000000, //12 * 30 * 24 * 60 * 60 * 1000
                abbreviation: {
                    single: 'Y',
                    multi: 'Yr'
                },
                description: 'Year'
            }

        },
        secondaryRules = {
            quarter: {
                interval: 7776000000, //3 * 30 * 24 * 60 * 60 * 1000
                abbreviation: {
                    single: 'Q',
                    multi: 'Qtr'
                },
                description: 'Quarter',
                accomodateAll: true,
                showInSpan: true,
                use: false
            }
        };

        this.getPrimaryRules = function() {
            return primaryRules;
        };

        this.changeRuleState = function(name, state) {
            if(primaryRules[name] && name === 'week') {
                primaryRules[name].use = state;
            } else if(secondaryRules[name]) {
                secondaryRules[name].use = state;
            }
        };

        this.insertRule = function(rulesObj) {
            this.ruleCache = undefined;
            this.rulesHierarchy = undefined;
            /****************************/
            if(primaryRules[rulesObj.name]) {return;}
            /***************************/
            //todo: need to polish the function and validate the function
            secondaryRules[rulesObj.name] = rulesObj.rules;
            this.formatter[rulesObj.name] = rulesObj.formatter;
            this.miscFn[rulesObj.name] = rulesObj.miscFn;
            this.unitToTimeStamp[rulesObj.name] = rulesObj.unitToTimeStamp;
        };

        this.createRules = function() {
            var rulesArr = [],
                rulesHierarchy,
                key,
                i,
                ln;

            rulesHierarchy = this.rulesHierarchy = [];
            for (key in primaryRules) {
                if(primaryRules.hasOwnProperty(key) && primaryRules[key].use !== false) {
                    rulesArr.push({
                        name: key,
                        interval: primaryRules[key].interval,
                        accomodateAll: primaryRules[key].accomodateAll,
                        showInSpan: primaryRules[key].showInSpan,
                        abbreviation: primaryRules[key].abbreviation,
                        description: primaryRules[key].description
                    });
                }
            }
            for (key in secondaryRules) {
                if(secondaryRules.hasOwnProperty(key) && secondaryRules[key].use !== false) {
                    rulesArr.push({
                        name: key,
                        interval: typeof secondaryRules[key].interval === 'function' ?
                            secondaryRules[key].interval.call(this) : secondaryRules[key].interval,
                        accomodateAll: secondaryRules[key].accomodateAll,
                        showInSpan: secondaryRules[key].showInSpan,
                        abbreviation: secondaryRules[key].abbreviation,
                        description: secondaryRules[key].description
                    });
                }
            }
            rulesArr.sort(function (obj1, obj2) { return obj1.interval - obj2.interval;});
            // create the factor
            for (i = 0, ln = rulesArr.length; i < ln; i += 1) {
                if(rulesArr[i+1] && rulesArr[i].accomodateAll !== true) {
                    rulesArr[i].possibleFactors = this.getDivisors(Math.floor(rulesArr[i+1].interval /
                        rulesArr[i].interval));
                } else {
                    rulesArr[i].possibleFactors = [1];
                }
                rulesHierarchy.push(rulesArr[i].name);
            }
            return rulesArr;
        };
    }


    TimeRules.prototype.formatter = {
        millisecond: {
            default: function(val) {
                var date = new Date(val);
                return (date.getMilliseconds()) + ' ms';
            }
        },
        second: {
            default: function(val) {
                return timeFormatter(val, '%S s');
            },
            context: function(val) {
                return timeFormatter(val, '%d %b\' %y %l-:%M-:%S %p');
            },
            major: function(val){
                return timeFormatter(val, '%l-:%M-:%S %p');
            },
            single: function(val) {
                if (this.skipLabel('hour', val)) {
                    return timeFormatter(val, '%e %b\' %y');
                } else {
                    return timeFormatter(val, '%l-:%M-:%S %p');
                }
            }
        },
        minute: {
            default: function(val) {
                return timeFormatter(val, '%M m');
            },
            major: function(val) {
                return timeFormatter(val, '%l:%M %p');
            },
            context: function(val) {
                return timeFormatter(val, '%d %b\' %y %l:%M %p');
            },
            single: function(val) {
                if (this.skipLabel('hour', val)) {
                    return timeFormatter(val, '%e %b\' %y');
                } else {
                    return timeFormatter(val, '%l:%M %p');
                }
            }
        },
        hour: {
            default: function(val) {
                return timeFormatter(val, '%l %p');
            },
            context: function(val) {
                return timeFormatter(val, '%d %b\' %y %l %p');
            },
            single: function(val) {
                if (this.skipLabel('hour', val)) {
                    return timeFormatter(val, '%e %b\' %y');
                } else {
                    return timeFormatter(val, '%l %p');
                }
            }
        },
        day: {
            default: function(val) {
                return timeFormatter(val, '%e');
            },
            major: function(val) {
                return timeFormatter(val, '%e %b');
            },
            context: function(val) {
                return timeFormatter(val, '%e %b\' %y');
            },
            single: function(val) {
                if (this.skipLabel('day', val)) {
                    return timeFormatter(val, '%b\' %y');
                } else {
                    return timeFormatter(val, '%e');
                }
            }
        },
        week: {
            default: function(val) {
                return 'wk-' + this.miscFn.week.index(val);
            },
            context: function(val) {
                return timeFormatter(val, '%b\' %y') + ' wk-' + this.miscFn.week.index(val);
            }
        },
        month: {
            default: function(val) {
                return timeFormatter(val, '%b');
            },
            context: function(val) {
                return timeFormatter(val, '%b\' %y');
            },
            single: function(val) {
                if (this.skipLabel('month', val)) {
                    return timeFormatter(val, '%Y');
                } else {
                    return timeFormatter(val, '%b\' %y');
                }
            }
        },
        quarter: {
            default: function(val) {
                return 'Q-' + this.miscFn.quarter.index(val);
            },
            context: function(val) {
                return timeFormatter(val, '%Y') + ' Q-' + this.miscFn.quarter.index(val);
            }
        },
        year: {
            default: function(val) {
                return timeFormatter(val, '%Y');
            }
        }
    };

    TimeRules.prototype.miscFn = {
        week: {
            index: function(timeStamp) {
                var date = new Date(timeStamp);
                return Math.floor(((timeStamp - +new Date(date.getFullYear(), 0, -8))/86400000)/7);
            },
            skip: function(timeStamp) {
                return (new Date(timeStamp)).getDay() === 1 ? true : false;
            }
        },
        quarter: {
            index: function(timeStamp) {
                var date = new Date(timeStamp);

                return Math.floor(date.getMonth()/3) + 1;
            },
            skip: function(timeStamp) {
                return (new Date(timeStamp)).getMonth() % 3 === 0 ? true : false;
            }
        }
    };

    TimeRules.prototype.unitToTimeStamp = {
        millisecond: function(timeStamp, step, noExtreme) {
            var nth = Math.floor(timeStamp/step) * step + step,
                parent = this.getParent('millisecond'),
                skipFn = this.miscFn[parent] && this.miscFn[parent].skip,
                expDate = new Date(nth);
            if(noExtreme && (skipFn && skipFn(nth)) || expDate.getMilliseconds() === 0) {
                nth += step;
            }
            return nth;
        },
        second: function(timeStamp, step, noExtreme) {
            var date = new Date(timeStamp),
                parent = this.getParent('second'),
                skipFn = this.miscFn[parent] && this.miscFn[parent].skip,
                nth = Math.floor(date.getSeconds()/step) * step + step;

            noExtreme && ((skipFn && skipFn(+new Date(date.getFullYear(), date.getMonth(), date.getDate(),
                date.getHours(), date.getMinutes(), nth)) || nth === 60) && (nth += step));
            return +new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(),
                date.getMinutes(), nth);
        },
        minute: function(timeStamp, step, noExtreme) {
            var date = new Date(timeStamp),
                parent = this.getParent('minute'),
                skipFn = this.miscFn[parent] && this.miscFn[parent].skip,
                nth = Math.floor(date.getMinutes()/step) * step + step;

            noExtreme && (((skipFn && skipFn(+new Date(date.getFullYear(), date.getMonth(), date.getDate(),
                date.getHours(), nth))) || nth === 60) && (nth += step));
            return +new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), nth);
        },
        hour: function(timeStamp, step, noExtreme) {
            var date = new Date(timeStamp),
                parent = this.getParent('hour'),
                skipFn = this.miscFn[parent] && this.miscFn[parent].skip,
                nth = Math.floor(date.getHours()/step) * step + step;

            noExtreme && (((skipFn && skipFn(+new Date(date.getFullYear(), date.getMonth(), date.getDate(), nth))) ||
                nth === 24) && (nth += step));
            return +new Date(date.getFullYear(), date.getMonth(), date.getDate(), nth);
        },
        day: function(timeStamp, step, noExtreme) {
            var date = new Date(timeStamp),
                nth = Math.floor((date.getDate())/step) * step + step,
                parent = this.getParent('day'),
                skipFn = this.miscFn[parent] && this.miscFn[parent].skip,
                retDate;

            noExtreme && ((skipFn && skipFn(+new Date(date.getFullYear(), date.getMonth(),
                (step === 1 ? nth : nth + 1))) && (nth += step)) || ((step === 1 ? nth > 31 : nth >= 30)) &&
                (nth += 2));

            //mainly for navigator when 31 and 1 come closer to each other and not every day are shown
            !noExtreme && nth >= 30 && step > 1 && (nth += Math.max(step, 2));

            retDate = +new Date(date.getFullYear(), date.getMonth(), (step === 1 ? nth : nth + 1));
            if(retDate >= +new Date(date.getFullYear(), date.getMonth() + 1)) {
                retDate = +new Date(date.getFullYear(), date.getMonth() + 1, noExtreme && !skipFn ? step + 1 : 1);
            }
            return retDate;
        },
        week: function(timeStamp, step, noExtreme) {
            var date = new Date(timeStamp),
                startDay = 1,
                parent = this.getParent('week'),
                skipFn = this.miscFn[parent] && this.miscFn[parent].skip,
                nth = date.getDate() + 7 - (date.getDay() + 7 - startDay) % 7,
                expectedTimeStamp = +new Date(date.getFullYear(), date.getMonth(), nth),
                prevTimeStamp = +new Date(date.getFullYear(), date.getMonth(), nth - 7),
                currentYearTimeStamp = +new Date(date.getFullYear() + 1, 0);

            if(!noExtreme && ((skipFn && skipFn(expectedTimeStamp)) ||
                (expectedTimeStamp > currentYearTimeStamp && currentYearTimeStamp) > prevTimeStamp)) {
                return currentYearTimeStamp;
            }
            return +new Date(date.getFullYear(), date.getMonth(), nth, 0);
        },
        month: function(timeStamp, step, noExtreme) {
            var date = new Date(timeStamp),
                parent = this.getParent('month'),
                skipFn = this.miscFn[parent] && this.miscFn[parent].skip,
                nth = Math.floor(date.getMonth()/step) * step + step;

            noExtreme && (((skipFn && skipFn(+new Date(date.getFullYear(), nth))) || nth === 12) && (nth += step));
            return +new Date(date.getFullYear(), nth);
        },
        quarter: function(timeStamp, step, noExtreme) {
            var date = new Date(timeStamp),
                parent = this.getParent('quarter'),
                skipFn = this.miscFn[parent] && this.miscFn[parent].skip,
                nth = Math.floor(date.getMonth()/3) * 3 + 3;

            noExtreme && (skipFn && skipFn(+new Date(date.getFullYear(), nth)) && (nth += step));
            return +new Date(date.getFullYear(), nth);
        },
        year: function(timeStamp, step, noExtreme) {
            var date = new Date(timeStamp),
                parent = this.getParent('year'),
                skipFn = this.miscFn[parent] && this.miscFn[parent].skip,
                nth = Math.floor(date.getFullYear()/step) * step + step;

            noExtreme && (skipFn && skipFn(+new Date(nth, 0))) && (nth += step);
            return +new Date(nth, 0);
        }
    };

    TimeRules.prototype.skipLabel = function(name, timeStamp) {
        var date = new Date(timeStamp),
            parent = this.getParent(name),
            skipFn = this.miscFn[parent] && this.miscFn[parent].skip,
            nameDateMap = {
                second: 'getSeconds',
                minute: 'getMinutes',
                hour: 'getHours',
                day: 'getDate',
                month: 'getMonth',
                year: 'getFullYear'
            };

        if(skipFn) {
            return skipFn(timeStamp);
        }
        switch(name) {
            case 'day':
                if(date.getDate() === 1) {
                    return true;
                }
                break;
            default:
                if(nameDateMap[name] && date[nameDateMap[name]]() === 0) {
                    return true;
                }
        }
        return false;
    };

    TimeRules.prototype.getDivisors = function(val) {
        var arr = [1],
            ln = Math.ceil(val/2),
            i = 2;

        for(;i <= ln; i += 1) {
            if (val % i === 0) {
                arr.push(i);
            }
        }
        return arr;
    };

    TimeRules.prototype.getSuitableInterval = function(target) {
        var mainRuleIndex,
            timeRules,
            name,
            step,
            interval,
            index,
            i,
            ln,
            ind,
            lnn,
            possibleFactors,
            cInterval;

        timeRules = this.getRules();
        for(ind = 0, lnn = timeRules.length; ind <= lnn; ind += 1) {
            if (ind === lnn || timeRules[ind].interval > target) {
                if (ind === 0) {
                    break;
                }
                mainRuleIndex = ind - 1;
                name = timeRules[mainRuleIndex].name;
                possibleFactors = timeRules[mainRuleIndex].possibleFactors;
                cInterval = timeRules[mainRuleIndex].interval;
                ln = possibleFactors.length;
                if(cInterval * possibleFactors[ln - 1] < target && ind !== lnn) {
                    continue;
                }
                index = mainRuleIndex;
                if (ind === lnn) {
                    for(i = 1;; i += 1) {
                        if ((i * timeRules[mainRuleIndex].interval) > target) {
                            step = i === 1 ? 1 : i;
                            interval = step * timeRules[mainRuleIndex].interval;
                            ind = lnn + 1;
                            break;
                        }
                    }
                } else {
                    for (i = 0; i < ln; i += 1) {
                        if ((i === ln - 1) || (possibleFactors[i] * cInterval) > target) {
                            step = possibleFactors[i === 0 ? 0 : i];
                            interval = step * cInterval;
                            ind = lnn + 1;
                            break;
                        }
                    }
                }
            }
        }

        return {
            index: index,
            name: name,
            span: interval,
            step: step
        };
    };

    TimeRules.prototype.getParent = function(name) {
        var rulesHierarchy = this.getRulesHierarchy(),
            ind;
        return (ind = rulesHierarchy.indexOf(name)) ? rulesHierarchy[ind + 1] : undefined;
    };

    TimeRules.prototype.getRules = function(force) {
        return ((this.ruleCache && (force !== true)) || (this.ruleCache = this.createRules())), this.ruleCache;
    };

    TimeRules.prototype.getRulesHierarchy = function(force) {
        return (this.rulesHierarchy && (force !== true) || this.getRules(true)), this.rulesHierarchy || [];
    };

    FusionCharts.registerComponent('api', 'timerules', TimeRules);

}]);

FusionCharts.register('module', ['private', 'modules.interfaces.component', function () {

    function ComponentInterface () {

    }

    ComponentInterface.prototype.init = function () { };

    ComponentInterface.prototype.setReactivity = function () { };

    ComponentInterface.prototype.draw = function () { };

    FusionCharts.registerComponent('interface', 'component', ComponentInterface);
}]);

FusionCharts.register('module', ['private', 'modules.interfaces.manager', function () {

    function ManagerInterface () {

    }

    ManagerInterface.prototype.init = function() { };

    ManagerInterface.prototype.setReactivity = function () { };

    FusionCharts.registerComponent('interface', 'manager', ManagerInterface);
}]);

FusionCharts.register('module', ['private', 'modules.interfaces.resolver', function () {

    function ResolverInterface (definitions, args) {
        this.definitions = definitions;
        this.args = args;
    }

    ResolverInterface.prototype.resolveTo = function() { };

    ResolverInterface.prototype.resolve = function() { };

    FusionCharts.registerComponent('interface', 'resolver', ResolverInterface);
}]);

FusionCharts.register('module', ['private', 'modules.renderer.js-time-series-base-config',
    function () {
        var ComponentInterface = FusionCharts.getComponent('interface', 'component');

        function BaseConfig (config) {
            ComponentInterface.apply(this, arguments);

            this.config = config || {};
        }

        BaseConfig.prototype = Object.create(ComponentInterface.prototype);

        /*
         * setter function of configurations
         * {
         *      value: The current value of the config.
         *      defaultValue: the default value of the config.
         *      validatorFn: function to validate the input, if return true only then the value will be set.
         *      type: the type of value expecting (number, boolean) if not provided value will be set as it is.
         * }
         * @param  {String} name  the name of the config to be set
         * @param  {Any} value the value of the configuration to be set
         * @return {Instance}       the instance of the class to be returned
         */
        BaseConfig.prototype.setConfig = function(name, value) {
            var finalValue;
            // validating the value
            if (!this.config || this.config[name] === undefined ||
                (this.config[name].validatorFn && !this.config[name].validatorFn(value))) {
                return this;
            }
            //Type casting
            switch (this.config[name].type) {
                case 'number' :
                    finalValue = Number(value);
                    break;
                case 'boolean' :
                    finalValue = !!value;
                    break;
                default :
                    finalValue = value;
            }
            this.config[name].value = finalValue;
            this.config[name].setCallback && this.config[name].setCallback.apply(this);
            return this;
        };

        /*
         * getter function of configurations
         * @param  {String} name name of the configuration for which value will be returned.
         * @return {Any}     the value of the configuration.
         */
        BaseConfig.prototype.getConfig = function(name) {
            this.config[name] && this.config[name].getCallback && this.config[name].getCallback.apply(this);
            return this.config[name] && this.config[name].value;
        };

        FusionCharts.registerComponent('main', 'baseconfig', BaseConfig);

    }

]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-reactive-model-api', function () {
    function SharedNodeOps (nodes) {
        this.nodes = nodes;
        this.listenerCreated = false;
        this.listenerWrapper = {};
    }

    SharedNodeOps.prototype.registerSingletonListener = function (fn, fireImmediate, isVolatile) {
        var self = this,
            nodes = self.nodes,
            flag = parseInt((+!!fireImmediate) + '' + (+!!isVolatile), 2),
            i,
            l;

        function execute () {
            var responseArg = [],
                state,
                i,
                l;

            for (i = 0, l = nodes.length; i < l; i++) {
                state = nodes[i].state;
                responseArg.push([state.pre, state.post]);
            }
            fn.apply(null, responseArg);
        }

        function sharedListeners () {
            if (!self.listenerCreated) {
                self.listenerCreated = true;
                return execute;
            } else {
                return function () { };
            }
        }

        this.listenerWrapper[fn] = sharedListeners;

        switch (flag) {
            case 0:
            case 1:
            case 2:
                for (i = 0, l = nodes.length; i < l; i++) {
                    nodes[i].addSharedListeners(sharedListeners, isVolatile);
                }
        }

        fireImmediate && execute();
    };

    SharedNodeOps.prototype.reset = function () {
        this.listenerCreated = false;
    };

    SharedNodeOps.prototype.removeSingletonListener = function (fn) {
        var nodes = this.nodes,
            wrapperFn = this.listenerWrapper[fn],
            i,
            l;

        for (i = 0, l = nodes.length; i < l; i++) {
            nodes[i].removeSharedListeners(wrapperFn);
        }

        return this;
    };

    function ReactiveModelNode (prop, val) {
        this.link = [];
        this.val = val;
        this.prop = prop;
        this.parent = undefined;
        this.rootContext = undefined;
        this.__listeners__ = [];
        this.__volatileListeners__ = [];
        this.__sharedListeners__ = [];
        this.__sharedVolatileListeners__ = [];
        this.state = {
            pre: val,
            post: val
        };
    }

    ReactiveModelNode.prototype.setLink = function (link) {
        this.link.push(link);
        this.val = undefined;
        link.setParent(this);
    };

    ReactiveModelNode.prototype.setRootContext = function (context) {
        return ((this.rootContext = context), this);
    };

    ReactiveModelNode.prototype.getState = function () {
        var propObj = {},
            rootContext,
            prop;

        if (!(rootContext = this.rootContext)) { return propObj; }

        for (prop in rootContext) {
            propObj[prop] = rootContext[prop];
        }

        return propObj;
    };

    ReactiveModelNode.prototype.setParent = function (node) {
        this.parent = node;
    };

    ReactiveModelNode.prototype.getParent = function () {
        return this.parent;
    };

    ReactiveModelNode.prototype.setPropertyValue = function (value) {
        this.link.length = 0;
        this.val = value;
    };

    ReactiveModelNode.prototype.addListeners = function (fn, fireImmediate, isVolatile) {
        var listenersType = isVolatile ? this.__volatileListeners__ : this.__listeners__,
            flag = parseInt((+!!fireImmediate) + '' + (+!!isVolatile), 2);

        switch (flag) {
            case 0:
                // when fireImmediate = false, isVolatile = false
            case 1:
                // when fireImmediate = false, isVolatile = true
                listenersType.push(fn);
                break;

            case 2:
                // when fireImmediate = true, isVolatile = false
                listenersType.push(fn);
                fn.call(null, this.val, this.val, this.prop);
                break;

            case 3:
                // when fireImmediate = true, isVolatile = true
                fn.call(null, this.val, this.val, this.prop);
                break;
        }

        return this;
    };

    ReactiveModelNode.prototype.removeListeners = function (fn) {
        var listeners = this.__listeners__,
            i = listeners.indexOf(fn);

        if (i <= 0) { return this; }
        listeners.splice(i, 1);
        return i;
    };

    ReactiveModelNode.prototype.addSharedListeners = function (fn, isVolatile) {
        var listenersType = isVolatile ? this.__sharedVolatileListeners__ : this.__sharedListeners__;
        listenersType.push(fn);
    };

    ReactiveModelNode.prototype.removeSharedListeners = function (fn) {
        var listeners = this.__sharedListeners__,
            i = listeners.indexOf(fn);

        if (i <= 0) { return this; }
        listeners.splice(i, 1);
        return i;
    };

    ReactiveModelNode.prototype.setPreState = function (state) {
        return this.state.pre = state;
    };

    ReactiveModelNode.prototype.setPostState = function (state) {
        this.val = state;
        return this.state.post = state;
    };

    ReactiveModelNode.prototype.executeAllListeners = function (stopRecursiveCalls) {
        var node = this,
            state = node.state,
            args,
            parent,
            listeners,
            sharedListeners,
            volatileListeners,
            sharedVolatileListeners;

        function fire (listener) {
            if (parent) {
                args.push(state.pre);
                args.push(state.post);
                args.push(node.prop);
            } else {
                args.push(node.getState());
            }

            listener.apply(undefined, args);
        }

        function fireShared (sharedListener) {
            sharedListener().apply(undefined);
        }

        do {
            args = [];
            parent = node.getParent();
            listeners = node.__listeners__;
            volatileListeners = node.__volatileListeners__;
            sharedListeners = node.__sharedListeners__;
            sharedVolatileListeners = node.__sharedVolatileListeners__;

            listeners.forEach(fire);
            volatileListeners.forEach(fire);

            if (!stopRecursiveCalls) {
                sharedListeners.forEach(fireShared);
                sharedVolatileListeners.forEach(fireShared);
                node.setPreState(node.state.post);
            }

            volatileListeners.length = 0;
            sharedVolatileListeners.length = 0;
        } while (node = stopRecursiveCalls ? undefined : node.getParent());
    };


    function ReactiveModel() {
        var reactiveModelRoot;

        Object.defineProperty(this.model = {}, '__foreign', {
            enumerable: false,
            configurable: false,
            value: []

        });

        reactiveModelRoot = this.reactiveModelRoot = new ReactiveModelNode().setRootContext(this.model);
        this.reactiveModelDef = { $node: reactiveModelRoot };

        this._lockModelReactivity = false;
        this._silentUpdate = false;

        this._callbackQueue = [];
        this.queueClearCallbacks = [];
    }

    ReactiveModel.prototype.prop = function(prop, val, fn) {
        var self = this,
            model = this.model,
            preoperyDiscriptor = {},
            def = this.reactiveModelDef,
            cbQueue = this._callbackQueue,
            _private = '_' + prop;

        if (arguments.length === 1) {
            return model[prop];
        }

        if (prop in model) {
            model[prop] = val;
            return this;
        }

        preoperyDiscriptor[_private] = {
            enumerable: false,
            configurable: false,
            writable: true,
            value: val
        };

        preoperyDiscriptor[prop] = {
            enumerable: true,
            configurable: false,
            get: function () {
                var val = this[_private];

                if (val instanceof Array) {
                    val = val.slice(0);
                }

                return val;
            },
            set: function (val) {
                var reactiveNode = def[prop].$node;

                reactiveNode.setPreState(this[_private]);
                this[_private] = val;
                reactiveNode.setPostState(this[_private]);

                if (self._silentUpdate) {
                    return;
                }

                if(self._lockModelReactivity) {
                    cbQueue.push([reactiveNode, prop]);
                } else {
                    reactiveNode.executeAllListeners();
                    self.fireLastUpdateCallbacks([prop]);
                }
            }
        };

        this._updateBroadcaster(prop, val, fn);
        Object.defineProperties(model, preoperyDiscriptor);

        return this;
    };

    ReactiveModel.prototype.oncePropChange = function (prop, fn, fireImmediate) {
        var modelDef = this.reactiveModelDef;

        modelDef[prop].$node.addListeners(fn, fireImmediate, true);
        return this;
    };

    ReactiveModel.prototype.oncePropsChange = function (props, fn, fireImmediate) {
        var modelDef = this.reactiveModelDef,
            groupReactiveNodes = props.map(function (prop) { return modelDef[prop].$node; }),
            sharedOps = new SharedNodeOps(groupReactiveNodes);

        sharedOps.registerSingletonListener(fn, fireImmediate, true);
        this.onQueueClear(sharedOps.reset.bind(sharedOps));

        return this;
    };

    ReactiveModel.prototype.onPropChange = function (prop, fn, fireImmediate) {
        var modelDef = this.reactiveModelDef;

        modelDef[prop].$node.addListeners(fn, fireImmediate);
        return this;
    };

    ReactiveModel.prototype.onPropsChange = function (props, fn, fireImmediate) {
        var modelDef = this.reactiveModelDef,
            groupReactiveNodes = props.map(function (prop) { return modelDef[prop].$node; }),
            sharedOps = new SharedNodeOps(groupReactiveNodes);

        sharedOps.registerSingletonListener(fn, fireImmediate);
        this.onQueueClear(sharedOps.reset.bind(sharedOps));

        return this;
    };

    ReactiveModel.prototype.onModelChange = function (fn) {
        this.reactiveModelDef.$node.addListeners(fn);

        return this;
    };

    ReactiveModel.prototype._updateBroadcaster = function (prop, val, lFn) {
        var root = this.reactiveModelRoot,
            def = this.reactiveModelDef,
            reactiveNode;

        reactiveNode = new ReactiveModelNode(prop, val);
        lFn && typeof lFn === 'function' && reactiveNode.addListeners(lFn);
        root.setLink(reactiveNode);
        def[prop] = { $node: reactiveNode };
    };

    ReactiveModel.prototype.linkExternalModel = function (foreignModel) {
        var model = this.model;

        if (!(foreignModel instanceof ReactiveModel)) { return; }

        model.__foreign.push(foreignModel);
        this.reactiveModelRoot.setLink(foreignModel.reactiveModelRoot);

        return this;
    };

    ReactiveModel.prototype.getModel = function () {
        return this.model;
    };

    ReactiveModel.prototype.lock = function () {
        this._lockModelReactivity = true;
        return this;
    };

    ReactiveModel.prototype.unlock = function () {
        this.clearPendingQueues();
        this._lockModelReactivity = false;
        return this;
    };

    ReactiveModel.prototype.keepSilence = function () {
        this._silentUpdate = true;
        return this;
    };

    ReactiveModel.prototype.resetSilence = function () {
        this._silentUpdate = false;
        return this;
    };

    ReactiveModel.prototype.clearPendingQueues = function () {
        var cbQueue = this._callbackQueue,
            propertyUpdated = [],
            i,
            l;

        if (cbQueue.length === 0) { return; }

        for (i = 0, l = cbQueue.length; i < l; i++) {
            propertyUpdated.push(cbQueue[i][1]);
            cbQueue[i][0].executeAllListeners(i === l - 1 ? false : true);
        }
        cbQueue.length = 0;
        this.fireLastUpdateCallbacks(propertyUpdated);
        return this;
    };

    ReactiveModel.prototype.onQueueClear = function (fn) {
        if (this.queueClearCallbacks.indexOf(fn) >= 0) { return; }

        this.queueClearCallbacks.push(fn);
        return this;
    };

    ReactiveModel.prototype.fireLastUpdateCallbacks = function (props) {
        var cbs = this.queueClearCallbacks,
            propsObj = {},
            i,
            l;

        for (i = 0, l = props.length; i < l; i++) {
            propsObj[props[i]] = 1;
        }

        cbs.forEach(function (cb) { cb.call(null, propsObj); });

        return this;
    };

    FusionCharts.registerComponent('api', 'reactive-model', ReactiveModel);
}]);

FusionCharts.register('module', ['private', 'modules.renderer.js-time-series-intervals-draw',
    function () {

        var global = this,
            lib = global.hcLib,
            BaseConfig = FusionCharts.getComponent('main', 'baseconfig'),
            tickClosedLineNane = 'fcTickClosedLine',
            defaultFormatterFn = function(value) {return value;},
            DrawIntervals;

        DrawIntervals = function(name, intervals) {
            BaseConfig.call(this);
            this.config.name = {
                value: name
            },
            this.config.intervals = {
                value: intervals || {},
                defaultValue: {}
            },
            this.config.elements = {
                value: {
                    group: undefined,
                    ticks: {
                        group: undefined,
                        type: 'path'
                    },
                    label: {
                        group: undefined,
                        type: 'text'
                    },
                    labelBgRect: {
                        group: undefined,
                        type: 'path'
                    }
                }
            };
            this.config.styleApplied = {
                value: false
            };
            this.elementRecycle = new (FusionCharts.getComponent('api', 'elementrecycle'))();
            this.filterAttr = undefined;

            this.tickClassName = name + '-tick';
            this.labelClassName = name + '-label';
            this.labelBgClassName = name + '-labelBg';
        };

        DrawIntervals.prototype = Object.create(BaseConfig.prototype);

        DrawIntervals.prototype.setStyleSheet = function() {
            var self = this,
                intervals = self.getConfig('intervals'),
                scale = intervals.getConfig('scale'),
                name = self.getConfig('name'),
                groupClassName = scale.getConfig('groupClassName'),
                paper = scale.getConfig('graphics').paper,
                intervalObj = intervals.getConfig('intervals');

            paper.cssAddRule('.' + groupClassName + ' .' + this.labelClassName, {
                'font-family': intervalObj[name].labelFontFamily,
                'font-size': ('' + intervalObj[name].labelFontSize).replace(/px/i, '') + 'px',
                'font-weight': intervalObj[name].labelFontWeight,
                'font-style': intervalObj[name].labelFontStyle,
                'fill': intervalObj[name].labelColor
            });
            paper.cssAddRule('.' + groupClassName + ' .' + this.labelBgClassName, {
                fill: intervalObj[name].labelBgColor,
                'fill-opacity': intervalObj[name].labelBgOpacity
            });
            paper.cssAddRule('.' + groupClassName + ' .' + this.tickClassName, {
                'stroke-width': intervalObj[name].tickThickness,
                stroke: intervalObj[name].tickColor
            });
        };

        /*
         * Main draw function that handle the other drawing function
         * @returns {Object} instance of the class
         */
        DrawIntervals.prototype.draw = function() {
            var self = this,
                intervals = self.getConfig('intervals'),
                scale = intervals.getConfig('scale'),
                name = self.getConfig('name'),
                elements = self.getConfig('elements'),
                intervalObj = intervals.getConfig('intervals'),
                paper = scale.getConfig('graphics').paper,
                groupClassName = scale.getConfig('groupClassName'),
                formatter = intervalObj[name].formatter || defaultFormatterFn,
                styleApplied = this.getConfig('styleApplied'),
                elementTicksGroup,
                elementLabelGroup,
                elementLabelBgRectGroup,
                elementNameTickArr = [tickClosedLineNane],
                elementNameLabelArr = [],
                elementArr = [],
                attr = {
                    scale: scale,
                    name: name,
                    intervalObj: intervalObj,
                    vertical: scale.getConfig('vertical'),
                    opposite: scale.getConfig('opposite'),
                    tickLength: Number(intervalObj[name].tickLength || 0)
                },
                ln,
                i;

            elements.group = elements.group || (elements.group = paper.group(
                'intervals-container ' + groupClassName , scale.getScaleGroup()));

            elementTicksGroup = elements.ticks.group || (elements.ticks.group =
                paper.group('interval-ticks ' + this.tickClassName, elements.group));

            elementLabelBgRectGroup = elements.labelBgRect.group || (elements.labelBgRect.group =
                paper.group('interval-labelBgRect ' + this.labelBgClassName, elements.group));

            elementLabelGroup = elements.label.group || (elements.label.group =
                paper.group('interval-ticks ' + this.labelClassName, elements.group));

            if (styleApplied === false) {
                this.setStyleSheet();
                this.setConfig('styleApplied', true);
            }

            self.elementRecycle.preProcessor();

            // This is a hacki process for drawing the tick closed line
            if(intervalObj[name].closeTicks) {
                intervalObj[name].drawTicks && this.drawTickClosedLine(attr);

            }

            intervals.each(name, function(i) {
                elementArr.push(i);
                elementNameTickArr.push(formatter(i) + '-' + i);
                elementNameLabelArr.push(formatter(i) + '-' + i);
            });

            self.elementRecycle.insertReserveElement('label', elementNameLabelArr);
            self.elementRecycle.insertReserveElement('labelBgRect', elementNameLabelArr);
            self.elementRecycle.insertReserveElement('ticks', elementNameTickArr);

            for(i = 0, ln = elementArr.length; i < ln; i += 1) {
                intervalObj[name].drawLabelBgRect && self.drawLabelBgRect(elementArr[i], attr);
                intervalObj[name].drawLabels && self.drawLabels(elementArr[i], attr);
                intervalObj[name].drawTicks && self.drawTicks(elementArr[i], attr);
            }
            self.elementRecycle.postProcessor();
            return self;
        };

        /*
         * function to draw the line that closed the tick or the axis line
         * @param {Object} attr required parameter to draw
         * @returns {object} instance of the class
         */
        DrawIntervals.prototype.drawTickClosedLine = function(attr) {
            var self = this,
                scale = attr.scale,
                vertical = attr.vertical,
                scaleLength = scale.getConfig('length'),
                filterAttr = this.filterAttr,
                attrFilter,
                startX,
                startY,
                endX,
                endY;

            startX = scale.getConfig('posX');
            startY = scale.getConfig('posY');

            endX = vertical ? (endY = startY + scaleLength, startX) : (endY = startY, startX + scaleLength);
            attrFilter = {
                path: 'M' + startX +','+ startY + 'L' + endX +','+ endY
            };
            filterAttr && filterAttr.call(this, 'closeLine', attrFilter, undefined, attr);
            self.drawElements('ticks', attrFilter, {
                elemName: tickClosedLineNane
            });
            return self;
        };

        /*
         * function to draw the ticks
         * @param {integer} i position to be drawn
         * @param {Object} attr required parameter to draw
         * @returns {object} instance of the class
         */
        DrawIntervals.prototype.drawTicks = function(i, attr) {
            var self = this,
                scale = attr.scale,
                name = attr.name,
                intervalObj = attr.intervalObj,
                vertical = attr.vertical,
                opposite = attr.opposite,
                filterAttr = this.filterAttr,
                formatter = intervalObj[name].formatter || defaultFormatterFn,
                tickLength = Number(intervalObj[name].tickLength || 0),
                tickPad = Number(intervalObj[name].tickPadding || 0),
                attrFilter,
                startX,
                startY,
                endX,
                endY;

            startX = vertical ? (startY = scale.getPixel(i), (scale.getConfig('posX') +
                (opposite ? tickPad : -tickPad))) : (startY = scale.getConfig('posY') + (opposite ? -tickPad : tickPad),
                scale.getPixel(i));

            endX = vertical ? (endY = startY, (opposite ? startX + tickLength : startX - tickLength)) :
                ((endY = opposite ? startY - tickLength : startY + tickLength), startX);
            attrFilter = {
                path: 'M' + startX +','+ startY + 'L' + endX +','+ endY
            };
            filterAttr && filterAttr.call(this, 'ticks', attrFilter, i, attr);
            self.drawElements('ticks', attrFilter,{
                elemName: formatter(i) + '-' + i
            });
            return self;
        };

        DrawIntervals.prototype.getLabelxy = function(i, attr) {
            var scale = attr.scale,
                name = attr.name,
                intervalObj = attr.intervalObj,
                vertical = attr.vertical,
                opposite = attr.opposite,
                valuePad = Number(intervalObj[name].valuePadding || 0),
                x,
                y;

            x = vertical ? (y = scale.getPixel(i), (scale.getConfig('posX') +
                (opposite ? valuePad : -valuePad))) : (y = scale.getConfig('posY') + (opposite ? -valuePad : valuePad),
                scale.getPixel(i));

            return {
                x: x,
                y: y
            };
        };

        /*
         * function to draw the labels
         * @param {integer} i position to be drawn
         * @param {Object} attr required parameter to draw
         * @returns {object} instance of the class
         */
        DrawIntervals.prototype.drawLabels = function(i, attr) {
            var self = this,
                name = attr.name,
                intervalObj = attr.intervalObj,
                vertical = attr.vertical,
                opposite = attr.opposite,
                filterAttr = this.filterAttr,
                formatter = intervalObj[name].formatter || defaultFormatterFn,
                textAnchor = vertical ? opposite ? 'start' : 'end' : 'middle',
                verticalAlign = vertical ? 'middle' : opposite ? 'bottom' : 'top',
                attrFilter,
                labelPos;

            labelPos = self.getLabelxy(i, attr);

            attrFilter = {
                text: ''+formatter(i),
                'text-anchor': textAnchor,
                'vertical-align': verticalAlign,
                x: labelPos.x,
                y: labelPos.y
            };
            filterAttr && filterAttr.call(this, 'label', attrFilter, i, attr);
            self.drawElements('label', attrFilter, {
                elemName: formatter(i) + '-' + i
            });
            return self;
        };

        DrawIntervals.prototype.drawLabelBgRect = function(i, attr) {
            var self = this,
                scale = attr.scale,
                smartLabel = scale.getConfig('smartLabel'),
                name = attr.name,
                intervalObj = attr.intervalObj,
                vertical = attr.vertical,
                opposite = attr.opposite,
                filterAttr = this.filterAttr,
                formatter = intervalObj[name].formatter || defaultFormatterFn,
                fontSizeNumeric = Number((''+intervalObj[name].labelFontSize).replace(/px/i, '')),
                labelBgPadding = Number(intervalObj[name].labelBgPadding || 2),
                textSize,
                relativeTextAttr,
                textWidthBy2,
                textHeightBy2,
                attrFilter,
                startX,
                startY,
                endX,
                endY,
                labelPos;

            labelPos = self.getLabelxy(i, attr);
            smartLabel.setStyle({
                fontSize: fontSizeNumeric + 'px',
                fontFamily: intervalObj[name].labelFontFamily
            });
            relativeTextAttr = {
                x: labelPos.x,
                y: labelPos.y,
                'text-anchor': vertical ? opposite ? 'start' : 'end' : 'middle',
                'vertical-align': vertical ? 'middle' : opposite ? 'bottom' : 'top'
            };
            textSize = smartLabel.getOriSize(formatter(i));
            textWidthBy2 = textSize.width / 2;
            textHeightBy2 = textSize.height / 2;
            filterAttr && filterAttr.call(this, 'label', relativeTextAttr, i, attr);

            relativeTextAttr.x += relativeTextAttr['text-anchor'] === 'start' ? textWidthBy2 :
                relativeTextAttr['text-anchor'] === 'end' ? -textWidthBy2 : 0;
            relativeTextAttr.y += relativeTextAttr['vertical-align'] === 'bottom' ? -textHeightBy2 :
                relativeTextAttr['vertical-align'] === 'top' ? textHeightBy2 : 0;

            startX = relativeTextAttr.x - textWidthBy2 - labelBgPadding;
            startY = relativeTextAttr.y - textHeightBy2 - labelBgPadding;
            endX = relativeTextAttr.x + textWidthBy2 + labelBgPadding;
            endY = relativeTextAttr.y + textHeightBy2 + labelBgPadding;

            attrFilter = {
                path: 'M' + startX +','+ startY + 'L' + startX +','+ endY +
                    'L' + endX +','+ endY + 'L' + endX +','+ startY + 'Z'
            };
            filterAttr && filterAttr.call(this, 'labelBgRect', attrFilter, i, attr);
            self.drawElements('labelBgRect', attrFilter,{
                elemName: formatter(i) + '-' + i
            });
            return self;
        };

        /*
         * this function handles drawing of the elements individually from collecting them from pool or by creating
         * them
         * @param {String} element name of the element ticks, label
         * @param {Object} attrs attribute to be set to the drawing elements
         * @param {Object} extra extra information to be passed
         * @returns {Object} instance of the class
         */
        DrawIntervals.prototype.drawElements = function(element, attrs, extra) {
            var intervals = this.getConfig('intervals'),
                scale = intervals.getConfig('scale'),
                paper = scale.getConfig('graphics').paper,
                elementObj = this.getConfig('elements')[element],
                elementGroup = elementObj.group,
                poolElem;


            switch(elementObj.type) {
                case 'text':
                    if(poolElem = this.elementRecycle.getElementIfExist(element, extra.elemName)) {
                        poolElem.attr(attrs);
                    } else {
                        this.elementRecycle.insertElement(element, extra.elemName,
                            paper.text(attrs, elementGroup, true));
                    }
                    break;
                case 'path':
                    if(poolElem = this.elementRecycle.getElementIfExist(element, extra.elemName)) {
                        poolElem.attr(attrs);
                    } else {
                        this.elementRecycle.insertElement(element, extra.elemName,
                            paper.path(attrs, elementGroup, true));
                    }
                    break;
            }
            return this;
        };

        DrawIntervals.prototype.getLogicalSpace = function(width, height) {
            var self = this,
                intervals = self.getConfig('intervals'),
                scale = intervals.getConfig('scale'),
                smartLabel = scale.getConfig('smartLabel'),
                name = self.getConfig('name'),
                intervalObj = intervals.getConfig('intervals'),
                elements = self.getConfig('elements'),
                thisIntervalObj = intervalObj[name],
                formatter = thisIntervalObj.formatter || defaultFormatterFn,
                vertical = scale.getConfig('vertical'),
                styleApplied = this.getConfig('styleApplied'),
                groupClassName= scale.getConfig('groupClassName'),
                paper = scale.getConfig('graphics').paper,
                maxLabel = '',
                lineHeightFactor = 1.2,
                fontStyle,
                fontSizeNumeric,
                retObj = {
                    width: width,
                    height: height
                },
                tickSize = 0,
                labelSize = 0;

            if (styleApplied === false) {
                this.setStyleSheet();
                this.setConfig('styleApplied', true);
            }
            elements.group = elements.group || (elements.group = paper.group(
                'intervals-container ' + groupClassName, scale.getScaleGroup()));
            fontStyle = lib.getSmartComputedStyle(elements.group, this.labelClassName, paper);
            fontSizeNumeric = Number((''+fontStyle.fontSize).replace(/px/i, ''));

            if(vertical) {
                smartLabel.setStyle(fontStyle);
                intervals.each(name, function(i) {
                    var thisLabel = ''+formatter(i);
                    maxLabel = maxLabel.length < thisLabel.length ? thisLabel : maxLabel;
                });
                tickSize = thisIntervalObj.drawTicks ? Number(thisIntervalObj.tickLength) +
                    Number(thisIntervalObj.tickPadding) : 0;
                labelSize = thisIntervalObj.drawLabels ? Number(thisIntervalObj.valuePadding) +
                    smartLabel.getOriSize(maxLabel).width : 0;
                retObj.width = Math.max(tickSize, labelSize);
            } else {
                tickSize = thisIntervalObj.drawTicks ? Number(thisIntervalObj.tickLength) +
                    Number(thisIntervalObj.tickPadding) : 0;
                labelSize = thisIntervalObj.drawLabels ? Number(thisIntervalObj.valuePadding) +
                    fontSizeNumeric * lineHeightFactor : 0;
                retObj.height = Math.max(tickSize, labelSize);
            }
            return retObj;
        };


        FusionCharts.registerComponent('main', 'drawintervals', DrawIntervals);
    }

]);

FusionCharts.register('module', ['private', 'modules.renderer.js-time-series-intervals-linear',
    function () {

        var global = this,
            lib = global.hcLib,
            BaseConfig = FusionCharts.getComponent('main', 'baseconfig'),
            LinearIntervals;

        LinearIntervals = function() {
            BaseConfig.call(this);
            this.config.intervals = {
                    value: {
                        major: {
                            intervalPoints: [],
                            intervalGraphicObj: undefined,
                            formatter: function(value) {
                                return lib.toPrecision(value, 10);
                            },
                            drawTicks: false,
                            drawLabels: true,
                            closeTicks: false,
                            labelStep: 1,
                            tickLength: 5,
                            tickPadding: 0,
                            valuePadding: 7,
                            tickThickness: 1,
                            intervalNo: undefined
                        }
                    }
                };
            this.config.scale = {
                value: undefined,
                default: undefined,
                setCallback: this.parseUserConfig
            };
            this.initIntervalGraphicObj();
        };

        LinearIntervals.prototype = Object.create(BaseConfig.prototype);

        LinearIntervals.prototype.parseUserConfig = function() {
            var userConfig = this.getConfig('scale').getConfig('userConfig'),
                intervals = this.getConfig('intervals'),
                interval,
                tick,
                label,
                style,
                formatter;
            if(!userConfig) {return this;}
            for(interval in intervals) {
                if(intervals.hasOwnProperty(interval)) {
                    if(!userConfig[interval]) {continue;}
                    if(tick = userConfig[interval].tick) {
                        intervals[interval].drawTicks = !tick.hide;
                        if(style = tick.style) {
                            style.stroke && (intervals[interval].tickColor = style.stroke);
                            style['stroke-width'] && (intervals[interval].tickThickness =
                                style['stroke-width']);
                        }
                    }
                    if(label = userConfig[interval].text) {
                        intervals[interval].drawLabels = !label.hide;
                        if(style = label.style) {
                            style.fill && (intervals[interval].labelColor = style.fill);
                            style['font-size'] && (intervals[interval].labelFontSize =
                                style['font-size']);
                            style['font-family'] && (intervals[interval].labelFontFamily =
                                style['font-family']);
                            style['font-weight'] && (intervals[interval].labelFontWeight =
                                style['font-weight']);
                            style['font-Style'] && (intervals[interval].labelFontStyle =
                                style['font-Style']);
                        }
                    }
                    if(typeof (formatter = userConfig[interval].formatter) === 'function') {
                        intervals[interval].formatter = formatter;
                    }
                }
            }
            return this;
        };

        LinearIntervals.prototype.initIntervalGraphicObj = function() {
            var intervals = this.getConfig('intervals'),
                interval;

            for(interval in intervals) {
                if(intervals.hasOwnProperty(interval)) {
                    intervals[interval].intervalGraphicObj ||
                        (intervals[interval].intervalGraphicObj =
                            new (FusionCharts.getComponent('main', 'drawintervals'))(interval, this));
                }
            }

            return this;
        };

        LinearIntervals.prototype.getNoOfTicksFilter = function(value) {
            return value;
        };

        LinearIntervals.prototype.getNoOfTicks = function() {
            var length = this.getConfig('scale').getConfig('length'),
                suitablePx = 48;

            return this.getNoOfTicksFilter(Math.max(Math.floor(length/suitablePx), 5));
        };

        /*
         * This function set the scale from which the min max are taken and intervals are to be drawn
         * @param {Object} scale the instance of the scale for which the intervals are to be drawn
         */
        LinearIntervals.prototype.setScale = function(scale) {
            this.setConfig('scale', scale);
            return this;
        };

        /*
         * This function will iterate through the intervals for the given name
         * @param {String} name name of the intervals
         * @param {Function} callBack the function which will be called for every value
         * @returns {Object} instance of the LinearIntervals
         */
        LinearIntervals.prototype.each = function (name, callBack) {
            var intervals = this.getConfig('intervals')[name],
                intervalPoints,
                labelStep,
                i,
                len;

            if(intervals) {
                intervalPoints = intervals.intervalPoints;
                labelStep = intervals.labelStep;
                for (i = 0, len = intervalPoints.length; i < len; i += labelStep) {
                    callBack.call(this, intervalPoints[i]);
                }
            }

            return this;
        };

        LinearIntervals.prototype.adjustScaleRange = function(interval) {
            var scale = this.getConfig('scale'),
                range = scale.getRange();

            scale.setRange(Math.ceil(range.max / interval) * interval, Math.floor(range.min / interval) * interval);
        };

        /*
         * Calculate the interval step
         * @param {Number} max the maximum limit of the scale
         * @param {Number} min the minimum limit of the scale
         * @param {Number} noOfInterval total no of intervals should be there
         * @returns {Object} instance of the LinearIntervals
         */
        LinearIntervals.prototype.calculateIntervalSteps = function (max, min, noOfInterval) {
            var oriInterval = Math.abs(max - min) / Math.max(0, noOfInterval),
                tenPowInterval = Math.pow(10, Math.floor(Math.log(oriInterval) / Math.LN10)),
                error = oriInterval / tenPowInterval;

            if (error >= 7) {
                tenPowInterval *= 10;
            } else if (error >= 3) {
                tenPowInterval *= 5;
            } else if (error >= 1) {
                tenPowInterval *= 2;
            }
            return tenPowInterval;
        };

        /*
         * This function will make the interval ready to be drawn
         * @returns {Object} instance of the LinearIntervals
         */
        LinearIntervals.prototype.manageIntervals = function () {
            var intervals = this.getConfig('intervals'),
                scale = this.getConfig('scale'),
                majorIntervalObj = intervals.major,
                intervalMin,
                intervalMax,
                intervalStep,
                range,
                ln,
                i;

            range = scale.getVisibleRange();
            intervalStep = this.calculateIntervalSteps(range.max, range.min, majorIntervalObj.intervalNo ||
                this.getNoOfTicks());
            this.adjustScaleRange(intervalStep);
            range = scale.getVisibleRange();
            intervalMin = Math.ceil(range.min / intervalStep) * intervalStep;
            intervalMax = Math.floor(range.max / intervalStep) * intervalStep + intervalStep / 2;
            ln = Math.max(0, Math.ceil((intervalMax - intervalMin) / intervalStep)) | 0;

            majorIntervalObj.intervalPoints.length = 0;

            for (i = 0; i < ln; i += 1) {
                majorIntervalObj.intervalPoints.push(intervalMin + i * intervalStep);
            }

            return this;
        };

        LinearIntervals.prototype.draw = function() {
            var intervals = this.getConfig('intervals'),
                interval,
                intervalGraphicObj;
            this.manageIntervals();

            for(interval in intervals) {
                if(intervals.hasOwnProperty(interval)) {
                    intervalGraphicObj = intervals[interval].intervalGraphicObj ||
                        (intervals[interval].intervalGraphicObj =
                            new (FusionCharts.getComponent('main', 'drawintervals'))(interval, this));
                    intervalGraphicObj.draw();
                }
            }

            return this;
        };

        LinearIntervals.prototype.getLogicalSpace = function(width, height) {
            var intervals = this.getConfig('intervals'),
                interval,
                intervalGraphicObj,
                retObj = {
                    width: 0,
                    height: 0
                },
                returnDimension;

            this.manageIntervals();

            for(interval in intervals) {
                if(intervals.hasOwnProperty(interval)) {
                    intervalGraphicObj = intervals[interval].intervalGraphicObj ||
                        (intervals[interval].intervalGraphicObj =
                            new (FusionCharts.getComponent('main', 'drawintervals'))(interval, this));
                    returnDimension = intervalGraphicObj.getLogicalSpace(width, height);
                    retObj.width = Math.max(retObj.width, returnDimension.width);
                    retObj.height = Math.max(retObj.height, returnDimension.height);
                }
            }

            return retObj;
        };

        FusionCharts.registerComponent('main', 'linearintervals', LinearIntervals);
    }

]);

FusionCharts.register('module', ['private', 'modules.renderer.js-time-series-intervals-time',
    function () {

        var LinearIntervals = FusionCharts.getComponent('main', 'linearintervals'),
            TimeRules = FusionCharts.getComponent('api', 'timerules');

        function TimeIntervals() {
            LinearIntervals.call(this);
            this.config.intervals = {
                    value: {
                        span: {
                            timeUnit: {},
                            intervalPoints: [],
                            intervalGraphicObj: undefined,
                            formatter: function(value) {
                                return value;
                            },
                            show: true,
                            drawTicks: false,
                            drawLabels: true,
                            closeTicks: false,
                            labelStep: 1,
                            tickLength: 0,
                            tickPadding: 0,
                            valuePadding: 2,
                            tickThickness: 0
                        },
                        minor: {
                            timeUnit: {},
                            intervalPoints: [],
                            intervalGraphicObj: undefined,
                            formatter: function(value) {
                                return value;
                            },
                            show: true,
                            drawTicks: true,
                            drawLabels: true,
                            closeTicks: false,
                            labelStep: 1,
                            tickLength: 5,
                            tickPadding: 0,
                            valuePadding: 9,
                            tickThickness: 1,
                            intervalNo: undefined
                        },
                        major: {
                            timeUnit: {},
                            intervalPoints: [],
                            intervalGraphicObj: undefined,
                            formatter: function(value) {
                                return value;
                            },
                            show: true,
                            drawTicks: true,
                            drawLabels: true,
                            closeTicks: false,
                            labelStep: 1,
                            tickLength: 10,
                            tickPadding: 0,
                            valuePadding: 16,
                            tickThickness: 1
                        },
                        context: {
                            timeUnit: {},
                            intervalPoints: [],
                            intervalGraphicObj: undefined,
                            formatter: function(value) {
                                return value;
                            },
                            show: true,
                            drawTicks: false,
                            drawLabels: true,
                            closeTicks: false,
                            labelStep: 1,
                            tickLength: 0,
                            tickPadding: 0,
                            valuePadding: 30,
                            tickThickness: 0
                        }
                    }
                };
            this.config.showSingleTick = {
                value: false
            };
            this.config.showSingleTickWithMajor = {
                value: false
            };
            this.timeRules = new TimeRules();
            this.initIntervalGraphicObj();
        }

        TimeIntervals.prototype = Object.create(LinearIntervals.prototype);

        TimeIntervals.prototype.parseUserConfig = function() {
            LinearIntervals.prototype.parseUserConfig.call(this);
            var userConfig = this.getConfig('scale').getConfig('userConfig'),
                customTimeSpan,
                i,
                ln;
            if(!userConfig) {return;}
            this.timeRules.changeRuleState('week', !!userConfig.showWeek);
            this.timeRules.changeRuleState('quarter', !!userConfig.showQuarter);
            if(customTimeSpan = userConfig.customTimeSpan) {
                for (i = 0, ln = customTimeSpan.length; i < ln; i += 1) {
                    this.timeRules.insertRule(customTimeSpan[i]);
                }
            }
        };

        TimeIntervals.prototype.preSetTimeIntervalCallback = function(val, args) {
            if(args.align === 'middle' && args.intervalStore.length) {
                args.intervalStore[args.intervalStore.length - 1] +=
                    Math.abs(args.intervalStore[args.intervalStore.length - 1] - val)/2;
            }
            return val;
        };

        TimeIntervals.prototype.setIntervals = function(args) {
            var self = this,
                prevValue,
                intervals = this.getConfig('intervals'),
                intervalRules = this.timeRules.getRules(),
                intervalStep,
                pushTimeStamp = 0,
                rulesIndex = args.index,
                name;

            intervalStep = args.step;
            for (;;) {
                prevValue = prevValue !== undefined ? prevValue : args.min;
                pushTimeStamp = this.timeRules.unitToTimeStamp[intervalRules[rulesIndex].name].call(self.timeRules,
                    prevValue, intervalStep, args.noExtreme);
                pushTimeStamp = this.preSetTimeIntervalCallback(pushTimeStamp, args);
                if (pushTimeStamp < args.min) {continue;}
                if (pushTimeStamp > args.max) {break;}
                prevValue = pushTimeStamp;
                // For single axis eg for navigation
                if(args.showSingleTickWithMajor) {
                    name = intervals.minor.timeUnit.name;
                    if(name === 'second' || name === 'minute') {
                        name = 'hour';
                    }
                    if(this.timeRules.skipLabel(name, pushTimeStamp)) {
                        args.majorIntervalStore.push(pushTimeStamp);
                        continue;
                    }
                }

                args.intervalStore.push(pushTimeStamp);
            }

            return this;
        };
        /*
         * This function will make the interval ready to be drawn
         * @returns {Object} instance of the LinearIntervals
         */
        TimeIntervals.prototype.manageIntervals = function () {
            var self = this,
                intervals = this.getConfig('intervals'),
                intervalsRules = this.timeRules.getRules(),
                scale = this.getConfig('scale'),
                majorIntervalObj = intervals.major,
                minorIntervalObj = intervals.minor,
                spanIntervalObj = intervals.span,
                contextIntervalObj = intervals.context,
                showSingleTick = this.getConfig('showSingleTick'),
                showSingleTickWithMajor = this.getConfig('showSingleTickWithMajor'),
                formatterFnMinorPre,
                formatterFnMajorPre,
                formatterFnSpanPre,
                formatterFnContextPre,
                max,
                min,
                minorTimeRules,
                minorIndex,
                majorIndex,
                contextIndex,
                range,
                target;

            range = scale.getVisibleRange();
            target = (range.max - range.min) / (minorIntervalObj.intervalNo || this.getNoOfTicks());
            max = range.max;
            min = target > 1 ? range.min - 1 : range.min;
            minorTimeRules = this.timeRules.getSuitableInterval(target);
            minorIndex = minorTimeRules.index;
            if(minorIndex === undefined) {
                return;
            }
            minorIntervalObj.intervalPoints.length = 0;
            majorIntervalObj.intervalPoints.length = 0;
            spanIntervalObj.intervalPoints.length = 0;
            contextIntervalObj.intervalPoints.length = 0;
            minorIntervalObj.timeUnit = {};
            majorIntervalObj.timeUnit = {};
            spanIntervalObj.timeUnit = {};
            contextIntervalObj.timeUnit = {};

            if (showSingleTick) {
                formatterFnMinorPre = this.timeRules.formatter[intervalsRules[minorIndex].name];
                minorIntervalObj.formatter = majorIntervalObj.formatter = function(val) {
                    return (formatterFnMinorPre.single || formatterFnMinorPre.default).call(self.timeRules, val);
                };
                minorIntervalObj.timeUnit.name = minorTimeRules.name;
                minorIntervalObj.timeUnit.step = minorTimeRules.step;
                minorIntervalObj.show && this.setIntervals({
                    max: max,
                    min: min,
                    index: minorTimeRules.index,
                    step: minorTimeRules.step,
                    intervalStore: minorIntervalObj.intervalPoints,
                    majorIntervalStore: majorIntervalObj.intervalPoints,
                    showSingleTickWithMajor: showSingleTickWithMajor
                });
                return;
            }

            if(intervalsRules[minorTimeRules.index].showInSpan === true && intervalsRules[minorIndex + 1]) {
                formatterFnSpanPre = this.timeRules.formatter[minorTimeRules.name];
                spanIntervalObj.formatter = function(val) {
                    return (formatterFnSpanPre.span || formatterFnSpanPre.default).call(self.timeRules, val);
                };
                spanIntervalObj.timeUnit.name = minorTimeRules.name;
                spanIntervalObj.timeUnit.step = minorTimeRules.step;
                spanIntervalObj.show && this.setIntervals({
                    max: max,
                    min: min,
                    index: minorTimeRules.index,
                    step: minorTimeRules.step,
                    intervalStore: spanIntervalObj.intervalPoints,
                    align: 'middle'
                });
                formatterFnMinorPre = this.timeRules.formatter[intervalsRules[minorIndex - 1].name];
                minorIntervalObj.formatter = function(val) {
                    return (formatterFnMinorPre.minor || formatterFnMinorPre.default).call(self.timeRules, val);
                };
                minorIntervalObj.timeUnit.name = minorTimeRules.name;
                minorIntervalObj.timeUnit.step = minorTimeRules.step;
            } else {
                formatterFnMinorPre = this.timeRules.formatter[intervalsRules[minorIndex].name];
                minorIntervalObj.formatter = function(val) {
                    return (formatterFnMinorPre.minor || formatterFnMinorPre.default).call(self.timeRules, val);
                };
                minorIntervalObj.timeUnit.name = minorTimeRules.name;
                minorIntervalObj.timeUnit.step = minorTimeRules.step;
            }


            minorIntervalObj.show && this.setIntervals({
                max: max,
                min: min,
                index: minorTimeRules.index,
                step: minorTimeRules.step,
                intervalStore: minorIntervalObj.intervalPoints,
                noExtreme: true
            });
            if((majorIndex = intervalsRules[minorIndex + 1] && minorIndex + 1) !== undefined) {
                formatterFnMajorPre = this.timeRules.formatter[intervalsRules[majorIndex].name];
                majorIntervalObj.formatter = function(val) {
                    return (formatterFnMajorPre.major || formatterFnMajorPre.default).call(self.timeRules, val);
                };
                majorIntervalObj.timeUnit.name = intervalsRules[majorIndex].name;
                majorIntervalObj.timeUnit.step = intervalsRules[majorIndex].step;
                majorIntervalObj.show && this.setIntervals({
                    max: max,
                    min: min,
                    index: majorIndex,
                    step: 1,
                    intervalStore: majorIntervalObj.intervalPoints
                });
            }
            if((contextIndex = intervalsRules[majorIndex + 1] && majorIndex + 1) !== undefined) {
                formatterFnContextPre = this.timeRules.formatter[intervalsRules[contextIndex].name];
                contextIntervalObj.formatter = function(val) {
                    return (formatterFnContextPre.context || formatterFnContextPre.default).call(self.timeRules, val);
                };
                contextIntervalObj.timeUnit.name = intervalsRules[contextIndex].name;
                contextIntervalObj.timeUnit.step = intervalsRules[contextIndex].step;
                contextIntervalObj.show && this.setIntervals({
                    max: range.max,
                    min: range.min,
                    index: contextIndex,
                    step: 1,
                    intervalStore: contextIntervalObj.intervalPoints
                });
            }
            return this;
        };

        FusionCharts.registerComponent('main', 'timeintervals', TimeIntervals);
    }

]);

FusionCharts.register('module', ['private', 'modules.renderer.js-time-series-scale-base',
    function () {

        var BaseConfig = FusionCharts.getComponent('main', 'baseconfig'),
            BaseScale;

        BaseScale = function() {
            BaseConfig.call(this);
            this.config.reverse = {
                    value: false,
                    defaultValue: false,
                    type: 'boolean'
                };
            this.config.opposite = {
                    value: false,
                    defaultValue: false,
                    type: 'boolean'
                };
            this.config.min = {
                    value: 0,
                    defaultValue: 0,
                    type: 'number'
                };
            this.config.max = {
                    value: 100,
                    defaultValue: 100,
                    type: 'number'
                };
            this.config.visibleMin = {
                    value: undefined,
                    defaultValue: undefined,
                    type: 'number'
                };
            this.config.visibleMax = {
                    value: undefined,
                    defaultValue: undefined,
                    type: 'number'
                };
            this.config.posX = {
                    value: 0,
                    defaultValue: 0,
                    type: 'number'
                };
            this.config.posY = {
                    value: 0,
                    defaultValue: 0,
                    type: 'number'
                };
            this.config.graphics = {
                    value: undefined
                };
            this.config.smartLabel = {
                    value: undefined
                };
            this.config.interval = {
                    value: 'linearintervals',
                    defaultValue: 'linearintervals',
                    validatorFn: function(str) {
                        return str.match(/^(linearintervals|timeintervals)$/);
                    }
                };
            this.config.scaleGroup = {
                value: undefined
            };
            this.config.groupClassName = {
                value: 'axis'
            };
            this.config.userConfig = {
                value: {}
            };
        };

        BaseScale.prototype = Object.create(BaseConfig.prototype);

        BaseScale.prototype.getScaleGroup = function() {
            this.getConfig('scaleGroup') ||
                this.setConfig('scaleGroup', this.getConfig('graphics').paper.group('axis-container'));
            return this.getConfig('scaleGroup');
        };

        BaseScale.prototype.getIntervalObj = function() {
            if(!this.IntervalObj) {
                this.IntervalObj = new (FusionCharts.getComponent('main', this.getConfig('interval')))();
                this.IntervalObj.setConfig('scale', this);
            }
            return this.IntervalObj;
        };
        // function to set the min max of the axis
        BaseScale.prototype.setRange = function(max, min) {
            this.setConfig('max', max <= min ? min + 1 : max);
            this.setConfig('min', min);
            return this;
        };
        // function to get the min max of the axis
        BaseScale.prototype.getRange = function() {
            return {
                max: this.getConfig('max'),
                min: this.getConfig('min')
            };
        };
        // function to set the visible min max of the axis or the part which is visible
        BaseScale.prototype.setVisibleRange = function(max, min) {
            this.setConfig('visibleMax', max);
            this.setConfig('visibleMin', min);
            return this;
        };
        // function to get the visible min max of the axis or the part which is visible
        BaseScale.prototype.getVisibleRange = function() {
            return {
                max: this.getConfig('visibleMax') || this.getConfig('max'),
                min: this.getConfig('visibleMin') || this.getConfig('min')
            };
        };
        // this finction set the position for the axis (x,y) coordinates
        BaseScale.prototype.setAxisPosition = function(x, y) {
            this.setConfig('posX', x);
            this.setConfig('posY', y);
            return this;
        };
        BaseScale.prototype.draw = function() {
            this.getIntervalObj().draw();
            return this;
        };
        BaseScale.prototype.getLogicalSpace = function(width, height) {
            return this.getIntervalObj().getLogicalSpace(width, height);
        };

        FusionCharts.registerComponent('main', 'basescale', BaseScale);
    }

]);

FusionCharts.register('module', ['private', 'modules.renderer.js-time-series-scale-linear',
    function () {
        var BaseScale = FusionCharts.getComponent('main', 'BaseScale'),
            LinearScale;

        LinearScale = function() {
            BaseScale.call(this);
            //determine the axis to be vertical or horizontal default horizontal
            this.config.vertical = {
                    value: false,
                    default: false,
                    type: 'boolean'
                };
            // the total length of the axis
            this.config.length = {
                    value: 100,
                    defaultValue: 100,
                    type: 'number'
                };
        };

        LinearScale.prototype = Object.create(BaseScale.prototype);

        // this will set the axis length
        LinearScale.prototype.setAxisLength = function(length) {
            this.setConfig('length', length);
            return this;
        };
        /*
         * this function will return the zoom quantity
         * @returns {Number} the zoomed quantity
         */
        LinearScale.prototype.getZoom = function() {
            var range = this.getRange(),
                visibleRange = this.getVisibleRange();

            return (range.max - range.min)/(visibleRange.max - visibleRange.min) || 1;
        };
        /*
         * This function calculate the pixel to value ratio for Ex. if axisLength is 100 and diff between
         * lowerLimit and upperLimit is 50 then the pvr will be 2, for 1 value the pixel equivalent will be 2
         * @returns {Number} the pvr
         */
        LinearScale.prototype.getPvr = function() {
            var axisLength = this.getConfig('length'),
                range = this.getRange();

            return (axisLength / (range.max - range.min)) * this.getZoom();
        };
        /*
         * This function will return the pixel equivalent of the value provided relative to the axis
         * @param {Number} value the value fot which the pixel is required
         * @returns {Number} the equivalent pixel for the value provided
         */
        LinearScale.prototype.getPixel = function(value) {
            var vertical = this.getConfig('vertical'),
                // Since vertical axis is itself reveres
                reverse = vertical ? !this.getConfig('reverse') : this.getConfig('reverse'),
                visibleRange = this.getVisibleRange(),
                startPos = vertical ? this.getConfig('posY') : this.getConfig('posX'),
                pvr = this.getPvr();

            return ((reverse ? visibleRange.max - value : value - visibleRange.min) * pvr) + startPos;
        };
        /*
         * This function will return value equivalent for the pixel provided for the relative axis
         * @param {Number} pixel The pixel for which the value is required
         * @returns {Number} the value equivalent to the pixel requested for
         */
        LinearScale.prototype.getValue = function(pixel) {
            var vertical = this.getConfig('vertical'),
                // Since vertical axis is itself reveres
                reverse = vertical ? !this.getConfig('reverse') : this.getConfig('reverse'),
                visibleRange = this.getVisibleRange(),
                startPos = vertical ? this.getConfig('posY') : this.getConfig('posX'),
                pvr = this.getPvr();

            return (((pixel - startPos) / pvr) * (reverse ? -1 : 1)) +
                (reverse ? visibleRange.max : visibleRange.min);
        };

        FusionCharts.registerComponent('main', 'linearscale', LinearScale);
    }

]);

FusionCharts.register('module', ['private', 'modules.renderer.js-time-series-scale-time',
    function () {
        var LinearScale = FusionCharts.getComponent('main', 'linearscale'),
            TimeScale;

        TimeScale = function() {
            LinearScale.call(this);
            this.setConfig('intervals', 'timeintervals');
        };

        TimeScale.prototype = Object.create(LinearScale.prototype);

        FusionCharts.registerComponent('main', 'timescale', TimeScale);
    }

]);

FusionCharts.register('module', ['private', 'modules.renderer.js-time-series-axis',
    function () {

        var BaseConfig = FusionCharts.getComponent('main', 'baseconfig'),
            Axis;

        Axis = function(userConfig) {
            BaseConfig.call(this);
            this.config.scale = {
                    value: 'linearscale',
                    defaultValue: 'linearscale',
                    validatorFn: function(str) {
                        return str.match(/^(linearscale|timescale)$/);
                    }
                };
            this.config.graphics = {
                value: undefined
            };

            this.config.parentGroup = {
                value: undefined
            };

            this.config.smartLabel = {
                value: undefined
            };

            this.config.userConfig = {
                value: userConfig
            };
        };

        Axis.prototype = Object.create(BaseConfig.prototype);
        Axis.prototype.init = function (require) {
            var self = this;
            require(['graphics', 'smartLabel', 'parentGroup', function (graphics, smartLabel, parentGroup) {
                self.setConfig('graphics', graphics);
                self.setConfig('smartLabel', smartLabel);
                self.setConfig('parentGroup', parentGroup);
            }]);
            // @todo check the lifecycle again so that the init does not get called again
            this.getScaleObj().setConfig('graphics', this.getConfig('graphics'));
            this.getScaleObj().setConfig('userConfig', this.getConfig('userConfig'));
            this.getScaleObj().setConfig('smartLabel', this.getConfig('smartLabel'));
            this.getScaleObj().setConfig('scaleGroup', this.getConfig('parentGroup'));
            // this.getScaleObj().setConfig('scaleGroup', this.getConfig('graphics').paper.group('axis-container'));
        };
        Axis.prototype.getScaleObj = function() {
            if(!this.scaleClass) {
                this.scaleClass = new (FusionCharts.getComponent('main', this.getConfig('scale')))();
            }
            return this.scaleClass;
        };
        Axis.prototype.setRange = function (max, min) {
            this.getScaleObj().setRange(max, min);
            return this;
        };
        Axis.prototype.getRange = function () {
            return this.getScaleObj().getRange();
        };
        Axis.prototype.setAxisLength = function (length) {
            this.getScaleObj().setAxisLength(length);
            return this;
        };
        Axis.prototype.setAxisPosition = function (x, y) {
            this.getScaleObj().setAxisPosition(x, y);
            return this;
        };
        Axis.prototype.getPixel = function (value) {
            return this.getScaleObj().getPixel(value);
        };
        Axis.prototype.getValue = function (pixel) {
            return this.getScaleObj().getValue(pixel);
        };
        Axis.prototype.draw = function () {
            return this.getScaleObj().draw();
        };
        Axis.prototype.getLogicalSpace = function(width, height) {
            return this.getScaleObj().getLogicalSpace(width, height);
        };

        FusionCharts.registerComponent('main', 'axis', Axis);
    }

]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-container-api', function () {
    var global = this,
        lib = global.hcLib,
        win = global.window,
        SVGElement = win.SVGElement,
        decompressCSS = lib.decompressCSS,
        M = 'M',
        L = 'L';

    function Container (userData, dependencies) {
        this.dependencies = {
            paper: dependencies.paper
        };

        this.graphics = {};
        this.config ={};

        this.setConfig(userData);
    }

    Container.prototype.setConfig = function (config) {
        this.config = config;
    };

    Container.prototype.getGraphicsElement = function () {
        return this.graphics;
    };

    Container.prototype.getSVGElement = function () {
        return this.graphics.body;
    };

    Container.prototype.parseStyle = function (style) {
        var body = {},
            border = {},
            regex = new RegExp(/border-(.+)/),
            match,
            prop,
            extractedProp,
            val;
        if (!style) {
            style = this.config.style;
        }

        for (prop in style) {
            val = style[prop];

            if (typeof val === 'function') {
                val = val.apply(this, [lib.paletteFCTS, lib]);
            }

            if ((match = prop.match(regex)) && (extractedProp = match[1])) {
                border[extractedProp] = decompressCSS(val);
            } else {
                body[prop] = val;
            }
        }

        return {
            body: body,
            border: border
        };
    };

    Container.prototype.applyStyle = function (style, graphics) {
        var config = this.config,
            paper = this.dependencies.paper,
            lastProp = '',
            cssCls = config.className && config.className.replace(/\s+/g, ''),
            specificCls,
            existingCssCls;

        if (!graphics) {
            graphics = this.graphics;
        }

        (function parseRecursively (_graphics, _style, cssPostfix) {
            var item,
                graphicsItem;

            cssPostfix = cssPostfix || '';

            for (item in _graphics) {
                graphicsItem = _graphics[item];
                if (!graphicsItem) { continue; }

                lastProp = cssPostfix + '-'+ item;

                if (graphicsItem[0] instanceof SVGElement) {
                    if (cssCls) {
                        existingCssCls = graphicsItem.attr('class') || '';
                        specificCls = cssCls + lastProp;
                        graphicsItem.attr('class', existingCssCls + ' ' + cssCls + ' ' + specificCls);
                        paper.cssAddRule('.' + specificCls, _style[item]);
                    } else {
                        graphicsItem.css(_style[item]);
                    }
                } else {
                    parseRecursively(graphicsItem, _style[item], lastProp);
                }
            }
            lastProp = '';
        })(graphics, style);
    };

    Container.prototype.getBody = function (x, y, width, height, group) {
        var dependencies = this.dependencies,
            paper = dependencies.paper,
            defStyleOverride = !!this.config.className,
            graphics = this.graphics,
            body;

        if (!(body = graphics.body)) {
            body = graphics.body = paper.rect(x, y, width, height, group, defStyleOverride);
        }
        else {
            body.attr({
                x: x,
                y: y,
                width: width,
                height: height
            });
        }

        return body;
    };

    Container.prototype.getBorderOf = function (elem, group) {
        var box = elem.getBBox(),
            dependencies = this.dependencies,
            paper = dependencies.paper,
            defStyleOverride = !!this.config.className,
            leftPath = [M, box.x, box.y, L, box.x, box.y2],
            rightPath = [M, box.x2, box.y, L, box.x2, box.y2],
            topPath = [M, box.x, box.y, L, box.x2, box.y],
            bottomPath = [M, box.x, box.y2, L, box.x2, box.y2],
            graphics = this.graphics,
            border = graphics.border,
            g = paper.group(group);


        if (!border) {
            border = graphics.border = {
                group: g,
                left: paper.path(leftPath, g, defStyleOverride),
                right: paper.path(rightPath, g, defStyleOverride),
                top: paper.path(topPath, g, defStyleOverride),
                bottom: paper.path(bottomPath, g, defStyleOverride)
            };
        }
        else {
            border.left.attr('path', leftPath);
            border.right.attr('path', rightPath);
            border.top.attr('path', topPath);
            border.bottom.attr('path', bottomPath);
        }

        return border;
    };

    Container.prototype.drawSelf = function (x, y, width, height, group) {
        var containerGroup = this.group = group,
            graphics = this.graphics,
            body;

        body = graphics.body = this.getBody.apply(this, arguments);
        body.border = graphics.border = this.getBorderOf(body, containerGroup);
        this.applyStyle(this.parseStyle());

        return this;
    };



    FusionCharts.registerComponent('api', 'container', Container);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-plotband-api', function () {
    var Container = FusionCharts.getComponent('api', 'container'),
        M = 'M',
        L = 'L',
        showSTR = 'show',
        hideSTR = 'hide',
        HYPHEN = '-',
        global = this,
        lib = global.hcLib,
        paletteFCTS = lib.paletteFCTS;

    function PlotBand () {
        var args = [].slice.call(arguments, 0),
            dependencies = args[1],
            axes = dependencies.axes,
            dependencyObj;

        Container.apply(this, args);
        dependencyObj = this.dependencies;
        dependencyObj.xAxis = axes.x;
        dependencyObj.yAxis = axes.y;
    }

    PlotBand.prototype = Object.create(Container.prototype);

    PlotBand.prototype.show = function () {
        return this.updateVisibility(showSTR, this.graphics);
    };

    PlotBand.prototype.hide = function () {
        return this.updateVisibility(hideSTR, this.graphics);
    };

    PlotBand.prototype.updateVisibility = function (action, graphics) {
        var prop,
            elem;
        for (prop in graphics) {
            elem = graphics[prop];
            if (elem[action]) {
                elem[action]();
            }
            else if (typeof elem === 'object') {
                this.updateVisibility(action, elem);
            }
        }
        return this;
    };

    PlotBand.prototype.getBody = function (x, y, width, height, group, index) {
        var dependencies = this.dependencies,
            paper = dependencies.paper,
            defStyleOverride = true,
            graphics = this.graphics,
            body;

        if (!(body = graphics.body)) {
            body = graphics.body = paper.rect(x, y, width, height, group.elem, defStyleOverride)
            .attr({
                class: group.className + HYPHEN + index
            });
        }
        else {
            body.attr({
                x: x,
                y: y,
                width: width,
                height: height,
                class: group.className + index
            });
        }
        return body;
    };

    PlotBand.prototype.drawSelf = function () {
        this.graphics.body = this.getBody.apply(this, arguments);
        return this;
    };

    PlotBand.prototype.parseStyles = function (index, style) {
        var instance = this,
            markersStyle = style || instance.config.style,
            normalizeStyles = function (originalStyle, style) {
                for (var prop in originalStyle) {
                    if (originalStyle[prop] instanceof Function) {
                        style[prop] = originalStyle[prop](paletteFCTS, index, lib);
                    }
                    else {
                        style[prop] = originalStyle[prop];
                    }
                }
            };
        instance.originalStyle = lib.extend2({}, markersStyle);
        normalizeStyles(instance.originalStyle, markersStyle);
    };

    PlotBand.prototype.draw = function (point1, point2, canvas, options) {
        var self = this,
            dependencies = self.dependencies,
            group = options.group,
            height = options.height,
            label = options.label,
            xAxis = dependencies.xAxis,
            graphics = self.graphics,
            config = this.config,
            index = config.index,
            rectHeight,
            rectWidth,
            canvasBody,
            x1,
            y1,
            x2,
            y2,
            box,
            textDrawn;

        canvasBody = canvas.graphics.body;
        box = canvasBody.getBBox();
        y1 = box.y;
        y2 = box.y2;
        x1 = point1 && xAxis.getPixel(point1);
        x2 = point2 && xAxis.getPixel(point2);
        if (x1 && x2) {
            // render the plot band.
            if (height) {
                y1 = y2 - height;
            }
            self.drawSelf(x1, y1, (rectWidth = x2 - x1), (rectHeight = height || (y2 - y1)), group.plotBand, index);
            if (label) {
                textDrawn =  label && self.drawText(label, x1, y1, {
                    group: group.label,
                    isVertical: options.isVertical,
                    rectWidth: rectWidth,
                    rectHeight: rectHeight,
                    index: index
                });
            }
            else {
                graphics.label && graphics.label.hide();
                graphics.textBound && graphics.textBound.hide();
            }

        }
        return textDrawn;
    };

    PlotBand.prototype.groupFactory = function (arr, parentContainer) {
        var obj = {},
            paper = this.dependencies.paper,
            key,
            len,
            i;
        for (i = 0, len = arr.length; i < len; i += 1) {
            key = arr[i];
            obj[key] = {
                elem: paper.group(parentContainer)
            };
        }
        return obj;
    };

    PlotBand.prototype.getUnitConstituents = function () {
        return ['plotBand', 'label'];
    };

    PlotBand.prototype.getStubGroup = function (parentContainer) {
        var groupObj = new GroupFactory(this.groupFactory(this.getUnitConstituents(), parentContainer));
        this.group = groupObj.getGroups();
        return groupObj;
    };

    PlotBand.prototype.applyCSS = function (groupObj, styleObj, id) {
        var prop,
            group,
            style,
            config,
            cls;

        for (prop in groupObj) {
            group = groupObj[prop];
            config = styleObj[prop].group;
            style = config.style;
            group.elem.attr({
                class: cls = config.className + HYPHEN + id
            });
            groupObj[prop].className = cls;
            this.parseStyles(id, style);
            this.dependencies.paper.cssAddRule('.' + cls, style);
        }
    };

    PlotBand.prototype.drawText = function (text, x, y, options) {
        var label,
            bBox,
            labelConfig = this._parentConfig.label,
            margin = labelConfig.margin,
            graphics = this.graphics,
            dependencies = this.dependencies,
            paper = dependencies.paper,
            group = options.group,
            width,
            height,
            attrObj = {
                x: x,
                y: y
            },
            index = options.index,
            xAxis = dependencies.xAxis,
            scaleObj = xAxis.getScaleObj().getVisibleRange(),
            axisMax = xAxis.getPixel(scaleObj.max),
            rectWidth = options.rectWidth,
            rightMostX,
            textDrawn = false;

        if (!(label = graphics.label)) {
            label = graphics.label = paper.text(group.elem, true);
        }
        label.attr({
            x: x,
            y: y,
            text: text,
            transform: '',
            class: group.className + HYPHEN + index
        })
        .show();
        label.rotate(-90, x, y);

        bBox = label.getBBox();
        width = bBox.width;
        attrObj.x -= ((height = bBox.height) / 2) + margin.top;
        attrObj.y += width / 2 + margin.left;
        label.attr(attrObj);
        rightMostX = attrObj.x + height;

        if (rightMostX < Math.min(axisMax, x + rectWidth)) {
            textDrawn = graphics;
        }
        else {
            label.hide();
        }

        return textDrawn;
    };

    PlotBand.prototype.checkExcess = function (x) {
        var self = this,
            xAxis = self.dependencies.xAxis,
            scaleObj = xAxis.getScaleObj().getVisibleRange(),
            max = xAxis.getPixel(scaleObj.max),
            min = xAxis.getPixel(scaleObj.min);
        return x && (x < min || x > max);
    };

    function AcylicPlotBand () {
        PlotBand.apply(this, arguments);
    }

    AcylicPlotBand.prototype = Object.create(PlotBand.prototype);

    function CyclicPlotBand() {
        PlotBand.apply(this, arguments);
    }

    CyclicPlotBand.prototype = Object.create(PlotBand.prototype);

    function GroupFactory (groups) {
        this.groups = groups;
    }
    GroupFactory.prototype = Object.create(PlotBand.prototype);
    GroupFactory.prototype.constructor = GroupFactory;

    GroupFactory.prototype.show = function () {
        return this.updateVisibility(showSTR, this.groups);
    };

    GroupFactory.prototype.hide = function () {
        return this.updateVisibility(hideSTR, this.groups);
    };

    GroupFactory.prototype.getGroups = function () {
        return this.groups;
    };

    /*PlotBand.prototype.drawLabel = function () {};
    PlotBand.prototype.addEvent = function () {};*/





    function TimeInstant (config) {
        PlotBand.apply(this, arguments);

        this.config = Object.assign(this.config, {
            // overall padding for all the
            padding: 2,
            margin: 7,
            // maxHeight capping for the events rectangular bounding boxes.
            maxUnitHeight: 20,
            maxUnitWidth: 30
        }, config || {});

        this.graphics.eventObj = {};
    }

    TimeInstant.prototype = Object.create(PlotBand.prototype);

    TimeInstant.prototype.drawLine = function (x, y1, y2, groupObj) {
        var elem,
            self = this,
            config = self.config,
            graphics = self.graphics,
            dependencies = this.dependencies,
            paper = dependencies.paper,
            flag;

        if (flag = self.clipExcess(graphics.line, x)) {
            return;
        }
        if (!(elem = graphics.line)) {
            elem = graphics.line = paper.path(groupObj.elem, true);
        }
        // need css
        elem.attr({
            path: [M, x, y1, L, x, y2],
            class: groupObj.className + HYPHEN + config.index
        })
        .show();
    };

    TimeInstant.prototype.addEvent = function (label, id) {
        var self = this,
            config = self.config,
            dependencies = self.dependencies,
            paper = dependencies.paper,
            graphics = self.graphics,
            eventObj = graphics.eventObj,
            // contains references for both labels and text-rects.
            group = self.group,
            x = self.x,
            y = self.startY,
            textDrawn = false,
            padding = config.padding,
            margin = config.margin,
            doublePadding = padding * 2,
            labelObj = eventObj[id],
            textElem = labelObj && labelObj.textElem,
            textBoundElem = labelObj && labelObj.textBoundElem,
            index = config.index,
            eventPos,
            height,
            rightMostX,
            leftMostX;
        if (!label) {
            if (labelObj) {
                labelObj.textBound && labelObj.textBound.hide();
                labelObj.textElem && labelObj.textElem.hide();
            }
            graphics.labelElem && graphics.labelElem.hide();
            return textDrawn;
        }
        // draw the event.
        if (!labelObj) {
            labelObj = eventObj[id] = {};
        }
        // draw a text bounding rectangle.
        if (!(textBoundElem = labelObj.textBound)) {
            textBoundElem = labelObj.textBound = paper.rect(group.labelBound.elem, true);
        }
        // draw a text element.
        if (!(textElem = labelObj.textElem)) {
            // todo: Performance hit. Try setting all the attrs at a sngle go.
            textElem = labelObj.textElem = paper.text(group.label.elem, true);
        }
        // need css
        // update the graphics.
        textElem.attr({
            x: x,
            y: y,
            text: label,
            class: group.label.className + HYPHEN + index
        })
        // .css(config.label.style)
        .show();

        eventPos = self.getEventPos(textElem);
        leftMostX = eventPos.leftMostX;
        rightMostX = eventPos.rightMostX;
        height = eventPos.height;
        // need css
        textBoundElem.attr({
            x: leftMostX,
            y: y - padding,
            width: rightMostX - leftMostX,
            height: height + doublePadding,
            class: group.labelBound.className + HYPHEN + index
        })
        // .css(config.labelBound.style)
        .show();

        // If the text overflows the axes on any of the two sides.
        if (self.clipExcess(textBoundElem, leftMostX, rightMostX)) {
            textElem.hide();
        }
        else {
            textDrawn = labelObj;
        }

        // update the startX.
        self.startY += (height + margin);
        return textDrawn;
    };

    TimeInstant.prototype.clipExcess = function (elem, x1, x2) {
        var self = this,
            flag = false;

        !flag && (flag = self.checkExcess(x1));
        !flag && (flag = self.checkExcess(x2));

        if (flag) {
            elem && elem.hide();
        }
        return flag;
    };

    TimeInstant.prototype.drawLabel = function (label) {
        var self = this,
            graphics = self.graphics,
            labelElem = graphics.labelElem,
            dependencies = self.dependencies,
            paper = dependencies.paper,
            refLabelConfig = this.group.refLabel,
            labelPos;

        if (!label) {
            return;
        }

        if (!labelElem) {
            labelElem = graphics.labelElem = paper.text(refLabelConfig.elem, true);
        }

        labelElem.attr({
            text: label,
            class: refLabelConfig.className + HYPHEN + this.config.index
        })
        // .css(this.config.bottomLabel.style)
        .show();

        labelPos = self.getLabelPos(labelElem);
        self.clipExcess(labelElem, labelPos.leftMostX);
        delete labelPos.leftMostX;
        delete labelPos.rightMostX;

        labelElem.attr(labelPos);
    };

    TimeInstant.prototype.draw = function (point1, point2, canvas, options) {
        var self = this,
            dependencies = self.dependencies,
            xAxis = dependencies.xAxis,
            parentConfig = this._parentConfig,
            canvasDimensions = canvas.getMeasurement(),
            y1 = (self.startY = canvasDimensions.y);

        this.drawLine(self.x = (point1 && xAxis.getPixel(point1) || point2 && xAxis.getPixel(point2)), y1,
            (self.endY = y1 + canvasDimensions.height), options.group.plotLine);

        // Shift the space required by label from the bottom.
        self.endY -= parentConfig.refLabel.margin.bottom;
        // Shift the event drawing by the offset specified.
        self.startY += parentConfig.label.margin.top;
    };

    TimeInstant.prototype.getEvent = function () {

    };

    TimeInstant.prototype.getId = function (label) {
        return label + '_' + (this._evtCount++);
    };

    TimeInstant.prototype.getUnitConstituents = function () {
        return ['plotLine', 'refLabel', 'labelBound', 'label'];
    };




    function CyclicTimeInstant () {
        TimeInstant.apply(this, arguments);
    }
    CyclicTimeInstant.prototype = Object.create(TimeInstant.prototype);

    CyclicTimeInstant.prototype.getEventPos = function (textElem) {
        var self = this,
            x = self.x,
            padding = self.config.padding,
            width,
            height,
            bBox = textElem.getBBox();
        width = bBox.width;
        textElem.attr({
            y: self.startY + (((height = bBox.height) / 2))
        });
        return {
            rightMostX: x + width / 2 + padding,
            leftMostX: x - width / 2 - padding,
            height: height
        };
    };

    CyclicTimeInstant.prototype.getLabelPos = function (labelElem) {
        var self = this,
            bBox = labelElem.getBBox();
        return {
            x: self.x,
            y: self.endY - bBox.height / 2,
            leftMostX: self.x - bBox.width / 2,
            rightMostX: self.x + bBox.width / 2
        };
    };


    function AcyclicTimeInstant () {
        TimeInstant.apply(this, arguments);
    }
    AcyclicTimeInstant.prototype = Object.create(TimeInstant.prototype);

    AcyclicTimeInstant.prototype.getEventPos = function (textElem) {
        var self = this,
            config = self.config,
            x = self.x,
            margin = config.margin,
            bBox,
            width,
            height;

        bBox = textElem.getBBox();
        width = bBox.width;
        textElem.attr({
            x: x - (width / 2 + margin / 2),
            y: self.startY + (((height = bBox.height) / 2))
        });

        return {
            rightMostX: x - margin / 2,
            leftMostX: x - width - margin,
            height: height
        };
    };

    AcyclicTimeInstant.prototype.getLabelPos = function (labelElem) {
        var self = this,
            bBox,
            width,
            halfWidth;
        labelElem.attr('transform', '');
        labelElem.rotate(-90, self.x, self.endY);
        bBox = labelElem.getBBox();
        width = bBox.width;
        halfWidth = width/2;

        return {
            y: self.endY - halfWidth,
            x: self.x + bBox.height / 2,
            leftMostX: self.x - width,
            rightMostX: self.x + width
        };
    };

    FusionCharts.registerComponent('api', 'acyclic-plot-band', AcylicPlotBand);
    FusionCharts.registerComponent('api', 'cyclic-plot-band', CyclicPlotBand);
    FusionCharts.registerComponent('api', 'cyclic-time-instant', CyclicTimeInstant);
    FusionCharts.registerComponent('api', 'acyclic-time-instant', AcyclicTimeInstant);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-plot-api', function () {

    var global = this,
        lib = global.hcLib,
        mergeRecursive = lib.mergeRecursive;

    /* Plot constructor function
     * @param {Object} json-formatted user data
     * @param {Object} Dependency objects which are needed by plot class
     */
    function Plot (data, config, dependencies, manager) {
        this.setJSONData(data);
        this.graphics = {};
        this.manager = manager;
        // @todo recursively call the config to merge
        config && this.setConfig(config);

        if (dependencies) {
            this.dependencies = {
                paper: dependencies.paper,
                xAxis: dependencies.xAxis,
                yAxis: dependencies.yAxis
            };
        }
    }

    Plot.prototype.setJSONData = function (jsonData) {
        this.jsonData = jsonData || {};
    };
    /* Function to set configuration
     * @param {String} Name of the property to be changed
     * @param {Object/String/Number/Array} Value of the property
     */

    Plot.prototype.setConfig = function (newConfig) {
        var config = this.config;

        mergeRecursive(config, newConfig);
    };

    Plot.prototype.setJSONData = function (data) {
        this.jsonData = data || [];
    };

    // Function to generate the x and y coordinates of the point and other point dimensions

    Plot.prototype.generatePoints = function (jsonData, addNextValidValue) {
        var self = this,
            i,
            pointsArr = [],
            point,
            dataPoint,
            xArray = jsonData.x,
            yArray = jsonData.y,
            visibilityPointers = jsonData.visibilityPointers || {},
            start = visibilityPointers.start,
            validPointers,
            end = visibilityPointers.end || xArray.length - 1;

        // console.log(yArray.length, start, end);
        if (addNextValidValue) {
            validPointers = self.findValidStartAndEndIndex(yArray, start || 0, end,
                xArray.length);
            start = validPointers.start;
            end = validPointers.end;
        }

        for (i = (start || 0); i <= end; i++) {
            point = {
                x: xArray[i],
                y: yArray[i]
            };


            if (point && point.x !== undefined && point.y !== undefined) {
                dataPoint = self.getPointDimensions(point);
                pointsArr.push(dataPoint);
            }
        }

        return pointsArr;
    };

    Plot.prototype.findValidStartAndEndIndex = function (arr, start, end, ln) {
        var validStart = start,
            value,
            validEnd = end;

        if (arr[start] === undefined) {
            while (start >= 0) {
                value = arr[start];
                if (value !== undefined) {
                    validStart = start;
                    break;
                }
                start--;
            }
        }

        if (arr[end] === undefined) {
            while (end < ln) {
                value = arr[end];
                if (value !== undefined) {
                    validEnd = end;
                    break;
                }
                end++;
            }
        }

        return {
            start: validStart,
            end: validEnd
        };

    };

    // Function to return the point dimensions like xPos,yPos,etc.
    Plot.prototype.getPointDimensions = function (point) {
        var self = this,
            dependencies = self.dependencies,
            xAxis = dependencies.xAxis,
            yAxis = dependencies.yAxis,
            xValue = point.x,
            yValue = point.y;

        return !isFinite(yValue) ? null : {
            x: xAxis.getPixel(xValue),
            y: yAxis.getPixel(yValue)
        };
    };

    // Function to draw a path
    Plot.prototype.drawPath = function (pathArr, style, group, pathElement, id) {
        var plot = this,
            dependencies = plot.dependencies,
            elementRecycleInstance = plot.elementRecycleInstance,
            paper = dependencies.paper;

        if (!pathElement) {
            pathElement = paper.path({
                path: pathArr
            }, group);
            elementRecycleInstance && elementRecycleInstance.insertElement('path', id, pathElement);
        }
        else {
            pathElement.attr({
                path: pathArr
            });
        }

        pathElement.attr(style);

        return pathElement;
    };

    // Function to draw a rect
    Plot.prototype.drawRect = function (shapeArgs, style, group, rectElement, id) {
        var plot = this,
            dependencies = plot.dependencies,
            elementRecycleInstance = plot.elementRecycleInstance,
            paper = dependencies.paper;

        if (!rectElement) {
            rectElement = paper.rect(shapeArgs, group);
            elementRecycleInstance.insertElement('rect', id, rectElement);
        }
        else {
            rectElement.attr(shapeArgs);
        }

        rectElement.attr(style);

        return rectElement;
    };

    Plot.prototype.show = function () {
        var self = this,
            graphics = self.graphics,
            group = graphics.group;

        group && group.show();
    };

    Plot.prototype.hide = function () {
        var self = this,
            graphics = self.graphics,
            group = graphics.group;

        group && group.hide();
    };

    Plot.prototype.fade = function () {
        var self = this,
            graphics = self.graphics,
            group = graphics.group;

        group && group.attr({
            opacity: 0.2
        });
    };

    Plot.prototype.unfade = function () {
        var self = this,
            graphics = self.graphics,
            group = graphics.group;

        group && group.attr({
            opacity: 1
        });
    };

    Plot.prototype.setVisibility = function (state) {
        this.visible = state;
    };


    FusionCharts.registerComponent('api', 'plot', Plot);
}]);


FusionCharts.register('module', ['private', 'modules.components.timeseries-pathgenerator-api', function () {
    var M = 'M',
        L = 'L',
        Z = 'Z',
        pathFunctions;

    // All types of path generator functions
    pathFunctions = {
        // Function to generate a linear path
        line: function () {
            var self = this,
                points = self.points,
                len = points.length,
                config = self.config,
                connectNullData = config.connectNullData,
                point,
                x,
                y,
                i,
                pathArr = [],
                lastPoint = null;

            for (i = 0; i < len; i++) {
                point = points[i];
                if (point === null) {
                    if (connectNullData) {
                        continue;
                    }
                }
                else {
                    x = point.x;
                    y = point.y;
                    if (lastPoint === null) {
                        pathArr.push(M, x, y);
                    }
                    else {
                        pathArr.push(L, x, y);
                    }
                }
                lastPoint = point;
            }
            return pathArr;
        },
        // Function to generate a closed area path
        area: function () {
            var self = this,
                points = self.points,
                len = points.length,
                config = self.config,
                connectNullData = config.connectNullData,
                point,
                x,
                y,
                i,
                pathArr = [],
                lastPoint = null,
                pointsJoined = 0,
                firstPoint;

            for (i = 0; i < len; i++) {
                point = points[i];
                if (point === null) {
                    if (connectNullData) {
                        continue;
                    }
                    lastPoint && pointsJoined &&
                        pathArr.push(L, lastPoint.x0, lastPoint.y0, L, firstPoint.x0, firstPoint.y0, Z);
                }
                else {
                    x = point.x;
                    y = point.y;
                    if (lastPoint === null) {
                        firstPoint = point;
                        pointsJoined = 0;
                        pathArr.push(M, x, y);
                    }
                    else {
                        pointsJoined++;
                        pathArr.push(L, x, y);
                    }
                }
                lastPoint = point;
            }

            lastPoint && pointsJoined &&
                pathArr.push(L, lastPoint.x0, lastPoint.y0, L, firstPoint.x0, firstPoint.y0, Z);

            return pathArr;
        }
    };

    // Path generator constructor function
    function PathGenerator (pathType) {
        var defaultConfig = {
            connectNullData: false
        };

        this.config = defaultConfig;
        this.setConfig('pathType', pathType);
    }

    /* Function to set configuration
     * @param {String} Name of the configuration property
     * @param {Object/String/Array} Value of the property
     */

    PathGenerator.prototype.setConfig = function (name, value) {
        this.config[name] = value;
    };

    /* Function to generate path based on pathType
     * @param {Array} Points array from which the svg path array will be generated
     * @returns {Array} Returns the path array
     */

    PathGenerator.prototype.generatePath = function (points) {
        var self = this,
            config = self.config,
            pathType = config.pathType,
            pathArr;

        self.points = points;
        pathArr = pathFunctions[pathType].call(self);
        return pathArr;
    };

    FusionCharts.registerComponent('api', 'pathgenerator', PathGenerator);
}]);


FusionCharts.register('module', ['private', 'modules.components.timeseries-scroller-api', function () {
    var global = this,
        lib = global.hcLib,
        addEvent = lib.addEvent,
        // removeEvent = lib.removeEvent,
        // win = global.window,
        // MouseEvent = win.MouseEvent,
        // doc = win.document,
        hasTouch = lib.hasTouch,
        Container = FusionCharts.getComponent('api', 'container'),
        getMouseCoordinate = lib.getMouseCoordinate;


    function Scroller () {
        var self = this;
        Container.apply(self, arguments);
        this.dependencies.container = arguments[1].container;
        self.buttonsStore = [];
        this.fn = undefined;
    }

    Scroller.prototype = Object.create(Container.prototype);

    // creates the elements required to draw the scrollBar.
    Scroller.prototype.create = function (group) {
        var self = this,
            graphics = self.graphics,
            dependencies = self.dependencies,
            paper = dependencies.paper,
            container;

        // create a scroller group.
        container = graphics.container = paper.group('scrollContainer', group);

        // create a tracking rectangle.
        graphics.trackerRect = paper.rect(container);

        // create a scrollBar group.
        graphics.group = paper.group('scrollBarGroup', container);

        // create a scroller rect for it.
        graphics.scrollerRect = paper.rect(graphics.group).attr('r', 1);

        // create a goti for the scroll bar.
        graphics.goti = paper.path(graphics.group);
    };

    // Draws the buttons.
    Scroller.prototype.drawButtons = function (index) {
        var self = this,
            graphics = self.graphics,
            dependencies = self.dependencies,
            paper = dependencies.paper,
            buttonsStore = self.buttonsStore || (self.buttonsStore = []),
            height = self.height,
            group,
            name = index ? 'leftButton' : 'rightButton',
            margin = this.config.margin,
            leftMargin = margin.left;
        if (!buttonsStore[index]) {
            group = paper.group('scrollButtonGroup', graphics.container);

            graphics[name] = paper.rect(group).attr({
                x: -leftMargin,
                y: 0,
                width: height,
                height: height,
                r: 1
            });

            graphics[name + 'Arrow'] = paper.path(group)
            .attr({
                path: [
                    'M',
                    ((height - leftMargin * 2) / 2) + (index ? -1 : 1),
                    height / 2 - 3,
                    'L',
                    ((height - leftMargin * 2) / 2) + (index ? -1 : 1),
                    height / 2 + 3,
                    'L',
                    ((height - leftMargin * 2) / 2) + (index ? 2 : -2),
                    height / 2,
                    'Z'
                ]
            });
            buttonsStore[index] = group;
        }
    };

    // Draws the scrollBar at a particular position.
    Scroller.prototype.draw = function (x, y, width, height, group) {
        var self = this,
            graphics = self.graphics,
            config = self.config,
            style = config.style;
        height = height || config.scrollHeight;
        // create all the elements if not created.
        if (!graphics.container) {
            self.create(group);
        }

        // update the positional informations.
        self.x = x;
        self.y = y;
        self.width = width;
        self.height = height;

        // update all the created elements coressponding to the scrollbar.
        graphics.trackerRect.attr({
            x: height,
            width: height,
            height: height
        });

        graphics.scrollerRect.attr({
            width: height,
            height: height
        });

        graphics.goti.attr({
            path: [
                'M',
                -3, height / 4,
                'L',
                -3, 2 * height / 3,
                'M',
                0, height / 4,
                'L',
                0, 2 * height / 3,
                'M',
                3, height / 4,
                'L',
                3, 2 * height / 3
            ]
        });

        // draw the buttons.
        self.drawButtons(0);
        self.drawButtons(1);
        self.setPosition(x, width, y);
        self.setScrollSize(x + height, x + width, undefined, true);

        // initialise the events for the scroller.
        self.initialiseEvents();
        // adds the inited events to the target elements.
        self.addEvents();
        // sets the cosmetics.
        self.applyStyle(style);

        return this;
    };

    Scroller.prototype.setPosition = function (x, width, y) {
        var self = this,
            config = self.config,
            scrollHeight = this.height,
            graphics = self.graphics,
            margin = config.margin,
            leftMargin = margin.left,
            rightMargin = margin.right;

        self.x = x;
        self.y = y;
        self.width = width; // width with buttons
        self.height = scrollHeight;

        // Transforms the entire groups
        graphics.container.attr({
            transform: ['T', x, self.y]
        });

        // Re-orienting the tracker rect being drawn.
        graphics.trackerRect.attr({
            width: width - scrollHeight,
            height: scrollHeight
        });

        graphics.goti.attr({
            transform: ['T' + width / 2, 0]
        });

        // Right button need to be translated to particular width
        self.buttonsStore[1].attr({
            transform: ['T', width + leftMargin + rightMargin, 0]
        });
    };

    // Decide the ratio for the scroll inner rect size.
    Scroller.prototype.setScrollSize = function (startX, endX, diff, noExtreme) {
        startX -= this.x;
        endX -= this.x;

        var self = this,
            scrollHeight = this.height,
            width = self.width,
            graphics = self.graphics,
            scrollLength = (self.scrollLength || self.width);

        if (diff) {
            startX = self._initStartX + diff;
            endX = self._initEndX + diff;
        }
        if (isNaN(startX) || isNaN(endX)) {
            return;
        }

        if (!noExtreme) {
            // normalise the values.
            if (startX < scrollHeight) {
                startX = scrollHeight;
                endX = scrollHeight + scrollLength;
            }
            else if (endX > width) {
                endX = width;
                startX = width - scrollLength;
            }
            else {
                self.scrollLength = endX - startX;
            }
        }
        if (+startX && +endX) {
            self.startX = startX;
            self.endX = endX;

            // hide the goti if the size of th width is less than 12 px.
            graphics.scrollerRect.attr({
                x: startX,
                width: (endX - startX)
            });

            graphics.goti
            .attr({
                transform: ['T', startX + (endX - startX) / 2, 0]
            });
        }

        self.absStartX = startX + this.x;
        self.absEndX = endX + this.x;

        return self;
    };
    Scroller.prototype.storeInit = function () {
        var self = this;
        self._initStartX = self.startX;
        self._initEndX = self.endX;
    };

    Scroller.prototype.btnClick = function (index) {
        var self = this,
            config = self.config;
        self.storeInit();
        self.setScrollSize(undefined, undefined, (self.endX - self.startX) * config.step * index);
    };

    // Initialise for all the events required for the scroller.
    Scroller.prototype.initialiseEvents = function () {
        var scroller = this,
            containerElem = scroller.dependencies.container,
            tempX,
            fn;
        // Handler for the mouse Move event.
        scroller.mouseMoveHandler = function (e) {
            var mousePos = getMouseCoordinate(containerElem, e),
                chartX = mousePos.chartX,
                diff = chartX - tempX;

            // If the draging flag is set to true,
            if (scroller.isDown) {
                // update the scroll position. - differentially.
                scroller.setScrollSize(undefined, undefined, diff);
                (fn = scroller.fn) && typeof fn === 'function' && fn.call(null, scroller.absStartX, scroller.absEndX);
            }
        };

        scroller.mouseUpHandler = function () {
            // reset the flags.
            scroller.isDown = tempX = null;
        };

        scroller.mouseDownHandler = function (e) {
            var mousePos = getMouseCoordinate(containerElem, e);
            tempX = mousePos.chartX;

            // store the init positions.
            scroller.storeInit();
            scroller._initStartX = scroller.startX;
            scroller._initEndX = scroller.endX;

            // set a dragging flag to true.
            scroller.isDown = true;
        };

        scroller.buttonToMinClick = function () {
            scroller.btnClick(-1);
        };

        scroller.buttonToMaxClick = function () {
            scroller.btnClick(1);
        };

        scroller.trackClick = function () {
            // console.log(arguments);
        };
    };
    // Update the scroller position to the required start and end position.
    Scroller.prototype.updatePosition = function (/*start, end*/) {

    };
    // Sets up the events for the scroller elements
    Scroller.prototype.addEvents = function () {
        var self = this,
            buttonsStore = self.buttonsStore,
            graphics = self.graphics,
            scrollerGroup = graphics.group.node,
            scrollerRect = graphics.scrollerRect.node,
            mouseDownHandler = self.mouseDownHandler,
            mouseMoveHandler = self.mouseMoveHandler,
            mouseUpHandler = self.mouseUpHandler,
            containerElem = self.dependencies.container,
            listeners;
        // Mouse based events interactions
        listeners = [
            [buttonsStore[0].node, 'click', self.buttonToMinClick],
            [buttonsStore[1].node, 'click', self.buttonToMaxClick],
            [scrollerRect, 'click', self.trackClick],
            [scrollerGroup, 'mousedown', mouseDownHandler],
            [containerElem, 'mousemove', mouseMoveHandler],
            [containerElem, 'mouseup', mouseUpHandler]
        ];

        // Touch based events interactions
        if (hasTouch) {
            listeners.push(
                [scrollerGroup, 'touchstart', mouseDownHandler],
                [containerElem, 'touchmove', mouseMoveHandler],
                [containerElem, 'touchend', mouseUpHandler]
            );
        }

        // Add all of them.
        listeners.forEach(function () {
            addEvent.apply(null, arguments[0]);
        });

        this.listeners = listeners;
    };


    Scroller.prototype.addEventListeners = function (fn) {
        this.fn = fn;
        return this;
    };

    // Removes previosly listening events.
    Scroller.prototype.removeEvents = function () {

    };
    // Clean up the elements.
    Scroller.prototype.dispose = function () {

    };








    FusionCharts.registerComponent('api', 'scroller', Scroller);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-line-api', function () {
    var PathGenerator = FusionCharts.getComponent('api', 'pathgenerator'),
        Plot = FusionCharts.getComponent('api', 'plot'),
        ROUND = 'round',
        MITER = 'miter';



    function Line () {
        var defaultConfig = {
            connectNullData: true,
            style: {
                stroke: '#3f51b5',
                'stroke-width': 2,
                'stroke-linecap': ROUND,
                'stroke-linejoin': MITER
            }
        };
        this.config = defaultConfig;
        this.pathGenerator = new PathGenerator('line');
        Plot.apply(this, arguments);
    }

    Line.prototype = Object.create(Plot.prototype);

    Line.prototype.constructor = Line;

    Line.prototype.plotType = 'line';

    Line.prototype.draw = function (dependencies, group) {
        var self = this,
            config = self.config,
            graphics = self.graphics,
            dependencyObjs = self.dependencies,
            connectNullData = config.connectNullData,
            jsonData = self.jsonData,
            pathGenerator = self.pathGenerator,
            addNextValidValue = true,
            points = self.points = self.generatePoints(jsonData, addNextValidValue),
            paper,
            lineGroup,
            lineElement,
            pathArr;


        if (arguments.length === 1) {
            group = arguments[0];
        } else if (arguments.length === 2) {
            dependencyObjs = self.dependencies = arguments[0];
            group = arguments[1];
        }
        graphics.parentGroup = group;
        paper = dependencyObjs.paper;
        lineGroup = graphics.group = graphics.group || (graphics.group = paper.group('lineGroup', group));


        pathGenerator.setConfig('connectNullData', connectNullData);
        pathArr = pathGenerator.generatePath(points);

        if (!graphics.body) {
            graphics.body = [];
        }

        lineElement = graphics.body[0];

        graphics.body[0] = self.drawPath(pathArr, config.style, graphics.group, lineElement);

        return this;
    };

    FusionCharts.registerComponent('plot', 'line', Line);
}]);


FusionCharts.register('module', ['private', 'modules.components.timeseries-area-api', function () {
    var PathGenerator = FusionCharts.getComponent('api', 'pathgenerator'),
        Plot = FusionCharts.getComponent('api', 'plot'),
        ROUND = 'round',
        MITER = 'miter';

    function Area () {
        var defaultConfig = {
            connectNullData: false,
            style: {
                fill: '#4CAF50',
                stroke: '00ff00',
                'stroke-width': 0,
                'stroke-linecap': ROUND,
                'stroke-linejoin': MITER
            }
        };
        this.config = defaultConfig;
        this.pathGenerator = new PathGenerator('area');
        Plot.apply(this, arguments);
    }

    Area.prototype = Object.create(Plot.prototype);

    Area.prototype.constructor = Area;

    Area.prototype.plotType = 'area';

    Area.prototype.draw = function (dependencies, group) {
        var self = this,
            config = self.config,
            dependencyObjs = self.dependencies,
            graphics = self.graphics,
            connectNullData = config.connectNullData,
            jsonData = self.jsonData,
            pathGenerator = self.pathGenerator,
            points = self.points = self.generatePoints(jsonData),
            pathArr,
            paper,
            areaElement;

        if (arguments.length === 1) {
            group = arguments[0];
        } else if (arguments.length === 2) {
            dependencyObjs = self.dependencies = arguments[0];
            group = arguments[1];
        }

        paper = dependencyObjs.paper;
        graphics.parentGroup = group;
        graphics.group = graphics.group || (graphics.group = paper.group('areaGroup', group));
        pathGenerator.setConfig('connectNullData', connectNullData);
        pathArr = pathGenerator.generatePath(points);

        if (!graphics.body) {
            graphics.body = [];
        }

        areaElement = graphics.body[0];

        graphics.body[0] = self.drawPath(pathArr, config.style, graphics.group, areaElement);

        return this;
    };

    Area.prototype.getPointDimensions = function (point) {
        var self = this,
            dependencies = self.dependencies,
            xAxis = dependencies.xAxis,
            yAxis = dependencies.yAxis,
            xValue = point.x,
            yValue = point.y,
            scale = yAxis.getScaleObj(),
            minValue = scale.getRange().min,
            xPos;

        xPos = xAxis.getPixel(xValue);
        return yValue === null ? yValue : {
            x: xPos,
            y: yAxis.getPixel(yValue),
            x0: xPos,
            y0: yAxis.getPixel(minValue)
        };
    };

    Area.prototype.getSeriesColor = function () {
        return this.config.style.fill;
    };

    FusionCharts.registerComponent('plot', 'area', Area);
}]);


FusionCharts.register('module', ['private', 'modules.components.timeseries-column-api', function () {
    var Plot = FusionCharts.getComponent('api', 'plot'),
        ElementRecycle = FusionCharts.getComponent('api', 'elementrecycle');

    function Column () {
        var defaultConfig = {
            style: {
                fill: '#7f7f7f',
                stroke: '#000000',
                'stroke-width': 0,
                'stroke-opacity': 0
            }
        };

        this.config = defaultConfig;
        this.elementRecycleInstance = new ElementRecycle();
        Plot.apply(this, arguments);
    }

    Column.prototype = Object.create(Plot.prototype);

    Column.prototype.constructor = Column;

    Column.prototype.plotType = 'column';

    Column.prototype.draw = function (dependencies, group) {
        var self = this,
            config = self.config,
            dependencyObjs = self.dependencies,
            graphics = self.graphics,
            jsonData = self.jsonData,
            visibiltyPointers = jsonData.visibilityPointers,
            start = visibiltyPointers.start,
            points = self.points = self.generatePoints(jsonData),
            xValues = jsonData.x,
            style = config.style,
            body = graphics.body = graphics.body || (graphics.body = []),
            elementRecycleInstance = self.elementRecycleInstance,
            paper,
            point,
            i,
            ln,
            element,
            xValue;

        elementRecycleInstance.preProcessor();

        if (arguments.length === 1) {
            group = arguments[0];
        } else if (arguments.length === 2) {
            dependencyObjs = self.dependencies = arguments[0];
            group = arguments[1];
        }

        paper = dependencyObjs.paper;
        graphics.parentGroup = group;
        graphics.group = graphics.group || (graphics.group = paper.group('ColumnGroup', group));
        for (i = 0, ln = points.length; i < ln; i++) {
            point = points[i];
            if (point !== null && point !== undefined) {
                xValue = xValues[i + start];
                element = elementRecycleInstance.getElementIfExist('rect', xValue);
                body[i] = self.drawRect(point, style, graphics.group, element, point.x);
            }
        }

        elementRecycleInstance.postProcessor();
        return this;
    };

    Column.prototype.getPointDimensions = function (point) {
        var self = this,
            dependencies = self.dependencies,
            xAxis = dependencies.xAxis,
            yAxis = dependencies.yAxis,
            xValue = point.x,
            yValueObj = point.y,
            yValue = yValueObj.y,
            manager = self.manager,
            prevYValue = yValue >= 0 ? yValueObj.prevPosY : yValueObj.prevNegY,
            columnWidth = manager.config.columnWidth,
            actualYValue = prevYValue + yValue,
            xPos,
            yPos;

        xPos = xAxis.getPixel(xValue);
        yPos = yAxis.getPixel(actualYValue >= 0 ? actualYValue : prevYValue);
        return !isFinite(yValue) ? yValue : {
            x: xPos - (columnWidth / 2),
            y: yPos,
            width: columnWidth,
            height: Math.abs(yAxis.getPixel(prevYValue) - yAxis.getPixel(actualYValue))
        };
    };

    FusionCharts.registerComponent('plot', 'Column', Column);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-candlestick-api', function () {
    var Plot = FusionCharts.getComponent('api', 'plot'),
        ElementRecycle = FusionCharts.getComponent('api', 'ElementRecycle'),
        M = 'M', L = 'L';

    function Candlestick () {
        this.config = this.getDefaultConfig();
        this.elementRecycleInstance = new ElementRecycle();
        Plot.apply(this, arguments);
    }

    Candlestick.prototype = Object.create(Plot.prototype);

    Candlestick.prototype.getDefaultConfig = function () {
        return {
            bear: {
                style: {
                    fill: '#ff0000',
                    stroke: '#000000',
                    'stroke-width': 1
                }
            },
            bull: {
                style: {
                    fill: '#ffffff',
                    stroke: '#000000',
                    'stroke-width': 1
                }
            },
            wick: {
                style: {
                    stroke: '#000000',
                    'stroke-width': 1
                }
            }
        };
    };

    Candlestick.prototype.constructor = Candlestick;

    Candlestick.prototype.plotType = 'candlestick';

    Candlestick.prototype.draw = function (dependencies, group) {
        var self = this,
            config = self.config,
            dependencyObjs = self.dependencies,
            graphics = self.graphics,
            jsonData = self.jsonData,
            points = self.generatePoints(jsonData),
            wickStyle = config.wick.style,
            paper,
            elements,
            pathArr,
            wickElement,
            bodyElement,
            i,
            x,
            body = graphics.body,
            ln,
            point,
            xValues = jsonData.x,
            visibiltyPointers = jsonData.visibilityPointers,
            start = visibiltyPointers.start,
            elementRecycleInstance = self.elementRecycleInstance,
            xValue;

        if (arguments.length === 1) {
            group = arguments[0];
        } else if (arguments.length === 2) {
            dependencyObjs = self.dependencies = arguments[0];
            group = arguments[1];
        }
        paper = dependencyObjs.paper;

        elementRecycleInstance.preProcessor();
        graphics.parentGroup = group;
        graphics.group = graphics.group || (graphics.group = paper.group('CandlestickGroup', group));

        if (!body) {
            body = graphics.body = [];
        }

        for (i = 0, ln = points.length; i < ln; i++) {
            point = points[i];

            if (point) {
                elements = body[i] || (body[i] = {});
                x = point.x + point.width / 2;
                pathArr = [M, x, point.highStartY, L, x, point.highY,
                    M, x, point.lowStartY, L, x, point.lowY];

                xValue = xValues[i + start];

                wickElement = elementRecycleInstance.getElementIfExist('path', xValue);

                elements.wick = self.drawPath(pathArr, wickStyle, graphics.group, wickElement, xValue);

                bodyElement = elementRecycleInstance.getElementIfExist('rect', xValue);

                elements.body = self.drawRect({
                    x: point.x,
                    y: point.y,
                    width: point.width,
                    height: point.height
                }, point.style, graphics.group, bodyElement, xValue);
            }

        }

        elementRecycleInstance.postProcessor();

        return this;
    };

    Candlestick.prototype.getPointDimensions = function (point) {
        var self = this,
            dependencies = self.dependencies,
            xAxis = dependencies.xAxis,
            yAxis = dependencies.yAxis,
            xValue = point.x,
            yValue = point.y,
            xPos,
            open,
            high,
            low,
            close,
            yVal,
            y,
            y0,
            height,
            width = self.manager.config.columnWidth,
            lowY,
            bear = self.config.bear,
            bull = self.config.bull;

        if (yValue !== undefined) {
            open = yValue[0];
            high = yValue[1];
            low = yValue[2];
            close = yValue[3];
            yVal = Math.max(open, close);
            y = yAxis.getPixel(yVal);
            y0 = yAxis.getPixel(Math.min(open, close));
            height = Math.abs(y - y0);
            lowY = Math.min(open, close);
            xPos = xAxis.getPixel(xValue);

            return {
                x: xPos - width / 2,
                y: y,
                height: height,
                width: width,
                highY: high - yVal > 0 ? yAxis.getPixel(high) : y,
                highStartY: y,
                lowY: low - lowY < 0 ? yAxis.getPixel(low) : yAxis.getPixel(lowY),
                lowStartY: yAxis.getPixel(lowY),
                style: open > close ? bear.style : bull.style
            };
        }
        else {
            return null;
        }

    };

    FusionCharts.registerComponent('plot', 'Candlestick', Candlestick);
}]);


FusionCharts.register('module', ['private', 'modules.components.timeseries-scroller-impl', function () {
    var ComponentInterface = FusionCharts.getComponent('interface', 'component'),
        Scroller = FusionCharts.getComponent('api', 'scroller');


    function ScrollerImpl () {
        ComponentInterface.apply(this, arguments);
    }

    ScrollerImpl.prototype = Object.create(ComponentInterface.prototype);
    ScrollerImpl.prototype.constructor = ScrollerImpl;

    ScrollerImpl.prototype.init = function (require) {
        var self = this;

        require(['graphics', 'chart', function (graphics, chart) {
            self.graphics = graphics;
            self.chart = chart;
        }]);

        self.scroller = new Scroller({}, {
            paper: self.graphics.paper,
            axes: {
                x: self.xAxis,
                y: self.yAxis
            },
            plot: {}
        });
    };

    ScrollerImpl.prototype.draw = function () {
        var scroller = this.scroller,
            chart = this.chart,
            x,
            y;

        // @temp
        x = 50;
        y = 50;
        scroller.draw(x, y, chart.width - 2 * x, chart.height - 2 * y);
    };

    ScrollerImpl.prototype.configureAxes = function () { };

    FusionCharts.registerComponent('main', 'scroller', ScrollerImpl);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-reference-plots-api', function () {
    var M = 'M',
        L = 'L';

    function ReferencePlots (type, arg, dependencies) {
        this.type = type;
        this.dependencies = dependencies;
        this.arg = arg;
        this.graphics = [];
    }

    ReferencePlots.PLOT_TYPE = {
        LINE: 'Line',
        ZONE: 'Rect'
    };

    ReferencePlots.prototype.getSVGElements = function () {
        return this.graphics;
    };

    ReferencePlots.prototype.drawLine = function (plotConf, group, paper) {
        var graphicsArr = this.graphics = [],
            elementRecycleInstance = this.arg.elementRecycleInstance,
            instance,
            conf,
            i,
            l;

        paper = paper || this.dependencies.paper;

        for (i = 0, l = plotConf.length; i < l; i++) {
            conf = plotConf[i];

            elementRecycleInstance && (instance = elementRecycleInstance.getElementIfExist('line', i));

            if (!instance) {
                instance = paper.path([M, conf.x1, conf.y2, L, conf.x2, conf.y1], group);
                elementRecycleInstance && elementRecycleInstance.insertElement('line', i, instance);
            }
            else {
                instance.attr({
                    path: [M, conf.x1, conf.y2, L, conf.x2, conf.y1]
                });
            }

            instance.css(this.arg.style);

            graphicsArr.push(instance);
        }
    };

    ReferencePlots.prototype.drawRect = function (plotConf, group, paper) {
        var graphicsArr = this.graphics = [],
            elementRecycleInstance = this.arg.elementRecycleInstance,
            cls = this.arg.config.className,
            negOffset = 5,
            instance,
            conf,
            i,
            l,
            x1,
            y1,
            width,
            height;

        paper = paper || this.dependencies.paper;

        for (i = 0, l = plotConf.length; i < l; i++) {
            conf = plotConf[i];

            if (elementRecycleInstance) {
                instance = elementRecycleInstance.getElementIfExist('rect', i);
            }

            x1 = conf.x1 - negOffset;
            y1 = conf.y1;
            width = conf.x2 - x1 + (2 * negOffset);
            height = conf.y2 - y1;

            if (!instance) {
                instance = paper.rect(x1, y1, width, height, group, true);
                elementRecycleInstance && elementRecycleInstance.insertElement('rect', i, instance);
            }
            else {
                instance.attr({
                    x: x1,
                    y: y1,
                    width: width,
                    height: height
                });
            }

            instance.attr('class', cls + '-' + i);

            graphicsArr.push(instance);
        }
    };

    ReferencePlots.prototype.draw = function (data, canvas, group) {
        var dependencies = this.dependencies,
            paper = dependencies.paper,
            graphics = this.graphics,
            measurement = canvas.getMeasurement(),
            yAxis = canvas.getAxes().y,
            arg = this.arg,
            elementRecycleInstance = arg.elementRecycleInstance,
            startFromOdd = arg.startFromOdd,
            args = [],
            plotType,
            drawFn,
            i,
            l;

        elementRecycleInstance && elementRecycleInstance.preProcessor();

        if (this.type === (plotType = ReferencePlots.PLOT_TYPE.ZONE)) {
            drawFn = this['draw' + plotType];
            data = data.sort(function (m, n) { return m - n; });
        } else {
            drawFn = this['draw' + ReferencePlots.PLOT_TYPE.LINE];
        }

        for (i = startFromOdd ? 1 : 0, l = data.length; i < l; i += 2) {
            if (data[i + 1] === undefined) {
                break;
            }

            args.push({
                d: [data[i], data[i + 1]],
                x1: measurement.x,
                y1: yAxis.getPixel(data[i + 1]),
                x2: measurement.x + measurement.width,
                y2: yAxis.getPixel(data[i])
            });
        }

        [].push.apply(graphics, drawFn.call(this, args, group, paper));

        elementRecycleInstance && elementRecycleInstance.postProcessor();
        return this;
    };

    FusionCharts.registerComponent('api', 'reference-plots', ReferencePlots);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-tooltip-api', function () {
    var global = this,
        lib = global.hcLib,
        tooltip = lib.toolTip,
        breakLineString = '<br/>',
        DateTimeFormatter = lib.DateTimeFormatter,
        mergeRecursive = lib.mergeRecursive,
        tooltipStr1 = '<span style="vertical-align: sub; color :',
        tooltipStr2 = '; font-size : 14px">',
        spanCloseTag = '</span>';

    function Tooltip (config, dependencies) {
        var self = this,
            containerStyle;

        self.config = {};

        config && this.setConfig(config);
        self.graphics = {};
        self.dependencies = dependencies;
        config && this.setConfig(config);

        tooltip.setup();
        containerStyle = self.config.container.style;
        dependencies.graphics.paper.tooltip(this.config.container.style, {
            opacity: containerStyle.opacity,
            enabled: 1
        }, 1);


    }

    Tooltip.prototype.setConfig = function (config) {
        mergeRecursive(this.config, config);
    };

    Tooltip.prototype.show = function (x, y, plotIndex, eventObj) {
        var self = this,
            dependencies = self.dependencies,
            paper = dependencies.graphics.paper,
            toolText;

        toolText = self.createTooltextString(plotIndex);
        tooltip.drawCustomTooltip(toolText, eventObj, paper);

    };

    Tooltip.prototype.createTooltextString = function (plotIndex) {
        var self = this,
            dependencies = self.dependencies,
            dataset = dependencies.dataset,
            categoryData = dataset.getCategoryData(),
            config = self.config,
            separator = config.separator,
            dateFormat = config.dateFormat,
            category,
            toolText = '',
            formatterFn = config.formatter,
            timestamp = categoryData[plotIndex],
            categoryTooltext = '',
            seriesTooltext = '',
            formattedDate,
            formattedValue,
            tooltip;

        category = DateTimeFormatter.formatAs(timestamp, dateFormat);

        toolText += tooltipStr1 + '#000000' + tooltipStr2 + category + spanCloseTag +
            breakLineString;

        dataset.forEachSeries(function (xAxisModel, yAxisModel, v, series) {
            if (formatterFn) {
                tooltip = formatterFn.call({
                    category: dataset.category,
                    series: series
                }, timestamp, yAxisModel[plotIndex], DateTimeFormatter);

                formattedDate = tooltip.x;
                categoryTooltext = tooltipStr1 + '#000000' + tooltipStr2 + tooltip.x + spanCloseTag +
                    breakLineString;
                formattedValue = tooltip.y;
            }
            else {
                categoryTooltext = tooltipStr1 + '#000000' + tooltipStr2 + category + spanCloseTag +
                    breakLineString;
                formattedValue = yAxisModel[plotIndex];
            }

            seriesTooltext += series.getTooltext(formattedValue, separator);
        });

        toolText = categoryTooltext + seriesTooltext;

        return toolText;
    };

    Tooltip.prototype.drawTooltip = function (x, y, toolText) {
        tooltip.drawTooltip(x, y, toolText);
    };

    Tooltip.prototype.hide = function () {
        tooltip.hide();
    };

    FusionCharts.registerComponent('api', 'Tooltip', Tooltip);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-crossline-api', function () {
    var global = this,
        lib = global.hcLib,
        mergeRecursive = lib.mergeRecursive,
        Tooltip = FusionCharts.getComponent('api', 'tooltip'),
        M = 'M',
        V = 'V';

    function CrossLine (startY, endY, config, dependencies) {
        var paper = dependencies.graphics.paper,
            crossLineClassName = config.crossline.className;
        this.startY = startY;
        this.endY = endY;
        this.config = {};
        this.graphics = {};
        this.dependencies = dependencies;
        this.setReactivity(dependencies.globalReactiveModel, dependencies.xAxis);
        this.tooltip = new Tooltip(config.tooltip, dependencies);
        config.crossline && this.setConfig(config.crossline);

        this.graphics.markerGroup = paper.group('crossline-marker', dependencies.group).attr({
            class: config.crossline.marker.className
        });

        this.graphics.crosslineGroup = paper.group('crossline', dependencies.group).attr({
            class: crossLineClassName
        });

        paper.cssAddRule('.' + crossLineClassName, config.crossline.style);
    }

    CrossLine.prototype.setConfig = function (config) {
        mergeRecursive(this.config, config);
    };

    CrossLine.prototype.setReactivity = function (reactiveModel, xAxis) {
        var self = this;

        reactiveModel.onPropsChange(['hover-x', 'hover-evt'], function (hoverX, hoverEvt) {
            var post = hoverX[1],
                evt = hoverEvt[1];
            if (post === undefined || evt === undefined) {
                self.hide();
            } else {
                self.show(xAxis.getValue(post), evt);
            }
        });
    };

    CrossLine.prototype.show = function (x, e) {
        var self = this,
            graphics = self.graphics,
            crossLine = graphics.crossLine,
            dependencies = self.dependencies,
            paper = dependencies.graphics.paper,
            dataset = dependencies.dataset,
            xAxis = dependencies.xAxis,
            yAxis = dependencies.yAxis,
            xValues = dataset.getCategoryData(),
            plotManagerFactory = dependencies.plotManager,
            markerPlotTypes = self.config.markerPlotTypes,
            markerConf = self.config.marker,
            nearestValue,
            xPos,
            pathArr,
            instances,
            markers,
            point,
            i,
            style,
            markerCount,
            yPos,
            startY = self.startY,
            endY = self.endY,
            tooltip = self.tooltip,
            className = self.config.className,
            fillColorConfig,
            markerGroup = self.graphics.markerGroup,
            markerClassName = self.config.marker.className,
            crosslineGroup = self.graphics.crosslineGroup,
            radius;

        startY = startY === undefined ? self.startY : startY;
        endY = endY === undefined ? self.endY : endY;

        nearestValue = lib.getClosestIndexOf(xValues, x);
        xPos = xAxis.getPixel(xValues[nearestValue]);

        pathArr = [M, xPos, startY, V, endY];
        if (!crossLine) {
            crossLine = graphics.crossLine = paper.path(crosslineGroup, true);
        }

        crossLine.attr({
            path: pathArr,
            class: className
        });

        crossLine.show().attr(self.config.style);

        markers = graphics.markers || (graphics.markers = []);

        markerCount = 0;
        markerPlotTypes.forEach(function (type) {
            instances = plotManagerFactory.getInstancesByPlotType(type);
            i = 0;
            dataset.forEachSeries(type, function (xAxisModel, yAxisModel, visibilityPointers, series) {
                radius = self.config.marker.radius;
                fillColorConfig = series.getItemStyle();

                style = {
                    fill: fillColorConfig.fill,
                    stroke: markerConf.style.stroke,
                    'stroke-width': markerConf.style['stroke-width'],
                    'fill-opacity': fillColorConfig['fill-opacity'],
                    class: markerClassName
                };

                point = yAxisModel[nearestValue];

                if (point !== undefined && series.active) {
                    yPos = yAxis.getPixel(point);
                    markers[markerCount] = self.drawMarker(xPos, yPos, radius, style, markerGroup,
                        markers[markerCount]);
                    markerCount++;
                }
            });
        });

        tooltip.show(xPos, 30, nearestValue, e);
    };

    CrossLine.prototype.drawMarker = function (x, y, radius, style, group, markerElement) {
        var self = this,
            paper = self.dependencies.graphics.paper;

        if (!markerElement) {
            markerElement = paper.circle(x, y, radius, group);
        }
        else {
            markerElement.attr({
                cx: x,
                cy: y,
                r: radius
            });
        }

        markerElement.show().attr(style);

        return markerElement;
    };

    CrossLine.prototype.hide = function () {
        var self = this,
            graphics = self.graphics,
            crossLine = graphics.crossLine,
            tooltip = self.tooltip;

        crossLine && crossLine.hide();
        graphics.markers && graphics.markers.forEach(function (marker) {
            marker.hide();
        });
        tooltip.hide();
    };

    FusionCharts.registerComponent('api', 'cross-line', CrossLine);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-canvas-api', function () {
    var global = this,
        win = global.window,
        SVGElement = win.SVGElement,
        Container = FusionCharts.getComponent('api', 'container'),
        ReferencePlots = FusionCharts.getComponent('api', 'reference-plots'),
        Axis = FusionCharts.getComponent('main', 'axis');

    /*
     * Draw a rectangle which is logically treated to be a canvas. Canvas is the container which contains the plots
     * bands, markers etc and is used to be treated as the reference of axis.
     */
    function Canvas () {
        var args = [].slice.call(arguments, 0),
            measurement;

        if (args.length === 3) {
            measurement = args.shift();
        }

        this._args = args;
        Container.apply(this, args);

        this.measurement = {};
        measurement && this.setMeasurement(measurement);
    }

    Canvas.prototype = Object.create(Container.prototype);

    Canvas.prototype.setMeasurement = function (x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    };

    Canvas.prototype.getMeasurement = function () {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    };

    Canvas.prototype.setMeasurement = function (arg) {
        var measurement = this.measurement;

        if (typeof arg === 'object') {
            measurement.x = arg.x;
            measurement.y = arg.y;
            measurement.width = arg.width;
            measurement.height = arg.height;
            measurement.group = arg.group;
        } else {
            measurement.x = arguments[0];
            measurement.y = arguments[1];
            measurement.width = arguments[2];
            measurement.height = arguments[3];
            measurement.group = arguments[4];
        }

        return this;
    };

    Canvas.prototype.getMeasurement = function () {
        return this.measurement;
    };

    Canvas.prototype.getSVGGroup = function (parentGroup) {
        return this.graphics.group ||
            (this.graphics.group = this.dependencies.paper.group(parentGroup).attr('class', 'canvas-group'));
    };

    Canvas.prototype.clipToDimension = function (group) {
        var measurement = this.measurement;

        group = group || this.graphics.group;

        if (!group) { return; }

        return group.attr({
            'clip-rect': [measurement.x, measurement.y, measurement.width, measurement.height]
        });
    };

    Canvas.prototype.attachAxes = function (xAxis, yAxis) {
        return this.attachXAxis(xAxis).attachYAxis(yAxis);
    };

    Canvas.prototype.attachXAxis = function (xAxis) {
        if (!(xAxis && xAxis instanceof Axis)) { return this; }

        this.dependencies.xAxis = xAxis;
        return this;
    };

    Canvas.prototype.attachYAxis = function (yAxis) {
        if (!(yAxis && yAxis instanceof Axis)) { return this; }

        this.dependencies.yAxis = yAxis;
        return this;
    };

    Canvas.prototype.getAxes = function () {
        var dependencies = this.dependencies;

        return {
            x: dependencies.xAxis,
            y: dependencies.yAxis
        };
    };

    Canvas.prototype.drawHorizontalSpans = function (config) {
        config.startFromOdd = true;
        return new ReferencePlots(ReferencePlots.PLOT_TYPE.ZONE, config, {
            paper: this.dependencies.paper
        }).draw(config.data, this, config.group);
    };

    Canvas.prototype.draw = function () {
        var args = [].slice.call(arguments, 0),
            measurement,
            x,
            y,
            width,
            height,
            lastArg,
            group,
            canvasGroup;

        if (args.length > 1) {
            lastArg = args.splice(args.length - 1, 1)[0];

            if (!(lastArg instanceof SVGElement)) {
                args.push(lastArg);
            } else {
                group = lastArg;
            }
            this.setMeasurement.apply(this, args);
        } else {
            group = args[0];
        }
        measurement = this.getMeasurement();
        x = measurement.x;
        y = measurement.y;
        width = measurement.width;
        height = measurement.height;

        canvasGroup = this.getSVGGroup(measurement.group);
        this.drawSelf(x, y, width, height, canvasGroup);
    };

    FusionCharts.registerComponent('api', 'canvas', Canvas);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-legend-api', function () {
    var global = this,
        lib = global.hcLib,
        getSmartComputedStyle = lib.getSmartComputedStyle,
        mergeRecursive = lib.mergeRecursive;

    function Legend (config, dependencies) {
        this.config = {};
        config && this.setConfig(config);
        this.items = [];
        this.graphics = {};
        this.dependencies = dependencies;
        this.addItems();
    }

    Legend.prototype.setConfig = function (config) {
        mergeRecursive(this.config, config);
    };

    Legend.prototype.draw = function (x, y, group, eventListeners) {
        var dependencies = this.dependencies,
            paper = dependencies.graphics.paper,
            config = this.config,
            margins = config.margin,
            marginTop = margins.top,
            marginLeft = margins.left,
            boundStyle = config.bound.style,
            boundClassName = config.bound.className,
            graphics = this.graphics,
            box = graphics.body;

        paper.cssAddRule('.' + boundClassName, boundStyle);
        group.transform (['T', x + marginLeft, y + marginTop]);

        if (!box) {
            box = graphics.body = paper.rect(group, true);
        }

        box.attr({
            x: x,
            y: y,
            width: this.width,
            height: this.height,
            class: boundClassName
        });

        this.drawItems(group, eventListeners);
    };

    Legend.prototype.drawItems = function (group, eventListeners) {
        var self = this,
            dependencies = self.dependencies,
            paper = dependencies.graphics.paper,
            items = self.items,
            config = self.config,
            symbolConfig = config.symbol,
            textStyle = config.text.style,
            textClassName = config.text.className,
            symbolWidth = symbolConfig.width,
            symbolHeight = symbolConfig.height,
            dataset = self.dependencies.dataset,
            borderRadius = symbolConfig.borderRadius,
            textGroup = self.graphics.textGroup,
            trackerGroup = self.graphics.trackerGroup,
            trackerClassName = config.tracker.className,
            trackerStyle = config.tracker.style,
            symbolGroup = self.graphics.symbolGroup,
            onItemClick = function () {
                var element = this,
                    seriesId = element.data('seriesId'),
                    seriesInstance = dataset.getSeriesById(seriesId),
                    eventListeners = element.data('eventListeners'),
                    itemIndex = element.data('itemIndex'),
                    clickFn = eventListeners.click,
                    switchOffState = !!element.data('switchOffState'),
                    currentState;

                element.data('switchOffState', (currentState = !switchOffState));

                seriesInstance.setActiveStatus(!currentState);

                currentState ? self.fadeItem(itemIndex) : self.restoreItemState(itemIndex);

                clickFn(seriesInstance, currentState);
            },
            onHover = function () {
                var element = this,
                    seriesId = element.data('seriesId'),
                    seriesInstance = dataset.getSeriesById(seriesId),
                    eventListeners = element.data('eventListeners'),
                    hoverFn = eventListeners.hover[0];

                hoverFn(seriesInstance);
            },
            onHoverOut = function () {
                var element = this,
                    seriesId = element.data('seriesId'),
                    dataset = self.dependencies.dataset,
                    seriesInstance = dataset.getSeriesById(seriesId),
                    eventListeners = element.data('eventListeners'),
                    hoverOutFn = eventListeners.hover[1];

                hoverOutFn(seriesInstance);
            },
            item,
            i,
            xPos,
            yPos,
            textX,
            graphics,
            ln;

        if (!symbolGroup) {
            symbolGroup = self.graphics.symbolGroup = paper.group(group);
        }

        if (!textGroup) {
            textGroup = self.graphics.textGroup = paper.group(group);
            paper.cssAddRule('.' + textClassName, textStyle);
            textGroup.attr({
                class: textClassName
            });
        }

        if (!trackerGroup) {
            trackerGroup = self.graphics.trackerGroup = paper.group(group).toFront();
            paper.cssAddRule('.' + trackerClassName, trackerStyle);
            trackerGroup.attr({
                class: trackerClassName
            });

        }

        for (i = 0, ln = items.length; i < ln; i++) {
            item = items[i];

            graphics = item.graphics || (item.graphics = {});

            yPos = item.yPos;
            xPos = item.xPos;

            graphics.symbol = self.drawElement('rect', {
                x: xPos,
                y: yPos,
                r: borderRadius,
                width: symbolWidth,
                height: symbolHeight
            }, item.style, symbolGroup, paper, graphics.symbol);

            textX = xPos + item.symbolWidth;

            graphics.text = self.drawElement('text', {
                x: textX,
                y: item.textYPos,
                text: item.name,
                class: textClassName
            }, {
                'vertical-align': 'top',
                'text-anchor': 'start'
            }, textGroup, paper, graphics.text);

            graphics.tracker = self.drawElement('rect', {
                x: xPos,
                y: yPos - config.symbolPadding,
                width: item.textWidth + item.symbolWidth,
                height: item.totalHeight + config.symbolPadding,
                class: trackerClassName
            }, null, trackerGroup, paper, graphics.tracker);

            graphics.tracker.data('seriesId', item.seriesId)
                .data('eventListeners', eventListeners)
                .data('itemIndex', i);

            self.attachEventHandler([graphics.tracker], 'click', [onItemClick]);
            self.attachEventHandler([graphics.tracker], 'hover', [onHover, onHoverOut]);
        }

    };

    Legend.prototype.fadeItem = function (itemIndex) {
        var self = this,
            items = self.items,
            item = items[itemIndex],
            graphics = item && item.graphics,
            prop;

        for (prop in graphics) {
            graphics[prop] && graphics[prop].css({
                opacity: 0.2
            });
        }
    };

    Legend.prototype.restoreItemState = function (itemIndex) {
        var self = this,
            items = self.items,
            item = items[itemIndex],
            graphics = item && item.graphics,
            prop;

        for (prop in graphics) {
            graphics[prop] && graphics[prop].css({
                opacity: 1
            });
        }
    };

    Legend.prototype.attachEventHandler = function (elements, eventName, fn) {
        var i,
            ln,
            element;

        for (i = 0, ln = elements.length; i < ln; i++) {
            element = elements[i];
            element[eventName].apply(element, fn);
        }
    };

    Legend.prototype.drawElement = function (elemType, props, style, group, paper, element) {
        if (!element) {
            element = paper[elemType](group, true);
        }

        element.attr(props);

        style && element.attr(style);

        return element;
    };

    Legend.prototype.getLogicalSpace = function (availableWidth, availableHeight) {
        var legend = this,
            config = legend.config,
            groupConfig = config.group,
            boxPadding = config.boxPadding * 2,
            symbolWidth = config.symbol.width,
            symbolHeight = config.symbol.height,
            symbolPadding = config.symbolPadding,
            dependencies = legend.dependencies,
            smartLabel = dependencies.smartLabel,
            maxWidth = 0,
            totalWidth = 0,
            smartText,
            totalHeight = 0,
            items = legend.items,
            item,
            i,
            maxHeight = 0,
            rowHeight,
            itemPadding = config.itemPadding,
            perSymbolSpace,
            margins = config.margin,
            ln,
            numColumns,
            cumulativeWidth,
            averageWidth,
            startX,
            startY,
            lineHeight,
            numRows,
            name,
            j,
            tempCurrent,
            rowIndex,
            colIndex,
            current = 0,
            tempTableStructure = [],
            rows = [],
            cols = [],
            numberOfCell,
            paper = dependencies.graphics.paper,
            style;

        perSymbolSpace = symbolWidth + symbolPadding;

        style = getSmartComputedStyle(dependencies.parentGroup, groupConfig.className, paper);

        smartLabel.setStyle(style);

        totalWidth = boxPadding;
        totalHeight = boxPadding;
        lineHeight = parseInt (style.lineHeight, 10) || 12;
        rowHeight = legend.rowHeight = Math.max (lineHeight, symbolHeight + symbolPadding);

        startX = startY = boxPadding / 2;

        cumulativeWidth = 0;
        for (i = 0, ln = items.length; i < ln; i++) {
            item = items[i];
            name = item.name;
            smartText = smartLabel.getOriSize(name);
            maxWidth = Math.max(maxWidth, smartText.width);
            item.symbolWidth = perSymbolSpace;

            item.textWidth = smartText.width;
            if (smartText.height < rowHeight) {
                item.textYShift = (rowHeight - smartText.height) / 2;
            }

            item.totalWidth = smartText.width + item.symbolWidth + (i < ln - 1 ? itemPadding : 0);
            item.totalHeight = rowHeight;

            totalWidth += item.totalWidth;

            item.xPos = startX + cumulativeWidth;
            item.yPos = startY;

            item.textYPos = item.yPos + (symbolHeight / 2) - lineHeight / 2;
            cumulativeWidth += item.totalWidth;

            maxHeight = Math.max(smartText.height, symbolWidth);
        }

        if (maxHeight > rowHeight) {
            rowHeight = maxHeight;
        }

        averageWidth = totalWidth / ln;

        averageWidth += perSymbolSpace;
        numColumns = ln;
        numRows = 1;
        if (totalWidth > availableWidth) {
            numColumns = Math.max(Math.floor(availableWidth / averageWidth), 1);
            legend.perItemWidth = Math.floor((availableWidth - boxPadding) / numColumns);
            totalWidth = 0;
            for (i = 0, ln = items.length; i < ln; i++) {
                item = items[i];

                smartText = smartLabel.getSmartText(item.name, legend.perItemWidth - perSymbolSpace, availableHeight);

                item.name = smartText.text;

                while (tempTableStructure[current] === true) {
                    current += 1;
                }

                numberOfCell = smartText.height / rowHeight;
                tempCurrent = current;
                for (j = 0; j < numberOfCell; j += 1, tempCurrent += numColumns) {
                    tempTableStructure[tempCurrent] = true;
                }

                rowIndex = parseInt (current / numColumns, 10);
                colIndex = current % numColumns;

                item.totalWidth = smartText.width + item.symbolWidth + (colIndex < numColumns - 1 ?
                    itemPadding : 0);
                item.xPos = startX + (cols[colIndex - 1] || 0);
                item.yPos = startY + (rowIndex * rowHeight);
                item.totalHeight = j * rowHeight;
                item.rowIndex = rowIndex;
                item.colIndex = colIndex;
                item.textYShift = 0;
                if (smartText.height < rowHeight) {
                    item.textYShift = (rowHeight - smartText.height) / 2;
                }

                item.textYPos = item.yPos + (symbolHeight / 2) - lineHeight / 2;
                if (!rows[rowIndex]) {
                    rows[rowIndex] = 0;
                }
                rows[rowIndex] += item.totalWidth;

                if (!cols[colIndex]) {
                    cols[colIndex] = 0;
                }

                cols[colIndex] = Math.max(cols[colIndex], item.totalWidth);

                current++;
            }

            for (i = 0, ln = cols.length; i < ln; i++) {
                cols[i] += cols[i - 1] || 0;
            }

            for (i = 0, ln = items.length; i < ln; i++) {
                items[i].xPos = startX + (cols[items[i].colIndex - 1] || 0);
            }

            totalWidth = Math.max.apply(Math, rows);
            totalWidth += boxPadding;
            numRows = tempTableStructure.length / numColumns;
        }
        else {
            rowHeight = Math.max(lineHeight, symbolWidth);
        }

        // console.log(Math.round(numRows));
        totalHeight += Math.round(numRows) * rowHeight - symbolPadding;
        if (totalHeight > availableHeight) {
            totalHeight = availableHeight;
        }

        legend.width = totalWidth;
        legend.height = totalHeight;
        return {
            width: totalWidth + margins.left + margins.right,
            height: totalHeight + margins.top + margins.bottom
        };
    };

    Legend.prototype.addItems = function () {
        var self = this,
            dependencies = self.dependencies,
            dataset = dependencies.dataset,
            items = self.items,
            itemStyle;

        dataset.forEachSeries && dataset.forEachSeries(function (xAxisModel, yAxisModel, v, series) {
            itemStyle = series.getItemStyle();
            items.push({
                name: series.name,
                style: {
                    fill: itemStyle.fill,
                    'fill-opacity': itemStyle['fill-opacity'],
                    'stroke-width': 0
                },
                seriesId: series.getId()
            });
        });
    };

    FusionCharts.registerComponent('api', 'Legend', Legend);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-canvasgroup-api', function () {
    function CanvasGroup (context) {
        var compositionKeys = {axes: true, dataset: true, impl: true},
            config = {},
            ctx,
            composition,
            key;

        ctx = this.context = context || {};
        composition = this.composition = {};
        this.config = {};

        composition.dataset = ctx.dataset;
        composition.xAxis = ctx.axes.x;
        composition.yAxis = ctx.axes.y;
        composition.impl = ctx.impl;

        for (key in context) {
            if (key in compositionKeys) { continue; }
            config[key] = context[key];
        }

        this.setConfig(config);
    }

    CanvasGroup.prototype.getComposition = function () {
        return this.composition;
    };

    CanvasGroup.prototype.setConfig = function (config) {
        var defaultConfig = this.getDefaultConfig();
        this.config = Object.assign(defaultConfig, config);
    };

    CanvasGroup.prototype.getConfig = function () {
        return this.config;
    };

    CanvasGroup.prototype.getDefaultConfig = function () {
        var defaultConfig = {};

        Object.defineProperties(defaultConfig, {
            _showAxes : {
                enumerable: false,
                configurable: false,
                value: {
                    x: true,
                    y: true
                }
            },

            showAxes: {
                enumerable: true,
                configurable: false,
                get: function () { return this._showAxes; },
                set: function (val) {
                    var _showAxes = this._showAxes,
                        obj,
                        key;

                    if (typeof val === 'boolean') {
                        _showAxes.x = val;
                        _showAxes.y = val;
                    } else {
                        obj = val;
                        for (key in obj) {
                            if (!(key in _showAxes)) { continue; }
                            _showAxes[key] = obj[key];
                        }
                    }
                }
            }
        });

        return defaultConfig;
    };


    FusionCharts.registerComponent('api', 'canvas-group', CanvasGroup);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-data-aggregator-api', function () {
    var global = this,
        win = global.window,
        lib = global.hcLib,
        TimeRules = FusionCharts.getComponent('api', 'timerules'),
        M = win.Math;

    /**
     * Aggregation is the method where the system limits the drawing of the data entered by user by few external and
     * internal constraints.
     * When the user wanted to plot huge number of data compared to the number of pixels available in the drawing area
     * aggregation happens. This happens by creating bucket of fixed length for a given no of datapoints and applying
     * predefined aggregation methods to aggregate the data points.
     *
     * @namespace FusionCharts.DataAggregator
     * @constructor

     * @param {Object} args - Configuration parameter to configure the data aggregator instance
     * @param {Array} args.data - Data of for each series.
     * @param {Function} args.data[].aggregatorFn - Specific aggregation function to be used for a particular series.
     * @param {Array} args.data[].data - Data of the Y Axis
     * @param {Array} args.data[].seriesId - Id of the series whose data to be aggregated.
     */
    function DataAggregator (args) {
        this.data = args.data;
        this.category = args.category;
        this.aggregatorFn = args.aggregatorFn || this.getDefaultAggregationMethod();
        this.maxPlotPoints = args.maxPlotPoints;
        this.timeRules = new TimeRules();
    }

    DataAggregator.prototype.setData = function (config) {
        var prop;

        for (prop in config) {
            if (!(prop in this) || config[prop] === undefined) { continue; }

            this[prop] = config[prop];
        }

        if (config.aggregatorFn === null) {
            this.aggregatorFn = this.getDefaultAggregationMethod();
        }

        return this;
    };

    DataAggregator.prototype.getAllAggregationMethod = function () {
        return this.fnLibrary;
    };

    DataAggregator.prototype.getDefaultAggregationMethod = function () {
        return this.fnLibrary.sum;
    };

    DataAggregator.prototype.getCurrentAggregationMethod = function () {
        return this.aggregatorFn;
    };

    DataAggregator.prototype.getAggregationTimeRules = function () {
        return this.timeRules.getRules();
    };

    DataAggregator.prototype.getData = function () {
        return {
            data: this.data,
            category: this.category
        };
    };

    DataAggregator.prototype.fnLibrary = {
        sum: {
            def: function(arr) {
                var sum = 0,
                    i,
                    ln;
                for(i = 0, ln = arr.length; i < ln; i += 1) {
                    sum += arr[i];
                }
                return sum;
            },
            formalName: 'Sum',
            nickName: 'sum'
        },
        mean: {
            def: function(arr) {
                return this.fnLibrary.sum.def(arr) / arr.length;
            },
            formalName: 'Average',
            nickName: 'mean'
        },
        min: {
            def: function(arr) {
                return M.min.apply(null, arr);
            },
            formalName: 'Minimum',
            nickName: 'min'
        },
        max: {
            def: function(arr) {
                return M.max.apply(null, arr);
            },
            formalName: 'Maximum',
            nickName: 'max'
        },
        firstValue: {
            def: function(arr) {
                return arr[0];
            },
            formalName: 'First value',
            nickName: 'firstValue'
        },
        lastValue: {
            def: function(arr) {
                return arr[arr.length - 1];
            },
            formalName: 'Last value',
            nickName: 'lastValue'
        },
        ohlcAggregator: {
            def: function(arr) {
                var i,
                    ln,
                    o = arr[0][0],
                    h = [],
                    l = [],
                    c = arr[arr.length - 1][3];
                for(i = 0, ln = arr.length; i < ln; i += 1) {
                    h.push(arr[i][1]);
                    l.push(arr[i][2]);
                }
                return [o, Math.max.apply(null, h), Math.min.apply(null, l), c];
            },
            formalName: 'OHLC',
            nickName: 'ohlcAggregator'
        }
    };

    DataAggregator.prototype.registerFunction = function (nativeName, definition, formalName) {
        if (!formalName) {
            formalName = lib.capitalizeFirst(nativeName);
        }

        this.fnLibrary[nativeName] = {
            def: definition,
            formalName: formalName,
            isCustomDefined: true
        };

        return this;
    };

    DataAggregator.prototype.recreateCategory = function(interval, oriCat, catArr) {
        var ln = oriCat.length,
            i = Math.ceil(oriCat[0]/interval) * interval,
            j = 0,
            count;

        if(oriCat[0] < i) {catArr.push(i - interval + interval/2);}
        do {
            if(i > oriCat[ln - 1]) {
                break;
            }
            // check if category exist in this time interval
            count = 0;
            for (; j < ln; j += 1) {
                if(oriCat[j] > i) {
                    break;
                } else {
                    count += 1;
                }
            }
            if (count) {
                catArr.push(i + interval/2);
            }

        } while(i += interval);
        return this;
    };

    DataAggregator.prototype.applyAggrigation = function(dataArr) {
        var i,
            ii,
            j,
            jj,
            aggFn;

        for(i = 0, ii = dataArr.length; i < ii; i += 1) {
            for(j = 0, jj = dataArr[i].data.length; j < jj; j += 1) {
                aggFn = dataArr[i].aggregatorFn || this.aggregatorFn;

                if (typeof aggFn !== 'object') {
                    aggFn = this.fnLibrary[aggFn];
                }

                dataArr[i].data[j] =  dataArr[i].data[j] && aggFn.def.call(this, dataArr[i].data[j]);
            }
        }
        return this;
    };

    DataAggregator.prototype.recreateData = function(oriCat, cat, oriData, dataArr, interval) {
        var j = 0,
            jj,
            i,
            ii,
            k,
            kk;

        interval = interval || 0;
        dataArr.length = 0;
        for(i = 0, ii = cat.length; i < ii; i += 1) {
            for(jj = oriCat.length; j < jj; j += 1) {
                if(oriCat[j] >= ((cat[i + 1] - interval/2) || Infinity)) {break;}
                for(k = 0, kk = oriData.length; k < kk; k += 1) {
                    if(oriData[k].data[j] === undefined) {continue;}
                    dataArr[k] || (dataArr[k] = {data: [], seriesId: oriData[k].seriesId,
                        aggregatorFn: oriData[k].aggregatorFn});
                    dataArr[k].data[i] || (dataArr[k].data[i] = []);
                    dataArr[k].data[i].push(oriData[k].data[j]);
                }
            }
        }
        return this;
    };

    DataAggregator.prototype.getAggregatedData = function(aggrigatorRulesProvided) {
        var category = this.category,
            data = this.data,
            maxPlotPoints = this.maxPlotPoints,
            retCategory = [],
            retData = [],
            target,
            interval,
            aggrigatorRules;

        if(category.length < maxPlotPoints) {
            return {
                data: this.data,
                category: this.category
            };
        }

        target = Math.abs((category[category.length - 1] - category[0]) / maxPlotPoints);
        aggrigatorRules = aggrigatorRulesProvided || this.timeRules.getSuitableInterval(target);
        interval = aggrigatorRules.span || target;
        this.recreateCategory(interval, category, retCategory);
        this.recreateData(category, retCategory, data, retData, interval);
        this.applyAggrigation(retData);
        return {
            data: retData,
            category: retCategory,
            rules: aggrigatorRules
        };
    };

    FusionCharts.registerComponent('api', 'dataaggregator', DataAggregator);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-dataset-api', function () {
    var global = this,
        lib = global.hcLib,
        win = global.window,
        N = win.Number,
        M = win.Math,
        parseFloat = win.parseFloat,
        DateTimeFormatter = lib.DateTimeFormatter,
        paletteFCTS = lib.paletteFCTS,
        seriesFactory,
        breakLineString = '<br/>',
        tooltipStr1 = '<span style="vertical-align: sub; color :',
        tooltipStr2 = '; font-size : 14px">',
        spanCloseTag = '</span>',
        circleUnicode = '&#9679; ',
        open = '   <b> Open</b>',
        close = '  <b> Close</b> ',
        high = '  <b> High</b>',
        low = '  <b> Low</b>';


    seriesFactory = (function () {
        var seriesPlotTypeMap = {
                'line': GenericSeries,
                'area': AreaSeries,
                'column': ColumnSeries,
                'candlestick': CandleStickSeries
            },
            seriesGroupMap = {
                line: GenericSeriesGroup,
                area: GenericSeriesGroup,
                column: ColumnSeriesGroup,
                candlestick: GenericSeriesGroup
            };


        return {
            getInstanceFor: function (type, seriesArgs) {
                var Constructor = seriesPlotTypeMap[arguments[0]];
                return new Constructor(seriesArgs[0], type, seriesArgs[1], seriesArgs[2]);
            },
            getGroupInstanceFor: function (type) {
                var Constructor = seriesGroupMap[type];
                return new Constructor();
            }
        };
    })();


    function GenericSeries (name, plotType, data, config) {
        this._id = new Date().getTime() + '' + GenericSeries._instanceCount++;

        this.name = name || 0;
        this.data = data;
        this.plotType = plotType;
        this.parsedData = [];
        this.config = config;
        this.mappedAggregatedData = this.aggregatedData = this.parsedData;
        this.config = config;
        this.active = true;
        this.min = undefined;
        this.max = undefined;

        this.parseStyles();
    }

    GenericSeries._instanceCount = 0;

    GenericSeries.prototype.setActiveStatus = function (active) {
        this.active = active;
        return this;
    };

    GenericSeries.prototype.parseStyles = function () {
        var series = this,
            plot = series.config.plot,
            plotStyle = plot.style,
            normalizeStyles = function (originalStyle, style) {
                for (var prop in originalStyle) {
                    if (originalStyle[prop] instanceof Function) {
                        style[prop] = originalStyle[prop](paletteFCTS, series.config.index, lib);
                    }
                    else {
                        style[prop] = originalStyle[prop];
                    }
                }
            };

        plot.originalStyle = lib.extend2({}, plotStyle);

        normalizeStyles(plot.originalStyle, plotStyle);
    };

    GenericSeries.prototype.parse = function (end, exclude) {
        var data = this.data,
            parsedData = this.parsedData,
            dataPointVal,
            i,
            l;

        if (parsedData.length !== 0) {
            parsedData.length = 0;
        }

        exclude = exclude || {};

        for (i = 0, l = end; i < l; i++) {
            if (i in exclude) {
                continue;
            }
            dataPointVal = data[i];
            if (dataPointVal !== undefined) {
                dataPointVal = parseFloat(data[i], 10);
                if (isNaN(dataPointVal)) {
                    dataPointVal = undefined;
                }
            }

            parsedData.push(dataPointVal);
        }

        this.calculateLimits(0, end);
        return this;
    };

    GenericSeries.prototype.setAggregatedData = function (data) {
        this.aggregatedData = data;
        this.calculateLimits(0, data.length);

        return this;
    };

    GenericSeries.prototype.getAggregatedData = function () {
        return this.aggregatedData;
    };

    GenericSeries.prototype.setAggregatedMappedData = function (data) {
        this.mappedAggregatedData = data;
        this.calculateMappedLimits(0, data.length);
        return this;
    };

    GenericSeries.prototype.getAggregatedMappedData = function () {
        return this.mappedAggregatedData;
    };

    GenericSeries.prototype.setOriginalData = function (data) {
        this.data = data;
        return this;
    };

    GenericSeries.prototype.getOriginalData = function () {
        return this.parsedData;
    };

    GenericSeries.prototype.addData = function (data) {
        if (!isFinite(data = parseFloat(data, 10))) {
            this.parsedData.push(undefined);
        }

        this.parsedData.push(data);
        return this;
    };

    GenericSeries.prototype.getLimitsOf = function (target, start, end) {
        var min = N.POSITIVE_INFINITY,
            max = N.NEGATIVE_INFINITY,
            dataPointVal,
            i,
            l;

        start = start || 0;
        end = isFinite(end) ? end : target.length;

        for (i = start, l = end; i < l; i++) {
            dataPointVal = target[i];

            if (dataPointVal === undefined) {
                continue;
            }

            min = M.min(min, dataPointVal);
            max = M.max(max, dataPointVal);
        }

        return [min, max];
    };

    GenericSeries.prototype.calculateLimits = function (start, end) {
        var limits = this.getLimitsOf(this.aggregatedData, start, end);

        this.min = limits[0];
        this.max = limits[1];

        return this;
    };

    GenericSeries.prototype.getId = function () {
        return this._id;
    };

    GenericSeries.prototype.getMin = function () {
        return this.min;
    };

    GenericSeries.prototype.getMax = function () {
        return this.max;
    };

    GenericSeries.prototype.getPlotType = function () {
        return this.plotType;
    };

    GenericSeries.prototype.calculateMappedLimits = function () {
        var limits = GenericSeries.prototype.getLimitsOf.call(this, this.getMappedData());

        this.min = limits[0];
        this.max = limits[1];

        return this;
    };

    GenericSeries.prototype.getMappedData = function () {
        return this.mappedAggregatedData;
    };

    GenericSeries.prototype.getOriginalMappedData = function () {
        return this.parsedData;
    };

    GenericSeries.prototype.getItemStyle = function () {
        var style = this.config.plot.style;

        return {
            fill: style.stroke,
            'fill-opacity': style['stroke-opacity'] || 1
        };
    };

    GenericSeries.prototype.getTooltext = function (tooltipValue, separator) {
        var itemStyle = this.getItemStyle(),
            seriesColor = itemStyle.fill,
            toolText = '';

        if (tooltipValue !== undefined && this.active) {
            toolText += tooltipStr1 + seriesColor + tooltipStr2 + circleUnicode + this.name + spanCloseTag;
            toolText += tooltipStr1 + '#000000' + tooltipStr2 + separator + '<b>' + tooltipValue +
            '</b>' + spanCloseTag + breakLineString;
        }

        return toolText;
    };

    function AreaSeries () {
        GenericSeries.apply(this, arguments);
    }

    AreaSeries.prototype = Object.create(GenericSeries.prototype);

    AreaSeries.prototype.getItemStyle = function () {
        var style = this.config.plot.style;

        return {
            fill: style.fill,
            'fill-opacity': style['fill-opacity'] || 1
        };
    };



    function ColumnSeries () {
        GenericSeries.apply(this, arguments);
    }

    ColumnSeries.prototype = Object.create(GenericSeries.prototype);
    ColumnSeries.prototype.constructor = ColumnSeries;

    ColumnSeries.prototype.calculateLimits = function (start, end) {
        var limits = this.getLimitsOf(this.aggregatedData, start, end);

        this.min = limits[0] > 0 ? 0 : limits[0];
        this.max = limits[1];

        return this;
    };

    ColumnSeries.prototype.getItemStyle = function () {
        var style = this.config.plot.style;

        return {
            fill: style.fill,
            'fill-opacity': style['fill-opacity'] || 1
        };
    };


    function CandleStickSeries () {
        this.aggregatorFn = 'ohlcAggregator';
        GenericSeries.apply(this, arguments);
    }

    CandleStickSeries.prototype = Object.create(GenericSeries.prototype);
    CandleStickSeries.prototype.constructor = CandleStickSeries;

    CandleStickSeries.prototype.getLimitsOf = function (target, start, end) {
        var min = N.POSITIVE_INFINITY,
            max = N.NEGATIVE_INFINITY,
            dataPointVal,
            i,
            l;
        start = start || 0;
        end = isFinite(end) ? end : target.length;

        for (i = start, l = end; i < l; i++) {
            dataPointVal = target[i];

            if (dataPointVal === undefined) {
                continue;
            }

            min = M.min(min, M.min.apply(M, dataPointVal));
            max = M.max(max, M.max.apply(M, dataPointVal));
        }

        return [min, max];
    };

    CandleStickSeries.prototype.parse = function (end, exclude) {
        var data = this.data,
            parsedData = this.parsedData,
            dataPointVal,
            i,
            l;

        exclude = exclude || {};

        for (i = 0, l = end; i < l; i++) {
            if (i in exclude) {
                continue;
            }
            dataPointVal = data[i];
            if (dataPointVal !== undefined) {
                dataPointVal.map(parseFloat);
            }

            parsedData.push(dataPointVal);
        }

        this.calculateLimits(0, end);
        return this;
    };

    CandleStickSeries.prototype.getMappedData = function () {
        return this.mappedAggregatedData;
    };

    CandleStickSeries.prototype.getOriginalMappedData = function () {
        return this.parsedData.map(function (data) {
            return data && data[3];
        });
    };

    CandleStickSeries.prototype.getAggregatorFn = function () {
        return this.aggregatorFn;
    };

    CandleStickSeries.prototype.getItemStyle = function () {
        var style = this.config.plot.style;

        return {
            fill: style.fill
        };
    };

    CandleStickSeries.prototype.addData = function (data) {
        this.parsedData.push(data);
        return this;
    };

    CandleStickSeries.prototype.getTooltext = function (formattedValue, separator) {
        var series = this,
            style = series.getItemStyle(),
            seriesColor = style.fill,
            openValue = formattedValue[0],
            highValue = formattedValue[1],
            lowValue = formattedValue[2],
            closeValue = formattedValue[3],
            toolText = '';

        if (formattedValue) {
            toolText += tooltipStr1 + seriesColor + tooltipStr2 + '<b>' +  circleUnicode + series.name + '</b>' +
                spanCloseTag + breakLineString;

            toolText += tooltipStr1  + '#000000' + tooltipStr2 + open + separator + '<b>' + openValue +
            '</b>' + spanCloseTag + breakLineString;

            toolText += tooltipStr1+  '#000000' + tooltipStr2 +  high + separator + '<b>' + highValue +
            '</b>' + spanCloseTag + breakLineString;

            toolText += tooltipStr1 + '#000000' + tooltipStr2 + low + separator + '<b>' + lowValue +
            '</b>' + spanCloseTag + breakLineString;

            toolText += tooltipStr1 + '#000000' + tooltipStr2 + close + separator + '<b>' + closeValue +
            '</b>' + spanCloseTag + breakLineString;
        }

        return toolText;
    };

    function GenericSeriesGroup () {
        this.series = [];
    }

    GenericSeriesGroup.prototype.addSeries = function (series) {
        this.series.push(series);
    };

    GenericSeriesGroup.prototype.calculateLimits = function (start, end) {
        var seriesArr = this.series,
            series,
            i = 0,
            max = -Infinity,
            min = +Infinity,
            ln = seriesArr.length;

        for (i = 0; i < ln; i++) {
            series = seriesArr[i];
            series.calculateLimits(start, end);
            max = Math.max(max, series.max);
            min = Math.min(min, series.min);
        }

        this.max = max;
        this.min = min;
    };

    GenericSeriesGroup.prototype.getMin = function () {
        return this.min;
    };

    GenericSeriesGroup.prototype.getMax = function () {
        return this.max;
    };


    function ColumnSeriesGroup () {
        GenericSeriesGroup.apply(this, arguments);
    }

    ColumnSeriesGroup.prototype = Object.create(GenericSeriesGroup.prototype);

    ColumnSeriesGroup.prototype.calculateLimits = function (start, end) {
        var seriesArr = this.series,
            seriesLen = this.series.length,
            index = start || 0,
            sCount = 0,
            posSum = 0,
            yValue,
            maxStackSumValue = -Infinity,
            minStackSumValue = +Infinity,
            endIndex = end - 1,
            value,
            negSum = 0,
            yAxisModel,
            series;

        while (true) {
            series = seriesArr[sCount++];
            yAxisModel = series.getAggregatedData();
            yValue = yAxisModel[index] || 0;

            negSum += yValue < 0 ? yValue : 0;
            posSum += yValue >= 0 ? yValue : 0;

            if (sCount === seriesLen) {
                maxStackSumValue = Math.max(maxStackSumValue, posSum);
                minStackSumValue = Math.min(minStackSumValue, negSum);

                sCount = posSum = negSum = 0;
                value = seriesArr[sCount].aggregatedData[index];
                if (value === undefined || index === endIndex) {
                    break;
                }
                index++;
            }
        }

        this.min = minStackSumValue;
        this.max = maxStackSumValue;
    };



    function Category (categoryData) {
        this.data = categoryData.data;
        this.dateformat = categoryData.dateformat;

        this.min = undefined;
        this.max = undefined;
        this.excludeIndex = {};
        this.parsedData = [];
        this.mappedAggregatedData = this.aggregatedData = this.parsedData;
        this.df = undefined;

        this.parseRaw();
    }

    Category.prototype.parseRaw = function () {
        var data = this.data,
            dateformat = this.dateformat,
            parsedData = this.parsedData,
            excludeIndex = this.excludeIndex,
            min = N.POSITIVE_INFINITY,
            max = N.NEGATIVE_INFINITY,
            df,
            millis,
            cat,
            i,
            l;

        if (dateformat) {
            df = this.df = new DateTimeFormatter(dateformat);
        }

        for (i = 0, l = data.length; i < l; i++) {
            cat = data[i];

            if (!df) {
                millis = cat instanceof Date ? cat.getTime() : cat;
            }
            else {
                millis = df.getNativeDate(cat).getTime();
            }


            if (!isFinite(millis)) {
                excludeIndex.push(i);
                continue;
            }

            parsedData.push(millis);

            if (min > millis) {
                min = millis;
            }

            if (max < millis) {
                max = millis;
            }
        }

        this.min = min;
        this.max = max;

        return this;
    };

    Category.prototype.calculateLimitOf = function (data) {
        var min = N.POSITIVE_INFINITY,
            max = N.NEGATIVE_INFINITY,
            millis,
            i,
            l;

        for (i = 0, l = data.length; i < l; i++) {
            millis = data[i];
            if (min > millis) {
                min = millis;
            }

            if (max < millis) {
                max = millis;
            }
        }

        return [min, max];
    };

    Category.prototype.calculateOriginalDataLimit = function () {
        var limits;

        limits = this.calculateLimitOf(this.parsedData);

        this.min = limits[0];
        this.max = limits[1];

        return this;
    };

    Category.prototype.calculateAggregatedDataLimits = function () {
        var limits;

        limits = this.calculateLimitOf(this.aggregatedData);

        this.min = limits[0];
        this.max = limits[1];

        return this;
    };

    Category.prototype.setAggregatedData = function (data) {
        this.aggregatedData = data;
        this.calculateAggregatedDataLimits();

        return this;
    };

    Category.prototype.calculateMappedAggregatedDataLimits = function () {
        var limits;

        limits = this.calculateLimitOf(this.mappedAggregatedData);

        this.min = limits[0];
        this.max = limits[1];

        return this;
    };

    Category.prototype.setAggregatedMappedData = function (data) {
        this.mappedAggregatedData = data;
        this.calculateMappedAggregatedDataLimits();

        return this;
    };

    Category.prototype.getAggregatedMappedData = function () {
        return this.mappedAggregatedData;
    };

    Category.prototype.getAggregatedData = function () {
        return this.aggregatedData;
    };

    Category.prototype.getOriginalData = function () {
        return this.parsedData;
    };

    Category.prototype.setData = function (data) {
        this.parsedData = data;

        return this.parseRaw();
    };

    Category.prototype.addData = function (data) {
        var df = this.df,
            millis;

        if (!data) {
            return false;
        }

        // df = new DateTimeFormatter(data, this.dateformat);

        if (!isFinite(millis = df.getNativeDate(data).getTime())) {
            return false;
        }

        if (this.max >= millis) {
            return false;
        }

        this.max = millis;
        this.parsedData.push(millis);

        return true;
    };

    Category.prototype.getMin = function () {
        return this.min;
    };

    Category.prototype.getRawSize = function () {
        return this.data.length;
    };

    Category.prototype.getSize = function () {
        return this.aggregatedData.length;
    };

    Category.prototype.getInvalidDatapointIndex = function () {
        return this.excludeIndex;
    };

    Category.prototype.getMax = function () {
        return this.max;
    };

    Category.prototype.getLimits = function () {
        return {
            min: this.getMin(),
            max: this.getMax()
        };
    };



    function Dataset (id, category, series, seriesGroups) {
        this.category = category;
        this.series = series;
        this.seriesGroups = seriesGroups;
        this.seriesIdPlotMap = this.getSeriesIdPlotMap();
        this.id = id;

        this.min = {
            x: this.category.getMin(),
            y: undefined
        };
        this.max = {
            x: this.category.getMax(),
            y: undefined
        };

        this.visibilityPointer = {
            start: 0,
            end: this.category.getSize() - 1
        };

        this.calculateLimits();
    }

    Dataset.prototype.moveVisibilityPointers = function (start, end) {
        if (start !== undefined) {
            this.visibilityPointer.start = M.max(start - 1, 0);
        }

        if (end !== undefined) {
            this.visibilityPointer.end = M.min(end + 1, this.category.getSize() - 1);
        }

        return this;
    };

    Dataset.prototype.getVisibilityPointers = function () {
        return {
            start: this.visibilityPointer.start,
            end: this.visibilityPointer.end
        };
    };

    Dataset.prototype.getCategoryData = function () {
        return this.category.parsedData;
    };

    Dataset.prototype.getSeriesIdPlotMap = function () {
        var allSeries = this.series,
            series,
            obj = {},
            i,
            l;

        for (i = 0, l = allSeries.length; i < l; i++) {
            series = allSeries[i];
            obj[series.getId()] = [series, undefined];
        }

        return obj;
    };

    Dataset.prototype.addUnitData = function (data) {
        var allSeries = this.series,
            i,
            l,
            y;

        if (!this.category.addData(data.x)) {
            return this;
        }

        y = data.y;
        for (i = 0, l = allSeries.length; i < l; i++) {
            allSeries[i].addData(y[i]);
        }

        return this;
    };

    Dataset.prototype.updatePlotInMap = function (id, plot) {
        var seriesPlot = this.seriesIdPlotMap[id];

        if (!seriesPlot) {
            return this;
        }

        seriesPlot[1] = plot;
        return this;
    };

    Dataset.prototype.getPlotInstanceBySeriesId = function (id) {
        var seriesPlot = this.seriesIdPlotMap[id];

        if (!seriesPlot) {
            return this;
        }

        return seriesPlot[1];
    };

    Dataset.prototype.calculateLimits = function () {
        this.calculateMin();
        this.calculateMax();
    };

    Dataset.prototype.calculateVisibleLimits = function () {
        var self = this,
            seriesGroups = self.seriesGroups,
            vPointers = this.visibilityPointer,
            seriesGroup,
            i;

        for (i in seriesGroups) {
            seriesGroup = seriesGroups[i];
            seriesGroup.calculateLimits(vPointers.start, vPointers.end + 1);
        }

        // series.forEach(function (thisSeries) {
        //     thisSeries.calculateLimits(vPointers.start, vPointers.end + 1);
        // });

        this.calculateMin();
        this.calculateMax();
        return this;
    };

    Dataset.prototype.calculateMappedLimits = function () {
        var self = this,
            series = self.series;

        series.forEach(function (thisSeries) {
            thisSeries.calculateMappedLimits();
        });

        this.category.calculateMappedAggregatedDataLimits();
        this.calculateMinFromSeries();
        this.calculateMaxFromSeries();
        return this;
    };

    Dataset.prototype.calculateMin = function () {
        var allMins = [],
            seriesGroups = this.seriesGroups,
            seriesGroup,
            prop;

        for (prop in seriesGroups) {
            seriesGroup = seriesGroups[prop];
            allMins.push(seriesGroup.getMin());
        }

        this.min.x = this.category.getMin();
        this.min.y = M.min.apply(M, allMins);
    };

    Dataset.prototype.calculateMax = function () {
        var allMaxs = [],
            seriesGroups = this.seriesGroups,
            seriesGroup,
            prop;

        for (prop in seriesGroups) {
            seriesGroup = seriesGroups[prop];
            allMaxs.push(seriesGroup.getMax());
        }

        this.max.x = this.category.getMax();
        this.max.y = M.max.apply(M, allMaxs);
    };

    Dataset.prototype.calculateMinFromSeries = function () {
        var allMins = [],
             series = this.series,
             i = 0,
             l = series.length;

        for (; i < l; i++) {
            allMins.push(series[i].getMin());
        }

        this.min.x = this.category.getMin();
        this.min.y = M.min.apply(M, allMins);
    };

    Dataset.prototype.calculateMaxFromSeries = function () {
        var allMaxs = [],
           series = this.series,
           i = 0,
           l = series.length;

        for (; i < l; i++) {
            allMaxs.push(series[i].getMax());
        }

        this.max.x = this.category.getMax();
        this.max.y = M.max.apply(M, allMaxs);
    };

    Dataset.prototype.getMin = function (type) {
        return type ? this.min[type] : this.min;
    };

    Dataset.prototype.getMax = function (type) {
        return type ? this.max[type] : this.max;
    };

    Dataset.prototype.getLimits = function (fn) {
        if (fn) {
            fn.call(this);
        }

        return {
            min: this.getMin(),
            max: this.getMax()
        };
    };

    Dataset.prototype.getSeries = function () {
        return this.series;
    };

    Dataset.prototype.getSeriesById = function (seriesId) {
        var dataset = this,
            series = dataset.series,
            i,
            id,
            ln;

        for (i = 0, ln = series.length; i < ln; i++) {
            id = series[i].getId();

            if (id === seriesId) {
                return series[i];
            }
        }
    };

    Dataset.prototype.getSeriesByPlotType = function () {
        var dataset = this,
            series = dataset.series,
            plotType,
            seriesByPlotType = {};

        series.forEach(function (series) {
            plotType = series.getPlotType();
            if (!seriesByPlotType[plotType]) {
                seriesByPlotType[plotType] = [];
            }
            seriesByPlotType[plotType].push(series);
        });

        return seriesByPlotType;
    };

    Dataset.prototype.getOriginalCategoryData = function () {
        return this.category.parsedData;
    };

    Dataset.prototype.getSeriesById = function (seriesId) {
        var series = this.series,
            seriesInstance,
            ln,
            i;

        for (i = 0, ln = series.length; i < ln; i++) {
            seriesInstance = series[i];
            if (seriesInstance.getId() === seriesId) {
                return seriesInstance;
            }
        }
    };

    Dataset.prototype.forEachSeries = function () {
        var allSeries = this.series,
            isMappedDataRequired = false,
            series,
            i,
            l,
            queryPlotType,
            data,
            arg0,
            categoryData,
            fn;

        if (arguments.length >= 3) {
            queryPlotType = arguments[0];
            fn = arguments[1];
            isMappedDataRequired = !!arguments[2];
        } else {
            if (typeof (arg0 = arguments[0]) === 'function') {
                fn = arg0;
                isMappedDataRequired = !!arguments[1];
            } else {
                queryPlotType = arg0;
                fn = arguments[1];
            }
        }

        categoryData = this.getCategoryData();

        for (i = 0, l = allSeries.length; i < l; i++) {
            series = allSeries[i];
            data = isMappedDataRequired ? series.getMappedData() : series.getAggregatedData();
            if (!queryPlotType) {
                fn.call(this, categoryData, data, this.visibilityPointer, series);
            }
            else if(queryPlotType === series.getPlotType()) {
                fn.call(this, categoryData, data, this.visibilityPointer, series);
            }
        }
    };

    Dataset.prototype.getCategoryData = function () {
        return this.category.getAggregatedData();
    };

    Dataset.prototype.getAllPlotTypes = function () {
        var allSeries = this.series,
            plotTypes = {},
            i;

        for (i = 0; i < allSeries.length; i++) {
            plotTypes[allSeries[i].getPlotType()] = 1;
        }

        return plotTypes;
    };

    // @todo check the responsibility. Its not upto the dataset to calculate the stack as dataset has no information of
    // stacking. The caller has to take care
    Dataset.prototype.calculateStackedValues = function (type) {
        var max = -Infinity,
            min = +Infinity,
            i,
            l,
            yValuesArr,
            arr,
            prevValue,
            prevArr,
            dI,
            prevObj,
            prevPosY,
            prevNegY,
            yValue;

        yValuesArr = [];
        dI = 0;

        this.forEachSeries(type, function (xAxisModel, yAxisModel, visibilityPointer, series) {
            if (series.active) {
                yAxisModel = series.aggregatedData;
                arr = yValuesArr[dI] = [];
                prevArr = yValuesArr[dI - 1];
                for (i = 0, l = xAxisModel.length; i < l; i++) {
                    prevObj = prevArr && prevArr[i];
                    yValue = yAxisModel[i];
                    prevValue = prevObj && prevObj.y || 0;

                    prevPosY = prevObj && prevObj.prevPosY || 0;
                    prevNegY = prevObj && prevObj.prevNegY || 0;
                    prevPosY += prevValue >= 0 ? prevValue : 0;
                    prevNegY += prevValue < 0 ? prevValue : 0;


                    arr.push({
                        y: yValue,
                        prevPosY: prevPosY,
                        prevNegY: prevNegY
                    });

                    max = Math.max(max, yValue >= 0 ? yValue + prevPosY : 0);
                    min = Math.min(min, yValue < 0 ? yValue + prevNegY : 0);
                }

                series.stackedData = yValuesArr[dI];
                dI++;
            }
        });
    };

    Dataset.prototype.setAggregatedCategory = function (data) {
        this.category.setAggregatedData(data);
    };

    Dataset.prototype.setCategoryData = function (data) {
        return this.category.setData(data);
    };

    Dataset.prototype.setDataBySeries = function (fn) {
        var allSeries = this.series,
            category = this.category,
            series,
            i,
            l;

        for (i = 0, l = allSeries.length; i < l; i++) {
            series = allSeries[i];
            fn.apply(null, [series]);
            series.parse(category.getRawSize(), category.getInvalidDatapointIndex());
        }

        return this;
    };

    function DatasetManager (datasetConf) {
        this.datasetConf = datasetConf;

        this.category = new Category(datasetConf.category);
        this.datasets = [];

        this.createDataset(datasetConf.dataset);
    }

    DatasetManager.prototype.createDataset = function (dataset) {
        var allSeries = [],
            datasets = this.datasets,
            category = this.category,
            size = category.getRawSize(),
            exclude = category.getInvalidDatapointIndex(),
            seriesGroups,
            seriesObjArr,
            series,
            ds,
            i,
            l,
            index,
            plotType,
            seriesGroup,
            seriesInstance,
            len,
            prop;

        function getSeriesConfig (series) {
            var nonConfigKey = ['plottype', 'name', 'data'],
                config = {},
                prop;

            for (prop in series) {
                if (nonConfigKey.indexOf(prop) >= 0) {
                    continue;
                }

                config[prop] = series[prop];
            }

            return config;
        }

        for (i = 0, l = dataset.length; i < l; i++) {
            ds = dataset[i];
            allSeries = ds.series;
            seriesObjArr = [];
            seriesGroups = {};
            for (index = 0, len = allSeries.length; index < len; index++) {
                series = allSeries[index];
                series.dsIndex = i;
                series.index = index;
                plotType = series.plot.type;

                seriesInstance = seriesFactory.getInstanceFor(series.plot.type, [series.name, series.data,
                    getSeriesConfig(series)]).parse(size, exclude);

                seriesObjArr.push(seriesInstance);

                seriesGroup = seriesGroups[plotType];

                if (!seriesGroup) {
                    seriesGroup = seriesGroups[plotType] = seriesFactory.getGroupInstanceFor(plotType);
                }

                seriesGroup.addSeries(seriesInstance);
            }

            for (prop in seriesGroups) {
                seriesGroups[prop].calculateLimits();
            }

            datasets.push(new Dataset(ds.id || i, category, seriesObjArr, seriesGroups));

        }
    };

    DatasetManager.prototype.getDatasets = function () {
        return this.datasets;
    };

    FusionCharts.registerComponent('api', 'dataset', DatasetManager);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-canvas-impl', function () {
    var global = this,
        lib = global.hcLib,
        win = global.window,
        M = win.Math,
        onHover = lib.onHover,
        getClosestIndexOf = lib.getClosestIndexOf,
        ComponentInterface = FusionCharts.getComponent('interface', 'component'),
        Canvas = FusionCharts.getComponent('api', 'canvas'),
        Scroller = FusionCharts.getComponent('api', 'scroller'),
        CrossLine = FusionCharts.getComponent('api', 'cross-line'),
        ReferencePlots = FusionCharts.getComponent('api', 'reference-plots'),
        X_AXIS_VISIBLE_RANGE_START = 'x-axis-visible-range-start',
        X_AXIS_VISIBLE_RANGE_END = 'x-axis-visible-range-end',
        X_AXIS_ABSOLUTE_RANGE_START = 'x-axis-absolute-range-start',
        X_AXIS_ABSOLUTE_RANGE_END = 'x-axis-absolute-range-end',
        Y_AXIS_VISIBLE_RANGE_START = 'y-axis-visible-range-start',
        Y_AXIS_VISIBLE_RANGE_END = 'y-axis-visible-range-end',
        BIN_SIZE = 'bin-size',
        MAX_PLOT_POINT = 'max-plot-point',
        AGGREGATION_FN = 'aggregation-fn',
        BIN_SIZE_EXT = 'bin-size-ext',
        MAX_PLOT_POINT_EXT = 'max-plot-point-ext',
        AGGREGATION_FN_EXT = 'aggregation-fn-ext',
        HOVER_X = 'hover-x',
        HOVER_EVT = 'hover-evt',
        VISIBLE_SERIES = 'visible-series',
        HIDDEN_SERIES = 'hidden-series',
        FOCUSED_SERIES = 'focused-series',
        ElementRecycle = FusionCharts.getComponent('api', 'ElementRecycle'),
        DataAggregator = FusionCharts.getComponent('api', 'dataaggregator');

    function extractPlotsFromDataset (dataset, series) {
        var plots = [],
            i,
            l;

        for (i = 0, l = series.length; i < l; i++) {
            plots.push(dataset.getPlotInstanceBySeriesId(series[i].getId()));
        }

        return plots;
    }

    function CanvasImpl () {
        ComponentInterface.apply(this, arguments);

        this.measurement = {
            x: undefined,
            y: undefined,
            width: undefined,
            height: undefined
        };

        this.scroller = undefined;
        this.plotBands = undefined;
        this.refMarkers = [];
        this.svgElems = {};

        this.elementRecycleInstance = new ElementRecycle();
        this.aggregationConfigHistory = undefined;
    }

    CanvasImpl.prototype = Object.create(ComponentInterface.prototype);
    CanvasImpl.prototype.constructor = CanvasImpl;

    CanvasImpl.prototype.init = function (require) {
        var self = this;

        require([
            'xAxis',
            'yAxis',
            'graphics',
            'chart',
            'dataset',
            'PlotManager',
            'canvasConfig',
            'MarkerManager',
            'reactiveModel',
            'globalReactiveModel',
            'dataInstance',
            'LegendImpl',
            'CaptionImpl',
            'parentGroup',
            function (
                xAxis,
                yAxis,
                graphics,
                chart,
                dataset,
                plotManager,
                canvasConfig,
                markerManager,
                reactiveModel,
                globalReactiveModel,
                dataInstance,
                LegendImpl,
                CaptionImpl,
                rootGroup) {
                self.xAxis = xAxis;
                self.yAxis = yAxis;
                self.graphics = graphics;
                self.chart = chart;
                self.dataset = dataset;
                self.plotManager = plotManager;
                self.markerManager = markerManager;
                self.canvasConfig = canvasConfig;
                self.reactiveModel = reactiveModel;
                self.globalReactiveModel = globalReactiveModel;
                self.dataInstance = dataInstance;
                self.legend = LegendImpl;
                self.caption = CaptionImpl;
                self.rootGroup = rootGroup;
            }
        ]);

        self.globalReactiveModel.linkExternalModel(self.reactiveModel);

        self.postInitHook && self.postInitHook();

        self.canvas = new Canvas(self.canvasConfig, {
            paper: self.graphics.paper,
            plot: {}
        }).attachAxes(self.xAxis, self.yAxis);

        self.dataAggregator = this.getDataAggregator();
    };

    CanvasImpl.prototype.updateAggreagtionHistory = function (history) {
        this.aggregationConfigHistory = history;
        return this;
    };

    CanvasImpl.prototype.clearAggreagtionHistory = function () {
        this.aggregationConfigHistory = undefined;
        return this;
    };

    CanvasImpl.prototype.setReactivity = function () {
        var dataset = this.dataset;

        this.globalReactiveModel
            .prop(HOVER_X, undefined)
            .prop(HOVER_EVT, undefined);


        dataset.calculateVisibleLimits();
        this.updateYAxisLimitFromData();

        this.reactiveModel
            .prop(VISIBLE_SERIES, dataset.getSeries())
            .prop(HIDDEN_SERIES, [])
            .prop(FOCUSED_SERIES, undefined)
            .prop(BIN_SIZE, undefined)
            .prop(MAX_PLOT_POINT, undefined)
            .prop(AGGREGATION_FN, undefined)
            .prop(BIN_SIZE_EXT, undefined)
            .prop(MAX_PLOT_POINT_EXT, undefined)
            .prop(AGGREGATION_FN_EXT, undefined);
    };

    CanvasImpl.prototype.createSVGGroups = function (parentGroup) {
        var paper = this.graphics.paper,
            svgElemens = this.svgElems,
            canvas = this.canvas,
            config = this.canvasConfig,
            divlines = config.divlines,
            cls,
            plotG;

        plotG = svgElemens.groups || (svgElemens.groups = { parent: parentGroup });
        parentGroup = parentGroup || plotG.parent;
        plotG.xAxis = plotG.xAxis || (plotG.xAxis = paper.group('ds-xAxis', this.rootGroup));
        plotG.yAxis = plotG.yAxis || (plotG.yAxis = paper.group('ds-yAxis', this.rootGroup));
        plotG.plot = plotG.plot || (plotG.plot = paper.group('ds-plots', parentGroup));
        plotG.crossline = plotG.crossline || (plotG.crossline = paper.group('crossline', parentGroup));

        if (!plotG.hBands) {
            paper.cssAddRule('.' + (cls = divlines.className), divlines.style);
            plotG.hBands = paper.group(parentGroup).attr('class', cls).toBack();
            canvas.graphics.body.toBack();
        }

        return plotG;
    };

    CanvasImpl.prototype.getAggregationFactor = function () {
        var globalReactiveModel = this.globalReactiveModel;

        return (globalReactiveModel.prop(X_AXIS_ABSOLUTE_RANGE_END) -
            globalReactiveModel.prop(X_AXIS_ABSOLUTE_RANGE_START)) /
            (globalReactiveModel.prop(X_AXIS_VISIBLE_RANGE_END) -
            globalReactiveModel.prop(X_AXIS_VISIBLE_RANGE_START));
    };

    CanvasImpl.prototype.getDataAggregator = function () {
        var canvasConfig = this.canvasConfig,
            dataAgg,
            config;

        if (!(dataAgg = this.dataAggregator)) {
            canvasConfig.aggregation = (canvasConfig.aggregation && typeof canvasConfig.aggregation === 'function' &&
                canvasConfig.aggregation) || function () { };

            dataAgg = this.dataAggregator = new DataAggregator({});
            config = (canvasConfig.aggregation.apply(dataAgg, []) || {});
            dataAgg.setData({aggregatorFn: config.method});
        }

        return dataAgg;
    };

    CanvasImpl.prototype.updateAggregationModel = function (aggregationInf) {
        this.reactiveModel
            .keepSilence()
            .prop(BIN_SIZE_EXT, aggregationInf.binSize)
            .prop(MAX_PLOT_POINT_EXT, aggregationInf.maxPlotPoints)
            .prop(AGGREGATION_FN_EXT, aggregationInf.fn)
            .resetSilence()
            .lock()
            .prop(BIN_SIZE, aggregationInf.binSize)
            .prop(MAX_PLOT_POINT, aggregationInf.maxPlotPoints)
            .prop(AGGREGATION_FN, aggregationInf.fn)
            .unlock();

        return this;
    };

    CanvasImpl.prototype.createAggregatedDataset = function (history, recalculate) {
        var dataAggregator = this.dataAggregator,
            dataset = this.dataset,
            _history,
            data = [],
            dataArr,
            aggregatedYAxisModel,
            aggregatedData,
            factor,
            aggRules,
            seriesId,
            maxPlotPoints,
            series,
            fn,
            span,
            arg,
            i,
            l;

        _history = history || {};
        if (typeof recalculate === 'function') {
            recalculate = recalculate.call(this);
        }

        function seriesFn (xAxisModel, yAxisModel, visibilityPointers, series) {
            data.push({
                data: series.getOriginalData(),
                aggregatorFn: series.getAggregatorFn && series.getAggregatorFn(),
                seriesId: series.getId()
            });
        }

        factor = this.getAggregationFactor();
        maxPlotPoints = this.plotManager.getMaxPlotPoints();
        maxPlotPoints = M.min(maxPlotPoints, _history.maxPlotPoints || Number.POSITIVE_INFINITY);

        dataset.forEachSeries(seriesFn);
        dataAggregator.setData({
            data: data,
            category: dataset.getOriginalCategoryData(),
            aggregatorFn: _history.fn || null,
            maxPlotPoints: Math.floor(maxPlotPoints * factor)
        });

        arg = _history.binSize && !recalculate ? {span: history.binSize} : (_history.binSize = undefined);
        aggregatedData = dataAggregator.getAggregatedData(arg);
        dataArr = aggregatedData.data;
        aggRules = this._aggregationRules = aggregatedData.rules;
        dataset.setAggregatedCategory(aggregatedData.category);

        for (i = 0, l = dataArr.length; i < l; i++) {
            aggregatedYAxisModel = dataArr[i].data;
            seriesId = dataArr[i].seriesId;
            series = dataset.getSeriesById(seriesId);
            series.setAggregatedData(aggregatedYAxisModel);
        }

        this.updateAggregationModel({
            maxPlotPoints: maxPlotPoints,
            binSize: span = (aggRules && aggRules.span),
            fn: fn = dataAggregator.aggregatorFn
        });

        return {
            maxPlotPoints: maxPlotPoints,
            binSize: span,
            fn: fn
        };
    };

    CanvasImpl.prototype.resetAggregation = function () {
        this.reactiveModel
            .keepSilence()
            .prop(BIN_SIZE, undefined)
            .prop(MAX_PLOT_POINT, undefined)
            .prop(AGGREGATION_FN, undefined)
            .prop(BIN_SIZE_EXT, undefined)
            .prop(MAX_PLOT_POINT_EXT, undefined)
            .prop(AGGREGATION_FN_EXT, undefined)
            .resetSilence();

        this.clearAggreagtionHistory();
        this.createAggregatedDataset();
        this
            .adjustVisibleLimits()
            .updateYAxisLimitFromData();
    };

    CanvasImpl.prototype.update = function () {
        this.createAggregatedDataset();
        this
            .adjustVisibleLimits()
            .updateYAxisLimitFromData();
        return this;
    };

    CanvasImpl.prototype.adjustVisibleLimits = function (xStart, xEnd) {
        var dataset = this.dataset,
            globalReactiveModel = this.globalReactiveModel,
            pointerStartIndex,
            pointerEndIndex,
            xAxisModel;

        xStart = xStart === undefined ? globalReactiveModel.prop(X_AXIS_VISIBLE_RANGE_START) : xStart;
        xEnd = xEnd === undefined ? globalReactiveModel.prop(X_AXIS_VISIBLE_RANGE_END) : xEnd;

        xAxisModel = dataset.getCategoryData();
        pointerStartIndex = getClosestIndexOf(xAxisModel, xStart, 'right');
        pointerEndIndex = getClosestIndexOf(xAxisModel, xEnd, 'left');

        dataset.moveVisibilityPointers(pointerStartIndex, pointerEndIndex);
        return this;
    };

    CanvasImpl.prototype.updateYAxisLimit = function (start, end) {
        var reactiveModel = this.reactiveModel;

        reactiveModel.lock();
        if (start !== undefined) {
            reactiveModel.prop(Y_AXIS_VISIBLE_RANGE_START, start);
        }

        if (end !== undefined) {
            reactiveModel.prop(Y_AXIS_VISIBLE_RANGE_END, end);
        }
        reactiveModel.unlock();

        return this;
    };

    CanvasImpl.prototype.updateYAxisLimitFromData = function () {
        var dataset = this.dataset;

        dataset.calculateVisibleLimits();
        return this.updateYAxisLimit(dataset.getMin('y'), dataset.getMax('y'));
    };

    CanvasImpl.prototype.configureXAxis = function (x, y, width) {
        var globalReactiveModel = this.globalReactiveModel,
            xAxis = this.xAxis,
            xScale = xAxis.getScaleObj(),
            posX,
            posY,
            offset;

        xAxis.setRange(globalReactiveModel.prop(X_AXIS_VISIBLE_RANGE_END),
            globalReactiveModel.prop(X_AXIS_VISIBLE_RANGE_START));
        xAxis.setAxisLength(width);
        offset = this.plotManager.getAxisOffset();

        if (offset > 0) {
            xAxis.setAxisLength(width - (2 * offset));
        }

        this.setXAxisPos && this.setXAxisPos.apply(this, arguments);

        posX = xScale.getConfig('posX');
        posY = xScale.getConfig('posY');

        xAxis.setAxisPosition(posX + offset, posY);
        return this;
    };

    CanvasImpl.prototype.drawXAxis = function () {
        var xAxis = this.xAxis,
            scale = xAxis.getScaleObj();
        scale.getIntervalObj().setConfig('showSingleTick', xAxis.config.userConfig.value.singleTick);
        scale.setConfig('scaleGroup', this.createSVGGroups().xAxis);
        // @todo check scale object to see whether it is configured, if not call the configureXAxis internally
        this.canvasConfig.showAxes.x && xAxis.draw();

        return this;
    };

    CanvasImpl.prototype.configureYAxis = function (x, y, width, height) {
        var canvasReactiveModel = this.reactiveModel,
            yAxis = this.yAxis;
        yAxis.setRange(canvasReactiveModel.prop(Y_AXIS_VISIBLE_RANGE_END),
            canvasReactiveModel.prop(Y_AXIS_VISIBLE_RANGE_START));
        yAxis.setAxisLength(height);

        this.setYAxisPos && this.setYAxisPos.apply(this, arguments);
        return this;
    };

    CanvasImpl.prototype.drawYAxis = function () {
        this.yAxis.getScaleObj().setConfig('scaleGroup', this.createSVGGroups().yAxis);
        this.canvasConfig.showAxes.y && this.yAxis.draw();
        return this;
    };

    CanvasImpl.prototype.initInteractivity = function (groups) {
        var self = this,
            xAxis = this.xAxis,
            yAxis = this.yAxis,
            markerManager = this.markerManager,
            plotManager = this.plotManager,
            dataset = this.dataset,
            canvasConfig = this.canvasConfig,
            showX = canvasConfig.showAxes.x,
            showY = canvasConfig.showAxes.y,
            globalReactiveModel = this.globalReactiveModel,
            prvYMin,
            prvYMax,
            newYMin,
            newYMax;

        globalReactiveModel
            .onPropsChange([X_AXIS_VISIBLE_RANGE_START, X_AXIS_VISIBLE_RANGE_END],
                function (xStart, xEnd) {
                    var xStartPre = xStart[0],
                        xStartPost = xStart[1],
                        xEndPre = xEnd[0],
                        xEndPost = xEnd[1],
                        dStart = M.round(xStartPost - xStartPre),
                        dEnd = M.round(xEndPost - xEndPre);

                    xAxis.setRange(xEndPost, xStartPost);
                    showX && xAxis.draw();
                    markerManager.plot();

                    if (dStart !== dEnd) {
                        self.createAggregatedDataset(self.aggregationConfigHistory, function () {
                            var aggConf = this.aggregationConfigHistory;

                            if (!aggConf) {
                                return false;
                            }

                            if (((xEndPost - xStartPost) / aggConf.maxPlotPoints) > aggConf.binSize) {
                                return true;
                            }
                            return false;
                        });
                    }

                    self.adjustVisibleLimits(xStartPost, xEndPost);
                    self.updateYAxisLimitFromData();

                    newYMin = dataset.getMin('y');
                    newYMax = dataset.getMax('y');


                    prvYMin = newYMin;
                    prvYMax = newYMax;
                }
            );

        this.reactiveModel
            .onPropsChange([Y_AXIS_VISIBLE_RANGE_START, Y_AXIS_VISIBLE_RANGE_END],
                function (yStart, yEnd) {
                    yAxis.setRange(yEnd[1], yStart[1]);

                    showY && yAxis.draw();
                    self.drawHorizontalPlotBands(self.createSVGGroups().hBands);
                    plotManager.plot(groups.plot);
                }
            )
            .onPropsChange([BIN_SIZE_EXT, MAX_PLOT_POINT_EXT, AGGREGATION_FN_EXT],
                function (binSize, maxPlotPoints, aggFn) {
                    var arg = {},
                        history = self.aggregationConfigHistory;

                    // @todo this deteriorates the performance
                    // if (binSize[0] !== binSize[1]) {
                    arg.binSize = binSize[1] || history.binSize;
                    // }

                    // if (maxPlotPoints[0] !== maxPlotPoints[1]) {
                    arg.maxPlotPoints = maxPlotPoints[1] || history.maxPlotPoints;
                    // }

                    // if (aggFn[0] !== aggFn[1]) {
                    arg.fn = aggFn[1] || history.fn;
                    // }

                    self.updateAggreagtionHistory(self.createAggregatedDataset(arg));
                    self.adjustVisibleLimits();
                    self.updateYAxisLimitFromData();
                }
            )
            .onPropsChange([VISIBLE_SERIES, HIDDEN_SERIES],
                function (visible, hidden) {
                    plotManager.manageVisibility(extractPlotsFromDataset(dataset, visible[1]),
                        extractPlotsFromDataset(dataset, hidden[1]));
                }
            )
            .onPropChange(FOCUSED_SERIES,
                function (pre, post) {
                    if (post) {
                        plotManager.fadeAllExcept(extractPlotsFromDataset(dataset, post));
                    } else {
                        plotManager.unfadeAll();
                    }
                }
            );

        return this;
    };

    CanvasImpl.prototype.drawMarkers = function (group) {
        this.markerManager.plot(this.canvas, group);
        return this;
    };

    CanvasImpl.prototype.drawPlots = function (group) {
        this.plotManager.plot(group);
        return this;
    };

    CanvasImpl.prototype.drawScrollBar = function (x, y, width, height, group) {
        var self = this,
            graphics = self.graphics,
            globalReactiveModel = self.globalReactiveModel,
            xAxis = self.xAxis,
            history = {
                startX: undefined,
                endX: undefined
            };

        self.scroller =
            new Scroller(self.canvasConfig.scroller, {
                paper: graphics.paper,
                container: graphics.container,
                plot: {}
            })
            .draw(x, y, width, height, group)
            .addEventListeners(function (startX, endX) {
                var start,
                    end;

                if ((history.startX === startX && history.endX === endX) || !isFinite(startX + endX)) {
                    return;
                }

                start = xAxis.getValue(startX);
                end = xAxis.getValue(endX);

                globalReactiveModel
                    .lock()
                    .prop(X_AXIS_VISIBLE_RANGE_START, start)
                    .prop(X_AXIS_VISIBLE_RANGE_END, end)
                    .unlock();

                history.startX = startX;
                history.endX = endX;
            });

        return this;
    };

    CanvasImpl.prototype.drawHorizontalPlotBands = function (group) {
        var svgElems = this.svgElems,
            divlines = this.canvasConfig.divlines;

        if (divlines.hide) { return this; }

        // @todo use an ext api from axis
        svgElems.plotBands = this.canvas.drawHorizontalSpans({
            data: this.yAxis.getScaleObj().getIntervalObj().getConfig('intervals').major.intervalPoints,
            group: group,
            config: divlines,
            elementRecycleInstance: this.elementRecycleInstance
        });


        return this;
    };

    CanvasImpl.prototype.drawReferenceMarkers = function () {
        var canvasConfig = this.canvasConfig,
            referenceMarkers = canvasConfig.referenceMarkers,
            svgElems = this.svgElems,
            paper = this.graphics.paper,
            hRefPlots = svgElems.hRefPlots || (svgElems.hRefPlots = {}),
            canvas = this.canvas,
            canvasGroup = canvas.getSVGGroup(),
            refMarkers = this.refMarkers,
            hasReferenceMarkers,
            group,
            referenceMarker,
            i,
            l;

        hasReferenceMarkers = !!(referenceMarkers && referenceMarkers.length);

        if (!hasReferenceMarkers) { return this; }

        group = hRefPlots.group = paper.group('canvas-h-plot-band', canvasGroup).toFront();
        for (i = 0, l = referenceMarkers.length; i < l; i++) {
            referenceMarker = referenceMarkers[i];
            refMarkers.push(new ReferencePlots(ReferencePlots.PLOT_TYPE[(referenceMarker.type || '').toUpperCase()], {
                style: referenceMarker.style
            }, {paper: paper})
                .draw([referenceMarker.start, referenceMarker.end], this.canvas, group));
        }

        return this;
    };

    CanvasImpl.prototype.drawLegend = function () {
        this.legend.draw();
        return this;
    };

    CanvasImpl.prototype.manageSpace = function () {
        this.caption.manageSpace();
        this.legend.manageSpace();
        return this;
    };

    CanvasImpl.prototype.drawCaption = function () {
        this.caption.draw();
        return this;
    };

    CanvasImpl.prototype.getPlotBands = function () {
        return this.plotBands;
    };

    CanvasImpl.prototype.getReferenceMarkers = function () {
        return this.referenceMarkers;
    };

    CanvasImpl.prototype.attachEvents = function (x, y, width, height) {
        var globalReactiveModel = this.globalReactiveModel,
            container = this.graphics.container;

        onHover(container, function (e) {
            var mousePos = lib.getMouseCoordinate(container, e);
            if ((mousePos.chartX > x && mousePos.chartY > y) &&
                (mousePos.chartX < x + width && mousePos.chartY < y + height)) {
                globalReactiveModel.prop(HOVER_X, mousePos.chartX);
                globalReactiveModel.prop(HOVER_EVT, e);
            }
        }, function () {
            globalReactiveModel.prop(HOVER_X, undefined);
            globalReactiveModel.prop(HOVER_EVT, undefined);
        });

        return this;
    };

    CanvasImpl.prototype.initCrossLine = function (startY, endY, group) {
        this.crossLine = new CrossLine(startY, endY, {
                crossline: this.dataInstance.crossline[0],
                tooltip: this.dataInstance.tooltip[0]
            }, {
                xAxis: this.xAxis,
                yAxis: this.yAxis,
                graphics: this.graphics,
                dataset: this.dataset,
                plotManager: this.plotManager,
                group: group,
                globalReactiveModel: this.globalReactiveModel
            });

        return this;
    };

    CanvasImpl.prototype.setDrawingConfiguration = function (x, y, width, height, group) {
        var mes = this.measurement;

        mes.x = x;
        mes.y = y;
        mes.width = width;
        mes.height = height;
        mes.group = group;
        return this;
    };

    CanvasImpl.prototype.getMargin = function () {
        return this.canvas.config.margin;
    };

    CanvasImpl.prototype.draw = function (x, y, width, height) {
        var canvas = this.canvas,
            measurement = this.measurement,
            groups;

        // Saves the measurement configuration in the instance. The subsequent apis make use of this.
        x = x === undefined ? measurement.x : x;
        y = y === undefined ? measurement.y : y;
        width = width === undefined ? measurement.width : width;
        height = height === undefined ? measurement.height : height;

        canvas.draw(x, y, width, height, measurement.group);
        groups = this.createSVGGroups(canvas.clipToDimension(canvas.getSVGGroup()));

        this.configureXAxis(x,  y, width, height);
        this.createAggregatedDataset();
        this
            .adjustVisibleLimits()
            .drawXAxis()
            .updateYAxisLimitFromData()
            .configureYAxis(x - 30, y, width, height)
            .drawYAxis()
            .drawLegend()
            .drawCaption()
            .drawMarkers(groups.markers)
            .drawPlots(groups.plot)
            .drawHorizontalPlotBands(groups.hBands)
            .drawReferenceMarkers()
            .initCrossLine(y, y + height, groups.crossline)
            .initInteractivity(groups)
            .attachEvents(x, y, width, height);
    };

    FusionCharts.registerComponent('main', 'canvas', CanvasImpl);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-resolvers', function () {
    var ResolverInterface = FusionCharts.getComponent('interface', 'resolver'),
        mainComp = FusionCharts.getComponent('main'),
        CanvasGroup = FusionCharts.getComponent('api', 'canvas-group'),
        DatasetManager = FusionCharts.getComponent('api', 'dataset'),
        objCreate = Object.create;


    function GenericResolver () {
        ResolverInterface.apply(this, arguments);

        this.target = [];
        GenericResolver.allResolvers.push(this);
    }

    GenericResolver.prototype = objCreate(ResolverInterface.prototype);
    GenericResolver.prototype.constructor = GenericResolver;

    GenericResolver.allResolvers = [];

    GenericResolver.resolveAll = function (store) {
        var resolvers = GenericResolver.allResolvers;

        function cb (item) { item.resolve(store); }
        resolvers.forEach(cb);
        GenericResolver.allResolvers.length = 0;
    };

    GenericResolver.prototype.resolveTo = function(path) {
        this.target.push(path);
        return this;
    };

    GenericResolver.prototype.resolve = function (store) {
        var inst = this.getInstance(store),
            target = this.target,
            obj,
            prop,
            i,
            l;

        for (i = 0, l = target.length; i < l; i++) {
            obj = target[i][0];
            prop = target[i][1];

            obj[prop] = inst;
        }
    };


    function DatasetResolver () {
        GenericResolver.apply(this, arguments);
    }

    DatasetResolver.prototype = objCreate(GenericResolver.prototype);
    DatasetResolver.prototype.constructor = DatasetResolver;

    DatasetResolver.prototype.getInstance = function () {
        return (new DatasetManager(this.definitions)).getDatasets();
    };

    DatasetResolver.prototype.resolve = function (store) {
        var inst = this.getInstance(store),
            target = this.target,
            mapById = {},
            obj,
            prop,
            i,
            l;

        for (i = 0, l = inst.length; i < l; i++) {
            mapById[inst[i].id] = inst;
        }

        for (i = 0, l = target.length; i < l; i++) {
            obj = target[i][0];
            prop = target[i][1];

            if (typeof prop === 'number') {
                obj[prop] = inst[prop];
            } else {
                obj[prop] = mapById[prop];
            }
        }
    };


    function AxisResolver () {
        GenericResolver.apply(this, arguments);
    }

    AxisResolver.prototype = objCreate(GenericResolver.prototype);
    AxisResolver.prototype.constructor = AxisResolver;

    AxisResolver.prototype.getInstance = function (store) {
        var definitions = this.definitions,
            args = this.args,
            axis;

        if (typeof definitions === 'function') {
            return definitions(store);
        }

        axis = new mainComp.axis(definitions);
        if (args.type === 'y') {
            axis.getScaleObj().setConfig('vertical', true);
            axis.getScaleObj().setConfig('groupClassName', 'yAxis-' + args.index);
        } else {
            axis.setConfig('scale', 'timescale');
            axis.getScaleObj().setConfig('interval', 'timeintervals');
            axis.getScaleObj().setConfig('groupClassName', 'xAxis-' + args.index);
        }

        return axis;
    };


    function CanvasGroupResolver () {
        GenericResolver.apply(this, arguments);
    }

    CanvasGroupResolver.prototype = objCreate(GenericResolver.prototype);
    CanvasGroupResolver.prototype.constructor = CanvasGroupResolver;

    CanvasGroupResolver.prototype.getInstance = function (store) {
        var definitions = this.definitions,
            resolvableKeys = ['dataset', 'axes'],
            resolvedDef = {},
            key,
            val;

        for (key in definitions) {
            val = definitions[key];
            if (typeof val === 'function' && resolvableKeys.indexOf(key) >= 0) {
                resolvedDef[key] = val(store);
                delete definitions[key];
            }else {
                resolvedDef[key] = val;
            }
        }
        resolvedDef.impl = new this.args.impl(this.definitions);
        return new CanvasGroup(resolvedDef);
    };

    FusionCharts.registerComponent('resolvers', 'generic-resolver', GenericResolver);
    FusionCharts.registerComponent('resolvers', 'axis-resolver', AxisResolver);
    FusionCharts.registerComponent('resolvers', 'canvasgroup-resolver', CanvasGroupResolver);
    FusionCharts.registerComponent('resolvers', 'dataset-resolver', DatasetResolver);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-active-window-api', function () {
    var Canvas = FusionCharts.getComponent('api', 'canvas'),
        configStr = 'config',
        math = Math,
        mathMax = math.max,
        mathAbs = math.abs,
        mathMin = math.min;

    function ActiveWindow () {
        var config;
        Canvas.apply(this, arguments);
        config = this.config;
        config.trackerFill = 'rgba(192,192,192, 0.000001)';
        config.TRACKER_WIDTH = 12;
    }

    ActiveWindow.prototype = Object.create(Canvas.prototype);
    ActiveWindow.prototype.constructor = ActiveWindow;

    ActiveWindow.prototype.createSelectionBox = function (key) {
        var trackerElem,
            self = this,
            graphics = self.graphics,
            navigatorGroup,
            config = this.config,
            leftButtonCosmetics = config.leftButton,
            rightButtonCosmetics = config.rightButton,
            navigationObj = graphics[key],
            dependencies = self.dependencies,
            paper = dependencies.paper;

        if (!navigationObj) {
            navigationObj = graphics[key] = {};
        }

        if (!(navigatorGroup = navigationObj.navigatorGroup)) {
            navigatorGroup = navigationObj.navigatorGroup = this.group || paper.group('def-active-win');

            trackerElem = (navigationObj.trackerElem = {});

            // Drawing the main box element
            trackerElem.selectionBox = paper.rect(navigatorGroup)
            .data(configStr, {
                position: 0,
                key: key,
                pRef: self
            })
            .css('cursor', 'move');

            // draw the handles.
            trackerElem.leftButton = self.drawHandles(0, navigatorGroup);
            trackerElem.rightButton = self.drawHandles(1, navigatorGroup);


            // Draw right tracker element
            trackerElem.rightTracker = paper.rect(navigatorGroup)
            .data(configStr, {
                position: 1,
                key: key,
                pRef: self
            })
            .css('cursor', 'ew-resize');

            // Draw left tracker element
            trackerElem.leftTracker = paper.rect(navigatorGroup)
            .data(configStr, {
                position: 2,
                key: key,
                pRef: self
            })
            .css('cursor', 'ew-resize');

            self.bindDragEvent(trackerElem);
        }
        // Apply the css styles.
        this.applyStyle({
            selectionBox: config.selectionBox.style,
            leftButton: {
                rect: leftButtonCosmetics.rect.style,
                arrow: leftButtonCosmetics.arrow.style
            },
            rightButton: {
                rect: rightButtonCosmetics.rect.style,
                arrow: rightButtonCosmetics.arrow.style
            }
        }, trackerElem);
    };

    ActiveWindow.prototype.draw = function (x, y, width, height, group) {
        var key = 'lead';
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.group = group;

        this.createSelectionBox(key);
        // this.createSelectionBox('lag');

        this.updateSelectionBox(key, this.x, this.x + this.width);
        // this.updateSelectionBox('lag', 250, 410);
    };

    ActiveWindow.prototype.updateSelectionBox = function (key, x1, x2) {
        var self = this,
            graphics = self.graphics,
            navigationObj = graphics[key],
            x = x1,
            y = self.y,
            width = x2 - x1,
            height = self.height,
            trackerElem = navigationObj.trackerElem,
            config = self.config,
            trackerFill = config.trackerFill,
            TRACKER_WIDTH = config.TRACKER_WIDTH,
            TRACKER_HALF_WIDTH = TRACKER_WIDTH * 0.5;

        if (!this.buttonWidth) {
            this.buttonWidth = mathMin(12, width / 45);
            this.setHandles(trackerElem, this.buttonWidth, mathMin(20, height * 0.4));
        }

        this.updateHandles.call(trackerElem.leftButton.rect, x, y, width, height);
        this.updateHandles.call(trackerElem.rightButton.rect, x, y, width, height);

        trackerElem.selectionBox.attr({
            x: x,
            y: y,
            width: width,
            height: height,
            fill: config.selectionBox.style.fill
        });

        trackerElem.rightTracker.attr({
            x: x + width - TRACKER_HALF_WIDTH,
            y: y,
            width: TRACKER_WIDTH,
            height: height,
            fill: trackerFill,
            'stroke-width': 0
        });

        trackerElem.leftTracker.attr({
            x: x - TRACKER_HALF_WIDTH,
            y: y,
            width: TRACKER_WIDTH,
            height: height,
            fill: trackerFill,
            'stroke-width': 0
        });
    };

    ActiveWindow.prototype.bindDragEvent = function(navigationObj) {
        var self = this,
            mouseMove = self.move,
            mouseDown = self.start,
            mouseUp = self.up,
            item,
            elem;

        for (item in navigationObj) {
            elem = navigationObj[item];
            if (elem.drag) {
                elem.drag(mouseMove, mouseDown, mouseUp);
            }
            else {
                elem.rect.drag(mouseMove, mouseDown, mouseUp);
            }
        }
    };
    // will create a rectangle and an arrow. Only create the raphael element.
    ActiveWindow.prototype.drawHandles = function (index, group) {
        var paper = this.dependencies.paper,
            handleGroup = paper.group(group),
            obj = {
                rect: paper.rect(handleGroup),
                arrow: paper.path(handleGroup)
            };
        obj.rect.data('index', index)
            .data('ref', this)
            .data('graphicsObj', obj)
            .data('group', handleGroup);
        return obj;
    };

    ActiveWindow.prototype.pathGenerator = function (width, height, index) {
        var offset = width * ((index === 1) ? 0 : 1),
            x1 = offset + (index * ((72 / 249) * width)),
            y1 = ((172 / 355) * height),
            x2 = offset + (index * ((144 / 249) * width));
        return ['M', x1, y1, 'L', x2, ((118 / 355) * height), 'M', x1, y1, 'L', x2, ((230 / 355) * height)];
    };
    // sets the path and rectangle width/ height as per the required height/ width.
    ActiveWindow.prototype.setHandles = function (trackerElem, width, height) {
        var rightButton = trackerElem.rightButton,
            leftButton = trackerElem.leftButton,
            attrObj = {
                width: width,
                height: height,
                r: 4
            },
            config = this.config;

        rightButton.arrow.attr('path', this.pathGenerator(width, height, -1));
        attrObj.r = config.rightButton.rect.style.r;
        rightButton.rect.attr(attrObj);
        attrObj.r = config.leftButton.rect.style.r;
        leftButton.arrow.attr('path', this.pathGenerator(width, height, 1));
        leftButton.rect.attr(attrObj);
    };

    ActiveWindow.prototype.updateHandles = function (x, y, width, height) {
        var elem = this,
            self = elem.data('ref'),
            group = elem.data('group'),
            index = elem.data('index');
        group.attr({
            transform: 'T' + (x + (index * width) - self.buttonWidth / 2) + ',' + (y + height * 0.3)
        });
    };

    ActiveWindow.prototype.start = function () {
        var ele = this,
            data = ele.data(configStr),
            key = data.key,
            self = data.pRef,
            graphics = self.graphics,
            navigationObj = graphics[key],
            trackerElem = navigationObj.trackerElem,
            rightT = trackerElem.rightTracker,
            leftT = trackerElem.leftTracker,
            selectionBox = trackerElem.selectionBox,

            rightTData = rightT.data(configStr),
            leftTData = leftT.data(configStr),

            selectTData = selectionBox.data(configStr),
            bBox = selectionBox.getBBox();

        rightTData.ox = bBox.x2;
        rightTData.oy = bBox.y;

        leftTData.ox = bBox.x;
        leftTData.oy = bBox.y;

        selectTData.ox = bBox.x;
        selectTData.oy = bBox.y;

        selectTData.ow = bBox.width;
        selectTData.oh = bBox.height;
        selectTData.ox2 = bBox.x2;
        selectTData.oy2 = bBox.y2;

        // on click take the selection box on top.
        navigationObj.navigatorGroup.toFront();

        rightT.hide();
        leftT.hide();
        ele.show();
    };

    ActiveWindow.prototype.move = function (dx) {
        var ele = this,
            data = ele.data(configStr),
            key = data.key,
            self = data.pRef,
            graphics = self.graphics,
            navigationObj = graphics[key],
            trackerElem = navigationObj.trackerElem,
            rightT = trackerElem.rightTracker,
            leftT = trackerElem.leftTracker,
            selectT = trackerElem.selectionBox,
            HALF_T_WID = -6,
            selectTData = selectT.data(configStr),
            attrib = {},
            canvasLeft = self.x,
            canvasRight = self.width + canvasLeft,
            relX,
            x;

        x = dx + data.ox;

        x = mathMin(canvasRight - (data.ow || 0), mathMax(x, canvasLeft));


        switch (data.position) {
            case 1: // Right
                if (x > selectTData.ox) {
                    attrib.x = mathMin(selectTData.ox, x);
                    selectTData.width = attrib.width = mathAbs(selectTData.ox - x) || 1;
                    rightT.attr({
                        x: x + HALF_T_WID
                    });
                }
                break;
            case 2: // Left
                if (x < selectTData.ox2) {
                    attrib.x = mathMin(selectTData.ox2, x);
                    selectTData.width = attrib.width = mathAbs(selectTData.ox2 - x) || 1;
                    leftT.attr({
                        x: x + HALF_T_WID
                    });
                }
                break;
            default:
                attrib.x = x;
                selectTData.width = attrib.width = selectTData.ow || 1;
                break;
        }
        relX = attrib.x - self.x;

        self.fn && self.fn.call(null, attrib.x, relX, selectTData.width);
    };

    ActiveWindow.prototype.up = function () {
        var ele = this,
            data = ele.data(configStr),
            key = data.key,
            self = data.pRef,
            graphics = self.graphics,
            navigationObj = graphics[key],
            trackerElem = navigationObj.trackerElem,
            rightT = trackerElem.rightTracker,
            leftT = trackerElem.leftTracker,
            selectT = trackerElem.selectionBox,
            HALF_T_WID = -6,
            bBox;

        setTimeout(function() {
            bBox = selectT.getBBox(),

            rightT.attr({
                x: bBox.x2 + HALF_T_WID
            }).show();

            leftT.attr({
                x: bBox.x + HALF_T_WID
            }).show();
        }, 100);
    };

    ActiveWindow.prototype.registerListener = function (fn) {
        this.fn = fn;
    };

    FusionCharts.registerComponent('api', 'active-window', ActiveWindow);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-navigator-impl', function () {
    var global = this,
        win = global.window,
        M = win.Math,
        mMin = M.min,
        mMax = M.max,
        CanvasImpl = FusionCharts.getComponent('main', 'canvas'),
        ActiveWindow = FusionCharts.getComponent('api', 'active-window'),
        X_AXIS_VISIBLE_RANGE_START = 'x-axis-visible-range-start',
        X_AXIS_VISIBLE_RANGE_END = 'x-axis-visible-range-end',
        X_AXIS_ABSOLUTE_RANGE_START = 'x-axis-absolute-range-start',
        X_AXIS_ABSOLUTE_RANGE_END = 'x-axis-absolute-range-end',
        Y_AXIS_VISIBLE_RANGE_START = 'y-axis-visible-range-start',
        Y_AXIS_VISIBLE_RANGE_END = 'y-axis-visible-range-end';


    function getCollectiveLimit (datasets) {
        var mins = [],
            maxs = [],
            ds,
            i,
            l;

        for (i = 0, l = datasets.length; i < l; i++) {
            ds = datasets[i];
            ds.calculateMappedLimits();
            mins.push(ds.getMin('y'));
            maxs.push(ds.getMax('y'));
        }

        return {
            min: mMin.apply(M, mins),
            max: mMax.apply(M, maxs)
        };
    }

    function NavigatorImpl () {
        CanvasImpl.apply(this, arguments);

        this.activeWindows = [];
        this.svgElems = {};
    }

    NavigatorImpl.prototype = Object.create(CanvasImpl.prototype);
    NavigatorImpl.prototype.constructor = NavigatorImpl;

    NavigatorImpl.prototype.postInitHook = function () {
        var datasets = this.dataset,
            dsArr = [],
            key;

        for (key in datasets) {
            dsArr.push(datasets[key]);
        }

        datasets = this.dataset = dsArr;
    };

    NavigatorImpl.prototype.setReactivity = function () {
        var globalReactiveModel = this.globalReactiveModel,
            navigatorReactiveModel = this.reactiveModel,
            datasets = this.dataset,
            dataset = datasets[0],
            category = dataset.category,
            collectiveLimit,
            xMin,
            xMax;

        this.createAggregatedDataset();
        collectiveLimit = getCollectiveLimit(datasets);

        category.calculateOriginalDataLimit();
        globalReactiveModel.lock();
        globalReactiveModel
            .prop(X_AXIS_VISIBLE_RANGE_START, (xMin = category.getMin()))
            .prop(X_AXIS_VISIBLE_RANGE_END, (xMax = category.getMax()))
            .prop(X_AXIS_ABSOLUTE_RANGE_START, xMin)
            .prop(X_AXIS_ABSOLUTE_RANGE_END, xMax);
        globalReactiveModel.unlock();

        navigatorReactiveModel.lock();
        navigatorReactiveModel
            .prop(Y_AXIS_VISIBLE_RANGE_START, collectiveLimit.min)
            .prop(Y_AXIS_VISIBLE_RANGE_END, collectiveLimit.max);
        navigatorReactiveModel.unlock();
    };

    NavigatorImpl.prototype.updateYAxisLimit = function () {
        var datasets = this.dataset,
            reactiveModel = this.reactiveModel,
            collectiveLimit;

        collectiveLimit = getCollectiveLimit(datasets);

        reactiveModel.lock();
        reactiveModel
                .prop(Y_AXIS_VISIBLE_RANGE_START, collectiveLimit.min)
                .prop(Y_AXIS_VISIBLE_RANGE_END, collectiveLimit.max);
        reactiveModel.unlock();

        return this;
    };

    NavigatorImpl.prototype.updateXAxisLimit = function (fn) {
        var dataset = this.dataset[0],
            globalReactiveModel = this.globalReactiveModel,
            min,
            max,
            oldMin,
            oldMax,
            limit;

        min = dataset.getMin('x');
        max = dataset.getMax('x');

        oldMin = globalReactiveModel.prop(X_AXIS_VISIBLE_RANGE_START);
        oldMax = globalReactiveModel.prop(X_AXIS_VISIBLE_RANGE_END);

        if (fn && typeof fn === 'function') {
            limit = fn.call(this, [oldMin, min], [oldMax, max]);
        } else {
            limit = [oldMin, oldMax];
        }

        globalReactiveModel
            .lock()
            .prop(X_AXIS_ABSOLUTE_RANGE_START, min)
            .prop(X_AXIS_ABSOLUTE_RANGE_END, max)
            .prop(X_AXIS_VISIBLE_RANGE_START, limit[0])
            .prop(X_AXIS_VISIBLE_RANGE_END, limit[1])
            .unlock();

        return this;
    };

    NavigatorImpl.prototype.initInteractivity = function () {
        var self = this,
            yAxis = self.yAxis,
            xAxis = self.xAxis,
            activeWin = self.activeWindows[0],
            scroller = self.scroller;

        self.globalReactiveModel
            .onPropsChange([X_AXIS_ABSOLUTE_RANGE_START, X_AXIS_ABSOLUTE_RANGE_END, X_AXIS_VISIBLE_RANGE_START,
                X_AXIS_VISIBLE_RANGE_END],
                function (xAbsStart, xAbsEnd, xVisStart, xVisEnd) {
                    var startPx = xAxis.getPixel(xVisStart[1]),
                        endPx = xAxis.getPixel(xVisEnd[1]);

                    if (!(xAbsStart[0] === xAbsStart[1] && xAbsEnd[0] === xAbsEnd[1])) {
                        xAxis.setRange(xAbsEnd[1], xAbsStart[1]);
                        self.canvasConfig.showX && xAxis.draw();
                        self.plotManager.plot();

                        startPx = xAxis.getPixel(xVisStart[1]),
                        endPx = xAxis.getPixel(xVisEnd[1]);
                    }

                    activeWin.updateSelectionBox('lead', startPx, endPx);
                    scroller.setScrollSize(startPx, endPx);
                }
            );

        self.reactiveModel
            .onPropsChange([Y_AXIS_VISIBLE_RANGE_START, Y_AXIS_VISIBLE_RANGE_END],
                function (yStart, yEnd) {
                    if (yStart[0] === yStart[1] && yEnd[0] === yEnd[1]) {
                        return;
                    }

                    yAxis.setRange(yEnd[1], yStart[1]);
                    self.canvasConfig.showY && yAxis.draw();
                    self.plotManager.plot();
                }
            );

        return this;
    };

    NavigatorImpl.prototype.drawHandles = function () {
    };

    NavigatorImpl.prototype.manageSpace = function () {};

    NavigatorImpl.prototype.createSVGGroups = function (parentGroup) {
        var graphics = this.graphics,
            svgElems = this.svgElems,
            paper = graphics.paper,
            plotG = svgElems.groups || (svgElems.groups = { parent: parentGroup });

        plotG.navPlots = plotG.navPlots || (plotG.navPlots = paper.group('ds-plots', parentGroup));
        plotG.plot = plotG.plot || (plotG.plot = paper.group('ds-plots', plotG.navPlots));
        plotG.axis = plotG.axis || (plotG.axis = paper.group('ds-nav-axis', plotG.navPlots)).toFront();
        plotG.activeWin = plotG.activeWin || (plotG.activeWin = paper.group('active-window', parentGroup)).toFront();
        plotG.scrollerContainer = plotG.scrollerContainer || (plotG.scrollerContainer = paper.
            group('scroller-container', parentGroup));
        plotG.labelGroup = plotG.labelGroup || (plotG.labelGroup = paper.group('label-group', parentGroup));
        return plotG;
    };

    NavigatorImpl.prototype.drawActiveWindow = function (x, y, width, height, group) {
        var activeWindows = this.activeWindows,
            globalReactiveModel = this.globalReactiveModel,
            xAxis = this.xAxis,
            yAxis = this.yAxis,
            history = {
                x: undefined,
                width: undefined
            },
            activeWin;
        activeWin = new ActiveWindow(this.canvasConfig, {
            paper: this.graphics.paper,
            axes: {
                x: xAxis,
                y: yAxis
            },
            plot: {}
        });

        activeWin.registerListener(function (absX, x, width) {
            var start,
                end;

            if ((history.x === x && history.width === width) || !isFinite(absX + x + width)) {
                return;
            }

            start = xAxis.getValue(absX);
            end = xAxis.getValue(absX + width);

            globalReactiveModel.lock();
            globalReactiveModel.model[X_AXIS_VISIBLE_RANGE_START] = start;
            globalReactiveModel.model[X_AXIS_VISIBLE_RANGE_END] = end;
            globalReactiveModel.unlock();

            history.x = x;
            history.width = width;
        });

        activeWindows.push(activeWin);
        activeWin.draw(x, y, width, height, group);

        return this;
    };

    NavigatorImpl.prototype.drawXAxis = function (height) {
        var xAxis = this.xAxis,
            intervals = xAxis.getScaleObj().getIntervalObj().getConfig('intervals'),
            minor = intervals.minor,
            major = intervals.major,
            scale = xAxis.getScaleObj();

        xAxis._height = height = height || xAxis._height;

        scale.getIntervalObj().setConfig('showSingleTick', true);
        scale.getIntervalObj().setConfig('showSingleTickWithMajor', true);
        minor.tickLength = major.tickLength = height;
        minor.valuePadding = major.valuePadding = 3;
        minor.drawLabelBgRect = major.drawLabelBgRect = true;
        minor.labelBgColor = major.labelBgColor = '#ffffff';
        minor.labelBgOpacity = major.labelBgOpacity = 0.8;
        minor.intervalGraphicObj.filterAttr = major.intervalGraphicObj.filterAttr =
            function(type, attr) {
                if(type === 'label') {
                    attr['text-anchor'] = 'start';
                    attr.x = attr.x + 4;
                }
            };

        scale.setConfig('scaleGroup', this.createSVGGroups().axis);
        // @todo check scale object to see whether it is configured, if not call the configureXAxis internally
        this.canvasConfig.showAxes.x && xAxis.draw();

        return this;
    };

    NavigatorImpl.prototype.update = function (fn) {
        this
            .createAggregatedDataset()
            .updateYAxisLimit()
            .updateXAxisLimit(fn)
            .drawXAxis();
    };

    NavigatorImpl.prototype.setYAxisPos = function (x, y) {
        this.yAxis.setAxisPosition(x, y);
    };

    NavigatorImpl.prototype.configureXAxis = function (x, y, width) {
        var globalReactiveModel = this.globalReactiveModel,
            xAxis = this.xAxis;

        xAxis.setRange(globalReactiveModel.prop(X_AXIS_ABSOLUTE_RANGE_END),
            globalReactiveModel.prop(X_AXIS_ABSOLUTE_RANGE_START));

        xAxis.setAxisPosition(x, y);
        xAxis.setAxisLength(width);
        xAxis.getScaleObj().getIntervalObj().getNoOfTicksFilter = function(value) {
            return Math.ceil(value / 2);
        };
        return this;
    };

    NavigatorImpl.prototype.createAggregatedDataset = function () {
        var dataAggregator = this.dataAggregator,
            datasets = this.dataset,
            singleDS = datasets[0],
            data = [],
            dsSeriesMap = {},
            dataArr,
            aggregatedYAxisModel,
            aggregatedData,
            seriesId,
            ds,
            series,
            i,
            l;

        datasets.forEach(function (dataset) { dataset.forEachSeries(seriesFn); });

        function seriesFn (xAxisModel, yAxisModel, visibilityPointers, series) {
            var ds = this,
                id = series.getId();

            data.push({
                data: series.getOriginalMappedData(),
                seriesId: id
            });

            dsSeriesMap[id] = ds;
        }

        dataAggregator.setData({
            data: data,
            category: singleDS.getOriginalCategoryData(),
            maxPlotPoints: Math.floor(this.plotManager.getMaxPlotPoints())
        });

        aggregatedData = dataAggregator.getAggregatedData();
        dataArr = aggregatedData.data;
        this._aggregationRules = aggregatedData.rules;
        singleDS.category.setAggregatedMappedData(aggregatedData.category);

        for (i = 0, l = dataArr.length; i < l; i++) {
            aggregatedYAxisModel = dataArr[i].data;
            seriesId = dataArr[i].seriesId;
            ds = dsSeriesMap[seriesId];
            series = ds.getSeriesById(seriesId);
            series.setAggregatedMappedData(aggregatedYAxisModel);
        }

        return this;
    };

    NavigatorImpl.prototype.setLabelPosition = function (x, y) {
        var label = this.graphics.label;
        label.attr({
            x: x,
            y: y
        });
        this.canvas.applyStyle({
            label: this.canvasConfig.label.style
        }, {
            label: label
        });
        return this;
    };

    /*
     * Draw the navigator model
    */
    NavigatorImpl.prototype.draw = function (x, y, width, height, group) {
        var groups,
            parentGroup,
            bbox,
            labelHeight,
            canvas = this.canvas,
            measurement = this.measurement,
            canvasConfig = this.canvasConfig,
            scrollerConfig = canvasConfig.scroller,
            scrollHeight = scrollerConfig.scrollHeight,
            margin = scrollerConfig.margin,
            topMargin = margin.top,
            leftMargin = margin.left,
            rightMargin = margin.right,
            totMargin = leftMargin + rightMargin,
            graphics = this.graphics,
            label = graphics.label,
            labelConfig = canvasConfig.label,
            paper = graphics.paper,
            text = labelConfig.name,
            scrollWidth = mMax(5, scrollHeight),
            twiceScrollWidth = 2 * scrollWidth;
        x = x === undefined ? measurement.x : x;
        y = y === undefined ? measurement.y : y;
        width = width === undefined ? measurement.width : width;
        height = height === undefined ? measurement.height : height;
        parentGroup = group === undefined ? measurement.group : group;
        canvas.draw(x, y, width, height - scrollHeight - topMargin, parentGroup);
        groups = this.createSVGGroups(canvas.getSVGGroup(parentGroup));
        // normalise the scroll height
        scrollHeight = (scrollHeight > (0.2 * height)) ? (0.2 * height) : scrollHeight;
        // create a label if not existant.
        if (text && !graphics.label) {
            label = graphics.label = paper.text({
                text: text
            }, groups.labelGroup);
        }
        bbox = label.getBBox();
        labelHeight = bbox.height;

        groups.navPlots.attr({
            'clip-rect': [x + scrollWidth + leftMargin, y, width - twiceScrollWidth - totMargin,
                height - scrollHeight - topMargin - labelHeight]
        });

        // @todo check why the plot is moved a bit to the left
        this
            .configureXAxis(x + scrollWidth + leftMargin, y, width - twiceScrollWidth - totMargin,
                height - scrollHeight - topMargin - labelHeight)
            .configureYAxis(x + leftMargin, y, width - totMargin, height - scrollHeight - topMargin - labelHeight)
            .drawXAxis(height - scrollWidth - topMargin - labelHeight)
            .drawActiveWindow(x + scrollWidth + leftMargin, y, width - twiceScrollWidth - totMargin,
                height - scrollHeight - topMargin - labelHeight, groups.activeWin)
            .drawPlots(groups.plot)
            .drawScrollBar(x + leftMargin, y + height - scrollHeight - labelHeight, width - scrollHeight - totMargin,
                scrollHeight, groups.scrollerContainer)
            .setLabelPosition(x + width - bbox.width / 2, y + height - labelHeight/2)
            .initInteractivity(groups);
    };

    FusionCharts.registerComponent('main', 'navigator', NavigatorImpl);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-plot-manager-api', function () {
    var ManagerInterface = FusionCharts.getComponent('interface', 'manager'),
        allPlots = FusionCharts.getComponent('plot');

    function PlotManager () {
        ManagerInterface.apply(this, arguments);
        this.dataset = arguments[0];
        this.dependencies = arguments[1];
        this.plotInstances = {};

        this.svgElements = {
            group: undefined
        };
    }
    PlotManager.prototype = Object.create(ManagerInterface.prototype);

    PlotManager.prototype.getPlotClass = function (type) {
        return allPlots[type];
    };

    PlotManager.prototype.getPlotInstanceOf = function (type, args, series) {
        var PlotConstructor = this.getPlotClass(type),
            id = series.getId(),
            instance;

        args.unshift(PlotConstructor);
        if (!(instance = this.plotInstances[id])) {
            instance = this.plotInstances[id] = new (Function.prototype.bind.apply(PlotConstructor, args))();
            instance.manager = this;
        }

        instance.setJSONData(args[1]);
        instance.seriesId = series.getId();
        return instance;
    };

    PlotManager.prototype.createGroup = function (group) {
        var self = this,
            paper = self.dependencies.graphics.paper,
            svgElements = self.svgElements;

        if (!group) {
            group = svgElements.group || (svgElements.group = paper.group(self.plotType));
        } else {
            svgElements.group = group;
        }

        return group;
    };

    PlotManager.prototype.plot = function (group) {
        var self = this,
            dataset = self.dataset,
            dependencies = self.dependencies,
            instance;

        self.createGroup(group);

        dataset.forEachSeries(self.plotType, function (xAxisModel, yAxisModel, visibilityPointers, series) {
            instance = self.getPlotInstanceOf(self.plotType, [{
                x: xAxisModel,
                y: yAxisModel,
                visibilityPointers: visibilityPointers
            }, series.config.plot, {
                paper: dependencies.graphics.paper,
                xAxis: dependencies.xAxis,
                yAxis: dependencies.yAxis
            }], series);

            dataset.updatePlotInMap(series.getId(), instance);
            instance.draw(group);
        });
    };

    PlotManager.prototype.getInstancesByPlotType = function (type) {
        var self = this,
            plotInstances = self.plotInstances,
            instances = [],
            prop,
            instance;

        for (prop in plotInstances) {
            instance = plotInstances[prop];
            if (instance.plotType === type) {
                instances.push(instance);
            }
        }

        return instances;
    };

    PlotManager.prototype.getMaxPlotPoints = function (width) {
        return width / 2;
    };

    FusionCharts.registerComponent('manager', 'plotmanager', PlotManager);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-columnbase-manager-api', function () {
    var PlotManager = FusionCharts.getComponent('manager', 'plotmanager'),
        global = this,
        lib = global.hcLib,
        getMinConsecutiveDifference = lib.getMinConsecutiveDifference;

    function ColumnBaseManager () {
        PlotManager.apply(this, arguments);
    }

    ColumnBaseManager.prototype = Object.create(PlotManager.prototype);

    ColumnBaseManager.prototype.calculateColumnWidth = function () {
        var self = this,
            xAxis = self.dependencies.xAxis,
            scaleObj = xAxis.getScaleObj(),
            pvr = scaleObj.getPvr(),
            config = self.config,
            maxColWidth = config.maxColWidth,
            xAxisModel = self.dataset.getOriginalCategoryData(),
            minDiff = Infinity,
            minColWidth = config.minColWidth,
            catWidth,
            groupWidth,
            groupPadding,
            columnWidth;

        minDiff = getMinConsecutiveDifference(xAxisModel);

        catWidth = minDiff * pvr;
        groupPadding = catWidth * config.groupPadding;
        groupWidth = catWidth - (2 * groupPadding);

        config.groupPaddingInPixels = groupPadding;
        columnWidth = Math.min(Math.max(groupWidth, minColWidth), maxColWidth);
        return columnWidth;
    };

    ColumnBaseManager.prototype.getPlotSpace = function () {
        var self = this,
            config = self.config,
            columnWidth,
            strokeWidth = 2 * (config.style['stroke-width'] || 0);

        columnWidth = self.calculateColumnWidth();

        config.columnWidth = columnWidth;

        return (columnWidth + strokeWidth) / 2;
    };


    FusionCharts.registerComponent('manager', 'ColumnBaseManager', ColumnBaseManager);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-marker-manager-api', function () {
    var global = this,
        lib = global.hcLib,
        ManagerInterface = FusionCharts.getComponent('interface', 'manager'),
        ElementRecycle = FusionCharts.getComponent('api', 'elementrecycle'),
        AcylicPlotBand = FusionCharts.getComponent('api', 'acyclic-plot-band'),
        CyclicPlotBand = FusionCharts.getComponent('api', 'cyclic-plot-band'),
        CyclicTimeInstant = FusionCharts.getComponent('api', 'cyclic-time-instant'),
        AcyclicTimeInstant = FusionCharts.getComponent('api', 'acyclic-time-instant'),
        DateTimeFormatter = lib.DateTimeFormatter,
        BLANKSTRING = lib.BLANKSTRING;

    function MarkerManager () {
        ManagerInterface.apply(this, arguments);
    }

    MarkerManager.prototype = Object.create(ManagerInterface.prototype);

    MarkerManager.prototype.init = function (require) {
        var self = this,
            cInst;

        require(['xAxis', 'yAxis','graphics', 'chartInstance', 'dataset', 'dataInstance','canvasConfig',
            function (xAxis, yAxis, graphics, chartInstance, dataset, dataInstance, canvasConfig) {
                self.xAxis = xAxis;
                self.yAxis = yAxis;
                self.graphics = graphics;
                self.dataset = dataset;
                self.dataInstance = dataInstance;
                self.canvasConfig = canvasConfig;
                cInst = self.chartInstance = chartInstance;
                self.canvasConfig = canvasConfig;
            }
        ]);
        self.elementRecycle = new ElementRecycle();
        self.count = 0;
    };

    // @todo: Remove this function if not required.

    MarkerManager.prototype.doOverlap = function (cyclicEvents) {
        return function (point) {
            var i,
                len,
                cyclicEventObj,
                cyclx1,
                cyclx2,
                isOnRight,
                isOnLeft,
                flag = false,
                x1 = point.x1,
                x2 = point.x2;
            for (i = 0, len = cyclicEvents.length; i < len; i += 1) {
                cyclicEventObj = cyclicEvents[i];
                cyclx1 = cyclicEventObj.x1;
                cyclx2 = cyclicEventObj.x2;

                isOnRight = cyclx2 <= x2;
                isOnLeft = cyclx1 <= x1;

                if (x1 < cyclx1) {
                    if (x2 > cyclx1) {
                        flag = true;
                    }
                }
                else {
                    if (x1 < cyclx2) {
                        flag = true;
                    }
                }

                if (flag) {
                    return true;
                }
            }
        };
    };

    MarkerManager.prototype.drawPlotBands = function (res, options, key, markersConfig) {
        var self = this,
            height = options.height,
            label,
            elementRecycle = this.elementRecycle,
            instance,
            selfKey = self[key] || (self[key] = {}),
            textDrawn = selfKey.textDrawn,
            isAcyclic = key === 'acyclic',
            dependencyObj = {
                paper: self.graphics.paper,
                axes: {
                    x: self.xAxis,
                    y: self.yAxis
                },
                plot: {}
            },
            x1 = res.x1,
            x2 = res.x2,
            type = (x1 && x2) ? 'timeSpan' : 'timeInstant',
            isAlternate = self.isAlternate ? 'alternate' : 'regular',
            parentId = options.parentId + isAlternate,
            id = type + key + (parentId || ''),
            Constrctr,
            labelDrawn,
            typeObj,
            PlotBandConstr = isAcyclic ? AcylicPlotBand : CyclicPlotBand,
            flag = BLANKSTRING,
            bottomLabel = markersConfig.bottomLabel && markersConfig.bottomLabel.name || options.bottomLabel,
            config;
        if (instance = elementRecycle.getDrawnElements(id, x1)) {
            flag = self[type][key].count++;
        }
        else {
            // create an instance from the pool.
            if (!(instance = elementRecycle.getElementIfExist(id, x1))) {
                // if its a time Span.
                if (x1 && x2) {
                    instance = new PlotBandConstr(markersConfig, dependencyObj);
                }
                // if its an instant.
                else {
                    Constrctr = (isAcyclic ? AcyclicTimeInstant : CyclicTimeInstant);
                    instance = new Constrctr(markersConfig, dependencyObj);
                }
                elementRecycle.insertElement(id, x1, instance);
            }
            typeObj = instance.config[type];
            config = typeObj[isAlternate];

            instance._parentConfig = config;
            instance.config.index = options.index;
            // If alternate configurations doesnt have a text, take it as that of the regular.
            label = config.label.text || typeObj.regular.label.text;
            labelDrawn = instance.draw(res.x1, res.x2, self.canvas, {
                group: options.group(instance, config, id + 'container'),
                height: height,
                isAlternate: self.isAlternate,
                label: textDrawn ? BLANKSTRING : label,
                isVertical: options.isVertical,
                'stroke-dasharray': options['stroke-dasharray'],
                stroke: options.stroke,
                'stroke-width': options['stroke-width'],
                'background-color': options['background-color']
            });
            instance.drawLabel && instance.drawLabel((!isAcyclic && textDrawn) ? undefined : bottomLabel);
        }
        // todo: remove everytime blank string text creation.
        if (instance.addEvent) {
            textDrawn = instance.addEvent((!isAcyclic && textDrawn) ? undefined : label, id + flag);
        }
        else if (!isAcyclic && !textDrawn) {
            textDrawn = !!labelDrawn;
        }
        if (self.fixedDuration) {
            self.count += 1;
            if (self.count > 1) {
                this.setTextDrawn(selfKey, textDrawn);
            }
        }
        else {
            this.setTextDrawn(selfKey, textDrawn);
        }
        return res;
    };

    MarkerManager.prototype.setTextDrawn = function (selfKey, textDrawn) {
        if (!selfKey.textDrawn && textDrawn) {
            selfKey._textDrawn = textDrawn;
            selfKey.textDrawn = textDrawn;
        }
    };

    MarkerManager.prototype.getGroup = function (elem, id, instance, styleObj, pId) {
        var groups,
            elementRecycle = this.elementRecycle,
            paper = this.graphics.paper,
            groupObj = elementRecycle.getDrawnElements(pId, id);
        if (!groupObj && !(groupObj = elementRecycle.getElementIfExist(pId, id))) {
            groupObj = instance.getStubGroup(paper.group(this.parentGroup));
            elementRecycle.insertElement(pId, id, groupObj);
            instance.applyCSS((groups = groupObj.getGroups()), styleObj, id);
        }
        groups = groupObj.getGroups();
        instance.group = groups;
        return groups;
    };

    MarkerManager.prototype.dispose = function () {
        var i,
            len,
            graphics,
            self = this,
            graphicsArr = self.graphicsArr;

        for (i = 0, len = graphicsArr.length; i < len; i += 1) {
            graphics = graphicsArr[i];
            self.remove(graphics);
        }
    };

    MarkerManager.prototype.remove = function(obj) {
        var prop;
        for (prop in obj) {
            if (obj[prop]) {
                if (obj[prop].remove) {
                    obj[prop].remove();
                }
                else {
                    this.remove(obj[prop]);
                }
                obj[prop] = undefined;
            }
        }
    };

    MarkerManager.prototype.processTokens = function (axisMinArr, arr, wrapTimeLine, index) {
        var i,
            len,
            modifiedArr = axisMinArr.slice();
        if (index === undefined) {
            index = 0;
        }
        if (wrapTimeLine && modifiedArr[index]) {
            modifiedArr[index] -= 1;
        }
        for (i = 0, len = (arr || []).length; i < len; i += 2) {
            modifiedArr[arr[i + 1].index] = arr[i + 1].parser(arr[i]);
        }
        return modifiedArr;
    };

    MarkerManager.prototype.wrapTimeLine = function (startArr, endArr, index) {
        var joinTokens = this.joinTokens;
        if (startArr && endArr) {
            if (joinTokens(startArr) > joinTokens(endArr)) {
                startArr[index] -= 1;
            }
        }
    };

    MarkerManager.prototype.increment = function (drawFn, axisMax, index, startArr, endArr, label) {
        var joinTokens = this.joinTokens,
            axisMaxArr = [axisMax.getFullYear(), axisMax.getMonth(), axisMax.getDate(), axisMax.getHours(),
                axisMax.getMinutes(), axisMax.getSeconds()],
            count = 0,
            start,
            end;

        if (startArr[index + 1] > endArr && endArr[index + 1]) {
            startArr[index] -= 1;
        }
        while (startArr[index] <= axisMaxArr[index]) {
            // labels appear only once for the cyclic spans.
            // Normalise only in case of cyclic groups when one end(left or right side) is overflowing the canvas.
            this.wrapTimeLine(startArr, endArr, index);
            drawFn(start || startArr && joinTokens(startArr), end || endArr && joinTokens(endArr),
                label, count);
            count += 1;
            startArr[index] += 1;
            endArr && (endArr[index] += 1);
        }
    };

    MarkerManager.prototype.incrementFixedDuration = function (drawFn, axisMax, index, startArr, duration,
        label, step) {
        var self = this,
            joinTokens = self.joinTokens,
            count = 0,
            start,
            end,
            isAlternate = step === duration;
        if (isAlternate) {
            self.fixedDuration = true;
            self.count = 0;
        }
        start = start || startArr && joinTokens(startArr).getTime();
        axisMax = axisMax.getTime();
        while (start <= axisMax) {
            end = start + duration;
            if (isAlternate) {
                self.isAlternate = count % 2 ? false : true;
            }
            drawFn(start, end, label, index);
            count += 1;
            start += step;
        }
        delete self.isAlternate;
        delete self.fixedDuration;
        delete self.count;
    };

    MarkerManager.prototype.joinTokens = function (arr) {
        return new Date(arr[0], arr[1], arr[2], arr[3], arr[4], arr[5]);
    };

    MarkerManager.prototype.getMajorTickLevel = function () {
        var refObj = {
                'year': 0,
                'month': 1,
                'day': 2,
                'hour': 3,
                'minute': 4,
                'second': 5
            },
            interValObj = this.xAxis.getScaleObj().getIntervalObj().getConfig('intervals');
        return refObj[interValObj.major.timeUnit.name || interValObj.minor.timeUnit.name];
    };

    MarkerManager.prototype.normalise = function (axisMax, axisMin, start, end) {
        if (start < axisMin) {
            start = axisMin;
        }
        else if (start > axisMax) {
            return false;
        }
        if (end > axisMax) {
            end = axisMax;
        }
        if (end < start) {
            return false;
        }
        return {
            x1: start,
            x2: end
        };
    };

    //@ todo: Once the configurations hardcodedness is removed, drawCyclicGroups & drawAcyclicGroups should be merged.

    MarkerManager.prototype.drawCyclicGroups = function (elem, id) {
        var self = this,
            majorTick = self.getMajorTickLevel(),
            bottomLabel,
            getTokenFormalNames = DateTimeFormatter.getTokenFormalNames(),
            drawFn = function (start, end, label, index) {
                var coordinates;
                if (coordinates = self.normalise(axisMax, axisMin, start, end)) {
                    self.drawPlotBands(coordinates, {
                        parentId: id,
                        index: index,
                        group: group,
                        label: label,
                        bottomLabel: bottomLabel,
                        isVertical: true,
                        'stroke-dasharray': strokeDashArray,
                        stroke: stroke,
                        'stroke-width': strokeWidth,
                        'background-color': bgColor
                    }, 'cyclic', elem);
                }
            },
            xAxis = self.xAxis,
            scaleObj = xAxis.getScaleObj().getVisibleRange(),
            axisMax = new Date(scaleObj.max),
            axisMin = new Date(scaleObj.min),
            arr = [],
            axisMinArr = [axisMin.getFullYear(), axisMin.getMonth(), axisMin.getDate(), axisMin.getHours(),
                axisMin.getMinutes(), axisMin.getSeconds()],


            // @ temp hardcoded
            strokeWidth = 1,
            strokeDashArray = 5,
            stroke = '#ff0000',
            bgColor = '#ff0000',

            group = function (instance, styleObj, pId) {
                return self.getGroup(elem, id, instance, styleObj, pId);
            },
            duration,
            startArr,
            level,
            endArr;
        if ((level = elem.level(getTokenFormalNames)) === majorTick) {
            arr = elem.start(getTokenFormalNames);
            duration = elem.duration;
            bottomLabel = this.getBottomLabel(arr, majorTick, true);
            startArr = elem.start && self.processTokens(axisMinArr, arr, !!duration, level);
            endArr = elem.end && self.processTokens(axisMinArr, elem.end(getTokenFormalNames));
            if (duration) {
                self.incrementFixedDuration(drawFn, axisMax, level, startArr, self.getDurationMilli(duration(),
                    level + 1, axisMinArr, axisMin), elem.label && elem.label.name,
                    self.getDurationMilli(elem.step(), level + 1, axisMinArr, axisMin));
            }
            else {
                self.increment(drawFn, axisMax, level, startArr, endArr, elem.label && elem.label.name, axisMin);
            }
        }
    };

    /*
     * Converts the duration to milliseconds.
    */
    MarkerManager.prototype.getDurationMilli = function (duration, index, axisMinArr) {
        var res = 0,
            arr = axisMinArr.slice(),
            arr1 = axisMinArr.slice();
        if (arr[index] !== undefined) {
            arr1[index] = 0;
            arr[index] = duration;
            res = this.joinTokens(arr) - this.joinTokens(arr1);
        }
        return res;
    };

    MarkerManager.prototype.textSanitizer = function (val) {
        return val ? val + ' ' : BLANKSTRING;
    };

    MarkerManager.prototype.getBottomLabel = function (arr, majorTick, isCyclic) {
        var textSanitizer = this.textSanitizer;
        if (isCyclic) {
            return textSanitizer(arr[majorTick]) + textSanitizer(arr[majorTick + 2]) +
                textSanitizer(arr[majorTick + 4]);
        }
        else {
            return textSanitizer(arr[majorTick + 4]) + textSanitizer(arr[majorTick + 2]) +
                textSanitizer(arr[majorTick]);
        }
    };

    // @ todo: Once the configurations hardcodedness is removed, drawCyclicGroups & drawAcyclicGroups should be merged.

    MarkerManager.prototype.drawAcyclicGroups = function (elem, id, cyclicEventsLen) {
        var self = this,
            majorTick = self.getMajorTickLevel(),
            getTokenFormalNames = DateTimeFormatter.getTokenFormalNames(),
            xAxis = self.xAxis,
            scaleObj = xAxis.getScaleObj().getVisibleRange(),
            axisMax = new Date(scaleObj.max),
            axisMin = new Date(scaleObj.min),
            axisMinArr = [axisMin.getFullYear(), axisMin.getMonth(), axisMin.getDate(), axisMin.getHours(),
                axisMin.getMinutes(), axisMin.getSeconds()],
            joinTokens = self.joinTokens,
            arr = [],
            bottomLabel,



            // @ temp hardcoded
            strokeWidth = 1,
            strokeDashArray = 5,
            stroke = '#ff0000',
            bgColor = '#ffffff',

            offset = 20,
            group = function (instance, styleObj, pId) {
                return self.getGroup(elem, id, instance, styleObj, pId);
            },

            obj,
            level,
            startArr,
            endArr,
            res,
            label;

        if ((level = elem.level(getTokenFormalNames)) === majorTick) {
            startArr = elem.start && self.processTokens(axisMinArr, (arr = elem.start(getTokenFormalNames)));
            endArr = elem.end && self.processTokens(axisMinArr, elem.end(getTokenFormalNames));
            bottomLabel = this.getBottomLabel(arr, majorTick);
            this.wrapTimeLine(startArr, endArr, level);
            if (res = self.normalise(axisMax, axisMin, startArr && joinTokens(startArr, axisMax, axisMin),
                endArr && joinTokens(endArr, axisMax, axisMin))){
                label = elem.label && elem.label.name;
                if (cyclicEventsLen) {
                    obj = self.drawPlotBands(res, {
                        parentId: id,
                        index: 0,
                        group: group,
                        bottomLabel: bottomLabel,
                        isVertical: true,
                        'stroke-dasharray': strokeDashArray,
                        stroke: stroke,
                        'stroke-width': strokeWidth,
                        'background-color': bgColor,
                        label: label,
                        height: offset
                    }, 'acyclic', elem);
                }
                else {
                    obj = self.drawPlotBands(res, {
                        parentId: id,
                        index: 0,
                        group: group,
                        bottomLabel: bottomLabel,
                        isVertical: true,
                        'stroke-dasharray': strokeDashArray,
                        stroke: stroke,
                        'stroke-width': strokeWidth,
                        'background-color': bgColor,
                        label: label
                    }, 'acyclic', elem);
                }
            }
        }
    };


    MarkerManager.prototype.plot = function (canvas) {
        var canvasConfig = this.canvasConfig,
            markers = canvasConfig.markers || {},
            graphicsArr = this.graphicsArr,
            group = markers.group,
            paper = this.graphics.paper,
            cyclic,
            style,
            cyclicLen,
            cls,
            j,
            acyclic,
            acyclicLen;

        if (canvas) {
            this.canvas = canvas;
        }
        // create a group for the navigation bar inside the canvas containing group.
        if (!this.parentGroup) {
            this.parentGroup = paper.group(canvas.group)
            .attr({
                class: cls = group.className
            });
            style = canvas.parseStyle(group.style).body;
            paper.cssAddRule('.' + cls, style);
        }

        if (!graphicsArr) {
            graphicsArr = this.graphicsArr = [];
        }
        if (!this.acyclic) {
            this.acyclic = {};
        }
        if (!this.cyclic) {
            this.cyclic = {};
        }

        if (!this.span) {
            this.span = {
                cyclic: {
                    count: 0
                },
                acyclic: {
                    count: 0
                }
            };
        }

        if (!this.instant) {
            this.instant = {
                cyclic: {
                    count: 0
                },
                acyclic: {
                    count: 0
                }
            };
        }
        this.instant.cyclic.count = 0;
        this.instant.acyclic.count = 0;
        this.span.cyclic.count = 0;
        this.span.acyclic.count = 0;

        if (this.cyclic.textDrawn) {
            this.cyclic._textDrawn = this.cyclic.textDrawn;
        }

        if (this.acyclic.textDrawn) {
            this.acyclic._textDrawn = this.acyclic.textDrawn;
        }
        this.elementRecycle.preProcessor();

        for (j = 0, cyclic = markers.cyclic, cyclicLen = cyclic && cyclic.length; j < cyclicLen; j += 1) {
            this.cyclic.textDrawn = false;
            this.drawCyclicGroups(cyclic[j], j);
        }

        for (j = 0, acyclic = markers.acyclic, acyclicLen = acyclic && acyclic.length; j < acyclicLen; j += 1) {
            this.acyclic.textDrawn = false;
            this.drawAcyclicGroups(acyclic[j], j, cyclicLen);
        }
        this.elementRecycle.postProcessor();
    };

    FusionCharts.registerComponent('manager', 'markermanager', MarkerManager);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-column-manager-api', function () {
    var ColumnBaseManager = FusionCharts.getComponent('manager', 'columnbasemanager');

    function ColumnManager () {
        this.config = this.getDefaultConfig();
        ColumnBaseManager.apply(this, arguments);
        this.plotType = 'column';
    }

    ColumnManager.prototype = Object.create(ColumnBaseManager.prototype);

    ColumnManager.prototype.getDefaultConfig = function () {
        return  {
            stacked: true,
            groupPadding: 0.1,
            maxColWidth: 50,
            minColWidth: 5,
            style: {
                'stroke-width': 1
            }
        };
    };

    ColumnManager.prototype.plot = function (group) {
        var self = this,
            dataset = self.dataset,
            dependencies = self.dependencies,
            impl = dependencies.impl,
            rules = impl._aggregationRules,
            xAxis = dependencies.xAxis,
            pvr = xAxis.getScaleObj().getPvr(),
            config = self.config,
            groupPadding = config.groupPadding,
            instance,
            padding,
            groupWidth;

        self.createGroup(group);

        if (rules) {
            groupWidth = Math.floor(rules.span * pvr);
            padding = groupWidth * 2 * groupPadding;
            config.columnWidth = groupWidth - padding;
        }
        else {
            config.columnWidth = self.calculateColumnWidth();
        }

        dataset.calculateStackedValues(self.plotType);

        dataset.forEachSeries('column', function (xAxisModel, yAxisModel, visibilityPointer, series) {
            if (series.active) {
                instance = self.getPlotInstanceOf(self.plotType, [{
                    x: xAxisModel,
                    y: series.stackedData,
                    visibilityPointers: visibilityPointer
                }, series.config.plot, {
                    paper: dependencies.graphics.paper,
                    xAxis: dependencies.xAxis,
                    yAxis: dependencies.yAxis
                }], series);

                dataset.updatePlotInMap(series.getId(), instance);
                instance.show();
                instance.draw(group);
            }
            else {
                instance = self.getPlotInstanceOf(self.plotType, [], series);
                instance.hide();
            }
        });
    };

    ColumnManager.prototype.getMaxPlotPoints = function (width) {
        var manager = this,
            config = manager.config,
            columnWidth = manager.calculateColumnWidth(),
            groupPaddingInPixels = config.groupPaddingInPixels,
            maxPlotPoints;

        maxPlotPoints = (width / (columnWidth + 2 * groupPaddingInPixels));
        return maxPlotPoints;
    };

    FusionCharts.registerComponent('manager', 'ColumnManager', ColumnManager);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-legend-impl', function () {
    var ComponentInterface = FusionCharts.getComponent('interface', 'component'),
        Legend = FusionCharts.getComponent('api', 'legend'),
        FOCUSED_SERIES = 'focused-series',
        VISIBLE_SERIES = 'visible-series',
        HIDDEN_SERIES = 'hidden-series';


    function LegendImpl () {
        ComponentInterface.apply(this, arguments);
        this.svgElems = {};
        this.measurement = {};
    }

    LegendImpl.prototype = Object.create(ComponentInterface.prototype);

    LegendImpl.prototype.constructor = LegendImpl;

    LegendImpl.prototype.init = function (require) {
        var self = this,
            spaceManagerInstance,
            relativeParent,
            data,
            style,
            cls,
            svgElems = this.svgElems,
            paper;

        require([
            'chart',
            'graphics',
            'dataset',
            'PlotManager',
            'spaceManagerInstance',
            'smartLabel',
            'reactiveModel',
            'canvasGroupIndex',
            'dataInstance',
            'parentGroup',
            function (
                chart,
                graphics,
                dataset,
                plotManager,
                spaceManagerInstance,
                smartLabel,
                reactiveModel,
                canvasGroupIndex,
                dataInstance,
                parentGroup) {
                self.chart = chart;
                self.dataset = dataset;
                self.plotManager = plotManager;
                self.graphics = graphics;
                self.spaceManagerInstance = spaceManagerInstance;
                self.smartLabel = smartLabel,
                self.reactiveModel = reactiveModel;
                self.canvasGroupIndex = canvasGroupIndex;
                self.dataInstance = dataInstance;
                self.parentGroup = parentGroup;
            }
        ]);

        data = self.dataInstance.legend[0];
        paper = self.graphics.paper;
        spaceManagerInstance = self.spaceManagerInstance;

        // Creates the parent group for caption and subcaption
        relativeParent = svgElems.group = paper.group(self.parentGroup)
            .attr({'class': cls = data.group.className});

        // If style is mentioned from the input data create a stylesheet for the same
        (style = data.group.style) && paper.cssAddRule('.' + cls, style);

        self.legend = new Legend(self.dataInstance.legend[0], {
            chart: self.chart,
            dataset: self.dataset,
            plotManager: self.plotManager,
            graphics: self.graphics,
            smartLabel: self.smartLabel,
            parentGroup: relativeParent
        });
    };

    LegendImpl.prototype.manageSpace = function () {
        var self = this,
            legendInstance = self.legend,
            config = legendInstance.config;

        self.spaceManagerInstance.add([{
            name: function () {
                return 'Legend';
            },
            preDrawHook: legendInstance.config.preDrawHook,
            ref: function(obj) {
                return obj['0'];
            },
            self: function () {
                return self;
            },
            priority: function () {
                return 2;
            },
            layout: config.layout,
            orientation: [{
                type: config.orientation,
                position: [{
                    type: config.position,
                    alignment: [{
                        type: config.alignment,
                        dimensions: [function() {
                            var parent = this.getParentComponentGroup();
                            return legendInstance.getLogicalSpace(parent.getWidth(), parent.getHeight());
                        }]
                    }]
                }]
            }]
        }]);
    };

    LegendImpl.prototype.setDrawingConfiguration = function (x, y, width, height, group) {
        var mes = this.measurement;
        mes.x = x;
        mes.y = y;
        mes.width = width;
        mes.height = height;

        this.parentGroup = group;

        return this;
    };

    LegendImpl.prototype.onHover = function (seriesInstance) {
        this.reactiveModel.prop(FOCUSED_SERIES, [seriesInstance]);
    };

    LegendImpl.prototype.onHoverOut = function () {
        this.reactiveModel.prop(FOCUSED_SERIES, undefined);
    };

    LegendImpl.prototype.onClick = function (seriesInstance, switchOff) {
        var reactiveModel = this.reactiveModel,
            visibleSeries = reactiveModel.prop(VISIBLE_SERIES),
            hiddenSeries = reactiveModel.prop(HIDDEN_SERIES),
            i;

        if (switchOff) {
            // Take the instance from the visible series and put it in the hidden series as the switch of mode is on
            i = visibleSeries.indexOf(seriesInstance);
            visibleSeries.splice(i, 1);
            hiddenSeries.push(seriesInstance);
        } else {
            // Take the instance from the hidden series and put it in the hidden series as the switch of mode is off
            i = hiddenSeries.indexOf(seriesInstance);
            hiddenSeries.splice(i, 1);
            visibleSeries.push(seriesInstance);
        }

        reactiveModel.lock();
        reactiveModel.prop(VISIBLE_SERIES, visibleSeries);
        reactiveModel.prop(HIDDEN_SERIES, hiddenSeries);
        reactiveModel.unlock();
    };

    LegendImpl.prototype.getDefaultGroup = function () {
        return this.svgElems.group;
    };

    /*
     * Draw the navigator model
    */
    LegendImpl.prototype.draw = function (x, y, width, height, group) {
        var measurement = this.measurement;

        x = x === undefined ? measurement.x : x;
        y = y === undefined ? measurement.y : y;
        width = width === undefined ? measurement.width : width;
        height = height === undefined ? measurement.height : height;
        group = group === undefined ? this.parentGroup : group;
        if (y !== undefined) {
            this.legend.draw(x, y, group, {
                hover: [this.onHover.bind(this), this.onHoverOut.bind(this)],
                click: this.onClick.bind(this)
            });
        }
    };

    FusionCharts.registerComponent('main', 'Legend', LegendImpl);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-line-manager-api', function () {
    var PlotManager = FusionCharts.getComponent('manager', 'plotmanager');

    function LineManager () {
        this.config = {};
        PlotManager.apply(this, arguments);
        this.plotType = 'line';
    }

    LineManager.prototype = Object.create(PlotManager.prototype);

    FusionCharts.registerComponent('manager', 'linemanager', LineManager);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-area-manager-api', function () {
    var PlotManager = FusionCharts.getComponent('manager', 'plotmanager');

    function AreaManager () {
        this.config = {};
        PlotManager.apply(this, arguments);
        this.plotType = 'area';
    }

    AreaManager.prototype = Object.create(PlotManager.prototype);

    FusionCharts.registerComponent('manager', 'AreaManager', AreaManager);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-multidatasetplot-manager-api', function () {
    var PlotManager = FusionCharts.getComponent('manager', 'PlotManager'),
        defaultPlotType = 'line';

    function MultiDSPlotManager () {
        PlotManager.apply(this, arguments);
    }

    MultiDSPlotManager.prototype = Object.create(PlotManager.prototype);

    MultiDSPlotManager.prototype.plot = function (group) {
        var self = this,
            dataset = self.dataset,
            dependencies = self.dependencies,
            seriesFn = function (xAxisModel, yAxisModel, visibilityPointer, series) {
                var category = this.category,
                    itemStyle = series.getItemStyle();

                // styleObj = replaceFillByStroke(style);

                self.getPlotInstanceOf(defaultPlotType, [{
                    x: category.getAggregatedMappedData(),
                    y: series.getAggregatedMappedData()
                }, {
                    style: {
                        stroke: itemStyle.fill,
                        'stroke-opacity': itemStyle['fill-opacity']
                    }
                }, {
                    paper: dependencies.graphics.paper,
                    xAxis: dependencies.xAxis,
                    yAxis: dependencies.yAxis
                }, self], series).draw(group);
            },
            ds;

        for (ds in dataset) {
            dataset[ds].forEachSeries(seriesFn, true);
        }
    };

    FusionCharts.registerComponent('manager', 'MultiDSPlotManager', MultiDSPlotManager);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-candlestick-manager-api', function () {
    var ColumnBaseManager = FusionCharts.getComponent('manager', 'ColumnBaseManager');



    function CandlestickManager () {
        this.config = this.getDefaultConfig();
        ColumnBaseManager.apply(this, arguments);
        this.plotType = 'candlestick';
    }



    CandlestickManager.prototype = Object.create(ColumnBaseManager.prototype);

    CandlestickManager.prototype.getDefaultConfig = function () {
        return {
            groupPadding: 0.1,
            maxColWidth: 50,
            minColWidth: 5,
            style: {
                'stroke-width': 1
            }
        };
    };

    CandlestickManager.prototype.plot = function (group) {
        var self = this,
            dataset = self.dataset,
            dependencies = self.dependencies,
            rules = dependencies.impl._aggregationRules,
            config = self.config,
            xAxis = dependencies.xAxis,
            groupPadding = config.groupPadding,
            pvr = xAxis.getScaleObj().getPvr(),
            instance,
            groupWidth,
            padding,
            strokeWidth = self.config.style['stroke-width'];

        if (rules) {
            groupWidth = Math.floor(rules.span * pvr);
            padding = groupPadding * 2 * groupWidth;
            config.columnWidth = groupWidth - padding;
        }
        else {
            config.columnWidth = self.calculateColumnWidth();
        }

        self.createGroup(group);

        dataset.forEachSeries('candlestick', function (xAxisModel, yAxisModel, visibilityPointers, series) {
            instance = self.getPlotInstanceOf(self.plotType, [{
                x: xAxisModel,
                y: yAxisModel,
                visibilityPointers: visibilityPointers
            }, {
                bear: {
                    style: {
                        'stroke-width': strokeWidth
                    }
                },
                bull: {
                    style: {
                        'stroke-width': strokeWidth
                    }
                }
            }, {
                paper: dependencies.graphics.paper,
                xAxis: dependencies.xAxis,
                yAxis: dependencies.yAxis
            }], series);

            dataset.updatePlotInMap(series.getId(), instance);

            instance.draw(group);
        });
    };

    CandlestickManager.prototype.getMaxPlotPoints = function (width) {
        var manager = this,
            config = manager.config,
            columnWidth = manager.calculateColumnWidth(),
            groupPaddingInPixels = config.groupPaddingInPixels,
            maxPlotPoints;

        maxPlotPoints = (width / (columnWidth + 2 * groupPaddingInPixels));

        return maxPlotPoints;
    };

    FusionCharts.registerComponent('manager', 'CandlestickManager', CandlestickManager);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-plot-manager-factory-api', function () {
    var win = this.window,
        M = win.Math,
        ManagerInterface = FusionCharts.getComponent('interface', 'manager'),
        managers = FusionCharts.getComponent('manager'),
        NavigatorImpl = FusionCharts.getComponent('main', 'navigator'),
        defaultPlotType = 'line',
        defaultPlotManager = 'plotmanager',
        lib = this.hcLib,
        getMinConsecutiveDifference = lib.getMinConsecutiveDifference;

    function PlotManagerFactory () {
        ManagerInterface.apply(this, arguments);

        this.plotManagers = {};
    }

    PlotManagerFactory.prototype = Object.create(ManagerInterface.prototype);

    PlotManagerFactory.prototype.init = function (require) {
        var self = this,
            cInst,
            caller;

        require(['xAxis', 'yAxis','graphics', 'chartInstance', 'dataset', 'impl',
            function (xAxis, yAxis, graphics, chartInstance, dataset, impl) {
                self.xAxis = xAxis;
                self.yAxis = yAxis;
                self.graphics = graphics;
                self.dataset = dataset;
                cInst = self.chartInstance = chartInstance;
                caller = self.impl = impl;
            }
        ]);


        self.defPlotType = cInst.args.plottype || defaultPlotType;
        self.createManagerInstancesByCaller(caller);
    };

    PlotManagerFactory.prototype.getPlotManagerClass = function (type) {
        return managers[type + 'manager'] || managers[defaultPlotManager];
    };

    PlotManagerFactory.prototype.getInstanceOfManager = function (type, args) {
        var ManagerConstructor = this.getPlotManagerClass(type),
            instance;

        args.unshift(ManagerConstructor);
        this.plotManagers[type] = (instance = new (Function.prototype.bind.apply(ManagerConstructor, args))());
        instance.managerFactory = this;
        return instance;
    };

    PlotManagerFactory.prototype.createManagerInstancesByCaller = function (caller) {
        var self = this;
        if (caller instanceof NavigatorImpl) {
            self.getInstanceOfManager('multidsplot', [self.dataset, {
                    xAxis: self.xAxis,
                    yAxis: self.yAxis,
                    graphics: self.graphics
                }]);

        } else {
            return this.createManagerInstances();
        }
    };

    PlotManagerFactory.prototype.createManagerInstances = function () {
        var self = this,
            dataset = self.dataset,
            plotTypes,
            type;

        plotTypes = dataset.getAllPlotTypes();

        for (type in plotTypes) {
            self.getInstanceOfManager(type, [dataset, {
                xAxis: self.xAxis,
                yAxis: self.yAxis,
                graphics: self.graphics,
                impl: self.impl
            }]);
        }
    };

    PlotManagerFactory.prototype.plot = function (group) {
        var self = this,
            plotManagers = self.plotManagers,
            i,
            manager;

        for (i in plotManagers) {
            manager = plotManagers[i];
            manager.plot(group);
        }
    };

    PlotManagerFactory.prototype.getAxisOffset = function () {
        var plotManagers = this.plotManagers,
            i,
            maxSpace = 0,
            manager;

        for (i in plotManagers) {
            manager = plotManagers[i];
            maxSpace = Math.max(maxSpace, manager.getPlotSpace && manager.getPlotSpace() || 0);
        }

        return maxSpace;
    };

    PlotManagerFactory.prototype.getInstancesByPlotType = function (type) {
        var self = this,
            managers = self.plotManagers,
            instances = [],
            i;

        for (i in managers) {
            instances = instances.concat(managers[i].getInstancesByPlotType(type));
        }

        return instances;
    };

    PlotManagerFactory.prototype.fadeAllExcept = function (instances) {
        var self = this,
            managers = self.plotManagers,
            manager,
            plotInstance,
            plotInstances,
            p,
            type;

        for (type in managers) {
            manager = managers[type];
            plotInstances = manager.getInstancesByPlotType(type);

            for (p in plotInstances) {
                plotInstance = plotInstances[p];
                if (instances.indexOf(plotInstance) === -1) {
                    plotInstance.fade();
                }
            }
        }
    };

    PlotManagerFactory.prototype.unfadeAll = function () {
        var self = this,
            managers = self.plotManagers,
            manager,
            plotInstance,
            instances,
            p,
            type;

        for (type in managers) {
            manager = managers[type];
            instances = manager.getInstancesByPlotType(type);

            for (p in instances) {
                plotInstance = instances[p];
                plotInstance.unfade();
            }
        }
    };

    PlotManagerFactory.prototype.manageVisibility = function (visibleArr, hideArr) {
        var self = this,
            plotManagers = self.plotManagers,
            reDrawNeededPlotTypes = ['column'],
            instance,
            i,
            prop,
            manager,
            ln;

        for (i = 0, ln = visibleArr.length; i < ln; i++) {
            instance = visibleArr[i];

            if (reDrawNeededPlotTypes.indexOf(instance.plotType) === -1) {
                instance.show();
            }
        }

        for (i = 0, ln = hideArr.length; i < ln; i++) {
            instance = hideArr[i];
            if (reDrawNeededPlotTypes.indexOf(instance.plotType) === -1) {
                instance.hide();
            }
        }

        for (prop in plotManagers) {
            manager = plotManagers[prop];
            if (reDrawNeededPlotTypes.indexOf(manager.plotType) !== -1) {
                manager.plot();
            }
        }

    };

    PlotManagerFactory.prototype.getMaxPlotPoints = function () {
        var plotManagers = this.plotManagers,
            xAxis = this.xAxis,
            length = xAxis.getScaleObj().getConfig('length'),
            allMaxs = [],
            managerType,
            manager;

        for (managerType in plotManagers) {
            manager = plotManagers[managerType];
            allMaxs.push(manager.getMaxPlotPoints(length));
        }

        return M.min.apply(M, allMaxs);
    };

    PlotManagerFactory.prototype.getMinPlotPoints = function () {
        var xAxis = this.xAxis,
            scaleObj = xAxis.getScaleObj(),
            length = scaleObj.getConfig('length'),
            pvr = xAxis.getScaleObj().getPvr(),
            minMinorTickDiff,
            intervalPoints = scaleObj.getIntervalObj().getConfig('intervals').minor.intervalPoints;

        minMinorTickDiff = pvr * getMinConsecutiveDifference(intervalPoints);
        return Math.floor(length / minMinorTickDiff);
    };


    FusionCharts.registerComponent('managerfactory', 'plotmanagerfactory', PlotManagerFactory);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-caption-api', function () {
    var global = this,
        lib = global.hcLib,
        getSmartComputedStyle = lib.getSmartComputedStyle,
        mergeRecursive = lib.mergeRecursive,
        BLANKSTRING = '',
        DOT = '.';

    function Caption (config, dependencies) {
        this.config = {};
        this.graphics = {};
        this.dependencies = dependencies;

        config && this.setConfig(config);
    }

    Caption.prototype.setConfig = function (config) {
        mergeRecursive(this.config, config);
        return this;
    };

    Caption.prototype.draw = function (x, y, width, height, group) {
        var config = this.config,
            title = config.title,
            subtitle = config.subtitle,
            titleText = title.text,
            dependencies = this.dependencies,
            paper = dependencies.graphics.paper,
            interpadding = config.interPaddingPixels,
            padding = config.paddingPixels,
            titleConfig = this.titleConfig,
            graphics = this.graphics,
            caption,
            subcaption;

        group = group || dependencies.parentGroup;

        if (!isFinite(x) || !isFinite(y)) {
            return;
        }

        if (!caption) {
            caption = graphics.caption = paper.text(group, true);
        }

        caption.attr({
            x: x + width / 2 - titleConfig.width / 2,
            y: y + padding,
            text: titleText || BLANKSTRING,
            class: title.className,
            'vertical-align': 'top',
            'text-anchor': 'start'
        });

        subcaption = graphics.subcaption;

        if (!subcaption) {
            subcaption = graphics.subcaption = paper.text(group, true);
        }

        subcaption.attr({
            x: x + width / 2,
            y: y + padding + titleConfig.height + interpadding,
            text: this.subtitleConfig.text || BLANKSTRING,
            class: subtitle.className,
            'vertical-align': 'top',
            'text-anchor': 'middle'
        });
    };

    Caption.prototype.getLogicalSpace = function (width, height) {
        var config = this.config,
            title = config.title,
            subtitle = config.subtitle,
            titleText = title.text,
            subtitleText = subtitle.text,
            dependencies = this.dependencies,
            smartLabel = dependencies.smartLabel,
            paper = dependencies.graphics.paper,
            // padding = config.padding = config.padding / 100,
            padding = 0,
            interpadding = config.interpadding = config.interpadding / 100,
            textSpacePercent = 1 - (padding + interpadding),
            maxTitleHeight = 0.6 * textSpacePercent * height,
            maxTitleWidth = 0.6 * textSpacePercent * width,
            maxSubTitleWidth = 0.4 * textSpacePercent * width,
            maxSubTitleHeight = 0.4 * textSpacePercent * height,
            smartText,
            titleConfig,
            subtitleConfig,
            textDim,
            subTextDim,
            style;

        smartLabel.useEllipsesOnOverflow(1);

        paper.cssAddRule(DOT + title.className, title.style);
        style = getSmartComputedStyle(dependencies.parentGroup, title.className, paper);
        smartLabel.setStyle(style);

        textDim = smartLabel.getOriSize(titleText || BLANKSTRING);

        titleConfig = this.titleConfig = {
            text: titleText,
            width: textDim.width,
            height: textDim.height
        };

        if (textDim.width > maxTitleWidth || textDim.height > maxTitleHeight) {
            smartText = smartLabel.getSmartText(titleText, maxTitleWidth, maxTitleHeight);
            titleConfig.text = smartText.text;
            titleConfig.width = smartText.width;
            titleConfig.height = smartText.height;
        }


        paper.cssAddRule(DOT + subtitle.className, subtitle.style);
        style = getSmartComputedStyle(dependencies.parentGroup, subtitle.className, paper);
        smartLabel.setStyle(style);

        subTextDim = smartLabel.getOriSize(subtitleText || BLANKSTRING);

        subtitleConfig = this.subtitleConfig = {
            text: subtitleText,
            width: subTextDim.width,
            height: subTextDim.height
        };

        if (subTextDim.width > maxSubTitleWidth || subTextDim.height > maxSubTitleHeight) {
            smartText = smartLabel.getSmartText(subtitleText, maxSubTitleWidth, maxSubTitleHeight);
            subtitleConfig.text = smartText.text;
            subtitleConfig.width = smartText.width;
            subtitleConfig.height = smartText.height;
        }

        width = Math.max(titleConfig.width, subtitleConfig.width);

        height = titleConfig.height + subtitleConfig.height;
        config.interPaddingPixels = interpadding * height;
        config.paddingPixels = padding * height;

        return {
            width: width,
            height: height + 2 * config.paddingPixels + config.interPaddingPixels
        };
    };

    FusionCharts.registerComponent('api', 'Caption', Caption);
}]);

FusionCharts.register('module', ['private', 'modules.components.timeseries-caption-impl', function () {
    var ComponentInterface = FusionCharts.getComponent('interface', 'component'),
        Caption = FusionCharts.getComponent('api', 'Caption');


    function CaptionImpl () {
        ComponentInterface.apply(this, arguments);
        this.measurement = {};
        this.svgElements = {};
    }

    CaptionImpl.prototype = Object.create(ComponentInterface.prototype);

    CaptionImpl.prototype.constructor = CaptionImpl;

    CaptionImpl.prototype.init = function (require) {
        var self = this,
            svgElems = self.svgElements,
            paper,
            data,
            cls,
            style,
            relativeParent;

        require([
            'chart',
            'graphics',
            'dataset',
            'PlotManager',
            'spaceManagerInstance',
            'smartLabel',
            'reactiveModel',
            'canvasGroupIndex',
            'dataInstance',
            'parentGroup',
            function (
                chart,
                graphics,
                dataset,
                plotManager,
                spaceManagerInstance,
                smartLabel,
                reactiveModel,
                canvasGroupIndex,
                dataInstance,
                parentGroup) {
                self.chart = chart;
                self.graphics = graphics;
                self.spaceManagerInstance = spaceManagerInstance;
                self.smartLabel = smartLabel;
                self.canvasGroupIndex = canvasGroupIndex;
                data = self.data = dataInstance.caption[0];
                self.parentGroup = parentGroup;
            }
        ]);

        paper = self.graphics.paper;
        // Creates the parent group for caption and subcaption
        relativeParent = svgElems.group = paper.group(self.parentGroup)
            .attr({'class': cls = data.group.className});

        // If style is mentioned from the input data create a stylesheet for the same
        (style = data.group.style) && paper.cssAddRule('.' + cls, style);

        self.caption = new Caption(data, {
            chart: self.chart,
            graphics: self.graphics,
            smartLabel: self.smartLabel,
            parentGroup: relativeParent
        });
    };

    CaptionImpl.prototype.getDefaultGroup = function () {
        return this.svgElements.group;
    };

    CaptionImpl.prototype.manageSpace = function () {
        var self = this,
            caption = this.caption,
            space = function () {
                var parentGroup = this.getParentComponentGroup(),
                    width = parentGroup.getWidth(),
                    height = parentGroup.getHeight(),
                    logicalSpace = caption.getLogicalSpace(width, height);
                return logicalSpace;
            },
            captionConfig = caption.config;
        this.spaceManagerInstance.addComponent([{
            pIndex: 1,
            index: 0,
            initProp: 0.2,
            type: 'HorizontalSwimLane1',
            name: 'captionContainingRow',
            padding: function () {
                return captionConfig.margin;
            },
            // preDrawHook: hookFN,
            components: [{
                type: 'VerticalSwimLane4',
                name: 'captionContaner',
                initProp: 1,
                components: [{
                    type: 'Modules',
                    index: 0,
                    initProp: 1,
                    name: 'caption',
                    preDrawHook: captionConfig.preDrawHook,
                    ref: self,
                    // @todo: alignment = 1(center) when implemented.
                    alignment: 0,
                    // @todo this will be 'block', when block is being supported.
                    layout: 'inline',
                    dimensions: [space]
                }]
            }]
        }], 0);
    };

    CaptionImpl.prototype.setDrawingConfiguration = function (x, y, width, height, group) {
        var mes = this.measurement;
        mes.x = x;
        mes.y = y;
        mes.width = width;
        mes.height = height;

        this.parentGroup = group;

        return this;
    };

    CaptionImpl.prototype.draw = function (x, y, width, height, group) {
        var measurement = this.measurement;

        x = x === undefined ? measurement.x : x;
        y = y === undefined ? measurement.y : y;
        width = width === undefined ? measurement.width : width;
        height = height === undefined ? measurement.height : height;
        group = group === undefined ? this.parentGroup : group;

        // donot draw if height asked is 0
        if (width && height) {
            this.caption.draw(x, y, width, height, group);
        }
    };

    FusionCharts.registerComponent('main', 'Caption', CaptionImpl);
}]);

FusionCharts.register('module', ['private', 'modules.chart-config.timeseries', function () {
    var global = this,
        lib = global.hcLib,
        EMPTY_FN = function () { },
        NONE = 'none',
        isPlainObject = function (o) {
            return typeof o == 'object' && o.constructor == Object;
        };

    function recParsing (sink, source) {
        var prop;

        for (prop in source) {
            if (prop in sink) {
                if (typeof source[prop] === 'object') {
                    recParsing(sink[prop], source[prop]);
                }
            } else {
                if (isPlainObject(source[prop])) {
                    sink[prop] = lib.extend2({}, source[prop]);
                }
                else {
                    sink[prop] = source[prop];
                }

            }
        }
    }

    function convertArrayToObjectByKey (arr, key) {
        var i,
            ln = arr.length,
            obj = {};

        for (i = 0; i < ln; i++) {
            obj[arr[i][key]] = arr[i];
        }

        return obj;
    }

    function centerAlign() {
        var self = this,
            parentsArr = self.getParents(),
            canvas = parentsArr[0].cacheByName('canvasContainer'),
            // parent = parentsArr[parentsArr.length - 2],
            config = this.config;
        // wrt canvas.
        // center align.
        config.x = canvas.getX() + canvas.getWidth() / 2 - self.getWidth() / 2;
        // left align
        // config.x = canvas.getX();
        // right align...
        // config.x = (parent.getX() + parent.getWidth()) - space.width;




        // // wrt chart
        // // center align.
        // config.x =
        // // left align

        // // right align...
    }

    function ChartConfig () {
        this.config = {
            chart: {
                container: {
                    paddingX: 10,
                    paddingY: 10,
                    group: {
                        className: 'fusioncharts-root',
                        style: {
                            'font-family': 'Lucida Grande, sans-serif'
                        }
                    },
                    bound: {
                        className: 'fusioncharts-root-container',
                        style: {
                            stroke: NONE,
                            fill: NONE
                        }
                    }
                },
                axes: {
                    x: {
                        span: {
                            tick: {
                                hide: true,
                                length: 5,
                                style: {
                                    stroke: '#6e6e6e',
                                    'stroke-width': '1'
                                }
                            },
                            text: {
                                hide: false,
                                style: {
                                    'font-size': '11px',
                                    'font-weight': 'normal',
                                    fill: '#898989'
                                }
                            }
                        },
                        context: {
                            tick: {
                                hide: true,
                                length: 5,
                                style: {
                                    stroke: '#696969',
                                    'stroke-width': '1.2'
                                }
                            },
                            text: {
                                hide: false,
                                style: {
                                    'font-size': '12px',
                                    fill: '#696969'
                                }
                            }
                        },
                        major: {
                            tick: {
                                hide: false,
                                length: 5,
                                style: {
                                    stroke: '#696969',
                                    'stroke-width': '1.2'
                                }
                            },
                            text: {
                                hide: false,
                                style: {
                                    'font-size': '12px',
                                    fill: '#696969'
                                }
                            }
                        },
                        minor: {
                            tick: {
                                hide: false,
                                length: 5,
                                style: {
                                    stroke: '#6e6e6e',
                                    'stroke-width': '1'
                                }
                            },
                            text: {
                                hide: false,
                                style: {
                                    'font-size': '11px',
                                    'font-weight': 'normal',
                                    fill: '#898989'
                                }
                            }
                        },
                        margin: {
                            top: 2,
                            left: 0,
                            bottom: 0,
                            right: 0
                        }
                    },
                    y: {
                        major: {
                            tick: {
                                hide: true,
                                style: {
                                    stroke: '#707070',
                                    'stroke-width': '1'
                                }
                            },
                            text: {
                                hide: false,
                                style: {
                                    'font-size': '13px',
                                    fill: '#898989'
                                }
                            }
                        },
                        margin: {
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0
                        }
                    }
                },
                datasets: {
                    dataset: {
                        series: {
                            plot: [
                                {
                                    type: 'line',
                                    style: {
                                        stroke: function (colorPalette, index, lib) {
                                            return lib.hashify(colorPalette[index]);
                                        },
                                        'stroke-width': 2
                                    }
                                },
                                {
                                    type: 'column',
                                    style: {
                                        fill: function (colorPalette, index, lib) {
                                            return lib.hashify(colorPalette[index]);
                                        },
                                        'stroke-width': 1
                                    }
                                },
                                {
                                    type: 'area',
                                    style: {
                                        fill: function (colorPalette, index, lib) {
                                            return lib.hashify(colorPalette[index]);
                                        },
                                        'stroke-width': 2,
                                        'stroke-opacity': '0.1',
                                        'fill-opacity': '0.7'

                                    }
                                },
                                {
                                    type: 'candlestick',
                                    style: {
                                        fill: '#ff0000'
                                    }
                                }
                            ]
                        }
                    }
                },
                canvas: {
                    className: 'fusioncharts-canvas-container',
                    style: {
                        fill: '#ffffff',
                        stroke: 'none',
                        'fill-opacity': '0',
                        'border-top': '2px #b1b1b1 solid',
                        'border-right': '0px #aaaaaa solid',
                        'border-bottom': '2px #b1b1b1 solid',
                        'border-left': '0px #aaaaaa solid'
                    },
                    margin: {
                        top: 0,
                        right: 0,
                        left: 0,
                        bottom: 0
                    },
                    markers: {
                        group: {
                            className: 'fusioncharts-markers',
                            style: {
                                'font-family': 'myriad-pro, sans-serif Semibold',
                                'font-size': '14px'
                            }
                        },
                        cyclic: {
                            timeSpan: {
                                regular: {
                                    plotBand: {
                                        group: {
                                            className: 'fusioncharts-markers-cylic-timeSpan-regular-plotBand',
                                            style: {
                                                fill: function (colorPalette, index, lib) {
                                                    return lib.hashify(colorPalette[index]);
                                                },
                                                stroke: '#898989',
                                                'stroke-opacity': 0.5,
                                                'fill-opacity': 0.5
                                            }
                                        }
                                    },
                                    label: {
                                        margin: {
                                            top: 5,
                                            bottom: 0,
                                            left: 5
                                        },
                                        group: {
                                            className: 'fusioncharts-markers-cylic-timeSpan-regular-label',
                                            style: {
                                                fill: '#3c3b3b'
                                            }
                                        }
                                    }
                                },
                                alternate: {
                                    plotBand: {
                                        group: {
                                            className: 'fusioncharts-markers-cylic-timeSpan-alternate-cyclic',
                                            style: {
                                                fill: function (colorPalette, index, lib) {
                                                    return lib.hashify(colorPalette[index + 4]);
                                                },
                                                stroke: '#898989',
                                                'stroke-opacity': 0.5,
                                                'fill-opacity': 0.5
                                            }
                                        }
                                    },
                                    label: {
                                        margin: {
                                            top: 5,
                                            bottom: 0,
                                            left: 5
                                        },
                                        group: {
                                            className: 'fusioncharts-markers-cylic-timeSpan-alternate-label',
                                            style: {
                                                fill: '#3c3b3b'
                                            }
                                        }
                                    }
                                }
                            },
                            timeInstant: {
                                regular: {
                                    label: {
                                        margin: {
                                            top: 5,
                                            bottom: 0,
                                            left: 5
                                        },
                                        group: {
                                            className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-label',
                                            style: {
                                                fill: '#3c3b3b'
                                            }
                                        }
                                    },
                                    plotLine: {
                                        group: {
                                            className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-plotLine',
                                            style: {
                                                'fill-opacity': 1,
                                                'stroke': '#d83131',
                                                'stroke-dasharray': 5,
                                                'stroke-width': 2
                                            }
                                        }
                                    },
                                    labelBound: {
                                        margin: {
                                            bottom: 5,
                                            left: 0,
                                            top: 0
                                        },
                                        group: {
                                            className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-labelBound',
                                            style : {
                                                fill: '#ffffff',
                                                'stroke-width': 1.5,
                                                'stroke': '#d83131'
                                            }
                                        }
                                    },
                                    refLabel: {
                                        margin: {
                                            bottom: 5,
                                            left: 0,
                                            top: 0
                                        },
                                        group: {
                                            className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-bottomLabel',
                                            style: {
                                                fill: '#353535'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        acyclic: {
                            timeSpan: {
                                regular: {
                                    plotBand: {
                                        group: {
                                            className: 'fusioncharts-markers-acylic-timeSpan-regular-plotBand',
                                            style: {
                                                fill: '#b5c1e2',
                                                stroke: '#898989',
                                                'stroke-opacity': 0.5,
                                                'fill-opacity': 0.5
                                            }
                                        }
                                    },
                                    label: {
                                        margin: {
                                            top: 5,
                                            bottom: 0,
                                            left: 5
                                        },
                                        group: {
                                            className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-label',
                                            style: {
                                                fill: '#7f7f7f'
                                            }
                                        }
                                    }
                                }
                            },
                            timeInstant: {
                                regular: {
                                    label: {
                                        margin: {
                                            top: 5,
                                            bottom: 0,
                                            left: 5
                                        },
                                        group: {
                                            className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-label',
                                            style: {
                                                fill: '#7f7f7f'
                                            }
                                        }
                                    },
                                    plotLine: {
                                        group: {
                                            className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-plotLine',
                                            style: {
                                                'fill-opacity': 1,
                                                'stroke': '#cea310',
                                                'stroke-dasharray': 0,
                                                'stroke-width': 2
                                            }
                                        }
                                    },
                                    labelBound: {
                                        group: {
                                            className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-labelBound',
                                            style : {
                                                fill: '#cea310',
                                                'stroke-width': 0
                                            }
                                        }
                                    },
                                    refLabel: {
                                        margin: {
                                            bottom: 5,
                                            top: 0,
                                            left: 0
                                        },
                                        group: {
                                            className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-bottomLabel',
                                            style: {
                                                fill: '#cea310'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    divlines: {
                        hide: false,
                        className: 'fusioncharts-canvas-divlines',
                        style: {
                            fill: '#F3F3F3',
                            stroke: '#dbdbdb',
                            'fill-opacity': 0.5
                        }
                    },
                    aggregation: EMPTY_FN
                },
                navigator: {
                    style: {
                        fill: '#FFFFFF',
                        stroke: 'none',
                        'fill-opacity': 1,
                        'border-top': '1px #aaaaaa solid',
                        'border-right': '0px #ffffff solid',
                        'border-bottom': '0px #aaaaaa solid',
                        'border-left': '0px #ffffff solid'
                    },
                    leftButton: {
                        rect: {
                            style: {
                                fill: '#ffffff',
                                stroke: '#9e9e9e',
                                'fill-opacity': 1,
                                'border-top': '2px #aaaaaa solid',
                                'border-right': '0px #ffffff solid',
                                'border-bottom': '2px #aaaaaa solid',
                                'border-left': '0px #ffffff solid',
                                r: 1.5
                            }
                        },
                        arrow: {
                            style: {
                                stroke: '#717171'
                            }
                        }
                    },
                    rightButton: {
                        rect: {
                            style: {
                                fill: '#ffffff',
                                stroke: '#9e9e9e',
                                'fill-opacity': 1,
                                'border-top': '2px #aaaaaa solid',
                                'border-right': '0px #ffffff solid',
                                'border-bottom': '2px #aaaaaa solid',
                                'border-left': '0px #ffffff solid',
                                r: 1.5
                            }
                        },
                        arrow: {
                            style: {
                                stroke: '#717171'
                            }
                        }
                    },
                    selectionBox: {
                        style: {
                            // fill: '270-rgba(254, 254, 254, .7):30-rgba(230, 230, 230, .7):70',
                            fill: '270-rgba(254, 254, 254, .7):40-rgba(225, 225, 225, .7):60',
                            stroke: '#A9A9A9'
                        }
                    },
                    scroller: {
                        step: 0.2,
                        scrollHeight: 14,
                        // @private attributes.
                        margin: {
                            top: 2,
                            left: 2,
                            right: 2
                        },
                        style: {
                            trackerRect: {
                                fill: '#F3F6F6',
                                'stroke-width': 0
                            },
                            scrollerRect: {
                                fill: '#CDD2D2',
                                stroke: '#2b2b2a',
                                'stroke-width': 0
                            },
                            goti: {
                                fill: '#333333',
                                stroke: '#2b2b2a',
                                'stroke-width': 1
                            },
                            leftButton: {
                                fill: '#CDD2D2',
                                stroke: '#bfbdbd',
                                'stroke-width': 0
                            },
                            rightButton: {
                                fill: '#CDD2D2',
                                stroke: '#bfbdbd',
                                'stroke-width': 0
                            },
                            leftButtonArrow: {
                                fill: '#434343',
                                stroke: '#9e9e9e',
                                'stroke-width': 0
                            },
                            rightButtonArrow: {
                                fill: '#434343',
                                stroke: '#9e9e9e',
                                'stroke-width': 0
                            },
                            container: {

                            }
                        }
                    },
                    label: {
                        name: 'GMT',
                        style: {
                            'font-size': 12,
                            fill: '#C8C8C8'
                        }
                    },
                    axes: {
                        x: {
                            minor: {
                                tick: {
                                    hide: false,
                                    length: 5,
                                    style: {
                                        stroke: '#D7D7D7',
                                        'stroke-width': '1'
                                    }
                                },
                                text: {
                                    hide: false,
                                    style: {
                                        'font-weight': 'normal',
                                        'font-size': '12px',
                                        fill: '#C6C6C6'
                                    }
                                }
                            },
                            major: {
                                tick: {
                                    hide: false,
                                    length: 5,
                                    style: {
                                        stroke: '#9A9A9A',
                                        'stroke-width': '1'
                                    }
                                },
                                text: {
                                    hide: false,
                                    style: {
                                        'font-weight': 'normal',
                                        'font-size': '12px',
                                        fill: '#686868'
                                    }
                                }
                            }
                        }
                    },
                    margin: {
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0
                    }
                },
                legend: {
                    group: {
                        className: 'fusioncharts-legend',
                        style: {
                            'font-size': '14px'
                        }
                    },
                    bound: {
                        className: 'fusioncharts-legend-container',
                        style: {
                            'fill-opacity': '0',
                            'stroke-width': 0
                        }
                    },
                    tracker: {
                        className: 'fusioncharts-legend-tracker',
                        style: {
                            'fill-opacity': '0',
                            'stroke-opacity': '0',
                            cursor: 'pointer'
                        }
                    },
                    text: {
                        className: 'fusioncharts-legend-text',
                        style: {
                            fill: '#7f7f7f'
                        }
                    },
                    symbol: {
                        shapeType: 'rect',
                        width: 20,
                        height: 12,
                        borderRadius: 1
                    },
                    margin: {
                        top: 0,
                        bottom: 0,
                        right: 0,
                        left: 10
                    },
                    boxPadding: 10,
                    symbolPadding: 10,
                    itemPadding: 20,
                    preDrawHook: centerAlign,
                    layout: function (obj) {
                        return obj.block;
                    },
                    position: function (obj) {
                        return obj.bottom;
                    },
                    orientation: function (obj) {
                        return obj.horizontal;
                    },
                    alignment: function (obj) {
                        return obj.left;
                    }
                },
                crossline: {
                    className: 'fusioncharts-crossline',
                    style: {
                        'stroke': '#000000',
                        'stroke-width': 1,
                        'stroke-opacity': 0.5,
                        'stroke-dasharray': [1, 1]
                    },
                    marker: {
                        radius: 4,
                        className: 'fusioncharts-crossline-marker',
                        style: {
                            'stroke-width': 2,
                            'stroke': '#ffffff'
                        }
                    },
                    markerPlotTypes: ['line', 'area']
                },
                tooltip: {
                    separator: ': ',
                    dateFormat: '%A, %B %d, %Y',
                    container: {
                        className: 'fusioncharts-tooltip-container',
                        style: {
                            backgroundColor: 'rgba(255,255,255,1)',
                            borderColor: 'rgba(84,84,84,1)',
                            borderWidth: '1px',
                            color: 'rgba(85,85,85,1)',
                            fontFamily: 'Lucida Grande, sans-serif',
                            fontSize: '10px',
                            lineHeight: '17px',
                            padding: '6px',
                            opacity: '0.7'
                        }
                    }
                },
                caption: {
                    margin: {
                        top: 10,
                        bottom: 10,
                        left: 0,
                        right: 0
                    },
                    preDrawHook: centerAlign,
                    padding: {
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0
                    },
                    interpadding: 10,
                    group: {
                        className: 'fusioncharts-caption',
                        style: {
                            'font-weight': 'bold',
                            'fill': '#525252'
                        }
                    },
                    bound: {
                        className: 'fusioncharts-caption-container',
                        style: {
                            stroke: NONE,
                            fill: NONE
                        }
                    },
                    title: {
                        className: 'fusioncharts-caption-title',
                        style: {
                            'font-size': '14px'
                        }
                    },
                    subtitle: {
                        className: 'fusioncharts-caption-subtitle',
                        style: {
                            'font-size': '11px',
                            'fill': '#7b7b7b'
                        }
                    }
                }
            }
        };
    }

    ChartConfig.prototype.getDefaultConfig = function() {
        return this.config;
    };

    ChartConfig.prototype.parseConfig = function(userConfig) {
        var userChartConfig = userConfig.chart,
            defChartConfig = this.config.chart,
            crossLineConfig = userChartConfig.crossline || (userChartConfig.crossline = [{}]),
            userLegendConfig = userChartConfig.legend || (userChartConfig.legend = [{}]),
            userCaptionConfig = userChartConfig.caption || (userChartConfig.caption = [{}]),
            userTooltipConfig = userChartConfig.tooltip || (userChartConfig.tooltip = [{}]);

        userChartConfig.container = userChartConfig.container || {};
        recParsing(userChartConfig.container, defChartConfig.container);

        this
            .parseAxesConfig(userChartConfig.axes, defChartConfig.axes)
            .parseCanvasConfig(userChartConfig.canvas, defChartConfig.canvas)
            .parseDatasetConfig(userChartConfig.datasets, defChartConfig.datasets)
            .parseNavigatorConfig(userChartConfig.navigator, defChartConfig.navigator)
            .parseCommonConfig(userLegendConfig, defChartConfig.legend)
            .parseCommonConfig(crossLineConfig, defChartConfig.crossline)
            .parseCommonConfig(userCaptionConfig, defChartConfig.caption)
            .parseCommonConfig(userTooltipConfig, defChartConfig.tooltip);


        return userConfig;
    };

    ChartConfig.prototype.parseAxesConfig = function (userConfig, defaultConfig) {
        var i,
            l;

        for (i = 0, l = userConfig.length; i < l; i++) {
            recParsing(userConfig[i], defaultConfig);
        }

        return this;
    };

    ChartConfig.prototype.parseMarkersConfig = function (userConfig, defaultConfig) {
        var prop,
            arr,
            config,
            i,
            len;
        for (prop in userConfig) {
            arr = userConfig[prop];
            config = defaultConfig[prop];
            for (i = 0, len = arr.length; i < len; i += 1) {
                recParsing(arr[i], config);
            }
        }
        return this;
    };
    //todo: need to sanitize.
    ChartConfig.prototype.parseAdditionalAxesConfig = function (userConfig, defaultConfig) {
        var userConfAxes;

        if (!(userConfAxes = userConfig.axes)) {
            return this;
        }

        if (typeof userConfAxes === 'function') {
            userConfig.axes = userConfAxes.bind(defaultConfig.axes || {});
        } else {
            recParsing(userConfig.axes, defaultConfig.axes);
        }

        return this;
    };

    ChartConfig.prototype.parseCanvasConfig = function (userConfig, defaultConfig) {
        var i,
            l,
            canvasConfig;

        for (i = 0, l = userConfig.length; i < l; i++) {
            canvasConfig = userConfig[i];
            this.parseMarkersConfig(canvasConfig.markers, defaultConfig.markers);
            this.parseAdditionalAxesConfig(canvasConfig, defaultConfig);
            recParsing(canvasConfig, defaultConfig);
        }

        return this;
    };
    ChartConfig.prototype.parseNavigatorConfig = ChartConfig.prototype.parseCanvasConfig;

    ChartConfig.prototype.parseDatasetConfig = function(userConfig, defaultConfig) {
        var targetDataset = userConfig[0],
            dataset = targetDataset.dataset,
            i,
            l;

        for (i = 0, l = dataset.length; i < l; i++) {
            this.parseSeriesConf(dataset[i].series, defaultConfig.dataset.series);
        }

        return this;
    };

    ChartConfig.prototype.parseSeriesConf = function (userConfig, defaultConfig) {
        var i,
            l,
            plotConfigurationByType = defaultConfig.plot,
            defaultPlotConfig;

        plotConfigurationByType = convertArrayToObjectByKey(plotConfigurationByType, 'type');

        for (i = 0, l = userConfig.length; i < l; i++) {
            defaultPlotConfig = {};
            defaultPlotConfig.plot = plotConfigurationByType[userConfig[i].plot.type];
            recParsing(userConfig[i], defaultPlotConfig);
        }

        return this;
    };

    ChartConfig.prototype.parseCommonConfig = function (userConfig, defaultConfig) {
        var i,
            l;

        for (i = 0, l = userConfig.length; i < l; i++) {
            recParsing(userConfig[i], defaultConfig);
        }

        return this;
    };

    FusionCharts.registerComponent('config', 'chart-config', ChartConfig);
}]);

FusionCharts.register('module', ['private', 'modules.chart-api.timeseries', function () {
    var global = this,
        lib = global.hcLib,
        win = global.window,
        R = lib.Raphael,
        capitalizeFirst = lib.capitalizeFirst,
        shallowCopy = lib.shallowCopy,
        extend2 = lib.extend2,
        ComponentInterface = FusionCharts.getComponent('interface', 'component'),
        NavigatorImpl = FusionCharts.getComponent('main', 'navigator'),
        LegendImpl = FusionCharts.getComponent('main', 'legend'),
        CaptionImpl = FusionCharts.getComponent('main', 'caption'),
        ManagerInterface = FusionCharts.getComponent('interface', 'manager'),
        mainComp = FusionCharts.getComponent('main'),
        GenericResolver = FusionCharts.getComponent('resolvers', 'generic-resolver'),
        AxisResolver = FusionCharts.getComponent('resolvers', 'axis-resolver'),
        CanvasResolver = FusionCharts.getComponent('resolvers', 'canvasgroup-resolver'),
        DatasetResolver = FusionCharts.getComponent('resolvers', 'dataset-resolver'),
        managerfactory = FusionCharts.getComponent('managerfactory'),
        manager = FusionCharts.getComponent('manager'),
        ReactiveModel = FusionCharts.getComponent('api', 'reactive-model'),
        SpaceManager = FusionCharts.getComponent('api', 'spacemanager'),
        Container = FusionCharts.getComponent('api', 'container'),
        ChartConfig = FusionCharts.getComponent('config', 'chart-config'),
        CanvasImpl = mainComp.canvas,
        chartAPI = lib.chartAPI,
        creditLabel = false && !/fusioncharts\.com$/i.test (win.location.hostname);

    global.core.options.extensions = {};

    global.core.getGlobalConfig = function (what) {
        return global.core.options[what];
    };

    function mergeExtensionConfig (extName, localExtData) {
        var globalExtData = global.core.options.extensions[extName];

        if (!globalExtData) {
            return localExtData;
        }

        return extend2(extend2({}, globalExtData), localExtData);
    }

    function ComponentStore (defaultStub) {
        var storeById,
            storeByIndex,
            namedStoreById,
            namedStoreByIndex,
            key,
            seq;

        storeById = this.storeById = {};
        storeByIndex = this.storeByIndex = {};
        seq = this.seq = {};

        for (key in defaultStub) {
            namedStoreById = storeById[key] = {};
            namedStoreByIndex = storeByIndex[key] = {};
            seq[key] = 0;
            /*jshint loopfunc: true */
            this['get' + capitalizeFirst(key) + 'ById'] = (function (idContext) {
                return function (id) {
                    return idContext[id];
                };
            })(namedStoreById);

            this['get' + capitalizeFirst(key) + 'ByIndex'] = (function (indexContext) {
                return function (index) {
                    return indexContext[index];
                };
            })(namedStoreByIndex);

            this['getAll' + capitalizeFirst(key)] = (function (indexContext) {
                return function () {
                    return indexContext;
                };
            })(namedStoreByIndex);
            /*jshint loopfunc: false */
        }
    }

    ComponentStore.prototype.getInstanceById = function (formalName, id) {
        return this.getInstances(formalName)[id];
    };

    ComponentStore.prototype.getInstances = function (formalName) {
        return (this.storeById[formalName] || {});
    };

    ComponentStore.prototype.saveInstance = function (formalName, instance, id, index, fn) {
        var storeById = this.storeById,
            storeByIndex = this.storeByIndex,
            seq = this.seq,
            namedIdStore,
            namedIndexStore;

        namedIdStore = storeById[formalName] || (storeById[formalName] = {});
        namedIndexStore = storeByIndex[formalName] || (storeByIndex[formalName] = {});
        seq[formalName] = seq[formalName] || 0;

        if (id === undefined) {
            id = instance.uid = seq[formalName]++;
        }

        namedIdStore[id] = instance;
        namedIndexStore[index] = instance;

        fn && fn(instance, [namedIdStore, id], [namedIndexStore, index]);

        return id;
    };

    ComponentStore.prototype.getFormalName = function () {
        return Object.keys(this.composition);
    };


    function require (allDependencies) {
        return function (depDesc) {
            var depDescCopy = ([]).slice.call(depDesc, 0),
                args = [],
                prop,
                fn,
                i,
                l;

            fn = depDescCopy.splice(depDescCopy.length - 1, 1)[0];

            for (i = 0, l = depDescCopy.length; i < l; i++) {
                prop = depDescCopy[i];
                args.push(allDependencies[prop]);
            }

            return fn.apply(undefined, args);
        };
    }

    function normalizeWith (data, defaultStub) {
        var chart = data.chart,
            key,
            chartVal,
            i,
            l,
            userAxes,
            defaultAxes,
            prop;

        for (key in defaultStub) {
            if (key === 'axes') {
                // separate parsing for axes as it has weird structure
                // @todo remove the specific coupling from here
                chartVal = chart[key] = chart[key] || [{}];
                defaultAxes = defaultStub[key];
                for (i = 0, l = chartVal.length; i < l; i++) {
                    userAxes = chartVal[i];
                    for (prop in defaultAxes) {
                        if (!userAxes.hasOwnProperty(prop)) {
                            userAxes[prop] = defaultAxes[prop];
                        }
                    }
                }
            } else if (!(chart.hasOwnProperty(key) && (chart[key].length > 0 ))) {
                chart[key] = [defaultStub[key][0]];
            }
        }

        return data;
    }

    function createDataInstance (data, componentStore, stubChart) {
        var chart = data.chart,
            opChart = {},
            key;

        function cb () {
            var args = [].slice.call(arguments, 0),
                inst = args.shift(),
                prop,
                i,
                l;

            for (i = 0, l = args.length; i < l; i++) {
                if (inst instanceof GenericResolver) {
                    inst.resolveTo(args[i]);
                } else {
                    // Iterate till two levels to avoid recusion
                    for (prop in inst) {
                        inst[prop].resolveTo([args[i][1], prop]);
                    }
                }
            }
        }

        function initializeComponentClass (dataArr, cls, formalName) {
            var l = dataArr.length,
                op = [],
                controlOptions = cls[3],
                mappedDataArr = [],
                resolveIn,
                obj,
                compDefinition,
                dataElem,
                id,
                i,
                i2,
                l2,
                clsItem,
                clsDef,
                instance;

            if (!(cls instanceof Array)) {
                for (i = 0; i < l; i++) {
                    obj = {};
                    dataElem = dataArr[i];
                    id = dataElem.uid;
                    id = id === undefined ? i : id;
                    for (clsItem in cls) {
                        compDefinition = dataElem[clsItem];

                        clsDef = cls[clsItem];
                        instance = new clsDef[2](compDefinition, {type: clsItem, impl: clsDef[2], index: i});
                        obj[clsItem] = instance;
                        instance.resolveTo([obj, clsItem]);
                    }
                    componentStore.saveInstance(formalName, obj, id, i, cb);
                    op.push(obj);
                }
            } else {
                for (i = 0; i < l; i++) {
                    compDefinition = dataArr[i];
                    instance = new cls[2](compDefinition, {type: formalName, impl: cls[3]});

                    if (resolveIn = controlOptions.resolveIn) {
                        mappedDataArr = compDefinition[resolveIn];
                        for (i2 = 0, l2 = mappedDataArr.length; i2 < l2; i2++) {
                            id = mappedDataArr[i2].uid;
                            id = id === undefined ? i : id;
                            id += '';

                            instance.resolveTo([op, i2]);
                            componentStore.saveInstance(formalName, instance, id, i2, cb);
                        }
                    } else{
                        id = compDefinition.uid;
                        id = id === undefined ? i : id;
                        id += '';

                        instance.resolveTo([op, i]);
                        componentStore.saveInstance(formalName, instance, id, i, cb);
                    }
                    op.push(instance);
                }
            }

            return op;
        }

        // @todo handle when input data does not contain canvas
        for (key in chart) {
            if (!chart.hasOwnProperty(key)) { continue; }

            if (key in stubChart) {
                opChart[key] = initializeComponentClass(chart[key], stubChart[key], key);
            } else {
                opChart[key] = chart[key];
            }
        }

        return opChart;
    }

    chartAPI('timeseries', {
        standaloneInit: true,
        friendlyName: 'Time Series Chart',
        creditLabel: creditLabel,

        init: function (container, dataObj) {
            var self = this,
                height = self.origRenderHeight,
                width = self.origRenderWidth,
                defChartStub = self.getDefaultDataStub().chart,
                store = self.store = new ComponentStore(defChartStub),
                compsPerGroup = self.getPerComponentsGroup(),
                otherDependencies = self.otherDependencies = {},
                instances = self.instances = [],
                componentArr = [],
                paper = this.getPaper(container, width, height),
                nonImplInstances = [],
                hookFN = function (noReallocation) {
                    var self = this,
                        canvasConfig = self.getParents()[0].cacheByName('canvasContainer').config;
                    if (!noReallocation) {
                        self.recurse(self.getX, canvasConfig.x);
                        self.recurse(self.getWidth, canvasConfig.width);
                        self.reset();
                        self.allocate();
                    }
                },
                yAxisHook = function (noReallocation) {
                    var self = this,
                        canvasContainerConfig = self.getParents()[0].cacheByName('canvasContainer').config;
                    if (!noReallocation) {
                        self.config.y = canvasContainerConfig.y;
                        self.config.height = canvasContainerConfig.height;
                    }
                    else {
                        self.getLinkedItems('ref').setAxisPosition(self.getX() + self.getWidth(), self.getY());
                    }
                },
                canvasHook = function () {
                    var self = this,
                        parentInstance = self.getParentComponentGroup();
                    self.config.x = parentInstance.config.x;
                    self.config.y = parentInstance.config.y;
                    self.config.width = parentInstance.config.width;
                    self.config.height = parentInstance.config.height;
                },
                xAxisHook = function (noReallocation) {
                    var self = this;
                    if (!noReallocation) {
                        self.config.width = self.getParents()[0].cacheByName('canvasContainer').getWidth();
                    }
                    else {
                        // ref.setAxisLength(canvasConfig.width);
                        self.getLinkedItems('ref').setAxisPosition(self.getX(), self.getY());
                    }
                },
                dimensionFN = function (obj) {
                    return function () {
                        return obj;
                    };
                },
                xDimension = function () {
                    var parent = this.getParentComponentGroup(),
                        parentWidth = parent.getWidth(),
                        parentHeight = parent.getHeight(),
                        space = xAxis.getLogicalSpace(parentWidth, parentHeight);
                    return {
                        width: Math.min(1, parentWidth),
                        height: Math.min(space.height, parentHeight)
                    };
                },
                paddingFN = function () {
                    return {
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0
                    };
                },
                spaceManagerInstance,
                offsetX,
                offsetY,
                extensions,
                parentGroup,
                dataInstance,
                dependencies,
                canvasGroups,
                group,
                composition,
                instance,
                Constructor,
                normalizedData,
                parsedData,
                name,
                i,
                yAxis,
                xAxis,
                l;

            // Saves all the svg elements in the object
            this.svgElements = {};

            // Make a deep copy of the data passed by the user so that the user data does not get changed
            dataObj = extend2({}, dataObj);

            normalizedData = normalizeWith(dataObj, defChartStub);
            parsedData = new ChartConfig().parseConfig(normalizedData);
            this.data = dataInstance = createDataInstance(parsedData, store, defChartStub);
            GenericResolver.resolveAll(store);

            parentGroup = self.getParentContainer(parsedData.chart.container, paper);
            offsetX = parsedData.chart.container.paddingX;
            offsetY = parsedData.chart.container.paddingY;
            spaceManagerInstance = new SpaceManager({
                x: offsetX,
                y: offsetY,
                width: width - 2 * offsetX,
                height: height - 2 * offsetY
            });

            otherDependencies = {
                userData: dataObj,
                dataInstance: dataInstance,
                graphics: {
                    paper: paper,
                    container: container
                },
                chart: {
                    width: width,
                    height: height
                },
                chartInstance: this.chartInstance,
                smartLabel: this.chartInstance.jsVars.smartLabel,
                globalReactiveModel: new ReactiveModel(),
                parentGroup: parentGroup,
                spaceManagerInstance: spaceManagerInstance
            };

            canvasGroups = dataInstance.canvas;
            [].push.apply(canvasGroups, dataInstance.navigator);
            for (i = 0, l = canvasGroups.length; i < l; i++) {
                group = canvasGroups[i];
                otherDependencies.canvasData = group.context;
                otherDependencies.canvasConfig = group.getConfig();
                composition = group.getComposition();

                for (name in compsPerGroup) {
                    Constructor = compsPerGroup[name][0];
                    instance = new Constructor();
                    composition[name] = instance;
                }

                for (name in composition) {
                    instance = composition[name];
                    dependencies = shallowCopy({canvasGroupIndex: i}, composition, [instance]);
                    dependencies = shallowCopy(dependencies, otherDependencies);
                    if (instance instanceof CanvasImpl) {
                        instances.push(instance);
                    }
                    else {
                        nonImplInstances.push(instance);
                    }

                    // console.log(instance);
                    if (instance instanceof ComponentInterface ||
                        instance instanceof ManagerInterface) {
                        instance.init(require(dependencies));
                    }
                }
            }
            for (i = instances.length - 1; i >= 0; i--) {
                instances[i].setReactivity();
            }
            // Creating stub containers for the the canvas containing Row.
            for (i = 0, l = instances.length - 1; i < l; i++) {
                instance = instances[i];
                yAxis = instance.yAxis;
                xAxis = instance.xAxis;
                componentArr.push({
                    index: 0,
                    pIndex: 2,
                    type: 'HorizontalSwimLane1',
                    padding: paddingFN,
                    name: 'extension1',
                    preDrawHook: hookFN,
                    initProp: 0.175,
                    components: [{
                        type: 'VerticalSwimLane3',
                        padding: paddingFN,
                        initProp: 1,
                        index: 0,
                        pIndex: 2,
                        name: 'Extension1',
                        components: []
                    }]
                });


                componentArr.push({
                    type: 'HorizontalSwimLane1',
                    padding: dimensionFN(instance.getMargin()),
                    name: 'canvasContainingRow',
                    pIndex: 0,
                    index: 1,
                    initProp: 0.1,
                    components: [{
                        type: 'VerticalSwimLane1',
                        pIndex: 2,
                        initProp: 0.35,
                        index: 0,
                        name: 'Extension2',
                        components: []
                    },{
                        type: 'VerticalSwimLane1',
                        pIndex: 1,
                        initProp: 0.15,
                        index: 1,
                        padding: dimensionFN(yAxis.getScaleObj().getConfig('userConfig').margin),
                        name: 'yAxisContainer',
                        components: [{
                            type: 'Modules',
                            pIndex: 2,
                            name: 'yAxis',
                            preDrawHook: yAxisHook,
                            alignment: 0,
                            ref: yAxis,
                            layout: 'inline',
                            dimensions: [dimensionFN({
                                width: yAxis.getLogicalSpace().width + 20,
                                height: 1
                            })]
                        }]
                    },{
                        type: 'VerticalSwimLane1',
                        pIndex: 0,
                        initProp: 0.15,
                        index: 2,
                        name: 'canvasContainer',
                        components: [{
                            type: 'Modules',
                            pIndex: 2,
                            name: 'canvas',
                            preDrawHook: canvasHook,
                            alignment: 0,
                            ref: instance,
                            layout: 'inline',
                            dimensions: [dimensionFN({
                                width: 1,
                                height: 1
                            })]
                        }]
                    },{
                        type: 'VerticalSwimLane2',
                        pIndex: 2,
                        initProp: 0.35,
                        index: 3,
                        name: 'Extension3',
                        components: []
                    }]
                });
                // check if the xAxis visibility is true for this canvas.
                // append a xAxis group to the bottom of the canvas group.
                componentArr.push({
                    pIndex: 1,
                    index: 2,
                    initProp: 0.15,
                    type: 'HorizontalSwimLane1',
                    padding: dimensionFN(xAxis.getScaleObj().getConfig('userConfig').margin),
                    name: 'xAxisContainingRow',
                    preDrawHook: hookFN,
                    components: [{
                        type: 'VerticalSwimLane4',
                        name: 'xAxisContaner',
                        initProp: 1,
                        components: [{
                            type: 'Modules',
                            index: 0,
                            initProp: 1,
                            name: 'xAxis',
                            preDrawHook: xAxisHook,
                            ref: instance.xAxis,
                            // @todo: alignment = 1(center) when implemented.
                            alignment: 0,
                            // @todo this will be 'block', when block is being supported.
                            layout: 'inline',
                            dimensions: [xDimension]
                        }]
                    }]
                });
            }


            // Now add the navigation bar to the top or below the canvas group.
            // Add the avobe components to the container vertical swimline.
            componentArr.push({
                pIndex: 1,
                index: 3,
                initProp: 0.2,
                type: 'HorizontalSwimLane1',
                padding: dimensionFN(instances[i].getMargin()),
                name: 'navigationContainingRow',
                preDrawHook: hookFN,
                components: [{
                    type: 'VerticalSwimLane4',
                    name: 'navContaner',
                    initProp: 1,
                    components: [{
                        type: 'Modules',
                        index: 0,
                        initProp: 1,
                        name: 'navigation',
                        ref: instances[i],
                        preDrawHook: function () {
                            var self = this;
                            self.config.width = self.getParents()[0].cacheByName('canvasContainer').getWidth();
                        },
                        // @todo: alignment = 1(center) when implemented.
                        alignment: 0,
                        // @todo this will be 'block', when block is being supported.
                        layout: 'inline',
                        dimensions: [dimensionFN({
                            // @temp this is temp, as in prehook its equated to cnavas.
                            width: width * 0.3,
                            height: {
                                max: Math.min(80, height * 0.2),
                                min: Math.min(80, height * 0.2 * 0.8)
                            }
                        })]
                    }]
                }]
            });

            componentArr.push({
                index: 4,
                pIndex: 2,
                type: 'HorizontalSwimLane1',
                padding: paddingFN,
                name: 'extension4',
                preDrawHook: hookFN,
                initProp: 0.175,
                components: [{
                    type: 'VerticalSwimLane4',
                    initProp: 1,
                    index: 0,
                    pIndex: 2,
                    name: 'Extension4',
                    components: []
                }]
            });

            // window.spaceManagerInstance = spaceManagerInstance;

            spaceManagerInstance.addComponent(componentArr);

            for (i = 0, l = instances.length - 1; i < l; i++) {
                instances[i].manageSpace && instances[i].manageSpace();
            }

            extensions = self.addExtensions(dataObj.extensions || {}, otherDependencies);
            spaceManagerInstance.allocate();
            spaceManagerInstance.setDrawingConfiguration(parentGroup, paper);

            for (i = 0, l = instances.length; i < l; i++) {
                instances[i].draw();
            }

            this.drawExtensions(extensions);
        },

        addExtensions: function (data, dependencies) {
            var Extensions = FusionCharts.getComponent('extensions'),
                arr = [],
                prop,
                localExtData,
                instance,
                mergedData;

            for (prop in Extensions) {
                localExtData = data[prop] || {};
                mergedData = dependencies.extData = mergeExtensionConfig(prop, localExtData);
                if (mergedData.disabled !== true) {
                    instance = new Extensions[prop]();
                    instance.init(require(dependencies));
                    instance.placeInCanvas();
                    arr.push(instance);
                }
            }

            return arr;
        },

        drawExtensions: function (arr) {
            var i,
                len;
            for (i = 0, len = arr.length; i < len; i += 1) {
                arr[i].draw();
            }
        },

        getParentContainer: function (config, paper) {
            var svgElems = this.svgElements,
                g,
                cls,
                body;

            // If the group was already created, create no more, return existing
            if (svgElems.group) {
                return svgElems.group;
            }

            paper.cssAddRule('.' + (cls = config.group.className), config.group.style);
            g = paper.group().attr('class', config.group.className);
            // Create a container rect with border
            body = new Container(config.bound, {paper: paper})
                .drawSelf(0, 0, this.origRenderWidth, this.origRenderHeight, g);

            return svgElems.group = g;
        },

        getDefaultDataStub: function () {
            return {
                chart: {
                    axes: {
                        x: [{ },  'x', AxisResolver],
                        y: [{ },  'y', AxisResolver]
                    },
                    datasets: [{
                        category: {},
                        dataset : {}
                    }, 'dataset', DatasetResolver, { resolveIn: 'dataset' }],
                    canvas: [{
                        axes: function (store) {
                            return store.getAxesByIndex(0);
                        },
                        dataset: function (store) {
                            return store.getDatasetsByIndex(0);
                        }
                    }, 'canvas', CanvasResolver, CanvasImpl],
                    navigator: [{
                        showAxes: {
                            y: false
                        },
                        axes: function () {
                            var inst;
                            return {
                                x: ((inst = new mainComp.axis(this.x))
                                    .setConfig('scale', 'timescale')
                                    .getScaleObj().setConfig('interval', 'timeintervals')
                                    .setConfig('groupClassName', 'navigator-xAxis'), inst),

                                y: ((inst = new mainComp.axis(this.y))
                                    .getScaleObj().setConfig('vertical', true)
                                    .setConfig('groupClassName', 'navigator-yAxis'), inst)
                            };
                        },
                        dataset: function (store) {
                            return store.getAllDatasets();
                        }
                    }, 'navigator', CanvasResolver, NavigatorImpl]
                }
            };
        },

        getPerComponentsGroup: function () {
            return {
                'PlotManager': [managerfactory.plotmanagerfactory],
                'MarkerManager': [manager.markermanager],
                'reactiveModel': [ReactiveModel],
                'LegendImpl': [LegendImpl],
                'CaptionImpl': [CaptionImpl]
            };
        },

        getCanvasInstances: function () {
            return this.instances;
        },

        getComponentStore: function () {
            return this.store;
        },

        feedData: function () {
            /* jshint ignore: start */
            var store = this.store,
                navImpl = store.getNavigatorByIndex(0),
                compositions = navImpl.getComposition(),
                ds = compositions.dataset[0],
                months = ['Mar','Apr','May','Jun','Jul','Aug','Sep','Oct', 'Nov','Dec'],
                i = 0,
                year = 2014;

            function callback (min, max) {
                var oldMin = min[0],
                    newMin = min[1],
                    oldMax = max[0],
                    newMax = max[1],
                    d = oldMax - oldMin;

                // return [newMax - d, newMax];
                // return [oldMin, oldMax];
                return [newMin, newMax]
            }

            id = setInterval(function () {
                var a, b, c;

                console.log('updating with', a = Math.random() * 20, b = Math.random() * 20, c = Math.random() * 20);

                if (i === months.length) {
                    i = 0;
                    year++;
                }
                ds.addUnitData({
                    x: '1-' + months[i++] +'-' + year,
                    y: [a, b, c]
                });

                compositions.impl.update(callback);
            }, 300);

            /* jshint ignore: end */
        },

        getPaper: function (container, width, height) {
            return new R(container, width, height);
        },

        draw: function (instance) {
            instance.draw();
        }
    }, chartAPI.base);


}]);



if (windowExists) {
    _window.FusionCharts = FusionCharts;
}
return FusionCharts;
}));
